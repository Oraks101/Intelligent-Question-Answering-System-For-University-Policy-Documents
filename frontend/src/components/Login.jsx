import React, { useState } from 'react';
import axios from 'axios';
import { GraduationCap, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const Login = ({ onLoginSuccess, apiBaseUrl }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Email regex validation (matching user's spelling and correct spelling)
  const regex = /^2\d{7}@nileuniver(sity|stiy)\.edu\.ng$/i;
  const isValid = regex.test(email);

  const emailPrefix = email.split('@')[0];
  const startsWith2 = emailPrefix.startsWith('2');
  const has8Digits = /^\d{8}$/.test(emailPrefix);
  const endsWithDomain = /@nileuniver(sity|stiy)\.edu\.ng$/i.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      setError("Please enter a valid Nile University student email (e.g. 20123456@nileuniverstiy.edu.ng).");
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${apiBaseUrl}/login`, { email });
      if (response.data.status === 'success') {
        setSuccessMsg('Authentication successful! Logging you in...');
        setTimeout(() => {
          onLoginSuccess(response.data.email, response.data.token);
        }, 1200);
      }
    } catch (err) {
      console.error("Login failed:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to connect to the authentication server. Please verify the backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-[#002244] to-slate-900 font-sans text-slate-100 p-4 relative overflow-hidden">
      {/* Background decoration blobs */}
      <div className="absolute -top-10 -left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 transition-all hover:border-white/20 duration-300 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-4 ring-white/5 mb-4">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white text-center">Nile University Policy AI</h1>
          <p className="text-xs text-blue-200/60 uppercase tracking-widest mt-1.5 font-semibold">Student Portal Authentication</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-blue-200/80 uppercase tracking-wider mb-2">
              Student Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="2xxxxxxx@nileuniverstiy.edu.ng"
                className="w-full pl-11 pr-10 py-3.5 bg-slate-950/40 border border-white/10 rounded-xl outline-none text-sm text-white placeholder-slate-500 transition-all focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10"
              />
              {email && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
              )}
            </div>
            
            {/* Real-time regex explanation helper */}
            <div className="mt-3 text-xs bg-slate-950/20 border border-white/5 rounded-lg p-3 space-y-1.5 text-slate-400">
              <div className="font-semibold text-slate-300">Format Rules:</div>
              <ul className="list-disc pl-4 space-y-1">
                <li className={email && startsWith2 ? "text-emerald-400 font-medium" : "text-slate-400"}>
                  Must start with the digit <code className="bg-white/5 px-1 rounded font-mono">2</code>
                </li>
                <li className={email && has8Digits ? "text-emerald-400 font-medium" : "text-slate-400"}>
                  ID prefix must have exactly 8 digits
                </li>
                <li className={email && endsWithDomain ? "text-emerald-400 font-medium" : "text-slate-400"}>
                  Domain must be <code className="bg-white/5 px-1 rounded font-mono">@nileuniverstiy.edu.ng</code>
                </li>
              </ul>
            </div>
          </div>

          {error && (
            <div className="flex gap-2.5 items-start bg-red-500/10 border border-red-500/20 text-red-300 p-3.5 rounded-xl text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex gap-2.5 items-start bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-xl text-xs leading-relaxed animate-fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-medium py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] duration-150"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Verifying Student ID...
              </span>
            ) : (
              <>
                <span>Enter Policy Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest mt-8 font-medium">
          Official Nile University Policy Advisor Portal
        </p>
      </div>
    </div>
  );
};

export default Login;
