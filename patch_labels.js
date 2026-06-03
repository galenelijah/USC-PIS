const fs = require('fs');

const helperCode = `
const wrapText = (text, maxLength = 20) => {
  if (!text) return '';
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  words.forEach(word => {
    if ((currentLine + word).length > maxLength) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });
  if (currentLine) lines.push(currentLine.trim());
  return lines;
};
`;

const files = [
  {
    path: 'frontend/src/components/Reports/previews/PatientSummaryPreview.jsx',
    replacements: [
      { old: "labels: data.demographics.colleges.map(c => c.college),", new: "labels: data.demographics.colleges.map(c => wrapText(c.college, 20))," },
      { old: "labels: finalData.map(c => c.name),", new: "labels: finalData.map(c => wrapText(c.name, 20))," },
      { old: "labels: colleges.map(c => c.college || 'Other'),", new: "labels: colleges.map(c => wrapText(c.college || 'Other', 20))," }
    ]
  },
  {
    path: 'frontend/src/components/Reports/previews/CertificationWorkshopPreview.jsx',
    replacements: [
      { old: "labels: dist.map(d => d.name.length > 20 ? d.name.substring(0, 17) + '...' : d.name),", new: "labels: dist.map(d => wrapText(d.name, 20))," }
    ]
  },
  {
    path: 'frontend/src/components/Reports/previews/ClinicalStatsPreview.jsx',
    replacements: [
      { old: "labels: diagnoses.map(d => d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name),", new: "labels: diagnoses.map(d => wrapText(d.name, 20))," },
      { old: "labels: data.clinical.top_diagnoses.map(d => d.name),", new: "labels: data.clinical.top_diagnoses.map(d => wrapText(d.name, 20))," }
    ]
  },
  {
    path: 'frontend/src/components/Reports/previews/DentalStatsPreview.jsx',
    replacements: [
      { old: "labels: procedures.map(p => p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name),", new: "labels: procedures.map(p => wrapText(p.name, 20))," },
      { old: "labels: data.clinical.top_procedures.map(p => p.name),", new: "labels: data.clinical.top_procedures.map(p => wrapText(p.name, 20))," }
    ]
  },
  {
    path: 'frontend/src/components/Reports/HealthCampaign.jsx',
    replacements: [
      { old: "labels: sorted.map(c => c.title.length > 20 ? c.title.substring(0, 17) + '...' : c.title),", new: "labels: sorted.map(c => wrapText(c.title, 25))," }
    ]
  },
  {
    path: 'backend/reports/services.py',
    replacements: [] // Handled separately because it's backend QuickChart
  }
];

files.forEach(f => {
  if(f.path.endsWith('.py')) return;
  let content = fs.readFileSync(f.path, 'utf8');
  
  if (!content.includes('const wrapText')) {
    const importMatch = content.match(/import\s+.*?;?\n/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const splitIndex = content.lastIndexOf(lastImport) + lastImport.length;
      content = content.slice(0, splitIndex) + '\n' + helperCode + '\n' + content.slice(splitIndex);
    }
  }

  f.replacements.forEach(r => {
    content = content.replace(r.old, r.new);
  });

  fs.writeFileSync(f.path, content, 'utf8');
  console.log('Patched ' + f.path);
});