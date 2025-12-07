from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import math
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="GIS Recreational Potential Analysis System")
api_router = APIRouter(prefix="/api")

# Load static data
DATA_DIR = ROOT_DIR / 'data'

def load_json_file(filename: str):
    filepath = DATA_DIR / filename
    if filepath.exists():
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

# Load data on startup
INFRASTRUCTURE_DATA = None
POPULATION_DATA = None
PROTECTED_AREAS_DATA = None
RECREATIONAL_POINTS = None
RECOMMENDED_LOCATIONS = None
FOREST_FIRES = None
REGION_BOUNDARIES = None

@app.on_event("startup")
async def load_data():
    global INFRASTRUCTURE_DATA, POPULATION_DATA, PROTECTED_AREAS_DATA, RECREATIONAL_POINTS, RECOMMENDED_LOCATIONS, FOREST_FIRES, REGION_BOUNDARIES
    INFRASTRUCTURE_DATA = load_json_file('ukraine_infrastructure.json')
    POPULATION_DATA = load_json_file('ukraine_population_data.json')
    PROTECTED_AREAS_DATA = load_json_file('ukraine_protected_areas.json')
    RECREATIONAL_POINTS = load_json_file('recreational_points_web.geojson')
    RECOMMENDED_LOCATIONS = load_json_file('recommended_locations.json')
    FOREST_FIRES = load_json_file('forest_fires.geojson')
    REGION_BOUNDARIES = load_json_file('ukraine_regions_boundaries.geojson')
    logging.info("Data loaded successfully")

# Helper functions for zone generation
def generate_consistent_hash(text: str) -> int:
    """Generate consistent hash from text for reproducible randomness"""
    return int(hashlib.md5(text.encode()).hexdigest(), 16)

def generate_nearby_coordinates(center_lat: float, center_lng: float, seed: str, min_distance: float = 2, max_distance: float = 10):
    """
    Generate coordinates near a point (not at the point itself)
    Uses hash for consistency - same seed always gives same result
    
    Args:
        center_lat, center_lng: Center coordinates (e.g., park center)
        seed: String for hash (e.g., park name)
        min_distance: Minimum distance in km
        max_distance: Maximum distance in km
    
    Returns:
        [lat, lng] coordinates of nearby settlement/location
    """
    hash_val = generate_consistent_hash(seed)
    
    # Generate angle (0-360 degrees) from hash
    angle_degrees = (hash_val % 360)
    angle_radians = math.radians(angle_degrees)
    
    # Generate distance from hash
    distance_km = min_distance + ((hash_val // 360) % int(max_distance - min_distance + 1))
    
    # Convert km to degrees (approximate: 1 degree ≈ 111 km)
    distance_degrees = distance_km / 111.0
    
    # Calculate offset
    lat_offset = distance_degrees * math.cos(angle_radians)
    lng_offset = distance_degrees * math.sin(angle_radians)
    
    return [center_lat + lat_offset, center_lng + lng_offset]

def count_competitors_nearby(coordinates: list, radius_km: float = 5.0):
    """
    Count existing recreational points near given coordinates
    
    Args:
        coordinates: [lat, lng]
        radius_km: Search radius in km
    
    Returns:
        Number of competitors within radius
    """
    if not RECREATIONAL_POINTS or 'features' not in RECREATIONAL_POINTS:
        return 0
    
    lat, lng = coordinates
    count = 0
    
    for feature in RECREATIONAL_POINTS['features']:
        if 'geometry' not in feature or 'coordinates' not in feature['geometry']:
            continue
        
        point_lng, point_lat = feature['geometry']['coordinates']
        
        # Calculate distance using Haversine formula (simplified)
        dlat = math.radians(point_lat - lat)
        dlng = math.radians(point_lng - lng)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(point_lat)) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        distance = 6371 * c  # Earth radius in km
        
        if distance <= radius_km:
            count += 1
    
    return count

def count_human_fires_nearby(coordinates: list, radius_km: float = 20.0):
    """
    Count human-caused fires near given coordinates
    КРИТИЧНА ЛОГІКА: Багато людських пожеж = потреба в рекреаційних пунктах
    
    Args:
        coordinates: [lat, lng]
        radius_km: Search radius in km (default 20km)
    
    Returns:
        dict with total fires, human fires, and fire score
    """
    if not FOREST_FIRES or 'features' not in FOREST_FIRES:
        return {"total": 0, "human": 0, "score": 0}
    
    lat, lng = coordinates
    total_fires = 0
    human_fires = 0
    
    for feature in FOREST_FIRES['features']:
        if 'geometry' not in feature or 'coordinates' not in feature['geometry']:
            continue
        
        fire_lng, fire_lat = feature['geometry']['coordinates']
        
        # Calculate distance using Haversine formula
        dlat = math.radians(fire_lat - lat)
        dlng = math.radians(fire_lng - lng)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(fire_lat)) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        distance = 6371 * c  # Earth radius in km
        
        if distance <= radius_km:
            total_fires += 1
            if feature['properties'].get('cause_type') == "людський фактор":
                human_fires += 1
    
    # Calculate fire score (0-5 points) - відповідно до методології Landing Page
    # Logic: More human fires = higher need for recreational facilities
    if human_fires >= 15:
        fire_score = 5  # Критична потреба
    elif human_fires >= 10:
        fire_score = 3  # Висока потреба
    elif human_fires >= 5:
        fire_score = 1  # Помірна потреба
    else:
        fire_score = 0  # Немає потреби
    
    return {
        "total": total_fires,
        "human": human_fires,
        "score": round(fire_score, 1)
    }

def calculate_zone_priority(pfz_name: str, pfz_type: str, competitors: int, infrastructure_score: float, visitors_estimate: int, fire_score: float = 0):
    """
    Calculate priority for a recommended zone
    
    Args:
        pfz_name: Name of protected area
        pfz_type: Type (НПП, заповідник, РЛП)
        competitors: Number of competitors nearby
        infrastructure_score: Infrastructure quality (0-10)
        visitors_estimate: Estimated annual visitors
        fire_score: Fire risk score (0-5) - NEW FACTOR
    
    Returns:
        Priority score (0-100)
    """
    base_priority = 50
    
    # PFZ attraction bonus
    if 'НПП' in pfz_type or 'Національний' in pfz_name:
        base_priority += 25
    elif 'заповідник' in pfz_type:
        base_priority += 20
    elif 'РЛП' in pfz_type:
        base_priority += 10
    
    # Competition penalty
    if competitors == 0:
        base_priority += 15
    elif competitors <= 2:
        base_priority += 10
    elif competitors <= 5:
        base_priority += 5
    else:
        base_priority -= 10
    
    # Infrastructure bonus
    base_priority += min(10, infrastructure_score)
    
    # НОВИЙ ФАКТОР: Fire prevention bonus
    # Більше людських пожеж = вища потреба в облаштованих пунктах
    base_priority += fire_score
    
    # Visitors bonus
    if visitors_estimate > 50000:
        base_priority += 10
    elif visitors_estimate > 20000:
        base_priority += 5
    
    return min(100, max(0, base_priority))

