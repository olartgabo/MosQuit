'use client';

import { useState } from 'react';

interface ReportBoxProps {
  onReport: (text: string) => void;
  isProcessing: boolean;
}

export default function ReportBox({ onReport, isProcessing }: ReportBoxProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isProcessing) return;
    onReport(text);
    setText('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="pointer-events-auto w-full max-w-md rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <svg
          className="w-3.5 h-3.5 text-cyan-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="text-[10px] uppercase tracking-wider font-bold text-white/60">
          Reportes Ciudadanos (NLP)
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej: 'Muchos mosquitos cerca del hospital en Tondo'..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
          disabled={isProcessing}
        />
        <button
          type="submit"
          disabled={!text.trim() || isProcessing}
          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 disabled:opacity-40"
        >
          {isProcessing ? '...' : 'Enviar'}
        </button>
      </div>
    </form>
  );
}
