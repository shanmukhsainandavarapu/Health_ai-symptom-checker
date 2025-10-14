import React, { useState } from 'react';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';

// --- All Components and Logic are now in this single file ---

const LoadingSkeleton = () => (
  <div className="space-y-5 p-4">
    <div className="h-4 bg-rose-100 rounded w-1/3 animate-pulse"></div>
    <div className="space-y-3">
      <div className="h-4 bg-rose-100 rounded animate-pulse delay-75"></div>
      <div className="h-4 bg-rose-100 rounded w-5/6 animate-pulse delay-150"></div>
    </div>
    <div className="h-4 bg-rose-100 rounded w-1/4 pt-4 animate-pulse delay-200"></div>
     <div className="space-y-3">
      <div className="h-4 bg-rose-100 rounded animate-pulse delay-300"></div>
    </div>
  </div>
);

const AuroraBackground = () => (
  <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
    <div className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 w-[1400px] h-[1400px] bg-[radial-gradient(circle_at_center,_rgba(251,113,133,0.08)_0%,_rgba(251,113,133,0)_50%)] animate-[spin_20s_linear_infinite]"></div>
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_rgba(253,164,175,0.15)_0%,_rgba(253,164,175,0)_40%)]"></div>
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.15)_0%,_rgba(244,114,182,0)_40%)]"></div>
  </div>
);

const QuestionsModal = ({ show, handleClose, questions, isLoading, error }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-rose-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          >
            <div className="p-6 border-b border-rose-200 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-rose-700">Questions for Your Doctor</h3>
              <button onClick={handleClose} className="text-rose-400 hover:text-rose-800 transition-colors text-3xl leading-none">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              {isLoading && <LoadingSkeleton />}
              {error && <div className="text-red-500">{error}</div>}
              {questions && (
                 <article 
                    className="text-lg space-y-4 [&>h3]:text-rose-700 [&>h3]:font-bold [&>h3]:mb-2 [&>p]:text-rose-900/80 [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mb-1 [&>ul>li::marker]:text-rose-400"
                    dangerouslySetInnerHTML={{ __html: questions }}
                  >
                  </article>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


function App() {
  const [symptoms, setSymptoms] = useState('');
  const [rawResponse, setRawResponse] = useState('');
  const [htmlResponse, setHtmlResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [isAnalysisSuccessful, setIsAnalysisSuccessful] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorQuestions, setDoctorQuestions] = useState('');
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState('');

  const handleCopy = (textToCopy) => {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      setCopySuccess('Failed');
    }
    document.body.removeChild(textArea);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Step 1: Immediately reset all previous output states.
    setHtmlResponse('');
    setRawResponse('');
    setError('');
    setCopySuccess('');
    setDoctorQuestions('');
    setQuestionsError('');
    setIsAnalysisSuccessful(false);

    // FIX #1: Correct and stricter frontend validation.
    // This check now correctly stops the submission for short inputs.
    if (symptoms.trim().length < 10) {
      setError('Please provide more details. For example, instead of "fever," try "I have a high fever and a cough."');
      return;
    }
    
    // Step 2: If validation passes, show loading and make the API call.
    setIsLoading(true);

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
      
      // FIX #2: A much more reliable way to check for a successful analysis.
      // A successful analysis MUST include the "Probable Conditions" heading from the prompt.
      if (data.response && data.response.includes("**Probable Conditions:**")) {
        setIsAnalysisSuccessful(true);
      }
      
      setRawResponse(data.response);
      setHtmlResponse(marked(data.response));

    } catch (e) {
      setError(e.message || 'Failed to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrepareQuestions = async () => {
    setIsModalOpen(true);
    setIsQuestionsLoading(true);
    setDoctorQuestions('');
    setQuestionsError('');

    try {
      const apiResponse = await fetch('http://127.0.0.1:5000/prepare_questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, analysis: rawResponse }),
      });

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }
      const data = await apiResponse.json();
      setDoctorQuestions(marked(data.response));

    } catch (e) {
      setQuestionsError(e.message || 'Failed to generate questions.');
    } finally {
      setIsQuestionsLoading(false);
    }
  };

  return (
    <>
      <QuestionsModal 
        show={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        questions={doctorQuestions}
        isLoading={isQuestionsLoading}
        error={questionsError}
      />
      <div className="relative min-h-screen bg-rose-50 text-rose-900 flex items-center justify-center p-4 font-sans overflow-hidden">
        <AuroraBackground />
        <motion.main 
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          className="bg-white/70 backdrop-blur-md border border-rose-200 p-8 rounded-2xl shadow-2xl w-full max-w-3xl"
        >
          <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
                className="flex justify-center items-center gap-3 mb-2"
              >
                  <svg className="w-9 h-9 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3M5.636 5.636l-1.1-1.1M19.778 19.778l-1.1-1.1M18.364 5.636l1.1-1.1M4.222 19.778l1.1-1.1M12 12a5 5 0 100-10 5 5 0 000 10z" /></svg>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-transparent bg-clip-text">AI Symptom Checker</h1>
              </motion.div>
            <p className="text-rose-900/60">Describe your symptoms for an AI-powered analysis.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <textarea 
                id="symptoms" 
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows="5" 
                className="w-full p-4 bg-rose-100/30 rounded-lg border border-rose-200 focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all text-lg placeholder:text-rose-900/40 shadow-inner peer"
                placeholder="e.g., I have a persistent dry cough, a high fever, and muscle aches..."
                required
              />
              <div className="absolute inset-0 rounded-lg border-2 border-transparent peer-focus:border-rose-400/30 transition-all pointer-events-none shadow-[0_0_20px_0_rgba(251,113,133,0)] peer-focus:shadow-[0_0_20px_0_rgba(251,113,133,0.2)]"></div>
            </div>
            <motion.button 
              type="submit" 
              disabled={isLoading}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-6 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:from-rose-300 disabled:to-pink-300 disabled:cursor-not-allowed text-white font-bold text-lg py-3 px-4 rounded-lg transition-all transform shadow-lg shadow-rose-500/30"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Symptoms'}
            </motion.button>
          </form>
          <div className="mt-8 min-h-[200px]">
              <div className="flex justify-between items-center mb-4 border-b border-rose-200 pb-2">
                <h2 className="text-2xl font-semibold text-rose-900/80">Analysis:</h2>
                <AnimatePresence>
                  {isAnalysisSuccessful && !isLoading && (
                    <motion.button
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      onClick={() => handleCopy(rawResponse)}
                      className="text-sm bg-rose-100 hover:bg-rose-200 border border-rose-200 text-rose-700 px-3 py-1 rounded-md transition-all flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      {copySuccess || 'Copy'}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence mode="wait">
                {isLoading && (
                  <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <LoadingSkeleton />
                  </motion.div>
                )}
                {error && (
                  <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-red-600 bg-red-100 border border-red-200 p-4 rounded-lg">
                    {error}
                  </motion.div>
                )}
                {htmlResponse && (
                  <motion.div key="response" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <article 
                      className="text-lg space-y-4 [&>h3]:text-rose-700 [&>h3]:font-bold [&>h3]:mb-2 [&>p]:text-rose-900/80 [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mb-1 [&>ul>li::marker]:text-rose-400"
                      dangerouslySetInnerHTML={{ __html: htmlResponse }}
                    >
                    </article>
                    
                    {isAnalysisSuccessful && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <button onClick={handlePrepareQuestions} disabled={isQuestionsLoading} className="mt-6 w-full text-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-rose-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                          {isQuestionsLoading ? "Generating..." : "✨ Prepare Questions for My Doctor"}
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </>
  );
}

export default App;





