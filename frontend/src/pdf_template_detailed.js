// ДЕТАЛЬНИЙ ШАБЛОН PDF З ПОВНИМИ МАТЕМАТИЧНИМИ РОЗРАХУНКАМИ
export const getDetailedPDFTemplate = (analysisResult, getScoreColor, getCategoryColor) => {
  const d = analysisResult.details;
  const shouldBuild = d?.investment?.should_build;
  
  return `
    <style>
      .calc-box {
        background: #f8fafc;
        border-left: 4px solid #3b82f6;
        padding: 15px;
        margin: 15px 0;
        font-size: 10px;
        page-break-inside: avoid;
      }
      .formula {
        background: white;
        padding: 10px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        border: 1px solid #e2e8f0;
        margin: 8px 0;
        font-size: 9px;
      }
      .step-title {
        font-weight: bold;
        color: #1e40af;
        margin: 10px 0 5px 0;
        font-size: 11px;
      }
      .result-box {
        background: #fef3c7;
        padding: 8px 12px;
        border-radius: 4px;
        font-weight: bold;
        display: inline-block;
        margin: 8px 0;
        border: 1px solid #f59e0b;
      }
      .final-result {
        background: #16a34a;
        color: white;
        padding: 10px 15px;
        border-radius: 6px;
        font-weight: bold;
        margin: 10px 0;
        font-size: 12px;
      }
    </style>

    <!-- ТИТУЛЬНА СТОРІНКА -->
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #f59e0b; padding-bottom: 25px;">
      <h1 style="color: #1e293b; margin: 0; font-size: 26px; font-weight: bold;">НАУКОВИЙ ЗВІТ</h1>
      <h2 style="color: #f59e0b; margin: 12px 0; font-size: 20px;">АНАЛІЗ РЕКРЕАЦІЙНОГО ПОТЕНЦІАЛУ УКРАЇНИ</h2>
      <h3 style="color: #475569; margin: 12px 0; font-size: 18px;">${analysisResult.region}</h3>
      <div style="display: inline-block; width: 95px; height: 95px; border-radius: 50%; background: ${getScoreColor(analysisResult.total_score)}; color: white; line-height: 95px; font-size: 36px; font-weight: bold; margin: 20px 0; border: 5px solid #f59e0b; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        ${analysisResult.total_score}
      </div>
      <p style="color: #64748b; margin: 8px 0; font-size: 13px; font-weight: bold;">зі 100 балів</p>
      <span style="display: inline-block; padding: 8px 18px; border-radius: 20px; background: ${getCategoryColor(analysisResult.category)}; color: white; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${analysisResult.category}</span>
      <p style="color: #94a3b8; margin-top: 25px; font-size: 11px;">Згенеровано: ${new Date().toLocaleString('uk-UA', { dateStyle: 'full', timeStyle: 'short' })}</p>
      <p style="color: #94a3b8; margin: 8px 0; font-size: 10px;">Методологія: Analytic Hierarchy Process (AHP) | Версія 1.0</p>
    </div>
    
    <!-- МЕТОДОЛОГІЧНА БАЗА -->
    <h3 style="color: #1e293b; border-bottom: 3px solid #f59e0b; padding-bottom: 12px; margin-top: 30px; font-size: 16px;">📐 МЕТОДОЛОГІЯ: 7-ФАКТОРНА МОДЕЛЬ ОЦІНКИ</h3>
    
    <div style="background: #fef3c7; padding: 18px; border-left: 5px solid #f59e0b; margin-bottom: 25px; font-size: 11px; border-radius: 4px;">
      <p style="margin: 0 0 12px 0; font-weight: bold; font-size: 12px; color: #92400e;">Загальна формула розрахунку потенціалу:</p>
      <div style="background: white; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 10px; line-height: 2; box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);">
        <strong style="color: #1e40af; font-size: 11px;">ПОТЕНЦІАЛ</strong> = 
        <span style="color: #16a34a; font-weight: bold;">Попит(0-25)</span> + 
        <span style="color: #16a34a; font-weight: bold;">ПЗФ(0-20)</span> + 
        <span style="color: #16a34a; font-weight: bold;">Природа(0-15)</span> + 
        <span style="color: #16a34a; font-weight: bold;">Транспорт(0-15)</span> + 
        <span style="color: #16a34a; font-weight: bold;">Інфраструктура(0-10)</span> + 
        <span style="color: #16a34a; font-weight: bold;">Пожежі(0-5)</span> 
        <span style="color: #dc2626; font-weight: bold;">- Насиченість(0-15)</span>
      </div>
      <p style="margin: 12px 0 0 0; font-size: 10px; color: #78350f; line-height: 1.6;">
        <strong>🎓 Наукове обґрунтування:</strong> Модель базується на методі <strong>Analytic Hierarchy Process (AHP)</strong> - міжнародно визнаному підході до багатокритеріального прийняття рішень. 
        Вагові коефіцієнти визначені на основі досліджень Kentucky SCORP 2020-2025, District of Columbia SCORP 2020, NW Fire Science 2020 
        та адаптовані до українського контексту з урахуванням Закону України "Про природно-заповідний фонд".
      </p>
    </div>
    
    <!-- ТАБЛИЦЯ ВАГОВИХ КОЕФІЦІЄНТІВ -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <tr style="background: linear-gradient(to bottom, #1e293b, #334155); color: white;">
        <th style="padding: 12px; text-align: left; border: 1px solid #475569;">Фактор</th>
        <th style="padding: 12px; text-align: center; border: 1px solid #475569; width: 15%;">Вага</th>
        <th style="padding: 12px; text-align: left; border: 1px solid #475569;">Формула</th>
        <th style="padding: 12px; text-align: center; border: 1px solid #475569; width: 18%;">Обґрунтування</th>
      </tr>
      <tr style="background: #f0fdf4;">
        <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>1. Попит населення</strong></td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a; font-size: 12px;">25%</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 9px;">Населення × 0.15 × 3 відв./рік - Пропозиція</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 9px;">Найвищий пріоритет [1]</td>
      </tr>
      <tr style="background: #ecfdf5;">
        <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>2. ПЗФ атрактор</strong></td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a; font-size: 12px;">20%</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 9px;">НПП×2.0 + Заповідн.×1.5 + РЛП×1.0 + Заказ.×0.3</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 9px;">Туристична цінність [2]</td>
      </tr>
      <tr style="background: #f0fdf4;">
        <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>3. Природні ресурси</strong></td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a; font-size: 12px;">15%</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 9px;">Лісистість% × 0.275 + Водойми(так=4)</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 9px;">Естетична цінність [3]</td>
      </tr>
      <tr style="background: #ecfdf5;">
        <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>4. Транспорт</strong></td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a; font-size: 12px;">15%</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 9px;">f(Щільність доріг, М-траси, Залізниця, Аеропорти)</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 9px;">Критичний бар'єр [4]</td>
      </tr>
      <tr style="background: #f0fdf4;">
        <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>5. Інфраструктура</strong></td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a; font-size: 12px;">10%</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 9px;">Медицина(3)+Заправки(2)+Зв'язок(2)+Інше(3)</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 9px;">Може бути побудована [5]</td>
      </tr>
      <tr style="background: #fef3c7;">
        <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>6. Пожежі (бонус)</strong></td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #f59e0b; font-size: 12px;">+5%</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 9px;">(Людські пожежі / Площа) × 100 × 0.5</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 9px;">Профілактика [6]</td>
      </tr>
      <tr style="background: #fee2e2;">
        <td style="padding: 10px; border: 1px solid #e2e8f0; color: #dc2626;"><strong>7. Насиченість (штраф)</strong></td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #dc2626; font-size: 12px;">-15%</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 9px; color: #dc2626;">Прогресивна шкала: 0 до -15 балів</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 9px; color: #dc2626;">Ринкова конкуренція [7]</td>
      </tr>
    </table>
    
    <div style="background: #dbeafe; padding: 12px; border-radius: 6px; margin-bottom: 25px; font-size: 9px; border-left: 4px solid #3b82f6;">
      <p style="margin: 0; color: #1e40af; line-height: 1.7;">
        <strong>📚 Джерела обґрунтування:</strong> [1] Kentucky SCORP 2020-2025 (Demand Analysis), 
        [2] Wiley "AHP for Ecotourism Site Selection" 2022, [3] SCIRP "GIS-AHP Tourist Resort Location" 2018, 
        [4] District of Columbia SCORP 2020 (Access Barriers), [5] Laguna Hills Recreation Assessment 2021, 
        [6] NW Fire Science "Human and Climatic Influences on Wildfires" 2020, 
        [7] Kentucky SCORP Market Saturation Analysis
      </p>
    </div>

    <!-- ДЕТАЛЬНІ МАТЕМАТИЧНІ РОЗРАХУНКИ -->
    <div style="page-break-before: always;"></div>
    <h3 style="color: #1e293b; border-bottom: 3px solid #f59e0b; padding-bottom: 12px; margin-top: 30px; font-size: 16px;">🧮 ПОКРОКОВІ МАТЕМАТИЧНІ РОЗРАХУНКИ</h3>
    
    <!-- ФАКТОР 1: ПОПИТ -->
    <div class="calc-box">
      <h4 style="margin: 0 0 15px 0; color: #1e40af; font-size: 13px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
        📊 ФАКТОР 1: ПОПИТ ВІД НАСЕЛЕННЯ (Вага: 25%, максимум 25 балів)
      </h4>
      
      <div class="step-title">▶ Крок 1: Розрахунок річного попиту на рекреацію</div>
      <div class="formula">
        <strong>Формула:</strong> Річний попит = Населення × Коефіцієнт участі × Кількість відвідувань<br/>
        <strong>Підставлення:</strong> ${d?.population?.total?.toLocaleString() || 'N/A'} осіб × 0.15 × 3 відв./рік<br/>
        <strong>Обґрунтування коефіцієнта 0.15:</strong> 15% населення - це потенційні відвідувачі рекреаційних об'єктів. 
        Базується на статистиці участі населення США у рекреації (Kentucky SCORP 2020)<br/>
        <strong>Обґрунтування 3 відвідувань:</strong> Середня кількість візитів на рік для активних рекреантів (District of Columbia SCORP)
      </div>
      <div class="result-box" style="background: #dbeafe; border-color: #3b82f6;">
        Результат: ${((d?.population?.total || 0) * 0.15 * 3).toLocaleString()} відвідувань/рік
      </div>
      
      <div class="step-title">▶ Крок 2: Оцінка існуючої пропозиції</div>
      <div class="formula">
        <strong>Формула:</strong> Річна пропозиція = Існуючі місця × Тривалість сезону × Кількість змін<br/>
        <strong>Існуючі рекреаційні пункти:</strong> ${d?.saturation?.existing_points || 0} об'єктів<br/>
        <strong>Середня місткість на пункт:</strong> 50 місць (стандартний показник)<br/>
        <strong>Тривалість сезону:</strong> 180 днів (з урахуванням погодних умов України)<br/>
        <strong>Кількість змін:</strong> 2 зміни на день<br/>
        <strong>Розрахунок:</strong> ${d?.saturation?.existing_points || 0} пункт. × 50 місць × 180 днів × 2 зміни
      </div>
      <div class="result-box" style="background: #dbeafe; border-color: #3b82f6;">
        Результат: ${((d?.saturation?.existing_points || 0) * 50 * 180 * 2).toLocaleString()} місць/рік
      </div>
      
      <div class="step-title">▶ Крок 3: Визначення дефіциту або профіциту</div>
      <div class="formula">
        <strong>Формула:</strong> Gap = Попит - Пропозиція<br/>
        <strong>Розрахунок:</strong> ${((d?.population?.total || 0) * 0.15 * 3).toLocaleString()} - ${((d?.saturation?.existing_points || 0) * 50 * 180 * 2).toLocaleString()}<br/>
        <strong>Інтерпретація:</strong> Позитивне значення = дефіцит (потрібно будувати більше), 
        Негативне = профіцит (ринок насичений)
      </div>
      <div class="result-box" style="background: ${d?.population?.gap > 0 ? '#fee2e2' : '#dcfce7'}; border-color: ${d?.population?.gap > 0 ? '#dc2626' : '#16a34a'};">
        Результат: ${d?.population?.gap > 0 ? '+' : ''}${(d?.population?.gap || 0).toLocaleString()} відв. — ${d?.population?.gap_status || 'N/A'}
      </div>
      
      <div class="step-title">▶ Крок 4: Нормалізація до шкали 0-25 балів</div>
      <div class="formula">
        <strong>Метод:</strong> Логарифмічна нормалізація з урахуванням розміру дефіциту та населення<br/>
        <strong>Логіка:</strong> Більший дефіцит при більшому населенні = вищий бал (вища економічна доцільність)<br/>
        <strong>Формула нормалізації:</strong> score = min(25, (gap / населення × 100000) × коефіцієнт)<br/>
        <strong>Обмеження:</strong> Мінімум 0 балів, максимум 25 балів
      </div>
      <div class="final-result">
        ✅ ФІНАЛЬНИЙ БАЛ ЗА ПОПИТОМ: ${analysisResult.demand_score}/25
      </div>
    </div>

    <!-- ФАКТОР 2: ПЗФ -->
    <div class="calc-box" style="border-left-color: #16a34a;">
      <h4 style="margin: 0 0 15px 0; color: #16a34a; font-size: 13px; border-bottom: 2px solid #16a34a; padding-bottom: 8px;">
        🌲 ФАКТОР 2: ПЗФ ЯК ТУРИСТИЧНИЙ АТРАКТОР (Вага: 20%, максимум 20 балів)
      </h4>
      
      <div class="step-title">▶ Крок 1: Підрахунок ПЗФ за категоріями з ваговими коефіцієнтами</div>
      <div class="formula">
        <strong>Формула:</strong> Score = НПП×2.0 + Заповідники×1.5 + РЛП×1.0 + Заказники×0.3<br/>
        <strong>Обґрунтування вагів:</strong><br/>
        • <strong>НПП (×2.0):</strong> Найвища туристична привабливість, міжнародна впізнаваність, розвинена інфраструктура (Wiley AHP 2022)<br/>
        • <strong>Заповідники (×1.5):</strong> Висока природна цінність, обмежений доступ, екологічний туризм<br/>
        • <strong>РЛП (×1.0):</strong> Регіональна значущість, помірна туристична цінність<br/>
        • <strong>Заказники (×0.3):</strong> Локальна значущість, обмежена туристична інфраструктура<br/><br/>
        <strong>Вхідні дані для ${analysisResult.region}:</strong><br/>
        • Національні природні парки (НПП): ${d?.pfz?.national_parks || 0} шт. × 2.0 = <strong>${((d?.pfz?.national_parks || 0) * 2).toFixed(1)}</strong><br/>
        • Природні заповідники: ${d?.pfz?.nature_reserves || 0} шт. × 1.5 = <strong>${((d?.pfz?.nature_reserves || 0) * 1.5).toFixed(1)}</strong><br/>
        • Регіональні ландшафтні парки (РЛП): ${d?.pfz?.regional_landscape_parks || 0} шт. × 1.0 = <strong>${((d?.pfz?.regional_landscape_parks || 0) * 1.0).toFixed(1)}</strong><br/>
        • Заказники: ${d?.pfz?.zakazniks || 0} шт. × 0.3 = <strong>${((d?.pfz?.zakazniks || 0) * 0.3).toFixed(1)}</strong>
      </div>
      <div class="result-box" style="background: #dcfce7; border-color: #16a34a;">
        Сума балів: ${((d?.pfz?.national_parks || 0) * 2 + (d?.pfz?.nature_reserves || 0) * 1.5 + (d?.pfz?.regional_landscape_parks || 0) * 1.0 + (d?.pfz?.zakazniks || 0) * 0.3).toFixed(2)}
      </div>
      
      <div class="step-title">▶ Крок 2: Коригування за площею ПЗФ</div>
      <div class="formula">
        <strong>Додатковий фактор:</strong> Площа території під ПЗФ = ${d?.pfz?.percent_of_region || 0}%<br/>
        <strong>Логіка:</strong> Більша площа ПЗФ = вища туристична привабливість регіону<br/>
        <strong>Коефіцієнт коригування:</strong> K = 1 + (площа_ПЗФ% / 100) × 0.2
      </div>
      
      <div class="step-title">▶ Крок 3: Нормалізація до шкали 0-20 балів</div>
      <div class="formula">
        <strong>Метод:</strong> Нелінійна нормалізація з урахуванням кількості та типу ПЗФ<br/>
        <strong>Максимум:</strong> 20 балів (обмеження)<br/>
        <strong>Формула:</strong> score = min(20, weighted_sum × площа_коефіцієнт)
      </div>
      <div class="final-result" style="background: #16a34a;">
        ✅ ФІНАЛЬНИЙ БАЛ ЗА ПЗФ: ${analysisResult.pfz_score}/20
      </div>
      
      ${d?.pfz?.notable_objects && d.pfz.notable_objects.length > 0 ? `
      <div style="background: #f0fdf4; padding: 12px; border-radius: 4px; margin-top: 12px; border: 1px solid #86efac; font-size: 10px;">
        <strong style="color: #166534;">🏞️ Визначні ПЗФ об'єкти регіону:</strong><br/>
        ${d.pfz.notable_objects.map(obj => `• ${obj}`).join('<br/>')}
        <br/><br/>
        <em style="color: #15803d;">Ці об'єкти є ключовими туристичними атракторами для розміщення рекреаційних зон</em>
      </div>
      ` : ''}
    </div>

    <!-- Продовження розрахунків для інших факторів... -->
    
    <!-- ФАКТОР 3: ПРИРОДА -->
    <div class="calc-box" style="border-left-color: #059669;">
      <h4 style="margin: 0 0 15px 0; color: #059669; font-size: 13px; border-bottom: 2px solid #059669; padding-bottom: 8px;">
        🌳 ФАКТОР 3: ПРИРОДНІ РЕСУРСИ (Вага: 15%, максимум 15 балів)
      </h4>
      
      <div class="step-title">▶ Компонент A: Лісове покриття (0-11 балів)</div>
      <div class="formula">
        <strong>Формула:</strong> Ліси = Лісистість% × 0.275 (коефіцієнт нормалізації до 11 балів)<br/>
        <strong>Вхідні дані:</strong> Лісистість області = ${d?.nature?.forest_coverage_percent || 0}%<br/>
        <strong>Розрахунок:</strong> ${d?.nature?.forest_coverage_percent || 0}% × 0.275 = ${((d?.nature?.forest_coverage_percent || 0) * 0.275).toFixed(2)} балів<br/>
        <strong>Обґрунтування:</strong> Ліси забезпечують:<br/>
        • Естетичну цінність ландшафту<br/>
        • Різноманітність рекреаційних активностей (піші прогулянки, їзда на велосипеді)<br/>
        • Екологічну чистоту повітря<br/>
        • Затінення від спеки влітку<br/>
        <strong>Максимум:</strong> 11 балів (при лісистості 40%+)
      </div>
      <div class="result-box" style="background: #d1fae5; border-color: #059669;">
        Бал за ліси: ${Math.min(11, ((d?.nature?.forest_coverage_percent || 0) * 0.275)).toFixed(1)}/11
      </div>
      
      <div class="step-title">▶ Компонент Б: Водні об'єкти (0-4 бали)</div>
      <div class="formula">
        <strong>Формула:</strong> Водойми = 4 (якщо присутні) або 0 (якщо відсутні)<br/>
        <strong>Вхідні дані:</strong> ${d?.nature?.has_water_bodies ? '✅ Наявні водойми' : '❌ Відсутні водойми'}<br/>
        <strong>Обґрунтування:</strong> Водойми (річки, озера, водосховища) розширюють можливості:<br/>
        • Риболовля<br/>
        • Плавання та купання<br/>
        • Водні види спорту (човни, каяки)<br/>
        • Пляжний відпочинок<br/>
        • Підвищення естетичної привабливості<br/>
        <strong>Максимум:</strong> 4 бали (бінарна оцінка: є/немає)
      </div>
      <div class="result-box" style="background: #d1fae5; border-color: #059669;">
        Бал за водойми: ${d?.nature?.has_water_bodies ? '4/4' : '0/4'}
      </div>
      
      <div class="step-title">▶ Крок 3: Сумарний бал за природу</div>
      <div class="formula">
        <strong>Формула:</strong> TOTAL = Ліси + Водойми<br/>
        <strong>Розрахунок:</strong> ${Math.min(11, ((d?.nature?.forest_coverage_percent || 0) * 0.275)).toFixed(1)} + ${d?.nature?.has_water_bodies ? 4 : 0} = ${analysisResult.nature_score}<br/>
        <strong>Максимум:</strong> 15 балів (11 + 4)
      </div>
      <div class="final-result" style="background: #059669;">
        ✅ ФІНАЛЬНИЙ БАЛ ЗА ПРИРОДУ: ${analysisResult.nature_score}/15
      </div>
    </div>

    <!-- Продовження на наступній сторінці через обмеження розміру -->
  `;
};
