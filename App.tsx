import React, { useState } from 'react';
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

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [resumeTexts, setResumeTexts] = useState<string[]>([]);
  const [draftResumes, setDraftResumes] = useState<Partial<Record<ConfidenceLevel, Draft>> | null>(null);
  const [finalResume, setFinalResume] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    setIsLoading(true);
    setError(null);
    setDraftResumes({ eager: { text: '' } }); // Initialize for EAGER tone
    setAppState(AppState.GENERATING);
    try {
      // Pre-process the job description for conciseness and cost-saving.
      const processedJd = await preprocessText(jd, 'job-description');
      
      const result = await generateInitialResumeDraft(
        resumeTexts, // Use the raw array of resume texts directly.
        processedJd, // Use the processed, cleaner job description.
        createStreamingCallback('eager')
      );
      setDraftResumes({ eager: result });
      setAppState(AppState.REVIEW); // Transition on success
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'An unknown error occurred during generation.');
      setAppState(AppState.JOB_DESCRIPTION); // Go back on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTone = async (tone: ConfidenceLevel) => {
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
    setDraftResumes(prev => ({ ...prev, [tone]: { text: '' } })); // Initialize for streaming
    
    try {
      const result = await changeResumeTone(
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
    setIsLoading(true);
    setIsRefining(true);
    setError(null);

    const initialDraftState = draftResumes?.[confidence];
    setDraftResumes(prev => ({
        ...prev,
        [confidence]: {
            ...initialDraftState,
            text: '', // Clear text for streaming
            sources: useBestPractices ? undefined : initialDraftState?.sources, // Clear sources only if we're fetching new ones
            changelog: undefined, // Clear old changelog
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
        processedFeedback = await preprocessText(feedback, 'feedback');
      }

      await refineResume(
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