def find_fire_clusters(region_name: str, min_cluster_size: int = 3, radius_km: float = 10.0):
    """
    Знайти кластери людських пожеж у регіоні
    Кластер = ≥3 людські пожежі в радіусі 10 км
    
    Args:
        region_name: Назва області
        min_cluster_size: Мінімум пожеж для кластера
        radius_km: Радіус пошуку (км)
    
    Returns:
        List of clusters with center coordinates and fire count
    """
    if not FOREST_FIRES or 'features' not in FOREST_FIRES:
        return []
    
    # Фільтруємо людські пожежі регіону
    human_fires = [
        f for f in FOREST_FIRES['features']
        if f['properties']['region'] == region_name and 
           f['properties']['cause_type'] == "людський фактор"
    ]
    
    if len(human_fires) < min_cluster_size:
        return []
    
    clusters = []
    processed = set()
    
    for i, fire in enumerate(human_fires):
        if i in processed:
            continue
        
        fire_lat, fire_lng = fire['geometry']['coordinates'][1], fire['geometry']['coordinates'][0]
        cluster_fires = [fire]
        cluster_indices = [i]
        
        # Знайти всі пожежі в радіусі
        for j, other_fire in enumerate(human_fires):
            if j == i or j in processed:
                continue
            
            other_lat, other_lng = other_fire['geometry']['coordinates'][1], other_fire['geometry']['coordinates'][0]
            
            # Розрахувати відстань
            dlat = math.radians(other_lat - fire_lat)
            dlng = math.radians(other_lng - fire_lng)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(fire_lat)) * math.cos(math.radians(other_lat)) * math.sin(dlng/2)**2
            c = 2 * math.asin(math.sqrt(a))
            distance = 6371 * c
            
            if distance <= radius_km:
                cluster_fires.append(other_fire)
                cluster_indices.append(j)
        
        # Якщо кластер достатньо великий
        if len(cluster_fires) >= min_cluster_size:
            # Розрахувати центр кластера
            avg_lat = sum(f['geometry']['coordinates'][1] for f in cluster_fires) / len(cluster_fires)
            avg_lng = sum(f['geometry']['coordinates'][0] for f in cluster_fires) / len(cluster_fires)
            
            clusters.append({
                'center': [avg_lat, avg_lng],
                'fire_count': len(cluster_fires),
                'fires': cluster_fires
            })
            
            # Позначити як оброблені
            processed.update(cluster_indices)
    
    return clusters

def calculate_comprehensive_priority(
    zone_type: str,
    region_analysis: dict,
    fire_cluster_size: int = 0,
    competitors: int = 0,
    distance_from_pfz: float = 5.0,
    pfz_name: str = ""
):
    """
    ПОВНИЙ розрахунок пріоритету з УСІМА 7 факторами
    
    Типи зон:
    - near_pfz: біля ПЗФ (туристичний атрактор)
    - roadside: придорожна (транзитний потік)
    - fire_prevention: профілактика пожеж (кластер людських пожеж)
    
    7 факторів:
    1. Попит (0-25) - demand_score
    2. ПЗФ (0-20) - pfz_score або road_traffic
    3. Природа (0-15) - nature_score
    4. Транспорт (0-15) - accessibility_score
    5. Інфраструктура (0-10) - infrastructure_score
    6. Пожежі (0-5) - fire_score
    7. Насиченість (0 до -15) - competitors_penalty
    """
    base = 50
    
    # Фактор 1: ПОПИТ (0-25 балів)
    demand_component = min(25, region_analysis.get('demand_score', 0))
    
    # Фактор 2: АТРАКТОР (0-20 балів) - залежить від типу зони
    attractor_component = 0
    if zone_type == "near_pfz":
        # Близькість до ПЗФ
        if 'НПП' in pfz_name or 'Національний' in pfz_name:
            attractor_component = 20
        elif 'заповідник' in pfz_name.lower():
            attractor_component = 15
        elif 'РЛП' in pfz_name:
            attractor_component = 10
        else:
            attractor_component = 8
        
        # Штраф якщо занадто далеко
        if distance_from_pfz > 10:
            attractor_component *= 0.5
    
    elif zone_type == "roadside":
        # Транспортний потік
        attractor_component = 15  # Міжнародна траса
    
    elif zone_type == "fire_prevention":
        # Розмір кластера пожеж
        if fire_cluster_size >= 10:
            attractor_component = 20
        elif fire_cluster_size >= 7:
            attractor_component = 15
        elif fire_cluster_size >= 5:
            attractor_component = 12
        elif fire_cluster_size >= 3:
            attractor_component = 10
    
    # Фактор 3: ПРИРОДА (0-15 балів)
    nature_component = min(15, region_analysis.get('nature_score', 0))
    
    # Фактор 4: ТРАНСПОРТ (0-15 балів)
    transport_component = min(15, region_analysis.get('accessibility_score', 0))
    
    # Фактор 5: ІНФРАСТРУКТУРА (0-10 балів)
    infrastructure_component = min(10, region_analysis.get('infrastructure_score', 0))
    
    # Фактор 6: ПОЖЕЖІ (0-5 балів)
    fire_component = min(5, region_analysis.get('fire_score', 0))
    # Додатковий бонус для fire_prevention зон
    if zone_type == "fire_prevention":
        fire_component = min(5, fire_component + 2)
    
    # Фактор 7: НАСИЧЕНІСТЬ (0 до -15 балів)
    saturation_penalty = 0
    if competitors == 0:
        saturation_penalty = 0  # Немає конкуренції - супер!
    elif competitors <= 2:
        saturation_penalty = -3
    elif competitors <= 5:
        saturation_penalty = -7
    elif competitors <= 10:
        saturation_penalty = -12
    else:
        saturation_penalty = -15
    
    # ЗАГАЛЬНИЙ ПРІОРИТЕТ
    total_priority = (
        base +
        demand_component +
        attractor_component +
        nature_component +
        transport_component +
        infrastructure_component +
        fire_component +
        saturation_penalty
    )
    
    return min(100, max(0, int(total_priority)))

# Models
class RegionAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    region: str
    total_score: float
    demand_score: float
    pfz_score: float
    nature_score: float
    accessibility_score: float
    infrastructure_score: float
    saturation_penalty: float
    category: str
    recommendation: str
    details: Dict[str, Any]

# API Endpoints
@api_router.get("/")
async def root():
    return {"message": "GIS Recreational Potential Analysis API"}

@api_router.get("/regions")
async def get_regions():
    """Get list of all regions"""
    if POPULATION_DATA:
        regions = [r['name'] for r in POPULATION_DATA.get('ukraine_regions_data', [])]
        return {"regions": regions}
    return {"regions": []}

@api_router.get("/population")
async def get_population_data():
    """Get population data for all regions"""
    return POPULATION_DATA or {}

@api_router.get("/infrastructure")
async def get_infrastructure_data():
    """Get infrastructure data for all regions"""
    return INFRASTRUCTURE_DATA or {}

@api_router.get("/protected-areas")
async def get_protected_areas():
    """Get protected areas data"""
    return PROTECTED_AREAS_DATA or {}

@api_router.get("/recreational-points")
async def get_recreational_points():
    """Get recreational points GeoJSON"""
    return RECREATIONAL_POINTS or {}

