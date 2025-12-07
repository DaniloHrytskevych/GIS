/**
 * ФІНАЛЬНИЙ ПОРІВНЯЛЬНИЙ PDF З ПІДТРИМКОЮ КИРИЛИЦІ
 * Використовує html2canvas
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportFinalComparePDF = async (compareResults) => {
  if (!compareResults || compareResults.length === 0) {
    console.error('❌ No compareResults');
    return;
  }

  let container = null;
  try {
    console.log('🔍 Starting final compare PDF export...');
    
    const sorted = [...compareResults].sort((a, b) => b.total_score - a.total_score);
    
    container = document.createElement('div');
    container.style.cssText = 'position: absolute; left: -9999px; width: 794px; background: white; font-family: Arial, sans-serif; padding: 40px;';
    
    container.innerHTML = generateComparePDFPages(sorted);
    
    document.body.appendChild(container);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const pages = container.querySelectorAll('.pdf-page');
    
    for (let i = 0; i < pages.length; i++) {
      console.log(`Rendering compare page ${i + 1}/${pages.length}`);
      
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
    
    const pdfOutput = pdf.output('blob');
    const pdfBlob = new Blob([pdfOutput], { type: 'application/pdf' });
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `Порівняльний_аналіз_областей.pdf`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 250);
    
    console.log('✅ Final compare PDF saved');
    
  } catch (error) {
    console.error('❌ Compare PDF export error:', error);
    alert('Помилка експорту порівняльного PDF: ' + error.message);
  } finally {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

function generateComparePDFPages(sorted) {
  const topRegion = sorted[0];
  const bottomRegion = sorted[sorted.length - 1];
  const avgScore = (sorted.reduce((sum, r) => sum + r.total_score, 0) / sorted.length).toFixed(1);
  
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
      p { font-size: 12px; margin: 8px 0; line-height: 1.5; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px; }
      th { background: #ffffff; color: #000; padding: 10px; text-align: left; border: 1.5px solid #000; font-weight: bold; }
      td { padding: 8px; border: 1px solid #000; }
      tr:nth-child(even) td { background: #f5f5f5; }
      ul, ol { margin: 10px 0; padding-left: 25px; font-size: 12px; }
      li { margin: 5px 0; }
      strong { font-weight: bold; }
    </style>

    ${generateComparePage1(sorted, topRegion, bottomRegion, avgScore)}
    ${generateComparePage2(sorted)}
    ${generateComparePage3(sorted)}
    ${generateComparePage4(sorted, avgScore)}
  `;
}

function generateComparePage1(sorted, topRegion, bottomRegion, avgScore) {
  return `
    <div class="pdf-page">
      <h1 style="margin-top: 80px;">НАУКОВИЙ ЗВІТ</h1>
      <p style="font-size: 14px; font-weight: bold; text-align: center; margin: 30px 0;">
        Порівняльний аналіз рекреаційного потенціалу<br/>
        адміністративних областей України
      </p>
      
      <table style="width: 90%; margin: 60px auto; border: 2px solid #000;">
        <tr>
          <td colspan="2" style="text-align: center; padding: 12px; font-weight: bold; border-bottom: 1.5px solid #000;">
            УЗАГАЛЬНЕНІ РЕЗУЛЬТАТИ АНАЛІЗУ
          </td>
        </tr>
        <tr>
          <td style="width: 65%; padding: 10px; font-weight: bold;">Кількість проаналізованих регіонів:</td>
          <td style="width: 35%; text-align: center; padding: 10px; font-weight: bold; font-size: 14px;">${sorted.length}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">Регіон з найвищим потенціалом:</td>
          <td style="text-align: center; padding: 10px;">${topRegion.region} (${topRegion.total_score} балів)</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">Регіон з найнижчим потенціалом:</td>
          <td style="text-align: center; padding: 10px;">${bottomRegion.region} (${bottomRegion.total_score} балів)</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">Середній показник по Україні:</td>
          <td style="text-align: center; padding: 10px; font-weight: bold; font-size: 14px;">${avgScore} балів</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">Регіонів з високим потенціалом (&gt;70):</td>
          <td style="text-align: center; padding: 10px; font-weight: bold;">${sorted.filter(r => r.total_score >= 70).length}</td>
        </tr>
      </table>
      
      <p style="font-size: 11px; text-align: center; margin-top: 100px;">
        Дата формування: ${new Date().toLocaleDateString('uk-UA')}<br/>
        Методологія: 7-факторна модель AHP, версія 1.0
      </p>
    </div>
  `;
}

function generateComparePage2(sorted) {
  return `
    <div class="pdf-page">
      <h2>1. РЕЙТИНГ ОБЛАСТЕЙ ЗА РЕКРЕАЦІЙНИМ ПОТЕНЦІАЛОМ</h2>
      
      <table>
        <tr>
          <th style="width: 8%; text-align: center;">Ранг</th>
          <th style="width: 45%;">Область</th>
          <th style="text-align: center; width: 15%;">Бал</th>
          <th style="text-align: center; width: 32%;">Рекомендація</th>
        </tr>
        ${sorted.map((result, index) => `
          <tr>
            <td style="text-align: center; font-weight: bold;">${index + 1}</td>
            <td>${result.region}</td>
            <td style="text-align: center; font-weight: bold; font-size: 13px;">${result.total_score}</td>
            <td style="text-align: center; font-size: 11px;">
              ${result.total_score >= 70 ? 'Рекомендується' : result.total_score >= 50 ? 'З обережністю' : 'Не рекомендується'}
            </td>
          </tr>
        `).join('')}
      </table>
      
      <h3>1.1. Розподіл регіонів за категоріями</h3>
      <table style="width: 80%;">
        <tr>
          <th>Категорія</th>
          <th style="text-align: center;">Кількість</th>
          <th style="text-align: center;">Частка, %</th>
        </tr>
        <tr>
          <td>Високий потенціал (≥70 балів)</td>
          <td style="text-align: center; font-weight: bold;">${sorted.filter(r => r.total_score >= 70).length}</td>
          <td style="text-align: center;">${((sorted.filter(r => r.total_score >= 70).length / sorted.length) * 100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Середній потенціал (50-69 балів)</td>
          <td style="text-align: center; font-weight: bold;">${sorted.filter(r => r.total_score >= 50 && r.total_score < 70).length}</td>
          <td style="text-align: center;">${((sorted.filter(r => r.total_score >= 50 && r.total_score < 70).length / sorted.length) * 100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td>Низький потенціал (&lt;50 балів)</td>
          <td style="text-align: center; font-weight: bold;">${sorted.filter(r => r.total_score < 50).length}</td>
          <td style="text-align: center;">${((sorted.filter(r => r.total_score < 50).length / sorted.length) * 100).toFixed(1)}%</td>
        </tr>
      </table>
    </div>
  `;
}

function generateComparePage3(sorted) {
  // Розбиваємо фактори на дві сторінки для уникнення розривів
  const factorsPage1 = [
    { key: 'demand_score', name: 'Попит населення', max: 25 },
    { key: 'pfz_score', name: 'ПЗФ атрактор', max: 20 },
    { key: 'nature_score', name: 'Природні ресурси', max: 15 },
    { key: 'accessibility_score', name: 'Транспортна доступність', max: 15 }
  ];
  
  const factorsPage2 = [
    { key: 'infrastructure_score', name: 'Інфраструктура', max: 10 },
    { key: 'fire_score', name: 'Профілактика пожеж', max: 5 },
    { key: 'saturation_penalty', name: 'Штраф насиченості', max: 0, isNegative: true }
  ];
  
  return `
    <div class="pdf-page">
      <h2>2. ПОРІВНЯННЯ ЗА ФАКТОРАМИ (ТОП-5)</h2>
      
      ${factorsPage1.map((factor, idx) => {
        const topByFactor = [...sorted].sort((a, b) => 
          factor.isNegative ? a[factor.key] - b[factor.key] : b[factor.key] - a[factor.key]
        );
        const leader = topByFactor[0];
        
        return `
          <h3 style="margin-top: ${idx > 0 ? '15px' : '10px'};">2.${idx + 1}. ${factor.name}</h3>
          <p style="font-size: 11px; margin: 5px 0;">
            <strong>Лідер:</strong> ${leader.region} (${leader[factor.key]} ${factor.isNegative ? '(найменший штраф)' : 'балів'})
          </p>
          
          <table style="font-size: 10px; margin: 8px 0;">
            <tr>
              <th style="width: 10%;">№</th>
              <th style="width: 60%;">Область</th>
              <th style="text-align: center; width: 30%;">Бал</th>
            </tr>
            ${topByFactor.slice(0, 5).map((result, i) => `
              <tr>
                <td style="text-align: center;">${i + 1}</td>
                <td>${result.region}</td>
                <td style="text-align: center; font-weight: bold;">${result[factor.key]}</td>
              </tr>
            `).join('')}
          </table>
        `;
      }).join('')}
    </div>
    
    <div class="pdf-page">
      <h2>2. ПОРІВНЯННЯ ЗА ФАКТОРАМИ (продовження)</h2>
      
      ${factorsPage2.map((factor, idx) => {
        const topByFactor = [...sorted].sort((a, b) => 
          factor.isNegative ? a[factor.key] - b[factor.key] : b[factor.key] - a[factor.key]
        );
        const leader = topByFactor[0];
        
        return `
          <h3 style="margin-top: ${idx > 0 ? '15px' : '10px'};">2.${idx + 5}. ${factor.name}</h3>
          <p style="font-size: 11px; margin: 5px 0;">
            <strong>Лідер:</strong> ${leader.region} (${leader[factor.key]} ${factor.isNegative ? '(найменший штраф)' : 'балів'})
          </p>
          
          <table style="font-size: 10px; margin: 8px 0;">
            <tr>
              <th style="width: 10%;">№</th>
              <th style="width: 60%;">Область</th>
              <th style="text-align: center; width: 30%;">Бал</th>
            </tr>
            ${topByFactor.slice(0, 5).map((result, i) => `
              <tr>
                <td style="text-align: center;">${i + 1}</td>
                <td>${result.region}</td>
                <td style="text-align: center; font-weight: bold;">${result[factor.key]}</td>
              </tr>
            `).join('')}
          </table>
        `;
      }).join('')}
    </div>
  `;
}

function generateComparePage4(sorted, avgScore) {
  // Розраховуємо потребу в пунктах для кожної області
  const regionsNeedingPoints = sorted.map(r => {
    const gap = r.details?.population?.gap || 0;
    const pointsNeeded = gap > 0 ? Math.ceil(gap / (50 * 180 * 2)) : 0;
    return {
      region: r.region,
      gap: gap,
      pointsNeeded: pointsNeeded,
      score: r.total_score
    };
  }).filter(r => r.pointsNeeded > 0).sort((a, b) => b.pointsNeeded - a.pointsNeeded);
  
  const totalPointsNeeded = regionsNeedingPoints.reduce((sum, r) => sum + r.pointsNeeded, 0);
  
  return `
    <div class="pdf-page">
      <h2>3. ДЕТАЛЬНА СТАТИСТИКА</h2>
      
      <table style="font-size: 10px;">
        <tr>
          <th style="width: 30%;">Область</th>
          <th style="text-align: center; width: 8%;">F1</th>
          <th style="text-align: center; width: 8%;">F2</th>
          <th style="text-align: center; width: 8%;">F3</th>
          <th style="text-align: center; width: 8%;">F4</th>
          <th style="text-align: center; width: 8%;">F5</th>
          <th style="text-align: center; width: 8%;">F6</th>
          <th style="text-align: center; width: 8%;">F7</th>
          <th style="text-align: center; width: 14%; font-weight: bold;">ВСЬОГО</th>
        </tr>
        ${sorted.map(result => `
          <tr>
            <td style="font-size: 10px;">${result.region}</td>
            <td style="text-align: center;">${result.demand_score}</td>
            <td style="text-align: center;">${result.pfz_score}</td>
            <td style="text-align: center;">${result.nature_score}</td>
            <td style="text-align: center;">${result.accessibility_score}</td>
            <td style="text-align: center;">${result.infrastructure_score}</td>
            <td style="text-align: center;">+${result.fire_score || 0}</td>
            <td style="text-align: center;">${result.saturation_penalty}</td>
            <td style="text-align: center; font-weight: bold; font-size: 11px;">${result.total_score}</td>
          </tr>
        `).join('')}
      </table>
    </div>
    
    <div class="pdf-page">
      <h2>4. РЕКОМЕНДАЦІЇ ЩОДО БУДІВНИЦТВА</h2>
      
      <h3>4.1. Загальна потреба в нових рекреаційних пунктах</h3>
      <p style="font-size: 12px; margin: 10px 0;">
        За результатами аналізу потреби та пропозиції рекреаційних послуг у всіх областях України, 
        виявлено необхідність будівництва <strong>${totalPointsNeeded} нових рекреаційних пунктів</strong> 
        для покриття дефіциту попиту.
      </p>
      
      <h3>4.2. Розподіл за областями (області з дефіцитом)</h3>
      ${regionsNeedingPoints.length > 0 ? `
        <table style="font-size: 11px;">
          <tr>
            <th style="width: 5%;">№</th>
            <th style="width: 40%;">Область</th>
            <th style="text-align: center; width: 20%;">Дефіцит відвідувань/рік</th>
            <th style="text-align: center; width: 20%;">Потрібно пунктів</th>
            <th style="text-align: center; width: 15%;">Потенціал</th>
          </tr>
          ${regionsNeedingPoints.map((r, idx) => `
            <tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td><strong>${r.region}</strong></td>
              <td style="text-align: center;">${r.gap.toLocaleString()}</td>
              <td style="text-align: center; font-weight: bold; font-size: 13px;">${r.pointsNeeded}</td>
              <td style="text-align: center;">${r.score} балів</td>
            </tr>
          `).join('')}
          <tr style="border-top: 2px solid #000;">
            <td colspan="3" style="text-align: right; font-weight: bold;">ЗАГАЛЬНА ПОТРЕБА:</td>
            <td style="text-align: center; font-weight: bold; font-size: 14px;">${totalPointsNeeded}</td>
            <td></td>
          </tr>
        </table>
      ` : '<p>Всі області мають достатню пропозицію рекреаційних послуг.</p>'}
      
      <h3>4.3. Висновки</h3>
      <ol style="font-size: 11px; line-height: 1.6;">
        <li>Середній потенціал областей: <strong>${avgScore} балів</strong>.</li>
        <li>Найвищий потенціал: <strong>${sorted[0].region} (${sorted[0].total_score} балів)</strong>.</li>
        <li>Найнижчий потенціал: <strong>${sorted[sorted.length - 1].region} (${sorted[sorted.length - 1].total_score} балів)</strong>.</li>
        <li>Регіонів з високим потенціалом: <strong>${sorted.filter(r => r.total_score >= 70).length} з ${sorted.length}</strong>.</li>
        <li>Областей з дефіцитом рекреаційних послуг: <strong>${regionsNeedingPoints.length}</strong>.</li>
        <li>Загальна потреба в нових пунктах по Україні: <strong>${totalPointsNeeded} об'єктів</strong>.</li>
      </ol>
      
      <p style="text-align: center; margin-top: 30px; font-size: 11px; border-top: 1px solid #000; padding-top: 15px;">
        Кінець звіту | Дата формування: ${new Date().toLocaleDateString('uk-UA')}
      </p>
    </div>
  `;
}
