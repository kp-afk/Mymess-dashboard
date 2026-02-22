import React, { useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await auth.signInWithPopup(googleProvider);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{ fontFamily: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace" }}
      className="min-h-screen bg-[#080808] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm">

        {/* ASCII-style header */}
        <div className="mb-8 text-center">
          <div className="text-[10px] text-[#333] tracking-[0.3em] uppercase mb-6">
            ── ── ── ── ── ── ── ── ──
          </div>
          <div className="text-[10px] tracking-[0.4em] text-[#555] uppercase mb-2">MyMess</div>
          <div className="text-2xl text-[#e8e8e8] tracking-tight mb-1">Admin Dashboard</div>
          <div className="text-[11px] text-[#444] tracking-[0.2em] uppercase">Authorized Access Only</div>
          <div className="text-[10px] text-[#333] tracking-[0.3em] uppercase mt-6">
            ── ── ── ── ── ── ── ── ──
          </div>
        </div>

        {/* Login card */}
        <div className="border border-[#1f1f1f] bg-[#0d0d0d] p-8">

          {/* Prompt line */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[#f59e0b] text-sm">›</span>
            <span className="text-[12px] text-[#666] tracking-[0.15em] uppercase">authenticate</span>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 border border-red-900/40 bg-red-950/20 p-3 mb-5">
              <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
              <span className="text-[11px] text-red-400 leading-relaxed">{error}</span>
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-[#2a2a2a] hover:border-[#f59e0b]/40 bg-[#111] hover:bg-[#141414] text-[13px] text-[#ccc] hover:text-[#f0f0f0] transition-all disabled:opacity-40 active:scale-[0.99]"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 border border-[#555] border-t-[#f59e0b] rounded-full animate-spin" />
                Connecting...
              </span>
            ) : 'Continue with Google'}
          </button>

          {/* Hint line */}
          <div className="mt-5 flex items-center gap-2">
            <div className="flex-1 h-px bg-[#151515]" />
            <span className="text-[9px] text-[#333] tracking-[0.2em] uppercase">or use admin credentials</span>
            <div className="flex-1 h-px bg-[#151515]" />
          </div>

          {/* Placeholder disabled email/pass - visual only */}
          <div className="mt-4 space-y-2 opacity-30 pointer-events-none select-none">
            <div className="border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2.5 text-[12px] text-[#444] flex items-center gap-2">
              <span className="text-[#333]">user@</span>
              <span className="text-[#2a2a2a]">____________</span>
            </div>
            <div className="border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2.5 text-[12px] text-[#444] flex items-center gap-2">
              <span className="text-[#333]">pass </span>
              <span className="text-[#2a2a2a]">••••••••••••</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-[9px] text-[#2a2a2a] tracking-[0.3em] uppercase">
          Firebase · Secure Auth · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
