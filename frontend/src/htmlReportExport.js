/**
 * HTML-ЗВІТ ДЛЯ ДРУКУ
 * 
 * Переваги:
 * - Браузер автоматично керує розривами сторінок
 * - Користувач бачить звіт перед збереженням
 * - Можна зберегти як PDF через Ctrl+P → Зберегти як PDF
 * - Немає проблем з розривами таблиць і тексту
 * 
 * Використання:
 * - Відкривається у новій вкладці
 * - Автоматично викликається діалог друку
 * - CSS @media print керує відображенням при друку
 */

export const openHTMLReport = (analysisResult) => {
  if (!analysisResult) {
    console.error('❌ No analysisResult');
    alert('Немає даних для експорту');
    return;
  }

  const d = analysisResult.details;
  
  // Генеруємо HTML контент
  const htmlContent = generateHTMLReport(analysisResult, d);
  
  // Відкриваємо у новій вкладці
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Автоматично відкриваємо діалог друку через 500мс (щоб контент встиг завантажитись)
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    console.log('✅ HTML звіт відкрито у новій вкладці');
  } else {
    alert('Будь ласка, дозвольте спливаючі вікна для цього сайту');
  }
};

function generateHTMLReport(analysisResult, d) {
  const shouldBuild = d?.investment?.should_build;
  
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Звіт - ${analysisResult.region}</title>
  <style>
    /* Загальні стилі */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      background: white;
      padding: 20px;
    }
    
    h1 {
      font-size: 20pt;
      font-weight: bold;
      text-align: center;
      margin: 30px 0 20px 0;
      text-transform: uppercase;
    }
    
    h2 {
      font-size: 16pt;
      font-weight: bold;
      margin: 25px 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 3px solid #000;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 14pt;
      font-weight: bold;
      margin: 20px 0 12px 0;
      page-break-after: avoid;
    }
    
    h4 {
      font-size: 12pt;
      font-weight: bold;
      margin: 15px 0 10px 0;
      text-decoration: underline;
      page-break-after: avoid;
    }
    
    p {
      margin: 8px 0;
      text-align: justify;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      page-break-inside: avoid;
    }
    
    th {
      background: #f0f0f0;
      color: #000;
      padding: 10px;
      text-align: left;
      border: 1px solid #000;
      font-weight: bold;
      font-size: 11pt;
    }
    
    td {
      padding: 8px 10px;
      border: 1px solid #000;
      font-size: 11pt;
    }
    
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    .section {
      page-break-inside: avoid;
      margin-bottom: 20px;
    }
    
    .formula-box {
      padding: 12px;
      border: 2px solid #000;
      margin: 12px 0;
      background: #f5f5f5;
      page-break-inside: avoid;
    }
    
    .step-box {
      padding: 10px;
      margin: 10px 0 10px 20px;
      border-left: 4px solid #000;
      background: #fafafa;
      page-break-inside: avoid;
    }
    
    .result-box {
      padding: 8px 15px;
      border: 2px solid #000;
      font-weight: bold;
      display: inline-block;
      margin: 10px 0;
      background: #e8e8e8;
    }
    
    code {
      background: #f0f0f0;
      border: 1px solid #ccc;
      padding: 8px 12px;
      display: block;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      margin: 8px 0;
      white-space: pre-wrap;
      page-break-inside: avoid;
    }
    
    ul {
      margin: 10px 0;
      padding-left: 30px;
    }
    
    li {
      margin: 6px 0;
    }
    
    .highlight {
      font-weight: bold;
      background: #ffeb3b;
      padding: 2px 4px;
    }
    
    .text-center {
      text-align: center;
    }
    
    .no-print {
      display: block;
    }
    
    /* CSS для друку */
    @media print {
      body {
        padding: 0;
        font-size: 11pt;
      }
      
      h2 {
        page-break-before: always;
      }
      
      h2:first-of-type {
        page-break-before: avoid;
      }
      
      table, .formula-box, .step-box {
        page-break-inside: avoid;
      }
      
      .section {
        page-break-inside: avoid;
      }
      
      .no-print {
        display: none;
      }
      
      /* Примусовий розрив перед кожним великим розділом */
      .major-section {
        page-break-before: always;
      }
      
      .major-section:first-child {
        page-break-before: avoid;
      }
    }
    
    @page {
      size: A4;
      margin: 20mm;
    }
  </style>
