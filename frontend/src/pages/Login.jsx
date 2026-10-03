import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const res = await api.post(endpoint, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/chat');
    } catch (err) {
      const msg = err.response?.data?.error || 'Authentication failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black text-white relative overflow-hidden select-none">
      {/* Subtle monochrome ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-8 md:p-10 bg-zinc-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.8)] relative z-10 animate-slide-up">
        {/* Minimalist Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center font-bold text-xl mb-4 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <span className="font-heading">◆</span>
          </div>
          <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-zinc-400 mb-2">
            AI Appointment System
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5">
            {isLogin 
              ? 'Sign in to access your appointments & AI assistant' 
              : 'Register to start scheduling bookings instantly'}
          </p>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="mb-6 p-3.5 bg-zinc-900 border border-white/20 rounded-xl text-zinc-200 text-sm flex items-start gap-2.5 animate-fade-in">
            <AlertCircle size={18} className="text-white shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">{error}</div>
            <button 
              onClick={() => setError('')} 
              className="text-zinc-400 hover:text-white text-xs font-mono"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {!isLogin && (
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-zinc-400 mb-2">
                Full Name
              </label>
              <input
                type="text"
                disabled={loading}
                className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all text-sm disabled:opacity-50"
                placeholder="Alex Morgan"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-zinc-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              disabled={loading}
              className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all text-sm disabled:opacity-50"
              placeholder="alex@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-zinc-400 mb-2">
              Password
            </label>
            <input
              type="password"
              disabled={loading}
              className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all text-sm disabled:opacity-50"
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-black" />
                <span>{isLogin ? 'Authenticating...' : 'Creating account...'}</span>
              </>
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
          <span>
            {isLogin ? "Don't have an account yet? " : "Already registered? "}
          </span>
          <button
            type="button"
            disabled={loading}
            className="text-white hover:underline font-medium cursor-pointer bg-transparent border-none p-0 ml-1 disabled:opacity-50"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? 'Sign up here' : 'Sign in here'}
          </button>
        </div>

        {/* Footer Guarantee */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-mono">
          <ShieldCheck size={13} className="text-zinc-400" />
          <span>End-to-End Authenticated Session</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
