/**
 * ФІНАЛЬНИЙ PDF-ЕКСПОРТ З ПІДТРИМКОЮ КИРИЛИЦІ
 * Використовує html2canvas для кирилиці + розумні розриви сторінок
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportFinalPDF = async (analysisResult) => {
  if (!analysisResult) {
    console.error('❌ No analysisResult');
    return;
  }

  let container = null;
  try {
    console.log('🔍 Starting final PDF export...');
    
    const d = analysisResult.details;
    
    // Створюємо контейнер
    container = document.createElement('div');
    container.style.cssText = 'position: absolute; left: -9999px; width: 794px; background: white; font-family: Arial, sans-serif; padding: 40px;';
    
    // Генеруємо HTML по сторінках
    container.innerHTML = generatePDFPages(analysisResult, d);
    
    document.body.appendChild(container);
    await new Promise(resolve => setTimeout(resolve, 500)); // Даємо час для рендерингу
    
    // Створюємо PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Знаходимо всі сторінки
    const pages = container.querySelectorAll('.pdf-page');
    
    for (let i = 0; i < pages.length; i++) {
      console.log(`Rendering page ${i + 1}/${pages.length}`);
      
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    }
    
    // Зберігаємо
    const pdfOutput = pdf.output('blob');
    const pdfBlob = new Blob([pdfOutput], { type: 'application/pdf' });
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `Науковий_звіт_${analysisResult.region.replace(/ /g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 250);
    
    console.log('✅ Final PDF saved successfully');
    
  } catch (error) {
    console.error('❌ PDF export error:', error);
    alert('Помилка експорту PDF: ' + error.message);
  } finally {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

function generatePDFPages(analysisResult, d) {
  return `
    <style>
      .pdf-page {
        width: 794px;
        min-height: 1123px;
        background: white;
        padding: 50px 40px;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
        page-break-after: always;
      }
      h1 { font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; text-align: center; text-transform: uppercase; }
      h2 { font-size: 15px; font-weight: bold; margin: 25px 0 12px 0; border-bottom: 2px solid #000; padding-bottom: 6px; }
      h3 { font-size: 14px; font-weight: bold; margin: 18px 0 10px 0; }
      h4 { font-size: 13px; font-weight: bold; margin: 15px 0 8px 0; text-decoration: underline; }
      p { font-size: 12px; margin: 8px 0; text-align: justify; line-height: 1.5; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px; }
      th { background: #ffffff; color: #000; padding: 10px; text-align: left; border: 1.5px solid #000; font-weight: bold; }
      td { padding: 8px; border: 1px solid #000; }
      tr:nth-child(even) td { background: #f5f5f5; }
      .formula-box { padding: 12px; border: 1.5px solid #000; margin: 12px 0; background: #fafafa; font-family: 'Courier New', monospace; font-size: 12px; }
      ul, ol { margin: 10px 0; padding-left: 25px; font-size: 12px; }
      li { margin: 5px 0; }
      strong { font-weight: bold; }
    </style>

    ${generatePage1(analysisResult)}
    ${generatePage2()}
    ${generatePage3(d)}
    ${generatePage4(analysisResult, d)}
    ${generatePage5(analysisResult, d)}
    ${generatePage6Table(analysisResult)}
    ${generatePage7(analysisResult, d)}
    ${generatePage8()}
  `;
}

function generatePage1(analysisResult) {
  return `
    <div class="pdf-page">
      <h1 style="margin-top: 80px;">НАУКОВИЙ ЗВІТ</h1>
      <p style="font-size: 14px; font-weight: bold; text-align: center; margin: 30px 0;">
        Аналіз рекреаційного потенціалу території<br/>
        за методом багатокритеріального прийняття рішень
      </p>
      
      <p style="font-size: 13px; font-weight: bold; text-align: center; margin: 40px 0;">
        Об'єкт дослідження: ${analysisResult.region}
      </p>
      
      <table style="width: 80%; margin: 60px auto; border: 2px solid #000;">
        <tr>
          <td colspan="2" style="text-align: center; padding: 12px; font-weight: bold; border-bottom: 1.5px solid #000;">
            РЕЗУЛЬТАТИ ІНТЕГРАЛЬНОЇ ОЦІНКИ
          </td>
        </tr>
        <tr>
          <td style="width: 60%; padding: 10px; font-weight: bold;">Інтегральний показник потенціалу:</td>
          <td style="width: 40%; text-align: center; padding: 10px; font-size: 20px; font-weight: bold;">
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
      
      <p style="font-size: 11px; text-align: center; margin-top: 100px;">
        Дата формування: ${new Date().toLocaleDateString('uk-UA')}<br/>
        Методологія: Analytic Hierarchy Process (AHP), версія 1.0<br/>
        7-факторна модель оцінки рекреаційного потенціалу
      </p>
    </div>
  `;
}

function generatePage2() {
  return `
    <div class="pdf-page">
      <h2>1. МЕТОДОЛОГІЯ ДОСЛІДЖЕННЯ</h2>
      
      <h3>1.1. Загальна характеристика методу</h3>
      <p>
        Для оцінки рекреаційного потенціалу території застосовано метод <strong>Analytic Hierarchy Process (AHP)</strong>, 
        розроблений Томасом Л. Сааті (1980). AHP є систематичним підходом до багатокритеріального прийняття рішень, 
        що дозволяє інтегрувати кількісні та якісні фактори через парне порівняння та визначення вагових коефіцієнтів.
      </p>
      
      <h3>1.2. Математична модель</h3>
      <p><strong>Інтегральна формула оцінки:</strong></p>
      <div class="formula-box">
        I = F₁ + F₂ + F₃ + F₄ + F₅ + F₆ - F₇
      </div>
      <p style="font-size: 11px;">
        де: I - інтегральний показник потенціалу (0-100 балів);<br/>
        F₁ - попит населення (0-25 балів, 25%);<br/>
        F₂ - природно-заповідний фонд (0-20 балів, 20%);<br/>
        F₃ - природні ресурси (0-15 балів, 15%);<br/>
        F₄ - транспортна доступність (0-15 балів, 15%);<br/>
        F₅ - інфраструктура (0-10 балів, 10%);<br/>
        F₆ - профілактика пожеж (0-5 балів, +5%);<br/>
        F₇ - штраф за насиченість (0-15 балів, -15%).
      </p>
      
      <h3>1.3. Вагові коефіцієнти факторів</h3>
      <table>
        <tr>
          <th style="width: 8%;">№</th>
          <th style="width: 37%;">Фактор</th>
          <th style="width: 12%;">Вага, %</th>
          <th style="width: 15%;">Діапазон</th>
          <th style="width: 28%;">Обґрунтування</th>
        </tr>
        <tr>
          <td style="text-align: center;"><strong>1</strong></td>
          <td>Попит населення</td>
          <td style="text-align: center;"><strong>25</strong></td>
          <td style="text-align: center;">0-25</td>
          <td>Економічна основа</td>
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
          <td>Критичний бар'єр</td>
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
    </div>
  `;
}

function generatePage3(d) {
  return `
    <div class="pdf-page">
      <h2>2. ВИХІДНІ ДАНІ ДЛЯ РОЗРАХУНКУ</h2>
      
      <h3>2.1. Демографічні показники</h3>
      <table>
        <tr>
          <th style="width: 60%;">Показник</th>
          <th style="width: 40%;">Значення</th>
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
      </table>
      
      <h3>2.2. Природно-заповідний фонд</h3>
      <table>
        <tr>
          <th style="width: 60%;">Категорія ПЗФ</th>
          <th style="width: 40%;">Кількість</th>
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
          <td>Частка території під ПЗФ</td>
          <td style="text-align: right;"><strong>${d?.pfz?.percent_of_region || 0}%</strong></td>
        </tr>
      </table>
      
      <h3>2.3. Природні ресурси та інші дані</h3>
      <table>
        <tr>
          <th style="width: 60%;">Показник</th>
          <th style="width: 40%;">Значення</th>
        </tr>
        <tr>
          <td>Лісистість території</td>
          <td style="text-align: right;"><strong>${d?.nature?.forest_coverage_percent || 0}%</strong></td>
        </tr>
        <tr>
          <td>Водні об'єкти</td>
          <td style="text-align: right;">${d?.nature?.has_water_bodies ? 'Наявні' : 'Відсутні'}</td>
        </tr>
        <tr>
          <td>Людські пожежі (2025)</td>
          <td style="text-align: right;"><strong>${d?.fires?.human_caused_fires || 0}</strong> випадків</td>
        </tr>
        <tr>
          <td>Існуючі рекреаційні пункти</td>
          <td style="text-align: right;"><strong>${d?.saturation?.existing_points || 0}</strong> од.</td>
        </tr>
      </table>
    </div>
  `;
}

function generatePage4(analysisResult, d) {
  return `
    <div class="pdf-page">
      <h2>3. ПОКРОКОВІ РОЗРАХУНКИ ФАКТОРІВ</h2>
      
      <h3>3.1. Фактор 1: Попит населення (0-25 балів)</h3>
      
      <h4>Крок 1. Річний попит</h4>
      <div class="formula-box">
        Річний попит = Населення × 0,15 × 3<br/>
        ${d?.population?.total?.toLocaleString() || 'н/д'} × 0,15 × 3 = ${d?.population?.annual_demand?.toLocaleString() || 'н/д'} відвідувань/рік
      </div>
      
      <h4>Крок 2. Річна пропозиція</h4>
      <div class="formula-box">
        Річна пропозиція = Пункти × 50 × 180 × 2<br/>
        ${d?.saturation?.existing_points || 0} × 50 × 180 × 2 = ${d?.population?.annual_supply?.toLocaleString() || 'н/д'} місць/рік
      </div>
      
      <p><strong>Результат:</strong> Фактор 1 = <strong>${analysisResult.demand_score}/25</strong> балів</p>
      
      <h3>3.2. Фактор 2: ПЗФ (0-20 балів)</h3>
      <div class="formula-box">
        Бал = НПП×2,0 + Заповідники×1,5 + РЛП×1,0<br/>
        ${d?.pfz?.national_parks || 0}×2,0 + ${d?.pfz?.nature_reserves || 0}×1,5 + ${d?.pfz?.regional_landscape_parks || 0}×1,0
      </div>
      <p><strong>Результат:</strong> Фактор 2 = <strong>${analysisResult.pfz_score}/20</strong> балів</p>
      
      <h3>3.3. Фактор 3: Природа (0-15 балів)</h3>
      
      <h4>Компонент А: Лісове покриття</h4>
      <div class="formula-box">
        Бал = Лісистість(%) × 0,275<br/>
        ${d?.nature?.forest_coverage_percent || 0}% × 0,275 = ${((d?.nature?.forest_coverage_percent || 0) * 0.275).toFixed(2)} балів
      </div>
      
      <h4>Компонент Б: Водні об'єкти</h4>
      <p style="font-size: 11px; margin: 5px 0;">
        Водойми = ${d?.nature?.has_water_bodies ? '<strong>4 бали</strong>' : '0 балів'}<br/>
        <em>Обґрунтування: Водойми розширюють можливості рекреації (риболовля, плавання, водні види спорту)</em>
      </p>
      
      <p><strong>Результат:</strong> Фактор 3 = <strong>${analysisResult.nature_score}/15</strong> балів</p>
      
      <h3>3.4. Фактор 4: Транспортна доступність (0-15 балів)</h3>
      <p style="font-size: 11px; margin: 5px 0;">
        <strong>Формула (композитна оцінка):</strong>
      </p>
      <div class="formula-box">
        Бал = Base(0-10) + Міжнародні_траси×0,8 (макс 3) + Аеропорт(0-1) + Щільність_доріг(0-1)
      </div>
      <p style="font-size: 11px;">
        <strong>Вхідні дані:</strong><br/>
        • Щільність доріг: ${d?.transport?.highway_density || 0} км/100км²<br/>
        • Залізничні станції: ${d?.transport?.railway_stations || 0} од.<br/>
        • Аеропорти: ${d?.transport?.airports || 0} од.<br/>
        <em>Обґрунтування: Транспортна доступність - критичний бар'єр для рекреації (DC SCORP 2020)</em>
      </p>
      <p><strong>Результат:</strong> Фактор 4 = <strong>${analysisResult.accessibility_score}/15</strong> балів</p>
      
      <h3>3.5. Фактор 5: Інфраструктура (0-10 балів)</h3>
      <p style="font-size: 11px; margin: 5px 0;">
        <strong>Формула (композитна оцінка):</strong>
      </p>
      <div class="formula-box">
        Бал = Медицина(0-3) + АЗС(0-2) + Мобільний_зв'язок(0-2) + Готелі(0-2) + Електрифікація(0-1)
      </div>
      <p style="font-size: 11px;">
        <strong>Вхідні дані:</strong><br/>
        • Лікарні на 100 тис.: ${d?.infrastructure?.hospitals_per_100k?.toFixed(1) || 0}<br/>
        • АЗС на 100 км²: ${d?.infrastructure?.gas_stations_per_100km2?.toFixed(2) || 0}<br/>
        • Покриття зв'язком: ${d?.infrastructure?.mobile_coverage_percent || 0}%<br/>
        • Готелі: ${d?.infrastructure?.hotels_total || 0} од.<br/>
        <em>Обґрунтування: Інфраструктура - вторинний фактор, може бути розвинута (Laguna Hills 2021)</em>
      </p>
      <p><strong>Результат:</strong> Фактор 5 = <strong>${analysisResult.infrastructure_score}/10</strong> балів</p>
    </div>
  `;
}

function generatePage5(analysisResult, d) {
  return `
    <div class="pdf-page">
      <h2>3. ПОКРОКОВІ РОЗРАХУНКИ (продовження)</h2>
      
      <h3>3.6. Фактор 6: Профілактика пожеж (0-5 балів, бонус)</h3>
      <p style="font-size: 11px; margin: 5px 0;">
        <strong>Парадоксальна логіка:</strong> Більше людських пожеж = вища потреба в облаштованих місцях
      </p>
      <p style="font-size: 11px;">
        <strong>Шкала оцінювання:</strong><br/>
        • ≥15 людських пожеж: 5 балів (критична потреба)<br/>
        • 10-14 людських пожеж: 3 бали (висока потреба)<br/>
        • 5-9 людських пожеж: 1 бал (помірна потреба)<br/>
        • &lt;5 людських пожеж: 0 балів
      </p>
      <p style="font-size: 11px;">
        <strong>Дані:</strong> Людських пожеж у регіоні: <strong>${d?.fires?.human_caused_fires || 0}</strong><br/>
        <em>Обґрунтування: Облаштовані вогнища знижують ризик на 40% (NW Fire Science 2020)</em>
      </p>
      <p><strong>Результат:</strong> Фактор 6 (бонус) = <strong>+${analysisResult.fire_score || 0}/5</strong> балів</p>
      
      <h3>3.7. Фактор 7: Штраф за насиченість (0 до -15 балів)</h3>
      <p style="font-size: 11px; margin: 5px 0;">
        <strong>Прогресивна шкала штрафів:</strong>
      </p>
      <ul style="font-size: 11px;">
        <li>Щільність &lt;1,0 пункт/1000км²: -2 бали</li>
        <li>Щільність 1,0-2,0 пункти/1000км²: -5 балів</li>
        <li>Щільність 2,0-3,0 пункти/1000км²: -10 балів</li>
        <li>Щільність &gt;3,0 пункти/1000км²: -15 балів</li>
      </ul>
      <p style="font-size: 11px;">
        <strong>Дані:</strong> Щільність = <strong>${d?.saturation?.density_per_1000km2?.toFixed(2) || 0}</strong> пунктів/1000км²<br/>
        <em>Обґрунтування: Висока насиченість = менше місця для нових об'єктів (Kentucky Market Analysis)</em>
      </p>
      <p><strong>Результат:</strong> Фактор 7 (штраф) = <strong>${analysisResult.saturation_penalty}/0</strong> балів</p>
    </div>
  `;
}

function generatePage6Table(analysisResult) {
  return `
    <div class="pdf-page">
      <h2>4. ПІДСУМКОВА ТАБЛИЦЯ РЕЗУЛЬТАТІВ</h2>
      
      <table>
        <tr>
          <th>№</th>
          <th>Фактор</th>
          <th style="text-align: center;">Отримано</th>
          <th style="text-align: center;">Максимум</th>
          <th style="text-align: center;">%</th>
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
          <td>ПЗФ</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.pfz_score}</td>
          <td style="text-align: center;">20</td>
          <td style="text-align: center;">${((analysisResult.pfz_score / 20) * 100).toFixed(0)}%</td>
        </tr>
        <tr>
          <td style="text-align: center;"><strong>3</strong></td>
          <td>Природа</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.nature_score}</td>
          <td style="text-align: center;">15</td>
          <td style="text-align: center;">${((analysisResult.nature_score / 15) * 100).toFixed(0)}%</td>
        </tr>
        <tr>
          <td style="text-align: center;"><strong>4</strong></td>
          <td>Транспорт</td>
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
          <td>Пожежі (бонус)</td>
          <td style="text-align: center; font-weight: bold;">+${analysisResult.fire_score || 0}</td>
          <td style="text-align: center;">5</td>
          <td style="text-align: center;">${(((analysisResult.fire_score || 0) / 5) * 100).toFixed(0)}%</td>
        </tr>
        <tr>
          <td style="text-align: center;"><strong>7</strong></td>
          <td>Штраф насиченості</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.saturation_penalty}</td>
          <td style="text-align: center;">-15</td>
          <td style="text-align: center;">${((Math.abs(analysisResult.saturation_penalty) / 15) * 100).toFixed(0)}%</td>
        </tr>
        <tr style="border-top: 2px solid #000;">
          <td colspan="2" style="text-align: right; font-weight: bold; font-size: 14px;">ІНТЕГРАЛЬНИЙ ПОКАЗНИК:</td>
          <td style="text-align: center; font-weight: bold; font-size: 18px;">${analysisResult.total_score}</td>
          <td style="text-align: center; font-weight: bold;">100</td>
          <td style="text-align: center; font-weight: bold;">${analysisResult.total_score}%</td>
        </tr>
      </table>
    </div>
  `;
}

function generatePage7(analysisResult, d) {
  const shouldBuild = d?.investment?.should_build;
  const gap = d?.population?.gap || 0;
  const pointsNeeded = gap > 0 ? Math.ceil(gap / (50 * 180 * 2)) : 0;
  
  // Отримуємо рекомендовані зони (якщо є)
  const recommendedZones = analysisResult.recommended_zones || [];
  
  return `
    <div class="pdf-page">
      <h2>5. ВИСНОВКИ ТА РЕКОМЕНДАЦІЇ</h2>
      
      <h3>5.1. Загальна оцінка</h3>
      <p>
        За результатами комплексної оцінки території <strong>${analysisResult.region}</strong> 
        отримано інтегральний показник <strong>${analysisResult.total_score} балів зі 100</strong>, 
        що відповідає категорії "<strong>${analysisResult.category}</strong>".
      </p>
      
      <div style="padding: 15px; border: 2px solid #000; margin: 20px 0; text-align: center;">
        <strong>${shouldBuild ? 'РЕКОМЕНДУЄТЬСЯ БУДІВНИЦТВО' : 'БУДІВНИЦТВО РИЗИКОВАНЕ'}</strong>
      </div>
      
      <p>${analysisResult.recommendation}</p>
      
      <h3>5.2. Аналіз попиту та пропозиції</h3>
      <table>
        <tr>
          <th style="width: 60%;">Показник</th>
          <th style="width: 40%;">Значення</th>
        </tr>
        <tr>
          <td>Річний попит</td>
          <td style="text-align: right; font-weight: bold;">${d?.population?.annual_demand?.toLocaleString() || 'н/д'} відвідувань</td>
        </tr>
        <tr>
          <td>Річна пропозиція</td>
          <td style="text-align: right;">${d?.population?.annual_supply?.toLocaleString() || 'н/д'} місць</td>
        </tr>
        <tr>
          <td>Дефіцит/Профіцит</td>
          <td style="text-align: right; font-weight: bold;">${gap > 0 ? '+' : ''}${gap.toLocaleString()}</td>
        </tr>
        <tr style="background: #f0f0f0;">
          <td style="font-weight: bold;">Потрібно нових рекреаційних пунктів</td>
          <td style="text-align: right; font-weight: bold; font-size: 14px;">${pointsNeeded}</td>
        </tr>
      </table>
      
      ${pointsNeeded > 0 ? `
        <h3>5.3. Рекомендації щодо будівництва</h3>
        <p style="font-size: 12px;">
          Для покриття дефіциту рекреаційних послуг в області <strong>${analysisResult.region}</strong> 
          рекомендується будівництво <strong>${pointsNeeded} нових рекреаційних пунктів</strong> 
          із стандартною місткістю 50 відвідувачів кожен.
        </p>
        
        ${recommendedZones.length > 0 ? `
          <h4>Рекомендовані зони для будівництва:</h4>
          <ol style="font-size: 11px; line-height: 1.6;">
            ${recommendedZones.slice(0, 5).map(zone => `
              <li>
                <strong>${zone.location || 'Зона ' + zone.rank}</strong>
                ${zone.score ? ` (потенціал: ${zone.score} балів)` : ''}
                ${zone.reason ? `<br/><em style="font-size: 10px;">${zone.reason}</em>` : ''}
              </li>
            `).join('')}
          </ol>
        ` : `
          <p style="font-size: 11px; font-style: italic;">
            Примітка: Для визначення конкретних локацій рекомендується провести детальний ГІС-аналіз 
            з урахуванням близькості до ПЗФ, транспортної доступності та екологічних обмежень.
          </p>
        `}
      ` : `
        <h3>5.3. Висновок</h3>
        <p>
          Область має достатню пропозицію рекреаційних послуг. Нові об'єкти не рекомендуються через 
          відсутність дефіциту попиту.
        </p>
      `}
    </div>
  `;
}

function generatePage8() {
  return `
    <div class="pdf-page">
      <h2>6. БІБЛІОГРАФІЧНИЙ СПИСОК</h2>
      
      <ol style="font-size: 11px; line-height: 1.8;">
        <li>Saaty T. L. The Analytic Hierarchy Process. New York: McGraw-Hill, 1980.</li>
        <li>Kentucky State Comprehensive Outdoor Recreation Plan 2020-2025.</li>
        <li>District of Columbia SCORP 2020.</li>
        <li>Wiley "AHP for Ecotourism Site Selection" 2022.</li>
        <li>NW Fire Science "Human and Climatic Influences" 2020.</li>
        <li>Laguna Hills Community Recreation Assessment 2021.</li>
        <li>Закон України "Про природно-заповідний фонд України" 1992.</li>
        <li>Державна служба статистики України, 2024.</li>
      </ol>
      
      <p style="text-align: center; margin-top: 50px; font-size: 11px;">
        Кінець звіту<br/>
        Дата формування: ${new Date().toLocaleDateString('uk-UA')}
      </p>
    </div>
  `;
}
