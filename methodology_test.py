#!/usr/bin/env python3
"""
METHODOLOGY VERIFICATION TEST
Tests backend calculations against Landing Page methodology requirements

Specific requirements to verify:
1. Фактор 1 (Попит) - supply/demand ratio thresholds
2. Фактор 2 (ПЗФ) - coefficient corrections
3. Фактор 3 (Природа) - forest coefficient correction
4. Фактор 6 (Пожежі) - fire scoring logic
"""

import requests
import sys
import json
from datetime import datetime

class MethodologyTester:
    def __init__(self, base_url="https://region-rating-system.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = []

    def log_test(self, name, success, details="", expected=None, actual=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
            if details:
                print(f"   {details}")
        else:
            print(f"❌ {name} - FAILED: {details}")
            if expected is not None and actual is not None:
                print(f"   Expected: {expected}")
                print(f"   Actual: {actual}")
            self.failed_tests.append({
                "test": name,
                "error": details,
                "expected": expected,
                "actual": actual
            })
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "expected": expected,
            "actual": actual,
            "timestamp": datetime.now().isoformat()
        })

    def test_kyiv_region_analysis(self):
        """Test Kyiv region analysis for methodology compliance"""
        try:
            # Test Kyiv region specifically as requested
            region_name = "Київська область"
            encoded_region = requests.utils.quote(region_name)
            response = requests.get(f"{self.api_url}/analyze/{encoded_region}", timeout=15)
            
            if response.status_code != 200:
                self.log_test("Kyiv Region API Access", False, f"HTTP {response.status_code}")
                return False, {}
            
            data = response.json()
            self.log_test("Kyiv Region API Access", True, f"Score: {data.get('total_score', 0)}/100")
            return True, data
            
        except Exception as e:
            self.log_test("Kyiv Region API Access", False, f"Exception: {str(e)}")
            return False, {}

    def test_factor_1_demand_thresholds(self, analysis_data):
        """
        Test Factor 1 (Demand) - Supply/Demand ratio thresholds
        Expected thresholds according to Landing Page:
        - < 0.6 = 25 points
        - 0.6-0.8 = 20 points  
        - 0.8-1.0 = 15 points
        - 1.0-1.5 = 10 points
        - > 1.5 = 0 points
        """
        try:
            details_data = analysis_data.get('details', {})
            population_data = details_data.get('population', {})
            
            supply_demand_ratio = population_data.get('supply_demand_ratio', 0)
            demand_score = analysis_data.get('demand_score', 0)
            
            # Determine expected score based on Landing Page methodology
            if supply_demand_ratio < 0.6:
                expected_score = 25
            elif supply_demand_ratio < 0.8:
                expected_score = 20
            elif supply_demand_ratio < 1.0:
                expected_score = 15
            elif supply_demand_ratio < 1.5:
                expected_score = 10
            else:
                expected_score = 0
            
            # Allow small tolerance for floating point calculations
            tolerance = 0.5
            score_matches = abs(demand_score - expected_score) <= tolerance
            
            details = f"Ratio: {supply_demand_ratio:.3f}, Score: {demand_score}, Expected: {expected_score}"
            
            self.log_test(
                "Factor 1 (Demand) - Threshold Logic", 
                score_matches, 
                details,
                expected_score,
                demand_score
            )
            
            return score_matches
            
        except Exception as e:
            self.log_test("Factor 1 (Demand) - Threshold Logic", False, f"Exception: {str(e)}")
            return False

    def test_factor_2_pfz_coefficients(self, analysis_data):
        """
        Test Factor 2 (PFZ) - Coefficient corrections
        Expected coefficients according to Landing Page:
        - НПП coefficient = 2.0 (not 2.5)
        - РЛП coefficient = 1.0 (not 0.4)  
        - Заказники coefficient = 0.1 (not 0.02)
        - Заповідники = 1.5 (should remain)
        """
        try:
            details_data = analysis_data.get('details', {})
            pfz_data = details_data.get('pfz', {})
            
            # Get PFZ counts
            national_parks = pfz_data.get('national_parks', 0)
            nature_reserves = pfz_data.get('nature_reserves', 0)
            regional_landscape_parks = pfz_data.get('regional_landscape_parks', 0)
            zakazniks = pfz_data.get('zakazniks', 0)
            
            pfz_score = analysis_data.get('pfz_score', 0)
            
            # Calculate expected score using Landing Page methodology
            expected_score = 0
            expected_score += min(national_parks * 2.0, 8)  # НПП ×2.0
            expected_score += min(nature_reserves * 1.5, 6)  # Заповідники ×1.5
            expected_score += min(regional_landscape_parks * 1.0, 4)  # РЛП ×1.0
            expected_score += min(zakazniks * 0.1, 1.5)  # Заказники ×0.1
            
            # Add percentage bonus (this part should remain the same)
            percent_of_region = pfz_data.get('percent_of_region', 0)
            if percent_of_region > 10:
                expected_score += 2
            elif percent_of_region > 7:
                expected_score += 1.5
            elif percent_of_region > 5:
                expected_score += 1
            
            expected_score = min(expected_score, 20)
            
            # Allow tolerance for rounding
            tolerance = 0.5
            score_matches = abs(pfz_score - expected_score) <= tolerance
            
            details = f"НПП:{national_parks}, Заповідники:{nature_reserves}, РЛП:{regional_landscape_parks}, Заказники:{zakazniks}"
            details += f" | Score: {pfz_score}, Expected: {expected_score:.1f}"
            
            self.log_test(
                "Factor 2 (PFZ) - Coefficient Corrections", 
                score_matches, 
                details,
                f"{expected_score:.1f}",
                pfz_score
            )
            
            return score_matches
            
        except Exception as e:
            self.log_test("Factor 2 (PFZ) - Coefficient Corrections", False, f"Exception: {str(e)}")
            return False

    def test_factor_3_nature_coefficient(self, analysis_data):
        """
        Test Factor 3 (Nature) - Forest coefficient correction
        Expected: Forest coefficient = 0.275 (not 0.28)
        """
        try:
            details_data = analysis_data.get('details', {})
            nature_data = details_data.get('nature', {})
            
            forest_coverage = nature_data.get('forest_coverage_percent', 0)
            has_water_bodies = nature_data.get('has_water_bodies', False)
            nature_score = analysis_data.get('nature_score', 0)
            
            # Calculate expected score using Landing Page methodology
            forest_score = min(forest_coverage * 0.275, 11)  # Coefficient 0.275
            water_score = 4 if has_water_bodies else 0
            expected_score = forest_score + water_score
            
            # Allow tolerance for rounding
            tolerance = 0.5
            score_matches = abs(nature_score - expected_score) <= tolerance
            
            details = f"Forest: {forest_coverage}% × 0.275 = {forest_score:.2f}, Water: {water_score}"
            details += f" | Score: {nature_score}, Expected: {expected_score:.1f}"
            
            self.log_test(
                "Factor 3 (Nature) - Forest Coefficient 0.275", 
                score_matches, 
                details,
                f"{expected_score:.1f}",
                nature_score
            )
            
            return score_matches
            
        except Exception as e:
            self.log_test("Factor 3 (Nature) - Forest Coefficient 0.275", False, f"Exception: {str(e)}")
            return False

    def test_factor_6_fire_scoring(self, analysis_data):
        """
        Test Factor 6 (Fires) - Fire scoring logic
        Expected according to Landing Page:
        - ≥15 human fires = 5 points
        - 10-14 human fires = 3 points
        - 5-9 human fires = 1 point
        - <5 human fires = 0 points
        """
        try:
            details_data = analysis_data.get('details', {})
            fires_data = details_data.get('fires', {})
            
            human_caused_fires = fires_data.get('human_caused_fires', 0)
            fire_score = analysis_data.get('fire_score', 0)
            
            # Calculate expected score using Landing Page methodology
            if human_caused_fires >= 15:
                expected_score = 5
            elif human_caused_fires >= 10:
                expected_score = 3
            elif human_caused_fires >= 5:
                expected_score = 1
            else:
                expected_score = 0
            
            # Allow tolerance for rounding
            tolerance = 0.5
            score_matches = abs(fire_score - expected_score) <= tolerance
            
            details = f"Human fires: {human_caused_fires}, Score: {fire_score}, Expected: {expected_score}"
            
            self.log_test(
                "Factor 6 (Fires) - Progressive Scoring Logic", 
                score_matches, 
                details,
                expected_score,
                fire_score
            )
            
            return score_matches
            
        except Exception as e:
            self.log_test("Factor 6 (Fires) - Progressive Scoring Logic", False, f"Exception: {str(e)}")
            return False

    def test_total_score_calculation(self, analysis_data):
        """
        Test that total score matches sum of all factors (no base score)
        """
        try:
            # Get individual factor scores
            demand_score = analysis_data.get('demand_score', 0)
            pfz_score = analysis_data.get('pfz_score', 0)
            nature_score = analysis_data.get('nature_score', 0)
            accessibility_score = analysis_data.get('accessibility_score', 0)
            infrastructure_score = analysis_data.get('infrastructure_score', 0)
            fire_score = analysis_data.get('fire_score', 0)
            saturation_penalty = analysis_data.get('saturation_penalty', 0)
            
            total_score = analysis_data.get('total_score', 0)
            
            # Calculate expected total (direct sum of all factors, no base)
            expected_total = demand_score + pfz_score + nature_score + accessibility_score + infrastructure_score + fire_score + saturation_penalty
            expected_total = max(0, min(100, expected_total))  # Clamp to 0-100
            
            # Allow tolerance for rounding
            tolerance = 1.0
            score_matches = abs(total_score - expected_total) <= tolerance
            
            details = f"Factors sum: {demand_score}+{pfz_score}+{nature_score}+{accessibility_score}+{infrastructure_score}+{fire_score}+{saturation_penalty} = {expected_total:.1f}"
            details += f" | Total: {total_score}"
            
            self.log_test(
                "Total Score Calculation", 
                score_matches, 
                details,
                f"{expected_total:.1f}",
                total_score
            )
            
            return score_matches
            
        except Exception as e:
            self.log_test("Total Score Calculation", False, f"Exception: {str(e)}")
            return False

    def test_json_export_methodology(self):
        """
        Test JSON export contains correct methodology references
        """
        try:
            # Get analysis for Kyiv region
            region_name = "Київська область"
            encoded_region = requests.utils.quote(region_name)
            response = requests.get(f"{self.api_url}/analyze/{encoded_region}", timeout=15)
            
            if response.status_code != 200:
                self.log_test("JSON Export Methodology", False, f"Analysis API failed: {response.status_code}")
                return False
            
            analysis_data = response.json()
            
            # Check if analysis contains methodology-compliant calculations
            has_all_factors = all(key in analysis_data for key in [
                'demand_score', 'pfz_score', 'nature_score', 
                'accessibility_score', 'infrastructure_score', 'fire_score', 'saturation_penalty'
            ])
            
            has_detailed_breakdown = 'details' in analysis_data
            
            # Check score ranges match methodology
            scores_in_range = (
                0 <= analysis_data.get('demand_score', 0) <= 25 and
                0 <= analysis_data.get('pfz_score', 0) <= 20 and
                0 <= analysis_data.get('nature_score', 0) <= 15 and
                0 <= analysis_data.get('accessibility_score', 0) <= 15 and
                0 <= analysis_data.get('infrastructure_score', 0) <= 10 and
                0 <= analysis_data.get('fire_score', 0) <= 5 and
                -15 <= analysis_data.get('saturation_penalty', 0) <= 0
            )
            
            success = has_all_factors and has_detailed_breakdown and scores_in_range
            
            details = f"All factors: {has_all_factors}, Detailed breakdown: {has_detailed_breakdown}, Scores in range: {scores_in_range}"
            
            self.log_test(
                "JSON Export Methodology Compliance", 
                success, 
                details
            )
            
            return success
            
        except Exception as e:
            self.log_test("JSON Export Methodology Compliance", False, f"Exception: {str(e)}")
            return False

    def run_methodology_verification(self):
        """Run all methodology verification tests"""
        print("🔍 METHODOLOGY VERIFICATION TEST")
        print("Testing backend calculations against Landing Page methodology")
        print("=" * 70)
        
        # Step 1: Get Kyiv region analysis
        success, kyiv_data = self.test_kyiv_region_analysis()
        
        if not success:
            print("❌ Cannot proceed - Kyiv region analysis failed")
            return False
        
        print(f"\n📊 Kyiv Region Analysis Data:")
        print(f"   Total Score: {kyiv_data.get('total_score', 0)}/100")
        print(f"   Demand: {kyiv_data.get('demand_score', 0)}/25")
        print(f"   PFZ: {kyiv_data.get('pfz_score', 0)}/20")
        print(f"   Nature: {kyiv_data.get('nature_score', 0)}/15")
        print(f"   Transport: {kyiv_data.get('accessibility_score', 0)}/15")
        print(f"   Infrastructure: {kyiv_data.get('infrastructure_score', 0)}/10")
        print(f"   Fires: {kyiv_data.get('fire_score', 0)}/5")
        print(f"   Saturation: {kyiv_data.get('saturation_penalty', 0)}/0")
        print()
        
        # Step 2: Test each factor methodology
        factor1_ok = self.test_factor_1_demand_thresholds(kyiv_data)
        factor2_ok = self.test_factor_2_pfz_coefficients(kyiv_data)
        factor3_ok = self.test_factor_3_nature_coefficient(kyiv_data)
        factor6_ok = self.test_factor_6_fire_scoring(kyiv_data)
        
        # Step 3: Test total calculation
        total_ok = self.test_total_score_calculation(kyiv_data)
        
        # Step 4: Test JSON export compliance
        json_ok = self.test_json_export_methodology()
        
        # Print summary
        print("\n" + "=" * 70)
        print("📋 METHODOLOGY VERIFICATION SUMMARY")
        print("=" * 70)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {len(self.failed_tests)}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Detailed factor results
        print(f"\n🔍 Factor-by-Factor Results:")
        print(f"   Factor 1 (Demand Thresholds): {'✅ PASS' if factor1_ok else '❌ FAIL'}")
        print(f"   Factor 2 (PFZ Coefficients): {'✅ PASS' if factor2_ok else '❌ FAIL'}")
        print(f"   Factor 3 (Nature Coefficient): {'✅ PASS' if factor3_ok else '❌ FAIL'}")
        print(f"   Factor 6 (Fire Scoring): {'✅ PASS' if factor6_ok else '❌ FAIL'}")
        print(f"   Total Calculation: {'✅ PASS' if total_ok else '❌ FAIL'}")
        print(f"   JSON Export: {'✅ PASS' if json_ok else '❌ FAIL'}")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS DETAILS:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}")
                print(f"    Error: {failure['error']}")
                if failure.get('expected') and failure.get('actual'):
                    print(f"    Expected: {failure['expected']}")
                    print(f"    Actual: {failure['actual']}")
                print()
        
        # Overall methodology compliance
        all_factors_pass = factor1_ok and factor2_ok and factor3_ok and factor6_ok and total_ok and json_ok
        
        if all_factors_pass:
            print("🎉 METHODOLOGY VERIFICATION: ✅ PASS")
            print("   All calculations match Landing Page methodology!")
        else:
            print("⚠️  METHODOLOGY VERIFICATION: ❌ FAIL")
            print("   Some calculations do not match Landing Page methodology.")
        
        return all_factors_pass

def main():
    """Main test execution"""
    tester = MethodologyTester()
    success = tester.run_methodology_verification()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "methodology_verification": "PASS" if success else "FAIL",
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "failed_tests": len(tester.failed_tests),
        "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
        "test_details": tester.test_results,
        "failures": tester.failed_tests
    }
    
    with open('/app/methodology_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Detailed results saved to: /app/methodology_test_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())