
import React, { useState, useCallback } from 'react';
import Spinner from './Spinner';

interface JobDescriptionInputProps {
  onGenerate: (description: string) => void;
  isLoading: boolean;
}

const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ onGenerate, isLoading }) => {
  const [description, setDescription] = useState('');

  const handleGenerate = useCallback(() => {
    onGenerate(description);
  }, [description, onGenerate]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Step 2: Add Job Description</h2>
        <p className="mt-1 text-slate-600">
          Paste the full job description below. The AI will use this to tailor your resume.
        </p>
      </div>
      
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Paste job description here..."
        className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200"
        disabled={isLoading}
      />
      
      <button
        onClick={handleGenerate}
        disabled={isLoading || !description.trim()}
        className="w-full flex justify-center items-center bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? <Spinner /> : 'Generate Tailored Resume'}
      </button>
    </div>
  );
};

export default JobDescriptionInput;
