# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-10-25

This marks the first stable release of the AI Resume Tailor application.

### Added

-   **Core Functionality**: Generate a tailored resume from multiple source resumes and a job description.
-   **Multiple Tones**: Support for "Eager Learner", "Confident Professional", and "Seasoned Expert" writing tones.
-   **On-Demand Tone Generation**: To optimize API costs, alternate tones are only generated when selected by the user.
-   **Real-Time Streaming UI**: AI responses are streamed character-by-character for a highly responsive user experience.
-   **Google Search Integration**: "Incorporate best resume practices" feature uses Google Search to ground AI responses in modern, expert advice.
-   **Input Pre-processing**: AI-powered cleaning of job descriptions and user feedback to reduce token usage and improve clarity.
-   **Engaging Loaders**: Custom loading screens for initial generation and refinement steps provide better user feedback.
-   **Robust File Uploader**: Supports `.pdf`, `.docx`, `.txt`, and `.md` with client-side validation and clear error messaging.
-   **Undo Functionality**: An "Undo" button appears after a refinement to allow reverting to the previous text.
-   **Programmatic Format Handler**: A dedicated utility now programmatically cleans all AI output, guaranteeing a professional, markdown-free format and preventing future regressions.
-   **Decoupled Refinement Process**: The "Best Practices" feature now uses a reliable two-step process to guarantee sources are fetched and displayed every time.

### Changed

-   **Default Tone**: The application now defaults to the "Eager Learner" tone for the initial draft.
-   **API Retry Logic**: Enhanced the retry mechanism with exponential backoff and jitter to gracefully handle high traffic and transient server errors.
-   **AI Prompt Engineering**: All prompts have been significantly optimized for cost-reduction, stricter rule adherence (e.g., no fabrication, strict skills logic), and tone consistency.

### Fixed

-   **Critical Bug - Source Display**: Permanently fixed a recurring bug where the "Best Practices Applied" sources would not display, especially when combined with user feedback.
-   **Critical Bug - "Dirty" Output**: Permanently fixed recurring bugs where the AI would output unwanted markdown (`**`, `*`) or its internal "thought process" text.
-   **Logic Correction**: Ensured the "Incorporate best resume practices" logic is only triggered when the checkbox is explicitly selected.
-   **UI Controls**: The "Refine Resume" button is now correctly disabled when no new feedback is provided.
-   Numerous minor UI, logic, and syntax errors have been resolved throughout the development process.