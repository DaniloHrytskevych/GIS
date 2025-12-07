/**
 * АКАДЕМІЧНИЙ ПОРІВНЯЛЬНИЙ PDF (СТРОГИЙ НАУКОВИЙ СТИЛЬ)
 * 
 * Чорно-білий формат без кольорів та смайлів
 * Академічний шрифт Times New Roman
 * Сухі таблиці та списки
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportAcademicComparePDF = async (compareResults, getScoreColor, getCategoryColor) => {
  if (!compareResults || compareResults.length === 0) {
    console.error('❌ No compareResults');
    return;
  }

  let pdfContent = null;
  try {
    console.log('🔍 Starting academic compare PDF export...');
    
    pdfContent = document.createElement('div');
    pdfContent.style.cssText = 'position: absolute; left: -9999px; width: 800px; padding: 60px; background: white; font-family: "Times New Roman", Times, serif;';
    
    pdfContent.innerHTML = generateAcademicComparePDFContent(compareResults);
    
    document.body.appendChild(pdfContent);
    console.log('✅ Compare content added to DOM');
    
    await generateMultiPagePDF(pdfContent);
    
  } catch (error) {
    console.error('❌ Compare PDF export error:', error);
    alert('Помилка експорту порівняльного PDF: ' + error.message);
  } finally {
    if (pdfContent && pdfContent.parentNode) {
      document.body.removeChild(pdfContent);
      console.log('✅ Compare cleanup completed');
    }
  }
};

function generateAcademicComparePDFContent(compareResults) {
  const sorted = [...compareResults].sort((a, b) => b.total_score - a.total_score);
  
  return `
    <style>
      body { 
        font-size: 12px; 
        line-height: 1.5; 
        color: #000000; 
        font-family: "Times New Roman", Times, serif;
        background: white;
      }
      h1 { 
        font-size: 16px; 
        font-weight: bold; 
        margin: 20px 0; 
        text-align: center; 
        text-transform: uppercase;
      }
      h2 { 
        font-size: 14px; 
        font-weight: bold; 
        margin: 20px 0 12px 0; 
        border-bottom: 2px solid #000000; 
        padding-bottom: 6px;
      }
      h3 { 
        font-size: 13px; 
        font-weight: bold; 
        margin: 15px 0 10px 0;
      }
      .page-break { page-break-after: always; height: 1px; }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 15px 0; 
        font-size: 11px;
        page-break-inside: avoid;
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
        background: white;
      }
      tr:nth-child(even) td { background: #f9f9f9; }
      p { margin: 8px 0; text-align: justify; }
      ul, ol { margin: 10px 0; padding-left: 30px; }
      li { margin: 5px 0; }
      strong { font-weight: bold; }
      .text-center { text-align: center; }
    </style>

    ${generateCompareTitlePage(sorted)}
    
    <div class="page-break"></div>

    ${generateRankingTable(sorted)}
    
    <div class="page-break"></div>

    ${generateFactorComparison(sorted)}
    
    <div class="page-break"></div>

    ${generateDetailedStatistics(sorted)}
  `;
}

function generateCompareTitlePage(sorted) {
  const topRegion = sorted[0];
  const bottomRegion = sorted[sorted.length - 1];
  const avgScore = (sorted.reduce((sum, r) => sum + r.total_score, 0) / sorted.length).toFixed(1);
  
  return `
    <div class="text-center" style="margin-top: 100px;">
      <h1>НАУКОВИЙ ЗВІТ</h1>
      <p style="font-size: 14px; font-weight: bold; margin: 30px 0;">
        Порівняльний аналіз рекреаційного потенціалу<br/>
        адміністративних областей України
      </p>
      
      <table style="width: 80%; margin: 50px auto; border: 2px solid #000000;">
        <tr>
          <td colspan="2" style="text-align: center; padding: 12px; font-weight: bold; border-bottom: 1.5px solid #000000;">
            УЗАГАЛЬНЕНІ РЕЗУЛЬТАТИ АНАЛІЗУ
          </td>
        </tr>
        <tr>
          <td style="width: 60%; padding: 10px; font-weight: bold;">Кількість проаналізованих регіонів:</td>
          <td style="width: 40%; text-align: center; padding: 10px; font-weight: bold;">${sorted.length}</td>
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
          <td style="text-align: center; padding: 10px; font-weight: bold;">${avgScore} балів</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">Регіонів з високим потенціалом (&gt;70):</td>
          <td style="text-align: center; padding: 10px;">${sorted.filter(r => r.total_score >= 70).length}</td>
        </tr>
      </table>
      
      <p style="font-size: 11px; margin-top: 80px;">
        Дата формування: ${new Date().toLocaleDateString('uk-UA')}<br/>
        Методологія: 7-факторна модель AHP, версія 1.0
      </p>
    </div>
  `;
}

function generateRankingTable(sorted) {
  return `
    <h2>1. РЕЙТИНГ ОБЛАСТЕЙ ЗА РЕКРЕАЦІЙНИМ ПОТЕНЦІАЛОМ</h2>
    
    <table>
      <tr>
        <th style="width: 8%; text-align: center;">Ранг</th>
        <th style="width: 37%;">Область</th>
        <th style="width: 12%; text-align: center;">Бал</th>
        <th style="width: 20%; text-align: center;">Категорія</th>
        <th style="width: 23%; text-align: center;">Рекомендація</th>
      </tr>
      ${sorted.map((result, index) => `
        <tr>
          <td style="text-align: center; font-weight: bold;">${index + 1}</td>
          <td>${result.region}</td>
          <td style="text-align: center; font-weight: bold; font-size: 13px;">${result.total_score}</td>
          <td style="text-align: center;">${result.category}</td>
          <td style="text-align: center; font-size: 10px;">
            ${result.total_score >= 70 ? 'Рекомендується' : result.total_score >= 50 ? 'З обережністю' : 'Не рекомендується'}
          </td>
        </tr>
      `).join('')}
    </table>
    
    <h3>1.1. Розподіл регіонів за категоріями потенціалу</h3>
    <table style="width: 70%;">
      <tr>
        <th>Категорія</th>
        <th style="text-align: center;">Кількість регіонів</th>
        <th style="text-align: center;">Частка, %</th>
      </tr>
      <tr>
        <td>Високий потенціал (&ge;70 балів)</td>
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
  `;
}

function generateFactorComparison(sorted) {
  const factors = [
    { key: 'demand_score', name: 'Попит населення', max: 25 },
    { key: 'pfz_score', name: 'ПЗФ атрактор', max: 20 },
    { key: 'nature_score', name: 'Природні ресурси', max: 15 },
    { key: 'accessibility_score', name: 'Транспортна доступність', max: 15 },
    { key: 'infrastructure_score', name: 'Інфраструктура', max: 10 },
    { key: 'fire_score', name: 'Профілактика пожеж', max: 5 },
    { key: 'saturation_penalty', name: 'Штраф насиченості', max: 0, isNegative: true }
  ];
  
  return `
    <h2>2. ПОРІВНЯЛЬНИЙ АНАЛІЗ ЗА ФАКТОРАМИ</h2>
    
    ${factors.map((factor, idx) => {
      const topByFactor = [...sorted].sort((a, b) => 
        factor.isNegative 
          ? a[factor.key] - b[factor.key]
          : b[factor.key] - a[factor.key]
      );
      const leader = topByFactor[0];
      const avgValue = (sorted.reduce((sum, r) => sum + r[factor.key], 0) / sorted.length).toFixed(1);
      
      return `
        <h3>2.${idx + 1}. ${factor.name}</h3>
        <p style="font-size: 11px;">
          <strong>Діапазон балів:</strong> ${factor.isNegative ? '' : '0-'}${factor.max}<br/>
          <strong>Лідер:</strong> ${leader.region} (${leader[factor.key]} ${factor.isNegative ? '(найменший штраф)' : 'балів'})<br/>
          <strong>Середнє значення:</strong> ${avgValue} балів
        </p>
        
        <table style="font-size: 10px;">
          <tr>
            <th style="width: 8%;">Ранг</th>
            <th style="width: 52%;">Область</th>
            <th style="text-align: center; width: 20%;">Бал</th>
            <th style="text-align: center; width: 20%;">% від макс.</th>
          </tr>
          ${topByFactor.slice(0, 5).map((result, i) => `
            <tr>
              <td style="text-align: center;">${i + 1}</td>
              <td>${result.region}</td>
              <td style="text-align: center; font-weight: bold;">${result[factor.key]}</td>
              <td style="text-align: center;">${factor.isNegative ? '—' : ((result[factor.key] / factor.max) * 100).toFixed(0) + '%'}</td>
            </tr>
          `).join('')}
        </table>
      `;
    }).join('')}
  `;
}

function generateDetailedStatistics(sorted) {
  return `
    <h2>3. ДЕТАЛЬНА СТАТИСТИКА ПО ОБЛАСТЯХ</h2>
    
    <table style="font-size: 10px;">
      <tr>
        <th style="width: 24%;">Область</th>
        <th style="text-align: center; width: 9%;">F1<br/>Попит</th>
        <th style="text-align: center; width: 9%;">F2<br/>ПЗФ</th>
        <th style="text-align: center; width: 9%;">F3<br/>Природа</th>
        <th style="text-align: center; width: 9%;">F4<br/>Транспорт</th>
        <th style="text-align: center; width: 9%;">F5<br/>Інфра</th>
        <th style="text-align: center; width: 9%;">F6<br/>Пожежі</th>
        <th style="text-align: center; width: 9%;">F7<br/>Штраф</th>
        <th style="text-align: center; width: 13%; font-weight: bold;">ВСЬОГО</th>
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
    
    <h3>3.1. Статистичні показники по факторах</h3>
    <table>
      <tr>
        <th>Фактор</th>
        <th style="text-align: center;">Мінімум</th>
        <th style="text-align: center;">Максимум</th>
        <th style="text-align: center;">Середнє</th>
        <th style="text-align: center;">Станд. відхилення</th>
      </tr>
      ${generateStatRows(sorted)}
    </table>
    
    <h3>3.2. Висновки</h3>
    <ol style="font-size: 11px;">
      <li>Середній рекреаційний потенціал областей України становить ${(sorted.reduce((sum, r) => sum + r.total_score, 0) / sorted.length).toFixed(1)} балів.</li>
      <li>Найвищий потенціал зафіксовано в ${sorted[0].region} (${sorted[0].total_score} балів).</li>
      <li>Найнижчий потенціал в ${sorted[sorted.length - 1].region} (${sorted[sorted.length - 1].total_score} балів).</li>
      <li>Регіонів з високим потенціалом (&gt;70 балів): ${sorted.filter(r => r.total_score >= 70).length} з ${sorted.length}.</li>
      <li>Регіонів з рекомендацією для будівництва: ${sorted.filter(r => r.total_score >= 70).length}.</li>
    </ol>
    
    <p style="font-size: 10px; text-align: center; margin-top: 40px; border-top: 1px solid #000; padding-top: 15px;">
      Кінець звіту | Дата формування: ${new Date().toLocaleDateString('uk-UA')}
    </p>
  `;
}

function generateStatRows(sorted) {
  const factors = [
    { key: 'total_score', name: 'Загальний бал' },
    { key: 'demand_score', name: 'Попит' },
    { key: 'pfz_score', name: 'ПЗФ' },
    { key: 'nature_score', name: 'Природа' },
    { key: 'accessibility_score', name: 'Транспорт' },
    { key: 'infrastructure_score', name: 'Інфраструктура' }
  ];
  
  return factors.map(factor => {
    const values = sorted.map(r => r[factor.key]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1);
    const variance = values.reduce((sum, v) => sum + Math.pow(v - parseFloat(avg), 2), 0) / values.length;
    const stdDev = Math.sqrt(variance).toFixed(1);
    
    return `
      <tr>
        <td>${factor.name}</td>
        <td style="text-align: center;">${min}</td>
        <td style="text-align: center;">${max}</td>
        <td style="text-align: center; font-weight: bold;">${avg}</td>
        <td style="text-align: center;">${stdDev}</td>
      </tr>
    `;
  }).join('');
}

async function generateMultiPagePDF(pdfContent) {
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
  a.download = `Порівняльний_аналіз_областей.pdf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 250);
  console.log('✅ Academic compare PDF saved successfully');
}
