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
    def __init__(self, base_url="https://vidkriy.preview.emergentagent.com"):
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
        """Test /api/recommended-zones endpoint - comprehensive testing as requested"""
        try:
            response = requests.get(f"{self.api_url}/recommended-zones", timeout=20)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                zones = data.get('zones', [])
                details += f", Zones count: {len(zones)}"
                
                if len(zones) == 0:
                    success = False
                    details += " - No zones returned (empty array)"
                else:
                    # Test 1: Basic structure - zones field with array
                    details += " ✓ Has zones array"
                    
                    # Test 2: Check zone structure and required fields
                    required_fields = [
                        'id', 'type', 'name', 'region', 'coordinates', 'priority', 
                        'reasoning', 'recommended_facilities', 'infrastructure',
                        'legal_status', 'recommended_type', 'capacity', 'investment', 
                        'payback', 'competitors_nearby'
                    ]
                    
                    zone_structure_valid = True
                    missing_fields_summary = []
                    
                    for i, zone in enumerate(zones[:3]):  # Check first 3 zones
                        missing_fields = [field for field in required_fields if field not in zone]
                        if missing_fields:
                            zone_structure_valid = False
                            missing_fields_summary.extend(missing_fields)
                    
                    if zone_structure_valid:
                        details += " ✓ All required fields present"
                    else:
                        details += f" ✗ Missing fields: {set(missing_fields_summary)}"
                        success = False
                    
                    # Test 3: Check zone types (near_pfz and roadside)
                    zone_types = [zone.get('type') for zone in zones]
                    has_near_pfz = 'near_pfz' in zone_types
                    has_roadside = 'roadside' in zone_types
                    
                    details += f" | Zone types: near_pfz={has_near_pfz}, roadside={has_roadside}"
                    
                    # Test 4: Check priority values (0-100)
                    priority_valid = True
                    for zone in zones:
                        priority = zone.get('priority', 0)
                        if not isinstance(priority, (int, float)) or not (0 <= priority <= 100):
                            priority_valid = False
                            break
                    
                    if priority_valid:
                        details += " ✓ Priority values valid (0-100)"
                    else:
                        details += " ✗ Invalid priority values"
                        success = False
                    
                    # Test 5: Check reasoning structure (point1, point2, point3)
                    reasoning_valid = True
                    for zone in zones[:2]:  # Check first 2 zones
                        reasoning = zone.get('reasoning', {})
                        if not all(key in reasoning for key in ['point1', 'point2', 'point3']):
                            reasoning_valid = False
                            break
                    
                    if reasoning_valid:
                        details += " ✓ Reasoning structure valid"
                    else:
                        details += " ✗ Invalid reasoning structure"
                        success = False
                    
                    # Test 6: Check infrastructure structure
                    infra_fields = [
                        'hospital_distance', 'gas_station_distance', 'shop_distance',
                        'mobile_coverage', 'nearest_road', 'road_quality'
                    ]
                    
                    infra_valid = True
                    for zone in zones[:2]:  # Check first 2 zones
                        infrastructure = zone.get('infrastructure', {})
                        missing_infra = [field for field in infra_fields if field not in infrastructure]
                        if missing_infra:
                            infra_valid = False
                            break
                        
                        # Check numeric values > 0 for distances
                        hospital_dist = infrastructure.get('hospital_distance', 0)
                        gas_dist = infrastructure.get('gas_station_distance', 0)
                        shop_dist = infrastructure.get('shop_distance', 0)
                        mobile_cov = infrastructure.get('mobile_coverage', 0)
                        
                        if not (hospital_dist > 0 and gas_dist > 0 and shop_dist > 0):
                            infra_valid = False
                            break
                        
                        if not (0 <= mobile_cov <= 100):
                            infra_valid = False
                            break
                        
                        # Check road name is not empty
                        nearest_road = infrastructure.get('nearest_road', '')
                        road_quality = infrastructure.get('road_quality', '')
                        if not nearest_road or not road_quality:
                            infra_valid = False
                            break
                    
                    if infra_valid:
                        details += " ✓ Infrastructure data valid"
                    else:
                        details += " ✗ Invalid infrastructure data"
                        success = False
                    
                    # Test 7: Check recommended facilities (4-5 elements)
                    facilities_valid = True
                    for zone in zones[:2]:
                        facilities = zone.get('recommended_facilities', [])
                        if not (4 <= len(facilities) <= 5):
                            facilities_valid = False
                            break
                    
                    if facilities_valid:
                        details += " ✓ Recommended facilities count valid (4-5)"
                    else:
                        details += " ✗ Invalid recommended facilities count"
                        success = False
                    
                    # Test 8: Check zone-specific requirements
                    zone_specific_valid = True
                    for zone in zones[:3]:
                        zone_type = zone.get('type')
                        facilities = zone.get('recommended_facilities', [])
                        
                        if zone_type == 'near_pfz':
                            # Should have distance_from_pfz and pfz_object
                            if zone.get('distance_from_pfz') is None or zone.get('pfz_object') is None:
                                zone_specific_valid = False
                                break
                            # Should contain eco-related facilities
                            facilities_text = ' '.join(facilities).lower()
                            if 'екологічний готель' not in facilities_text and 'інформаційний центр' not in facilities_text:
                                zone_specific_valid = False
                                break
                        
                        elif zone_type == 'roadside':
                            # distance_from_pfz should be null
                            if zone.get('distance_from_pfz') is not None:
                                zone_specific_valid = False
                                break
                            # Should contain roadside facilities
                            facilities_text = ' '.join(facilities).lower()
                            if 'мотель' not in facilities_text and 'стоянка' not in facilities_text:
                                zone_specific_valid = False
                                break
                    
                    if zone_specific_valid:
                        details += " ✓ Zone-specific requirements met"
                    else:
                        details += " ✗ Zone-specific requirements not met"
                        success = False
                    
                    # Test 9: Check coordinates are in Ukraine range
                    coords_valid = True
                    invalid_coords = []
                    for zone in zones:
                        coords = zone.get('coordinates', [])
                        if len(coords) != 2:
                            coords_valid = False
                            invalid_coords.append(f"{zone.get('name', 'Unknown')}: invalid format")
                            break
                        lat, lng = coords
                        # Ukraine approximate bounds: lat 44-52, lng 22-40
                        if not (44 <= lat <= 52 and 22 <= lng <= 40):
                            coords_valid = False
                            invalid_coords.append(f"{zone.get('name', 'Unknown')}: lat={lat}, lng={lng}")
                            break
                    
                    if coords_valid:
                        details += " ✓ Coordinates within Ukraine bounds"
                    else:
                        details += f" ✗ Invalid coordinates: {invalid_coords[:2]}"
                        success = False
                    
                    # Additional info for debugging
                    if zones:
                        sample_zone = zones[0]
                        details += f" | Sample zone: {sample_zone.get('name', 'Unknown')} (type: {sample_zone.get('type')}, priority: {sample_zone.get('priority')})"
            
            self.log_test("Recommended Zones API", success, details, 200, response.status_code)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("Recommended Zones API", False, f"Exception: {str(e)}")
            return False, {}

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