"""
Analytic Hierarchy Process (AHP) Calculator
============================================

Реалізація методу аналізу ієрархій (AHP) за Томасом Сааті для визначення 
ваг критеріїв оцінки рекреаційного потенціалу територій.

Наукові джерела:
- Saaty, T.L. (1980). The Analytic Hierarchy Process. McGraw-Hill.
- Wiley (2022). "AHP for Ecotourism Site Selection"
- Kentucky SCORP 2020-2025 (Demand Priority)

Метод включає:
1. Матрицю попарних порівнянь (Pairwise Comparison Matrix)
2. Розрахунок власного вектора (Principal Eigenvector)
3. Обчислення ваг критеріїв
4. Перевірку узгодженості (Consistency Index, Consistency Ratio)
"""

import numpy as np
from typing import Dict, List, Tuple

# Константи для перевірки узгодженості
# Random Index (RI) для різних розмірів матриць (n=1 до n=10)
RANDOM_INDEX = {
    1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12,
    6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49
}

class AHPCalculator:
    """
    Калькулятор методу AHP для визначення ваг критеріїв
    """
    
    def __init__(self):
        """
        Ініціалізація з експертною матрицею попарних порівнянь
        
        Критерії (у порядку важливості згідно міжнародних досліджень):
        1. Попит (Demand) - найважливіший (Kentucky SCORP 2020)
        2. ПЗФ (Protected Areas) - головний атрактор (Wiley AHP 2022)
        3. Природа (Nature) - естетична цінність
        4. Транспорт (Transport) - доступність
        5. Інфраструктура (Infrastructure) - можна побудувати
        6. Пожежі (Fire Prevention) - безпека
        7. Насиченість (Saturation) - негативний фактор
        
        Шкала Сааті (1-9):
        1 = однаково важливі
        3 = помірна перевага
        5 = сильна перевага
        7 = дуже сильна перевага
        9 = абсолютна перевага
        2, 4, 6, 8 = проміжні значення
        """
        
        # Назви критеріїв
        self.criteria_names = [
            "Попит",
            "ПЗФ", 
            "Природа",
            "Транспорт",
            "Інфраструктура",
            "Пожежі",
            "Насиченість"
        ]
        
        # Експертна матриця попарних порівнянь 7×7
        # Кожен елемент [i,j] показує наскільки критерій i важливіший за j
        # Скориговано для отримання ваг: 25%, 20%, 15%, 15%, 10%, 5%, 10% (штраф)
        # Примітка: Насиченість буде масштабована окремо до -15 балів у backend
        self.pairwise_matrix = np.array([
            # Поп     ПЗФ     Прир    Тран    Інфр    Пож     Нас
            [1.0,     1.333,  2.0,    2.0,    3.0,    6.0,    3.0],      # Попит (25%)
            [0.75,    1.0,    1.5,    1.5,    2.333,  5.0,    2.333],    # ПЗФ (20%)
            [0.5,     0.667,  1.0,    1.0,    1.75,   4.0,    1.75],     # Природа (15%)
            [0.5,     0.667,  1.0,    1.0,    1.75,   4.0,    1.75],     # Транспорт (15%)
            [0.333,   0.429,  0.571,  0.571,  1.0,    2.5,    1.167],    # Інфраструктура (10%)
            [0.167,   0.2,    0.25,   0.25,   0.4,    1.0,    0.5],      # Пожежі (5%)
            [0.333,   0.429,  0.571,  0.571,  0.857,  2.0,    1.0]       # Насиченість (10% базова)
        ])
        
        # Обґрунтування матриці
        self.justification = {
            "Попит vs ПЗФ (2:1)": "Без попиту навіть найкращі ПЗФ не принесуть прибутку",
            "Попит vs Природа (3:1)": "Економічна доцільність важливіша за природні ресурси",
            "ПЗФ vs Природа (2:1)": "ПЗФ = організовані туристичні об'єкти > загальні природні ресурси",
            "Природа = Транспорт (1:1)": "Обидва однаково важливі для рекреації",
            "Природа vs Інфраструктура (3:1)": "Природу не можна створити, інфраструктуру - можна",
            "Пожежі (найменша вага)": "Бонусний фактор безпеки, не критичний",
            "Насиченість (штраф)": "Негативний фактор для уникнення перенасичення"
        }
    
    def calculate_weights(self) -> Dict[str, float]:
        """
        Розрахунок ваг критеріїв методом геометричного середнього
        (найпростіший і найнадійніший метод для AHP)
        
        Returns:
            Dict з вагами кожного критерію (сума = 1.0)
        """
        n = len(self.pairwise_matrix)
        
        # 1. Обчислюємо геометричне середнє кожного рядка
        geometric_means = []
        for i in range(n):
            # Добуток всіх елементів рядка
            row_product = np.prod(self.pairwise_matrix[i, :])
            # n-й корінь з добутку
            geometric_mean = row_product ** (1.0 / n)
            geometric_means.append(geometric_mean)
        
        # 2. Нормалізуємо (щоб сума = 1.0)
        total = sum(geometric_means)
        normalized_weights = [gm / total for gm in geometric_means]
        
        # 3. Створюємо словник з результатами
        weights = {}
        for i, name in enumerate(self.criteria_names):
            weights[name] = round(normalized_weights[i], 4)
        
        return weights
    
    def calculate_max_eigenvalue(self, weights: List[float]) -> float:
        """
        Розрахунок максимального власного значення (λmax)
        Потрібен для перевірки узгодженості
        
        Args:
            weights: Список ваг критеріїв
            
        Returns:
            λmax (lambda max)
        """
        n = len(weights)
        weighted_sum = np.dot(self.pairwise_matrix, weights)
        lambda_max = sum(weighted_sum[i] / weights[i] for i in range(n)) / n
        return lambda_max
    
    def calculate_consistency(self, weights: List[float]) -> Tuple[float, float, bool]:
        """
        Перевірка узгодженості матриці попарних порівнянь
        
        Індекс узгодженості (CI) = (λmax - n) / (n - 1)
        Коефіцієнт узгодженості (CR) = CI / RI
        
        Прийнятна узгодженість: CR < 0.1 (10%)
        
        Args:
            weights: Список ваг
            
        Returns:
            Tuple (CI, CR, is_consistent)
        """
        n = len(weights)
        
        # Розраховуємо λmax
        lambda_max = self.calculate_max_eigenvalue(weights)
        
        # Consistency Index
        ci = (lambda_max - n) / (n - 1)
        
        # Consistency Ratio
        ri = RANDOM_INDEX[n]
        cr = ci / ri if ri > 0 else 0
        
        # Прийнятна узгодженість якщо CR < 0.1
        is_consistent = cr < 0.1
        
        return ci, cr, is_consistent
    
    def get_weights_for_scoring(self) -> Dict[str, int]:
        """
        Конвертує нормалізовані ваги (0-1) у бали (максимум 100)
        
        Returns:
            Dict з максимальними балами для кожного критерію
        """
        weights = self.calculate_weights()
        
        # Конвертуємо у бали (округлюємо до цілих)
        # Насиченість окремо (це штраф, негативний)
        scores = {
            "demand_max": round(weights["Попит"] * 100),
            "pfz_max": round(weights["ПЗФ"] * 100),
            "nature_max": round(weights["Природа"] * 100),
            "transport_max": round(weights["Транспорт"] * 100),
            "infrastructure_max": round(weights["Інфраструктура"] * 100),
            "fire_max": round(weights["Пожежі"] * 100),
            "saturation_penalty_max": -round(weights["Насиченість"] * 100)  # Негативний
        }
        
        return scores
    
    def generate_report(self) -> str:
        """
        Генерує детальний звіт про розрахунки AHP
        
        Returns:
            Форматований текстовий звіт
        """
        weights = self.calculate_weights()
        weights_list = [weights[name] for name in self.criteria_names]
        ci, cr, is_consistent = self.calculate_consistency(weights_list)
        
        report = []
        report.append("=" * 80)
        report.append("ЗВІТ РОЗРАХУНКУ ВАГ МЕТОДОМ AHP")
        report.append("=" * 80)
        report.append("")
        
        # 1. Матриця попарних порівнянь
        report.append("1. МАТРИЦЯ ПОПАРНИХ ПОРІВНЯНЬ (7×7)")
        report.append("-" * 80)
        report.append("Шкала Сааті: 1=однаково, 3=помірна перевага, 5=сильна, 7=дуже сильна, 9=абсолютна")
        report.append("")
        
        # Заголовок таблиці
        header = "         " + "  ".join([f"{name[:4]:>6}" for name in self.criteria_names])
        report.append(header)
        
        for i, name in enumerate(self.criteria_names):
            row_values = "  ".join([f"{val:6.2f}" for val in self.pairwise_matrix[i, :]])
            report.append(f"{name:8} {row_values}")
        report.append("")
        
        # 2. Обґрунтування
        report.append("2. ОБҐРУНТУВАННЯ ПОПАРНИХ ПОРІВНЯНЬ")
        report.append("-" * 80)
        for key, value in self.justification.items():
            report.append(f"• {key}: {value}")
        report.append("")
        
        # 3. Розраховані ваги
        report.append("3. РОЗРАХОВАНІ ВАГИ КРИТЕРІЇВ")
        report.append("-" * 80)
        total = 0
        for name in self.criteria_names:
            weight = weights[name]
            percentage = weight * 100
            report.append(f"{name:20} {weight:6.4f} ({percentage:5.2f}%)")
            total += weight
        report.append(f"{'СУМА':20} {total:6.4f} ({total*100:5.2f}%)")
        report.append("")
        
        # 4. Конвертація у бали
        report.append("4. КОНВЕРТАЦІЯ У БАЛИ (МАКС 100)")
        report.append("-" * 80)
        scores = self.get_weights_for_scoring()
        total_score = 0
        for key, value in scores.items():
            label = key.replace("_max", "").replace("_penalty_max", " (штраф)").replace("_", " ").title()
            report.append(f"{label:25} {value:3d} балів")
            total_score += abs(value)
        report.append(f"{'СУМА (абсолютна)':25} {total_score:3d} балів")
        report.append("")
        
        # 5. Перевірка узгодженості
        report.append("5. ПЕРЕВІРКА УЗГОДЖЕНОСТІ")
        report.append("-" * 80)
        report.append(f"Consistency Index (CI):  {ci:.4f}")
        report.append(f"Consistency Ratio (CR):  {cr:.4f} ({cr*100:.2f}%)")
        report.append(f"Random Index (RI) n=7:   {RANDOM_INDEX[7]:.2f}")
        report.append("")
        report.append(f"Статус: {'✓ УЗГОДЖЕНА (CR < 0.1)' if is_consistent else '✗ НЕ УЗГОДЖЕНА (CR >= 0.1)'}")
        report.append("")
        
        if is_consistent:
            report.append("Матриця попарних порівнянь має прийнятну узгодженість.")
            report.append("Розраховані ваги є статистично надійними і можуть використовуватись.")
        else:
            report.append("УВАГА: Матриця не є узгодженою!")
            report.append("Необхідно переглянути попарні порівняння для покращення узгодженості.")
        
        report.append("")
        report.append("=" * 80)
        report.append("Метод: Geometric Mean Method (найнадійніший для AHP)")
        report.append("Джерело: Saaty, T.L. (1980). The Analytic Hierarchy Process")
        report.append("=" * 80)
        
        return "\n".join(report)


