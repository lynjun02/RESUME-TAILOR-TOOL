import React from 'react';
import { changelogData } from './changelogData';

interface ChangelogModalProps {
  onClose: () => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3 mb-4 dark:border-slate-700">
          <h2 className="text-2xl font-bold">Changelog - v{changelogData.version}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-2xl font-bold">&times;</button>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          {changelogData.groups.map((group) => (
            group.changes.length > 0 && (
              <div key={group.title} className="mb-4">
                <h3 className="font-semibold text-lg mb-2 border-b dark:border-slate-700 pb-2">{group.title}</h3>
                <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
                  {group.changes.map((item, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  ))}
                </ul>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;