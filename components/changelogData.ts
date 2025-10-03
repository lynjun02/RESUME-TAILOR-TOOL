export const changelogData = {
  version: "1.1.0",
  date: "2024-10-26",
  groups: [
    {
      title: "Major Updates",
      changes: [
        "**Standalone Installer:** Added a beginner-friendly `install.sh` script to automate the entire setup process using Docker.",
        "**Full Dark Mode:** The application now has a complete and consistent dark mode theme across all components.",
        "**Professional Document Exports:** The 'Export as PDF' and 'Export as DOCX' features have been completely refactored. They now produce professionally formatted, selectable, text-based documents instead of simple images.",
      ],
    },
    {
      title: "Minor Updates",
      changes: [
        "**UI/UX Enhancements:** Added a 'Clear All' button to the file uploader, implemented a minimum character requirement for the job description, and added a 'Cancel' button during AI generation.",
        "**Navigation:** Implemented back and forward buttons to allow seamless movement between steps.",
        "**Contextual Feedback:** The last feedback you provided is now displayed during refinement to give you better context.",
        "**Cost Optimization:** Implemented caching for 'Best Resume Practices' to reduce redundant API calls within the same session.",
        "**Improved AI Instructions:** Refined the prompts sent to the AI to ensure it makes more targeted edits and provides a more accurate changelog.",
      ],
    },
    {
      title: "Other",
      changes: [
        "**Code Quality:** Added comprehensive comments to all major components and type definitions to improve code clarity and maintainability.",
        "**Bug Fix:** Corrected several minor styling issues in the initial dark mode implementation.",
      ],
    },
  ],
};