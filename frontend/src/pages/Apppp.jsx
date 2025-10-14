import React, { useState } from 'react';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingSkeleton = () => (
  <div className="space-y-5 animate-pulse p-4">
    <div className="h-4 bg-slate-700 rounded w-1/3"></div>
    <div className="space-y-3">
      <div className="h-4 bg-slate-700 rounded"></div>
      <div className="h-4 bg-slate-700 rounded w-5/6"></div>
      <div className="h-4 bg-slate-700 rounded w-3/4"></div>
    </div>
    <div className="h-4 bg-slate-700 rounded w-1/4 pt-4"></div>
     <div className="space-y-3">
      <div className="h-4 bg-slate-700 rounded"></div>
      <div className="h-4 bg-slate-700 rounded w-5/6"></div>
    </div>
  </div>
);

function App() {
  const [symptoms, setSymptoms] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (symptoms.trim().length < 10) {
      setError('Please provide a more detailed description of your symptoms.');
      return;
    }
    
    setIsLoading(true);
    setResponse('');
    setError('');

    try {
      const apiResponse = await fetch('http://127.0.0.1:5000/check_symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || `HTTP error! status: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      const htmlResponse = marked(data.response);
      setResponse(htmlResponse);

    } catch (e) {
      setError(e.message || 'Failed to connect to the server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
      <motion.main 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-3xl"
      >
        <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-3 mb-2">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3M5.636 5.636l-1.414-1.414M19.778 19.778l-1.414-1.414M18.364 5.636l1.414-1.414M4.222 19.778l1.414-1.414M12 12a5 5 0 100-10 5 5 0 000 10z" /></svg>
                <h1 className="text-4xl font-bold text-cyan-400">AI Symptom Checker</h1>
            </div>
          <p className="text-slate-400">Describe your symptoms for an AI-powered analysis.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <textarea 
            id="symptoms" 
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows="5" 
            className="w-full p-4 bg-slate-700 rounded-lg border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow text-lg"
            placeholder="e.g., I have a persistent dry cough, a high fever of 102°F, and muscle aches all over my body..."
            required
          />
          <motion.button 
            type="submit" 
            disabled={isLoading}
            whileTap={{ scale: 0.95 }}
            className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-500 disabled:cursor-not-allowed text-white font-bold text-lg py-3 px-4 rounded-lg transition-colors transform"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Symptoms'}
          </motion.button>
        </form>
        <div className="mt-8 min-h-[150px]">
            <h2 className="text-2xl font-semibold text-slate-300 mb-4">Analysis:</h2>
            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <LoadingSkeleton />
                </motion.div>
              )}
              {error && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-400 bg-red-900/50 p-4 rounded-lg">
                  {error}
                </motion.div>
              )}
              {response && (
                <motion.div key="response" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <article 
                    className="prose prose-invert prose-lg max-w-none prose-h3:text-cyan-300 prose-strong:text-white"
                    dangerouslySetInnerHTML={{ __html: response }}
                  >
                  </article>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </motion.main>
    </div>
  );
}

export default App;

