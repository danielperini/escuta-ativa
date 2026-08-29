import React from 'react';
import ChatIACore from '@/components/chatia/ChatIACore';
import { Sparkles, Database } from 'lucide-react';

export default function AssistenteIA() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Assistente IA</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl flex items-center gap-2 flex-wrap">
          <Database className="w-4 h-4" />
          Chat conectado aos dados reais da plataforma — pergunte em linguagem natural sobre comunidades, registros, stakeholders, demandas, riscos e fontes públicas.
        </p>
      </div>

      <div className="h-[calc(100vh-220px)] min-h-[420px] rounded-xl border border-border overflow-hidden bg-card">
        <ChatIACore contextoForcado="AssistenteIA" />
      </div>
    </div>
  );
}