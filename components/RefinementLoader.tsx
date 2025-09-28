import React, { useState, useEffect } from 'react';

const MESSAGES = [
  "Interpreting your feedback...",
  "Applying your feedback...",
  "Reviewing for clarity and impact...",
  "Enhancing language and tone...",
  "Finalizing the refined version...",
  "Almost there...",
];

const RefinementLoader: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex(prevIndex => (prevIndex + 1) % MESSAGES.length);
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
        <div className="flex items-center justify-center text-slate-700">
            <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-lg font-semibold">Refining Draft</h3>
        </div>
        <p className="mt-2 text-sm text-slate-500 w-2/3 text-center transition-opacity duration-500">
            {MESSAGES[messageIndex]}
        </p>
    </div>
  );
};

export default RefinementLoader;