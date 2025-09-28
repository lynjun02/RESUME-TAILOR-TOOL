import React, { useState } from 'react';
import { ClipboardCheckIcon } from './icons/ClipboardCheckIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

interface FinalResumeDisplayProps {
  resume: string;
  onStartOver: () => void;
}

const FinalResumeDisplay: React.FC<FinalResumeDisplayProps> = ({ resume, onStartOver }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(resume);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Step 4: Your Final Resume</h2>
                <p className="mt-1 text-slate-600">
                    Your tailored resume is ready. You can copy the plain text below to format it in your preferred word processor.
                </p>
            </div>

            <div className="relative">
                <pre
                    className="bg-white border border-slate-200 rounded-lg p-6 text-sm max-h-[70vh] overflow-y-auto whitespace-pre-wrap font-sans"
                >
                    {resume}
                </pre>
                <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-slate-100 transition-colors"
                    aria-label="Copy to clipboard"
                >
                    {copied ? (
                        <ClipboardCheckIcon className="w-5 h-5 text-green-500" />
                    ) : (
                        <ClipboardIcon className="w-5 h-5 text-slate-500" />
                    )}
                </button>
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