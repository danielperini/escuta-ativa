import React from 'react';
import ChatAssistente from '@/components/chat/ChatAssistente';
import { Sparkles, Database, MessageSquare } from 'lucide-react';

export default function AssistenteIA() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Assistente de IA</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl flex items-center gap-2 flex-wrap">
          <Database className="w-4 h-4" />
          Chat inteligente conectado aos dados da plataforma — pergunte sobre registros, stakeholders, casos, demandas, riscos e recibos.
        </p>
      </div>

      <ChatAssistente agentName="assistente_societa" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-card">
          <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Perguntas em linguagem natural</p>
            <p className="text-muted-foreground">"Quantos registros de Matozinhos este mês?"</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-card">
          <Database className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Acesso a dados reais</p>
            <p className="text-muted-foreground">Respostas baseadas em registros e casos cadastrados</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-card">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Insights e recomendações</p>
            <p className="text-muted-foreground">Prioridades, tendências e ações sugeridas</p>
          </div>
        </div>
      </div>
    </div>
  );
}