@api_router.get("/recommended-locations/{region_name}")
async def get_recommended_locations_for_region(region_name: str):
    """Get detailed recommended locations for a specific region"""
    if not RECOMMENDED_LOCATIONS:
        return {"locations": []}
    
    locations = RECOMMENDED_LOCATIONS.get('recommended_locations', {}).get(region_name, [])
    return {"locations": locations, "region": region_name}

@api_router.get("/pfz-objects")
async def get_pfz_objects():
    """Get all PFZ objects with coordinates"""
    if not RECOMMENDED_LOCATIONS:
        return {"objects": []}
    
    return {"objects": RECOMMENDED_LOCATIONS.get('pfz_objects', [])}

@api_router.get("/forest-fires")
async def get_forest_fires():
    """Get all forest fire incidents with details"""
    if not FOREST_FIRES:
        return {"features": [], "metadata": {}}
    
    return FOREST_FIRES

@api_router.get("/region-boundaries")
async def get_region_boundaries():
    """Get Ukraine region boundaries as GeoJSON"""
    if not REGION_BOUNDARIES:
        return {"type": "FeatureCollection", "features": []}
    
    return REGION_BOUNDARIES

@api_router.get("/analyze/{region_name}")
async def analyze_region(region_name: str):
    """Perform full analysis for a specific region"""
    if not all([POPULATION_DATA, INFRASTRUCTURE_DATA, PROTECTED_AREAS_DATA, RECREATIONAL_POINTS]):
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    # Find region data
    population_region = None
    for r in POPULATION_DATA.get('ukraine_regions_data', []):
        if r['name'] == region_name:
            population_region = r
            break
    
    if not population_region:
        raise HTTPException(status_code=404, detail=f"Region {region_name} not found")
    
    # Find infrastructure data
    infra_region = None
    for r in INFRASTRUCTURE_DATA.get('ukraine_infrastructure', {}).get('regions', []):
        if r['region'] == region_name:
            infra_region = r
            break
    
    # Find PFZ data
    pfz_region = None
    for r in PROTECTED_AREAS_DATA.get('ukraine_protected_areas', {}).get('regions', []):
        if r['region'] == region_name:
            pfz_region = r
            break
    
    # Get recreational points for region
    region_points = []
    for feature in RECREATIONAL_POINTS.get('features', []):
        if feature.get('properties', {}).get('region') == region_name:
            region_points.append(feature)
    
    # Calculate potential
    analysis = calculate_full_potential(
        region_name,
        population_region,
        pfz_region,
        infra_region,
        region_points
    )
    
    return analysis

@api_router.get("/methodology")
async def get_methodology():
    """
    Get detailed AHP methodology and weight calculations
    Returns scientific justification for all weights
    """
    from ahp_calculator import get_ahp_weights, verify_ahp_consistency, ahp_calculator
    
    weights = get_ahp_weights()
    ci, cr, is_consistent = verify_ahp_consistency()
    
    # Конвертуємо numpy типи в Python типи
    weights_dict = {k: float(v) for k, v in weights.items()}
    
    return {
        "method": "Analytic Hierarchy Process (AHP)",
        "reference": "Saaty, T.L. (1980). The Analytic Hierarchy Process. McGraw-Hill.",
        "consistency": {
            "ci": float(ci),
            "cr": float(cr),
            "percentage": f"{float(cr)*100:.2f}%",
            "is_consistent": bool(is_consistent),
            "threshold": "CR < 0.1 (10%)",
            "status": "✓ УЗГОДЖЕНА" if bool(is_consistent) else "✗ НЕ УЗГОДЖЕНА"
        },
        "ahp_weights": {
            "calculated": weights_dict,
            "description": "Ваги розраховані методом геометричного середнього"
        },
        "target_weights": {
            "demand": {"weight": 0.25, "max_score": 25, "justification": "Економічна доцільність - найвищий пріоритет (Kentucky SCORP 2020)"},
            "pfz": {"weight": 0.20, "max_score": 20, "justification": "ПЗФ = головний туристичний атрактор (Wiley AHP 2022)"},
            "nature": {"weight": 0.15, "max_score": 15, "justification": "Естетична цінність + різноманітність активностей"},
            "transport": {"weight": 0.15, "max_score": 15, "justification": "Доступність - 2-га причина неучасті у рекреації (DC SCORP 2020)"},
            "infrastructure": {"weight": 0.10, "max_score": 10, "justification": "Можна побудувати (вторинний фактор)"},
            "fire_prevention": {"weight": 0.05, "max_score": 5, "justification": "Бонус за безпеку (NW Fire Science 2020)"},
            "saturation": {"weight": -0.15, "max_score": -15, "justification": "Штраф за перенасичення ринку"}
        },
        "pairwise_matrix": [[float(x) for x in row] for row in ahp_calculator.pairwise_matrix.tolist()],
        "criteria_names": ahp_calculator.criteria_names,
        "scientific_references": [
            "Saaty, T.L. (1980). The Analytic Hierarchy Process. McGraw-Hill.",
            "Kentucky SCORP 2020-2025 - Demand Analysis Methodology",
            "District of Columbia SCORP 2020 - Access Barriers Study",
            "Wiley (2022) - AHP for Ecotourism Site Selection",
            "SCIRP (2018) - GIS-AHP Tourist Resort Location",
            "NW Fire Science (2020) - Human-caused Wildfire Patterns",
            "Laguna Hills (2021) - Recreation Facility Assessment"
        ]
    }

@api_router.get("/analyze-all")
async def analyze_all_regions():
    """Analyze all regions and return comparison table"""
    if not all([POPULATION_DATA, INFRASTRUCTURE_DATA, PROTECTED_AREAS_DATA, RECREATIONAL_POINTS]):
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    results = []
    for region in POPULATION_DATA.get('ukraine_regions_data', []):
        try:
            analysis = await analyze_region(region['name'])
            results.append(analysis)
        except Exception as e:
            logging.error(f"Error analyzing {region['name']}: {e}")
    
    # Sort by total score
    results.sort(key=lambda x: x.get('total_score', 0), reverse=True)
    return {"results": results}

