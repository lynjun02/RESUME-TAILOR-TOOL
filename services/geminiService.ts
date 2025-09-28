import { GoogleGenAI } from "@google/genai";
import { ConfidenceLevel } from '../components/ResumeReviewer';
import { Draft, GroundingSource } from '../types';
import { formatAIResponse } from '../utils/formatAIResponse';

// Initialize the Gemini client. The instructions state to assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// A more robust retry strategy to handle high traffic and transient API errors.
const MAX_RETRIES = 7;
const INITIAL_BACKOFF_MS = 2000; // Start with a 2-second delay
const MAX_BACKOFF_MS = 30000; // Cap backoff at 30 seconds

/**
 * Safely extracts an error message from a caught exception.
 * @param error The caught exception, which can be of any type.
 * @returns A string representing the error message.
 */
const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    // Handle cases where the error is an object with a 'message' property
    if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
        return (error as { message: string }).message;
    }
    try {
        return JSON.stringify(error);
    } catch {
        return 'An unknown error occurred.';
    }
};


/**
 * A utility function to retry an async operation with exponential backoff and jitter.
 * This is useful for handling rate-limiting and other transient server errors.
 * @param apiCall The async function to call.
 * @returns The result of the successful API call.
 */
async function withRetry<T>(apiCall: () => Promise<T>): Promise<T> {
  let lastError: unknown = null;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await apiCall();
    } catch (error: unknown) {
      lastError = error;
      const errorMessage = getErrorMessage(error);
      
      const isRetryableError = (
          errorMessage.includes('429') || 
          errorMessage.includes('500') || 
          errorMessage.includes('503') || 
          errorMessage.toUpperCase().includes('SERVICE UNAVAILABLE') || 
          errorMessage.toUpperCase().includes('RESOURCE_EXHAUSTED') || 
          errorMessage.toUpperCase().includes('RATE LIMIT')
      );

      if (isRetryableError && i < MAX_RETRIES - 1) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, i);
        const delay = Math.min(backoff, MAX_BACKOFF_MS) + Math.random() * 1000;
        console.warn(`A retryable API error occurred. Retrying in ${(delay / 1000).toFixed(1)}s... (Attempt ${i + 2}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw lastError || new Error('Request failed after multiple retries.');
}

const preprocessPrompt = (text: string, context: 'job-description' | 'feedback'): string => {
    if (context === 'job-description') {
        return `
ROLE: Text Pre-processor for an AI Resume Writer.
TASK: Analyze the following "Job Description" and extract ONLY the essential information relevant for tailoring a resume.

**INSTRUCTIONS:**
1.  **Extract Core Content:** Focus exclusively on responsibilities, required skills (technical and soft), qualifications, and experience level.
2.  **Remove Boilerplate:** Aggressively remove all corporate fluff, "About Us" sections, marketing language, benefits descriptions, and legal disclaimers (e.g., EEO statements).
3.  **Preserve Key Terms:** Do not alter key technical terms, tool names, or specific qualifications.
4.  **Output:** Return only the cleaned, concise, and relevant text. If the input is already concise and free of boilerplate, return it as is.

---
**Job Description:**
${text}
---

Provide the cleaned text now.
`;
    }
    // context === 'feedback'
    return `
ROLE: Text Pre-processor for an AI Resume Editor.
TASK: Clarify and distill the user's "Feedback" to make it as direct as possible for the editor AI.

**INSTRUCTIONS:**
1.  **Clarify Intent:** Rephrase ambiguous statements into clear, actionable commands.
2.  **Correct Errors:** Fix any obvious typos or grammatical mistakes.
3.  **Maintain Core Request:** Do not add new ideas or change the user's fundamental request.
4.  **Output:** Return only the refined feedback. If the feedback is already perfectly clear, return it as is.

---
**Feedback:**
${text}
---

Provide the refined feedback now.
`;
};

/**
 * Pre-processes text by sending it to the AI for cleaning and summarization to reduce token count.
 */
export const preprocessText = async (text: string, context: 'job-description' | 'feedback'): Promise<string> => {
    // If the text is very short, no need to preprocess.
    if (text.trim().length < 50) {
        return text;
    }

    try {
        const response = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: preprocessPrompt(text, context),
            config: { temperature: 0.1 }, // Low temperature for deterministic cleaning
        }));

        const processedText = response.text.trim();
        // Return the processed text only if the AI returned something meaningful
        return processedText || text;
    } catch (error) {
        console.warn(`Text pre-processing failed for context '${context}'. Falling back to original text.`, error);
        // On failure, just return the original text to not break the flow.
        return text;
    }
};

const generateInitialDraftPrompt = (resumeTexts: string[], jd: string) => `
ROLE: Expert resume writer.
TASK: Create a tailored resume using ONLY the "Consolidated Resume Source" as the source of truth.
TONE: Eager Learner (emphasize potential, learning, and enthusiasm).

**PRIMARY DIRECTIVE: NO FABRICATION**
- You MUST NOT invent, embellish, or assume any skills, experiences, or dates. Every single point in the generated resume must be directly verifiable from the provided "Consolidated Resume Source". This is the most critical instruction.

**MANDATORY FORMATTING RULES (NON-NEGOTIABLE):**
- **Plain Text Only:** The entire output must be plain UTF-8 text.
- **No Markdown:** You MUST NOT use any markdown formatting. This includes but is not limited to: asterisks for bolding (\`**text**\`), asterisks for lists (\`* item\`), hyphens for lists (\`- item\`), underscores for italics (\`_text_\`), or any other markdown syntax.
- **Indented Lists:** For any list (like skills or job responsibilities), every item MUST start on a new line and be indented with exactly two spaces. Do not use any bullet characters.

**INSTRUCTIONS:**
1.  **Analyze Source:** Review the consolidated resume to understand the candidate's full history.
2.  **Align with Job Description:** Prioritize skills and experiences from the source resume that are most relevant to the "Job Description".
3.  **Skills Section Logic (Strictly Enforced):**
    -   First, identify skills explicitly listed in the "Consolidated Resume Source" that are relevant to the "Job Description". Rephrase these to tailor them.
    -   Second, if direct skills are limited, analyze work experiences in the source to infer transferable skills (e.g., "managed a project" implies 'Project Management') or soft skills (e.g., "trained new hires" implies 'Mentorship' and 'Communication').
    -   Third, if no relevant skills can be directly found or reasonably inferred, DO NOT invent a skills section or populate it with generic skills. It is better to have an empty skills section than a fabricated one.

---
**Consolidated Resume Source:**
${resumeTexts.map((r, i) => `--- RESUME ${i + 1} ---\n${r}`).join('\n\n')}

---
**Job Description:**
${jd}
---

Generate the resume now.
`;

/**
 * Generates one resume draft ('eager') with streaming.
 */
export const generateInitialResumeDraft = async (
    resumeTexts: string[],
    jobDescription: string,
    onChunk: (chunk: string) => void
): Promise<Draft> => {
    const prompt = generateInitialDraftPrompt(resumeTexts, jobDescription);

    try {
        const streamResponse = await withRetry(() => ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.5,
            },
        }));

        let fullRawText = '';
        let lastSentFormattedText = '';

        for await (const chunk of streamResponse) {
            const rawChunk = chunk.text;
            if (rawChunk) {
                fullRawText += rawChunk;
                const formattedText = formatAIResponse(fullRawText);

                if (formattedText.length > lastSentFormattedText.length) {
                    const newFormattedChunk = formattedText.substring(lastSentFormattedText.length);
                    onChunk(newFormattedChunk);
                    lastSentFormattedText = formattedText;
                }
            }
        }
        
        const finalFormattedText = formatAIResponse(fullRawText.trim());
        if (!finalFormattedText) {
             throw new Error("The AI returned an empty response. Please try again.");
        }

        return { text: finalFormattedText };

    } catch (error) {
        console.error("Error generating initial resume draft:", error);
        const errorMessage = getErrorMessage(error);
        if (errorMessage.includes('429') || errorMessage.toUpperCase().includes('RESOURCE_EXHAUSTED')) {
            throw new Error("The AI service is currently experiencing high traffic. Please try again in a few moments.");
        }
        throw new Error("Failed to generate the resume draft from the AI. The service may be temporarily unavailable.");
    }
};


