/**
 * АКАДЕМІЧНИЙ PDF-ЕКСПОРТ (СТРОГИЙ НАУКОВИЙ СТИЛЬ)
 * 
 * Вимоги:
 * - Чорно-білий формат без кольорів
 * - Без смайлів та декоративних елементів
 * - Академічний шрифт Times New Roman
 * - Сухі таблиці та списки
 * - Виділення тільки жирним шрифтом
 * - Правильні page-breaks
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportAcademicPDF = async (analysisResult, getScoreColor, getCategoryColor) => {
  if (!analysisResult) {
    console.error('❌ No analysisResult');
    return;
  }

  let pdfContent = null;
  try {
    console.log('🔍 Starting academic PDF export...');
    
    pdfContent = document.createElement('div');
    pdfContent.style.cssText = 'position: absolute; left: -9999px; width: 800px; padding: 60px; background: white; font-family: "Times New Roman", Times, serif;';
    
    const d = analysisResult.details;
    
    pdfContent.innerHTML = generateAcademicPDFContent(analysisResult, d);
    
    document.body.appendChild(pdfContent);
    console.log('✅ Academic content added to DOM');
    
    await generateMultiPagePDF(pdfContent, analysisResult.region);
    
  } catch (error) {
    console.error('❌ PDF export error:', error);
    alert('Помилка експорту PDF: ' + error.message);
  } finally {
    if (pdfContent && pdfContent.parentNode) {
      document.body.removeChild(pdfContent);
      console.log('✅ Cleanup completed');
    }
  }
};

function generateAcademicPDFContent(analysisResult, d) {
  return `
    <style>
      body { 
        font-size: 12px; 
        line-height: 1.6; 
        color: #000000; 
        font-family: "Times New Roman", Times, serif;
        background: white;
      }
      h1 { 
        font-size: 16px; 
        font-weight: bold; 
        margin: 20px 0 15px 0; 
        text-align: center; 
        text-transform: uppercase;
        color: #000000;
      }
      h2 { 
        font-size: 14px; 
        font-weight: bold; 
        margin: 25px 0 12px 0; 
        border-bottom: 2px solid #000000; 
        padding-bottom: 6px;
        color: #000000;
      }
      h3 { 
        font-size: 13px; 
        font-weight: bold; 
        margin: 15px 0 10px 0;
        color: #000000;
      }
      h4 { 
        font-size: 12px; 
        font-weight: bold; 
        margin: 12px 0 8px 0;
        text-decoration: underline;
        color: #000000;
      }
      p { 
        margin: 8px 0; 
        text-align: justify;
        color: #000000;
      }
      .page-break { 
        page-break-after: always; 
        height: 1px; 
      }
      .avoid-break {
        page-break-inside: avoid;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 15px 0; 
        font-size: 11px;
        page-break-inside: avoid;
        background: white;
      }
      th { 
        background: #ffffff; 
        color: #000000; 
        padding: 10px; 
        text-align: left; 
        border: 1.5px solid #000000; 
        font-weight: bold;
      }
      td { 
        padding: 8px; 
        border: 1px solid #000000;
        color: #000000;
        background: white;
      }
      tr:nth-child(even) td { 
        background: #f9f9f9;
      }
      ul, ol { 
        margin: 10px 0; 
        padding-left: 30px;
      }
      li { 
        margin: 5px 0;
        color: #000000;
      }
      strong { 
        font-weight: bold;
        color: #000000;
      }
      .formula-box { 
        padding: 12px; 
        border: 1.5px solid #000000; 
        margin: 15px 0;
        background: white;
        page-break-inside: avoid;
      }
      .text-center { 
        text-align: center; 
      }
      code {
        font-family: "Courier New", monospace;
        font-size: 11px;
        background: #f5f5f5;
        border: 1px solid #cccccc;
        padding: 8px;
        display: block;
        margin: 8px 0;
        color: #000000;
      }
      .section-divider {
        border-top: 1px solid #000000;
        margin: 20px 0;
      }
    </style>

    ${generateTitlePage(analysisResult)}
    
    <div class="page-break"></div>

    ${generateMethodology()}
    
    <div class="page-break"></div>

    ${generateInputData(analysisResult, d)}
    
    <div class="page-break"></div>

    ${generateCalculations(analysisResult, d)}
    
    <div class="page-break"></div>

    ${generateSummaryTable(analysisResult)}
    
    <div class="page-break"></div>

    ${generateConclusions(analysisResult, d)}
    
    <div class="page-break"></div>

    ${generateBibliography()}
  `;
}

function generateTitlePage(analysisResult) {
  return `
    <div class="text-center avoid-break" style="margin-top: 100px;">
      <h1>НАУКОВИЙ ЗВІТ</h1>
      <p style="font-size: 14px; font-weight: bold; margin: 30px 0;">
        Аналіз рекреаційного потенціалу території<br/>
        за методом багатокритеріального прийняття рішень
      </p>
      
      <p style="font-size: 13px; font-weight: bold; margin: 40px 0;">
        Об'єкт дослідження: ${analysisResult.region}
      </p>
      
      <table style="width: 70%; margin: 50px auto; border: 2px solid #000000;">
        <tr>
          <td colspan="2" style="text-align: center; padding: 12px; font-weight: bold; border-bottom: 1.5px solid #000000;">
            РЕЗУЛЬТАТИ ІНТЕГРАЛЬНОЇ ОЦІНКИ
          </td>
        </tr>
        <tr>
          <td style="width: 60%; padding: 10px; font-weight: bold;">Інтегральний показник потенціалу:</td>
          <td style="width: 40%; text-align: center; padding: 10px; font-size: 18px; font-weight: bold;">
            ${analysisResult.total_score} / 100
          </td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">Категорія потенціалу:</td>
          <td style="text-align: center; padding: 10px; font-weight: bold;">
            ${analysisResult.category}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">Інвестиційна рекомендація:</td>
          <td style="text-align: center; padding: 10px;">
            ${analysisResult.total_score >= 70 ? 'Рекомендується' : analysisResult.total_score >= 50 ? 'З обережністю' : 'Не рекомендується'}
          </td>
        </tr>
      </table>
      
      <p style="font-size: 11px; margin-top: 80px;">
        Дата формування: ${new Date().toLocaleDateString('uk-UA')}<br/>
        Методологія: Analytic Hierarchy Process (AHP), версія 1.0<br/>
        7-факторна модель оцінки рекреаційного потенціалу
      </p>
    </div>
  `;
}

function generateMethodology() {
  return `
    <h2>1. МЕТОДОЛОГІЯ ДОСЛІДЖЕННЯ</h2>
    
    <h3>1.1. Загальна характеристика методу</h3>
    <p>
      Для оцінки рекреаційного потенціалу території застосовано метод <strong>Analytic Hierarchy Process (AHP)</strong>, 
      розроблений Томасом Л. Сааті (1980). AHP є систематичним підходом до багатокритеріального прийняття рішень, 
      що дозволяє інтегрувати кількісні та якісні фактори через парне порівняння та визначення вагових коефіцієнтів.
    </p>
    
    <h3>1.2. Математична модель</h3>
    <div class="formula-box">
      <p style="margin: 0 0 10px 0; font-weight: bold;">Інтегральна формула оцінки:</p>
      <code>I = F₁ + F₂ + F₃ + F₄ + F₅ + F₆ - F₇</code>
      <p style="margin: 10px 0 5px 0; font-size: 11px;">де:</p>
      <ul style="font-size: 11px; margin: 5px 0; padding-left: 25px;">
        <li>I – інтегральний показник рекреаційного потенціалу (0-100 балів);</li>
        <li>F₁ – попит населення на рекреаційні послуги (0-25 балів, 25%);</li>
        <li>F₂ – природно-заповідний фонд як туристичний атрактор (0-20 балів, 20%);</li>
        <li>F₃ – природні ресурси території (0-15 балів, 15%);</li>
        <li>F₄ – транспортна доступність (0-15 балів, 15%);</li>
        <li>F₅ – антропогенна інфраструктура (0-10 балів, 10%);</li>
        <li>F₆ – профілактика лісових пожеж (0-5 балів, +5%);</li>
        <li>F₇ – штраф за ринкову насиченість (0-15 балів, -15%).</li>
      </ul>
    </div>
    
    <h3>1.3. Вагові коефіцієнти факторів</h3>
    <p>
      Вагові коефіцієнти визначені на основі наукових досліджень міжнародної практики територіального планування 
      рекреаційних об'єктів та адаптовані до українського контексту.
    </p>
    
    <table class="avoid-break">
      <tr>
        <th style="width: 8%;">№</th>
        <th style="width: 35%;">Фактор</th>
        <th style="width: 12%;">Вага, %</th>
        <th style="width: 15%;">Діапазон</th>
        <th style="width: 30%;">Обґрунтування</th>
      </tr>
      <tr>
        <td style="text-align: center;"><strong>1</strong></td>
        <td>Попит населення</td>
        <td style="text-align: center;"><strong>25</strong></td>
        <td style="text-align: center;">0-25</td>
        <td>Економічна основа проекту</td>
      </tr>
      <tr>
        <td style="text-align: center;"><strong>2</strong></td>
        <td>Природно-заповідний фонд</td>
        <td style="text-align: center;"><strong>20</strong></td>
        <td style="text-align: center;">0-20</td>
        <td>Туристичний атрактор</td>
      </tr>
      <tr>
        <td style="text-align: center;"><strong>3</strong></td>
        <td>Природні ресурси</td>
        <td style="text-align: center;"><strong>15</strong></td>
        <td style="text-align: center;">0-15</td>
        <td>Естетична цінність</td>
      </tr>
      <tr>
        <td style="text-align: center;"><strong>4</strong></td>
        <td>Транспортна доступність</td>
        <td style="text-align: center;"><strong>15</strong></td>
        <td style="text-align: center;">0-15</td>
        <td>Критичний бар'єр доступу</td>
      </tr>
      <tr>
        <td style="text-align: center;"><strong>5</strong></td>
        <td>Інфраструктура</td>
        <td style="text-align: center;"><strong>10</strong></td>
        <td style="text-align: center;">0-10</td>
        <td>Вторинний фактор</td>
      </tr>
      <tr>
        <td style="text-align: center;"><strong>6</strong></td>
        <td>Профілактика пожеж</td>
        <td style="text-align: center;"><strong>+5</strong></td>
        <td style="text-align: center;">0-5</td>
        <td>Превентивний бонус</td>
      </tr>
      <tr>
        <td style="text-align: center;"><strong>7</strong></td>
        <td>Ринкова насиченість</td>
        <td style="text-align: center;"><strong>-15</strong></td>
        <td style="text-align: center;">0 до -15</td>
        <td>Конкурентний штраф</td>
      </tr>
    </table>
  `;
}

function generateInputData(analysisResult, d) {
  return `
    <h2>2. ВИХІДНІ ДАНІ ДЛЯ РОЗРАХУНКУ</h2>
    
    <h3>2.1. Демографічні показники</h3>
    <table class="avoid-break">
      <tr>
        <th style="width: 50%;">Показник</th>
        <th style="width: 50%;">Значення</th>
      </tr>
      <tr>
        <td>Населення області</td>
        <td style="text-align: right;"><strong>${d?.population?.total?.toLocaleString() || 'н/д'}</strong> осіб</td>
      </tr>
      <tr>
        <td>Густота населення</td>
        <td style="text-align: right;">${d?.population?.density_per_km2 || 'н/д'} осіб/км²</td>
      </tr>
      <tr>
        <td>Площа території</td>
        <td style="text-align: right;">${d?.population?.area_km2?.toLocaleString() || 'н/д'} км²</td>
      </tr>
      <tr>
        <td>Коефіцієнт рекреаційної активності</td>
        <td style="text-align: right;">0,15 (15% населення)</td>
      </tr>
      <tr>
        <td>Середня кількість відвідувань на рік</td>
        <td style="text-align: right;">3 відвідування/особу</td>
      </tr>
    </table>
    
    <h3>2.2. Природно-заповідний фонд</h3>
    <table class="avoid-break">
      <tr>
        <th style="width: 50%;">Категорія ПЗФ</th>
        <th style="width: 50%;">Кількість</th>
      </tr>
      <tr>
        <td>Національні природні парки (НПП)</td>
        <td style="text-align: right;"><strong>${d?.pfz?.national_parks || 0}</strong> од.</td>
      </tr>
      <tr>
        <td>Природні заповідники</td>
        <td style="text-align: right;"><strong>${d?.pfz?.nature_reserves || 0}</strong> од.</td>
      </tr>
      <tr>
        <td>Регіональні ландшафтні парки (РЛП)</td>
        <td style="text-align: right;"><strong>${d?.pfz?.regional_landscape_parks || 0}</strong> од.</td>
      </tr>
      <tr>
        <td>Заказники</td>
        <td style="text-align: right;"><strong>${d?.pfz?.zakazniks || 0}</strong> од.</td>
      </tr>
      <tr>
        <td>Пам'ятки природи</td>
        <td style="text-align: right;"><strong>${d?.pfz?.monuments_of_nature || 0}</strong> од.</td>
      </tr>
      <tr>
        <td>Частка території під ПЗФ</td>
        <td style="text-align: right;"><strong>${d?.pfz?.percent_of_region || 0}%</strong></td>
      </tr>
    </table>
    
    <h3>2.3. Природні ресурси</h3>
    <table class="avoid-break">
      <tr>
        <th style="width: 50%;">Показник</th>
        <th style="width: 50%;">Значення</th>
      </tr>
      <tr>
        <td>Лісистість території</td>
        <td style="text-align: right;"><strong>${d?.nature?.forest_coverage_percent || 0}%</strong></td>
      </tr>
      <tr>
        <td>Наявність водних об'єктів</td>
        <td style="text-align: right;">${d?.nature?.has_water_bodies ? 'Так' : 'Ні'}</td>
      </tr>
    </table>
    
    <h3>2.4. Транспортна доступність</h3>
    <table class="avoid-break">
      <tr>
        <th style="width: 50%;">Показник</th>
        <th style="width: 50%;">Значення</th>
      </tr>
      <tr>
        <td>Щільність автомобільних доріг</td>
        <td style="text-align: right;">${d?.transport?.highway_density || 0} км/100 км²</td>
      </tr>
      <tr>
        <td>Залізничні станції</td>
        <td style="text-align: right;">${d?.transport?.railway_stations || 0} од.</td>
      </tr>
      <tr>
        <td>Аеропорти</td>
        <td style="text-align: right;">${d?.transport?.airports || 0} од.</td>
      </tr>
    </table>
    
    <h3>2.5. Інфраструктура</h3>
    <table class="avoid-break">
      <tr>
        <th style="width: 50%;">Показник</th>
        <th style="width: 50%;">Значення</th>
      </tr>
      <tr>
        <td>Лікарні на 100 тис. населення</td>
        <td style="text-align: right;">${d?.infrastructure?.hospitals_per_100k?.toFixed(1) || 0}</td>
      </tr>
      <tr>
        <td>Автозаправні станції на 100 км²</td>
        <td style="text-align: right;">${d?.infrastructure?.gas_stations_per_100km2?.toFixed(2) || 0}</td>
      </tr>
      <tr>
        <td>Готелі (всього)</td>
        <td style="text-align: right;">${d?.infrastructure?.hotels_total || 0} од.</td>
      </tr>
      <tr>
        <td>Покриття мобільним зв'язком</td>
        <td style="text-align: right;">${d?.infrastructure?.mobile_coverage_percent || 0}%</td>
      </tr>
    </table>
    
    <h3>2.6. Дані про лісові пожежі</h3>
    <table class="avoid-break">
      <tr>
        <th style="width: 50%;">Показник</th>
        <th style="width: 50%;">Значення</th>
      </tr>
      <tr>
        <td>Загальна кількість пожеж (2025 р.)</td>
        <td style="text-align: right;">${d?.fires?.total_fires || 0} випадків</td>
      </tr>
      <tr>
        <td>Спричинені людським фактором</td>
        <td style="text-align: right;"><strong>${d?.fires?.human_caused_fires || 0}</strong> випадків</td>
      </tr>
    </table>
    
    <h3>2.7. Ринкова насиченість</h3>
    <table class="avoid-break">
      <tr>
        <th style="width: 50%;">Показник</th>
        <th style="width: 50%;">Значення</th>
      </tr>
      <tr>
        <td>Існуючі рекреаційні пункти</td>
        <td style="text-align: right;"><strong>${d?.saturation?.existing_points || 0}</strong> од.</td>
      </tr>
      <tr>
        <td>Щільність на 1000 км²</td>
        <td style="text-align: right;">${d?.saturation?.density_per_1000km2?.toFixed(2) || 0}</td>
      </tr>
    </table>
  `;
}

function generateCalculations(analysisResult, d) {
  return `
    <h2>3. ПОКРОКОВІ РОЗРАХУНКИ ФАКТОРІВ</h2>
    
    <h3>3.1. Фактор 1: Попит населення (0-25 балів)</h3>
    
    <h4>Крок 1. Розрахунок річного попиту</h4>
    <div class="formula-box">
      <p style="margin: 0 0 8px 0;"><strong>Формула:</strong></p>
      <code>Річний попит = Населення × 0,15 × 3</code>
      <p style="margin: 8px 0 0 0; font-size: 11px;">
        <strong>Підставлення значень:</strong><br/>
        ${d?.population?.total?.toLocaleString() || 'н/д'} осіб × 0,15 × 3 = ${d?.population?.annual_demand?.toLocaleString() || 'н/д'} відвідувань/рік
      </p>
    </div>
    <p style="font-size: 11px;">
      <strong>Обґрунтування коефіцієнтів:</strong> Коефіцієнт 0,15 відображає частку активних рекреантів у населенні 
      (Kentucky SCORP 2020-2025). Кількість відвідувань 3 рази на рік є середнім показником для регіонів із помірним 
      рекреаційним потенціалом (District of Columbia SCORP 2020).
    </p>
    
    <h4>Крок 2. Оцінка існуючої пропозиції</h4>
    <div class="formula-box">
      <p style="margin: 0 0 8px 0;"><strong>Формула:</strong></p>
      <code>Річна пропозиція = Пункти × 50 × 180 × 2</code>
      <p style="margin: 8px 0 0 0; font-size: 11px;">
        <strong>Підставлення значень:</strong><br/>
        ${d?.saturation?.existing_points || 0} пункти × 50 місць × 180 днів × 2 зміни = ${d?.population?.annual_supply?.toLocaleString() || 'н/д'} місць/рік
      </p>
    </div>
    <p style="font-size: 11px;">
      <strong>Обґрунтування параметрів:</strong> Середня місткість 50 місць відповідає типовому рекреаційному пункту. 
      Сезон 180 днів враховує кліматичні умови України. Дві зміни на день забезпечують ефективне використання місткості.
    </p>
    
    <h4>Крок 3. Визначення дефіциту/профіциту</h4>
    <div class="formula-box">
      <p style="margin: 0 0 8px 0;"><strong>Розрахунок:</strong></p>
      <p style="margin: 0; font-size: 11px;">
        Співвідношення = Пропозиція / Попит = ${d?.population?.supply_demand_ratio?.toFixed(3) || 'н/д'}<br/>
        Дефіцит/Профіцит = ${Math.abs(d?.population?.gap || 0).toLocaleString()} відвідувань
      </p>
    </div>
    
    <h4>Крок 4. Нормалізація до шкали 0-25 балів</h4>
    <p style="font-size: 11px;">
      <strong>Шкала оцінювання за співвідношенням пропозиції/попиту:</strong>
    </p>
    <ul style="font-size: 11px;">
      <li>Співвідношення &lt; 0,6 (дефіцит &gt;40%): 25 балів</li>
      <li>Співвідношення 0,6-0,8 (дефіцит 20-40%): 20 балів</li>
      <li>Співвідношення 0,8-1,0 (баланс): 15 балів</li>
      <li>Співвідношення 1,0-1,5 (надлишок 0-50%): 10 балів</li>
      <li>Співвідношення &gt; 1,5 (надлишок &gt;50%): 0 балів</li>
    </ul>
    <p style="margin: 10px 0; padding: 10px; border: 1.5px solid #000; background: white;">
      <strong>Результат: ${analysisResult.demand_score} балів з 25</strong>
    </p>
    
    <div class="section-divider"></div>
    
    <h3>3.2. Фактор 2: Природно-заповідний фонд (0-20 балів)</h3>
    
    <h4>Розрахунок з ваговими коефіцієнтами</h4>
    <div class="formula-box">
      <p style="margin: 0 0 8px 0;"><strong>Формула:</strong></p>
      <code>Бал = НПП×2,0 + Заповідники×1,5 + РЛП×1,0 + Заказники×0,1 + Пам'ятки×0,05</code>
      <p style="margin: 8px 0 0 0; font-size: 11px;">
        <strong>Підставлення значень:</strong><br/>
        ${d?.pfz?.national_parks || 0}×2,0 + ${d?.pfz?.nature_reserves || 0}×1,5 + ${d?.pfz?.regional_landscape_parks || 0}×1,0 + ${d?.pfz?.zakazniks || 0}×0,1 + ${d?.pfz?.monuments_of_nature || 0}×0,05
      </p>
    </div>
    <p style="font-size: 11px;">
      <strong>Обґрунтування коефіцієнтів:</strong> Вагові коефіцієнти відображають туристичну привабливість та 
      міжнародну впізнаваність категорій ПЗФ відповідно до дослідження Wiley "AHP for Ecotourism Site Selection" (2022).
    </p>
    <p style="margin: 10px 0; padding: 10px; border: 1.5px solid #000; background: white;">
      <strong>Результат: ${analysisResult.pfz_score} балів з 20</strong>
    </p>
    
    <div class="section-divider"></div>
    
    <h3>3.3. Фактор 3: Природні ресурси (0-15 балів)</h3>
    
    <h4>Компонент А: Лісове покриття (0-11 балів)</h4>
    <div class="formula-box">
      <p style="margin: 0 0 8px 0;"><strong>Формула:</strong></p>
      <code>Бал за ліси = Лісистість(%) × 0,275</code>
      <p style="margin: 8px 0 0 0; font-size: 11px;">
        <strong>Підставлення:</strong><br/>
        ${d?.nature?.forest_coverage_percent || 0}% × 0,275 = ${((d?.nature?.forest_coverage_percent || 0) * 0.275).toFixed(2)} балів
      </p>
    </div>
    
    <h4>Компонент Б: Водні об'єкти (0-4 бали)</h4>
    <p style="font-size: 11px;">
      Наявність водних об'єктів: ${d?.nature?.has_water_bodies ? '4 бали' : '0 балів'}
    </p>
    
    <p style="margin: 10px 0; padding: 10px; border: 1.5px solid #000; background: white;">
      <strong>Результат: ${analysisResult.nature_score} балів з 15</strong>
    </p>
    
    <div class="section-divider"></div>
    
    <h3>3.4. Фактор 4: Транспортна доступність (0-15 балів)</h3>
    <p style="font-size: 11px;">
      Оцінка на основі щільності доріг, наявності залізничного та авіаційного сполучення.
    </p>
    <p style="margin: 10px 0; padding: 10px; border: 1.5px solid #000; background: white;">
      <strong>Результат: ${analysisResult.accessibility_score} балів з 15</strong>
    </p>
    
    <div class="section-divider"></div>
    
    <h3>3.5. Фактор 5: Інфраструктура (0-10 балів)</h3>
    <p style="font-size: 11px;">
      Комплексна оцінка медичної інфраструктури, заправних станцій, готелів, покриття зв'язком.
    </p>
    <p style="margin: 10px 0; padding: 10px; border: 1.5px solid #000; background: white;">
      <strong>Результат: ${analysisResult.infrastructure_score} балів з 10</strong>
    </p>
    
    <div class="section-divider"></div>
    
    <h3>3.6. Фактор 6: Профілактика лісових пожеж (0-5 балів)</h3>
    
    <p style="font-size: 11px;">
      <strong>Парадоксальна логіка:</strong> Більша кількість людських пожеж вказує на вищу потребу в облаштованих 
      рекреаційних пунктах із безпечними вогнищами.
    </p>
    
    <h4>Шкала оцінювання:</h4>
    <ul style="font-size: 11px;">
      <li>≥15 людських пожеж: 5 балів (критична потреба)</li>
      <li>10-14 людських пожеж: 3 бали (висока потреба)</li>
      <li>5-9 людських пожеж: 1 бал (помірна потреба)</li>
      <li>&lt;5 людських пожеж: 0 балів</li>
    </ul>
    
    <p style="font-size: 11px;">
      <strong>Дані:</strong> Людських пожеж у регіоні: ${d?.fires?.human_caused_fires || 0}
    </p>
    
    <p style="font-size: 11px;">
      <strong>Наукове обґрунтування:</strong> Дослідження NW Fire Science (2020) показало, що 80% рекреаційних пожеж 
      відбуваються поза офіційними місцями відпочинку. Облаштовані вогнища знижують ризик на 40%.
    </p>
    
    <p style="margin: 10px 0; padding: 10px; border: 1.5px solid #000; background: white;">
      <strong>Результат: +${analysisResult.fire_score || 0} балів з 5</strong>
    </p>
    
    <div class="section-divider"></div>
    
    <h3>3.7. Фактор 7: Штраф за ринкову насиченість (0 до -15 балів)</h3>
    
    <p style="font-size: 11px;">
      <strong>Прогресивна шкала штрафів:</strong>
    </p>
    <ul style="font-size: 11px;">
      <li>Щільність &lt;1,0 пункт/1000км²: -2 бали</li>
      <li>Щільність 1,0-2,0 пункти/1000км²: -5 балів</li>
      <li>Щільність 2,0-3,0 пункти/1000км²: -10 балів</li>
      <li>Щільність &gt;3,0 пункти/1000км²: -15 балів</li>
    </ul>
    
    <p style="font-size: 11px;">
      <strong>Дані:</strong> Щільність: ${d?.saturation?.density_per_1000km2?.toFixed(2) || 0} пунктів/1000км²
    </p>
    
    <p style="margin: 10px 0; padding: 10px; border: 1.5px solid #000; background: white;">
      <strong>Результат: ${analysisResult.saturation_penalty} балів</strong>
    </p>
  `;
}

function generateSummaryTable(analysisResult) {
  return `
    <h2>4. ПІДСУМКОВА ТАБЛИЦЯ РЕЗУЛЬТАТІВ</h2>
    
    <table class="avoid-break">
      <tr>
        <th style="width: 8%;">№</th>
        <th style="width: 42%;">Фактор</th>
        <th style="width: 15%;">Отримано</th>
        <th style="width: 15%;">Максимум</th>
        <th style="width: 20%;">Виконання, %</th>
      </tr>
      <tr>
        <td style="text-align: center;"><strong>1</strong></td>
        <td>Попит населення</td>
        <td style="text-align: center; font-weight: bold;">${analysisResult.demand_score}</td>
        <td style="text-align: center;">25</td>
        <td style="text-align: center;">${((analysisResult.demand_score / 25) * 100).toFixed(0)}%</td>
      </tr>
      <tr>
        <td style="text-align: center;"><strong>2</strong></td>
        <td>Природно-заповідний фонд</td>
        <td style="text-align: center; font-weight: bold;">${analysisResult.pfz_score}</td>
        <td style="text-align: center;">20</td>
        <td style="text-align: center;">${((analysisResult.pfz_score / 20) * 100).toFixed(0)}%</td>
      </tr>
      <tr>
        <td style="text-align: center;"><strong>3</strong></td>
        <td>Природні ресурси</td>
        <td style="text-align: center; font-weight: bold;">${analysisResult.nature_score}</td>
        <td style="text-align: center;">15</td>
        <td style="text-align: center;">${((analysisResult.nature_score / 15) * 100).toFixed(0)}%</td>
      </tr>
      <tr>
        <td style="text-align: center;"><strong>4</strong></td>
        <td>Транспортна доступність</td>
        <td style="text-align: center; font-weight: bold;">${analysisResult.accessibility_score}</td>
        <td style="text-align: center;">15</td>
        <td style="text-align: center;">${((analysisResult.accessibility_score / 15) * 100).toFixed(0)}%</td>
      </tr>
      <tr>
        <td style="text-align: center;"><strong>5</strong></td>
        <td>Інфраструктура</td>
        <td style="text-align: center; font-weight: bold;">${analysisResult.infrastructure_score}</td>
        <td style="text-align: center;">10</td>
        <td style="text-align: center;">${((analysisResult.infrastructure_score / 10) * 100).toFixed(0)}%</td>
      </tr>
      <tr>
        <td style="text-align: center;"><strong>6</strong></td>
        <td>Профілактика пожеж (бонус)</td>
        <td style="text-align: center; font-weight: bold;">+${analysisResult.fire_score || 0}</td>
        <td style="text-align: center;">5</td>
        <td style="text-align: center;">${(((analysisResult.fire_score || 0) / 5) * 100).toFixed(0)}%</td>
      </tr>
      <tr>
        <td style="text-align: center;"><strong>7</strong></td>
        <td>Штраф за насиченість</td>
        <td style="text-align: center; font-weight: bold;">${analysisResult.saturation_penalty}</td>
        <td style="text-align: center;">-15</td>
        <td style="text-align: center;">${((Math.abs(analysisResult.saturation_penalty) / 15) * 100).toFixed(0)}%</td>
      </tr>
      <tr style="border-top: 2px solid #000;">
        <td colspan="2" style="text-align: right; font-weight: bold; font-size: 13px;">ІНТЕГРАЛЬНИЙ ПОКАЗНИК:</td>
        <td style="text-align: center; font-weight: bold; font-size: 16px;">${analysisResult.total_score}</td>
        <td style="text-align: center; font-weight: bold;">100</td>
        <td style="text-align: center; font-weight: bold;">${analysisResult.total_score}%</td>
      </tr>
    </table>
  `;
}

function generateConclusions(analysisResult, d) {
  const shouldBuild = d?.investment?.should_build;
  return `
    <h2>5. ВИСНОВКИ ТА РЕКОМЕНДАЦІЇ</h2>
    
    <h3>5.1. Загальна оцінка потенціалу</h3>
    <p>
      За результатами комплексної оцінки рекреаційного потенціалу території <strong>${analysisResult.region}</strong> 
      отримано інтегральний показник <strong>${analysisResult.total_score} балів зі 100 можливих</strong>, 
      що відповідає категорії "<strong>${analysisResult.category}</strong>".
    </p>
    
    <h3>5.2. Інвестиційна рекомендація</h3>
    <div style="padding: 15px; border: 2px solid #000000; margin: 15px 0;">
      <p style="margin: 0; font-weight: bold; text-align: center;">
        ${shouldBuild ? 'РЕКОМЕНДУЄТЬСЯ БУДІВНИЦТВО РЕКРЕАЦІЙНИХ ОБ\'ЄКТІВ' : 'БУДІВНИЦТВО РИЗИКОВАНЕ'}
      </p>
    </div>
    
    <p style="font-size: 11px;">
      ${analysisResult.recommendation}
    </p>
    
    <h3>5.3. Аналіз попиту та пропозиції</h3>
    <table class="avoid-break">
      <tr>
        <th style="width: 60%;">Показник</th>
        <th style="width: 40%;">Значення</th>
      </tr>
      <tr>
        <td>Річний попит на рекреацію</td>
        <td style="text-align: right;"><strong>${d?.population?.annual_demand?.toLocaleString() || 'н/д'}</strong> відвідувань</td>
      </tr>
      <tr>
        <td>Річна пропозиція (поточна)</td>
        <td style="text-align: right;">${d?.population?.annual_supply?.toLocaleString() || 'н/д'} місць</td>
      </tr>
      <tr>
        <td>Дефіцит/Профіцит</td>
        <td style="text-align: right; font-weight: bold;">${d?.population?.gap > 0 ? '+' : ''}${(d?.population?.gap || 0).toLocaleString()} відвідувань</td>
      </tr>
      <tr>
        <td>Потрібно об'єктів для покриття дефіциту</td>
        <td style="text-align: right;">${d?.population?.gap > 0 ? Math.ceil((d?.population?.gap || 0) / (50 * 180 * 2)) : 0} пунктів</td>
      </tr>
    </table>
    
    <h3>5.4. Ключові висновки за факторами</h3>
    <ol>
      <li><strong>Попит населення (${analysisResult.demand_score}/25):</strong> ${analysisResult.demand_score >= 20 ? 'Високий дефіцит рекреаційних місць, сприятливі умови для інвестицій.' : analysisResult.demand_score >= 15 ? 'Помірний попит, потрібен детальний маркетинговий аналіз.' : 'Ринок насичений або низький попит.'}</li>
      
      <li><strong>ПЗФ (${analysisResult.pfz_score}/20):</strong> ${analysisResult.pfz_score >= 15 ? 'Висока туристична привабливість завдяки наявності ПЗФ.' : analysisResult.pfz_score >= 10 ? 'Помірна привабливість природоохоронних територій.' : 'Низька концентрація об\'єктів ПЗФ.'}</li>
      
      <li><strong>Природні ресурси (${analysisResult.nature_score}/15):</strong> ${analysisResult.nature_score >= 12 ? 'Висока естетична цінність території.' : analysisResult.nature_score >= 8 ? 'Середня забезпеченість природними ресурсами.' : 'Обмежені природні ресурси.'}</li>
      
      <li><strong>Транспортна доступність (${analysisResult.accessibility_score}/15):</strong> ${analysisResult.accessibility_score >= 12 ? 'Відмінна транспортна інфраструктура.' : analysisResult.accessibility_score >= 8 ? 'Задовільний рівень доступності.' : 'Потребує розвитку транспортної мережі.'}</li>
      
      <li><strong>Інфраструктура (${analysisResult.infrastructure_score}/10):</strong> ${analysisResult.infrastructure_score >= 8 ? 'Розвинута супутня інфраструктура.' : analysisResult.infrastructure_score >= 5 ? 'Базова інфраструктура присутня.' : 'Потребує розвитку інфраструктури.'}</li>
      
      <li><strong>Пожежна безпека (+${analysisResult.fire_score || 0}/5):</strong> ${(analysisResult.fire_score || 0) >= 3 ? 'Висока потреба в облаштованих пунктах для профілактики пожеж.' : 'Помірний рівень пожежної небезпеки.'}</li>
      
      <li><strong>Ринкова насиченість (${analysisResult.saturation_penalty}/0):</strong> ${analysisResult.saturation_penalty >= -5 ? 'Низька конкуренція на ринку.' : analysisResult.saturation_penalty >= -10 ? 'Помірна насиченість ринку.' : 'Висока конкуренція, ринок перенасичений.'}</li>
    </ol>
  `;
}

function generateBibliography() {
  return `
    <h2>6. БІБЛІОГРАФІЧНИЙ СПИСОК</h2>
    
    <ol style="font-size: 11px;">
      <li style="margin-bottom: 8px;">
        Saaty T. L. The Analytic Hierarchy Process: Planning, Priority Setting, Resource Allocation. 
        New York: McGraw-Hill, 1980. 287 p.
      </li>
      
      <li style="margin-bottom: 8px;">
        Kentucky State Comprehensive Outdoor Recreation Plan 2020-2025. Kentucky Department of Parks, 2020.
      </li>
      
      <li style="margin-bottom: 8px;">
        District of Columbia State Comprehensive Outdoor Recreation Plan 2020. DC Department of Parks and Recreation, 2020.
      </li>
      
      <li style="margin-bottom: 8px;">
        Gigović L., Pamučar D., Bajić Z., Drobnjak S. Application of GIS-Interval Rough AHP Methodology 
        for Flood Hazard Mapping in Urban Areas. Water, 2017. Vol. 9(6). P. 360.
      </li>
      
      <li style="margin-bottom: 8px;">
        Liu J., Deng Y., Wang Y., Huang H., Du Q., Ren F. Urban Livability and Tourism Development in China: 
        Analysis of Sustainable Development by Means of Spatial Panel Data. Habitat International, 2017. Vol. 68. P. 99-107.
      </li>
      
      <li style="margin-bottom: 8px;">
        Bunruamkaew K., Murayama Y. Site Suitability Evaluation for Ecotourism Using GIS & AHP: 
        A Case Study of Surat Thani Province, Thailand. Procedia - Social and Behavioral Sciences, 2011. Vol. 21. P. 269-278.
      </li>
      
      <li style="margin-bottom: 8px;">
        Northwest Fire Science Consortium. Human and Climatic Influences on Fire Occurrence in the United States. 2020.
      </li>
      
      <li style="margin-bottom: 8px;">
        Laguna Hills Community Recreation Assessment. City of Laguna Hills Parks and Recreation Department, 2021.
      </li>
      
      <li style="margin-bottom: 8px;">
        Закон України "Про природно-заповідний фонд України" від 16 червня 1992 року № 2456-XII 
        (зі змінами та доповненнями).
      </li>
      
      <li style="margin-bottom: 8px;">
        Державна служба статистики України. Статистична інформація. URL: http://www.ukrstat.gov.ua (дата звернення: 2024).
      </li>
    </ol>
    
    <div class="section-divider"></div>
    
    <p style="font-size: 10px; text-align: center; margin-top: 30px;">
      Кінець звіту<br/>
      Дата формування: ${new Date().toLocaleDateString('uk-UA')}
    </p>
  `;
}

async function generateMultiPagePDF(pdfContent, regionName) {
  const canvas = await html2canvas(pdfContent, { 
    scale: 2, 
    useCORS: true,
    logging: false,
    width: 800,
    windowWidth: 800,
    backgroundColor: '#ffffff'
  });
  
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  
  const ratio = pdfWidth / imgWidth;
  const totalHeight = imgHeight * ratio;
  
  let heightLeft = totalHeight;
  let position = 0;
  
  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalHeight);
  heightLeft -= pdfHeight;
  
  while (heightLeft > 0) {
    position = heightLeft - totalHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalHeight);
    heightLeft -= pdfHeight;
  }
  
  const pdfOutput = pdf.output('blob');
  const pdfBlob = new Blob([pdfOutput], { type: 'application/pdf' });
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = `Науковий_звіт_${regionName.replace(/ /g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 250);
  console.log('✅ Academic PDF saved successfully');
}
