import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import * as XLSX from 'xlsx';
import pptxgen from 'pptxgenjs';

/**
 * Export markdown content to Word (.docx) buffer
 */
export async function exportToDocx({ title, content, author, madrasah }) {
  const lines = content.split('\n');
  const children = [];

  // Header Title
  children.push(
    new Paragraph({
      text: title || 'DOKUMEN PERANGKAT AJAR SIM-GTK',
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: madrasah ? madrasah.nama : 'MAN 2 KABUPATEN GORONTALO', bold: true }),
        new TextRun({ text: author ? ` · Penyusun: ${author}` : '', italics: true })
      ],
      spacing: { after: 300 }
    })
  );

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      children.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      continue;
    }

    if (trimmed.startsWith('# ')) {
      children.push(new Paragraph({ text: trimmed.replace(/^#\s+/, ''), heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
    } else if (trimmed.startsWith('## ')) {
      children.push(new Paragraph({ text: trimmed.replace(/^##\s+/, ''), heading: HeadingLevel.HEADING_2, spacing: { before: 180, after: 100 } }));
    } else if (trimmed.startsWith('### ')) {
      children.push(new Paragraph({ text: trimmed.replace(/^###\s+/, ''), heading: HeadingLevel.HEADING_3, spacing: { before: 140, after: 80 } }));
    } else if (trimmed.startsWith('#### ')) {
      children.push(new Paragraph({ text: trimmed.replace(/^####\s+/, ''), heading: HeadingLevel.HEADING_4, spacing: { before: 100, after: 60 } }));
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      children.push(new Paragraph({ text: trimmed.replace(/^[-*]\s+/, ''), bullet: { level: 0 } }));
    } else if (/^\d+\.\s+/.test(trimmed)) {
      children.push(new Paragraph({ text: trimmed.replace(/^\d+\.\s+/, ''), numbering: { reference: 'default-numbering', level: 0 } }));
    } else {
      children.push(new Paragraph({ text: trimmed.replace(/[*_#]/g, ''), spacing: { after: 100 } }));
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  return await Packer.toBuffer(doc);
}

/**
 * Export table/data to Excel (.xlsx) buffer
 */
export function exportToXlsx({ title, sheetName = 'Perangkat Ajar', rows = [] }) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Export summary to PowerPoint (.pptx) buffer
 */
export async function exportToPptx({ title, subTitle, sections = [] }) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';

  // Slide 1: Cover
  const slideCover = pres.addSlide();
  slideCover.background = { color: '0D3F7C' };
  slideCover.addText(title || 'Perangkat Ajar Kurikulum Merdeka', {
    x: 1, y: 2, w: 11.3, h: 1.5,
    fontSize: 28, color: 'FFFFFF', bold: true, align: 'center'
  });
  slideCover.addText(subTitle || 'SIM-GTK · Kementerian Agama Republik Indonesia', {
    x: 1, y: 3.8, w: 11.3, h: 0.8,
    fontSize: 16, color: '8DC63F', align: 'center'
  });

  // Slide 2..N: Sections
  for (const s of sections) {
    const slide = pres.addSlide();
    slide.addText(s.title || 'Materi Pembelajaran', {
      x: 0.8, y: 0.6, w: 11.5, h: 0.8,
      fontSize: 22, color: '0D3F7C', bold: true
    });
    slide.addText(s.content || '', {
      x: 0.8, y: 1.6, w: 11.5, h: 5,
      fontSize: 14, color: '2B3A4D', lineSpacing: 24
    });
  }

  return await pres.write({ outputType: 'nodebuffer' });
}
