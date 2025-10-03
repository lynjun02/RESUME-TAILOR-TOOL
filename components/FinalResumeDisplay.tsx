import React, { useState } from 'react';
import { ClipboardCheckIcon } from './icons/ClipboardCheckIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { PdfIcon } from './icons/PdfIcon';
import { DocxIcon } from './icons/DocxIcon';
import { exportToDocx, exportToPdf } from '../utils/exportResume';

interface FinalResumeDisplayProps {
  resume: string;
  onStartOver: () => void;
}

const FinalResumeDisplay: React.FC<FinalResumeDisplayProps> = ({ resume, onStartOver }) => {
    const [copied, setCopied] = useState(false);
    const [fileName, setFileName] = useState('resume');

    const handleCopy = () => {
        navigator.clipboard.writeText(resume);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportPdf = () => {
        exportToPdf(resume, fileName || 'resume');
    };

    const handleExportDocx = () => {
        exportToDocx(resume, fileName || 'resume');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Step 4: Your Final Resume</h2>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                    Your tailored resume is ready. You can copy the text, or export it as a PDF or DOCX file.
                </p>
            </div>

            <div className="relative">
                <pre
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-sm max-h-[60vh] overflow-y-auto whitespace-pre-wrap font-sans"
                >
                    {resume}
                </pre>
                <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 bg-white dark:bg-slate-700 p-2 rounded-full shadow-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    aria-label="Copy to clipboard"
                >
                    {copied ? (
                        <ClipboardCheckIcon className="w-5 h-5 text-green-500" />
                    ) : (
                        <ClipboardIcon className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                    )}
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="fileName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Export Filename
                    </label>
                    <input
                        type="text"
                        id="fileName"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800"
                        placeholder="e.g., resume-for-google"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={handleExportPdf}
                        className="flex justify-center items-center gap-2 bg-red-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-red-700 transition-colors"
                    >
                        <PdfIcon className="w-5 h-5" />
                        Export as PDF
                    </button>
                    <button
                        onClick={handleExportDocx}
                        className="flex justify-center items-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                    >
                        <DocxIcon className="w-5 h-5" />
                        Export as DOCX
                    </button>
                </div>
            </div>
            
            <button
                onClick={onStartOver}
                className="w-full flex justify-center items-center gap-2 bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-slate-700 transition-colors"
            >
                <ArrowPathIcon className="w-5 h-5" />
                Start Over
            </button>
        </div>
    );
};

export default FinalResumeDisplay;