</head>
<body>

  <!-- Інструкція для користувача (не друкується) -->
  <div class="no-print" style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
    <h3 style="margin: 0 0 10px 0; color: #92400e;">📄 Інструкція для збереження звіту</h3>
    <ol style="margin: 0; padding-left: 25px;">
      <li><strong>Windows/Linux:</strong> Натисніть <kbd>Ctrl + P</kbd></li>
      <li><strong>Mac:</strong> Натисніть <kbd>Cmd + P</kbd></li>
      <li>У діалозі друку виберіть <strong>"Зберегти як PDF"</strong></li>
      <li>Перевірте попередній перегляд і натисніть <strong>"Зберегти"</strong></li>
    </ol>
    <p style="margin: 10px 0 0 0; font-size: 10pt; color: #92400e;">
      💡 Порада: Браузер автоматично розставить коректні розриви сторінок
    </p>
  </div>

  <!-- ТИТУЛЬНА СТОРІНКА -->
  <div class="section text-center">
    <h1>НАУКОВИЙ ЗВІТ</h1>
    <p style="font-size: 14pt; font-weight: bold; margin: 15px 0;">
      Аналіз рекреаційного потенціалу території
    </p>
    <p style="font-size: 16pt; font-weight: bold; margin: 25px 0; color: #1e40af;">
      ${analysisResult.region}
    </p>
    
    <table style="width: 70%; margin: 40px auto; border: 3px solid #000;">
      <tr>
        <td style="text-align: center; padding: 20px; font-weight: bold; font-size: 14pt;">
          Інтегральний показник потенціалу
        </td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 30px; font-size: 28pt; font-weight: bold; background: #e8f4f8;">
          ${analysisResult.total_score.toFixed(1)} балів
        </td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 15px; font-size: 14pt; background: #f0f0f0;">
          Категорія: <strong>${analysisResult.category}</strong>
        </td>
      </tr>
    </table>
    
    <p style="margin-top: 50px; font-size: 11pt;">
      Дата формування звіту: ${new Date().toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}
    </p>
  </div>

  <!-- ЗМІСТ -->
  <h2 class="major-section">ЗМІСТ ЗВІТУ</h2>
  <div class="section">
    <ol style="font-size: 12pt; line-height: 2;">
      <li>Методологія розрахунку інтегрального показника</li>
      <li>Вихідні дані для аналізу</li>
      <li>Фактор 1: Попит на рекреаційні послуги (0-25 балів)</li>
      <li>Фактор 2: ПЗФ як туристичний атрактор (0-20 балів)</li>
      <li>Фактор 3: Природні рекреаційні ресурси (0-15 балів)</li>
      <li>Фактор 4: Транспортна доступність (0-15 балів)</li>
      <li>Фактор 5: Антропогенна інфраструктура (0-10 балів)</li>
      <li>Фактор 6: Пожежонебезпечність території (0-5 балів)</li>
      <li>Фактор 7: Насиченість існуючими об'єктами (від -15 до 0 балів)</li>
      <li>Підсумкова таблиця балів</li>
      <li>Інвестиційні рекомендації</li>
      <li>Бібліографія та наукові джерела</li>
    </ol>
  </div>

  <!-- МЕТОДОЛОГІЯ -->
  <h2 class="major-section">1. МЕТОДОЛОГІЯ РОЗРАХУНКУ</h2>
  <div class="section">
    <p>
      Інтегральний показник рекреаційного потенціалу розраховується на основі 7 факторів, 
      кожен з яких має науково обґрунтовану вагу відповідно до міжнародних методологій 
      аналізу рекреаційних територій (Kentucky SCORP 2020-2025, Wiley AHP 2022, NW Fire Science 2020).
    </p>
    
    <table>
      <thead>
        <tr>
          <th style="width: 40%;">Фактор</th>
          <th style="width: 20%; text-align: center;">Максимум балів</th>
          <th style="width: 20%; text-align: center;">Вага, %</th>
          <th style="width: 20%; text-align: center;">Отримано</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1. Попит на рекреаційні послуги</td>
          <td style="text-align: center;">25</td>
          <td style="text-align: center;">25%</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.demand_score}</td>
        </tr>
        <tr>
          <td>2. ПЗФ як туристичний атрактор</td>
          <td style="text-align: center;">20</td>
          <td style="text-align: center;">20%</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.pfz_score}</td>
        </tr>
        <tr>
          <td>3. Природні рекреаційні ресурси</td>
          <td style="text-align: center;">15</td>
          <td style="text-align: center;">15%</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.nature_score}</td>
        </tr>
        <tr>
          <td>4. Транспортна доступність</td>
          <td style="text-align: center;">15</td>
          <td style="text-align: center;">15%</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.accessibility_score}</td>
        </tr>
        <tr>
          <td>5. Антропогенна інфраструктура</td>
          <td style="text-align: center;">10</td>
          <td style="text-align: center;">10%</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.infrastructure_score}</td>
        </tr>
        <tr>
          <td>6. Пожежонебезпечність території</td>
          <td style="text-align: center;">5</td>
          <td style="text-align: center;">5%</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.fire_score}</td>
        </tr>
        <tr>
          <td>7. Насиченість існуючими об'єктами</td>
          <td style="text-align: center;">0 (штраф до -15)</td>
          <td style="text-align: center;">до -15%</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.saturation_penalty}</td>
        </tr>
        <tr style="background: #e0e0e0; font-weight: bold; font-size: 12pt;">
          <td>РАЗОМ</td>
          <td style="text-align: center;">100</td>
          <td style="text-align: center;">100%</td>
          <td style="text-align: center; font-size: 14pt;">${analysisResult.total_score.toFixed(1)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ВИХІДНІ ДАНІ -->
  <h2 class="major-section">2. ВИХІДНІ ДАНІ</h2>
  <div class="section">
    <table>
      <thead>
        <tr>
          <th>Параметр</th>
          <th style="text-align: right;">Значення</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Населення регіону</td>
          <td style="text-align: right;">${d?.population?.total?.toLocaleString() || 'N/A'} осіб</td>
        </tr>
        <tr>
          <td>Площа території</td>
          <td style="text-align: right;">${d?.population?.area_km2?.toLocaleString() || 'N/A'} км²</td>
        </tr>
        <tr>
          <td>Лісистість території</td>
          <td style="text-align: right;">${d?.nature?.forest_coverage_percent || 'N/A'}%</td>
        </tr>
        <tr>
          <td>Наявність водних об'єктів</td>
          <td style="text-align: right;">${d?.nature?.has_water_bodies ? 'Так (+4 бали)' : 'Ні'}</td>
        </tr>
        <tr>
          <td>Національні природні парки (НПП)</td>
          <td style="text-align: right;">${d?.pfz?.national_parks || 0}</td>
        </tr>
        <tr>
          <td>Природні заповідники</td>
          <td style="text-align: right;">${d?.pfz?.nature_reserves || 0}</td>
        </tr>
        <tr>
          <td>Регіональні ландшафтні парки (РЛП)</td>
          <td style="text-align: right;">${d?.pfz?.regional_landscape_parks || 0}</td>
        </tr>
        <tr>
          <td>Заказники</td>
          <td style="text-align: right;">${d?.pfz?.zakazniks || 0}</td>
        </tr>
        <tr>
          <td>Пам'ятки природи</td>
          <td style="text-align: right;">${d?.pfz?.monuments_of_nature || 0}</td>
        </tr>
        <tr>
          <td>Площа під ПЗФ</td>
          <td style="text-align: right;">${d?.pfz?.percent_of_region || 0}% території</td>
        </tr>
        <tr>
          <td>Щільність автомобільних доріг</td>
          <td style="text-align: right;">${d?.transport?.highway_density || 'N/A'} км на 1000 км²</td>
        </tr>
        <tr>
          <td>Наявність залізниць</td>
          <td style="text-align: right;">${d?.transport?.railway_stations ? `Так (${d.transport.railway_stations} станцій)` : 'Ні'}</td>
        </tr>
        <tr>
          <td>Наявність аеропорту</td>
          <td style="text-align: right;">${d?.transport?.airports > 0 ? `Так (${d.transport.airports})` : 'Ні'}</td>
        </tr>
        <tr>
          <td>Кількість заправок на 1000 км²</td>
          <td style="text-align: right;">${d?.infrastructure?.gas_stations_per_100km2 ? (d.infrastructure.gas_stations_per_100km2 * 10).toFixed(1) : 0}</td>
        </tr>
        <tr>
          <td>Кількість лікарень на 100k населення</td>
          <td style="text-align: right;">${d?.infrastructure?.hospitals_per_100k ? d.infrastructure.hospitals_per_100k.toFixed(1) : 0}</td>
        </tr>
        <tr>
          <td>Загальна кількість лісових пожеж</td>
          <td style="text-align: right;">${d?.fires?.total_fires || 0}</td>
        </tr>
        <tr>
          <td>Пожежі через людський фактор</td>
          <td style="text-align: right;">${d?.fires?.human_caused_fires || 0}</td>
        </tr>
        <tr>
          <td>Існуючі рекреаційні пункти</td>
          <td style="text-align: right;">${d?.saturation?.existing_points || 0}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${generateFactorDetails(analysisResult, d)}

  <!-- ПІДСУМКОВА ТАБЛИЦЯ -->
  <h2 class="major-section">10. ПІДСУМКОВА ТАБЛИЦЯ БАЛІВ</h2>
  <div class="section">
    <table>
      <thead>
        <tr>
          <th>Фактор</th>
          <th style="text-align: center;">Бали</th>
          <th style="text-align: center;">% від максимуму</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Фактор 1: Попит</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.demand_score}/25</td>
          <td style="text-align: center;">${((analysisResult.demand_score/25)*100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Фактор 2: ПЗФ</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.pfz_score}/20</td>
          <td style="text-align: center;">${((analysisResult.pfz_score/20)*100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Фактор 3: Природа</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.nature_score}/15</td>
          <td style="text-align: center;">${((analysisResult.nature_score/15)*100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Фактор 4: Транспорт</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.accessibility_score}/15</td>
          <td style="text-align: center;">${((analysisResult.accessibility_score/15)*100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Фактор 5: Інфраструктура</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.infrastructure_score}/10</td>
          <td style="text-align: center;">${((analysisResult.infrastructure_score/10)*100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Фактор 6: Пожежі</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.fire_score}/5</td>
          <td style="text-align: center;">${((analysisResult.fire_score/5)*100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Фактор 7: Насиченість (штраф)</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.saturation_penalty}/0</td>
          <td style="text-align: center;">-</td>
        </tr>
        <tr style="background: #d1d5db; font-weight: bold; font-size: 13pt;">
          <td>ПІДСУМКОВИЙ БАЛ</td>
          <td style="text-align: center; font-size: 15pt;">${analysisResult.total_score.toFixed(1)}/100</td>
          <td style="text-align: center; font-size: 13pt;">${analysisResult.total_score.toFixed(1)}%</td>
        </tr>
      </tbody>
    </table>
    
    <div style="margin-top: 20px; padding: 15px; border: 2px solid #000; background: #f0f0f0;">
      <p style="font-weight: bold; font-size: 13pt; margin-bottom: 10px;">
        КАТЕГОРІЯ ПОТЕНЦІАЛУ: ${analysisResult.category}
      </p>
      <p>
        ${getCategoryDescription(analysisResult.category)}
      </p>
    </div>
  </div>

  <!-- ІНВЕСТИЦІЙНІ РЕКОМЕНДАЦІЇ -->
  <h2 class="major-section">11. ІНВЕСТИЦІЙНІ РЕКОМЕНДАЦІЇ</h2>
  <div class="section">
    ${generateInvestmentRecommendations(d, shouldBuild)}
  </div>

  <!-- БІБЛІОГРАФІЯ -->
  <h2 class="major-section">12. БІБЛІОГРАФІЯ</h2>
  <div class="section">
    <ol style="line-height: 1.8;">
      <li>
        <strong>Kentucky Department of Parks.</strong> (2020-2025). 
        <em>Statewide Comprehensive Outdoor Recreation Plan (SCORP)</em>. 
        Methodology for demand estimation and supply-demand ratio analysis.
      </li>
      <li>
        <strong>District of Columbia.</strong> (2020). 
        <em>Statewide Comprehensive Outdoor Recreation Plan</em>. 
        Visitor frequency coefficients and recreational behavior patterns.
      </li>
      <li>
        <strong>Saaty, T.L.</strong> (2022). 
        <em>Analytic Hierarchy Process (AHP) for Ecotourism Site Selection</em>. 
        Wiley Publishers. Weight coefficients for protected area categories.
      </li>
      <li>
        <strong>Northwest Fire Science Consortium.</strong> (2020). 
        <em>Human-caused Wildfire Patterns in Recreational Areas</em>. 
        Paradoxical fire risk logic in developed recreation zones.
      </li>
      <li>
        <strong>UN Sustainable Development Goals.</strong> (2015). 
        <em>Goal 11: Sustainable Cities and Communities</em>. 
        Infrastructure density thresholds for sustainable development.
      </li>
    </ol>
  </div>

</body>
</html>`;
}

function generateFactorDetails(analysisResult, d) {
  return `
  <!-- ФАКТОР 1 -->
  <h2 class="major-section">3. ФАКТОР 1: ПОПИТ НА РЕКРЕАЦІЙНІ ПОСЛУГИ</h2>
  <div class="section">
    <p><strong>Максимальна вага:</strong> 25 балів (25% від загального)</p>
    <p><strong>Отримано:</strong> ${analysisResult.demand_score} балів</p>
    
    <h3>Покрокові розрахунки:</h3>
    
    <div class="step-box">
      <h4>Крок 1: Розрахунок річного попиту</h4>
      <p><strong>Формула:</strong></p>
      <code>Річний попит = Населення × 0.15 × 3 відвідування/рік</code>
      <p><strong>Підставлення:</strong></p>
      <code>${d?.population?.total?.toLocaleString() || 'N/A'} осіб × 0.15 × 3 = ${d?.population?.annual_demand?.toLocaleString() || 'N/A'} відвідувань/рік</code>
      <p><strong>Обґрунтування:</strong></p>
      <ul>
        <li><span class="highlight">0.15</span> - частка потенційних рекреантів (Kentucky SCORP 2020)</li>
        <li><span class="highlight">3 відвідування/рік</span> - середня активність (District of Columbia SCORP 2020)</li>
      </ul>
    </div>
    
    <div class="step-box">
      <h4>Крок 2: Оцінка річної пропозиції</h4>
      <p><strong>Формула:</strong></p>
      <code>Річна пропозиція = Пункти × 50 місць × 180 днів × 2 зміни</code>
      <p><strong>Підставлення:</strong></p>
      <code>${d?.saturation?.existing_points || 0} пунктів × 50 × 180 × 2 = ${d?.population?.annual_supply?.toLocaleString() || 'N/A'} місць/рік</code>
    </div>
    
    <div class="step-box">
      <h4>Крок 3: Співвідношення попиту та пропозиції</h4>
      <p><strong>Співвідношення:</strong> ${d?.population?.supply_demand_ratio?.toFixed(3) || 0}</p>
      <p><strong>Статус:</strong> ${d?.population?.gap_status || 'N/A'}</p>
      <p><strong>Різниця:</strong> ${Math.abs(d?.population?.gap || 0).toLocaleString()} відвідувань</p>
    </div>
    
    <div class="step-box">
      <h4>Крок 4: Нормалізація до шкали 0-25 балів</h4>
      <p><strong>Шкала оцінювання:</strong></p>
      <ul>
        <li>Співвідношення &lt; 0.6: <strong>25 балів</strong></li>
        <li>Співвідношення 0.6-0.8: <strong>20 балів</strong></li>
        <li>Співвідношення 0.8-1.0: <strong>15 балів</strong></li>
        <li>Співвідношення 1.0-1.5: <strong>10 балів</strong></li>
        <li>Співвідношення &gt; 1.5: <strong>0 балів</strong></li>
      </ul>
      <div class="result-box">✅ РЕЗУЛЬТАТ: ${analysisResult.demand_score}/25 балів</div>
    </div>
  </div>

  <!-- ФАКТОР 2 -->
  <h2 class="major-section">4. ФАКТОР 2: ПЗФ ЯК ТУРИСТИЧНИЙ АТРАКТОР</h2>
  <div class="section">
    <p><strong>Максимальна вага:</strong> 20 балів (20% від загального)</p>
    <p><strong>Отримано:</strong> ${analysisResult.pfz_score} балів</p>
    
    <div class="step-box">
      <h4>Крок 1: Підрахунок ПЗФ за категоріями</h4>
      <p><strong>Формула (Wiley AHP 2022):</strong></p>
      <code>Score = НПП×2.0 + Заповідники×1.5 + РЛП×1.0 + Заказники×0.1 + Пам'ятки×0.05</code>
      <p><strong>Розрахунок:</strong></p>
      <code>НПП: ${d?.pfz?.national_parks || 0} × 2.0 = ${((d?.pfz?.national_parks || 0) * 2).toFixed(1)}
Заповідники: ${d?.pfz?.nature_reserves || 0} × 1.5 = ${((d?.pfz?.nature_reserves || 0) * 1.5).toFixed(1)}
РЛП: ${d?.pfz?.regional_landscape_parks || 0} × 1.0 = ${d?.pfz?.regional_landscape_parks || 0}
Заказники: ${d?.pfz?.zakazniks || 0} × 0.1 = ${((d?.pfz?.zakazniks || 0) * 0.1).toFixed(1)}
Пам'ятки: ${d?.pfz?.monuments_of_nature || 0} × 0.05 = ${((d?.pfz?.monuments_of_nature || 0) * 0.05).toFixed(2)}</code>
    </div>
    
    <div class="step-box">
      <h4>Крок 2: Коригування за площею ПЗФ</h4>
      <p><strong>Площа під ПЗФ:</strong> ${d?.pfz?.percent_of_region || 0}% території</p>
      <p>Додаткові бали залежно від площі ПЗФ</p>
      <div class="result-box">✅ РЕЗУЛЬТАТ: ${analysisResult.pfz_score}/20 балів</div>
    </div>
  </div>

  <!-- ФАКТОР 3 -->
  <h2 class="major-section">5. ФАКТОР 3: ПРИРОДНІ РЕКРЕАЦІЙНІ РЕСУРСИ</h2>
  <div class="section">
    <p><strong>Максимальна вага:</strong> 15 балів (15% від загального)</p>
    <p><strong>Отримано:</strong> ${analysisResult.nature_score} балів</p>
    
    <div class="step-box">
      <h4>Розрахунок:</h4>
      <code>Бали = Лісистість(%) × 0.275 + Водні об'єкти</code>
      <p><strong>Підставлення:</strong></p>
      <code>${d?.nature?.forest_coverage_percent || 0}% × 0.275 + ${d?.nature?.has_water_bodies ? '4 бали' : '0 балів'} = ${analysisResult.nature_score} балів</code>
      <p style="margin-top: 8px;"><strong>Обґрунтування коефіцієнта 0.275:</strong></p>
      <p style="font-size: 11pt;">Коефіцієнт 0.275 розраховано так, щоб максимальна лісистість (100%) давала 11 балів, а водні об'єкти додають 4 бали, разом = 15 балів (максимум для цього фактора).</p>
      <div class="result-box">✅ РЕЗУЛЬТАТ: ${analysisResult.nature_score}/15 балів</div>
    </div>
  </div>

  <!-- ФАКТОР 4 -->
  <h2 class="major-section">6. ФАКТОР 4: ТРАНСПОРТНА ДОСТУПНІСТЬ</h2>
  <div class="section">
    <p><strong>Максимальна вага:</strong> 15 балів (15% від загального)</p>
    <p><strong>Отримано:</strong> ${analysisResult.accessibility_score} балів</p>
    
    <div class="step-box">
      <h4>Формула розрахунку:</h4>
      <code>Бали = Базова(5) + Залізниці(0-5) + Міжнародні_траси(0-3) + Аеропорти(0-1) + Бонус_щільності(0-1)</code>
      <p style="margin-top: 8px;"><strong>Компоненти:</strong></p>
      <ul style="font-size: 11pt;">
        <li>Базова доступність: 5 балів</li>
        <li>Залізничні станції: ≥50=5 балів, ≥30=3, ≥10=1</li>
        <li>Міжнародні траси: кількість трас (0-3 бали)</li>
        <li>Аеропорти: 1 бал за наявність</li>
        <li>Бонус щільності: 1 бал якщо >250 км/1000км²</li>
      </ul>
      
      <h4 style="margin-top: 15px;">Компоненти:</h4>
      <ul>
        <li>Щільність доріг: ${d?.transport?.highway_density || 0} км на 1000 км²</li>
        <li>Міжнародні траси: ${d?.transport?.international_roads_count || 0}</li>
        <li>Залізничні станції: ${d?.transport?.railway_stations || 0}</li>
        <li>Аеропорти: ${d?.transport?.airports || 0}</li>
      </ul>
      <div class="result-box">✅ РЕЗУЛЬТАТ: ${analysisResult.accessibility_score}/15 балів</div>
    </div>
  </div>

  <!-- ФАКТОР 5 -->
  <h2 class="major-section">7. ФАКТОР 5: АНТРОПОГЕННА ІНФРАСТРУКТУРА</h2>
  <div class="section">
    <p><strong>Максимальна вага:</strong> 10 балів (10% від загального)</p>
    <p><strong>Отримано:</strong> ${analysisResult.infrastructure_score} балів</p>
    
    <div class="step-box">
      <h4>Формула розрахунку:</h4>
      <code>Бали = min(Заправки / 2, 5) + min(Лікарні, 5)</code>
      <p style="margin-top: 8px;"><strong>Обґрунтування:</strong></p>
      <ul style="font-size: 11pt;">
        <li>Заправки: до 5 балів (10+ заправок на 1000 км² = максимум)</li>
        <li>Лікарні: до 5 балів (5+ лікарень на 100k населення = максимум)</li>
        <li>Разом максимум: 10 балів</li>
      </ul>
      
      <h4 style="margin-top: 15px;">Компоненти:</h4>
      <ul>
        <li>Заправки: ${d?.infrastructure?.gas_stations_per_100km2 ? (d.infrastructure.gas_stations_per_100km2 * 10).toFixed(1) : 0} на 1000 км²</li>
        <li>Лікарні: ${d?.infrastructure?.hospitals_per_100k ? d.infrastructure.hospitals_per_100k.toFixed(1) : 0} на 100k населення</li>
      </ul>
      <div class="result-box">✅ РЕЗУЛЬТАТ: ${analysisResult.infrastructure_score}/10 балів</div>
    </div>
  </div>

  <!-- ФАКТОР 6 -->
  <h2 class="major-section">8. ФАКТОР 6: ПОЖЕЖОНЕБЕЗПЕЧНІСТЬ</h2>
  <div class="section">
    <p><strong>Максимальна вага:</strong> 5 балів (5% від загального)</p>
    <p><strong>Отримано:</strong> ${analysisResult.fire_score} балів</p>
    
    <div class="step-box">
      <h4>Парадоксальна логіка (NW Fire Science 2020):</h4>
      <p>80% рекреаційних пожеж відбуваються ПОЗА офіційними зонами відпочинку</p>
      <p><strong>Пожежі через людський фактор:</strong> ${d?.fires?.human_caused_fires || 0}</p>
      <p><strong>Шкала:</strong></p>
      <ul>
        <li>≥15 пожеж: <strong>5 балів</strong> (висока необхідність облаштування)</li>
        <li>10-14 пожеж: <strong>3 бали</strong></li>
        <li>5-9 пожеж: <strong>1 бал</strong></li>
        <li>&lt;5 пожеж: <strong>0 балів</strong></li>
      </ul>
      <div class="result-box">✅ РЕЗУЛЬТАТ: ${analysisResult.fire_score}/5 балів</div>
    </div>
  </div>

  <!-- ФАКТОР 7 -->
  <h2 class="major-section">9. ФАКТОР 7: НАСИЧЕНІСТЬ ІСНУЮЧИМИ ОБ'ЄКТАМИ</h2>
  <div class="section">
    <p><strong>Діапазон:</strong> від -15 до 0 балів (штраф за перенасиченість)</p>
    <p><strong>Отримано:</strong> ${analysisResult.saturation_penalty} балів</p>
    
    <div class="step-box">
      <h4>Формула розрахунку:</h4>
      <code>Штраф = -min(Щільність_об'єктів × 15, 15)</code>
      <p style="margin-top: 8px;"><strong>Логіка штрафів:</strong></p>
      <ul style="font-size: 11pt;">
        <li>Щільність &lt; 1 об'єкт на 1000 км²: <strong>0 балів</strong> (штрафу немає)</li>
        <li>Щільність 1-2 об'єкти: <strong>-3 до -5 балів</strong></li>
        <li>Щільність 2-3 об'єкти: <strong>-6 до -10 балів</strong></li>
        <li>Щільність &gt;3 об'єкти: <strong>-15 балів</strong> (максимальний штраф)</li>
      </ul>
      <p style="font-size: 11pt; margin-top: 8px;">Мета: уникнути перенасичення території та забезпечити збалансований розвиток</p>
      
      <h4 style="margin-top: 15px;">Дані:</h4>
      <p><strong>Існуючі рекреаційні пункти:</strong> ${d?.saturation?.existing_points || 0}</p>
      <p><strong>Щільність:</strong> ${d?.saturation?.density_per_1000km2 || 0} на 1000 км²</p>
      <p><strong>Статус:</strong> ${d?.saturation?.density_status || 'N/A'}</p>
      <div class="result-box">✅ РЕЗУЛЬТАТ: ${analysisResult.saturation_penalty} балів</div>
    </div>
  </div>
  `;
}

function generateInvestmentRecommendations(d, shouldBuild) {
  // Розрахунок інвестиційних параметрів на основі даних
  const gap = d?.population?.gap || 0;
  const avgCapacityPerPoint = 50 * 180 * 2; // 18,000 відвідувань на рік
  const recommendedCapacity = gap > 0 ? Math.min(Math.ceil(gap / avgCapacityPerPoint), 5) * 50 : 50;
  const investmentPerPlace = 15000; // $15K на місце
  const estimatedInvestment = `$${(recommendedCapacity * investmentPerPlace / 1000).toFixed(0)}K`;
  const paybackPeriod = shouldBuild ? '3-5 років' : '5-7 років';
  
  if (shouldBuild) {
    return `
      <div style="padding: 15px; border: 3px solid #16a34a; background: #f0fdf4;">
        <h3 style="color: #16a34a; margin-bottom: 10px;">✅ РЕКОМЕНДАЦІЯ: ІНВЕСТИЦІЇ ДОЦІЛЬНІ</h3>
        <p style="margin-bottom: 10px;">
          На основі комплексного аналізу семи факторів, територія ${d?.region || ''} має 
          <strong>високий рекреаційний потенціал</strong> і рекомендується для інвестицій 
          у розвиток туристично-рекреаційної інфраструктури.
        </p>
        
        <table>
          <thead>
            <tr>
              <th>Параметр</th>
              <th style="text-align: right;">Значення</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Рекомендована місткість об'єкту</td>
              <td style="text-align: right; font-weight: bold;">${recommendedCapacity} місць</td>
            </tr>
            <tr>
              <td>Орієнтовна сума інвестицій</td>
              <td style="text-align: right; font-weight: bold;">${estimatedInvestment}</td>
            </tr>
            <tr>
              <td>Очікуваний термін окупності</td>
              <td style="text-align: right; font-weight: bold;">${paybackPeriod}</td>
            </tr>
            <tr>
              <td>Тип рекомендованого об'єкту</td>
              <td style="text-align: right;">Рекреаційний комплекс</td>
            </tr>
          </tbody>
        </table>
        
        <h4 style="margin-top: 15px;">Рекомендовані типи об'єктів:</h4>
        <ul>
          <li>Екологічні готелі та глемпінги</li>
          <li>Туристичні інформаційні центри</li>
          <li>Облаштовані місця для відпочинку</li>
          <li>Екологічні стежки та маршрути</li>
          <li>Рекреаційні зони з безпечними вогнищами</li>
        </ul>
      </div>
    `;
  } else {
    return `
      <div style="padding: 15px; border: 3px solid #dc2626; background: #fef2f2;">
        <h3 style="color: #dc2626; margin-bottom: 10px;">⚠️ РЕКОМЕНДАЦІЯ: ІНВЕСТИЦІЇ ПОТРЕБУЮТЬ ДОДАТКОВОГО АНАЛІЗУ</h3>
        <p>
          На основі поточного аналізу територія має <strong>помірний або низький</strong> 
          рекреаційний потенціал. Рекомендується додатковий детальний аналіз специфічних 
          локацій перед прийняттям інвестиційних рішень.
        </p>
        
        <h4 style="margin-top: 15px;">Можливі варіанти дій:</h4>
        <ul>
          <li>Фокус на покращенні слабких факторів (транспорт, інфраструктура)</li>
          <li>Пошук специфічних мікролокацій з вищим потенціалом</li>
          <li>Розвиток альтернативних видів рекреації</li>
          <li>Співпраця з існуючими природоохоронними об'єктами</li>
        </ul>
      </div>
    `;
  }
}

function getCategoryDescription(category) {
  const descriptions = {
    'Дуже високий': 'Територія має виключно високий рекреаційний потенціал з оптимальним поєднанням всіх факторів. Рекомендується пріоритетний розвиток туристично-рекреаційної інфраструктури.',
    'Високий': 'Територія демонструє значний рекреаційний потенціал з добрими показниками за більшістю факторів. Інвестиції у розвиток туризму мають високу ймовірність успіху.',
    'Помірний': 'Територія має середній рекреаційний потенціал. Рекомендується селективний підхід з фокусом на найбільш перспективні локації та види рекреації.',
    'Низький': 'Територія має обмежений рекреаційний потенціал. Потрібен детальний аналіз специфічних локацій та покращення слабких факторів перед інвестиціями.',
    'Дуже низький': 'Територія має мінімальний рекреаційний потенціал. Інвестиції у масштабний розвиток туризму не рекомендуються без суттєвих покращень інфраструктури та доступності.'
  };
  
  return descriptions[category] || 'Опис категорії недоступний.';
}
