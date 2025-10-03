
import React, { useState, useCallback } from 'react';
import Spinner from './Spinner';

interface JobDescriptionInputProps {
  onGenerate: (description: string) => void;
  isLoading: boolean;
}

const MIN_DESC_LENGTH = 50; // Minimum characters for the job description

const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ onGenerate, isLoading }) => {
  const [description, setDescription] = useState('');

  const handleGenerate = useCallback(() => {
    if (description.trim().length >= MIN_DESC_LENGTH) {
      onGenerate(description);
    }
  }, [description, onGenerate]);

  const isButtonDisabled = isLoading || description.trim().length < MIN_DESC_LENGTH;
  const charsRemaining = MIN_DESC_LENGTH - description.trim().length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Step 2: Add Job Description</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Paste the full job description below. The AI will use this to tailor your resume.
        </p>
      </div>
      
      <div className="relative">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Paste job description here..."
          className="w-full h-64 p-4 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 bg-white dark:bg-slate-800"
          disabled={isLoading}
          aria-describedby="char-count"
        />
        {description.trim().length < MIN_DESC_LENGTH && (
            <p id="char-count" className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Please enter at least {charsRemaining} more character{charsRemaining !== 1 ? 's' : ''}.
            </p>
        )}
      </div>
      
      <button
        onClick={handleGenerate}
        disabled={isButtonDisabled}
        className="w-full flex justify-center items-center bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors dark:disabled:bg-indigo-800"
      >
        {isLoading ? <Spinner /> : 'Generate Tailored Resume'}
      </button>
    </div>
  );
};

export default JobDescriptionInput;
