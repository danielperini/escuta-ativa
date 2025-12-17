import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingFallback({ message = 'Carregando...' }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#E31E24]" />
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-4 bg-slate-200 rounded w-5/6" />
      </div>
    </div>
  );
}