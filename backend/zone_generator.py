"""
Zone Generator for Recommended Recreational Zones
Uses algorithm to calculate coordinates near PFZ objects with consistent hashing
"""
import math
import hashlib


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


def count_competitors_nearby(coordinates: list, recreational_points: dict, radius_km: float = 5.0):
    """
    Count existing recreational points near given coordinates
    
    Args:
        coordinates: [lat, lng]
        recreational_points: GeoJSON features
        radius_km: Search radius in km
    
    Returns:
        Number of competitors within radius
    """
    if not recreational_points or 'features' not in recreational_points:
        return 0
    
    lat, lng = coordinates
    count = 0
    
    for feature in recreational_points['features']:
        if 'geometry' not in feature or 'coordinates' not in feature['geometry']:
            continue
        
        point_lng, point_lat = feature['geometry']['coordinates']
        
        # Calculate distance using Haversine formula
        dlat = math.radians(point_lat - lat)
        dlng = math.radians(point_lng - lng)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(point_lat)) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        distance = 6371 * c  # Earth radius in km
        
        if distance <= radius_km:
            count += 1
    
    return count


def calculate_zone_priority(pfz_name: str, pfz_type: str, competitors: int, infrastructure_score: float, total_score: float):
    """
    Calculate priority for a recommended zone
    
    Args:
        pfz_name: Name of protected area
        pfz_type: Type (НПП, заповідник, РЛП)
        competitors: Number of competitors nearby
        infrastructure_score: Infrastructure quality (0-10)
        total_score: Region's total potential score
    
    Returns:
        Priority score (0-100)
    """
    base_priority = int(total_score * 0.6)  # 60% of region score
    
    # PFZ attraction bonus
    if 'НПП' in pfz_type or 'Національний' in pfz_name:
        base_priority += 20
    elif 'заповідник' in pfz_type or 'заповідник' in pfz_name.lower():
        base_priority += 15
    elif 'РЛП' in pfz_type or 'РЛП' in pfz_name:
        base_priority += 10
    
    # Competition penalty/bonus
    if competitors == 0:
        base_priority += 15
    elif competitors <= 2:
        base_priority += 10
    elif competitors <= 5:
        base_priority += 5
    elif competitors > 10:
        base_priority -= 10
    
    # Infrastructure bonus
    base_priority += min(5, int(infrastructure_score / 2))
    
    return min(100, max(40, base_priority))


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


MAIN_ROADS = {
    'Київська область': [
        {'name': 'М-01', 'type': 'міжнародна', 'km': 25, 'coords': [50.55, 30.45]},
        {'name': 'М-05', 'type': 'міжнародна', 'km': 40, 'coords': [50.35, 30.62]},
    ],
    'Львівська область': [
        {'name': 'М-06', 'type': 'міжнародна', 'km': 35, 'coords': [49.90, 24.10]},
        {'name': 'М-09', 'type': 'міжнародна', 'km': 45, 'coords': [49.75, 23.95]},
    ],
    'Одеська область': [
        {'name': 'М-05', 'type': 'міжнародна', 'km': 50, 'coords': [46.55, 30.80]},
    ],
    'Харківська область': [
        {'name': 'М-03', 'type': 'міжнародна', 'km': 30, 'coords': [50.05, 36.30]},
    ],
}
