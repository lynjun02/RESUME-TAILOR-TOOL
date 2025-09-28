
import React, { useState, useEffect } from 'react';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { UsersIcon } from './icons/UsersIcon';

const Header: React.FC = () => {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  useEffect(() => {
    // This is a simple, privacy-friendly counter.
    // The key 'ai-resume-tailor-visits' is unique to this app.
    fetch('https://api.countapi.xyz/hit/ai-resume-tailor/visits')
      .then(response => response.json())
      .then(data => {
        setVisitorCount(data.value);
      })
      .catch(() => {
        // If the counter fails, we just won't show it.
        // No need to show an error to the user.
        setVisitorCount(null);
      });
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-10 border-b border-slate-200">
      <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <DocumentTextIcon className="w-8 h-8 text-indigo-600"/>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            AI Resume Tailor
          </h1>
        </div>
        {visitorCount !== null && (
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <UsersIcon className="w-5 h-5" />
            <span>{visitorCount.toLocaleString()} Visitors</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;