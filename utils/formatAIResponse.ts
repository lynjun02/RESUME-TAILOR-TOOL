/**
 * A robust post-processing function to clean and format text received from the AI.
 * This acts as a "format handler" to prevent regressions and ensure consistent, clean output.
 *
 * @param rawText The raw string output from the Gemini API.
 * @returns A cleaned and consistently formatted string.
 */
export const formatAIResponse = (rawText: string): string => {
    if (!rawText) return '';

    let processedText = rawText;

    // 1. Remove Markdown Bolding/Italics
    // Remove **bold** and __bold__
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '$1');
    processedText = processedText.replace(/__(.*?)__/g, '$1');
    // Remove *italic* and _italic_
    processedText = processedText.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '$1');
    processedText = processedText.replace(/_(.*?)_/g, '$1');

    // 2. Standardize List Formatting to two-space indentation
    const lines = processedText.split('\n');
    const formattedLines = lines.map(line => {
        // Trim the line to handle various leading whitespaces
        const trimmedLine = line.trim();
        // Check if the line starts with common markdown list markers (*, -, or a number followed by a dot)
        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || /^\d+\.\s/.test(trimmedLine)) {
            // Replace the marker with a two-space indent
            return '  ' + trimmedLine.substring(trimmedLine.indexOf(' ') + 1);
        }
        return line; // Return original line if it's not a list item
    });

    processedText = formattedLines.join('\n');

    // 3. Trim any leading/trailing whitespace from the entire block
    return processedText.trim();
};