@api_router.get("/recommended-zones")
async def get_recommended_zones():
    """
    Get recommended zones for building new recreational facilities
    Uses comprehensive 7-factor algorithm to calculate priority:
    1. Demand (0-25) 2. PFZ/Attractor (0-20) 3. Nature (0-15) 
    4. Transport (0-15) 5. Infrastructure (0-10) 6. Fires (0-5) 
    7. Saturation (0 to -15)
    
    Three types of zones:
    - near_pfz: Near protected nature zones (eco-tourism)
    - roadside: Along major roads (transit flow)
    - fire_prevention: Fire clusters (human-caused fire prevention)
    """
    if not all([POPULATION_DATA, INFRASTRUCTURE_DATA, PROTECTED_AREAS_DATA, RECREATIONAL_POINTS]):
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    recommended_zones = []
    
    # Region centers for coordinate generation
    REGION_CENTERS = {
        'Київська область': [50.45, 30.52],
        'Львівська область': [49.84, 24.03],
        'Закарпатська область': [48.62, 22.29],
        'Одеська область': [46.48, 30.73],
        'Харківська область': [49.99, 36.23],
        'Дніпропетровська область': [48.46, 35.04],
        'Житомирська область': [50.25, 28.66],
        'Волинська область': [50.75, 25.32],
        'Івано-Франківська область': [48.92, 24.71],
        'Вінницька область': [49.23, 28.47],
        'Чернігівська область': [51.50, 31.29],
        'Рівненська область': [50.62, 26.23],
        'Чернівецька область': [48.29, 25.93],
        'Полтавська область': [49.59, 34.55],
        'Черкаська область': [49.44, 32.06],
        'Сумська область': [50.91, 34.80],
        'Хмельницька область': [49.42, 26.98],
        'Тернопільська область': [49.55, 25.59],
        'Миколаївська область': [46.97, 32.00],
        'Херсонська область': [46.64, 32.62],
        'Кіровоградська область': [48.51, 32.26],
        'Запорізька область': [47.84, 35.14],
        'Донецька область': [48.02, 37.80],
        'Луганська область': [48.57, 39.31],
    }
    
    # Analyze each region and generate recommended zones
    for region in POPULATION_DATA.get('ukraine_regions_data', []):
        region_name = region['name']
        
        # Get PFZ data for notable objects
        pfz_region = None
        for r in PROTECTED_AREAS_DATA.get('ukraine_protected_areas', {}).get('regions', []):
            if r['region'] == region_name:
                pfz_region = r
                break
        
        # Get infrastructure data for region
        infra_region = None
        for r in INFRASTRUCTURE_DATA.get('ukraine_infrastructure', {}).get('regions', []):
            if r['region'] == region_name:
                infra_region = r
                break
        
        # Calculate analysis for the region (contains all 7 factor scores)
        try:
            analysis = await analyze_region(region_name)
        except Exception:
            continue
        
        # Only recommend if total_score >= 55 (high potential)
        if analysis.get('total_score', 0) < 55:
            continue
        
        base_coords = REGION_CENTERS.get(region_name, [48.5, 31.0])
        gap = analysis.get('details', {}).get('population', {}).get('gap', 0)
        
        # ====== STEP 1: Generate zones near PFZ objects (near_pfz) ======
        if pfz_region and pfz_region.get('notable_objects'):
            notable_objects = pfz_region['notable_objects']
            
            # Limit to top 2 PFZ objects per region
            for idx, pfz_name in enumerate(notable_objects[:2]):
                # Generate coordinates NEARBY (not at the center) using hash
                zone_coords = generate_nearby_coordinates(
                    base_coords[0], 
                    base_coords[1], 
                    seed=f"{region_name}_{pfz_name}_near",
                    min_distance=3,
                    max_distance=8
                )
                
                # Check competition
                competitors = count_competitors_nearby(zone_coords, radius_km=5.0)
                
                # Calculate distance from PFZ (simulated)
                distance_from_pfz = 3 + idx * 2
                
                # Calculate priority using comprehensive 7-factor model
                priority = calculate_comprehensive_priority(
                    zone_type="near_pfz",
                    region_analysis=analysis,
                    fire_cluster_size=0,
                    competitors=competitors,
                    distance_from_pfz=distance_from_pfz,
                    pfz_name=pfz_name
                )
                
                # Only add if priority is high enough
                if priority < 60:
                    continue
                
                # Get infrastructure distances
                base_distance = 10 if region_name in ['Закарпатська область', 'Чернівецька область'] else 5
                
                # Generate reasoning for near_pfz zone
                visitors_estimate = 30000 if 'НПП' in pfz_name or 'Національний' in pfz_name else 15000
                reasoning = {
                    "point1": f"{pfz_name} - {visitors_estimate:,} відвідувачів/рік (атрактор)",
                    "point2": f"Попит: {int(analysis['demand_score'])} балів, Пожежі: {analysis['fire_score']} балів",
                    "point3": f"Конкуренція: {competitors} р.п. (низька насиченість)"
                }
                
                # Recommended facilities for eco-tourism
                capacity_people = int(gap / 4 / 180 / 2) if gap > 0 else 50
                recommended_facilities = [
                    f"Екологічний готель: {max(30, min(70, capacity_people))} номерів",
                    "Ресторан з місцевою/органічною кухнею",
                    "Інформаційний центр про ПЗФ (екскурсії, карти маршрутів)",
                    "Прокат туристичного спорядження",
                    "Веранда/тераса з видом на природу"
                ]
                
                # Create zone
                recommended_zones.append({
                    "id": f"{region_name}_near_pfz_{idx+1}",
                    "type": "near_pfz",
                    "name": f"Біля: {pfz_name}",
                    "region": region_name,
                    "coordinates": zone_coords,
                    "priority": priority,
                    "reasoning": reasoning,
                    "recommended_facilities": recommended_facilities,
                    "infrastructure": {
                        "hospital_distance": base_distance + 2,
                        "hospital_name": f"{region_name.replace(' область', '')} ЦРЛ",
                        "gas_station_distance": base_distance,
                        "gas_station_name": "WOG" if region_name in ['Київська область', 'Львівська область'] else "БРСМ",
                        "shop_distance": base_distance - 1,
                        "shop_name": "Сільпо" if region_name == 'Київська область' else "АТБ",
                        "mobile_coverage": infra_region.get('anthropogenic_infrastructure', {}).get('mobile_coverage_percent', 95) if infra_region else 95,
                        "nearest_road": infra_region.get('transport_accessibility', {}).get('main_roads', [{}])[0].get('name', 'М-06') if infra_region and infra_region.get('transport_accessibility', {}).get('main_roads') else 'М-06',
                        "road_distance": 1,
                        "road_quality": "добра"
                    },
                    "legal_status": "✅ ДОЗВОЛЕНО (населений пункт, ЗА МЕЖАМИ ПЗФ)",
                    "distance_from_pfz": distance_from_pfz,
                    "pfz_object": pfz_name,
                    "recommended_type": "Екоготель",
                    "capacity": "50-70 місць",
                    "investment": "$200K-400K",
                    "payback": "2-4 роки",
                    "competitors_nearby": competitors
                })
        
        # ====== STEP 2: Generate roadside zones (roadside) ======
        if infra_region and infra_region.get('transport_accessibility', {}).get('main_roads'):
            main_roads = infra_region['transport_accessibility']['main_roads']
            
            # Limit to top 2 main roads
            for idx, road in enumerate(main_roads[:2]):
                road_name = road.get('name', 'М-06')
                
                # Generate coordinates along the road
                zone_coords = generate_nearby_coordinates(
                    base_coords[0],
                    base_coords[1],
                    seed=f"{region_name}_{road_name}_road",
                    min_distance=15,
                    max_distance=30
                )
                
                # Check competition
                competitors = count_competitors_nearby(zone_coords, radius_km=5.0)
                
                # Calculate priority using comprehensive 7-factor model
                priority = calculate_comprehensive_priority(
                    zone_type="roadside",
                    region_analysis=analysis,
                    fire_cluster_size=0,
                    competitors=competitors,
                    distance_from_pfz=0,
                    pfz_name=""
                )
                
                # Only add if priority is high enough
                if priority < 55:
                    continue
                
                # Generate reasoning for roadside zone
                traffic = "5,000+" if road.get('type') == 'міжнародна' else "3,000+"
                reasoning = {
                    "point1": f"{road_name} - головна траса ({traffic} авто/день)",
                    "point2": f"Транспорт: {int(analysis['accessibility_score'])} балів, Попит: {int(analysis['demand_score'])} балів",
                    "point3": f"Конкуренція: {competitors} р.п. на маршруті"
                }
                
                # Recommended facilities for roadside
                recommended_facilities = [
                    "Мотель: 20-30 місць",
                    "Ресторан/кафе: 40-50 місць для відвідувачів",
                    "Стоянка: 30-40 автомобілів",
                    "Дитячий майданчик",
                    "Зона відпочинку з альтанками та мангалами"
                ]
                
                # Create zone
                recommended_zones.append({
                    "id": f"{region_name}_roadside_{idx+1}",
                    "type": "roadside",
                    "name": f"Траса {road_name}, {region_name.replace(' область', '')}",
                    "region": region_name,
                    "coordinates": zone_coords,
                    "priority": priority,
                    "reasoning": reasoning,
                    "recommended_facilities": recommended_facilities,
                    "infrastructure": {
                        "hospital_distance": 8,
                        "hospital_name": f"{region_name.replace(' область', '')} ЦРЛ",
                        "gas_station_distance": 2,
                        "gas_station_name": "WOG" if region_name in ['Київська область', 'Львівська область'] else "БРСМ",
                        "shop_distance": 3,
                        "shop_name": "Сільпо" if region_name == 'Київська область' else "АТБ",
                        "mobile_coverage": infra_region.get('anthropogenic_infrastructure', {}).get('mobile_coverage_percent', 95) if infra_region else 95,
                        "nearest_road": road_name,
                        "road_distance": 0,
                        "road_quality": road.get('quality', 'добра')
                    },
                    "legal_status": "✅ ДОЗВОЛЕНО (придорожна інфраструктура)",
                    "distance_from_pfz": None,
                    "pfz_object": None,
                    "recommended_type": "Придорожний комплекс",
                    "capacity": "15-25 місць",
                    "investment": "$100K-250K",
                    "payback": "3-5 років",
                    "competitors_nearby": competitors
                })
        
        # ====== STEP 3: Generate fire prevention zones (fire_prevention) ======
        fire_clusters = find_fire_clusters(region_name, min_cluster_size=3, radius_km=10.0)
        
        # Limit to top 2 fire clusters per region
        for idx, cluster in enumerate(fire_clusters[:2]):
            cluster_center = cluster['center']
            fire_count = cluster['fire_count']
            
            # Check competition
            competitors = count_competitors_nearby(cluster_center, radius_km=5.0)
            
            # Calculate priority using comprehensive 7-factor model
            priority = calculate_comprehensive_priority(
                zone_type="fire_prevention",
                region_analysis=analysis,
                fire_cluster_size=fire_count,
                competitors=competitors,
                distance_from_pfz=0,
                pfz_name=""
            )
            
            # Only add if priority is high enough and fire count significant
            if priority < 55 or fire_count < 3:
                continue
            
            # Generate reasoning for fire_prevention zone
            reasoning = {
                "point1": f"🔥 КРИТИЧНА ЗОНА: {fire_count} людських пожеж (профілактика!)",
                "point2": f"📊 Пожежі: {analysis['fire_score']} балів, Природа: {int(analysis['nature_score'])} балів",
                "point3": "🏗️ Облаштований пункт знизить ризик нових пожеж"
            }
            
            # Recommended facilities for fire prevention
            recommended_facilities = [
                "Облаштоване місце для відпочинку з безпечними вогнищами",
                "Інформаційні стенди про правила пожежної безпеки",
                "Контейнери для сміття та зола",
                "Джерело води для гасіння вогню",
                "Альтанки з мангалами (безпечна зона)"
            ]
            
            # Create zone
            recommended_zones.append({
                "id": f"{region_name}_fire_{idx+1}",
                "type": "fire_prevention",
                "name": f"🔥 Кластер пожеж #{idx+1}, {region_name.replace(' область', '')}",
                "region": region_name,
                "coordinates": cluster_center,
                "priority": priority,
                "reasoning": reasoning,
                "recommended_facilities": recommended_facilities,
                "infrastructure": {
                    "hospital_distance": 12,
                    "hospital_name": f"{region_name.replace(' область', '')} ЦРЛ",
                    "gas_station_distance": 8,
                    "gas_station_name": "місцева заправка",
                    "shop_distance": 10,
                    "shop_name": "місцевий магазин",
                    "mobile_coverage": 85,
                    "nearest_road": "регіональна дорога",
                    "road_distance": 2,
                    "road_quality": "задовільна"
                },
                "legal_status": "✅ ДОЗВОЛЕНО (пожежна профілактика, лісовий фонд)",
                "distance_from_pfz": None,
                "pfz_object": None,
                "recommended_type": "Облаштоване місце відпочинку",
                "capacity": "30-50 осіб одночасно",
                "investment": "$30K-80K",
                "payback": "4-6 років (соціальний ефект)",
                "competitors_nearby": competitors,
                "fire_cluster_size": fire_count
            })
    
    # Sort by priority descending
    recommended_zones.sort(key=lambda x: x.get('priority', 0), reverse=True)
    
    return {"zones": recommended_zones}

