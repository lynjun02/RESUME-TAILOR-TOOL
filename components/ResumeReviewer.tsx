import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { Draft, GroundingSource } from '../types';
import { LinkIcon } from './icons/LinkIcon';
import RefinementLoader from './RefinementLoader';

const UndoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);

export type ConfidenceLevel = 'eager' | 'confident' | 'expert';

interface ResumeReviewerProps {
  draftResumes: Partial<Record<ConfidenceLevel, Draft>>;
  onAccept: (finalDraft: Draft) => void;
  onRefine: (draftToRefine: string, feedback: string, confidence: ConfidenceLevel, useBestPractices: boolean) => void;
  onGenerateTone: (tone: ConfidenceLevel) => void;
  isLoading: boolean;
  isRefining: boolean;
}

const TONE_MAP: Record<ConfidenceLevel, string> = {
    eager: 'Eager Learner',
    confident: 'Confident Professional',
    expert: 'Seasoned Expert',
};

const ResumeReviewer: React.FC<ResumeReviewerProps> = ({ draftResumes, onAccept, onRefine, onGenerateTone, isLoading, isRefining }) => {
  const [selectedTone, setSelectedTone] = useState<ConfidenceLevel>('eager');
  const [editableText, setEditableText] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [useBestPractices, setUseBestPractices] = useState(false);
  const [previousDraftText, setPreviousDraftText] = useState<string | null>(null);

  const currentDraft = draftResumes[selectedTone];

  useEffect(() => {
    // This logic handles what to display in the textarea based on the loading state.
    const isGeneratingNewTone = isLoading && !currentDraft?.text;

    if (isGeneratingNewTone) {
        // Display a placeholder message while waiting for the new tone to be generated.
        setEditableText(`Generating the '${TONE_MAP[selectedTone]}' version.\n\nPlease wait a moment...`);
    } else {
        // Sync the editable text area with the current draft's text once it's available or not loading.
        setEditableText(currentDraft?.text ?? '');
    }
  }, [currentDraft, isLoading, selectedTone]);

  const handleAccept = () => {
    if (!currentDraft) return;
    onAccept({ ...currentDraft, text: editableText });
  };

  const handleRefine = () => {
    if (!currentDraft) return;
    setPreviousDraftText(editableText); // Store current text for undo
    onRefine(editableText, feedback, selectedTone, useBestPractices);
    // Reset controls after initiating a refinement.
    setUseBestPractices(false);
    setFeedback('');
  };

  const handleToneChange = (tone: ConfidenceLevel) => {
    setSelectedTone(tone);
    // If the draft for this tone doesn't exist, request it.
    if (!draftResumes[tone]) {
      onGenerateTone(tone);
    }
    setPreviousDraftText(null); // Clear undo state when switching tones
  };
  
  const handleUndo = () => {
    if (previousDraftText !== null) {
        setEditableText(previousDraftText);
        setPreviousDraftText(null); // Only allow one undo per refinement
    }
  };

  const isActivelyLoadingNewTone = isLoading && !currentDraft;
  
  // The Refine button should be disabled if there's no feedback and best practices aren't selected.
  const isRefineDisabled = isLoading || !currentDraft || (!feedback.trim() && !useBestPractices);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Step 3: Review &amp; Refine</h2>
        <p className="mt-1 text-slate-600">
          The AI has generated a draft. Select a tone, provide feedback, and refine until it's perfect.
        </p>
      </div>

      <div className="flex space-x-2 border-b border-slate-200">
        {(Object.keys(TONE_MAP) as ConfidenceLevel[]).map((tone) => (
          <button
            key={tone}
            onClick={() => handleToneChange(tone)}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              selectedTone === tone
                ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {TONE_MAP[tone]}
          </button>
        ))}
      </div>

      <div className="relative">
        <textarea
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            className="w-full h-[50vh] p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 font-mono text-sm"
            disabled={isLoading}
            aria-label="Editable tailored resume in plain text format"
        />
        {isRefining && <RefinementLoader />}
      </div>


      <div className="space-y-4">
        <div className="relative flex items-start">
            <div className="flex h-6 items-center">
                <input
                    id="best-practices"
                    aria-describedby="best-practices-description"
                    name="best-practices"
                    type="checkbox"
                    checked={useBestPractices}
                    onChange={(e) => setUseBestPractices(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
            </div>
            <div className="ml-3 text-sm leading-6">
                <label htmlFor="best-practices" className="font-medium text-slate-900">
                    Incorporate best resume practices
                </label>
                <p id="best-practices-description" className="text-slate-500">
                    Uses Google Search to find and apply the latest resume writing advice.
                </p>
            </div>
        </div>

        {currentDraft?.sources && currentDraft.sources.length > 0 && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2 animate-fade-in">
              <h3 className="text-sm font-semibold text-indigo-800">Best Practices Applied</h3>
              <p className="text-xs text-indigo-700">The resume was refined using insights from the following articles found on Google Search:</p>
              <ul className="space-y-1 pt-1">
                  {currentDraft.sources.map((source, index) => (
                      <li key={index} className="flex items-start space-x-2 text-xs text-slate-600">
                          <LinkIcon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="truncate hover:text-indigo-600 hover:underline" title={source.web.title}>
                              {source.web.title || source.web.uri}
                          </a>
                      </li>
                  ))}
              </ul>
          </div>
        )}

        {currentDraft?.changelog && (
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg space-y-2 animate-fade-in">
                <h3 className="text-sm font-semibold text-slate-700">AI Refinement Log:</h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 font-sans">
                  {currentDraft.changelog
                    .split('\n')
                    .map(line => line.trim().replace(/^-/, '').trim())
                    .filter(line => line)
                    .map((item, index) => (
                        <li key={index}>{item}</li>
                    ))
                  }
                </ul>
            </div>
        )}

        <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-slate-700">
                Provide Feedback (Optional)
            </label>
            <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g., 'Emphasize my experience with Notion more,' or 'Make the summary more concise.'"
                className="mt-1 w-full h-24 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200"
                disabled={isLoading}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
            <button
              onClick={handleRefine}
              disabled={isRefineDisabled}
              className="w-full flex justify-center items-center bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading && !isActivelyLoadingNewTone ? <Spinner /> : 'Refine Resume'}
            </button>
            {previousDraftText !== null && (
                <button
                    onClick={handleUndo}
                    disabled={isLoading}
                    className="p-3 bg-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors animate-fade-in"
                    aria-label="Undo last refinement"
                    title="Undo last refinement"
                >
                    <UndoIcon className="w-6 h-6" />
                </button>
            )}
        </div>
        <button
          onClick={handleAccept}
          disabled={isLoading || !currentDraft}
          className="w-full flex justify-center items-center bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
        >
          Accept and Finalize
        </button>
      </div>
    </div>
  );
};

export default ResumeReviewer;