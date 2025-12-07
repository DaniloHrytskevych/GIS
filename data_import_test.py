#!/usr/bin/env python3
"""
Data Import API Testing for GIS Recreational Potential Analysis System
Tests all data import endpoints with strict validation
"""

import requests
import json
import sys
import tempfile
import os
from datetime import datetime

class DataImportTester:
    def __init__(self, base_url="https://calc-data-export.preview.emergentagent.com"):
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

    def test_data_status_endpoint(self):
        """Test GET /api/data-status returns correct structure"""
        try:
            response = requests.get(f"{self.api_url}/data-status", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                
                # Check all 5 data types are present
                required_types = ['population_data', 'infrastructure_data', 'protected_areas', 'recreational_points', 'forest_fires']
                missing_types = [t for t in required_types if t not in data]
                
                if missing_types:
                    success = False
                    details += f", Missing data types: {missing_types}"
                else:
                    details += ", All 5 data types present"
                
                # Check loaded status and counts
                if success:
                    pop_count = data.get('population_data', {}).get('regions_count', 0)
                    infra_count = data.get('infrastructure_data', {}).get('regions_count', 0)
                    pfz_count = data.get('protected_areas', {}).get('regions_count', 0)
                    rec_count = data.get('recreational_points', {}).get('points_count', 0)
                    fire_total = data.get('forest_fires', {}).get('total_fires', 0)
                    fire_human = data.get('forest_fires', {}).get('human_caused', 0)
                    
                    details += f", Counts: pop={pop_count}, infra={infra_count}, pfz={pfz_count}, rec={rec_count}, fires={fire_total}({fire_human} human)"
                    
                    # Verify expected counts
                    if pop_count != 24 or infra_count != 24 or pfz_count != 24:
                        details += f" ✗ Expected 24 regions for first 3 types"
                        success = False
                    
                    if rec_count < 700:  # Should be around 780
                        details += f" ✗ Expected ~780 recreational points"
                        success = False
                    
                    if fire_total < 1800:  # Should be 1875
                        details += f" ✗ Expected ~1875 total fires"
                        success = False
                    
                    if fire_human < 600:  # Should be 649
                        details += f" ✗ Expected ~649 human-caused fires"
                        success = False
                    
                    # Check loaded status
                    all_loaded = all(
                        data.get(dt, {}).get('loaded', False) 
                        for dt in required_types
                    )
                    
                    if not all_loaded:
                        details += " ✗ Not all data types loaded"
                        success = False
                    else:
                        details += " ✓ All data loaded"
            
            self.log_test("Data Status Endpoint", success, details, 200, response.status_code)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("Data Status Endpoint", False, f"Exception: {str(e)}")
            return False, {}

    def create_valid_population_data(self):
        """Create valid population data for testing"""
        return {
            "ukraine_regions_data": [
                {
                    "name": f"Тестова область {i+1}",
                    "population": 1000000 + i * 100000,
                    "area_km2": 20000.0 + i * 1000,
                    "forest_coverage_percent": 25.5 + i,
                    "has_water_bodies": i % 2 == 0
                }
                for i in range(24)
            ]
        }

    def create_invalid_population_data(self):
        """Create invalid population data (23 regions instead of 24)"""
        return {
            "ukraine_regions_data": [
                {
                    "name": f"Тестова область {i+1}",
                    "population": 1000000 + i * 100000,
                    "area_km2": 20000.0 + i * 1000,
                    "forest_coverage_percent": 25.5 + i,
                    "has_water_bodies": i % 2 == 0
                }
                for i in range(23)  # Only 23 regions - should fail validation
            ]
        }

    def test_population_data_import(self):
        """Test POST /api/import/population-data with valid and invalid data"""
        # Test 1: Valid data
        try:
            valid_data = self.create_valid_population_data()
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(valid_data, f, ensure_ascii=False, indent=2)
                temp_file = f.name
            
            # Upload file
            with open(temp_file, 'rb') as f:
                files = {'file': ('population_data.json', f, 'application/json')}
                response = requests.post(f"{self.api_url}/import/population-data", files=files, timeout=15)
            
            os.unlink(temp_file)
            
            success = response.status_code == 200
            details = f"Valid data - Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get('success') and data.get('regions_count') == 24:
                    details += f", Success: {data.get('message')}, Regions: {data.get('regions_count')}"
                else:
                    success = False
                    details += f", Unexpected response: {data}"
            
            self.log_test("Population Import - Valid Data", success, details, 200, response.status_code)
            
        except Exception as e:
            self.log_test("Population Import - Valid Data", False, f"Exception: {str(e)}")
        
        # Test 2: Invalid data (23 regions)
        try:
            invalid_data = self.create_invalid_population_data()
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(invalid_data, f, ensure_ascii=False, indent=2)
                temp_file = f.name
            
            with open(temp_file, 'rb') as f:
                files = {'file': ('invalid_population.json', f, 'application/json')}
                response = requests.post(f"{self.api_url}/import/population-data", files=files, timeout=15)
            
            os.unlink(temp_file)
            
            success = response.status_code == 400
            details = f"Invalid data (23 regions) - Status: {response.status_code}"
            
            if success:
                data = response.json()
                if "24 regions" in str(data.get('detail', '')):
                    details += f", Correct validation error: {data.get('detail')}"
                else:
                    details += f", Unexpected error message: {data.get('detail')}"
            else:
                details += f", Expected 400 error for invalid data"
            
            self.log_test("Population Import - Invalid Data", success, details, 400, response.status_code)
            
        except Exception as e:
            self.log_test("Population Import - Invalid Data", False, f"Exception: {str(e)}")

    def create_valid_infrastructure_data(self):
        """Create valid infrastructure data for testing"""
        return {
            "ukraine_infrastructure": {
                "regions": [
                    {
                        "region": f"Тестова область {i+1}",
                        "transport_accessibility": {
                            "accessibility_score": 7.5 + i * 0.1,
                            "highway_density_km_per_1000km2": 200.0 + i * 10,
                            "main_roads": [
                                {"name": f"М-{i+1}", "type": "міжнародна", "quality": "добра"}
                            ],
                            "railway_stations": 15 + i,
                            "airports": 1 if i < 5 else 0,
                            "average_travel_time_to_major_city_minutes": 60 + i * 5
                        },
                        "anthropogenic_infrastructure": {
                            "hospitals_per_100k": 4.5 + i * 0.1,
                            "gas_stations_per_100km2": 0.8 + i * 0.05,
                            "mobile_coverage_percent": 95.0 + i * 0.1,
                            "internet_coverage_percent": 85.0 + i * 0.5,
                            "hotels_total": 100 + i * 10,
                            "electricity_reliability": "висока" if i % 2 == 0 else "середня"
                        }
                    }
                    for i in range(24)
                ]
            }
        }

    def test_infrastructure_data_import(self):
        """Test POST /api/import/infrastructure-data"""
        try:
            valid_data = self.create_valid_infrastructure_data()
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(valid_data, f, ensure_ascii=False, indent=2)
                temp_file = f.name
            
            with open(temp_file, 'rb') as f:
                files = {'file': ('infrastructure_data.json', f, 'application/json')}
                response = requests.post(f"{self.api_url}/import/infrastructure-data", files=files, timeout=15)
            
            os.unlink(temp_file)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get('success') and data.get('regions_count') == 24:
                    details += f", Success: {data.get('message')}, Regions: {data.get('regions_count')}"
                else:
                    success = False
                    details += f", Unexpected response: {data}"
            
            self.log_test("Infrastructure Import", success, details, 200, response.status_code)
            
        except Exception as e:
            self.log_test("Infrastructure Import", False, f"Exception: {str(e)}")

    def create_valid_protected_areas_data(self):
        """Create valid protected areas data for testing"""
        return {
            "ukraine_protected_areas": {
                "regions": [
                    {
                        "region": f"Тестова область {i+1}",
                        "protected_areas": {
                            "national_parks": 1 if i < 10 else 0,
                            "nature_reserves": 2 + i % 3,
                            "regional_landscape_parks": 3 + i % 5,
                            "zakazniks": 10 + i * 2,
                            "monuments_of_nature": 5 + i,
                            "percent_of_region": 8.5 + i * 0.5
                        },
                        "pfz_score": 6.5 + i * 0.2,
                        "notable_objects": [f"Тестовий НПП {i+1}", f"Заповідник {i+1}"],
                        "recreational_value": "high" if i % 3 == 0 else "medium"
                    }
                    for i in range(24)
                ]
            }
        }

    def test_protected_areas_import(self):
        """Test POST /api/import/protected-areas"""
        try:
            valid_data = self.create_valid_protected_areas_data()
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(valid_data, f, ensure_ascii=False, indent=2)
                temp_file = f.name
            
            with open(temp_file, 'rb') as f:
                files = {'file': ('protected_areas.json', f, 'application/json')}
                response = requests.post(f"{self.api_url}/import/protected-areas", files=files, timeout=15)
            
            os.unlink(temp_file)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get('success') and data.get('regions_count') == 24:
                    details += f", Success: {data.get('message')}, Regions: {data.get('regions_count')}"
                else:
                    success = False
                    details += f", Unexpected response: {data}"
            
            self.log_test("Protected Areas Import", success, details, 200, response.status_code)
            
        except Exception as e:
            self.log_test("Protected Areas Import", False, f"Exception: {str(e)}")

    def create_valid_recreational_points(self):
        """Create valid recreational points GeoJSON for testing"""
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [30.5 + i * 0.1, 50.4 + i * 0.05]  # Valid Ukraine coordinates
                    },
                    "properties": {
                        "name": f"Тестовий рекреаційний пункт {i+1}",
                        "region": f"Тестова область {(i % 24) + 1}",
                        "type": "готель",
                        "capacity": 50 + i * 10,
                        "has_restaurant": i % 2 == 0,
                        "has_hotel": True
                    }
                }
                for i in range(5)  # Create 5 test points
            ]
        }

    def create_invalid_recreational_points(self):
        """Create invalid recreational points (coordinates out of bounds)"""
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [60.0, 70.0]  # Out of Ukraine bounds
                    },
                    "properties": {
                        "name": "Невалідний пункт",
                        "region": "Тестова область",
                        "type": "готель",
                        "capacity": 50
                    }
                }
            ]
        }

    def test_recreational_points_import(self):
        """Test POST /api/import/recreational-points"""
        # Test 1: Valid data
        try:
            valid_data = self.create_valid_recreational_points()
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.geojson', delete=False) as f:
                json.dump(valid_data, f, ensure_ascii=False, indent=2)
                temp_file = f.name
            
            with open(temp_file, 'rb') as f:
                files = {'file': ('recreational_points.geojson', f, 'application/json')}
                response = requests.post(f"{self.api_url}/import/recreational-points", files=files, timeout=15)
            
            os.unlink(temp_file)
            
            success = response.status_code == 200
            details = f"Valid data - Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get('success') and data.get('points_count') == 5:
                    details += f", Success: {data.get('message')}, Points: {data.get('points_count')}"
                else:
                    success = False
                    details += f", Unexpected response: {data}"
            
            self.log_test("Recreational Points Import - Valid", success, details, 200, response.status_code)
            
        except Exception as e:
            self.log_test("Recreational Points Import - Valid", False, f"Exception: {str(e)}")
        
        # Test 2: Invalid coordinates
        try:
            invalid_data = self.create_invalid_recreational_points()
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.geojson', delete=False) as f:
                json.dump(invalid_data, f, ensure_ascii=False, indent=2)
                temp_file = f.name
            
            with open(temp_file, 'rb') as f:
                files = {'file': ('invalid_points.geojson', f, 'application/json')}
                response = requests.post(f"{self.api_url}/import/recreational-points", files=files, timeout=15)
            
            os.unlink(temp_file)
            
            success = response.status_code == 400
            details = f"Invalid coordinates - Status: {response.status_code}"
            
            if success:
                data = response.json()
                if "bounds" in str(data.get('detail', '')).lower():
                    details += f", Correct validation error: {data.get('detail')}"
                else:
                    details += f", Unexpected error: {data.get('detail')}"
            
            self.log_test("Recreational Points Import - Invalid Coords", success, details, 400, response.status_code)
            
        except Exception as e:
            self.log_test("Recreational Points Import - Invalid Coords", False, f"Exception: {str(e)}")

    def create_valid_forest_fires(self):
        """Create valid forest fires GeoJSON for testing"""
        return {
            "type": "FeatureCollection",
            "metadata": {
                "total_fires": 3,
                "human_caused": 1,
                "other_causes": 2,
                "year": 2024,
                "regions": ["Тестова область 1", "Тестова область 2"],
                "note": "Тестові дані для перевірки імпорту"
            },
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [30.5, 50.4]  # Valid Ukraine coordinates
                    },
                    "properties": {
                        "name": "Тестова пожежа 1",
                        "region": "Тестова область 1",
                        "area_ha": 15.5,
                        "date": "2024-07-15",
                        "cause_type": "людський фактор",
                        "cause": "необережність з вогнем",
                        "description": "Пожежа через необережність туристів"
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [30.6, 50.5]
                    },
                    "properties": {
                        "name": "Тестова пожежа 2",
                        "region": "Тестова область 1",
                        "area_ha": 8.2,
                        "date": "2024-08-10",
                        "cause_type": "природні причини",
                        "cause": "блискавка",
                        "description": "Природна пожежа від блискавки"
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [30.7, 50.6]
                    },
                    "properties": {
                        "name": "Тестова пожежа 3",
                        "region": "Тестова область 2",
                        "area_ha": 22.1,
                        "date": "2024-09-05",
                        "cause_type": "природні причини",
                        "cause": "суха гроза",
                        "description": "Пожежа від сухої грози"
                    }
                }
            ]
        }

    def create_invalid_forest_fires(self):
        """Create invalid forest fires (invalid cause_type)"""
        return {
            "type": "FeatureCollection",
            "metadata": {
                "total_fires": 1,
                "human_caused": 0,
                "other_causes": 1,
                "year": 2024,
                "regions": ["Тестова область"],
                "note": "Невалідні дані"
            },
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [30.5, 50.4]
                    },
                    "properties": {
                        "name": "Невалідна пожежа",
                        "region": "Тестова область",
                        "area_ha": 10.0,
                        "date": "2024-07-15",
                        "cause_type": "невідома причина",  # Invalid cause_type
                        "cause": "невідомо",
                        "description": "Невалідна пожежа"
                    }
                }
            ]
        }

    def test_forest_fires_import(self):
        """Test POST /api/import/fires"""
        # Test 1: Valid data
        try:
            valid_data = self.create_valid_forest_fires()
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.geojson', delete=False) as f:
                json.dump(valid_data, f, ensure_ascii=False, indent=2)
                temp_file = f.name
            
            with open(temp_file, 'rb') as f:
                files = {'file': ('forest_fires.geojson', f, 'application/json')}
                response = requests.post(f"{self.api_url}/import/fires", files=files, timeout=15)
            
            os.unlink(temp_file)
            
            success = response.status_code == 200
            details = f"Valid data - Status: {response.status_code}"
            
            if success:
                data = response.json()
                if (data.get('success') and 
                    data.get('total_fires') == 3 and 
                    data.get('human_caused') == 1):
                    details += f", Success: {data.get('message')}, Fires: {data.get('total_fires')} ({data.get('human_caused')} human)"
                else:
                    success = False
                    details += f", Unexpected response: {data}"
            
            self.log_test("Forest Fires Import - Valid", success, details, 200, response.status_code)
            
        except Exception as e:
            self.log_test("Forest Fires Import - Valid", False, f"Exception: {str(e)}")
        
        # Test 2: Invalid cause_type
        try:
            invalid_data = self.create_invalid_forest_fires()
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.geojson', delete=False) as f:
                json.dump(invalid_data, f, ensure_ascii=False, indent=2)
                temp_file = f.name
            
            with open(temp_file, 'rb') as f:
                files = {'file': ('invalid_fires.geojson', f, 'application/json')}
                response = requests.post(f"{self.api_url}/import/fires", files=files, timeout=15)
            
            os.unlink(temp_file)
            
            success = response.status_code == 400
            details = f"Invalid cause_type - Status: {response.status_code}"
            
            if success:
                data = response.json()
                if "cause_type" in str(data.get('detail', '')):
                    details += f", Correct validation error: {data.get('detail')}"
                else:
                    details += f", Unexpected error: {data.get('detail')}"
            
            self.log_test("Forest Fires Import - Invalid Cause", success, details, 400, response.status_code)
            
        except Exception as e:
            self.log_test("Forest Fires Import - Invalid Cause", False, f"Exception: {str(e)}")

    def test_auto_reload_functionality(self):
        """Test that data reloads in memory after successful import"""
        try:
            # Get initial data status
            initial_response = requests.get(f"{self.api_url}/data-status", timeout=10)
            if initial_response.status_code != 200:
                self.log_test("Auto-Reload Test", False, "Could not get initial data status")
                return
            
            initial_data = initial_response.json()
            initial_fires = initial_data.get('forest_fires', {}).get('total_fires', 0)
            
            # Import test fires data
            test_fires = self.create_valid_forest_fires()
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.geojson', delete=False) as f:
                json.dump(test_fires, f, ensure_ascii=False, indent=2)
                temp_file = f.name
            
            with open(temp_file, 'rb') as f:
                files = {'file': ('test_fires.geojson', f, 'application/json')}
                import_response = requests.post(f"{self.api_url}/import/fires", files=files, timeout=15)
            
            os.unlink(temp_file)
            
            if import_response.status_code != 200:
                self.log_test("Auto-Reload Test", False, f"Import failed: {import_response.status_code}")
                return
            
            # Check if data-status reflects the change
            updated_response = requests.get(f"{self.api_url}/data-status", timeout=10)
            if updated_response.status_code != 200:
                self.log_test("Auto-Reload Test", False, "Could not get updated data status")
                return
            
            updated_data = updated_response.json()
            updated_fires = updated_data.get('forest_fires', {}).get('total_fires', 0)
            updated_human = updated_data.get('forest_fires', {}).get('human_caused', 0)
            
            # Verify the data changed
            success = (updated_fires == 3 and updated_human == 1)
            details = f"Initial fires: {initial_fires}, After import: {updated_fires} ({updated_human} human)"
            
            if success:
                details += " ✓ Data reloaded correctly"
                
                # Test if recommended-zones uses new data
                zones_response = requests.get(f"{self.api_url}/recommended-zones", timeout=30)
                if zones_response.status_code == 200:
                    details += ", Zones API accessible after reload"
                else:
                    details += f", Zones API error after reload: {zones_response.status_code}"
            else:
                details += " ✗ Data not reloaded or incorrect values"
            
            self.log_test("Auto-Reload Functionality", success, details)
            
        except Exception as e:
            self.log_test("Auto-Reload Functionality", False, f"Exception: {str(e)}")

    def run_comprehensive_test(self):
        """Run all data import tests"""
        print("🚀 Starting Data Import API Tests")
        print(f"🌐 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Test 1: Data Status Endpoint
        self.test_data_status_endpoint()
        
        # Test 2: Population Data Import
        self.test_population_data_import()
        
        # Test 3: Infrastructure Data Import
        self.test_infrastructure_data_import()
        
        # Test 4: Protected Areas Import
        self.test_protected_areas_import()
        
        # Test 5: Recreational Points Import
        self.test_recreational_points_import()
        
        # Test 6: Forest Fires Import
        self.test_forest_fires_import()
        
        # Test 7: Auto-Reload Functionality
        self.test_auto_reload_functionality()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 DATA IMPORT TEST SUMMARY")
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
    tester = DataImportTester()
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
    
    with open('/app/data_import_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Detailed results saved to: /app/data_import_test_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())