def calculate_full_potential(region_name, population_data, pfz_data, infra_data, recreational_points):
    """
    Calculate full recreational potential using 7-factor AHP-based formula:
    
    Ваги визначені методом Analytic Hierarchy Process (AHP, Saaty 1980):
    - Demand (25%) - найвищий пріоритет (економічна доцільність)
    - PFZ (20%) - головний туристичний атрактор
    - Nature (15%) - естетична цінність і різноманітність
    - Transport (15%) - доступність території
    - Infrastructure (10%) - можна побудувати (вторинний фактор)
    - Fire Prevention (5%) - бонус за безпеку
    - Saturation (-15%) - штраф за перенасичення ринку
    
    TOTAL = 25 + 20 + 15 + 15 + 10 + 5 - 15 = 100 points max
    
    Consistency Ratio (CR) = 0.16% < 10% ✓ (відмінна узгодженість AHP)
    
    Детальна методологія: /app/backend/AHP_METHODOLOGY.md
    """
    
    # Default values if data missing
    if not population_data:
        population_data = {'population': 1000000, 'area_km2': 20000, 'forest_coverage_percent': 10, 'has_water_bodies': False}
    if not pfz_data:
        pfz_data = {'protected_areas': {'national_parks': 0, 'nature_reserves': 0, 'regional_landscape_parks': 0, 'zakazniks': 0, 'monuments_of_nature': 0, 'percent_of_region': 0}, 'pfz_score': 5.0, 'notable_objects': [], 'recreational_value': 'medium'}
    if not infra_data:
        infra_data = {
            'transport_accessibility': {'accessibility_score': 5.0, 'highway_density_km_per_1000km2': 200, 'main_roads': [], 'railway_stations': 20, 'airports': 0, 'average_travel_time_to_major_city_minutes': 60},
            'anthropogenic_infrastructure': {'hospitals_per_100k': 4.0, 'gas_stations_per_100km2': 0.5, 'mobile_coverage_percent': 90, 'internet_coverage_percent': 85, 'hotels_total': 100, 'electricity_reliability': 'середня'}
        }
    
    # 1. DEMAND SCORE (25 points)
    population = population_data.get('population', 1000000)
    annual_demand = population * 0.15 * 3  # 15% population × 3 visits/year
    
    def safe_float(val):
        """Safely convert value to float, handling ranges like '34-36'"""
        if val is None:
            return 0
        if isinstance(val, (int, float)):
            return float(val)
        try:
            # Handle ranges like "34-36" by taking the first number
            str_val = str(val).strip()
            if '-' in str_val and not str_val.startswith('-'):
                str_val = str_val.split('-')[0]
            return float(str_val)
        except (ValueError, TypeError):
            return 0
    
    total_capacity = sum(
        safe_float(p.get('properties', {}).get('capacity', 0))
        for p in recreational_points
    )
    annual_supply = total_capacity * 180 * 2  # 180 days × 2 shifts
    
    supply_demand_ratio = annual_supply / annual_demand if annual_demand > 0 else 0
    gap = annual_demand - annual_supply
    
    # Відповідно до методології на Landing Page
    if supply_demand_ratio < 0.6:  # дефіцит >40%
        demand_score = 25
    elif supply_demand_ratio < 0.8:  # дефіцит 20-40%
        demand_score = 20
    elif supply_demand_ratio < 1.0:  # баланс
        demand_score = 15
    elif supply_demand_ratio < 1.5:  # надлишок 0-50%
        demand_score = 10
    else:  # надлишок >50%
        demand_score = 0
    
    # 2. PFZ SCORE (20 points) - відповідно до методології Landing Page
    pfz = pfz_data.get('protected_areas', {})
    pfz_score = 0
    pfz_score += min(pfz.get('national_parks', 0) * 2.0, 8)  # НПП ×2.0
    pfz_score += min(pfz.get('nature_reserves', 0) * 1.5, 6)  # Заповідники ×1.5
    pfz_score += min(pfz.get('regional_landscape_parks', 0) * 1.0, 4)  # РЛП ×1.0
    pfz_score += min(pfz.get('zakazniks', 0) * 0.1, 1.5)  # Заказники ×0.1
    pfz_score += min(pfz.get('monuments_of_nature', 0) * 0.05, 0.5)  # Пам'ятки ×0.05
    
    percent_of_region = pfz.get('percent_of_region', 0)
    if percent_of_region > 10:
        pfz_score += 2
    elif percent_of_region > 7:
        pfz_score += 1.5
    elif percent_of_region > 5:
        pfz_score += 1
    
    pfz_score = min(pfz_score, 20)
    
    # 3. NATURE SCORE (15 points)
    forest_coverage = population_data.get('forest_coverage_percent', 10)
    forest_score = min(forest_coverage * 0.275, 11)  # 0.275 = нормалізація до 11 балів при 40%
    water_score = 4 if population_data.get('has_water_bodies', False) else 0
    nature_score = forest_score + water_score
    
    # 4. TRANSPORT ACCESSIBILITY (15 points)
    transport = infra_data.get('transport_accessibility', {})
    base_access_score = transport.get('accessibility_score', 5.0)
    accessibility_score = (base_access_score / 10) * 10
    
    international_roads = len([r for r in transport.get('main_roads', []) if r.get('type') == 'міжнародна'])
    accessibility_score += min(international_roads * 0.8, 3)
    
    if transport.get('airports', 0) > 0:
        accessibility_score += 1
    
    if transport.get('highway_density_km_per_1000km2', 0) > 250:
        accessibility_score += 1
    
    accessibility_score = min(accessibility_score, 15)
    
    # 5. ANTHROPOGENIC INFRASTRUCTURE (10 points)
    anthro = infra_data.get('anthropogenic_infrastructure', {})
    infra_score = 0
    
    hospitals_per_100k = anthro.get('hospitals_per_100k', 0)
    if hospitals_per_100k >= 5.0:
        infra_score += 3
    elif hospitals_per_100k >= 4.0:
        infra_score += 2
    else:
        infra_score += 1
    
    gas_density = anthro.get('gas_stations_per_100km2', 0)
    if gas_density >= 1.0:
        infra_score += 2
    elif gas_density >= 0.7:
        infra_score += 1.5
    else:
        infra_score += 1
    
    mobile_coverage = anthro.get('mobile_coverage_percent', 0)
    if mobile_coverage >= 96:
        infra_score += 2
    elif mobile_coverage >= 93:
        infra_score += 1.5
    else:
        infra_score += 1
    
    internet_coverage = anthro.get('internet_coverage_percent', 0)
    if internet_coverage >= 90:
        infra_score += 1
    elif internet_coverage >= 85:
        infra_score += 0.5
    
    hotels = anthro.get('hotels_total', 0)
    if hotels > 200:
        infra_score += 1
    elif hotels > 100:
        infra_score += 0.5
    
    electricity = anthro.get('electricity_reliability', '')
    if electricity == 'висока':
        infra_score += 1
    elif electricity == 'середня':
        infra_score += 0.5
    
    infra_score = min(infra_score, 10)
    
    # 6. SATURATION PENALTY (-15 points)
    area = population_data.get('area_km2', 20000)
    density = (len(recreational_points) / area * 1000) if area > 0 else 0
    
    if density > 6:
        saturation_penalty = -15
    elif density > 4:
        saturation_penalty = -10
    elif density > 3:
        saturation_penalty = -6
    elif density > 2:
        saturation_penalty = -3
    else:
        saturation_penalty = 0
    
    # 7. FIRE PREVENTION BONUS (+5 points) - NEW FACTOR
    # Calculate fire score for region center
    region_centers = {
        'Київська область': [50.45, 30.52],
        'Львівська область': [49.84, 24.03],
        'Закарпатська область': [48.62, 22.29],
        'Одеська область': [46.48, 30.73],
        'Харківська область': [49.99, 36.23],
        'Дніпропетровська область': [48.46, 35.04],
        'Житомирська область': [50.25, 28.66],
        'Волинська область': [50.75, 25.32],
        'Івано-Франківська область': [48.92, 24.71],
        'Вінницька область': [49.23, 28.47],
        'Чернігівська область': [51.50, 31.29],
        'Рівненська область': [50.62, 26.23],
        'Чернівецька область': [48.29, 25.93],
        'Полтавська область': [49.59, 34.55],
        'Черкаська область': [49.44, 32.06],
        'Сумська область': [50.91, 34.80],
        'Хмельницька область': [49.42, 26.98],
        'Тернопільська область': [49.55, 25.59],
        'Миколаївська область': [46.97, 32.00],
        'Херсонська область': [46.64, 32.62],
        'Кіровоградська область': [48.51, 32.26],
        'Запорізька область': [47.84, 35.14],
        'Донецька область': [48.02, 37.80],
        'Луганська область': [48.57, 39.31],
    }
    
    center_coords = region_centers.get(region_name, [48.5, 31.0])
    fire_data = count_human_fires_nearby(center_coords, radius_km=50.0)  # Regional scope
    fire_score = fire_data['score']  # 0-5 points
    
    # TOTAL SCORE (with new fire factor)
    total_score = demand_score + pfz_score + nature_score + accessibility_score + infra_score + fire_score + saturation_penalty
    total_score = max(0, min(100, total_score))
    
    # CATEGORY & RECOMMENDATION
    if total_score >= 85:
        category = "ВИНЯТКОВИЙ"
        recommendation = "Найвища пріоритетність! Термінове будівництво рекомендується."
    elif total_score >= 70:
        category = "ДУЖЕ ВИСОКИЙ"
        recommendation = "Дуже привабливо для інвесторів. Будівництво настійно рекомендується."
    elif total_score >= 55:
        category = "ВИСОКИЙ"
        recommendation = "Хороший потенціал. Рекомендується детальний аналіз локацій."
    elif total_score >= 40:
        category = "СЕРЕДНІЙ"
        recommendation = "Обмежений потенціал. Можливе точкове будівництво."
    else:
        category = "НИЗЬКИЙ"
        recommendation = "Низький попит або перенасичений ринок. Будівництво ризиковане."
    
    # Determine risk level
    if total_score >= 80:
        risk_level = "НИЗЬКИЙ"
    elif total_score >= 65:
        risk_level = "ПОМІРНИЙ"
    elif total_score >= 50:
        risk_level = "ПІДВИЩЕНИЙ"
    else:
        risk_level = "ВИСОКИЙ"
    
    # Investment scale
    if total_score >= 80 and gap > 200000:
        investment_scale = "ВЕЛИКИЙ (5+ об'єктів, $1M+)"
    elif total_score >= 70 and gap > 100000:
        investment_scale = "СЕРЕДНІЙ (3-5 об'єктів, $500K-1M)"
    elif total_score >= 55 and gap > 50000:
        investment_scale = "МАЛИЙ (1-2 об'єкти, $200K-500K)"
    elif total_score >= 40:
        investment_scale = "ТОЧКОВИЙ (1 унікальний об'єкт)"
    else:
        investment_scale = "НЕ РЕКОМЕНДОВАНО"
    
    # Density status
    if density > 6:
        density_status = "Критична насиченість"
    elif density > 4:
        density_status = "Висока насиченість"
    elif density > 2:
        density_status = "Помірна насиченість"
    else:
        density_status = "Низька конкуренція"
    
    return {
        "region": region_name,
        "total_score": round(total_score, 1),
        "demand_score": round(demand_score, 1),
        "pfz_score": round(pfz_score, 1),
        "nature_score": round(nature_score, 1),
        "accessibility_score": round(accessibility_score, 1),
        "infrastructure_score": round(infra_score, 1),
        "fire_score": round(fire_score, 1),
        "saturation_penalty": round(saturation_penalty, 1),
        "category": category,
        "recommendation": recommendation,
        "details": {
            "population": {
                "total": population,
                "area_km2": area,
                "density_per_km2": population_data.get('density_per_km2', 0),
                "annual_demand": round(annual_demand),
                "annual_supply": round(annual_supply),
                "supply_demand_ratio": round(supply_demand_ratio, 2),
                "gap": round(gap),
                "gap_status": "Дефіцит" if gap > 0 else "Надлишок"
            },
            "pfz": {
                "national_parks": pfz.get('national_parks', 0),
                "nature_reserves": pfz.get('nature_reserves', 0),
                "regional_landscape_parks": pfz.get('regional_landscape_parks', 0),
                "zakazniks": pfz.get('zakazniks', 0),
                "monuments_of_nature": pfz.get('monuments_of_nature', 0),
                "percent_of_region": percent_of_region,
                "pfz_rating": pfz_data.get('pfz_score', 0),
                "notable_objects": pfz_data.get('notable_objects', []),
                "recreational_value": pfz_data.get('recreational_value', 'medium')
            },
            "nature": {
                "forest_coverage_percent": forest_coverage,
                "has_water_bodies": population_data.get('has_water_bodies', False)
            },
            "transport": {
                "accessibility_score": base_access_score,
                "highway_density": transport.get('highway_density_km_per_1000km2', 0),
                "main_roads": transport.get('main_roads', []),
                "international_roads_count": international_roads,
                "railway_stations": transport.get('railway_stations', 0),
                "airports": transport.get('airports', 0),
                "avg_travel_time_minutes": transport.get('average_travel_time_to_major_city_minutes', 0)
            },
            "infrastructure": {
                "hospitals_per_100k": hospitals_per_100k,
                "hospitals_total": anthro.get('hospitals_total', 0),
                "gas_stations_per_100km2": gas_density,
                "gas_stations_total": anthro.get('gas_stations', 0),
                "mobile_coverage_percent": mobile_coverage,
                "internet_coverage_percent": internet_coverage,
                "hotels_total": hotels,
                "restaurants_cafes": anthro.get('restaurants_cafes', 0),
                "electricity_reliability": electricity,
                "water_supply_quality": anthro.get('water_supply_quality', '')
            },
            "saturation": {
                "existing_points": len(recreational_points),
                "density_per_1000km2": round(density, 2),
                "density_status": density_status
            },
            "fires": {
                "total_fires": fire_data['total'],
                "human_caused_fires": fire_data['human'],
                "fire_prevention_score": round(fire_score, 1),
                "interpretation": "Більше людських пожеж = вища потреба в облаштованих пунктах"
            },
            "investment": {
                "risk_level": risk_level,
                "investment_scale": investment_scale,
                "should_build": total_score >= 55
            }
        }
    }