const changeTonePrompt = (resumeText: string, tone: 'confident' | 'expert') => `
ROLE: Resume editor.
TASK: Rewrite the "Current Resume" to adopt the specified "Requested Tone".

**PRIMARY DIRECTIVE: FACTUAL INTEGRITY**
- You MUST NOT add, remove, or alter any facts (skills, jobs, dates, accomplishments). Your sole purpose is to change the wording to match the tone.

**MANDATORY FORMATTING RULES (NON-NEGOTIABLE):**
- **Plain Text Only:** The entire output must be plain UTF-8 text.
- **No Markdown:** You MUST NOT use any markdown formatting. This includes but is not limited to: asterisks for bolding (\`**text**\`), asterisks for lists (\`* item\`), hyphens for lists (\`- item\`), underscores for italics (\`_text_\`), or any other markdown syntax.
- **Indented Lists:** For any list (like skills or job responsibilities), every item MUST start on a new line and be indented with exactly two spaces. Do not use any bullet characters.

**REQUESTED TONE: "${tone}"**
- **confident:** Standard professional, self-assured language.
- **expert:** Authoritative language focusing on high-level achievements and impact.

**INSTRUCTIONS:**
1.  Preserve the original structure.
2.  Output only the rewritten, full resume text.

---
**Current Resume:**
${resumeText}
---

Rewrite the resume in the "${tone}" tone now.
`;


