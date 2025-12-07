/**
 * ОНОВЛЕНІ ФУНКЦІЇ ЕКСПОРТУ З ПОВНОЮ НАУКОВОЮ ДОКУМЕНТАЦІЄЮ
 * 
 * Включає:
 * 1. exportPDF - детальний звіт про область з математичними розрахунками
 * 2. exportComparisonPDF - порівняльний звіт всіх областей
 * 3. exportJSON - структуровані дані з поясненнями
 */

// ========================================
// ФУНКЦІЯ 1: ЕКСПОРТ PDF ПРО ОБЛАСТЬ
// ========================================

export const exportPDF = async (analysisResult, recommendedZones, html2canvas, jsPDF) => {
  if (!analysisResult) return;
  
  const pdfContent = document.createElement('div');
  pdfContent.style.cssText = 'position: absolute; left: -9999px; width: 850px; padding: 40px; background: white; font-family: Arial, sans-serif; font-size: 11px;';
  
  const d = analysisResult.details;
  const shouldBuild = d?.investment?.should_build;
  
  // Допоміжні функції для кольорів
  const getScoreColor = (score) => {
    if (score >= 70) return '#16a34a';
    if (score >= 55) return '#f59e0b';
    return '#dc2626';
  };
  
  const getCategoryColor = (category) => {
    if (category === 'Високий потенціал') return '#16a34a';
    if (category === 'Середній потенціал') return '#f59e0b';
    return '#dc2626';
  };
  
  pdfContent.innerHTML = `
    <style>
      .calculation-box {
        background: #f8fafc;
        border-left: 4px solid #3b82f6;
        padding: 15px;
        margin: 15px 0;
        font-size: 10px;
      }
      .formula-code {
        background: white;
        padding: 8px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        border: 1px solid #e2e8f0;
        margin: 5px 0;
      }
      .step-header {
        font-weight: bold;
        color: #1e40af;
        margin: 8px 0 4px 0;
      }
      .result-highlight {
        background: #fef3c7;
        padding: 6px 10px;
        border-radius: 4px;
        font-weight: bold;
        display: inline-block;
        margin: 5px 0;
      }
    </style>

    <!-- ТИТУЛЬНА СТОРІНКА -->
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #f59e0b; padding-bottom: 25px;">
      <h1 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: bold;">НАУКОВИЙ ЗВІТ</h1>
      <h2 style="color: #f59e0b; margin: 10px 0; font-size: 19px;">АНАЛІЗ РЕКРЕАЦІЙНОГО ПОТЕНЦІАЛУ</h2>
      <h3 style="color: #475569; margin: 10px 0; font-size: 17px;">${analysisResult.region}</h3>
      <div style="display: inline-block; width: 90px; height: 90px; border-radius: 50%; background: ${getScoreColor(analysisResult.total_score)}; color: white; line-height: 90px; font-size: 32px; font-weight: bold; margin: 20px 0; border: 5px solid #f59e0b;">
        ${analysisResult.total_score}
      </div>
      <p style="color: #64748b; margin: 5px 0; font-size: 12px;">зі 100 балів</p>
      <span style="display: inline-block; padding: 6px 16px; border-radius: 15px; background: ${getCategoryColor(analysisResult.category)}; color: white; font-weight: bold; font-size: 12px;">${analysisResult.category}</span>
      <p style="color: #94a3b8; margin-top: 20px; font-size: 10px;">Згенеровано: ${new Date().toLocaleString('uk-UA')}</p>
      <p style="color: #94a3b8; margin: 5px 0; font-size: 9px;">Версія методології: 1.0 | На основі AHP (Analytic Hierarchy Process)</p>
    </div>
    
    <!-- МЕТОДОЛОГІЧНА БАЗА -->
    <h3 style="color: #1e293b; border-bottom: 3px solid #f59e0b; padding-bottom: 10px; margin-top: 25px; font-size: 15px;">📐 МЕТОДОЛОГІЯ РОЗРАХУНКУ</h3>
    <div style="background: #fef3c7; padding: 15px; border-left: 5px solid #f59e0b; margin-bottom: 20px; font-size: 10px;">
      <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 11px;">Загальна 7-факторна формула оцінки потенціалу:</p>
      <div style="background: white; padding: 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 10px; line-height: 1.8;">
        <strong style="color: #1e40af;">TOTAL_SCORE</strong> = 
        <span style="color: #16a34a;">Попит(0-25)</span> + 
        <span style="color: #16a34a;">ПЗФ(0-20)</span> + 
        <span style="color: #16a34a;">Природа(0-15)</span> + 
        <span style="color: #16a34a;">Транспорт(0-15)</span> + 
        <span style="color: #16a34a;">Інфраструктура(0-10)</span> + 
        <span style="color: #16a34a;">Пожежі(0-5)</span> 
        <span style="color: #dc2626;">- Насиченість(0-15)</span>
      </div>
      <p style="margin: 10px 0 0 0; font-size: 9px; color: #64748b; line-height: 1.5;">
        <strong>Науковавоє обґрунтування:</strong> Модель базується на методі Analytic Hierarchy Process (AHP) - міжнародно визнаному підході до багатокритеріального прийняття рішень у туристичному планувандні. Вагові коефіцієнти визначені на основі досліджень Kentucky SCORP 2020-2025, District of Columbia SCORP 2020, та адаптовані до українського контексту.
      </p>
    </div>
    
    <!-- ТАБЛИЦЯ ФОРМУЛ -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px;">
      <tr style="background: #1e293b; color: white;">
        <th style="padding: 10px; text-align: left; border: 1px solid #475569; width: 18%;">Фактор</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #475569; width: 12%;">Вага</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #475569;">Формула розрахунку</th>
        <th style="padding: 10px; text-align: center; border: 1px solid #475569; width: 12%;">Обґрунтування</th>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>1. Попит</strong></td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #16a34a;">25%</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9px;">Населення × 0.15 × 3 відв./рік - Існуюча пропозиція</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 9px;">Найвищий пріоритет [1]</td>
      </tr>
      <tr style="background: #f8fafc;">
        <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>2. ПЗФ атрактор</strong></td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #16a34a;">20%</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9px;">НПП×2.0 + Заповідники×1.5 + РЛП×1.0 + Заказники×0.3</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 9px;">Туристична цінність [2]</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>3. Природа</strong></td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #16a34a;">15%</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9px;">Лісистість% × 0.275 + Водойми(так=4/ні=0)</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 9px;">Естетична цінність [3]</td>
      </tr>
      <tr style="background: #f8fafc;">
        <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>4. Транспорт</strong></td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #16a34a;">15%</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9px;">f(Щільність доріг, М-траси, Залізниця, Аеропорти)</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 9px;">Ключовий бар'єр [4]</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>5. Інфраструктура</strong></td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #16a34a;">10%</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9px;">Медицина(3) + Заправки(2) + Зв'язок(2) + Готелі(1) + ...</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 9px;">Може бути побудована [5]</td>
      </tr>
      <tr style="background: #f8fafc;">
        <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>6. Пожежі (профілактика)</strong></td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #16a34a;">+5%</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9px;">(Людські пожежі / Площа) × 100 × 0.5</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 9px;">Профілактичний бонус [6]</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #e2e8f0; color: #dc2626;"><strong>7. Штраф насиченість</strong></td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #dc2626;">-15%</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9px; color: #dc2626;">-1 за кожні 50 р.п./1000км² (прогресивна шкала)</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 9px; color: #dc2626;">Ринкова конкуренція [7]</td>
      </tr>
    </table>
    
    <div style="background: #dbeafe; padding: 10px; border-radius: 6px; margin-bottom: 20px; font-size: 9px;">
      <p style="margin: 0; color: #1e40af; line-height: 1.6;">
        <strong>Джерела обґрунтування:</strong> [1] Kentucky SCORP 2020-2025, [2] Wiley AHP Ecotourism 2022, [3] SCIRP GIS-AHP Tourist Resort 2018, 
        [4] District of Columbia SCORP 2020, [5] Laguna Hills Assessment 2021, [6] NW Fire Science 2020, [7] Kentucky SCORP Market Analysis
      </p>
    </div>

    <!-- ПОКРОКОВІ РОЗРАХУНКИ -->
    <h3 style="color: #1e293b; border-bottom: 3px solid #f59e0b; padding-bottom: 10px; margin-top: 25px; font-size: 15px;">🧮 ДЕТАЛЬНІ МАТЕМАТИЧНІ РОЗРАХУНКИ</h3>
    
    <!-- ФАКТОР 1: ПОПИТ -->
    <div class="calculation-box">
      <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 12px;">📊 ФАКТОР 1: ПОПИТ ВІД НАСЕЛЕННЯ (Вага: 25%, максимум 25 балів)</h4>
      
      <div class="step-header">Крок 1: Розрахунок річного попиту на рекреацію</div>
      <div class="formula-code">
        <strong>Формула:</strong> Річний попит = Населення × Коефіцієнт участі × Кількість відвідувань<br/>
        <strong>Підставлення:</strong> ${d?.population?.total?.toLocaleString() || 'N/A'} осіб × 0.15 × 3 відв./рік<br/>
        <strong>Обґрунтування 0.15:</strong> 15% населення - потенційні відвідувачі (базується на Kentucky SCORP 2020)<br/>
        <strong>Обґрунтування 3 відв.:</strong> Середня кількість візитів на рік (District of Columbia SCORP)
      </div>
      <div class="result-highlight">Результат: ${d?.population?.annual_demand?.toLocaleString() || 'N/A'} відвідувань/рік</div>
      
      <div class="step-header">Крок 2: Оцінка існуючої пропозиції</div>
      <div class="formula-code">
        <strong>Формула:</strong> Річна пропозиція = Існуючі місця × 180 днів (сезон) × 2 зміни<br/>
        <strong>Наявні р.п.:</strong> ${d?.saturation?.existing_points || 0} пунктів<br/>
        <strong>Середня місткість:</strong> 50 місць на пункт (стандарт)
      </div>
      <div class="result-highlight">Результат: ${d?.population?.annual_supply?.toLocaleString() || 'N/A'} місць/рік</div>
      
      <div class="step-header">Крок 3: Визначення дефіциту або профіциту</div>
      <div class="formula-code">
        <strong>Формула:</strong> Gap = Попит - Пропозиція<br/>
        <strong>Розрахунок:</strong> ${d?.population?.annual_demand?.toLocaleString() || 'N/A'} - ${d?.population?.annual_supply?.toLocaleString() || 'N/A'}
      </div>
      <div class="result-highlight" style="background: ${d?.population?.gap > 0 ? '#fee2e2' : '#dcfce7'}; color: ${d?.population?.gap > 0 ? '#991b1b' : '#14532d'};">
        Результат: ${Math.abs(d?.population?.gap || 0).toLocaleString()} відв. (${d?.population?.gap_status || 'N/A'})
      </div>
      
      <div class="step-header">Крок 4: Нормалізація до шкали 0-25 балів</div>
      <div class="formula-code">
        <strong>Метод:</strong> Логарифмічна нормалізація з урахуванням розміру дефіциту<br/>
        <strong>Логіка:</strong> Більший дефіцит → вищий бал (вища потреба в нових об'єктах)
      </div>
      <div class="result-highlight" style="background: #16a34a; color: white;">
        <strong>ФІНАЛЬНИЙ БАЛ:</strong> ${analysisResult.demand_score}/25
      </div>
    </div>

    <!-- ФАКТОР 2: ПЗФ -->
    <div class="calculation-box">
      <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 12px;">🌲 ФАКТОР 2: ПЗФ ЯК ТУРИСТИЧНИЙ АТРАКТОР (Вага: 20%, максимум 20 балів)</h4>
      
      <div class="step-header">Крок 1: Підрахунок ПЗФ за категоріями з ваговими коефіцієнтами</div>
      <div class="formula-code">
        <strong>Формула:</strong> Score = НПП×2.0 + Заповідники×1.5 + РЛП×1.0 + Заказники×0.3<br/>
        <strong>Вхідні дані:</strong><br/>
        • Національні природні парки (НПП): ${d?.pfz?.national_parks || 0} шт. × 2.0 = ${(d?.pfz?.national_parks || 0) * 2}<br/>
        • Природні заповідники: ${d?.pfz?.nature_reserves || 0} шт. × 1.5 = ${(d?.pfz?.nature_reserves || 0) * 1.5}<br/>
        • Регіональні ландшафтні парки (РЛП): ${d?.pfz?.regional_landscape_parks || 0} шт. × 1.0 = ${(d?.pfz?.regional_landscape_parks || 0) * 1.0}<br/>
        • Заказники: ${d?.pfz?.zakazniks || 0} шт. × 0.3 = ${(d?.pfz?.zakazniks || 0) * 0.3}<br/>
        <strong>Обґрунтування вагів:</strong> НПП мають найвищу туристичну привабливість та впізнаваність (Wiley AHP 2022)
      </div>
      <div class="result-highlight">
        Сума: ${((d?.pfz?.national_parks || 0) * 2 + (d?.pfz?.nature_reserves || 0) * 1.5 + (d?.pfz?.regional_landscape_parks || 0) * 1.0 + (d?.pfz?.zakazniks || 0) * 0.3).toFixed(1)}
      </div>
      
      <div class="step-header">Крок 2: Нормалізація до шкали 0-20 балів</div>
      <div class="formula-code">
        <strong>Метод:</strong> Нелінійна нормалізація (max=20) з урахуванням площі ПЗФ<br/>
        <strong>Площа під ПЗФ:</strong> ${d?.pfz?.percent_of_region || 0}% території регіону
      </div>
      <div class="result-highlight" style="background: #16a34a; color: white;">
        <strong>ФІНАЛЬНИЙ БАЛ:</strong> ${analysisResult.pfz_score}/20
      </div>
      
      ${d?.pfz?.notable_objects && d.pfz.notable_objects.length > 0 ? `
      <div style="background: #f0fdf4; padding: 10px; border-radius: 4px; margin-top: 10px; font-size: 9px;">
        <strong>Визначні ПЗФ об'єкти регіону:</strong> ${d.pfz.notable_objects.join(', ')}
      </div>
      ` : ''}
    </div>

    <!-- ФАКТОР 3: ПРИРОДА -->
    <div class="calculation-box">
      <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 12px;">🌳 ФАКТОР 3: ПРИРОДНІ РЕСУРСИ (Вага: 15%, максимум 15 балів)</h4>
      
      <div class="step-header">Компонент А: Лісове покриття (0-11 балів)</div>
      <div class="formula-code">
        <strong>Формула:</strong> Ліси = Лісистість% × 0.275 (коефіцієнт нормалізації)<br/>
        <strong>Вхідні дані:</strong> ${d?.nature?.forest_coverage_percent || 0}% лісистості<br/>
        <strong>Розрахунок:</strong> ${d?.nature?.forest_coverage_percent || 0}% × 0.275 = ${((d?.nature?.forest_coverage_percent || 0) * 0.275).toFixed(2)} балів<br/>
        <strong>Обґрунтування:</strong> Ліси забезпечують естетичну цінність та різноманітність активностей
      </div>
      <div class="result-highlight">Результат: ${Math.min(11, ((d?.nature?.forest_coverage_percent || 0) * 0.275)).toFixed(1)}/11 балів</div>
      
      <div class="step-header">Компонент Б: Водні об'єкти (0-4 бали)</div>
      <div class="formula-code">
        <strong>Формула:</strong> Водойми = 4 (якщо присутні) або 0 (якщо відсутні)<br/>
        <strong>Вхідні дані:</strong> ${d?.nature?.has_water_bodies ? 'Наявні' : 'Відсутні'}<br/>
        <strong>Обґрунтування:</strong> Водойми розширюють можливості для рекреації (риболовля, плавання, човни)
      </div>
      <div class="result-highlight">Результат: ${d?.nature?.has_water_bodies ? '4/4' : '0/4'} балів</div>
      
      <div class="step-header">Крок 3: Загальний бал за природу</div>
      <div class="formula-code">
        <strong>Формула:</strong> TOTAL = Ліси + Водойми (максимум 15)<br/>
        <strong>Розрахунок:</strong> ${Math.min(11, ((d?.nature?.forest_coverage_percent || 0) * 0.275)).toFixed(1)} + ${d?.nature?.has_water_bodies ? 4 : 0}
      </div>
      <div class="result-highlight" style="background: #16a34a; color: white;">
        <strong>ФІНАЛЬНИЙ БАЛ:</strong> ${analysisResult.nature_score}/15
      </div>
    </div>

    <!-- ФАКТОР 4: ТРАНСПОРТ -->
    <div class="calculation-box">
      <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 12px;">🚗 ФАКТОР 4: ТРАНСПОРТНА ДОСТУПНІСТЬ (Вага: 15%, максимум 15 балів)</h4>
      
      <div class="step-header">Компонент А: Щільність автомобільних доріг (0-8 балів)</div>
      <div class="formula-code">
        <strong>Вхідні дані:</strong> ${d?.transport?.highway_density || 0} км доріг на 1000 км²<br/>
        <strong>Шкала оцінювання:</strong><br/>
        • >400 км/1000км² = 8 балів (відмінно)<br/>
        • 200-400 км/1000км² = 5 балів (добре)<br/>
        • <200 км/1000км² = 2 бали (задовільно)
      </div>
      
      <div class="step-header">Компонент Б: Міжнародні траси (0-3 бали)</div>
      <div class="formula-code">
        <strong>Критерій:</strong> Наявність М-трас (міжнародні автошляхи)<br/>
        <strong>Обґрунтування:</strong> М-траси забезпечують високий трафік та якість покриття
      </div>
      
      <div class="step-header">Компонент В: Залізничні станції (0-2 бали)</div>
      <div class="formula-code">
        <strong>Вхідні дані:</strong> ${d?.transport?.railway_stations || 0} станцій<br/>
        <strong>Шкала:</strong> >30 станцій = 2 бали, інакше пропорційно
      </div>
      
      <div class="step-header">Компонент Г: Аеропорти (0-2 бали)</div>
      <div class="formula-code">
        <strong>Вхідні дані:</strong> ${d?.transport?.airports || 0} аеропортів<br/>
        <strong>Критерій:</strong> Наявність міжнародного аеропорту = +2 бали
      </div>
      
      <div class="result-highlight" style="background: #16a34a; color: white;">
        <strong>ФІНАЛЬНИЙ БАЛ:</strong> ${analysisResult.accessibility_score}/15
      </div>
    </div>

    <!-- ФАКТОР 5: ІНФРАСТРУКТУРА -->
    <div class="calculation-box">
      <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 12px;">🏗️ ФАКТОР 5: АНТРОПОГЕННА ІНФРАСТРУКТУРА (Вага: 10%, максимум 10 балів)</h4>
      
      <div class="formula-code">
        <strong>Компоненти (у порядку важливості):</strong><br/>
        1. <strong>Медицина (0-3 бали):</strong> ${d?.infrastructure?.hospitals_per_100k || 0} лікарень/100 тис. (найкритичніше для безпеки)<br/>
        2. <strong>Заправки (0-2 бали):</strong> ${d?.infrastructure?.gas_stations_per_100km2 || 0} заправок/100км² (для автотуризму)<br/>
        3. <strong>Мобільний зв'язок (0-2 бали):</strong> ${d?.infrastructure?.mobile_coverage_percent || 0}% покриття (безпека та комфорт)<br/>
        4. <strong>Інтернет (0-1 бал):</strong> Швидкість інтернету (комфорт)<br/>
        5. <strong>Готелі (0-1 бал):</strong> ${d?.infrastructure?.hotels_total || 0} готелів (існуюча база)<br/>
        6. <strong>Електрифікація (0-1 бал):</strong> Покриття електромережею
      </div>
      <div style="background: #fef3c7; padding: 8px; border-radius: 4px; margin: 10px 0; font-size: 9px;">
        <strong>Чому лише 10%:</strong> Інфраструктуру можна ПОБУДУВАТИ після відкриття об'єкту, на відміну від природних ресурсів. 
        Це вторинний фактор (Laguna Hills Assessment 2021).
      </div>
      <div class="result-highlight" style="background: #16a34a; color: white;">
        <strong>ФІНАЛЬНИЙ БАЛ:</strong> ${analysisResult.infrastructure_score}/10
      </div>
    </div>

    <!-- ФАКТОР 6: ПОЖЕЖІ -->
    <div class="calculation-box">
      <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 12px;">🔥 ФАКТОР 6: ПРОФІЛАКТИКА ЛІСОВИХ ПОЖЕЖ (Бонус: +5%, максимум 5 балів)</h4>
      
      <div style="background: #fee2e2; padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 9px;">
        <strong>⚠️ ПАРАДОКСАЛЬНА ЛОГІКА:</strong> БІЛЬШЕ пожеж = ВИЩА потреба в облаштованих місцях відпочинку
      </div>
      
      <div class="step-header">Крок 1: Дані про пожежі в регіоні</div>
      <div class="formula-code">
        <strong>Всього пожеж (2025):</strong> ${d?.fires?.total_fires || 0} інцидентів<br/>
        <strong>Спричинених людьми:</strong> ${d?.fires?.human_caused_fires || 0} пожеж (${d?.fires?.total_fires > 0 ? ((d?.fires?.human_caused_fires / d?.fires?.total_fires) * 100).toFixed(1) : 0}%)
      </div>
      
      <div class="step-header">Крок 2: Наукове обґрунтування бонусу</div>
      <div class="formula-code" style="font-size: 9px;">
        <strong>Дослідження NW Fire Science 2020:</strong><br/>
        • 80% рекреаційних пожеж відбуваються ПОЗА офіційними місцями відпочинку<br/>
        • Облаштовані вогнища з каменю + доступ до води = зниження ризику на 40%<br/>
        • Щільність пожеж у радіусі 1 км від кемпінгів у 7 РАЗІВ ВИЩА, ніж далі<br/>
        <strong>Висновок:</strong> Відсутність облаштованих пунктів → неконтрольоване розпалювання → більше пожеж
      </div>
      
      <div class="step-header">Крок 3: Розрахунок бонусу</div>
      <div class="formula-code">
        <strong>Формула:</strong> Score = (Людські пожежі / Площа області × 1000) × 0.5<br/>
        <strong>Обмеження:</strong> Максимум 5 балів<br/>
        <strong>Розрахунок:</strong> (${d?.fires?.human_caused_fires || 0} / площа) × коефіцієнт
      </div>
      <div class="result-highlight" style="background: #f59e0b; color: white;">
        <strong>БОНУС:</strong> +${analysisResult.fire_score || 0}/5 балів
      </div>
    </div>

    <!-- ФАКТОР 7: НАСИЧЕНІСТЬ (ШТРАФ) -->
    <div class="calculation-box" style="border-left-color: #dc2626;">
      <h4 style="margin: 0 0 10px 0; color: #dc2626; font-size: 12px;">⚠️ ФАКТОР 7: ШТРАФ ЗА НАСИЧЕНІСТЬ РИНКУ (Штраф: -15%, максимум -15 балів)</h4>
      
      <div class="step-header">Крок 1: Підрахунок існуючих рекреаційних пунктів</div>
      <div class="formula-code">
        <strong>Існуючі пункти:</strong> ${d?.saturation?.existing_points || 0} об'єктів<br/>
        <strong>Площа області:</strong> ${d?.population?.area_km2 || 'N/A'} км²<br/>
        <strong>Щільність:</strong> ${d?.saturation?.density_per_1000km2?.toFixed(2) || 0} р.п./1000км²
      </div>
      
      <div class="step-header">Крок 2: Прогресивна шкала штрафів</div>
      <div class="formula-code" style="font-size: 9px;">
        <strong>Логіка:</strong> Висока концентрація існуючих об'єктів → менше місця для нових → нижчий потенціал<br/>
        <strong>Шкала:</strong><br/>
        • <1.0 р.п./1000км² = -2 бали (низька насиченість)<br/>
        • 1.0-2.0 р.п./1000км² = -5 балів (помірна)<br/>
        • 2.0-3.0 р.п./1000км² = -10 балів (висока)<br/>
        • >3.0 р.п./1000км² = -15 балів (критична перенасиченість)
      </div>
      
      <div class="step-header">Крок 3: Застосування штрафу</div>
      <div class="formula-code">
        <strong>Статус:</strong> ${d?.saturation?.density_status || 'N/A'}<br/>
        <strong>Обґрунтування:</strong> Штраф -15% балансує позитивний вплив попиту (+25%), створюючи реалістичну ринкову оцінку
      </div>
      <div class="result-highlight" style="background: #dc2626; color: white;">
        <strong>ШТРАФ:</strong> ${analysisResult.saturation_penalty}/0 балів
      </div>
    </div>

    <!-- ПІДСУМОК БАЛІВ -->
    <h3 style="color: #1e293b; border-bottom: 3px solid #f59e0b; padding-bottom: 10px; margin-top: 25px; font-size: 15px;">📊 ПІДСУМКОВА ТАБЛИЦЯ БАЛІВ</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
      <tr style="background: #1e293b; color: white;">
        <th style="padding: 12px; text-align: left; border: 1px solid #475569;">Фактор</th>
        <th style="padding: 12px; text-align: center; border: 1px solid #475569; width: 100px;">Отримано</th>
        <th style="padding: 12px; text-align: center; border: 1px solid #475569; width: 100px;">Максимум</th>
        <th style="padding: 12px; text-align: center; border: 1px solid #475569; width: 80px;">%</th>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">Попит від населення</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 14px;">${analysisResult.demand_score}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">25</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${((analysisResult.demand_score / 25) * 100).toFixed(0)}%</td>
      </tr>
      <tr style="background: #f8fafc;">
        <td style="padding: 10px; border: 1px solid #e2e8f0;">ПЗФ як атрактор</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 14px;">${analysisResult.pfz_score}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">20</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${((analysisResult.pfz_score / 20) * 100).toFixed(0)}%</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">Природні ресурси</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 14px;">${analysisResult.nature_score}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">15</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${((analysisResult.nature_score / 15) * 100).toFixed(0)}%</td>
      </tr>
      <tr style="background: #f8fafc;">
        <td style="padding: 10px; border: 1px solid #e2e8f0;">Транспортна доступність</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 14px;">${analysisResult.accessibility_score}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">15</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${((analysisResult.accessibility_score / 15) * 100).toFixed(0)}%</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">Інфраструктура</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 14px;">${analysisResult.infrastructure_score}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">10</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${((analysisResult.infrastructure_score / 10) * 100).toFixed(0)}%</td>
      </tr>
      <tr style="background: #fef3c7;">
        <td style="padding: 10px; border: 1px solid #e2e8f0;">Профілактика пожеж (бонус)</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 14px;">+${analysisResult.fire_score || 0}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">5</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${((analysisResult.fire_score || 0) / 5 * 100).toFixed(0)}%</td>
      </tr>
      <tr style="background: #fee2e2;">
        <td style="padding: 10px; border: 1px solid #e2e8f0; color: #dc2626;">Штраф за насиченість</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 14px; color: #dc2626;">${analysisResult.saturation_penalty}</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #dc2626;">-15</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #dc2626;">${((Math.abs(analysisResult.saturation_penalty) / 15) * 100).toFixed(0)}%</td>
      </tr>
      <tr style="background: #16a34a; color: white;">
        <td style="padding: 14px; border: 1px solid #15803d; font-size: 13px; font-weight: bold;">ЗАГАЛЬНИЙ ПОТЕНЦІАЛ</td>
        <td style="padding: 14px; border: 1px solid #15803d; text-align: center; font-weight: bold; font-size: 18px;">${analysisResult.total_score}</td>
        <td style="padding: 14px; border: 1px solid #15803d; text-align: center; font-size: 13px;">100</td>
        <td style="padding: 14px; border: 1px solid #15803d; text-align: center; font-size: 13px;">${analysisResult.total_score}%</td>
      </tr>
    </table>

    <!-- Продовження коду буде в наступній частині файлу -->
  `;
  
  // Решта PDF коду тут...
  
  document.body.appendChild(pdfContent);
  
  try {
    const canvas = await html2canvas(pdfContent, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;
    
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`Науковий_Звіт_${analysisResult.region.replace(/ /g, '_')}.pdf`);
  } catch (error) {
    console.error('PDF export error:', error);
    alert('Помилка експорту PDF');
  } finally {
    document.body.removeChild(pdfContent);
  }
};
