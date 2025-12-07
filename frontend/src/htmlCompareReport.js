/**
 * HTML ПОРІВНЯЛЬНИЙ ЗВІТ ДЛЯ ДРУКУ
 * 
 * Порівняння всіх 24 областей України за рекреаційним потенціалом
 * 
 * Переваги:
 * - Браузер автоматично керує розривами сторінок
 * - Таблиці не розриваються на пів
 * - Можна зберегти як PDF через Ctrl+P
 * - Чіткий рейтинг з медалями
 */

export const openHTMLCompare = (allRegions) => {
  if (!allRegions || allRegions.length === 0) {
    console.error('❌ No regions data');
    alert('Немає даних для порівняння');
    return;
  }

  // Сортуємо регіони за балами
  const sortedRegions = [...allRegions].sort((a, b) => b.total_score - a.total_score);
  
  // Генеруємо HTML контент
  const htmlContent = generateCompareHTML(sortedRegions);
  
  // Відкриваємо у новій вкладці
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Автоматично відкриваємо діалог друку
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    console.log('✅ HTML порівняльний звіт відкрито');
  } else {
    alert('Будь ласка, дозвольте спливаючі вікна для цього сайту');
  }
};

function generateCompareHTML(sortedRegions) {
  const topRegion = sortedRegions[0];
  const bottomRegion = sortedRegions[sortedRegions.length - 1];
  
  // Статистика
  const avgScore = sortedRegions.reduce((sum, r) => sum + r.total_score, 0) / sortedRegions.length;
  const medianScore = sortedRegions[Math.floor(sortedRegions.length / 2)].total_score;
  
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Порівняльний аналіз областей України</title>
  <style>
    /* Загальні стилі */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
      background: white;
      padding: 20px;
    }
    
    h1 {
      font-size: 22pt;
      font-weight: bold;
      text-align: center;
      margin: 30px 0 15px 0;
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
    
    p {
      margin: 8px 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      page-break-inside: avoid;
    }
    
    th {
      background: #e0e0e0;
      color: #000;
      padding: 10px 8px;
      text-align: left;
      border: 1px solid #000;
      font-weight: bold;
      font-size: 10pt;
    }
    
    td {
      padding: 8px;
      border: 1px solid #000;
      font-size: 10pt;
    }
    
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    .medal {
      font-size: 16pt;
      margin-right: 5px;
    }
    
    .section {
      page-break-inside: avoid;
      margin-bottom: 20px;
    }
    
    .stats-box {
      padding: 15px;
      border: 2px solid #000;
      margin: 15px 0;
      background: #f5f5f5;
      page-break-inside: avoid;
    }
    
    .highlight {
      font-weight: bold;
      background: #ffeb3b;
      padding: 2px 5px;
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
        font-size: 10pt;
      }
      
      h2 {
        page-break-before: always;
      }
      
      h2:first-of-type {
        page-break-before: avoid;
      }
      
      table {
        page-break-inside: avoid;
      }
      
      .section {
        page-break-inside: avoid;
      }
      
      .no-print {
        display: none;
      }
      
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

  <!-- Інструкція (не друкується) -->
  <div class="no-print" style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
    <h3 style="margin: 0 0 10px 0; color: #92400e;">📄 Інструкція для збереження звіту</h3>
    <ol style="margin: 0; padding-left: 25px;">
      <li><strong>Windows/Linux:</strong> Натисніть <kbd>Ctrl + P</kbd></li>
      <li><strong>Mac:</strong> Натисніть <kbd>Cmd + P</kbd></li>
      <li>У діалозі друку виберіть <strong>"Зберегти як PDF"</strong></li>
      <li>Перевірте попередній перегляд і натисніть <strong>"Зберегти"</strong></li>
    </ol>
  </div>

  <!-- ТИТУЛЬНА СТОРІНКА -->
  <div class="section text-center">
    <h1>ПОРІВНЯЛЬНИЙ АНАЛІЗ</h1>
    <p style="font-size: 15pt; font-weight: bold; margin: 20px 0;">
      Рекреаційний потенціал регіонів України
    </p>
    <p style="font-size: 12pt; margin: 30px 0;">
      Комплексний аналіз 24 областей за 7 факторами
    </p>
    
    <div style="margin: 40px auto; max-width: 500px;">
      <div style="border: 3px solid #16a34a; padding: 20px; margin-bottom: 15px; background: #f0fdf4;">
        <p style="font-size: 11pt; margin-bottom: 8px;">🥇 ЛІДЕР ЗА ПОТЕНЦІАЛОМ</p>
        <p style="font-size: 18pt; font-weight: bold; color: #16a34a;">
          ${topRegion.region}
        </p>
        <p style="font-size: 16pt; font-weight: bold; margin-top: 5px;">
          ${topRegion.total_score.toFixed(1)} балів
        </p>
      </div>
      
      <div style="border: 3px solid #dc2626; padding: 20px; background: #fef2f2;">
        <p style="font-size: 11pt; margin-bottom: 8px;">📉 НАЙНИЖЧИЙ ПОКАЗНИК</p>
        <p style="font-size: 14pt; font-weight: bold; color: #dc2626;">
          ${bottomRegion.region}
        </p>
        <p style="font-size: 14pt; font-weight: bold; margin-top: 5px;">
          ${bottomRegion.total_score.toFixed(1)} балів
        </p>
      </div>
    </div>
    
    <p style="margin-top: 50px; font-size: 10pt;">
      Дата формування: ${new Date().toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}
    </p>
  </div>

  <!-- ЗАГАЛЬНА СТАТИСТИКА -->
  <h2 class="major-section">ЗАГАЛЬНА СТАТИСТИКА</h2>
  <div class="section">
    <div class="stats-box">
      <table style="border: none; margin: 0;">
        <tr style="background: transparent;">
          <td style="border: none; font-weight: bold; width: 50%;">Кількість регіонів:</td>
          <td style="border: none; text-align: right;">${sortedRegions.length}</td>
        </tr>
        <tr style="background: transparent;">
          <td style="border: none; font-weight: bold;">Середній бал:</td>
          <td style="border: none; text-align: right;">${avgScore.toFixed(1)} балів</td>
        </tr>
        <tr style="background: transparent;">
          <td style="border: none; font-weight: bold;">Медіана:</td>
          <td style="border: none; text-align: right;">${medianScore.toFixed(1)} балів</td>
        </tr>
        <tr style="background: transparent;">
          <td style="border: none; font-weight: bold;">Максимум:</td>
          <td style="border: none; text-align: right;">${topRegion.total_score.toFixed(1)} балів (${topRegion.region})</td>
        </tr>
        <tr style="background: transparent;">
          <td style="border: none; font-weight: bold;">Мінімум:</td>
          <td style="border: none; text-align: right;">${bottomRegion.total_score.toFixed(1)} балів (${bottomRegion.region})</td>
        </tr>
        <tr style="background: transparent;">
          <td style="border: none; font-weight: bold;">Діапазон:</td>
          <td style="border: none; text-align: right;">${(topRegion.total_score - bottomRegion.total_score).toFixed(1)} балів</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- РЕЙТИНГОВА ТАБЛИЦЯ -->
  <h2 class="major-section">ЗАГАЛЬНИЙ РЕЙТИНГ</h2>
  <div class="section">
    <table>
      <thead>
        <tr>
          <th style="width: 8%; text-align: center;">Місце</th>
          <th style="width: 32%;">Регіон</th>
          <th style="width: 12%; text-align: center;">Бали</th>
          <th style="width: 20%; text-align: center;">Категорія</th>
          <th style="width: 14%; text-align: center;">Попит</th>
          <th style="width: 14%; text-align: center;">ПЗФ</th>
        </tr>
      </thead>
      <tbody>
        ${sortedRegions.map((region, index) => `
          <tr ${index < 3 ? 'style="background: #fef3c7; font-weight: bold;"' : ''}>
            <td style="text-align: center;">
              ${getMedalHTML(index + 1)}
            </td>
            <td>${region.region}</td>
            <td style="text-align: center; font-weight: bold; font-size: 11pt;">
              ${region.total_score.toFixed(1)}
            </td>
            <td style="text-align: center; font-size: 9pt;">
              ${region.category}
            </td>
            <td style="text-align: center;">
              ${region.demand_score}/25
            </td>
            <td style="text-align: center;">
              ${region.pfz_score}/20
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- ДЕТАЛЬНА ТАБЛИЦЯ ПО ВСІХ ФАКТОРАХ -->
  <h2 class="major-section">ДЕТАЛЬНА РОЗБИВКА ЗА ФАКТОРАМИ</h2>
  <div class="section">
    <table>
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 25%;">Регіон</th>
          <th style="text-align: center;">Попит<br/>(0-25)</th>
          <th style="text-align: center;">ПЗФ<br/>(0-20)</th>
          <th style="text-align: center;">Природа<br/>(0-15)</th>
          <th style="text-align: center;">Транспорт<br/>(0-15)</th>
          <th style="text-align: center;">Інфра<br/>(0-10)</th>
          <th style="text-align: center;">Пожежі<br/>(0-5)</th>
          <th style="text-align: center;">Насич.<br/>(до -15)</th>
          <th style="text-align: center; font-weight: bold;">Разом</th>
        </tr>
      </thead>
      <tbody>
        ${sortedRegions.map((region, index) => `
          <tr ${index < 3 ? 'style="background: #fef3c7;"' : ''}>
            <td style="text-align: center; font-weight: bold;">${index + 1}</td>
            <td style="font-size: 9pt;">${region.region}</td>
            <td style="text-align: center;">${region.demand_score}</td>
            <td style="text-align: center;">${region.pfz_score}</td>
            <td style="text-align: center;">${region.nature_score}</td>
            <td style="text-align: center;">${region.accessibility_score}</td>
            <td style="text-align: center;">${region.infrastructure_score}</td>
            <td style="text-align: center;">${region.fire_score}</td>
            <td style="text-align: center;">${region.saturation_penalty}</td>
            <td style="text-align: center; font-weight: bold; font-size: 11pt;">
              ${region.total_score.toFixed(1)}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  ${generateTopRegionsByFactor(sortedRegions)}

  <!-- ВИСНОВКИ -->
  <h2 class="major-section">ВИСНОВКИ ТА РЕКОМЕНДАЦІЇ</h2>
  <div class="section">
    <h3>Регіони з найвищим потенціалом (ТОП-5):</h3>
    <ol style="line-height: 1.8;">
      ${sortedRegions.slice(0, 5).map((r, i) => `
        <li>
          <strong>${r.region}</strong> - ${r.total_score.toFixed(1)} балів (${r.category})
          ${i === 0 ? '<span class="highlight">Пріоритет для інвестицій</span>' : ''}
        </li>
      `).join('')}
    </ol>
    
    <h3 style="margin-top: 25px;">Ключові фактори успіху:</h3>
    <ul style="line-height: 1.8;">
      <li><strong>Попит:</strong> Високий дефіцит рекреаційних послуг створює сприятливий інвестиційний клімат</li>
      <li><strong>ПЗФ:</strong> Близькість до національних парків та заповідників підвищує туристичну привабливість</li>
      <li><strong>Природа:</strong> Висока лісистість та наявність водних об'єктів є ключовими атракторами</li>
      <li><strong>Інфраструктура:</strong> Розвинена транспортна мережа забезпечує доступність</li>
    </ul>
    
    <h3 style="margin-top: 25px;">Загальні рекомендації:</h3>
    <p style="text-align: justify;">
      Регіони з балом <strong>понад 70</strong> мають виключно високий потенціал і рекомендуються 
      для пріоритетного інвестування у туристично-рекреаційну інфраструктуру. 
      Регіони з балом <strong>60-70</strong> потребують селективного підходу з фокусом на 
      найбільш перспективні локації. Регіони з балом <strong>нижче 60</strong> потребують 
      детального мікроаналізу та покращення слабких факторів перед масштабними інвестиціями.
    </p>
  </div>

</body>
</html>`;
}

function getMedalHTML(place) {
  if (place === 1) return '<span class="medal">🥇</span>' + place;
  if (place === 2) return '<span class="medal">🥈</span>' + place;
  if (place === 3) return '<span class="medal">🥉</span>' + place;
  return place;
}

function generateTopRegionsByFactor(sortedRegions) {
  // Топ по кожному фактору
  const topDemand = [...sortedRegions].sort((a, b) => b.demand_score - a.demand_score).slice(0, 5);
  const topPFZ = [...sortedRegions].sort((a, b) => b.pfz_score - a.pfz_score).slice(0, 5);
  const topNature = [...sortedRegions].sort((a, b) => b.nature_score - a.nature_score).slice(0, 5);
  const topTransport = [...sortedRegions].sort((a, b) => b.transport_score - a.transport_score).slice(0, 5);
  
  return `
  <!-- ТОП ПО ФАКТОРАХ -->
  <h2 class="major-section">ЛІДЕРИ ЗА ОКРЕМИМИ ФАКТОРАМИ</h2>
  
  <div class="section">
    <h3>ТОП-5 за Попитом (0-25 балів)</h3>
    <table style="width: 70%;">
      <thead>
        <tr>
          <th style="width: 15%; text-align: center;">Місце</th>
          <th style="width: 55%;">Регіон</th>
          <th style="width: 30%; text-align: center;">Бали</th>
        </tr>
      </thead>
      <tbody>
        ${topDemand.map((r, i) => `
          <tr ${i === 0 ? 'style="background: #fef3c7; font-weight: bold;"' : ''}>
            <td style="text-align: center;">${i + 1}</td>
            <td>${r.region}</td>
            <td style="text-align: center; font-weight: bold;">${r.demand_score}/25</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="section">
    <h3>ТОП-5 за ПЗФ (0-20 балів)</h3>
    <table style="width: 70%;">
      <thead>
        <tr>
          <th style="width: 15%; text-align: center;">Місце</th>
          <th style="width: 55%;">Регіон</th>
          <th style="width: 30%; text-align: center;">Бали</th>
        </tr>
      </thead>
      <tbody>
        ${topPFZ.map((r, i) => `
          <tr ${i === 0 ? 'style="background: #fef3c7; font-weight: bold;"' : ''}>
            <td style="text-align: center;">${i + 1}</td>
            <td>${r.region}</td>
            <td style="text-align: center; font-weight: bold;">${r.pfz_score}/20</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="section">
    <h3>ТОП-5 за Природними ресурсами (0-15 балів)</h3>
    <table style="width: 70%;">
      <thead>
        <tr>
          <th style="width: 15%; text-align: center;">Місце</th>
          <th style="width: 55%;">Регіон</th>
          <th style="width: 30%; text-align: center;">Бали</th>
        </tr>
      </thead>
      <tbody>
        ${topNature.map((r, i) => `
          <tr ${i === 0 ? 'style="background: #fef3c7; font-weight: bold;"' : ''}>
            <td style="text-align: center;">${i + 1}</td>
            <td>${r.region}</td>
            <td style="text-align: center; font-weight: bold;">${r.nature_score}/15</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="section">
    <h3>ТОП-5 за Транспортною доступністю (0-15 балів)</h3>
    <table style="width: 70%;">
      <thead>
        <tr>
          <th style="width: 15%; text-align: center;">Місце</th>
          <th style="width: 55%;">Регіон</th>
          <th style="width: 30%; text-align: center;">Бали</th>
        </tr>
      </thead>
      <tbody>
        ${topTransport.map((r, i) => `
          <tr ${i === 0 ? 'style="background: #fef3c7; font-weight: bold;"' : ''}>
            <td style="text-align: center;">${i + 1}</td>
            <td>${r.region}</td>
            <td style="text-align: center; font-weight: bold;">${r.transport_score}/15</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  `;
}
