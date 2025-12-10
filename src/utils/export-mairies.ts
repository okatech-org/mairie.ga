import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Organization } from '@/services/organizationService';

export const exportMairiesToPDF = (mairies: Organization[], title: string = 'Liste des Mairies du Gabon') => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(0, 102, 51); // Gabon green
  doc.text(title, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} - ${mairies.length} mairies`, 14, 28);
  
  // Table data
  const tableData = mairies.map((mairie) => [
    mairie.name,
    mairie.province || '-',
    mairie.departement || '-',
    mairie.population?.toLocaleString() || '-',
    mairie.maire_name || '-',
    mairie.contact_phone || '-',
    mairie.contact_email || '-',
  ]);
  
  autoTable(doc, {
    startY: 35,
    head: [['Mairie', 'Province', 'Département', 'Population', 'Maire', 'Téléphone', 'Email']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 102, 51],
      textColor: 255,
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 35 },
    },
    margin: { top: 35 },
    didDrawPage: (data) => {
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${data.pageNumber}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.text(
        'MAIRIE.GA - Réseau des Mairies du Gabon',
        14,
        doc.internal.pageSize.height - 10
      );
    },
  });
  
  doc.save('mairies-gabon.pdf');
};

export const exportMairiesToExcel = (mairies: Organization[]) => {
  // Create CSV content
  const headers = ['Mairie', 'Province', 'Département', 'Population', 'Maire', 'Téléphone', 'Email', 'Adresse', 'Site Web', 'Latitude', 'Longitude'];
  
  const rows = mairies.map((mairie) => [
    mairie.name,
    mairie.province || '',
    mairie.departement || '',
    mairie.population?.toString() || '',
    mairie.maire_name || '',
    mairie.contact_phone || '',
    mairie.contact_email || '',
    mairie.address || '',
    mairie.website || '',
    mairie.latitude?.toString() || '',
    mairie.longitude?.toString() || '',
  ]);
  
  // Escape CSV values
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');
  
  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'mairies-gabon.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
