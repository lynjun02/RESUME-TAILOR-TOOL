import React, { useState, useEffect } from 'react';
import { AppState, Draft, GroundingSource } from './types';
import { readFilesAsText } from './utils/fileReader';
import { generateInitialResumeDraft, refineResume, changeResumeTone, preprocessText } from './services/geminiService';
import Header from './components/Header';
import ResumeUploader from './components/ResumeUploader';
import JobDescriptionInput from './components/JobDescriptionInput';
import ResumeReviewer, { ConfidenceLevel } from './components/ResumeReviewer';
import FinalResumeDisplay from './components/FinalResumeDisplay';
import ErrorDisplay from './components/ErrorDisplay';
import GenerationLoader from './components/GenerationLoader';
import ApiKeyManager from './components/ApiKeyManager';

/**
 * The main application component.
 * Manages the overall state and flow of the resume tailoring process.
 */
const App: React.FC = () => {
  /** The user's Gemini API key. Null until loaded from localStorage or set by the user. */
  const [apiKey, setApiKey] = useState<string | null>(null);
  /** A history of the user's navigation steps (app states). */
  const [history, setHistory] = useState<AppState[]>([AppState.UPLOAD]);
  /** The user's current position in the navigation history. */
  const [currentStep, setCurrentStep] = useState(0);
  /** The current state of the application, derived from history. */
  const appState = history[currentStep];
  /** An array of the raw text content from the user's uploaded resume files. */
  const [resumeTexts, setResumeTexts] = useState<string[]>([]);
  /** An object holding the generated resume drafts, keyed by confidence level. */
  const [draftResumes, setDraftResumes] = useState<Partial<Record<ConfidenceLevel, Draft>> | null>(null);
  /** The final, accepted resume text. */
  const [finalResume, setFinalResume] = useState<string>('');
  /** A boolean indicating if a primary generation or tone-change process is running. */
  const [isLoading, setIsLoading] = useState<boolean>(false);
  /** A boolean indicating if a refinement process is running. */
  const [isRefining, setIsRefining] = useState<boolean>(false);
  /** A string holding any error message to be displayed to the user. */
  const [error, setError] = useState<string | null>(null);
  /** The last feedback string submitted by the user for refinement. */
  const [lastFeedback, setLastFeedback] = useState('');

  /**
   * Advances the application to a new state and updates the history.
   * @param newState The new AppState to transition to.
   */
  const setStep = (newState: AppState) => {
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
  };

  /** Navigates to the previous step in the history, if available. */
  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  /** Navigates to the next step in the history, if available. */
  const goForward = () => {
    if (currentStep < history.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Effect to load the API key from local storage when the app initializes.
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []); // The empty dependency array ensures this runs only once on mount.

  /**
   * Sets the error state and stops any loading indicators.
   * @param errorMessage The error message to display.
   */
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
    setIsRefining(false);
  };

  /**
   * Handles the processing of uploaded resume files.
   * @param files An array of File objects from the uploader.
   */
  const handleResumesUpload = async (files: File[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const texts = await readFilesAsText(files);
      setResumeTexts(texts);
      setStep(AppState.JOB_DESCRIPTION);
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'An unknown error occurred while reading files.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Creates a callback function for handling streaming AI responses.
   * This updates the draft resume text chunk by chunk.
   * @param tone The confidence level of the draft being generated.
   * @returns A function that takes a string chunk and updates the state.
   */
  const createStreamingCallback = (tone: ConfidenceLevel) => (chunk: string) => {
      setDraftResumes(prev => {
          const currentDraft = prev?.[tone] ?? { text: '' };
          return {
              ...prev,
              [tone]: {
                  ...currentDraft,
                  text: (currentDraft.text || '') + chunk,
              },
          };
      });
  };

  /**
   * Initiates the initial resume draft generation.
   * @param jd The job description string.
   */
  const handleGenerate = async (jd: string) => {
    if (!apiKey) {
      handleError("API Key is not set. Please set it in the settings.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setDraftResumes({ eager: { text: '' } });
    setStep(AppState.GENERATING);
    try {
      const processedJd = await preprocessText(apiKey, jd, 'job-description');
      
      const result = await generateInitialResumeDraft(
        apiKey,
        resumeTexts,
        processedJd,
        createStreamingCallback('eager')
      );
      setDraftResumes({ eager: result });
      setStep(AppState.REVIEW);
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'An unknown error occurred during generation.');
      goBack();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generates a new version of the resume with a different tone.
   * @param tone The new confidence level to apply.
   */
  const handleGenerateTone = async (tone: ConfidenceLevel) => {
    if (!apiKey) {
      handleError("API Key is not set.");
      return;
    }
    if (draftResumes?.[tone] || isLoading) {
      return;
    }

    if (tone === 'eager') {
      console.warn("Attempted to generate 'eager' tone, which is the base tone.");
      return;
    }
    
    const baseDraftText = draftResumes?.eager?.text;
    if (!baseDraftText) {
      handleError("Cannot change tone without a base resume. Please start over.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDraftResumes(prev => ({ ...prev, [tone]: { text: '' } }));
    
    try {
      const result = await changeResumeTone(
        apiKey,
        baseDraftText,
        tone as 'confident' | 'expert',
        createStreamingCallback(tone)
      );
      setDraftResumes(prev => ({ ...prev, [tone]: result }));
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'An error occurred while changing the tone.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initiates the refinement of a resume draft based on user feedback.
   * @param draftToRefine The current text of the draft to be refined.
   * @param feedback The user's feedback text.
   * @param confidence The confidence level of the draft being refined.
   * @param useBestPractices A boolean indicating whether to incorporate best practices.
   */
  const handleRefineResume = async (draftToRefine: string, feedback: string, confidence: ConfidenceLevel, useBestPractices: boolean) => {
    if (!apiKey) {
      handleError("API Key is not set.");
      return;
    }
    setIsLoading(true);
    setIsRefining(true);
    setError(null);
    setLastFeedback(feedback);

    const initialDraftState = draftResumes?.[confidence];
    setDraftResumes(prev => ({
        ...prev,
        [confidence]: {
            ...initialDraftState,
            text: '',
            sources: useBestPractices ? undefined : initialDraftState?.sources,
            changelog: undefined,
        }
    }));

    const onSourcesCallback = (sources: GroundingSource[]) => {
        setDraftResumes(prev => {
            const currentDraft = prev?.[confidence];
            if (!prev || !currentDraft) return prev;
            return {
                ...prev,
                [confidence]: { ...currentDraft, sources: sources }
            };
        });
    };

    const onCompleteCallback = (metadata: { changelog?: string }) => {
        setDraftResumes(prev => {
            const currentDraft = prev?.[confidence];
            if (!prev || !currentDraft) return prev;
            return {
                ...prev,
                [confidence]: { ...currentDraft, changelog: metadata.changelog }
            };
        });
    };

    try {
      let processedFeedback = feedback;
      if (feedback.trim()) {
        processedFeedback = await preprocessText(apiKey, feedback, 'feedback');
      }

      await refineResume(
        apiKey,
        draftToRefine,
        processedFeedback,
        confidence,
        useBestPractices,
        createStreamingCallback(confidence),
        onSourcesCallback,
        onCompleteCallback
      );
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'An error occurred during refinement.');
    } finally {
      setIsLoading(false);
      setIsRefining(false);
    }
  };

  /**
   * Finalizes the resume and moves to the last step.
   * @param acceptedDraft The final draft object.
   */
  const handleAccept = (acceptedDraft: Draft) => {
    setFinalResume(acceptedDraft.text);
    setStep(AppState.FINAL);
  };

  /** Resets the entire application state to the beginning. */
  const handleStartOver = () => {
    setHistory([AppState.UPLOAD]);
    setCurrentStep(0);
    setResumeTexts([]);
    setDraftResumes(null);
    setFinalResume('');
    setError(null);
    setIsLoading(false);
  };

  /**
   * Renders the main content of the application based on the current app state.
   * This acts as a router for the different steps of the process.
   * @returns The React component for the current step.
   */
  const renderContent = () => {
    // If there's no API key, render the ApiKeyManager component first.
    if (!apiKey) {
      return <ApiKeyManager onKeySaved={setApiKey} />;
    }

    switch (appState) {
      case AppState.UPLOAD:
        return <ResumeUploader onResumesUpload={handleResumesUpload} isLoading={isLoading} />;
      case AppState.JOB_DESCRIPTION:
        return <JobDescriptionInput onGenerate={handleGenerate} isLoading={isLoading} />;
      case AppState.GENERATING:
        return <GenerationLoader onCancel={goBack} />;
      case AppState.REVIEW:
        if (!draftResumes) {
            handleStartOver();
            return null;
        }
        return (
          <ResumeReviewer
            draftResumes={draftResumes}
            onAccept={handleAccept}
            onRefine={handleRefineResume}
            onGenerateTone={handleGenerateTone}
            isLoading={isLoading}
            isRefining={isRefining}
            lastFeedback={lastFeedback}
          />
        );
      case AppState.FINAL:
        return <FinalResumeDisplay resume={finalResume} onStartOver={handleStartOver} />;
      default:
        handleStartOver();
        return null;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen font-sans flex flex-col">
      <Header />
      <main className="max-w-4xl mx-auto p-4 md:p-8 w-full flex-grow">
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-lg h-full">
          {error && <ErrorDisplay message={error} onClose={() => setError(null)} />}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={goForward}
              disabled={currentStep >= history.length - 1}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Forward
            </button>
          </div>
          {renderContent()}
        </div>
      </main>
      <footer className="text-center py-4 text-xs text-slate-400">
        Powered by administratorX
      </footer>
    </div>
  );
};

export default App;