/**
 * Changes the tone of a given resume draft with streaming.
 */
export const changeResumeTone = async (
    baseResumeText: string,
    tone: 'confident' | 'expert',
    onChunk: (chunk: string) => void
): Promise<Draft> => {
    const prompt = changeTonePrompt(baseResumeText, tone);
    try {
        const streamResponse = await withRetry(() => ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
             config: {
                temperature: 0.6,
            },
        }));

        let fullRawText = '';
        let lastSentFormattedText = '';
        
        for await (const chunk of streamResponse) {
            const rawChunk = chunk.text;
            if (rawChunk) {
                fullRawText += rawChunk;
                const formattedText = formatAIResponse(fullRawText);

                if (formattedText.length > lastSentFormattedText.length) {
                    const newFormattedChunk = formattedText.substring(lastSentFormattedText.length);
                    onChunk(newFormattedChunk);
                    lastSentFormattedText = formattedText;
                }
            }
        }
        
        const finalFormattedText = formatAIResponse(fullRawText.trim());
        if (!finalFormattedText) {
             throw new Error("The AI returned an empty response while changing tone. Please try again.");
        }
        return { text: finalFormattedText };

    } catch (error) {
        console.error("Error changing resume tone:", error);
        const errorMessage = getErrorMessage(error);
        if (errorMessage.includes('429')) {
            throw new Error("The AI service is currently busy. Please try again in a moment.");
        }
        throw new Error("Failed to change the resume tone. The AI service may be temporarily unavailable.");
    }
};

/**
 * A dedicated function to fetch best practices using Google Search.
 * This decouples source fetching from the main text generation, making it more reliable.
 */
const fetchBestPractices = async (): Promise<{ sources: GroundingSource[], practicesText: string }> => {
    const prompt = "Summarize the top 5-7 modern resume best practices for clarity, impact, and ATS optimization.";
    
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        }
    }));

    const practicesText = response.text.trim();
    const allSources: GroundingSource[] = [];

    if (response.candidates) {
        for (const candidate of response.candidates) {
            const sources = candidate.groundingMetadata?.groundingChunks as GroundingSource[] | undefined;
            if (sources) {
                allSources.push(...sources);
            }
        }
    }
    const uniqueSources = Array.from(new Map(allSources.map(s => [s.web.uri, s])).values());
    
    return { sources: uniqueSources.filter(s => s.web?.uri), practicesText };
};


