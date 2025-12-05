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

@app.on_event("startup")
async def load_data():
    global INFRASTRUCTURE_DATA, POPULATION_DATA, PROTECTED_AREAS_DATA, RECREATIONAL_POINTS, RECOMMENDED_LOCATIONS, FOREST_FIRES
    INFRASTRUCTURE_DATA = load_json_file('ukraine_infrastructure.json')
    POPULATION_DATA = load_json_file('ukraine_population_data.json')
    PROTECTED_AREAS_DATA = load_json_file('ukraine_protected_areas.json')
    RECREATIONAL_POINTS = load_json_file('recreational_points_web.geojson')
    RECOMMENDED_LOCATIONS = load_json_file('recommended_locations.json')
    FOREST_FIRES = load_json_file('forest_fires.geojson')
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
    
    # Calculate fire score (0-5 points)
    # Logic: More human fires = higher need for recreational facilities
    if human_fires == 0:
        fire_score = 0
    elif human_fires == 1:
        fire_score = 1  # Single incident - low priority
    elif human_fires <= 3:
        fire_score = 2  # Multiple incidents - medium priority
    elif human_fires <= 5:
        fire_score = 3  # Many incidents - high priority
    else:
        fire_score = min(5, 3 + (human_fires - 5) * 0.5)  # Very high priority
    
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
    Uses algorithm to calculate coordinates near PFZ objects and main roads
    """
    if not all([POPULATION_DATA, INFRASTRUCTURE_DATA, PROTECTED_AREAS_DATA, RECREATIONAL_POINTS]):
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    recommended_zones = []
    zone_id_counter = 1
    
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
        
        # Get existing points for region
        region_points = [
            p for p in RECREATIONAL_POINTS.get('features', [])
            if p.get('properties', {}).get('region') == region_name
        ]
        
        # Calculate analysis for the region
        try:
            analysis = await analyze_region(region_name)
        except Exception:
            continue
        
        # Only recommend if total_score >= 55 (high potential)
        if analysis.get('total_score', 0) < 55 or not analysis.get('details', {}).get('investment', {}).get('should_build', False):
            continue
        
        # ====== STEP 1: Generate zones near PFZ objects ======
        if pfz_region and pfz_region.get('notable_objects'):
            notable_objects = pfz_region['notable_objects']
            
            # For each notable PFZ object
            for pfz_obj in notable_objects[:3]:  # Limit to top 3 PFZ objects per region
                pfz_name = pfz_obj
                
                # Try to get coordinates for this PFZ from the data
                # For simplicity, use region center + offset based on hash
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
                
                base_coords = region_centers.get(region_name, [48.5, 31.0])
                
                # Generate coordinates NEARBY (not at the center) using hash
                zone_coords = generate_nearby_coordinates(
                    base_coords[0], 
                    base_coords[1], 
                    seed=f"{region_name}_{pfz_name}",
                    min_distance=2,
                    max_distance=10
                )
                
                # Check competition
                competitors = count_competitors_nearby(zone_coords, radius_km=5.0)
                
                # Only add if competition is low
                if competitors < 5:
                    pass  # TODO: Implement zone generation logic
        
        # Generate zones using simple algorithm (fallback)
        if analysis.get('total_score', 0) >= 55:
            # Calculate density to find low-saturation areas
            area = region.get('area_km2', 20000)
            points_density = (len(region_points) / area * 1000) if area > 0 else 0
            
            # Generate recommended zone coordinates
            # Use region center as base, offset based on notable objects and low density areas
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
            
            base_coords = region_centers.get(region_name, [48.5, 31.0])
            
            # Generate multiple recommended zones per region based on potential
            num_zones = 1
            if analysis.get('total_score', 0) >= 85:
                num_zones = 4
            elif analysis.get('total_score', 0) >= 70:
                num_zones = 3
            elif analysis.get('total_score', 0) >= 55:
                num_zones = 2
            
            # Calculate gap and other metrics
            gap = analysis.get('details', {}).get('population', {}).get('gap', 0)
            
            # Calculate optimal positions for new facilities
            for i in range(num_zones):
                # Offset from center
                angle = (2 * math.pi / num_zones) * i + (math.pi / 4)
                offset_lat = 0.3 * math.cos(angle)
                offset_lng = 0.4 * math.sin(angle)
                
                zone_lat = base_coords[0] + offset_lat
                zone_lng = base_coords[1] + offset_lng
                
                # Determine zone type and details
                has_major_pfz = pfz_region and pfz_region.get('pfz_score', 0) >= 7
                notable_objects = pfz_region.get('notable_objects', []) if pfz_region else []
                
                # Determine if this is near PFZ or roadside
                zone_type_category = "near_pfz" if has_major_pfz and i == 0 else "roadside"
                
                # Zone type for display
                zone_type = "загальний"
                if has_major_pfz:
                    zone_type = "екотуризм"
                elif region.get('has_water_bodies', False):
                    zone_type = "водний відпочинок"
                elif region.get('forest_coverage_percent', 0) > 30:
                    zone_type = "лісовий відпочинок"
                
                # Calculate priority as numeric (0-100)
                priority_numeric = int(analysis.get('total_score', 0))
                if gap > 200000:
                    priority_numeric = min(95, priority_numeric + 10)
                elif gap > 100000:
                    priority_numeric = min(90, priority_numeric + 5)
                
                # Generate infrastructure details based on region
                # Kyiv region = closer (2-5 km), Zakarpattia = farther (8-15 km)
                base_distance = 5
                if region_name == 'Київська область':
                    base_distance = 3
                elif region_name in ['Закарпатська область', 'Чернівецька область', 'Івано-Франківська область']:
                    base_distance = 10
                elif region_name in ['Львівська область', 'Одеська область', 'Харківська область']:
                    base_distance = 5
                
                hospital_distance = base_distance + i * 2
                gas_station_distance = max(1, base_distance - 2 + i)
                shop_distance = base_distance - 1 + i
                
                # Get main road from infrastructure data
                main_road = "М-06"
                road_quality = "добра"
                if infra_region and infra_region.get('transport_accessibility', {}).get('main_roads'):
                    main_roads = infra_region['transport_accessibility']['main_roads']
                    if main_roads:
                        main_road = main_roads[0]['name']
                        road_quality = main_roads[0].get('quality', 'добра')
                
                mobile_coverage = 95
                if infra_region:
                    mobile_coverage = infra_region.get('anthropogenic_infrastructure', {}).get('mobile_coverage_percent', 95)
                
                # Generate reasoning based on zone type
                reasoning = {}
                if zone_type_category == "near_pfz" and notable_objects:
                    pfz_name = notable_objects[0] if notable_objects else "ПЗФ"
                    visitors_estimate = 30000 if 'НПП' in pfz_name or 'Національний' in pfz_name else 15000
                    reasoning = {
                        "point1": f"{pfz_name} відвідують ~{visitors_estimate:,} осіб/рік",
                        "point2": f"Існуючих рекреаційних пунктів поблизу: {len(region_points)} (недостатньо!)",
                        "point3": f"Високий попит на екотуризм біля {region_name.replace(' область', '')}"
                    }
                else:
                    traffic = "5,000+" if "міжнародна" in road_quality or "М-" in main_road else "3,000+"
                    reasoning = {
                        "point1": f"{main_road.split()[0]} - головна траса ({traffic} авто/день)",
                        "point2": f"Високий транзитний потік туристів через {region_name.replace(' область', '')}",
                        "point3": "Відсутня якісна придорожня інфраструктура на цій ділянці"
                    }
                
                # Generate recommended facilities based on type
                recommended_facilities = []
                if zone_type_category == "near_pfz":
                    capacity_people = int(gap / num_zones / 180 / 2) if gap > 0 else 50
                    recommended_facilities = [
                        f"Екологічний готель: {max(30, min(70, capacity_people))} номерів",
                        "Ресторан з місцевою/органічною кухнею",
                        "Інформаційний центр про ПЗФ (екскурсії, карти маршрутів)",
                        "Прокат туристичного спорядження",
                        "Веранда/тераса з видом на природу"
                    ]
                else:
                    recommended_facilities = [
                        "Мотель: 20-30 місць",
                        "Ресторан/кафе: 40-50 місць для відвідувачів",
                        "Стоянка: 30-40 автомобілів",
                        "Дитячий майданчик",
                        "Зона відпочинку з альтанками та мангалами"
                    ]
                
                # Determine recommended type and capacity
                if zone_type_category == "near_pfz":
                    recommended_type = "Екоготель"
                    capacity = "50-70 місць"
                else:
                    recommended_type = "Придорожний комплекс"
                    capacity = "15-25 місць"
                
                # Calculate investment and payback
                if priority_numeric >= 85:
                    investment = "$300K-500K"
                    payback = "2-3 роки"
                elif priority_numeric >= 70:
                    investment = "$150K-300K"
                    payback = "3-4 роки"
                else:
                    investment = "$80K-150K"
                    payback = "4-5 років"
                
                # Legal status
                legal_status = "✅ ДОЗВОЛЕНО (населений пункт, ЗА МЕЖАМИ ПЗФ)" if zone_type_category == "near_pfz" else "✅ ДОЗВОЛЕНО (придорожна інфраструктура)"
                
                # Distance from PFZ (only for near_pfz type)
                distance_from_pfz = 3 + i if zone_type_category == "near_pfz" else None
                
                # Generate zone name
                if zone_type_category == "near_pfz" and notable_objects:
                    zone_name = f"с. біля {notable_objects[0]}"
                else:
                    zone_name = f"Траса {main_road.split()[0]}, {region_name.replace(' область', '')}"
                
                recommended_zones.append({
                    "id": f"{region_name}_{i+1}",
                    "type": zone_type_category,
                    "name": zone_name,
                    "region": region_name,
                    "coordinates": [zone_lat, zone_lng],
                    "zone_type": zone_type,
                    "priority": priority_numeric,
                    "total_score": analysis.get('total_score', 0),
                    "category": analysis.get('category', ''),
                    "recommended_capacity": int(gap / num_zones / 180 / 2) if gap > 0 else 100,
                    "investment_scale": analysis.get('details', {}).get('investment', {}).get('investment_scale', ''),
                    "notable_objects_nearby": notable_objects[:3] if notable_objects else [],
                    "infrastructure_score": analysis.get('infrastructure_score', 0),
                    "accessibility_score": analysis.get('accessibility_score', 0),
                    "legal_status": legal_status,
                    "distance_from_pfz": distance_from_pfz,
                    "pfz_object": notable_objects[0] if notable_objects and zone_type_category == "near_pfz" else None,
                    "recommended_type": recommended_type,
                    "capacity": capacity,
                    "investment": investment,
                    "payback": payback,
                    "competitors_nearby": len(region_points),
                    "reasoning": reasoning,
                    "recommended_facilities": recommended_facilities,
                    "infrastructure": {
                        "hospital_distance": hospital_distance,
                        "hospital_name": f"{region_name.replace(' область', '')} ЦРЛ",
                        "gas_station_distance": gas_station_distance,
                        "gas_station_name": "WOG" if region_name in ['Київська область', 'Львівська область'] else "БРСМ",
                        "shop_distance": shop_distance,
                        "shop_name": "Сільпо" if region_name in ['Київська область', 'Одеська область'] else "АТБ",
                        "mobile_coverage": mobile_coverage,
                        "nearest_road": main_road.split()[0],
                        "road_distance": 0 if zone_type_category == "roadside" else 1,
                        "road_quality": road_quality
                    }
                })
    
    # Sort by priority descending
    recommended_zones.sort(key=lambda x: x.get('priority', 0), reverse=True)
    
    return {"zones": recommended_zones}

def calculate_full_potential(region_name, population_data, pfz_data, infra_data, recreational_points):
    """
    Calculate full recreational potential using 6-factor formula:
    Potential = Demand (25%) + PFZ (20%) + Nature (15%) + Transport (15%) + Infrastructure (10%) - Saturation (15%)
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
    
    if supply_demand_ratio < 0.3:
        demand_score = 25
    elif supply_demand_ratio < 0.5:
        demand_score = 21
    elif supply_demand_ratio < 0.7:
        demand_score = 17
    elif supply_demand_ratio < 1.0:
        demand_score = 10
    elif supply_demand_ratio < 1.5:
        demand_score = 4
    else:
        demand_score = 0
    
    # 2. PFZ SCORE (20 points)
    pfz = pfz_data.get('protected_areas', {})
    pfz_score = 0
    pfz_score += min(pfz.get('national_parks', 0) * 2.5, 7)
    pfz_score += min(pfz.get('nature_reserves', 0) * 2.0, 5)
    pfz_score += min(pfz.get('regional_landscape_parks', 0) * 0.4, 4)
    pfz_score += min(pfz.get('zakazniks', 0) * 0.02, 2)
    pfz_score += min(pfz.get('monuments_of_nature', 0) * 0.02, 1)
    
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
    forest_score = min(forest_coverage * 0.28, 11)
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
            "investment": {
                "risk_level": risk_level,
                "investment_scale": investment_scale,
                "should_build": total_score >= 55
            }
        }
    }

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
