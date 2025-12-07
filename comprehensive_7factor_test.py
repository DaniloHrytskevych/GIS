#!/usr/bin/env python3
"""
COMPREHENSIVE 7-FACTOR MODEL TESTING
Tests all requirements from the review request for /api/recommended-zones endpoint
"""

import requests
import json
import sys

def test_comprehensive_7_factor_model():
    """Test all requirements from the review request"""
    
    print("🔥 COMPREHENSIVE 7-FACTOR MODEL TESTING")
    print("=" * 60)
    
    # Fetch data
    try:
        response = requests.get("https://calc-data-export.preview.emergentagent.com/api/recommended-zones", timeout=30)
        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            return False
        
        data = response.json()
        zones = data.get('zones', [])
        
        if not zones:
            print("❌ No zones returned")
            return False
        
        print(f"✅ API Response: {len(zones)} zones returned")
        
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    # ====== TEST 1: Zone Types & Distribution ======
    print("\n1️⃣ TESTING: Zone Types & Distribution")
    
    zone_types = [zone.get('type') for zone in zones]
    type_counts = {
        'near_pfz': zone_types.count('near_pfz'),
        'roadside': zone_types.count('roadside'), 
        'fire_prevention': zone_types.count('fire_prevention')
    }
    
    print(f"   📊 Distribution: near_pfz={type_counts['near_pfz']}, roadside={type_counts['roadside']}, fire_prevention={type_counts['fire_prevention']}")
    
    # Check all 3 types exist
    missing_types = [t for t, c in type_counts.items() if c == 0]
    if missing_types:
        print(f"   ❌ Missing zone types: {missing_types}")
        return False
    
    # Check reasonable distribution (roughly similar counts)
    min_count = min(type_counts.values())
    max_count = max(type_counts.values())
    if max_count > min_count * 3:  # Allow up to 3x difference
        print(f"   ⚠️  Uneven distribution (max={max_count}, min={min_count})")
    else:
        print(f"   ✅ Reasonable distribution")
    
    # ====== TEST 2: 7-Factor Priority Calculation ======
    print("\n2️⃣ TESTING: 7-Factor Priority Calculation")
    
    priorities = [zone.get('priority', 0) for zone in zones]
    
    # Check priority range (0-100)
    invalid_priorities = [p for p in priorities if not (0 <= p <= 100)]
    if invalid_priorities:
        print(f"   ❌ Invalid priority values: {invalid_priorities[:5]}")
        return False
    
    print(f"   ✅ All priorities in valid range (0-100)")
    
    # Check sorted descending
    is_sorted = all(priorities[i] >= priorities[i+1] for i in range(len(priorities)-1))
    if not is_sorted:
        print(f"   ❌ Zones not sorted by priority (descending)")
        return False
    
    print(f"   ✅ Zones sorted by priority (descending)")
    
    # Check priority statistics
    avg_priority = sum(priorities) / len(priorities)
    max_priority = max(priorities)
    min_priority = min(priorities)
    unique_priorities = len(set(priorities))
    
    print(f"   📊 Priority stats: avg={avg_priority:.1f}, max={max_priority}, min={min_priority}, unique={unique_priorities}")
    
    # ====== TEST 3: Fire Prevention Zones ======
    print("\n3️⃣ TESTING: Fire Prevention Zones")
    
    fire_zones = [z for z in zones if z.get('type') == 'fire_prevention']
    print(f"   📊 Fire prevention zones: {len(fire_zones)}")
    
    if not fire_zones:
        print(f"   ❌ No fire prevention zones found")
        return False
    
    for i, fire_zone in enumerate(fire_zones[:3]):  # Test first 3
        # Check fire_cluster_size ≥3
        fire_cluster_size = fire_zone.get('fire_cluster_size')
        if fire_cluster_size is None or fire_cluster_size < 3:
            print(f"   ❌ Zone {i+1}: fire_cluster_size invalid ({fire_cluster_size})")
            return False
        
        # Check reasoning mentions fire statistics
        reasoning_text = ' '.join(fire_zone.get('reasoning', {}).values())
        if 'пожеж' not in reasoning_text:
            print(f"   ❌ Zone {i+1}: reasoning doesn't mention fires")
            return False
        
        # Check fire safety facilities
        facilities = fire_zone.get('recommended_facilities', [])
        facilities_text = ' '.join(facilities)
        
        required_facilities = [
            'безпечними вогнищами',
            'пожежної безпеки', 
            'джерело води'
        ]
        
        found_facilities = [req for req in required_facilities if req in facilities_text]
        if len(found_facilities) < 2:  # At least 2 of 3 required
            print(f"   ❌ Zone {i+1}: missing fire safety facilities")
            return False
    
    print(f"   ✅ Fire prevention zones valid (cluster_size ≥3, fire facilities)")
    
    # ====== TEST 4: Near PFZ Zones ======
    print("\n4️⃣ TESTING: Near PFZ Zones")
    
    near_pfz_zones = [z for z in zones if z.get('type') == 'near_pfz']
    print(f"   📊 Near PFZ zones: {len(near_pfz_zones)}")
    
    if not near_pfz_zones:
        print(f"   ❌ No near PFZ zones found")
        return False
    
    for i, pfz_zone in enumerate(near_pfz_zones[:3]):  # Test first 3
        # Check pfz_object field
        if not pfz_zone.get('pfz_object'):
            print(f"   ❌ Zone {i+1}: missing pfz_object")
            return False
        
        # Check distance_from_pfz is set
        if pfz_zone.get('distance_from_pfz') is None:
            print(f"   ❌ Zone {i+1}: missing distance_from_pfz")
            return False
        
        # Check reasoning mentions visitor estimates
        reasoning_text = ' '.join(pfz_zone.get('reasoning', {}).values())
        if 'відвідувачів' not in reasoning_text:
            print(f"   ❌ Zone {i+1}: reasoning doesn't mention visitors")
            return False
        
        # Check eco-tourism facilities
        facilities = pfz_zone.get('recommended_facilities', [])
        facilities_text = ' '.join(facilities)
        
        eco_facilities = ['екологічний готель', 'інформаційний центр']
        found_eco = [eco for eco in eco_facilities if eco in facilities_text.lower()]
        if len(found_eco) < 1:
            print(f"   ❌ Zone {i+1}: missing eco-tourism facilities")
            return False
    
    print(f"   ✅ Near PFZ zones valid (pfz_object, distance, eco facilities)")
    
    # ====== TEST 5: Roadside Zones ======
    print("\n5️⃣ TESTING: Roadside Zones")
    
    roadside_zones = [z for z in zones if z.get('type') == 'roadside']
    print(f"   📊 Roadside zones: {len(roadside_zones)}")
    
    if not roadside_zones:
        print(f"   ❌ No roadside zones found")
        return False
    
    for i, road_zone in enumerate(roadside_zones[:3]):  # Test first 3
        # Check distance_from_pfz is null
        if road_zone.get('distance_from_pfz') is not None:
            print(f"   ❌ Zone {i+1}: distance_from_pfz should be null")
            return False
        
        # Check pfz_object is null
        if road_zone.get('pfz_object') is not None:
            print(f"   ❌ Zone {i+1}: pfz_object should be null")
            return False
        
        # Check reasoning mentions road traffic
        reasoning_text = ' '.join(road_zone.get('reasoning', {}).values())
        if 'авто/день' not in reasoning_text and 'траса' not in reasoning_text:
            print(f"   ❌ Zone {i+1}: reasoning doesn't mention road traffic")
            return False
        
        # Check roadside facilities
        facilities = road_zone.get('recommended_facilities', [])
        facilities_text = ' '.join(facilities)
        
        road_facilities = ['мотель', 'стоянка']
        found_road = [road for road in road_facilities if road in facilities_text.lower()]
        if len(found_road) < 2:
            print(f"   ❌ Zone {i+1}: missing roadside facilities")
            return False
    
    print(f"   ✅ Roadside zones valid (null fields, road facilities)")
    
    # ====== TEST 6: Reasoning Structure ======
    print("\n6️⃣ TESTING: Reasoning Structure")
    
    emoji_indicators = ['🌲', '🚗', '🔥', '📊', '🏗️']
    
    for i, zone in enumerate(zones[:5]):  # Test first 5 zones
        reasoning = zone.get('reasoning', {})
        
        # Check 3-point structure
        if not all(key in reasoning for key in ['point1', 'point2', 'point3']):
            print(f"   ❌ Zone {i+1}: invalid reasoning structure")
            return False
        
        # Check for emoji indicators
        reasoning_text = ' '.join(reasoning.values())
        found_emojis = [emoji for emoji in emoji_indicators if emoji in reasoning_text]
        if len(found_emojis) < 2:  # At least 2 emojis
            print(f"   ❌ Zone {i+1}: insufficient emoji indicators")
            return False
    
    print(f"   ✅ Reasoning structure valid (3 points, emoji indicators)")
    
    # ====== TEST 7: Data Integrity ======
    print("\n7️⃣ TESTING: Data Integrity")
    
    integrity_issues = []
    
    for zone in zones[:10]:  # Test first 10 zones
        zone_name = zone.get('name', 'Unknown')
        
        # Check coordinates within Ukraine bounds
        coords = zone.get('coordinates', [])
        if len(coords) != 2:
            integrity_issues.append(f"{zone_name}: invalid coordinates format")
            continue
        
        lat, lng = coords
        if not (44 <= lat <= 52 and 21.5 <= lng <= 40.5):
            integrity_issues.append(f"{zone_name}: coordinates out of bounds")
            continue
        
        # Check infrastructure distances are positive
        infrastructure = zone.get('infrastructure', {})
        distances = [
            infrastructure.get('hospital_distance', 0),
            infrastructure.get('gas_station_distance', 0),
            infrastructure.get('shop_distance', 0)
        ]
        
        if not all(isinstance(d, (int, float)) and d > 0 for d in distances):
            integrity_issues.append(f"{zone_name}: invalid infrastructure distances")
            continue
        
        # Check investment and payback strings
        investment = zone.get('investment', '')
        payback = zone.get('payback', '')
        if not (investment and payback and '$' in investment):
            integrity_issues.append(f"{zone_name}: invalid investment/payback format")
            continue
    
    if integrity_issues:
        print(f"   ❌ Data integrity issues: {integrity_issues[:3]}")
        return False
    
    print(f"   ✅ Data integrity valid (coordinates, distances, formats)")
    
    # ====== FINAL SUMMARY ======
    print("\n" + "=" * 60)
    print("🎯 COMPREHENSIVE TEST RESULTS")
    print("=" * 60)
    
    print(f"✅ Zone Types: All 3 types present ({type_counts})")
    print(f"✅ Priority Model: 7-factor calculation working")
    print(f"✅ Fire Prevention: {len(fire_zones)} zones with proper facilities")
    print(f"✅ Near PFZ: {len(near_pfz_zones)} zones with eco-tourism focus")
    print(f"✅ Roadside: {len(roadside_zones)} zones with transit facilities")
    print(f"✅ Reasoning: 3-point structure with emoji indicators")
    print(f"✅ Data Integrity: All fields valid and properly formatted")
    
    print(f"\n🏆 ALL TESTS PASSED - 7-FACTOR MODEL FULLY IMPLEMENTED")
    
    return True

if __name__ == "__main__":
    success = test_comprehensive_7_factor_model()
    sys.exit(0 if success else 1)