const refineResumePrompt = (draft: string, feedback: string, confidence: ConfidenceLevel, bestPracticesText: string, changelogDelimiter: string) => {
    const feedbackSection = feedback.trim() === ''
        ? 'General review for clarity, impact, and tone consistency.'
        : feedback;

    const bestPracticesSection = bestPracticesText.trim() === ''
        ? '' // Don't include the section if there are no practices
        : `---
**Resume Best Practices to Incorporate:**
${bestPracticesText}
---`;

    return `
ROLE: Expert resume editor.
TASK: Refine the "Current Resume Draft".

**HIERARCHY OF INSTRUCTIONS (MOST IMPORTANT FIRST):**
1.  **USER FEEDBACK (ABSOLUTE PRIORITY):** You MUST precisely follow the user's feedback. This is your primary command.
2.  **MANDATORY FORMATTING RULES (NON-NEGOTIABLE):**
    - **Plain Text Only:** The entire output must be plain UTF-8 text.
    - **No Markdown:** You MUST NOT use any markdown formatting. This includes but is not limited to: asterisks for bolding (\`**text**\`), asterisks for lists (\`* item\`), hyphens for lists (\`- item\`), underscores for italics (\`_text_\`), or any other markdown syntax.
    - **Indented Lists:** For any list (like skills or job responsibilities), every item MUST start on a new line and be indented with exactly two spaces. Do not use any bullet characters.
3.  **BEST PRACTICES:** After applying the user's feedback, if any best practices are provided below, incorporate them.
4.  **TONE ADHERENCE:** All changes must strictly conform to the specified "${confidence}" tone.
5.  **NO NEW INFORMATION:** Do not invent facts, skills, or experiences. All content must originate from the "Current Resume Draft".

---
**User Feedback:**
${feedbackSection}
${bestPracticesSection}
---
**Current Resume Draft:**
${draft}
---

**OUTPUT FORMAT (ABSOLUTELY MANDATORY - FOLLOW THIS STRUCTURE EXACTLY):**
Your entire response must consist of exactly two parts separated by a specific delimiter. Do not add any conversational text, explanations, or preambles.

**Part 1: The Full Refined Resume**
Start your response with the first word of the refined resume. End this part with the last word of the refined resume.

**Part 2: The Delimiter and Changelog**
Immediately after the resume text, on a new line, you MUST include the exact delimiter:
${changelogDelimiter}
Immediately after the delimiter, provide a brief, high-level summary of the 3-5 most important changes made. Each point should be on its own line without any bullet characters.
---

Refine the resume now. Adhere strictly to all instructions and the two-part output format.
`;
};


/**
 * Refines a given resume draft based on user feedback with streaming.
 */
export const refineResume = async (
    draftToRefine: string,
    feedback: string,
    confidence: ConfidenceLevel,
    useBestPractices: boolean,
    onChunk: (chunk: string) => void,
    onSources: (sources: GroundingSource[]) => void,
    onComplete: (metadata: { changelog?: string }) => void
): Promise<void> => {
    const changelogDelimiter = '---CHANGELOG---';
    let bestPracticesText = '';

    if (useBestPractices) {
        try {
            const practices = await fetchBestPractices();
            onSources(practices.sources); // Immediately send sources to the UI! This is the key fix.
            bestPracticesText = practices.practicesText;
        } catch (error) {
            console.warn("Could not fetch best practices from Google Search.", error);
            // Don't throw, just proceed without them.
            bestPracticesText = "Could not retrieve best practices. Proceeding with user feedback only.";
        }
    }

    const prompt = refineResumePrompt(draftToRefine, feedback, confidence, bestPracticesText, changelogDelimiter);
    
    try {
        const streamResponse = await withRetry(() => ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.5 },
        }));
        
        let fullResponseText = "";
        let lastSentFormattedResume = "";
        
        for await (const chunk of streamResponse) {
            const text = chunk.text;
            if (text) {
                fullResponseText += text;

                let resumePart = fullResponseText;
                if (fullResponseText.includes(changelogDelimiter)) {
                    resumePart = fullResponseText.split(changelogDelimiter)[0];
                }
                
                const formattedResumePart = formatAIResponse(resumePart);

                if (formattedResumePart.length > lastSentFormattedResume.length) {
                    const newTextChunk = formattedResumePart.substring(lastSentFormattedResume.length);
                    onChunk(newTextChunk);
                    lastSentFormattedResume = formattedResumePart;
                }
            }
        }
        
        const fullText = fullResponseText.trim();
        let changelog: string | undefined = undefined;

        if (fullText.includes(changelogDelimiter)) {
            const parts = fullText.split(changelogDelimiter);
            const rawChangelog = parts.slice(1).join(changelogDelimiter).trim();
            changelog = formatAIResponse(rawChangelog);
        }
        
        onComplete({ changelog });

    } catch (error) {
        console.error("Error refining resume:", error);
        const errorMessage = getErrorMessage(error);
        if (errorMessage.includes('429') || errorMessage.toUpperCase().includes('RESOURCE_EXHAUSTED')) {
            throw new Error("The AI service is currently experiencing high traffic. Please try again in a few moments.");
        }
        throw new Error("Failed to refine the resume with the AI. The service may be temporarily unavailable.");
    }
};