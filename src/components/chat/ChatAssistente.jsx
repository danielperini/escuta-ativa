import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, Loader2, Sparkles, RotateCcw, Database, Search, FileText, Users, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SUGESTOES = [
  { icon: FileText, texto: "Quais registros recentes mencionam risco social crítico?" },
  { icon: Users, texto: "Liste os stakeholders com maior influência no território" },
  { icon: AlertTriangle, texto: "Há demandas urgentes sem devolutiva? Mostre as mais antigas" },
  { icon: Database, texto: "Quantos casos estão abertos e qual o prazo médio de resolução?" }
];

const FunctionDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const nome = (toolCall.name || '').split('.').pop();
  const statusOk = ['success', 'completed'].includes(toolCall.status);
  const statusFail = ['failed', 'error'].includes(toolCall.status);
  const running = ['pending', 'running', 'in_progress'].includes(toolCall.status);

  let results = toolCall.results;
  try { if (typeof results === 'string') results = JSON.parse(results); } catch (_) {}

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-200/80 hover:bg-slate-300 text-slate-700"
      >
        {running ? <Loader2 className="w-3 h-3 animate-spin" /> :
         statusFail ? <span className="text-red-500">✕</span> :
         <span className="text-green-600">✓</span>}
        <span className="font-medium">{nome}</span>
        <span className="text-slate-500">{toolCall.status}</span>
      </button>
      {expanded && (
        <div className="mt-1 p-2 rounded-md bg-slate-100 space-y-2">
          {toolCall.arguments_string && (
            <div>
              <p className="font-medium text-slate-600 mb-0.5">Parâmetros:</p>
              <pre className="whitespace-pre-wrap break-words text-slate-700">{(() => {
                try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); }
                catch (_) { return toolCall.arguments_string; }
              })()}</pre>
            </div>
          )}
          {results !== undefined && results !== null && (
            <div>
              <p className="font-medium text-slate-600 mb-0.5">Resultado:</p>
              <pre className="whitespace-pre-wrap break-words text-slate-700">{typeof results === 'object' ? JSON.stringify(results, null, 2).slice(0, 800) : String(results).slice(0, 800)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function ChatAssistente({ agentName = 'assistente_societa' }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser-chat'],
    queryFn: () => base44.auth.me()
  });

  useEffect(() => {
    iniciarConversa();
  }, []);

  useEffect(() => {
    if (conversationId) {
      const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
        setMessages(data.messages || []);
        scrollToBottom();
      });
      return () => unsubscribe();
    }
  }, [conversationId]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const iniciarConversa = async (reset = false) => {
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: agentName,
        metadata: {
          name: `Conversa ${reset ? 'nova' : 'com'} ${user?.full_name || 'Usuário'}`,
          description: 'Assistente Societa.ai'
        }
      });
      setConversationId(conversation.id);
      setMessages([]);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    }
  };

  const enviarMensagem = async () => {
    if (!inputMessage.trim() || !conversationId || sending) return;
    setSending(true);
    const mensagemUsuario = inputMessage;
    setInputMessage('');
    try {
      const conversation = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: mensagemUsuario
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-12rem)] min-h-[500px] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Assistente Inteligente Societa.ai
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => iniciarConversa(true)}
            className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-1" /> Nova conversa
          </Button>
        </div>
        <p className="text-xs text-primary-foreground/80 mt-1 flex items-center gap-1">
          <Database className="w-3 h-3" /> Acessa registros, stakeholders, casos, riscos e agendas em tempo real
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !sending && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-16 h-16 text-muted-foreground/40 mb-4" />
              <p className="font-medium text-foreground mb-1">Olá! Sou seu assistente inteligente.</p>
              <p className="text-sm text-muted-foreground mb-4">
                Tenho acesso aos dados da plataforma para responder com base em informações reais.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full">
                {SUGESTOES.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => { setInputMessage(s.texto); }}
                      className="flex items-start gap-2 text-left p-3 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-sm"
                    >
                      <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{s.texto}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} rounded-2xl px-4 py-3`}>
                  {isUser ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content || ''}
                    </ReactMarkdown>
                  )}
                  {msg.tool_calls && msg.tool_calls.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.tool_calls.map((tool, tidx) => (
                        <FunctionDisplay key={tidx} toolCall={tool} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Processando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4 shrink-0">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), enviarMensagem())}
              placeholder="Pergunte sobre registros, stakeholders, casos, demandas..."
              disabled={sending || !conversationId}
            />
            <Button
              onClick={enviarMensagem}
              disabled={sending || !inputMessage.trim() || !conversationId}
              className="shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}