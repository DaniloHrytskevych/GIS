#!/usr/bin/env python3
"""
Backend API Testing for GIS Recreational Potential Analysis System
Tests all API endpoints for Ukrainian regions analysis
"""

import requests
import sys
import json
from datetime import datetime

class GISAPITester:
    def __init__(self, base_url="https://ukr-info-design.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = []

    def log_test(self, name, success, details="", expected_status=200, actual_status=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({
                "test": name,
                "error": details,
                "expected_status": expected_status,
                "actual_status": actual_status
            })
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'No message')}"
            self.log_test("API Root", success, details, 200, response.status_code)
            return success
        except Exception as e:
            self.log_test("API Root", False, f"Exception: {str(e)}")
            return False

    def test_get_regions(self):
        """Test /api/regions endpoint"""
        try:
            response = requests.get(f"{self.api_url}/regions", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                regions = data.get('regions', [])
                details += f", Regions count: {len(regions)}"
                if len(regions) > 0:
                    details += f", Sample: {regions[0] if regions else 'None'}"
                    # Check if we have expected Ukrainian regions
                    expected_regions = ["Київська область", "Львівська область", "Одеська область"]
                    found_regions = [r for r in expected_regions if r in regions]
                    details += f", Expected regions found: {len(found_regions)}/3"
                else:
                    success = False
                    details += " - No regions returned"
            
            self.log_test("Get Regions", success, details, 200, response.status_code)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("Get Regions", False, f"Exception: {str(e)}")
            return False, {}

    def test_get_recreational_points(self):
        """Test /api/recreational-points endpoint"""
        try:
            response = requests.get(f"{self.api_url}/recreational-points", timeout=15)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                features = data.get('features', [])
                details += f", Points count: {len(features)}"
                if len(features) > 0:
                    sample_point = features[0]
                    point_name = sample_point.get('properties', {}).get('name', 'Unknown')
                    point_region = sample_point.get('properties', {}).get('region', 'Unknown')
                    details += f", Sample: {point_name} in {point_region}"
                    # Check if it's valid GeoJSON
                    if data.get('type') == 'FeatureCollection':
                        details += ", Valid GeoJSON format"
                    else:
                        details += ", Invalid GeoJSON format"
                else:
                    success = False
                    details += " - No recreational points returned"
            
            self.log_test("Get Recreational Points", success, details, 200, response.status_code)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("Get Recreational Points", False, f"Exception: {str(e)}")
            return False, {}

    def test_analyze_region(self, region_name="Київська область"):
        """Test /api/analyze/{region_name} endpoint"""
        try:
            encoded_region = requests.utils.quote(region_name)
            response = requests.get(f"{self.api_url}/analyze/{encoded_region}", timeout=15)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Region: {region_name}"
            
            if success:
                data = response.json()
                total_score = data.get('total_score', 0)
                category = data.get('category', 'Unknown')
                details += f", Score: {total_score}/100, Category: {category}"
                
                # Check required fields
                required_fields = ['region', 'total_score', 'demand_score', 'pfz_score', 
                                 'nature_score', 'accessibility_score', 'infrastructure_score', 
                                 'saturation_penalty', 'category', 'recommendation', 'details']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += ", All required fields present"
                    
                # Validate score ranges
                score_validations = []
                if not (0 <= data.get('demand_score', 0) <= 25):
                    score_validations.append("demand_score out of range")
                if not (0 <= data.get('pfz_score', 0) <= 20):
                    score_validations.append("pfz_score out of range")
                if not (0 <= data.get('nature_score', 0) <= 15):
                    score_validations.append("nature_score out of range")
                if not (0 <= data.get('accessibility_score', 0) <= 15):
                    score_validations.append("accessibility_score out of range")
                if not (0 <= data.get('infrastructure_score', 0) <= 10):
                    score_validations.append("infrastructure_score out of range")
                if not (-15 <= data.get('saturation_penalty', 0) <= 0):
                    score_validations.append("saturation_penalty out of range")
                
                if score_validations:
                    details += f", Score validation issues: {score_validations}"
                else:
                    details += ", All scores in valid ranges"
            
            self.log_test(f"Analyze Region ({region_name})", success, details, 200, response.status_code)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test(f"Analyze Region ({region_name})", False, f"Exception: {str(e)}")
            return False, {}

    def test_analyze_all_regions(self):
        """Test /api/analyze-all endpoint"""
        try:
            response = requests.get(f"{self.api_url}/analyze-all", timeout=30)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                results = data.get('results', [])
                details += f", Regions analyzed: {len(results)}"
                
                if len(results) > 0:
                    # Check if results are sorted by total_score (descending)
                    scores = [r.get('total_score', 0) for r in results]
                    is_sorted = all(scores[i] >= scores[i+1] for i in range(len(scores)-1))
                    details += f", Sorted by score: {is_sorted}"
                    
                    # Get top and bottom regions
                    top_region = results[0]
                    bottom_region = results[-1]
                    details += f", Top: {top_region.get('region')} ({top_region.get('total_score')})"
                    details += f", Bottom: {bottom_region.get('region')} ({bottom_region.get('total_score')})"
                else:
                    success = False
                    details += " - No analysis results returned"
            
            self.log_test("Analyze All Regions", success, details, 200, response.status_code)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("Analyze All Regions", False, f"Exception: {str(e)}")
            return False, {}

    def test_population_data(self):
        """Test /api/population endpoint"""
        try:
            response = requests.get(f"{self.api_url}/population", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                regions_data = data.get('ukraine_regions_data', [])
                details += f", Population data regions: {len(regions_data)}"
                if len(regions_data) > 0:
                    sample = regions_data[0]
                    details += f", Sample: {sample.get('name')} - {sample.get('population')} people"
            
            self.log_test("Population Data", success, details, 200, response.status_code)
            return success
        except Exception as e:
            self.log_test("Population Data", False, f"Exception: {str(e)}")
            return False

    def test_infrastructure_data(self):
        """Test /api/infrastructure endpoint"""
        try:
            response = requests.get(f"{self.api_url}/infrastructure", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                regions_data = data.get('ukraine_infrastructure', {}).get('regions', [])
                details += f", Infrastructure data regions: {len(regions_data)}"
                if len(regions_data) > 0:
                    sample = regions_data[0]
                    details += f", Sample: {sample.get('region')} - accessibility: {sample.get('transport_accessibility', {}).get('accessibility_score', 'N/A')}"
            
            self.log_test("Infrastructure Data", success, details, 200, response.status_code)
            return success
        except Exception as e:
            self.log_test("Infrastructure Data", False, f"Exception: {str(e)}")
            return False

    def test_protected_areas_data(self):
        """Test /api/protected-areas endpoint"""
        try:
            response = requests.get(f"{self.api_url}/protected-areas", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                regions_data = data.get('ukraine_protected_areas', {}).get('regions', [])
                details += f", Protected areas data regions: {len(regions_data)}"
                if len(regions_data) > 0:
                    sample = regions_data[0]
                    protected_areas = sample.get('protected_areas', {})
                    details += f", Sample: {sample.get('region')} - national parks: {protected_areas.get('national_parks', 0)}"
            
            self.log_test("Protected Areas Data", success, details, 200, response.status_code)
            return success
        except Exception as e:
            self.log_test("Protected Areas Data", False, f"Exception: {str(e)}")
            return False

    def test_recommended_zones(self):
        """Test /api/recommended-zones endpoint - COMPREHENSIVE 7-FACTOR MODEL TESTING"""
        try:
            response = requests.get(f"{self.api_url}/recommended-zones", timeout=30)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if not success:
                self.log_test("Recommended Zones API", False, f"HTTP Error: {response.status_code}", 200, response.status_code)
                return False, {}
            
            data = response.json()
            zones = data.get('zones', [])
            details += f", Total zones: {len(zones)}"
            
            if len(zones) == 0:
                self.log_test("Recommended Zones API", False, "No zones returned (empty array)", 200, response.status_code)
                return False, {}
            
            # ====== TEST 1: Zone Types & Distribution ======
            zone_types = [zone.get('type') for zone in zones]
            type_counts = {
                'near_pfz': zone_types.count('near_pfz'),
                'roadside': zone_types.count('roadside'), 
                'fire_prevention': zone_types.count('fire_prevention')
            }
            
            has_all_types = all(count > 0 for count in type_counts.values())
            details += f" | Types: near_pfz={type_counts['near_pfz']}, roadside={type_counts['roadside']}, fire_prevention={type_counts['fire_prevention']}"
            
            if not has_all_types:
                missing_types = [t for t, c in type_counts.items() if c == 0]
                details += f" ✗ Missing zone types: {missing_types}"
                success = False
            else:
                details += " ✓ All 3 zone types present"
            
            # ====== TEST 2: 7-Factor Priority Calculation ======
            # Check if zones are sorted by priority (descending)
            priorities = [zone.get('priority', 0) for zone in zones]
            is_sorted = all(priorities[i] >= priorities[i+1] for i in range(len(priorities)-1))
            
            # Check priority range (0-100)
            priority_range_valid = all(0 <= p <= 100 for p in priorities)
            
            # Check for reasonable priority distribution
            high_priority = sum(1 for p in priorities if p >= 70)
            medium_priority = sum(1 for p in priorities if 50 <= p < 70)
            low_priority = sum(1 for p in priorities if p < 50)
            
            details += f" | Priority: sorted={is_sorted}, range_valid={priority_range_valid}"
            details += f", high={high_priority}, med={medium_priority}, low={low_priority}"
            
            if not (is_sorted and priority_range_valid):
                details += " ✗ Priority calculation issues"
                success = False
            else:
                details += " ✓ Priority calculation valid"
            
            # ====== TEST 3: Fire Prevention Zones Specific Tests ======
            fire_zones = [z for z in zones if z.get('type') == 'fire_prevention']
            fire_zones_valid = True
            
            for fire_zone in fire_zones[:3]:  # Test first 3 fire zones
                # Check fire_cluster_size field exists and ≥3
                fire_cluster_size = fire_zone.get('fire_cluster_size')
                if fire_cluster_size is None or fire_cluster_size < 3:
                    fire_zones_valid = False
                    break
                
                # Check reasoning mentions fire statistics
                reasoning_text = ' '.join(fire_zone.get('reasoning', {}).values()).lower()
                if 'пожеж' not in reasoning_text and 'fire' not in reasoning_text.lower():
                    fire_zones_valid = False
                    break
                
                # Check special fire safety facilities
                facilities = fire_zone.get('recommended_facilities', [])
                facilities_text = ' '.join(facilities).lower()
                required_fire_facilities = [
                    'безпечними вогнищами',
                    'пожежної безпеки', 
                    'джерело води'
                ]
                
                has_fire_facilities = any(req in facilities_text for req in required_fire_facilities)
                if not has_fire_facilities:
                    fire_zones_valid = False
                    break
            
            if fire_zones_valid and fire_zones:
                details += " ✓ Fire prevention zones valid"
            elif fire_zones:
                details += " ✗ Fire prevention zones invalid"
                success = False
            else:
                details += " ⚠ No fire prevention zones to test"
            
            # ====== TEST 4: Near PFZ Zones Specific Tests ======
            near_pfz_zones = [z for z in zones if z.get('type') == 'near_pfz']
            near_pfz_valid = True
            
            for pfz_zone in near_pfz_zones[:3]:  # Test first 3 near_pfz zones
                # Check pfz_object field is present
                if not pfz_zone.get('pfz_object'):
                    near_pfz_valid = False
                    break
                
                # Check distance_from_pfz is set (not null)
                if pfz_zone.get('distance_from_pfz') is None:
                    near_pfz_valid = False
                    break
                
                # Check reasoning mentions visitor estimates
                reasoning_text = ' '.join(pfz_zone.get('reasoning', {}).values())
                has_visitor_estimate = any(num in reasoning_text for num in ['відвідувачів', '30,000', '15,000'])
                if not has_visitor_estimate:
                    near_pfz_valid = False
                    break
                
                # Check eco-tourism facilities
                facilities = pfz_zone.get('recommended_facilities', [])
                facilities_text = ' '.join(facilities).lower()
                required_eco_facilities = ['екологічний готель', 'інформаційний центр']
                
                has_eco_facilities = any(req in facilities_text for req in required_eco_facilities)
                if not has_eco_facilities:
                    near_pfz_valid = False
                    break
            
            if near_pfz_valid and near_pfz_zones:
                details += " ✓ Near PFZ zones valid"
            elif near_pfz_zones:
                details += " ✗ Near PFZ zones invalid"
                success = False
            else:
                details += " ⚠ No near PFZ zones to test"
            
            # ====== TEST 5: Roadside Zones Specific Tests ======
            roadside_zones = [z for z in zones if z.get('type') == 'roadside']
            roadside_valid = True
            
            for road_zone in roadside_zones[:3]:  # Test first 3 roadside zones
                # Check distance_from_pfz is null
                if road_zone.get('distance_from_pfz') is not None:
                    roadside_valid = False
                    break
                
                # Check pfz_object is null
                if road_zone.get('pfz_object') is not None:
                    roadside_valid = False
                    break
                
                # Check reasoning mentions road traffic
                reasoning_text = ' '.join(road_zone.get('reasoning', {}).values())
                has_traffic_info = any(term in reasoning_text for term in ['авто/день', 'траса', '5,000+', '3,000+'])
                if not has_traffic_info:
                    roadside_valid = False
                    break
                
                # Check roadside facilities
                facilities = road_zone.get('recommended_facilities', [])
                facilities_text = ' '.join(facilities).lower()
                required_road_facilities = ['мотель', 'стоянка']
                
                has_road_facilities = any(req in facilities_text for req in required_road_facilities)
                if not has_road_facilities:
                    roadside_valid = False
                    break
            
            if roadside_valid and roadside_zones:
                details += " ✓ Roadside zones valid"
            elif roadside_zones:
                details += " ✗ Roadside zones invalid"
                success = False
            else:
                details += " ⚠ No roadside zones to test"
            
            # ====== TEST 6: Reasoning Structure ======
            reasoning_valid = True
            emoji_indicators = ['🌲', '🚗', '🔥', '📊', '🏗️']
            
            for zone in zones[:5]:  # Test first 5 zones
                reasoning = zone.get('reasoning', {})
                
                # Check 3-point structure
                if not all(key in reasoning for key in ['point1', 'point2', 'point3']):
                    reasoning_valid = False
                    break
                
                # Check for emoji indicators
                reasoning_text = ' '.join(reasoning.values())
                has_emojis = any(emoji in reasoning_text for emoji in emoji_indicators)
                if not has_emojis:
                    reasoning_valid = False
                    break
            
            if reasoning_valid:
                details += " ✓ Reasoning structure valid"
            else:
                details += " ✗ Reasoning structure invalid"
                success = False
            
            # ====== TEST 7: Data Integrity ======
            data_integrity_valid = True
            integrity_issues = []
            
            for zone in zones[:10]:  # Test first 10 zones
                # Check coordinates within Ukraine bounds
                coords = zone.get('coordinates', [])
                if len(coords) != 2:
                    integrity_issues.append(f"Invalid coordinates format: {zone.get('name')}")
                    data_integrity_valid = False
                    break
                
                lat, lng = coords
                if not (44 <= lat <= 52 and 21.5 <= lng <= 40.5):
                    integrity_issues.append(f"Coordinates out of Ukraine bounds: {zone.get('name')} ({lat}, {lng})")
                    data_integrity_valid = False
                    break
                
                # Check infrastructure distances are positive
                infrastructure = zone.get('infrastructure', {})
                distances = [
                    infrastructure.get('hospital_distance', 0),
                    infrastructure.get('gas_station_distance', 0),
                    infrastructure.get('shop_distance', 0)
                ]
                
                if not all(isinstance(d, (int, float)) and d > 0 for d in distances):
                    integrity_issues.append(f"Invalid infrastructure distances: {zone.get('name')}")
                    data_integrity_valid = False
                    break
                
                # Check investment and payback strings are formatted
                investment = zone.get('investment', '')
                payback = zone.get('payback', '')
                if not (investment and payback and '$' in investment):
                    integrity_issues.append(f"Invalid investment/payback format: {zone.get('name')}")
                    data_integrity_valid = False
                    break
            
            if data_integrity_valid:
                details += " ✓ Data integrity valid"
            else:
                details += f" ✗ Data integrity issues: {integrity_issues[:2]}"
                success = False
            
            # ====== SUMMARY STATISTICS ======
            if zones:
                avg_priority = sum(priorities) / len(priorities)
                max_priority = max(priorities)
                min_priority = min(priorities)
                details += f" | Stats: avg={avg_priority:.1f}, max={max_priority}, min={min_priority}"
                
                # Sample zone info
                sample_zone = zones[0]
                details += f" | Top zone: {sample_zone.get('name', 'Unknown')} ({sample_zone.get('type')}, {sample_zone.get('priority')})"
            
            self.log_test("Recommended Zones - 7-Factor Model", success, details, 200, response.status_code)
            return success, data
            
        except Exception as e:
            self.log_test("Recommended Zones - 7-Factor Model", False, f"Exception: {str(e)}")
            return False, {}

    def test_seven_factor_priority_model(self):
        """CRITICAL TEST: Verify 7-factor priority calculation is actually being used"""
        try:
            response = requests.get(f"{self.api_url}/recommended-zones", timeout=30)
            if response.status_code != 200:
                self.log_test("7-Factor Priority Model Verification", False, f"API Error: {response.status_code}")
                return False
            
            data = response.json()
            zones = data.get('zones', [])
            
            if not zones:
                self.log_test("7-Factor Priority Model Verification", False, "No zones to analyze")
                return False
            
            success = True
            details = f"Analyzing {len(zones)} zones for 7-factor model compliance"
            
            # ====== CRITICAL: Verify 7 factors are reflected in reasoning ======
            factor_indicators = {
                'demand': ['попит', 'demand', 'відвідувачів'],
                'pfz_attractor': ['пзф', 'pfz', 'національний', 'заповідник', 'траса', 'кластер'],
                'nature': ['природа', 'nature', 'ліс', 'forest'],
                'transport': ['транспорт', 'transport', 'accessibility', 'доступність'],
                'infrastructure': ['інфраструктура', 'infrastructure', 'лікарня', 'заправка'],
                'fires': ['пожеж', 'fire', 'вогню', 'безпек'],
                'saturation': ['конкуренція', 'competition', 'насиченість', 'р.п.']
            }
            
            factor_coverage = {factor: 0 for factor in factor_indicators.keys()}
            
            # Analyze reasoning for factor mentions
            for zone in zones[:10]:  # Check first 10 zones
                reasoning_text = ' '.join(zone.get('reasoning', {}).values()).lower()
                
                for factor, keywords in factor_indicators.items():
                    if any(keyword in reasoning_text for keyword in keywords):
                        factor_coverage[factor] += 1
            
            # Check if all 7 factors are represented across zones
            missing_factors = [f for f, count in factor_coverage.items() if count == 0]
            covered_factors = len([f for f, count in factor_coverage.items() if count > 0])
            
            details += f" | Factor coverage: {covered_factors}/7 factors found"
            details += f" | Factor mentions: {dict(factor_coverage)}"
            
            if missing_factors:
                details += f" ✗ Missing factors in reasoning: {missing_factors}"
                success = False
            else:
                details += " ✓ All 7 factors represented in reasoning"
            
            # ====== Verify priority ranges match expected 7-factor calculation ======
            priorities = [zone.get('priority', 0) for zone in zones]
            
            # Expected ranges based on 7-factor model:
            # Base(50) + Demand(0-25) + Attractor(0-20) + Nature(0-15) + Transport(0-15) + Infrastructure(0-10) + Fires(0-5) + Saturation(0 to -15)
            # Theoretical range: 50 + 0 + 0 + 0 + 0 + 0 + 0 + (-15) = 35 minimum
            # Theoretical range: 50 + 25 + 20 + 15 + 15 + 10 + 5 + 0 = 140 maximum (capped at 100)
            
            realistic_min = 35  # Very low scoring zone
            realistic_max = 100  # Capped maximum
            
            priorities_in_range = all(realistic_min <= p <= realistic_max for p in priorities)
            
            if not priorities_in_range:
                out_of_range = [p for p in priorities if not (realistic_min <= p <= realistic_max)]
                details += f" ✗ Priorities out of expected range: {out_of_range[:5]}"
                success = False
            else:
                details += f" ✓ Priorities in expected range ({realistic_min}-{realistic_max})"
            
            # ====== Check for priority diversity (not all same values) ======
            unique_priorities = len(set(priorities))
            priority_diversity = unique_priorities / len(priorities) if priorities else 0
            
            if priority_diversity < 0.3:  # Less than 30% unique values suggests simple calculation
                details += f" ✗ Low priority diversity ({priority_diversity:.2f}) - may indicate simple calculation"
                success = False
            else:
                details += f" ✓ Good priority diversity ({priority_diversity:.2f})"
            
            # ====== Verify zone-specific priority logic ======
            zone_type_priorities = {}
            for zone in zones:
                zone_type = zone.get('type')
                priority = zone.get('priority', 0)
                if zone_type not in zone_type_priorities:
                    zone_type_priorities[zone_type] = []
                zone_type_priorities[zone_type].append(priority)
            
            # Calculate average priorities by type
            avg_priorities = {}
            for zone_type, prios in zone_type_priorities.items():
                avg_priorities[zone_type] = sum(prios) / len(prios) if prios else 0
            
            details += f" | Avg priorities by type: {avg_priorities}"
            
            # Fire prevention zones should generally have decent priorities due to fire factor
            if 'fire_prevention' in avg_priorities and avg_priorities['fire_prevention'] < 50:
                details += " ⚠ Fire prevention zones have unexpectedly low priorities"
            
            self.log_test("7-Factor Priority Model Verification", success, details)
            return success
            
        except Exception as e:
            self.log_test("7-Factor Priority Model Verification", False, f"Exception: {str(e)}")
            return False

    def test_fire_coordinates_verification(self):
        """
        CRITICAL TEST: Verify FIXED fire coordinates in /api/recommended-zones
        Ensures fire_prevention zones are NOT in water bodies (Dnipro river, reservoirs)
        """
        try:
            # Test forest fires metadata first
            fires_response = requests.get(f"{self.api_url}/forest-fires", timeout=15)
            if fires_response.status_code != 200:
                self.log_test("Fire Coordinates - Forest Fires API", False, f"Forest fires API failed: {fires_response.status_code}")
                return False
            
            fires_data = fires_response.json()
            total_fires = len(fires_data.get('features', []))
            human_fires = len([f for f in fires_data.get('features', []) if f.get('properties', {}).get('cause_type') == "людський фактор"])
            
            # Test recommended zones
            zones_response = requests.get(f"{self.api_url}/recommended-zones", timeout=30)
            if zones_response.status_code != 200:
                self.log_test("Fire Coordinates - Zones API", False, f"Zones API failed: {zones_response.status_code}")
                return False
            
            zones_data = zones_response.json()
            zones = zones_data.get('zones', [])
            
            success = True
            details = f"Forest fires: {total_fires} total, {human_fires} human-caused"
            
            # ====== TEST 1: Fire Prevention Zones Count ======
            fire_zones = [z for z in zones if z.get('type') == 'fire_prevention']
            details += f" | Fire prevention zones: {len(fire_zones)}"
            
            if len(fire_zones) < 30:  # Should be around 34, but allow some variance
                details += f" ✗ Expected ~34 fire prevention zones, got {len(fire_zones)}"
                success = False
            else:
                details += " ✓ Fire prevention zones count acceptable"
            
            # ====== TEST 2: Total Zones Count ======
            total_zones = len(zones)
            details += f" | Total zones: {total_zones}"
            
            if total_zones < 95:  # Should be ~101, allow some variance
                details += f" ✗ Expected ~101 total zones, got {total_zones}"
                success = False
            else:
                details += " ✓ Total zones count acceptable"
            
            # ====== TEST 3: Zone Type Distribution ======
            zone_types = {}
            for zone in zones:
                zone_type = zone.get('type')
                zone_types[zone_type] = zone_types.get(zone_type, 0) + 1
            
            details += f" | Distribution: {zone_types}"
            
            # ====== TEST 4: Kyiv Region Critical Check ======
            kyiv_fire_zones = [z for z in fire_zones if z.get('region') == 'Київська область']
            details += f" | Kyiv fire zones: {len(kyiv_fire_zones)}"
            
            kyiv_coords_valid = True
            water_body_issues = []
            
            for zone in kyiv_fire_zones:
                coords = zone.get('coordinates', [])
                if len(coords) != 2:
                    continue
                
                lat, lng = coords
                zone_name = zone.get('name', 'Unknown')
                
                # Check if coordinates are in expected forest areas (NOT in Dnipro river)
                # Dnipro river runs roughly through Kyiv at lng ~30.5, lat ~50.4
                # Eastern forests: lng ~30.85, lat ~50.56 (Brovary district)
                # Western forests: lng ~30.30, lat ~50.65 (Makariv district)
                
                # Flag potential water body coordinates
                # Dnipro river corridor: lng 30.4-30.6, lat 50.3-50.5
                in_dnipro_corridor = (30.4 <= lng <= 30.6 and 50.3 <= lat <= 50.5)
                
                # Kyiv reservoir area: lng 30.4-30.7, lat 50.5-50.6
                in_reservoir_area = (30.4 <= lng <= 30.7 and 50.5 <= lat <= 50.6)
                
                if in_dnipro_corridor or in_reservoir_area:
                    water_body_issues.append(f"{zone_name}: ({lat:.3f}, {lng:.3f})")
                    kyiv_coords_valid = False
                
                # Verify fire_cluster_size ≥ 3
                fire_cluster_size = zone.get('fire_cluster_size', 0)
                if fire_cluster_size < 3:
                    details += f" ✗ {zone_name} has fire_cluster_size={fire_cluster_size} < 3"
                    success = False
            
            if not kyiv_coords_valid:
                details += f" ✗ CRITICAL: Kyiv zones in water bodies: {water_body_issues}"
                success = False
            else:
                details += " ✓ Kyiv fire zones coordinates look valid (not in water)"
            
            # ====== TEST 5: Sample Other Regions ======
            test_regions = ['Львівська область', 'Одеська область', 'Харківська область']
            region_coord_issues = []
            
            for region in test_regions:
                region_fire_zones = [z for z in fire_zones if z.get('region') == region]
                
                for zone in region_fire_zones[:2]:  # Check first 2 zones per region
                    coords = zone.get('coordinates', [])
                    if len(coords) != 2:
                        continue
                    
                    lat, lng = coords
                    zone_name = zone.get('name', 'Unknown')
                    
                    # Basic coordinate validation for Ukraine
                    if not (44 <= lat <= 52 and 21.5 <= lng <= 40.5):
                        region_coord_issues.append(f"{region}: {zone_name} out of Ukraine bounds")
                        success = False
                    
                    # Region-specific water body checks
                    if region == 'Одеська область':
                        # Check not in Black Sea (south of lat 46.0)
                        if lat < 46.0:
                            region_coord_issues.append(f"{region}: {zone_name} possibly in Black Sea")
                            success = False
                    
                    elif region == 'Львівська область':
                        # Check reasonable coordinates for Lviv region
                        if not (49.0 <= lat <= 50.5 and 23.0 <= lng <= 25.5):
                            region_coord_issues.append(f"{region}: {zone_name} outside expected region bounds")
                            success = False
            
            if region_coord_issues:
                details += f" ✗ Regional coordinate issues: {region_coord_issues[:3]}"
                success = False
            else:
                details += " ✓ Sample regional coordinates look reasonable"
            
            # ====== TEST 6: Forest Fires Metadata Verification ======
            metadata = fires_data.get('metadata', {})
            
            # Check total fires count
            if total_fires < 1800:  # Should be 1875
                details += f" ✗ Expected ~1875 total fires, got {total_fires}"
                success = False
            else:
                details += f" ✓ Total fires count acceptable ({total_fires})"
            
            # Check human-caused fires count
            if human_fires < 600:  # Should be 649
                details += f" ✗ Expected ~649 human fires, got {human_fires}"
                success = False
            else:
                details += f" ✓ Human fires count acceptable ({human_fires})"
            
            # Check metadata note about realistic coordinates
            metadata_note = str(metadata.get('note', '')).lower()
            if 'реалістичними координатами' in metadata_note or 'лісових масивах' in metadata_note:
                details += " ✓ Metadata mentions realistic forest coordinates"
            else:
                details += " ⚠ Metadata doesn't mention realistic coordinates"
            
            self.log_test("CRITICAL: Fire Coordinates Verification", success, details)
            return success
            
        except Exception as e:
            self.log_test("CRITICAL: Fire Coordinates Verification", False, f"Exception: {str(e)}")
            return False

    def test_invalid_region(self):
        """Test analysis with invalid region name"""
        try:
            response = requests.get(f"{self.api_url}/analyze/NonExistentRegion", timeout=10)
            success = response.status_code == 404
            details = f"Status: {response.status_code}"
            
            if response.status_code == 404:
                details += " - Correctly returns 404 for invalid region"
            else:
                details += f" - Expected 404, got {response.status_code}"
            
            self.log_test("Invalid Region Handling", success, details, 404, response.status_code)
            return success
        except Exception as e:
            self.log_test("Invalid Region Handling", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run all tests"""
        print("🚀 Starting GIS Recreational Potential Analysis API Tests")
        print(f"🌐 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Test basic connectivity
        self.test_api_root()
        
        # Test data endpoints
        self.test_population_data()
        self.test_infrastructure_data()
        self.test_protected_areas_data()
        
        # Test main functionality
        regions_success, regions_data = self.test_get_regions()
        self.test_get_recreational_points()
        
        # Test analysis endpoints
        if regions_success and regions_data.get('regions'):
            # Test with first available region
            first_region = regions_data['regions'][0]
            self.test_analyze_region(first_region)
            
            # Test with a few more regions if available
            regions_list = regions_data['regions']
            if len(regions_list) > 1:
                self.test_analyze_region(regions_list[1])
            if len(regions_list) > 2:
                self.test_analyze_region(regions_list[2])
        else:
            # Fallback test with known region
            self.test_analyze_region("Київська область")
        
        self.test_analyze_all_regions()
        
        # Test recommended zones endpoint (as specifically requested)
        self.test_recommended_zones()
        
        # CRITICAL: Test 7-factor priority model verification
        self.test_seven_factor_priority_model()
        
        # CRITICAL: Test FIXED fire coordinates verification
        self.test_fire_coordinates_verification()
        
        # Test error handling
        self.test_invalid_region()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {len(self.failed_tests)}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}: {failure['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = GISAPITester()
    success = tester.run_comprehensive_test()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "failed_tests": len(tester.failed_tests),
        "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
        "test_details": tester.test_results,
        "failures": tester.failed_tests
    }
    
    with open('/app/backend_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())