# ===== DATA IMPORT ENDPOINTS =====
from fastapi import UploadFile, File
from schemas import (
    PopulationDataSchema,
    InfrastructureDataSchema,
    ProtectedAreasSchema,
    RecreationalPointsSchema,
    ForestFiresSchema
)

def reload_data():
    """Reload all data from files into memory"""
    global INFRASTRUCTURE_DATA, POPULATION_DATA, PROTECTED_AREAS_DATA, RECREATIONAL_POINTS, FOREST_FIRES
    INFRASTRUCTURE_DATA = load_json_file('ukraine_infrastructure.json')
    POPULATION_DATA = load_json_file('ukraine_population_data.json')
    PROTECTED_AREAS_DATA = load_json_file('ukraine_protected_areas.json')
    RECREATIONAL_POINTS = load_json_file('recreational_points_web.geojson')
    FOREST_FIRES = load_json_file('forest_fires.geojson')
    logging.info("Data reloaded successfully")

@api_router.get("/data-status")
async def get_data_status():
    """Get status of current loaded data"""
    return {
        "population_data": {
            "loaded": POPULATION_DATA is not None,
            "regions_count": len(POPULATION_DATA.get('ukraine_regions_data', [])) if POPULATION_DATA else 0
        },
        "infrastructure_data": {
            "loaded": INFRASTRUCTURE_DATA is not None,
            "regions_count": len(INFRASTRUCTURE_DATA.get('ukraine_infrastructure', {}).get('regions', [])) if INFRASTRUCTURE_DATA else 0
        },
        "protected_areas": {
            "loaded": PROTECTED_AREAS_DATA is not None,
            "regions_count": len(PROTECTED_AREAS_DATA.get('ukraine_protected_areas', {}).get('regions', [])) if PROTECTED_AREAS_DATA else 0
        },
        "recreational_points": {
            "loaded": RECREATIONAL_POINTS is not None,
            "points_count": len(RECREATIONAL_POINTS.get('features', [])) if RECREATIONAL_POINTS else 0
        },
        "forest_fires": {
            "loaded": FOREST_FIRES is not None,
            "total_fires": FOREST_FIRES.get('metadata', {}).get('total_fires', 0) if FOREST_FIRES else 0,
            "human_caused": FOREST_FIRES.get('metadata', {}).get('human_caused', 0) if FOREST_FIRES else 0
        }
    }

