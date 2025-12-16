import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect após 3 segundos
    const timer = setTimeout(() => {
      navigate(createPageUrl('Dashboard'));
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50">
      <div className="text-center space-y-6 p-8">
        <div className="mb-6">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693acc814baf8083c262896b/8a81a6207_transparent-Photoroom12.png"
            alt="societa.ai"
            className="h-20 mx-auto object-contain mb-4"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#E31E24] to-[#B01419] bg-clip-text text-transparent">
            societa.ai
          </h1>
          <p className="text-slate-600 text-lg mt-2">Versão 2.1</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            <span>Matriz de Macrotemas implementada</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            <span>Cálculo automático de risco social</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            <span>Performance otimizada</span>
          </div>
        </div>

        <Button 
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="bg-[#E31E24] hover:bg-[#B01419] mt-6"
        >
          Acessar Dashboard
        </Button>

        <p className="text-xs text-slate-400 mt-4">
          Redirecionando automaticamente...
        </p>
      </div>
    </div>
  );
}