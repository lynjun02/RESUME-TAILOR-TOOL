import React, { useState } from 'react';

// Defining the props for the component. It needs a function to call once the key is successfully saved.
interface ApiKeyManagerProps {
  onKeySaved: (apiKey: string) => void;
}

/**
 * A component that provides a form for the user to enter and save their Gemini API key.
 * The key is saved to the browser's local storage for persistence.
 * This is a key part of making the application standalone and not dependent on build-time secrets.
 */
const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');

  /**
   * Handles the form submission. It saves the key to local storage and then
   * calls the callback function to notify the parent component.
   */
  const handleSaveKey = () => {
    if (apiKey.trim()) {
      // We use a consistent key for storing the API key in local storage.
      localStorage.setItem('gemini_api_key', apiKey.trim());
      onKeySaved(apiKey.trim());
    } else {
      // Basic validation to ensure the user doesn't submit an empty key.
      alert('Please enter a valid API key.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Enter Your Gemini API Key</h2>
      <p className="mb-6 text-slate-600 dark:text-slate-400 max-w-md">
        To use this application, you need to provide your own Gemini API key.
        Your key will be saved securely in your browser's local storage and will not be shared.
      </p>
      <div className="w-full max-w-sm">
        <input
          type="password" // Use password type to obscure the key as the user types.
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Gemini API key here"
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
        <button
          onClick={handleSaveKey}
          className="w-full mt-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          Save and Continue
        </button>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          You can get your API key from the{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Google AI Studio
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default ApiKeyManager;