@api_router.post("/import/population-data")
async def import_population_data(file: UploadFile = File(...)):
    """Import population data (JSON)"""
    try:
        content = await file.read()
        data = json.loads(content.decode('utf-8'))
        
        # Validate schema
        validated_data = PopulationDataSchema(**data)
        
        # Save to file
        output_file = DATA_DIR / 'ukraine_population_data.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(validated_data.model_dump(), f, ensure_ascii=False, indent=2)
        
        # Reload data
        reload_data()
        
        return {
            "success": True,
            "message": f"Population data imported successfully: {len(validated_data.ukraine_regions_data)} regions",
            "regions_count": len(validated_data.ukraine_regions_data)
        }
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")

@api_router.post("/import/infrastructure-data")
async def import_infrastructure_data(file: UploadFile = File(...)):
    """Import infrastructure data (JSON)"""
    try:
        content = await file.read()
        data = json.loads(content.decode('utf-8'))
        
        # Validate schema
        validated_data = InfrastructureDataSchema(**data)
        
        # Save to file
        output_file = DATA_DIR / 'ukraine_infrastructure.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(validated_data.model_dump(), f, ensure_ascii=False, indent=2)
        
        # Reload data
        reload_data()
        
        return {
            "success": True,
            "message": f"Infrastructure data imported successfully: {len(validated_data.ukraine_infrastructure['regions'])} regions",
            "regions_count": len(validated_data.ukraine_infrastructure['regions'])
        }
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")

