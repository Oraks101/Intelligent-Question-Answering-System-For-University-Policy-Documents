import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Login from './components/Login';

// ---------------------------------------------------------------------------
// API Configuration
// ---------------------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

const isMisconfigured = !API_BASE_URL || (API_BASE_URL.includes('localhost') && import.meta.env.PROD);

// Configure axios defaults
if (API_KEY) {
  axios.defaults.headers.common['X-API-Key'] = API_KEY;
}

const savedStudentEmail = localStorage.getItem('studentEmail');
if (savedStudentEmail) {
  axios.defaults.headers.common['X-Student-Email'] = savedStudentEmail;
}

function App() {
  const [studentEmail, setStudentEmail] = useState(localStorage.getItem('studentEmail') || '');
  const [studentToken, setStudentToken] = useState(localStorage.getItem('studentToken') || '');
  const [policies, setPolicies] = useState([]);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error' | 'info', message: string }

  const showToast = useCallback((type, message, duration = 4000) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), duration);
  }, []);

  const handleLoginSuccess = (email, token) => {
    localStorage.setItem('studentEmail', email);
    localStorage.setItem('studentToken', token);
    setStudentEmail(email);
    setStudentToken(token);
    axios.defaults.headers.common['X-Student-Email'] = email;
    showToast('success', 'Logged in successfully!');
  };

  const handleLogout = () => {
    localStorage.removeItem('studentEmail');
    localStorage.removeItem('studentToken');
    setStudentEmail('');
    setStudentToken('');
    delete axios.defaults.headers.common['X-Student-Email'];
    setMessages([]);
    showToast('info', 'Logged out successfully.');
  };

  // Fetch health check on mount
  useEffect(() => {
    if (isMisconfigured) return;
    checkHealth();
  }, []);

  // Fetch policies and history when logged in
  useEffect(() => {
    if (isMisconfigured || !studentEmail) return;
    fetchPolicies();
    fetchHistory();
  }, [studentEmail]);

  const checkHealth = async () => {
    try {
      await axios.get(`${API_BASE_URL}/health`);
      setBackendHealthy(true);
    } catch (error) {
      console.error("Health check failed:", error);
      setBackendHealthy(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/policies`);
      setPolicies(response.data);
    } catch (error) {
      console.error("Error fetching policies:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/history`);
      const formattedHistory = response.data.flatMap(item => [
        { type: 'user', content: item.query },
        { type: 'bot', content: item.response }
      ]);
      setMessages(formattedHistory);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset input so the same file can be re-uploaded if needed
    e.target.value = '';

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      await axios.post(`${API_BASE_URL}/upload`, formData);
      // File saved — indexing now running in background on server
      setIsUploading(false);
      setIsIndexing(true);
      showToast('info', `"${file.name}" uploaded! Indexing in background — will be ready in a few seconds.`, 6000);
      await fetchPolicies();

      // Poll until the document appears fully indexed (health check returns rag_ready)
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const health = await axios.get(`${API_BASE_URL}/health`);
          if (health.data.rag_ready || attempts >= 20) {
            clearInterval(pollInterval);
            setIsIndexing(false);
            if (health.data.rag_ready) {
              showToast('success', `"${file.name}" is now indexed and ready to query!`, 4000);
            }
          }
        } catch {
          clearInterval(pollInterval);
          setIsIndexing(false);
        }
      }, 3000);

    } catch (error) {
      console.error("Upload failed:", error);
      setIsUploading(false);
      showToast('error', 'Upload failed. Please check the backend is running and try again.');
    }
  };

  const handleDeletePolicy = async (filename) => {
    try {
      await axios.delete(`${API_BASE_URL}/policies/${filename}`);
      await fetchPolicies();
      showToast('success', `"${filename}" has been removed.`);
    } catch (error) {
      console.error("Delete failed:", error);
      showToast('error', `Failed to delete "${filename}". Please try again.`);
    }
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage = { type: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/query`, { query });
      const botMessage = {
        type: 'bot',
        content: response.data.response,
        sources: response.data.sources
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Query failed:", error);
      const errorMessage = {
        type: 'bot',
        content: "Sorry, I encountered an error while searching the policies. Please ensure the backend is running and reachable."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Show a clear error screen if the frontend is not properly configured.
  if (isMisconfigured) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 font-sans">
        <div className="max-w-lg w-full mx-4 bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden">
          <div className="bg-red-500 px-8 py-6">
            <h1 className="text-white font-bold text-xl">⚙️ Configuration Required</h1>
            <p className="text-red-100 text-sm mt-1">The application is not connected to a backend.</p>
          </div>
          <div className="px-8 py-6 space-y-4">
            <p className="text-slate-700 text-sm leading-relaxed">
              The <code className="bg-slate-100 px-1 rounded text-red-600 font-mono text-xs">VITE_API_BASE_URL</code> environment
              variable is missing or still points to <code className="bg-slate-100 px-1 rounded text-red-600 font-mono text-xs">localhost</code>.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs font-mono space-y-1 text-slate-600">
              <p className="text-slate-400 font-sans font-semibold text-[10px] uppercase tracking-wider mb-2">Vercel → Settings → Environment Variables</p>
              <p><span className="text-blue-600">VITE_API_BASE_URL</span> = https://your-backend.railway.app</p>
              <p><span className="text-blue-600">VITE_API_KEY</span> = your_secure_api_key</p>
            </div>
            <p className="text-slate-500 text-xs">
              Deploy the FastAPI backend to Railway, Render, or Fly.io first, then set these values in Vercel and redeploy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show login screen if student is not authenticated
  if (!studentEmail) {
    return <Login onLoginSuccess={handleLoginSuccess} apiBaseUrl={API_BASE_URL} />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] max-w-sm px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium flex items-start gap-3 transition-all duration-300 animate-fade-in-down
          ${toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
          <span className="text-lg leading-none mt-0.5">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⏳'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      <Sidebar
        policies={policies}
        onUpload={handleUpload}
        onDelete={handleDeletePolicy}
        isUploading={isUploading}
        isIndexing={isIndexing}
        studentEmail={studentEmail}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col h-full bg-white relative">
        {/* Backend offline banner */}
        {backendHealthy === false && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-bold">Backend System Offline</span>
          </div>
        )}
        <ChatInterface
          messages={messages}
          query={query}
          setQuery={setQuery}
          onSend={handleSend}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}

export default App;
