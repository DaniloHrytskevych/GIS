// ПРОСТИЙ модуль експорту - БЕЗ складних бібліотек
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Проста функція завантаження blob
export const downloadBlob = (blob, filename) => {
  console.log('📥 Starting download:', filename);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ Download completed:', filename);
  }, 100);
};

// Експорт JSON
export const simpleExportJSON = (data, filename) => {
  try {
    console.log('📝 Creating JSON...');
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, filename);
    return true;
  } catch (error) {
    console.error('❌ JSON export failed:', error);
    alert('Помилка експорту JSON: ' + error.message);
    return false;
  }
};

// Експорт PDF (з HTML контенту)
export const simpleExportPDF = async (htmlContent, filename) => {
  let tempDiv = null;
  try {
    console.log('📄 Creating PDF...');
    
    // Створюємо тимчасовий div
    tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position: absolute; left: -9999px; width: 800px;';
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);
    
    // Конвертуємо в canvas
    const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    
    // Створюємо PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    pdf.addImage(imgData, 'PNG', 0, 10, imgWidth * ratio, imgHeight * ratio);
    
    // ПРОСТИЙ спосіб завантаження PDF
    const pdfBlob = pdf.output('blob');
    downloadBlob(pdfBlob, filename);
    
    return true;
  } catch (error) {
    console.error('❌ PDF export failed:', error);
    alert('Помилка експорту PDF: ' + error.message);
    return false;
  } finally {
    if (tempDiv && tempDiv.parentNode) {
      document.body.removeChild(tempDiv);
    }
  }
};

// Експорт ZIP або будь-якого blob з сервера
export const simpleDownloadFromServer = async (url, filename) => {
  try {
    console.log('🌐 Downloading from server:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    console.log('✅ Received blob:', blob.size, 'bytes');
    downloadBlob(blob, filename);
    return true;
  } catch (error) {
    console.error('❌ Server download failed:', error);
    alert('Помилка завантаження: ' + error.message);
    return false;
  }
};
