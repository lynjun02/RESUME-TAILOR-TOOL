import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import jsPDF from 'jspdf';

/**
 * Generates and downloads a .docx file from the given resume text.
 * Applies basic formatting for headings and lists.
 * @param resumeText The plain text of the resume.
 * @param fileName The desired name of the file, without extension.
 */
export const exportToDocx = async (resumeText: string, fileName: string): Promise<void> => {
  const paragraphs: Paragraph[] = resumeText.split('\n').map(line => {
    const trimmedLine = line.trim();
    // Heuristic for identifying a heading: all caps, not empty.
    const isHeading = trimmedLine.toUpperCase() === trimmedLine && trimmedLine.length > 0 && !trimmedLine.includes('  ');

    if (isHeading) {
      return new Paragraph({
        children: [new TextRun({ text: line, bold: true, size: 28 })], // Larger font for headings
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      });
    }

    // Heuristic for identifying a list item: starts with spaces.
    if (line.startsWith('  ')) {
      return new Paragraph({
        text: line.trim(),
        bullet: { level: 0 },
        indent: { left: 720 }, // 0.5 inch indent
      });
    }

    return new Paragraph({
      children: [new TextRun(line)],
      spacing: { after: 100 },
    });
  });

  const doc = new Document({
    sections: [{
      children: paragraphs,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
};

/**
 * Generates and downloads a .pdf file from the resume text.
 * Creates a selectable, text-based PDF with basic formatting.
 * @param resumeText The plain text of the resume.
 * @param fileName The desired name of the file, without extension.
 */
export const exportToPdf = (resumeText: string, fileName: string): void => {
  const doc = new jsPDF();
  const lines = resumeText.split('\n');
  const margin = 15;
  let y = margin;
  const pageHeight = doc.internal.pageSize.height;
  const lineHeight = 7;
  const indent = 10;

  lines.forEach(line => {
    // Add a new page if the content exceeds the current page height
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    const trimmedLine = line.trim();
    const isHeading = trimmedLine.toUpperCase() === trimmedLine && trimmedLine.length > 0 && !trimmedLine.includes('  ');

    let x = margin;
    let textToRender = line;

    if (isHeading) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      y += lineHeight / 2; // Add some space before headings
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
    }

    if (line.startsWith('  ')) {
      x += indent;
      textToRender = `- ${line.trim()}`; // Add a bullet point for indented lines
    }

    doc.text(textToRender, x, y);
    y += lineHeight;

    if (isHeading) {
      y += lineHeight / 2; // Add some space after headings
    }
  });

  doc.save(`${fileName}.pdf`);
};