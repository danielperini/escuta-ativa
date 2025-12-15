import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, MessageCircle, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
    if (!conversationId) {
      iniciarConversa();
    }
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const iniciarConversa = async () => {
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: agentName,
        metadata: {
          name: `Conversa com ${user?.full_name || 'Usuário'}`,
          description: 'Assistente Societa.ai'
        }
      });
      setConversationId(conversation.id);
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
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-[#E31E24] to-[#FF4D52] text-white">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Assistente Inteligente Societa.ai
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">Olá! Sou seu assistente inteligente.</p>
              <p className="text-sm text-slate-400">
                Posso ajudar com análises, stakeholders, casos e muito mais.
              </p>
            </div>
          )}
          
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isUser ? 'bg-[#E31E24] text-white' : 'bg-slate-100 text-slate-900'} rounded-2xl px-4 py-3`}>
                  {isUser ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  )}
                  
                  {msg.tool_calls && msg.tool_calls.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.tool_calls.map((tool, tidx) => (
                        <Badge key={tidx} variant="secondary" className="text-xs">
                          {tool.name?.split('.').pop()} - {tool.status}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), enviarMensagem())}
              placeholder="Digite sua pergunta ou solicitação..."
              disabled={sending || !conversationId}
            />
            <Button 
              onClick={enviarMensagem}
              disabled={sending || !inputMessage.trim() || !conversationId}
              className="bg-[#E31E24] hover:bg-[#B01419]"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}