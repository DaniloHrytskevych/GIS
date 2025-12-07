/**
 * ПРОФЕСІЙНИЙ ПОРІВНЯЛЬНИЙ PDF З ПРАВИЛЬНИМИ РОЗРИВАМИ
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportProfessionalComparePDF = async (compareResults) => {
  if (!compareResults || compareResults.length === 0) {
    console.error('❌ No compareResults');
    return;
  }

  try {
    console.log('🔍 Starting professional compare PDF export...');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const sorted = [...compareResults].sort((a, b) => b.total_score - a.total_score);
    
    // Courier для підтримки кирилиці
    pdf.setFont('courier', 'normal');
    
    generateCompareTitlePage(pdf, sorted);
    
    pdf.addPage();
    generateRankingTable(pdf, sorted);
    
    pdf.addPage();
    generateFactorComparison(pdf, sorted);
    
    pdf.addPage();
    generateDetailedStatistics(pdf, sorted);
    
    // Зберігаємо
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
    
    console.log('✅ Professional compare PDF saved');
    
  } catch (error) {
    console.error('❌ Compare PDF export error:', error);
    alert('Помилка експорту порівняльного PDF: ' + error.message);
  }
};

function generateCompareTitlePage(pdf, sorted) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const topRegion = sorted[0];
  const bottomRegion = sorted[sorted.length - 1];
  const avgScore = (sorted.reduce((sum, r) => sum + r.total_score, 0) / sorted.length).toFixed(1);
  
  pdf.setFontSize(16);
  pdf.setFont('courier', 'bold');
  pdf.text('НАУКОВИЙ ЗВІТ', pageWidth / 2, 40, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('courier', 'normal');
  pdf.text('Порівняльний аналіз рекреаційного потенціалу', pageWidth / 2, 55, { align: 'center' });
  pdf.text('адміністративних областей України', pageWidth / 2, 63, { align: 'center' });
  
  autoTable(pdf, {
    startY: 85,
    head: [['УЗАГАЛЬНЕНІ РЕЗУЛЬТАТИ АНАЛІЗУ']],
    body: [
      ['Кількість проаналізованих регіонів:', sorted.length],
      ['Регіон з найвищим потенціалом:', `${topRegion.region} (${topRegion.total_score} балів)`],
      ['Регіон з найнижчим потенціалом:', `${bottomRegion.region} (${bottomRegion.total_score} балів)`],
      ['Середній показник по Україні:', `${avgScore} балів`],
      ['Регіонів з високим потенціалом (>70):', sorted.filter(r => r.total_score >= 70).length]
    ],
    theme: 'grid',
    styles: { font: 'courier', fontSize: 11 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { halign: 'center', cellWidth: 70, fontStyle: 'bold', fontSize: 12 }
    },
    margin: { left: 20, right: 20 }
  });
  
  pdf.setFontSize(11);
  pdf.setFont('courier', 'normal');
  const footerY = pdf.internal.pageSize.getHeight() - 40;
  pdf.text(`Дата формування: ${new Date().toLocaleDateString('uk-UA')}`, pageWidth / 2, footerY, { align: 'center' });
  pdf.text('Методологія: 7-факторна модель AHP, версія 1.0', pageWidth / 2, footerY + 7, { align: 'center' });
}

function generateRankingTable(pdf, sorted) {
  pdf.setFontSize(14);
  pdf.setFont('courier', 'bold');
  pdf.text('1. РЕЙТИНГ ОБЛАСТЕЙ ЗА РЕКРЕАЦІЙНИМ ПОТЕНЦІАЛОМ', 20, 20);
  
  const bodyData = sorted.map((result, index) => [
    index + 1,
    result.region,
    result.total_score,
    result.category,
    result.total_score >= 70 ? 'Рекомендується' : result.total_score >= 50 ? 'З обережністю' : 'Не рекомендується'
  ]);
  
  autoTable(pdf, {
    startY: 30,
    head: [['Ранг', 'Область', 'Бал', 'Категорія', 'Рекомендація']],
    body: bodyData,
    theme: 'grid',
    styles: { font: 'courier', fontSize: 10 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 60 },
      2: { halign: 'center', cellWidth: 20, fontStyle: 'bold', fontSize: 11 },
      3: { halign: 'center', cellWidth: 45 },
      4: { halign: 'center', cellWidth: 45, fontSize: 9 }
    }
  });
  
  // Розподіл за категоріями
  const lastY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY : 100;
  
  if (lastY > 240) {
    pdf.addPage();
    pdf.setFontSize(13);
    pdf.setFont('courier', 'bold');
    pdf.text('1.1. Розподіл регіонів за категоріями потенціалу', 20, 20);
    
    autoTable(pdf, {
      startY: 28,
      head: [['Категорія', 'Кількість регіонів', 'Частка, %']],
      body: [
        ['Високий потенціал (≥70 балів)', sorted.filter(r => r.total_score >= 70).length, `${((sorted.filter(r => r.total_score >= 70).length / sorted.length) * 100).toFixed(1)}%`],
        ['Середній потенціал (50-69 балів)', sorted.filter(r => r.total_score >= 50 && r.total_score < 70).length, `${((sorted.filter(r => r.total_score >= 50 && r.total_score < 70).length / sorted.length) * 100).toFixed(1)}%`],
        ['Низький потенціал (<50 балів)', sorted.filter(r => r.total_score < 50).length, `${((sorted.filter(r => r.total_score < 50).length / sorted.length) * 100).toFixed(1)}%`]
      ],
      theme: 'grid',
      styles: { font: 'courier', fontSize: 10 },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { halign: 'center', cellWidth: 50, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 40 }
      }
    });
  } else {
    pdf.setFontSize(13);
    pdf.setFont('courier', 'bold');
    pdf.text('1.1. Розподіл регіонів за категоріями потенціалу', 20, lastY + 12);
    
    autoTable(pdf, {
      startY: lastY + 20,
      head: [['Категорія', 'Кількість регіонів', 'Частка, %']],
      body: [
        ['Високий потенціал (≥70 балів)', sorted.filter(r => r.total_score >= 70).length, `${((sorted.filter(r => r.total_score >= 70).length / sorted.length) * 100).toFixed(1)}%`],
        ['Середній потенціал (50-69 балів)', sorted.filter(r => r.total_score >= 50 && r.total_score < 70).length, `${((sorted.filter(r => r.total_score >= 50 && r.total_score < 70).length / sorted.length) * 100).toFixed(1)}%`],
        ['Низький потенціал (<50 балів)', sorted.filter(r => r.total_score < 50).length, `${((sorted.filter(r => r.total_score < 50).length / sorted.length) * 100).toFixed(1)}%`]
      ],
      theme: 'grid',
      styles: { font: 'courier', fontSize: 10 },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { halign: 'center', cellWidth: 50, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 40 }
      }
    });
  }
}

function generateFactorComparison(pdf, sorted) {
  pdf.setFontSize(14);
  pdf.setFont('courier', 'bold');
  pdf.text('2. ПОРІВНЯЛЬНИЙ АНАЛІЗ ЗА ФАКТОРАМИ', 20, 20);
  
  const factors = [
    { key: 'demand_score', name: 'Попит населення', max: 25 },
    { key: 'pfz_score', name: 'ПЗФ атрактор', max: 20 },
    { key: 'nature_score', name: 'Природні ресурси', max: 15 },
    { key: 'accessibility_score', name: 'Транспортна доступність', max: 15 },
    { key: 'infrastructure_score', name: 'Інфраструктура', max: 10 },
    { key: 'fire_score', name: 'Профілактика пожеж', max: 5 },
    { key: 'saturation_penalty', name: 'Штраф насиченості', max: 0, isNegative: true }
  ];
  
  let yPos = 30;
  
  factors.forEach((factor, idx) => {
    const topByFactor = [...sorted].sort((a, b) => 
      factor.isNegative 
        ? a[factor.key] - b[factor.key]
        : b[factor.key] - a[factor.key]
    );
    const leader = topByFactor[0];
    const avgValue = (sorted.reduce((sum, r) => sum + r[factor.key], 0) / sorted.length).toFixed(1);
    
    // Перевірка місця на сторінці
    if (yPos > 230) {
      pdf.addPage();
      yPos = 20;
    }
    
    pdf.setFontSize(13);
    pdf.setFont('courier', 'bold');
    pdf.text(`2.${idx + 1}. ${factor.name}`, 20, yPos);
    yPos += 6;
    
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Діапазон: ${factor.isNegative ? '' : '0-'}${factor.max} балів | Лідер: ${leader.region} (${leader[factor.key]}) | Середнє: ${avgValue}`, 20, yPos);
    yPos += 5;
    
    const top5Data = topByFactor.slice(0, 5).map((result, i) => [
      i + 1,
      result.region,
      result[factor.key],
      factor.isNegative ? '—' : `${((result[factor.key] / factor.max) * 100).toFixed(0)}%`
    ]);
    
    autoTable(pdf, {
      startY: yPos,
      head: [['Ранг', 'Область', 'Бал', '% від макс.']],
      body: top5Data,
      theme: 'grid',
      styles: { font: 'courier', fontSize: 9 },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { cellWidth: 90 },
        2: { halign: 'center', cellWidth: 30, fontStyle: 'bold' },
        3: { halign: 'center', cellWidth: 30 }
      },
      margin: { left: 20, right: 20 }
    });
    
    yPos = (pdf.lastAutoTable && pdf.lastAutoTable.finalY) ? pdf.lastAutoTable.finalY + 8 : yPos + 50;
  });
}

function generateDetailedStatistics(pdf, sorted) {
  pdf.setFontSize(14);
  pdf.setFont('courier', 'bold');
  pdf.text('3. ДЕТАЛЬНА СТАТИСТИКА ПО ОБЛАСТЯХ', 20, 20);
  
  const bodyData = sorted.map(result => [
    result.region,
    result.demand_score,
    result.pfz_score,
    result.nature_score,
    result.accessibility_score,
    result.infrastructure_score,
    `+${result.fire_score || 0}`,
    result.saturation_penalty,
    result.total_score
  ]);
  
  autoTable(pdf, {
    startY: 28,
    head: [['Область', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'ВСЬОГО']],
    body: bodyData,
    theme: 'grid',
    styles: { font: 'courier', fontSize: 9 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { halign: 'center', cellWidth: 15 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'center', cellWidth: 15 },
      5: { halign: 'center', cellWidth: 15 },
      6: { halign: 'center', cellWidth: 15 },
      7: { halign: 'center', cellWidth: 15 },
      8: { halign: 'center', cellWidth: 20, fontStyle: 'bold', fontSize: 10 }
    }
  });
  
  // Статистичні показники
  const statsY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY : 100;
  
  if (statsY > 240) {
    pdf.addPage();
    pdf.setFontSize(13);
    pdf.setFont('courier', 'bold');
    pdf.text('3.1. Статистичні показники по факторах', 20, 20);
    
    generateStatTable(pdf, sorted, 28);
  } else {
    pdf.setFontSize(13);
    pdf.setFont('courier', 'bold');
    pdf.text('3.1. Статистичні показники по факторах', 20, statsY + 12);
    
    generateStatTable(pdf, sorted, statsY + 20);
  }
  
  // Висновки
  const conclusionsY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 12 : 100;
  
  if (conclusionsY > 240) {
    pdf.addPage();
    generateConclusions(pdf, sorted, 20);
  } else {
    generateConclusions(pdf, sorted, conclusionsY);
  }
}

function generateStatTable(pdf, sorted, startY) {
  const factors = [
    { key: 'total_score', name: 'Загальний бал' },
    { key: 'demand_score', name: 'Попит' },
    { key: 'pfz_score', name: 'ПЗФ' },
    { key: 'nature_score', name: 'Природа' },
    { key: 'accessibility_score', name: 'Транспорт' },
    { key: 'infrastructure_score', name: 'Інфраструктура' }
  ];
  
  const bodyData = factors.map(factor => {
    const values = sorted.map(r => r[factor.key]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1);
    const variance = values.reduce((sum, v) => sum + Math.pow(v - parseFloat(avg), 2), 0) / values.length;
    const stdDev = Math.sqrt(variance).toFixed(1);
    
    return [factor.name, min, max, avg, stdDev];
  });
  
  autoTable(pdf, {
    startY: startY,
    head: [['Фактор', 'Мінімум', 'Максимум', 'Середнє', 'Станд. відхилення']],
    body: bodyData,
    theme: 'grid',
    styles: { font: 'courier', fontSize: 10 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'center', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 30, fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 30 }
    }
  });
}

function generateConclusions(pdf, sorted, yPos) {
  pdf.setFontSize(13);
  pdf.setFont('courier', 'bold');
  pdf.text('3.2. Висновки', 20, yPos);
  
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(10);
  
  const conclusions = [
    `1. Середній рекреаційний потенціал областей України становить ${(sorted.reduce((sum, r) => sum + r.total_score, 0) / sorted.length).toFixed(1)} балів.`,
    `2. Найвищий потенціал зафіксовано в ${sorted[0].region} (${sorted[0].total_score} балів).`,
    `3. Найнижчий потенціал в ${sorted[sorted.length - 1].region} (${sorted[sorted.length - 1].total_score} балів).`,
    `4. Регіонів з високим потенціалом (>70 балів): ${sorted.filter(r => r.total_score >= 70).length} з ${sorted.length}.`,
    `5. Регіонів з рекомендацією для будівництва: ${sorted.filter(r => r.total_score >= 70).length}.`
  ];
  
  yPos += 8;
  conclusions.forEach(conclusion => {
    const splitText = pdf.splitTextToSize(conclusion, 170);
    pdf.text(splitText, 20, yPos);
    yPos += (splitText.length * 5) + 2;
  });
  
  // Футер
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(10);
  pdf.text(`Кінець звіту | Дата формування: ${new Date().toLocaleDateString('uk-UA')}`, 105, pageHeight - 15, { align: 'center' });
}
