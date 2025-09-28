
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import Spinner from './Spinner';

interface ResumeUploaderProps {
  onResumesUpload: (files: File[]) => void;
  isLoading: boolean;
}

const VALID_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];
const FILE_EXTENSIONS_STRING = '.pdf, .docx, .txt, .md';
const ACCEPTED_MIME_TYPES = 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown';
const MAX_FILES = 10;

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onResumesUpload, isLoading }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    setUploadWarning(null);

    const newFiles = Array.from(selectedFiles);
    const validFilesToAdd: File[] = [];
    const invalidFileNames: string[] = [];

    for (const file of newFiles) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension && VALID_EXTENSIONS.includes(fileExtension)) {
        validFilesToAdd.push(file);
      } else {
        invalidFileNames.push(file.name);
      }
    }
    
    if (invalidFileNames.length > 0) {
        setUploadWarning(`Ignored unsupported files: ${invalidFileNames.join(', ')}. Please use ${FILE_EXTENSIONS_STRING}.`);
    }

    setFiles(prevFiles => {
      const combined = [...prevFiles];
      const existingFileNames = new Set(prevFiles.map(f => f.name));

      for (const file of validFilesToAdd) {
        if (combined.length >= MAX_FILES) {
          setUploadWarning(prevWarning => (prevWarning ? prevWarning + ' ' : '') + `Maximum of ${MAX_FILES} resumes reached.`);
          break;
        }
        if (!existingFileNames.has(file.name)) {
          combined.push(file);
          existingFileNames.add(file.name);
        }
      }
      return combined;
    });
  }, []);

  const handleRemoveFile = (fileName: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    setUploadWarning(null);
  };
  
  const canUploadMore = files.length < MAX_FILES;

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading && canUploadMore) {
        setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!isLoading && canUploadMore) {
        handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (e.target) {
        e.target.value = '';
    }
  };

  const triggerFileSelect = () => {
    if (!isLoading && canUploadMore) {
        fileInputRef.current?.click();
    }
  };

  const handleSubmit = () => {
    if (files.length > 0) {
      onResumesUpload(files);
    }
  };
  
  const dropzoneBaseClasses = 'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors';
  const dropzoneActiveClasses = isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white';
  const dropzoneDisabledClasses = 'cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400';
  const dropzoneEnabledClasses = 'cursor-pointer hover:border-slate-400';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8 p-6 bg-slate-100 rounded-lg border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 text-center mb-4">How It Works</h2>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
          <li>
            <span className="font-semibold">Upload Your Resumes:</span> Provide up to 10 of your past resumes to give the AI context about your experience.
          </li>
          <li>
            <span className="font-semibold">Add the Job Description:</span> Paste the description for the job you're targeting.
          </li>
          <li>
            <span className="font-semibold">Review & Refine:</span> The AI will generate three drafts. You can provide feedback, incorporate best practices, and refine until it's perfect.
          </li>
        </ol>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Step 1: Upload Your Resumes</h2>
        <p className="mt-1 text-slate-600">
          Upload up to {MAX_FILES} of your existing resumes. The AI will use them as a reference.
          Supported formats: {FILE_EXTENSIONS_STRING}.
        </p>
      </div>

      <div
        className={`${dropzoneBaseClasses} ${isLoading || !canUploadMore ? dropzoneDisabledClasses : `${dropzoneEnabledClasses} ${dropzoneActiveClasses}`}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        role="button"
        tabIndex={isLoading || !canUploadMore ? -1 : 0}
        onKeyPress={(e) => e.key === 'Enter' && triggerFileSelect()}
        aria-disabled={isLoading || !canUploadMore}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_MIME_TYPES}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isLoading || !canUploadMore}
        />
        <div className="flex flex-col items-center">
          <UploadIcon className={`w-12 h-12 ${isLoading || !canUploadMore ? 'text-slate-300' : 'text-slate-400'}`} />
          <p className="mt-2 text-sm">
            {canUploadMore ? (
              <>
                <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
              </>
            ) : (
                'Maximum number of files reached'
            )}
          </p>
          <p className="text-xs text-slate-500">
            {canUploadMore ? 'PDF, DOCX, TXT, or MD' : `${MAX_FILES} files selected`}
          </p>
        </div>
      </div>
      
      {uploadWarning && (
        <div className="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200 animate-fade-in">
            {uploadWarning}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-700">Selected Files ({files.length}/{MAX_FILES}):</h3>
          <ul className="space-y-2">
            {files.map(file => (
              <li key={file.name} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-3 truncate">
                  <DocumentIcon className="w-6 h-6 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-800 font-medium truncate" title={file.name}>{file.name}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.name); }}
                  disabled={isLoading}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-50"
                  aria-label={`Remove ${file.name}`}
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isLoading || files.length === 0}
        className="w-full flex justify-center items-center bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? <Spinner /> : 'Next: Add Job Description'}
      </button>
    </div>
  );
};

export default ResumeUploader;
