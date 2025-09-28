# AI Resume Tailor

AI Resume Tailor is a powerful web application designed to help job seekers create perfectly tailored resumes. By leveraging the Google Gemini API, it synthesizes a user's entire work history from multiple resume documents and aligns it with a specific job description, all while adhering to the strict rule of never inventing information.

---

## Key Features

-   **Multi-Resume Context**: Upload up to 10 of your past resumes in `.pdf`, `.docx`, `.txt`, or `.md` format to provide a comprehensive view of your experience.
-   **AI-Powered Tailoring**: Generates a new resume draft specifically tailored to the responsibilities and qualifications listed in a job description.
-   **Multiple Writing Tones**: Choose between "Eager Learner," "Confident Professional," and "Seasoned Expert" tones to match your career level and personality.
-   **Iterative Refinement**: Provide direct feedback in plain English to refine the draft. The AI will make changes based on your instructions.
-   **Best Practices Integration**: Optionally incorporate modern, data-driven resume writing advice using Google Search, with sources cited directly in the app.
-   **Cost & Performance Optimized**:
    -   **On-Demand Generation**: Tones are generated only when you select them, significantly reducing API costs.
    -   **Real-Time Streaming**: AI responses stream to the UI word-by-word for a highly responsive user experience.
    -   **Input Pre-processing**: Job descriptions and feedback are automatically cleaned and condensed before being sent to the AI, saving on API tokens.
-   **Robust & Reliable**:
    -   **Programmatic Formatting**: A strict format handler guarantees clean, professional, plain-text output, free of unwanted markdown.
    -   **Advanced Error Handling**: Implements an exponential backoff strategy to automatically retry API calls during high traffic or transient errors.

## How It Works

1.  **Step 1: Upload Your Resumes**: Drag and drop or select up to 10 of your existing resumes.
2.  **Step 2: Add the Job Description**: Paste the full text of the job description you are targeting.
3.  **Step 3: Review & Refine**:
    -   The AI generates an initial draft in the "Eager Learner" tone.
    -   Switch between different tones, which are generated on-demand.
    -   Provide feedback in the text box (e.g., "Make the summary more concise") and/or check "Incorporate best resume practices".
    -   Click "Refine Resume" to apply your changes.
4.  **Step 4: Accept and Finalize**: Once you are happy with a draft, accept it to view the final, clean text, ready to be copied into your word processor of choice.

## Tech Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **AI**: Google Gemini API (`@google/genai`)
-   **File Parsing**:
    -   `pdf.js` for PDF documents.
    -   `mammoth.js` for DOCX documents.

## Running Locally

This project uses an `importmap` in `index.html` to load dependencies from a CDN, so no `npm install` step is required for the libraries.

1.  **Clone the repository or create the files:**
    Ensure all the project files (`index.html`, `index.tsx`, `App.tsx`, etc.) are in the same directory.

2.  **Set Your API Key:**
    The application is configured to use an API key from `process.env.API_KEY`. For local development in a static environment, you will need to replace this placeholder.

    -   Open the `services/geminiService.ts` file.
    -   Find the line: `const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });`
    -   Replace `process.env.API_KEY!` with your actual Google Gemini API key as a string:
        ```typescript
        // For local development ONLY
        const ai = new GoogleGenAI({ apiKey: "YOUR_GEMINI_API_KEY_HERE" });
        ```
    -   **IMPORTANT**: Do not commit your API key to version control (e.g., GitHub). This method is for local testing only. For deployment, use your hosting provider's environment variable system.

3.  **Serve the files:**
    You need to serve the project files from a local web server, as opening `index.html` directly in the browser will cause issues with module loading and file reading.

    -   If you have Python installed, the easiest way is to run:
        ```bash
        # For Python 3
        python -m http.server
        ```
    -   If you have Node.js, you can use the `serve` package:
        ```bash
        npx serve .
        ```
    -   Open your browser and navigate to the local address provided (e.g., `http://localhost:8000` or `http://localhost:3000`).