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

const App: React.FC = () => {
  // Add state for the API key. It's null until loaded from localStorage or set by the user.
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [resumeTexts, setResumeTexts] = useState<string[]>([]);
  const [draftResumes, setDraftResumes] = useState<Partial<Record<ConfidenceLevel, Draft>> | null>(null);
  const [finalResume, setFinalResume] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // useEffect to load the API key from local storage when the app starts.
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []); // The empty dependency array ensures this runs only once on mount.

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
    setIsRefining(false);
  };

  const handleResumesUpload = async (files: File[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const texts = await readFilesAsText(files);
      setResumeTexts(texts);
      setAppState(AppState.JOB_DESCRIPTION);
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'An unknown error occurred while reading files.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleGenerate = async (jd: string) => {
    // Ensure API key exists before making a call.
    if (!apiKey) {
      handleError("API Key is not set. Please set it in the settings.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setDraftResumes({ eager: { text: '' } });
    setAppState(AppState.GENERATING);
    try {
      // Pass the API key to the service function.
      const processedJd = await preprocessText(apiKey, jd, 'job-description');
      
      const result = await generateInitialResumeDraft(
        apiKey, // Pass the key
        resumeTexts,
        processedJd,
        createStreamingCallback('eager')
      );
      setDraftResumes({ eager: result });
      setAppState(AppState.REVIEW);
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'An unknown error occurred during generation.');
      setAppState(AppState.JOB_DESCRIPTION);
    } finally {
      setIsLoading(false);
    }
  };

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
      // Pass the API key
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

  const handleRefineResume = async (draftToRefine: string, feedback: string, confidence: ConfidenceLevel, useBestPractices: boolean) => {
    if (!apiKey) {
      handleError("API Key is not set.");
      return;
    }
    setIsLoading(true);
    setIsRefining(true);
    setError(null);

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
        // Pass the API key
        processedFeedback = await preprocessText(apiKey, feedback, 'feedback');
      }

      // Pass the API key
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


  const handleAccept = (acceptedDraft: Draft) => {
    setFinalResume(acceptedDraft.text);
    setAppState(AppState.FINAL);
  };

  const handleStartOver = () => {
    setAppState(AppState.UPLOAD);
    setResumeTexts([]);
    setDraftResumes(null);
    setFinalResume('');
    setError(null);
    setIsLoading(false);
  };

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
        return <GenerationLoader />;
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
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col">
      <Header />
      <main className="max-w-4xl mx-auto p-4 md:p-8 w-full flex-grow">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg h-full">
          {error && <ErrorDisplay message={error} onClose={() => setError(null)} />}
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