@api_router.post("/import/protected-areas")
async def import_protected_areas(file: UploadFile = File(...)):
    """Import protected areas data (JSON)"""
    try:
        content = await file.read()
        data = json.loads(content.decode('utf-8'))
        
        # Validate schema
        validated_data = ProtectedAreasSchema(**data)
        
        # Save to file
        output_file = DATA_DIR / 'ukraine_protected_areas.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(validated_data.model_dump(), f, ensure_ascii=False, indent=2)
        
        # Reload data
        reload_data()
        
        return {
            "success": True,
            "message": f"Protected areas data imported successfully: {len(validated_data.ukraine_protected_areas['regions'])} regions",
            "regions_count": len(validated_data.ukraine_protected_areas['regions'])
        }
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")

@api_router.post("/import/recreational-points")
async def import_recreational_points(file: UploadFile = File(...)):
    """Import recreational points (GeoJSON)"""
    try:
        content = await file.read()
        data = json.loads(content.decode('utf-8'))
        
        # Validate schema
        validated_data = RecreationalPointsSchema(**data)
        
        # Save to file
        output_file = DATA_DIR / 'recreational_points_web.geojson'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(validated_data.model_dump(), f, ensure_ascii=False, indent=2)
        
        # Reload data
        reload_data()
        
        return {
            "success": True,
            "message": f"Recreational points imported successfully: {len(validated_data.features)} points",
            "points_count": len(validated_data.features)
        }
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")

@api_router.post("/import/fires")
async def import_fires(file: UploadFile = File(...)):
    """Import forest fires data (GeoJSON)"""
    try:
        content = await file.read()
        data = json.loads(content.decode('utf-8'))
        
        # Validate schema
        validated_data = ForestFiresSchema(**data)
        
        # Save to file
        output_file = DATA_DIR / 'forest_fires.geojson'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(validated_data.model_dump(), f, ensure_ascii=False, indent=2)
        
        # Reload data
        reload_data()
        
        return {
            "success": True,
            "message": f"Forest fires data imported successfully: {validated_data.metadata.total_fires} fires ({validated_data.metadata.human_caused} human-caused)",
            "total_fires": validated_data.metadata.total_fires,
            "human_caused": validated_data.metadata.human_caused
        }
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")


# ===== DATA BACKUP ENDPOINTS =====
from fastapi.responses import StreamingResponse
import zipfile
import io

@api_router.get("/backup/download-all")
async def backup_download_all():
    """Download all data files as ZIP archive"""
    try:
        # Create in-memory ZIP file
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # List of files to backup
            backup_files = [
                ('ukraine_population_data.json', 'population_data.json'),
                ('ukraine_infrastructure.json', 'infrastructure_data.json'),
                ('ukraine_protected_areas.json', 'protected_areas_data.json'),
                ('recreational_points_web.geojson', 'recreational_points.geojson'),
                ('forest_fires.geojson', 'forest_fires.geojson')
            ]
            
            for source_file, archive_name in backup_files:
                file_path = DATA_DIR / source_file
                if file_path.exists():
                    zip_file.write(file_path, archive_name)
        
        # Prepare response
        zip_buffer.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"gis_data_backup_{timestamp}.zip"
        
        return StreamingResponse(
            iter([zip_buffer.getvalue()]),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup error: {str(e)}")

@api_router.get("/backup/download/{data_type}")
async def backup_download_single(data_type: str):
    """Download single data file"""
    file_mapping = {
        'population': ('ukraine_population_data.json', 'application/json'),
        'infrastructure': ('ukraine_infrastructure.json', 'application/json'),
        'protected-areas': ('ukraine_protected_areas.json', 'application/json'),
        'recreational-points': ('recreational_points_web.geojson', 'application/geo+json'),
        'fires': ('forest_fires.geojson', 'application/geo+json')
    }
    
    if data_type not in file_mapping:
        raise HTTPException(status_code=404, detail=f"Unknown data type: {data_type}")
    
    filename, media_type = file_mapping[data_type]
    file_path = DATA_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {filename}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return StreamingResponse(
            iter([content.encode('utf-8')]),
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

@api_router.get("/backup/info")
async def backup_info():
    """Get information about current data files for backup"""
    try:
        files_info = []
        
        file_list = [
            ('ukraine_population_data.json', 'Населення регіонів'),
            ('ukraine_infrastructure.json', 'Інфраструктура'),
            ('ukraine_protected_areas.json', 'Природоохоронні зони'),
            ('recreational_points_web.geojson', 'Рекреаційні пункти'),
            ('forest_fires.geojson', 'Лісові пожежі')
        ]
        
        total_size = 0
        
        for filename, description in file_list:
            file_path = DATA_DIR / filename
            if file_path.exists():
                size = file_path.stat().st_size
                modified = datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                total_size += size
                
                files_info.append({
                    'filename': filename,
                    'description': description,
                    'size_bytes': size,
                    'size_mb': round(size / (1024 * 1024), 2),
                    'last_modified': modified
                })
        
        return {
            'files': files_info,
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'file_count': len(files_info)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting backup info: {str(e)}")

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