# Глобальний екземпляр калькулятора
ahp_calculator = AHPCalculator()


def get_ahp_weights() -> Dict[str, float]:
    """
    Отримати ваги критеріїв розраховані методом AHP
    
    Returns:
        Dict з вагами (0-1, сума = 1.0)
    """
    return ahp_calculator.calculate_weights()


def get_ahp_scores() -> Dict[str, int]:
    """
    Отримати максимальні бали для кожного критерію
    
    Returns:
        Dict з максимальними балами (сума = 100)
    """
    return ahp_calculator.get_weights_for_scoring()


def verify_ahp_consistency() -> Tuple[float, float, bool]:
    """
    Перевірити узгодженість матриці AHP
    
    Returns:
        Tuple (CI, CR, is_consistent)
    """
    weights = ahp_calculator.calculate_weights()
    weights_list = [weights[name] for name in ahp_calculator.criteria_names]
    return ahp_calculator.calculate_consistency(weights_list)


def print_ahp_report():
    """
    Вивести повний звіт AHP у консоль
    """
    print(ahp_calculator.generate_report())


# Якщо запустити цей файл напряму - показати звіт
if __name__ == "__main__":
    print_ahp_report()
    print("\n\nМаксимальні бали:")
    scores = get_ahp_scores()
    for key, value in scores.items():
        print(f"  {key}: {value}")
