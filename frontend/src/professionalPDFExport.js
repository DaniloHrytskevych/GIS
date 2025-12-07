/**
 * ПРОФЕСІЙНИЙ АКАДЕМІЧНИЙ PDF З ПРАВИЛЬНИМИ РОЗРИВАМИ
 * Використовує jsPDF + jspdf-autotable для коректного розбиття контенту
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportProfessionalPDF = async (analysisResult, getScoreColor, getCategoryColor) => {
  if (!analysisResult) {
    console.error('❌ No analysisResult');
    return;
  }

  try {
    console.log('🔍 Starting professional PDF export...');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const d = analysisResult.details;
    
    // Налаштування шрифтів
    pdf.setFont('times', 'normal');
    
    let currentPage = 1;
    
    // Генеруємо PDF по секціях
    generateTitlePage(pdf, analysisResult);
    
    pdf.addPage();
    currentPage++;
    generateMethodology(pdf);
    
    pdf.addPage();
    currentPage++;
    generateInputData(pdf, analysisResult, d);
    
    pdf.addPage();
    currentPage++;
    generateCalculations(pdf, analysisResult, d);
    
    pdf.addPage();
    currentPage++;
    generateSummary(pdf, analysisResult);
    
    pdf.addPage();
    currentPage++;
    generateConclusions(pdf, analysisResult, d);
    
    pdf.addPage();
    currentPage++;
    generateBibliography(pdf);
    
    // Зберігаємо PDF
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
    
    console.log('✅ Professional PDF saved successfully');
    
  } catch (error) {
    console.error('❌ PDF export error:', error);
    alert('Помилка експорту PDF: ' + error.message);
  }
};

function generateTitlePage(pdf, analysisResult) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Заголовок
  pdf.setFontSize(16);
  pdf.setFont('times', 'bold');
  pdf.text('НАУКОВИЙ ЗВІТ', pageWidth / 2, 40, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('times', 'normal');
  pdf.text('Аналіз рекреаційного потенціалу території', pageWidth / 2, 55, { align: 'center' });
  pdf.text('за методом багатокритеріального прийняття рішень', pageWidth / 2, 63, { align: 'center' });
  
  pdf.setFontSize(13);
  pdf.setFont('times', 'bold');
  pdf.text(`Об'єкт дослідження: ${analysisResult.region}`, pageWidth / 2, 85, { align: 'center' });
  
  // Таблиця з результатами
  autoTable(pdf, {
    startY: 105,
    head: [['РЕЗУЛЬТАТИ ІНТЕГРАЛЬНОЇ ОЦІНКИ']],
    body: [
      ['Інтегральний показник потенціалу:', `${analysisResult.total_score} / 100`],
      ['Категорія потенціалу:', analysisResult.category],
      ['Інвестиційна рекомендація:', analysisResult.total_score >= 70 ? 'Рекомендується' : analysisResult.total_score >= 50 ? 'З обережністю' : 'Не рекомендується']
    ],
    theme: 'grid',
    styles: { 
      font: 'times', 
      fontSize: 11,
      cellPadding: 5
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { halign: 'center', fontStyle: 'bold', fontSize: 12 }
    },
    margin: { left: 30, right: 30 }
  });
  
  // Дата та методологія
  pdf.setFontSize(11);
  pdf.setFont('times', 'normal');
  const footerY = pageHeight - 40;
  pdf.text(`Дата формування: ${new Date().toLocaleDateString('uk-UA')}`, pageWidth / 2, footerY, { align: 'center' });
  pdf.text('Методологія: Analytic Hierarchy Process (AHP), версія 1.0', pageWidth / 2, footerY + 7, { align: 'center' });
  pdf.text('7-факторна модель оцінки рекреаційного потенціалу', pageWidth / 2, footerY + 14, { align: 'center' });
}

function generateMethodology(pdf) {
  pdf.setFontSize(14);
  pdf.setFont('times', 'bold');
  pdf.text('1. МЕТОДОЛОГІЯ ДОСЛІДЖЕННЯ', 20, 20);
  
  pdf.setFontSize(13);
  pdf.text('1.1. Загальна характеристика методу', 20, 32);
  
  pdf.setFontSize(11);
  pdf.setFont('times', 'normal');
  const methodText = 'Для оцінки рекреаційного потенціалу території застосовано метод Analytic Hierarchy Process (AHP), розроблений Томасом Л. Сааті (1980). AHP є систематичним підходом до багатокритеріального прийняття рішень, що дозволяє інтегрувати кількісні та якісні фактори через парне порівняння та визначення вагових коефіцієнтів.';
  const splitText = pdf.splitTextToSize(methodText, 170);
  pdf.text(splitText, 20, 42);
  
  pdf.setFontSize(13);
  pdf.setFont('times', 'bold');
  pdf.text('1.2. Математична модель', 20, 70);
  
  pdf.setFontSize(11);
  pdf.setFont('times', 'normal');
  pdf.text('Інтегральна формула оцінки:', 20, 80);
  
  // Формула в рамці
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.5);
  pdf.rect(20, 85, 170, 15);
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(12);
  pdf.text('I = F₁ + F₂ + F₃ + F₄ + F₅ + F₆ - F₇', 25, 94);
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  const formulaDesc = [
    'де: I - інтегральний показник потенціалу (0-100 балів);',
    '    F₁ - попит населення (0-25 балів, 25%);',
    '    F₂ - природно-заповідний фонд (0-20 балів, 20%);',
    '    F₃ - природні ресурси (0-15 балів, 15%);',
    '    F₄ - транспортна доступність (0-15 балів, 15%);',
    '    F₅ - інфраструктура (0-10 балів, 10%);',
    '    F₆ - профілактика пожеж (0-5 балів, +5%);',
    '    F₇ - штраф за насиченість (0-15 балів, -15%).'
  ];
  let yPos = 108;
  formulaDesc.forEach(line => {
    pdf.text(line, 25, yPos);
    yPos += 5;
  });
  
  // Таблиця факторів
  autoTable(pdf, {
    startY: yPos + 10,
    head: [['№', 'Фактор', 'Вага, %', 'Діапазон', 'Обґрунтування']],
    body: [
      ['1', 'Попит населення', '25', '0-25', 'Економічна основа проекту'],
      ['2', 'Природно-заповідний фонд', '20', '0-20', 'Туристичний атрактор'],
      ['3', 'Природні ресурси', '15', '0-15', 'Естетична цінність'],
      ['4', 'Транспортна доступність', '15', '0-15', 'Критичний бар\'єр доступу'],
      ['5', 'Інфраструктура', '10', '0-10', 'Вторинний фактор'],
      ['6', 'Профілактика пожеж', '+5', '0-5', 'Превентивний бонус'],
      ['7', 'Ринкова насиченість', '-15', '0 до -15', 'Конкурентний штраф']
    ],
    theme: 'grid',
    styles: { font: 'times', fontSize: 10 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 60 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 25 },
      4: { cellWidth: 50 }
    }
  });
}

function generateInputData(pdf, analysisResult, d) {
  pdf.setFontSize(14);
  pdf.setFont('times', 'bold');
  pdf.text('2. ВИХІДНІ ДАНІ ДЛЯ РОЗРАХУНКУ', 20, 20);
  
  let startY = 30;
  
  // 2.1. Демографічні показники
  pdf.setFontSize(13);
  pdf.text('2.1. Демографічні показники', 20, startY);
  
  const demoTable = autoTable(pdf, {
    startY: startY + 5,
    head: [['Показник', 'Значення']],
    body: [
      ['Населення області', `${d?.population?.total?.toLocaleString() || 'н/д'} осіб`],
      ['Густота населення', `${d?.population?.density_per_km2 || 'н/д'} осіб/км²`],
      ['Площа території', `${d?.population?.area_km2?.toLocaleString() || 'н/д'} км²`],
      ['Коефіцієнт рекреаційної активності', '0,15 (15% населення)'],
      ['Середня кількість відвідувань на рік', '3 відвідування/особу']
    ],
    theme: 'grid',
    styles: { font: 'times', fontSize: 10 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: 'right', cellWidth: 70 }
    }
  });
  
  // 2.2. ПЗФ
  pdf.setFontSize(13);
  pdf.setFont('times', 'bold');
  const pfzY = demoTable.finalY + 10;
  pdf.text('2.2. Природно-заповідний фонд', 20, pfzY);
  
  const pfzTable = autoTable(pdf, {
    startY: pfzY + 5,
    head: [['Категорія ПЗФ', 'Кількість']],
    body: [
      ['Національні природні парки (НПП)', `${d?.pfz?.national_parks || 0} од.`],
      ['Природні заповідники', `${d?.pfz?.nature_reserves || 0} од.`],
      ['Регіональні ландшафтні парки (РЛП)', `${d?.pfz?.regional_landscape_parks || 0} од.`],
      ['Заказники', `${d?.pfz?.zakazniks || 0} од.`],
      ['Пам\'ятки природи', `${d?.pfz?.monuments_of_nature || 0} од.`],
      ['Частка території під ПЗФ', `${d?.pfz?.percent_of_region || 0}%`]
    ],
    theme: 'grid',
    styles: { font: 'times', fontSize: 10 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: 'right', cellWidth: 70, fontStyle: 'bold' }
    }
  });
  
  // 2.3-2.7 інші дані (скорочено для економії місця)
  let lastTableY = pfzTable.finalY;
  const tables = [
    {
      title: '2.3. Природні ресурси',
      data: [
        ['Лісистість території', `${d?.nature?.forest_coverage_percent || 0}%`],
        ['Наявність водних об\'єктів', d?.nature?.has_water_bodies ? 'Так' : 'Ні']
      ]
    },
    {
      title: '2.4. Транспортна доступність',
      data: [
        ['Щільність автомобільних доріг', `${d?.transport?.highway_density || 0} км/100 км²`],
        ['Залізничні станції', `${d?.transport?.railway_stations || 0} од.`],
        ['Аеропорти', `${d?.transport?.airports || 0} од.`]
      ]
    },
    {
      title: '2.5. Інфраструктура',
      data: [
        ['Лікарні на 100 тис. населення', d?.infrastructure?.hospitals_per_100k?.toFixed(1) || 0],
        ['АЗС на 100 км²', d?.infrastructure?.gas_stations_per_100km2?.toFixed(2) || 0],
        ['Готелі (всього)', `${d?.infrastructure?.hotels_total || 0} од.`],
        ['Покриття мобільним зв\'язком', `${d?.infrastructure?.mobile_coverage_percent || 0}%`]
      ]
    },
    {
      title: '2.6. Дані про лісові пожежі',
      data: [
        ['Загальна кількість пожеж (2025)', `${d?.fires?.total_fires || 0} випадків`],
        ['Спричинені людським фактором', `${d?.fires?.human_caused_fires || 0} випадків`]
      ]
    },
    {
      title: '2.7. Ринкова насиченість',
      data: [
        ['Існуючі рекреаційні пункти', `${d?.saturation?.existing_points || 0} од.`],
        ['Щільність на 1000 км²', d?.saturation?.density_per_1000km2?.toFixed(2) || 0]
      ]
    }
  ];
  
  tables.forEach(table => {
    // Перевірка чи достатньо місця на сторінці
    if (lastTableY > 240) {
      pdf.addPage();
      pdf.setFontSize(13);
      pdf.setFont('times', 'bold');
      pdf.text(table.title, 20, 20);
      
      const newTable = autoTable(pdf, {
        startY: 25,
        head: [['Показник', 'Значення']],
        body: table.data,
        theme: 'grid',
        styles: { font: 'times', fontSize: 10 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { halign: 'right', cellWidth: 70, fontStyle: table.title.includes('2.6') ? 'bold' : 'normal' }
        }
      });
      lastTableY = newTable.finalY;
    } else {
      pdf.setFontSize(13);
      pdf.setFont('times', 'bold');
      pdf.text(table.title, 20, lastTableY + 10);
      
      const newTable = autoTable(pdf, {
        startY: lastTableY + 15,
        head: [['Показник', 'Значення']],
        body: table.data,
        theme: 'grid',
        styles: { font: 'times', fontSize: 10 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { halign: 'right', cellWidth: 70, fontStyle: table.title.includes('2.6') ? 'bold' : 'normal' }
        }
      });
      lastTableY = newTable.finalY;
    }
  });
}

function generateCalculations(pdf, analysisResult, d) {
  pdf.setFontSize(14);
  pdf.setFont('times', 'bold');
  pdf.text('3. ПОКРОКОВІ РОЗРАХУНКИ ФАКТОРІВ', 20, 20);
  
  let yPos = 30;
  
  // ФАКТОР 1: Попит
  pdf.setFontSize(13);
  pdf.text('3.1. Фактор 1: Попит населення (0-25 балів)', 20, yPos);
  yPos += 10;
  
  pdf.setFontSize(11);
  pdf.setFont('times', 'bold');
  pdf.text('Крок 1. Розрахунок річного попиту', 20, yPos);
  yPos += 6;
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  pdf.text('Формула:', 20, yPos);
  yPos += 5;
  
  pdf.rect(20, yPos, 170, 8);
  pdf.setFont('courier', 'normal');
  pdf.text('Річний попит = Населення × 0,15 × 3', 25, yPos + 5);
  yPos += 10;
  
  pdf.setFont('times', 'normal');
  pdf.text(`Підставлення: ${d?.population?.total?.toLocaleString() || 'н/д'} × 0,15 × 3 = ${d?.population?.annual_demand?.toLocaleString() || 'н/д'} відвідувань/рік`, 20, yPos);
  yPos += 6;
  
  pdf.setFont('times', 'bold');
  pdf.text(`Результат: ${d?.population?.annual_demand?.toLocaleString() || 'н/д'} відвідувань/рік`, 20, yPos);
  yPos += 10;
  
  // Крок 2
  pdf.text('Крок 2. Оцінка існуючої пропозиції', 20, yPos);
  yPos += 6;
  
  pdf.setFont('times', 'normal');
  pdf.text('Формула:', 20, yPos);
  yPos += 5;
  
  pdf.rect(20, yPos, 170, 8);
  pdf.setFont('courier', 'normal');
  pdf.text('Річна пропозиція = Пункти × 50 × 180 × 2', 25, yPos + 5);
  yPos += 10;
  
  pdf.setFont('times', 'normal');
  pdf.text(`Підставлення: ${d?.saturation?.existing_points || 0} × 50 × 180 × 2 = ${d?.population?.annual_supply?.toLocaleString() || 'н/д'} місць/рік`, 20, yPos);
  yPos += 6;
  
  pdf.setFont('times', 'bold');
  pdf.text(`Результат: ${d?.population?.annual_supply?.toLocaleString() || 'н/д'} місць/рік`, 20, yPos);
  yPos += 10;
  
  // Крок 3
  pdf.text('Крок 3. Співвідношення пропозиції/попиту', 20, yPos);
  yPos += 6;
  
  pdf.setFont('times', 'normal');
  pdf.text(`Співвідношення = ${d?.population?.supply_demand_ratio?.toFixed(3) || 'н/д'}`, 20, yPos);
  yPos += 5;
  pdf.text(`Дефіцит/Профіцит = ${Math.abs(d?.population?.gap || 0).toLocaleString()} відвідувань`, 20, yPos);
  yPos += 10;
  
  // Крок 4
  pdf.setFont('times', 'bold');
  pdf.text('Крок 4. Нормалізація до шкали 0-25 балів', 20, yPos);
  yPos += 6;
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  const scales = [
    '• Співвідношення < 0,6 (дефіцит >40%): 25 балів',
    '• Співвідношення 0,6-0,8 (дефіцит 20-40%): 20 балів',
    '• Співвідношення 0,8-1,0 (баланс): 15 балів',
    '• Співвідношення 1,0-1,5 (надлишок 0-50%): 10 балів',
    '• Співвідношення > 1,5 (надлишок >50%): 0 балів'
  ];
  scales.forEach(line => {
    pdf.text(line, 25, yPos);
    yPos += 4;
  });
  
  yPos += 3;
  pdf.setFontSize(11);
  pdf.setFont('times', 'bold');
  pdf.rect(20, yPos, 170, 8);
  pdf.text(`ФІНАЛЬНИЙ БАЛ: ${analysisResult.demand_score}/25`, 25, yPos + 5);
  yPos += 15;
  
  // Нова сторінка для інших факторів
  pdf.addPage();
  yPos = 20;
  
  // ФАКТОР 2: ПЗФ
  pdf.setFontSize(13);
  pdf.setFont('times', 'bold');
  pdf.text('3.2. Фактор 2: Природно-заповідний фонд (0-20 балів)', 20, yPos);
  yPos += 10;
  
  pdf.setFontSize(11);
  pdf.text('Розрахунок з ваговими коефіцієнтами', 20, yPos);
  yPos += 6;
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  pdf.text('Формула:', 20, yPos);
  yPos += 5;
  
  pdf.rect(20, yPos, 170, 8);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(9);
  pdf.text('Бал = НПП×2,0 + Заповідники×1,5 + РЛП×1,0 + Заказники×0,1 + Пам\'ятки×0,05', 25, yPos + 5);
  yPos += 10;
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  pdf.text('Підставлення:', 20, yPos);
  yPos += 5;
  pdf.text(`${d?.pfz?.national_parks || 0}×2,0 + ${d?.pfz?.nature_reserves || 0}×1,5 + ${d?.pfz?.regional_landscape_parks || 0}×1,0 + ${d?.pfz?.zakazniks || 0}×0,1 + ${d?.pfz?.monuments_of_nature || 0}×0,05`, 20, yPos);
  yPos += 10;
  
  pdf.setFontSize(11);
  pdf.setFont('times', 'bold');
  pdf.rect(20, yPos, 170, 8);
  pdf.text(`ФІНАЛЬНИЙ БАЛ: ${analysisResult.pfz_score}/20`, 25, yPos + 5);
  yPos += 15;
  
  // ФАКТОР 3: Природа
  pdf.setFontSize(13);
  pdf.text('3.3. Фактор 3: Природні ресурси (0-15 балів)', 20, yPos);
  yPos += 10;
  
  pdf.setFontSize(11);
  pdf.text('Компонент А: Лісове покриття (0-11 балів)', 20, yPos);
  yPos += 6;
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  pdf.text('Формула:', 20, yPos);
  yPos += 5;
  
  pdf.rect(20, yPos, 170, 8);
  pdf.setFont('courier', 'normal');
  pdf.text('Бал = Лісистість(%) × 0,275', 25, yPos + 5);
  yPos += 10;
  
  pdf.setFont('times', 'normal');
  pdf.text(`Підставлення: ${d?.nature?.forest_coverage_percent || 0}% × 0,275 = ${((d?.nature?.forest_coverage_percent || 0) * 0.275).toFixed(2)} балів`, 20, yPos);
  yPos += 8;
  
  pdf.setFont('times', 'bold');
  pdf.text('Компонент Б: Водні об\'єкти (0-4 бали)', 20, yPos);
  yPos += 6;
  
  pdf.setFont('times', 'normal');
  pdf.text(`Наявність: ${d?.nature?.has_water_bodies ? '4 бали' : '0 балів'}`, 20, yPos);
  yPos += 10;
  
  pdf.setFont('times', 'bold');
  pdf.rect(20, yPos, 170, 8);
  pdf.text(`ФІНАЛЬНИЙ БАЛ: ${analysisResult.nature_score}/15`, 25, yPos + 5);
  yPos += 15;
  
  // ФАКТОР 4: Транспорт (додаємо формулу!)
  pdf.setFontSize(13);
  pdf.text('3.4. Фактор 4: Транспортна доступність (0-15 балів)', 20, yPos);
  yPos += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('times', 'normal');
  pdf.text('Формула (композитна оцінка):', 20, yPos);
  yPos += 5;
  
  pdf.rect(20, yPos, 170, 15);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(9);
  pdf.text('Бал = min(Щільність_доріг/50, 10) + min(Залізниці/20, 3) +', 25, yPos + 5);
  pdf.text('      min(Міжнародні_траси×0,8, 3) + (Аеропорт ? 1 : 0)', 25, yPos + 10);
  yPos += 18;
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Вхідні дані: щільність ${d?.transport?.highway_density || 0} км/100км², залізниця ${d?.transport?.railway_stations || 0} ст., аеропорти ${d?.transport?.airports || 0}`, 20, yPos);
  yPos += 8;
  
  pdf.setFont('times', 'bold');
  pdf.rect(20, yPos, 170, 8);
  pdf.text(`ФІНАЛЬНИЙ БАЛ: ${analysisResult.accessibility_score}/15`, 25, yPos + 5);
  yPos += 15;
  
  // Перевірка місця і нова сторінка якщо потрібно
  if (yPos > 230) {
    pdf.addPage();
    yPos = 20;
  }
  
  // ФАКТОР 5: Інфраструктура (додаємо формулу!)
  pdf.setFontSize(13);
  pdf.setFont('times', 'bold');
  pdf.text('3.5. Фактор 5: Інфраструктура (0-10 балів)', 20, yPos);
  yPos += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('times', 'normal');
  pdf.text('Формула (композитна оцінка):', 20, yPos);
  yPos += 5;
  
  pdf.rect(20, yPos, 170, 15);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(9);
  pdf.text('Бал = min(Лікарні_100k/2, 3) + min(АЗС_100км²×2, 2) +', 25, yPos + 5);
  pdf.text('      min(Мобільний_зв\'язок/25, 2) + min(Готелі/50, 2) + 1', 25, yPos + 10);
  yPos += 18;
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  pdf.text('Оцінка медицини, АЗС, зв\'язку, готелів, електрифікації', 20, yPos);
  yPos += 8;
  
  pdf.setFont('times', 'bold');
  pdf.rect(20, yPos, 170, 8);
  pdf.text(`ФІНАЛЬНИЙ БАЛ: ${analysisResult.infrastructure_score}/10`, 25, yPos + 5);
  yPos += 15;
  
  // ФАКТОР 6: Пожежі
  pdf.setFontSize(13);
  pdf.text('3.6. Фактор 6: Профілактика лісових пожеж (0-5 балів)', 20, yPos);
  yPos += 10;
  
  pdf.setFontSize(11);
  pdf.text('Шкала оцінювання:', 20, yPos);
  yPos += 6;
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  const fireScales = [
    '• ≥15 людських пожеж: 5 балів (критична потреба)',
    '• 10-14 людських пожеж: 3 бали (висока потреба)',
    '• 5-9 людських пожеж: 1 бал (помірна потреба)',
    '• <5 людських пожеж: 0 балів'
  ];
  fireScales.forEach(line => {
    pdf.text(line, 25, yPos);
    yPos += 4;
  });
  
  yPos += 3;
  pdf.setFontSize(10);
  pdf.text(`Дані: людських пожеж у регіоні: ${d?.fires?.human_caused_fires || 0}`, 20, yPos);
  yPos += 8;
  
  pdf.setFontSize(11);
  pdf.setFont('times', 'bold');
  pdf.rect(20, yPos, 170, 8);
  pdf.text(`ФІНАЛЬНИЙ БАЛ: +${analysisResult.fire_score || 0}/5`, 25, yPos + 5);
  yPos += 15;
  
  // ФАКТОР 7: Насиченість (додаємо формулу!)
  pdf.setFontSize(13);
  pdf.text('3.7. Фактор 7: Штраф за ринкову насиченість (0 до -15)', 20, yPos);
  yPos += 10;
  
  pdf.setFontSize(11);
  pdf.text('Прогресивна шкала штрафів:', 20, yPos);
  yPos += 6;
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  const satScales = [
    '• Щільність <1,0 пункт/1000км²: -2 бали',
    '• Щільність 1,0-2,0 пункти/1000км²: -5 балів',
    '• Щільність 2,0-3,0 пункти/1000км²: -10 балів',
    '• Щільність >3,0 пункти/1000км²: -15 балів'
  ];
  satScales.forEach(line => {
    pdf.text(line, 25, yPos);
    yPos += 4;
  });
  
  yPos += 3;
  pdf.setFontSize(10);
  pdf.text(`Дані: щільність ${d?.saturation?.density_per_1000km2?.toFixed(2) || 0} пунктів/1000км²`, 20, yPos);
  yPos += 8;
  
  pdf.setFontSize(11);
  pdf.setFont('times', 'bold');
  pdf.rect(20, yPos, 170, 8);
  pdf.text(`ФІНАЛЬНИЙ ШТРАФ: ${analysisResult.saturation_penalty}/0`, 25, yPos + 5);
}

function generateSummary(pdf, analysisResult) {
  pdf.setFontSize(14);
  pdf.setFont('times', 'bold');
  pdf.text('4. ПІДСУМКОВА ТАБЛИЦЯ РЕЗУЛЬТАТІВ', 20, 20);
  
  autoTable(pdf, {
    startY: 30,
    head: [['№', 'Фактор', 'Отримано', 'Максимум', 'Виконання, %']],
    body: [
      ['1', 'Попит населення', analysisResult.demand_score, 25, `${((analysisResult.demand_score / 25) * 100).toFixed(0)}%`],
      ['2', 'Природно-заповідний фонд', analysisResult.pfz_score, 20, `${((analysisResult.pfz_score / 20) * 100).toFixed(0)}%`],
      ['3', 'Природні ресурси', analysisResult.nature_score, 15, `${((analysisResult.nature_score / 15) * 100).toFixed(0)}%`],
      ['4', 'Транспортна доступність', analysisResult.accessibility_score, 15, `${((analysisResult.accessibility_score / 15) * 100).toFixed(0)}%`],
      ['5', 'Інфраструктура', analysisResult.infrastructure_score, 10, `${((analysisResult.infrastructure_score / 10) * 100).toFixed(0)}%`],
      ['6', 'Профілактика пожеж (бонус)', `+${analysisResult.fire_score || 0}`, 5, `${(((analysisResult.fire_score || 0) / 5) * 100).toFixed(0)}%`],
      ['7', 'Штраф за насиченість', analysisResult.saturation_penalty, '-15', `${((Math.abs(analysisResult.saturation_penalty) / 15) * 100).toFixed(0)}%`]
    ],
    foot: [[{ content: 'ІНТЕГРАЛЬНИЙ ПОКАЗНИК:', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } }, 
            { content: analysisResult.total_score, styles: { fontStyle: 'bold', fontSize: 14, halign: 'center' } }, 
            { content: '100', styles: { fontStyle: 'bold', halign: 'center' } },
            { content: `${analysisResult.total_score}%`, styles: { fontStyle: 'bold', halign: 'center' } }]],
    theme: 'grid',
    styles: { font: 'times', fontSize: 10 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
    footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.5, lineColor: [0, 0, 0] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 85 },
      2: { halign: 'center', cellWidth: 25, fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 30 }
    }
  });
}

function generateConclusions(pdf, analysisResult, d) {
  const shouldBuild = d?.investment?.should_build;
  
  pdf.setFontSize(14);
  pdf.setFont('times', 'bold');
  pdf.text('5. ВИСНОВКИ ТА РЕКОМЕНДАЦІЇ', 20, 20);
  
  pdf.setFontSize(13);
  pdf.text('5.1. Загальна оцінка потенціалу', 20, 35);
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  const conclusionText = `За результатами комплексної оцінки рекреаційного потенціалу території ${analysisResult.region} отримано інтегральний показник ${analysisResult.total_score} балів зі 100 можливих, що відповідає категорії "${analysisResult.category}".`;
  const splitConclusion = pdf.splitTextToSize(conclusionText, 170);
  pdf.text(splitConclusion, 20, 45);
  
  pdf.setFontSize(13);
  pdf.setFont('times', 'bold');
  pdf.text('5.2. Інвестиційна рекомендація', 20, 65);
  
  pdf.setDrawColor(0);
  pdf.setLineWidth(1);
  pdf.rect(20, 72, 170, 15);
  pdf.setFontSize(12);
  pdf.text(shouldBuild ? 'РЕКОМЕНДУЄТЬСЯ БУДІВНИЦТВО РЕКРЕАЦІЙНИХ ОБ\'ЄКТІВ' : 'БУДІВНИЦТВО РИЗИКОВАНЕ', 105, 80, { align: 'center' });
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  const recText = pdf.splitTextToSize(analysisResult.recommendation, 170);
  pdf.text(recText, 20, 95);
  
  // Таблиця попиту
  autoTable(pdf, {
    startY: 115,
    head: [['Показник', 'Значення']],
    body: [
      ['Річний попит на рекреацію', `${d?.population?.annual_demand?.toLocaleString() || 'н/д'} відвідувань`],
      ['Річна пропозиція (поточна)', `${d?.population?.annual_supply?.toLocaleString() || 'н/д'} місць`],
      ['Дефіцит/Профіцит', `${d?.population?.gap > 0 ? '+' : ''}${(d?.population?.gap || 0).toLocaleString()} відвідувань`],
      ['Потрібно об\'єктів для покриття дефіциту', `${d?.population?.gap > 0 ? Math.ceil((d?.population?.gap || 0) / (50 * 180 * 2)) : 0} пунктів`]
    ],
    theme: 'grid',
    styles: { font: 'times', fontSize: 10 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'bold' },
      1: { halign: 'right', cellWidth: 70, fontStyle: 'bold' }
    }
  });
}

function generateBibliography(pdf) {
  pdf.setFontSize(14);
  pdf.setFont('times', 'bold');
  pdf.text('6. БІБЛІОГРАФІЧНИЙ СПИСОК', 20, 20);
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  
  const bibliography = [
    '1. Saaty T. L. The Analytic Hierarchy Process: Planning, Priority Setting, Resource Allocation. New York: McGraw-Hill, 1980. 287 p.',
    '2. Kentucky State Comprehensive Outdoor Recreation Plan 2020-2025. Kentucky Department of Parks, 2020.',
    '3. District of Columbia State Comprehensive Outdoor Recreation Plan 2020. DC Department of Parks and Recreation, 2020.',
    '4. Gigović L., Pamučar D., Bajić Z., Drobnjak S. Application of GIS-Interval Rough AHP Methodology for Flood Hazard Mapping in Urban Areas. Water, 2017. Vol. 9(6). P. 360.',
    '5. Liu J., Deng Y., Wang Y., Huang H., Du Q., Ren F. Urban Livability and Tourism Development in China: Analysis of Sustainable Development by Means of Spatial Panel Data. Habitat International, 2017. Vol. 68. P. 99-107.',
    '6. Bunruamkaew K., Murayama Y. Site Suitability Evaluation for Ecotourism Using GIS & AHP: A Case Study of Surat Thani Province, Thailand. Procedia - Social and Behavioral Sciences, 2011. Vol. 21. P. 269-278.',
    '7. Northwest Fire Science Consortium. Human and Climatic Influences on Fire Occurrence in the United States. 2020.',
    '8. Laguna Hills Community Recreation Assessment. City of Laguna Hills Parks and Recreation Department, 2021.',
    '9. Закон України "Про природно-заповідний фонд України" від 16 червня 1992 року № 2456-XII (зі змінами та доповненнями).',
    '10. Державна служба статистики України. Статистична інформація. URL: http://www.ukrstat.gov.ua (дата звернення: 2024).'
  ];
  
  let yPos = 35;
  bibliography.forEach(ref => {
    const splitRef = pdf.splitTextToSize(ref, 170);
    
    // Перевірка чи достатньо місця
    if (yPos + (splitRef.length * 5) > 270) {
      pdf.addPage();
      yPos = 20;
    }
    
    pdf.text(splitRef, 20, yPos);
    yPos += (splitRef.length * 5) + 3;
  });
  
  // Кінцівка
  pdf.setFontSize(10);
  pdf.text(`Кінець звіту | Дата формування: ${new Date().toLocaleDateString('uk-UA')}`, 105, 280, { align: 'center' });
}
