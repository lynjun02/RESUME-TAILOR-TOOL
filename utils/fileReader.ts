import * as pdfjsLib from 'pdfjs-dist';

// The mammoth.js library is loaded via a <script> tag in index.html, which creates a global 'mammoth' object.
// We declare it here to inform TypeScript of its existence and provide type information.
declare const mammoth: {
    extractRawText: (options: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
};

// Set worker source for pdf.js to enable parallel processing and avoid blocking the main thread.
// @ts-ignore - pdfjsLib types may not be fully available in this context.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.mjs';

const readPdfText = async (data: ArrayBuffer): Promise<string> => {
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const numPages = pdf.numPages;
    const pageTexts = [];
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
        pageTexts.push(pageText);
    }
    return pageTexts.join('\n\n');
};

export const readFilesAsText = (files: File[]): Promise<string[]> => {
    const promises = files.map(file => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            const fileExtension = file.name.split('.').pop()?.toLowerCase();

            reader.onload = async () => {
                try {
                    switch (fileExtension) {
                        case 'docx':
                            if (reader.result instanceof ArrayBuffer) {
                                // Access the global 'mammoth' object provided by the script loaded from the CDN.
                                const result = await mammoth.extractRawText({ arrayBuffer: reader.result });
                                resolve(result.value);
                            } else {
                                reject(new Error(`Failed to read DOCX file: ${file.name} as ArrayBuffer.`));
                            }
                            break;
                        
                        case 'pdf':
                            if (reader.result instanceof ArrayBuffer) {
                                const text = await readPdfText(reader.result);
                                resolve(text);
                            } else {
                                reject(new Error(`Failed to read PDF file: ${file.name} as ArrayBuffer.`));
                            }
                            break;

                        case 'txt':
                        case 'md':
                            if (typeof reader.result === 'string') {
                                resolve(reader.result);
                            } else {
                                reject(new Error(`Failed to read text file: ${file.name} as string.`));
                            }
                            break;

                        default:
                            // This case should ideally not be reached due to the check below, but serves as a fallback.
                            reject(new Error(`Unsupported file type: ${file.name}`));
                    }
                } catch (err) {
                    console.error(`Error processing file ${file.name}:`, err);
                    reject(new Error(`Failed to process file content for: ${file.name}. It might be corrupted or in an unsupported format.`));
                }
            };

            reader.onerror = () => {
                reject(new Error(`Failed to read file: ${file.name}`));
            };

            if (fileExtension === 'docx' || fileExtension === 'pdf') {
                reader.readAsArrayBuffer(file);
            } else if (fileExtension === 'txt' || fileExtension === 'md') {
                reader.readAsText(file);
            } else {
                // Reject unsupported files immediately to provide fast feedback.
                reject(new Error(`Unsupported file type: .${fileExtension}. Please upload .txt, .md, .docx, or .pdf files.`));
            }
        });
    });
    return Promise.all(promises);
};