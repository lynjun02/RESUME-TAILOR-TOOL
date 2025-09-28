
import React, { useState, useEffect } from 'react';

const MESSAGES = [
  "Pre-processing job description...",
  "Analyzing your provided resumes...",
  "Cross-referencing skills with the job description...",
  "Synthesizing your work history...",
  "Ensuring all content is factually based on your documents...",
  "Drafting the initial version...",
  "Applying professional formatting...",
  "Just a few more moments...",
];

const GenerationLoader: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex(prevIndex => (prevIndex + 1) % MESSAGES.length);
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in text-center">
      <div className="flex items-center justify-center text-slate-700">
        <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 className="text-xl font-semibold">Crafting Your Resume</h2>
      </div>
      <p className="text-slate-500 w-2/3 transition-opacity duration-500">
        {MESSAGES[messageIndex]}
      </p>
    </div>
  );
};

export default GenerationLoader;