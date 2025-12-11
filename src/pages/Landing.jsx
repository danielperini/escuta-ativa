import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { ArrowRight, Waves } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const handleEntrar = () => {
    navigate(createPageUrl('Dashboard'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#52B788] to-[#2D6A4F] flex items-center justify-center shadow-2xl">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V20M8 7V17M16 7V17M4 10V14M20 10V14" 
                      stroke="white" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"/>
              </svg>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-[#52B788] opacity-30 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
            Escuta Ativa
          </h1>
          <div className="h-1 w-24 bg-[#74C69D] mx-auto rounded-full" />
          <p className="text-xl md:text-2xl text-[#D8F3DC] font-light">
            A Voz da Comunidade
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-[#B7E4C7] max-w-xl mx-auto text-lg">
          Sistema inteligente de registro, análise e gestão de relacionamento comunitário 
          com processamento automático por IA
        </p>

        {/* CTA Button */}
        <div className="pt-8">
          <Button
            onClick={handleEntrar}
            size="lg"
            className="bg-white text-[#1B4332] hover:bg-[#D8F3DC] text-lg px-8 py-6 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
          >
            Entrar no Sistema
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="w-12 h-12 rounded-lg bg-[#52B788]/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Registro Inteligente</h3>
            <p className="text-[#B7E4C7] text-sm">
              Upload de documentos, áudio ou texto com preenchimento automático por IA
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="w-12 h-12 rounded-lg bg-[#52B788]/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Análise em Tempo Real</h3>
            <p className="text-[#B7E4C7] text-sm">
              Insights, materialidade e temperatura social identificados automaticamente
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="w-12 h-12 rounded-lg bg-[#52B788]/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Gestão Territorial</h3>
            <p className="text-[#B7E4C7] text-sm">
              Mapeamento, atores, compromissos e linha do tempo de demandas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}