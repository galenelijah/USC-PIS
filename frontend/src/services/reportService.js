import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import dayjs from 'dayjs';

/**
 * Service to handle clinical report generation and exports (PDF, CSV, Excel)
 */
class ReportService {
  /**
   * Generates a professional PDF report from a DOM element
   * @param {HTMLElement} element - The DOM element to capture
   * @param {string} filename - Output filename
   * @param {Object} options - Configuration options
   */
  async generatePDF(element, filename = 'medical-report.pdf', options = {}) {
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Handle multi-page if necessary (basic implementation)
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(filename);
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Standardized CSV Export
   * @param {Array} data - Array of objects to export
   * @param {string} filename - Output filename
   */
  exportToCSV(data, filename) {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] === null || row[header] === undefined ? '' : row[header];
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    this._downloadFile(csvContent, 'text/csv;charset=utf-8;', filename);
  }

  /**
   * Standardized Excel Export (HTML-based for MS Excel native compatibility)
   * @param {Array} data - Array of objects to export
   * @param {string} filename - Output filename
   */
  exportToExcel(data, filename) {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]);
    let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"></head><body><table>`;
    
    // Add Headers
    tableHtml += '<tr>';
    headers.forEach(header => {
      tableHtml += `<th style="background-color: #003366; color: white;">${header}</th>`;
    });
    tableHtml += '</tr>';

    // Add Rows
    data.forEach(row => {
      tableHtml += '<tr>';
      headers.forEach(header => {
        const value = row[header] === null || row[header] === undefined ? '' : row[header];
        tableHtml += `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
      });
      tableHtml += '</tr>';
    });
    
    tableHtml += '</table></body></html>';

    this._downloadFile(tableHtml, 'application/vnd.ms-excel;charset=utf-8;', filename);
  }

  /**
   * Internal helper to trigger browser download
   */
  _downloadFile(content, type, filename) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Formats clinical data for export based on record type
   * @param {Array} records - Raw clinical records
   * @param {string} type - 'MEDICAL', 'DENTAL', 'FEEDBACK', or 'HISTORY'
   */
  prepareDataForExport(records, type = 'MEDICAL') {
    if (type === 'HISTORY') {
      return records.map(record => ({
        'Date': dayjs(record.visit_date || record.created_at || record.date).format('YYYY-MM-DD'),
        'Patient': record.patient_name || 'N/A',
        'Record Type': record.record_type || 'Consultation',
        'Diagnosis / Purpose': record.diagnosis || record.purpose || record.concern || 'N/A',
        'Status': record.status || record.fitness_status || record.issuance_status || 'Completed',
        'Doctor': record.physician || record.issuing_doctor_name || 'N/A'
      }));
    }

    if (type === 'DENTAL') {
      return records.map(record => ({
        'Date': dayjs(record.visit_date).format('YYYY-MM-DD'),
        'Patient': record.patient_name || 'N/A',
        'USC ID': record.patient_usc_id || 'N/A',
        'Procedure': record.procedure_performed_display || record.procedure_performed || 'N/A',
        'Tooth #': record.tooth_numbers || 'N/A',
        'Diagnosis': record.diagnosis || 'N/A',
        'Referral': record.referral_to || 'N/A',
        'Notes': record.clinical_notes || 'N/A'
      }));
    }

    if (type === 'FEEDBACK') {
      return records.map(record => ({
        'Date': dayjs(record.created_at).format('YYYY-MM-DD'),
        'Rating': `${record.rating} Stars`,
        'Comments': record.comments || 'N/A',
        'Improvement Suggestions': record.improvement || 'N/A',
        'Staff Courteous': record.courteous || 'N/A',
        'Recommend Service': record.recommend || 'N/A'
      }));
    }

    return records.map(record => ({
      'Date': dayjs(record.visit_date).format('YYYY-MM-DD'),
      'Patient': record.patient_name || 'N/A',
      'USC ID': record.patient_usc_id || 'N/A',
      'Diagnosis': record.diagnosis || 'N/A',
      'Treatment': record.treatment || 'N/A',
      'Chief Complaint': record.chief_complaint || 'N/A',
      'Medications': record.medications || 'N/A',
      'BP': record.vital_signs?.blood_pressure || record.blood_pressure || 'N/A',
      'Temp': record.vital_signs?.temperature || record.temperature || 'N/A',
      'Notes': record.notes || 'N/A'
    }));
  }
}

export const reportService = new ReportService();
