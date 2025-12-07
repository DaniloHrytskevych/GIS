/**
 * ПОКРАЩЕНИЙ ПОРІВНЯЛЬНИЙ PDF-ЕКСПОРТ
 * 
 * Більш інформативний ніж попередня версія, але менш детальний ніж індивідуальний звіт
 * Включає:
 * - Титульну сторінку
 * - Підсумкову таблицю з рейтингом
 * - Порівняльні візуалізації по факторах
 * - Короткі висновки та рекомендації
 * 
 * Розмір шрифту: 14px
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportEnhancedComparePDF = async (compareResults, getScoreColor, getCategoryColor) => {
  if (!compareResults || compareResults.length === 0) {
    console.error('❌ No compareResults');
    return;
  }

  let pdfContent = null;
  try {
    console.log('🔍 Starting enhanced compare PDF export...');
    
    // Створюємо тимчасовий div
    pdfContent = document.createElement('div');
    pdfContent.style.cssText = 'position: absolute; left: -9999px; width: 900px; padding: 50px; background: white; font-family: Arial, sans-serif;';
    
    // Генеруємо HTML контент
    pdfContent.innerHTML = generateEnhancedComparePDFContent(compareResults, getScoreColor, getCategoryColor);
    
    document.body.appendChild(pdfContent);
    console.log('✅ Compare content added to DOM');
    
    // Генеруємо PDF
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

function generateEnhancedComparePDFContent(compareResults, getScoreColor, getCategoryColor) {
  // Сортуємо області за балом (від найвищого до найнижчого)
  const sorted = [...compareResults].sort((a, b) => b.total_score - a.total_score);
  
  const topRegion = sorted[0];
  const bottomRegion = sorted[sorted.length - 1];
  
  return `
    <style>
      body { font-size: 14px; line-height: 1.6; color: #1e293b; }
      h1 { font-size: 28px; font-weight: bold; margin: 20px 0; }
      h2 { font-size: 22px; font-weight: bold; margin: 18px 0 12px 0; border-bottom: 3px solid #f59e0b; padding-bottom: 8px; }
      h3 { font-size: 18px; font-weight: bold; margin: 14px 0 10px 0; }
      .page-break { page-break-after: always; height: 1px; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
      th { background: #1e293b; color: white; padding: 12px; text-align: left; border: 1px solid #475569; }
      td { padding: 10px; border: 1px solid #e2e8f0; }
      tr:nth-child(even) { background: #f8fafc; }
      .text-center { text-align: center; }
      .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
      .mb-4 { margin-bottom: 20px; }
    </style>

    <!-- СТОРІНКА 1: ТИТУЛЬНА -->
    <div class="text-center mb-4">
      <h1 style="color: #1e293b; margin-top: 0;">ПОРІВНЯЛЬНИЙ АНАЛІЗ</h1>
      <h2 style="color: #f59e0b; border: none;">РЕКРЕАЦІЙНИЙ ПОТЕНЦІАЛ ОБЛАСТЕЙ УКРАЇНИ</h2>
      <h3 style="color: #475569;">Кількість проаналізованих регіонів: ${compareResults.length}</h3>
      
      <div style="margin: 30px auto; display: flex; justify-content: center; gap: 40px;">
        <div style="text-align: center;">
          <div style="margin: 10px auto; width: 100px; height: 100px; border-radius: 50%; background: ${getScoreColor(topRegion.total_score)}; color: white; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; border: 5px solid #16a34a;">
            ${topRegion.total_score}
          </div>
          <p style="font-size: 14px; margin: 8px 0; font-weight: bold; color: #16a34a;">🏆 ЛІДЕР</p>
          <p style="font-size: 14px; font-weight: bold;">${topRegion.region}</p>
        </div>
        
        <div style="text-align: center;">
          <div style="margin: 10px auto; width: 100px; height: 100px; border-radius: 50%; background: ${getScoreColor(bottomRegion.total_score)}; color: white; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; border: 5px solid #dc2626;">
            ${bottomRegion.total_score}
          </div>
          <p style="font-size: 14px; margin: 8px 0; font-weight: bold; color: #dc2626;">⚠️ НАЙНИЖЧИЙ</p>
          <p style="font-size: 14px; font-weight: bold;">${bottomRegion.region}</p>
        </div>
      </div>
      
      <p style="color: #94a3b8; margin-top: 30px; font-size: 13px;">Згенеровано: ${new Date().toLocaleString('uk-UA')}</p>
      <p style="color: #94a3b8; font-size: 12px;">Версія методології: 1.0 | 7-факторна модель AHP</p>
    </div>
    
    <div class="page-break"></div>

    <!-- СТОРІНКА 2: РЕЙТИНГОВА ТАБЛИЦЯ -->
    <h2>🏆 ЗАГАЛЬНИЙ РЕЙТИНГ ОБЛАСТЕЙ</h2>
    
    <table>
      <tr>
        <th style="width: 50px; text-align: center;">№</th>
        <th style="width: 35%;">Область</th>
        <th style="text-align: center; width: 100px;">Бал</th>
        <th style="text-align: center; width: 120px;">Категорія</th>
        <th style="text-align: center;">Рекомендація</th>
      </tr>
      ${sorted.map((result, index) => {
        const bgColor = index === 0 ? '#dcfce7' : index === sorted.length - 1 ? '#fee2e2' : '#ffffff';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        return `
        <tr style="background: ${bgColor};">
          <td style="text-align: center; font-size: 16px; font-weight: bold;">${medal} ${index + 1}</td>
          <td style="font-weight: bold;">${result.region}</td>
          <td style="text-align: center; font-size: 18px; font-weight: bold; color: ${getScoreColor(result.total_score)};">${result.total_score}</td>
          <td style="text-align: center;">
            <span style="padding: 4px 8px; border-radius: 12px; background: ${getCategoryColor(result.category)}; color: white; font-size: 12px; font-weight: bold;">
              ${result.category}
            </span>
          </td>
          <td style="text-align: center; font-size: 12px;">${result.total_score >= 70 ? '✅ Будувати' : result.total_score >= 50 ? '⚠️ З обережністю' : '❌ Не рекомендується'}</td>
        </tr>
        `;
      }).join('')}
    </table>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">💡 КЛЮЧОВІ ВИСНОВКИ</p>
      <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px;">
        <li><strong>Найвищий потенціал:</strong> ${topRegion.region} (${topRegion.total_score} балів) - ${topRegion.category}</li>
        <li><strong>Найнижчий потенціал:</strong> ${bottomRegion.region} (${bottomRegion.total_score} балів) - ${bottomRegion.category}</li>
        <li><strong>Середній бал по Україні:</strong> ${(sorted.reduce((sum, r) => sum + r.total_score, 0) / sorted.length).toFixed(1)} балів</li>
        <li><strong>Областей з високим потенціалом (&gt;70):</strong> ${sorted.filter(r => r.total_score >= 70).length} з ${sorted.length}</li>
      </ul>
    </div>
    
    <div class="page-break"></div>

    <!-- СТОРІНКА 3: ПОРІВНЯННЯ ПО ФАКТОРАХ -->
    <h2>📊 ПОРІВНЯННЯ ЗА ФАКТОРАМИ</h2>
    
    ${generateFactorComparison(sorted)}
    
    <div class="page-break"></div>

    <!-- СТОРІНКА 4: ДЕТАЛЬНА СТАТИСТИКА -->
    <h2>📈 ДЕТАЛЬНА СТАТИСТИКА ПО ОБЛАСТЯХ</h2>
    
    ${generateDetailedStats(sorted)}
    
    <p style="text-align: center; color: #94a3b8; margin-top: 30px; font-size: 13px; border-top: 2px solid #e2e8f0; padding-top: 15px;">
      <strong>Порівняльний аналіз рекреаційного потенціалу</strong> | © 2024-2025<br/>
      Дата генерації: ${new Date().toLocaleDateString('uk-UA')}
    </p>
  `;
}

function generateFactorComparison(sorted) {
  const factors = [
    { key: 'demand_score', name: 'Попит населення', max: 25, color: '#16a34a' },
    { key: 'pfz_score', name: 'ПЗФ атрактор', max: 20, color: '#059669' },
    { key: 'nature_score', name: 'Природні ресурси', max: 15, color: '#0891b2' },
    { key: 'accessibility_score', name: 'Транспорт', max: 15, color: '#6366f1' },
    { key: 'infrastructure_score', name: 'Інфраструктура', max: 10, color: '#8b5cf6' },
    { key: 'fire_score', name: 'Пожежі (бонус)', max: 5, color: '#f59e0b' },
    { key: 'saturation_penalty', name: 'Насиченість (штраф)', max: 0, color: '#dc2626', isNegative: true }
  ];
  
  return factors.map(factor => {
    const topByFactor = [...sorted].sort((a, b) => 
      factor.isNegative 
        ? a[factor.key] - b[factor.key]  // Для штрафу менше = краще
        : b[factor.key] - a[factor.key]
    );
    const leader = topByFactor[0];
    
    return `
      <div style="background: #f8fafc; padding: 15px; border-left: 4px solid ${factor.color}; margin-bottom: 15px; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: ${factor.color};">${factor.name}</h3>
        <p style="margin: 5px 0; font-size: 13px;">
          <strong>Діапазон балів:</strong> ${factor.isNegative ? '' : '0-'}${factor.max} балів
        </p>
        <p style="margin: 5px 0; font-size: 13px;">
          <strong>Лідер:</strong> <span class="highlight">${leader.region}</span> (${leader[factor.key]} ${factor.isNegative ? '(найменший штраф)' : 'балів'})
        </p>
        <table style="margin-top: 10px; font-size: 12px;">
          <tr>
            <th style="font-size: 12px; padding: 8px;">Область</th>
            <th style="text-align: center; width: 100px; font-size: 12px; padding: 8px;">Бал</th>
            <th style="text-align: center; width: 80px; font-size: 12px; padding: 8px;">%</th>
          </tr>
          ${topByFactor.slice(0, 5).map((result, index) => `
            <tr style="background: ${index === 0 ? '#dcfce7' : '#ffffff'};">
              <td style="padding: 6px; font-size: 12px;">${index + 1}. ${result.region}</td>
              <td style="text-align: center; padding: 6px; font-size: 12px; font-weight: bold; color: ${factor.color};">${result[factor.key]}</td>
              <td style="text-align: center; padding: 6px; font-size: 12px;">${factor.isNegative ? 'N/A' : ((result[factor.key] / factor.max) * 100).toFixed(0) + '%'}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }).join('');
}

function generateDetailedStats(sorted) {
  return `
    <table>
      <tr>
        <th>Область</th>
        <th style="text-align: center; width: 70px;">Попит</th>
        <th style="text-align: center; width: 70px;">ПЗФ</th>
        <th style="text-align: center; width: 70px;">Природа</th>
        <th style="text-align: center; width: 70px;">Транспорт</th>
        <th style="text-align: center; width: 70px;">Інфра</th>
        <th style="text-align: center; width: 70px;">Пожежі</th>
        <th style="text-align: center; width: 70px;">Штраф</th>
        <th style="text-align: center; width: 80px; background: #16a34a; color: white;">Всього</th>
      </tr>
      ${sorted.map((result, index) => {
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        return `
        <tr style="background: ${bgColor};">
          <td style="font-weight: bold; font-size: 12px;">${result.region}</td>
          <td style="text-align: center; font-size: 12px;">${result.demand_score}</td>
          <td style="text-align: center; font-size: 12px;">${result.pfz_score}</td>
          <td style="text-align: center; font-size: 12px;">${result.nature_score}</td>
          <td style="text-align: center; font-size: 12px;">${result.accessibility_score}</td>
          <td style="text-align: center; font-size: 12px;">${result.infrastructure_score}</td>
          <td style="text-align: center; font-size: 12px; color: #f59e0b; font-weight: bold;">+${result.fire_score || 0}</td>
          <td style="text-align: center; font-size: 12px; color: #dc2626; font-weight: bold;">${result.saturation_penalty}</td>
          <td style="text-align: center; font-size: 16px; font-weight: bold; background: ${getScoreColor(result.total_score)}; color: white;">${result.total_score}</td>
        </tr>
        `;
      }).join('')}
    </table>
    
    <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #3b82f6;">
      <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">📊 СТАТИСТИЧНИЙ АНАЛІЗ</p>
      <table style="margin: 10px 0;">
        <tr>
          <th style="background: #3b82f6;">Показник</th>
          <th style="text-align: center; background: #3b82f6;">Мінімум</th>
          <th style="text-align: center; background: #3b82f6;">Максимум</th>
          <th style="text-align: center; background: #3b82f6;">Середнє</th>
        </tr>
        ${generateStatRow('Загальний бал', sorted.map(r => r.total_score))}
        ${generateStatRow('Попит', sorted.map(r => r.demand_score))}
        ${generateStatRow('ПЗФ', sorted.map(r => r.pfz_score))}
        ${generateStatRow('Природа', sorted.map(r => r.nature_score))}
        ${generateStatRow('Транспорт', sorted.map(r => r.accessibility_score))}
        ${generateStatRow('Інфраструктура', sorted.map(r => r.infrastructure_score))}
      </table>
    </div>
  `;
}

function getScoreColor(score) {
  if (score >= 80) return '#16a34a';
  if (score >= 70) return '#84cc16';
  if (score >= 60) return '#facc15';
  if (score >= 50) return '#fb923c';
  return '#ef4444';
}

function generateStatRow(label, values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1);
  
  return `
    <tr>
      <td style="font-weight: bold; font-size: 12px;">${label}</td>
      <td style="text-align: center; font-size: 12px;">${min}</td>
      <td style="text-align: center; font-size: 12px;">${max}</td>
      <td style="text-align: center; font-size: 12px; font-weight: bold;">${avg}</td>
    </tr>
  `;
}

async function generateMultiPagePDF(pdfContent) {
  const canvas = await html2canvas(pdfContent, { 
    scale: 2, 
    useCORS: true,
    logging: false,
    width: 900,
    windowWidth: 900
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
  console.log('✅ Enhanced compare PDF saved successfully');
}
