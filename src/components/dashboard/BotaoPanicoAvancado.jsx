import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, Settings2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function BotaoPanicoAvancado() {
  const queryClient = useQueryClient();
  const [pressTime, setPressTime] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [enviando, setEnviando] = useState(false);
  
  const pressIntervalRef = useRef(null);
  const clickTimeoutRef = useRef(null);
  
  const { data: user } = useQuery({
    queryKey: ['currentUser-panico'],
    queryFn: () => base44.auth.me()
  });

  const [config, setConfig] = useState({
    whatsapp_numero: '',
    mensagem_customizada: ''
  });

  useEffect(() => {
    if (user?.configuracoes?.botao_panico) {
      setConfig({
        whatsapp_numero: user.configuracoes.botao_panico.whatsapp_numero || '',
        mensagem_customizada: user.configuracoes.botao_panico.mensagem_customizada || ''
      });
    }
  }, [user]);

  const salvarConfigMutation = useMutation({
    mutationFn: async (novaConfig) => {
      await base44.auth.updateMe({
        configuracoes: {
          ...user?.configuracoes,
          botao_panico: novaConfig
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser-panico'] });
      alert('✓ Configurações do botão de pânico salvas!');
      setShowConfig(false);
    }
  });

  const handleMouseDown = () => {
    setIsPressed(true);
    pressIntervalRef.current = setInterval(() => {
      setPressTime(prev => {
        const newTime = prev + 100;
        if (newTime >= 15000) {
          dispararPanico();
          clearInterval(pressIntervalRef.current);
        }
        return newTime;
      });
    }, 100);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    setPressTime(0);
    if (pressIntervalRef.current) {
      clearInterval(pressIntervalRef.current);
    }
  };

  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 10) {
      dispararPanico();
      setClickCount(0);
    }

    // Reset contador após 3 segundos
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 3000);
  };

  const dispararPanico = async () => {
    if (enviando) return;

    const numeroWhatsApp = config.whatsapp_numero || user?.configuracoes?.botao_panico?.whatsapp_numero;
    
    if (!numeroWhatsApp) {
      alert('⚠️ Configure o número de WhatsApp nas configurações do botão de pânico!');
      setShowConfig(true);
      return;
    }

    const nomeAnalista = user?.full_name || 'Analista';
    const mensagemPadrao = `⚠️ *ALERTA DE EMERGÊNCIA* ⚠️\n\nO analista *${nomeAnalista}* solicita o seu apoio urgente.\n\nPor favor, entre em contato imediatamente.`;
    const mensagem = config.mensagem_customizada || user?.configuracoes?.botao_panico?.mensagem_customizada || mensagemPadrao;

    setEnviando(true);

    try {
      // Enviar via WhatsApp usando link direto
      const numeroLimpo = numeroWhatsApp.replace(/\D/g, '');
      const mensagemEncoded = encodeURIComponent(mensagem);
      const urlWhatsApp = `https://wa.me/${numeroLimpo}?text=${mensagemEncoded}`;
      
      window.open(urlWhatsApp, '_blank');

      // Log do acionamento
      await base44.entities.Notificacao.create({
        tipo: 'alerta_etico',
        titulo: '🚨 Botão de Pânico Acionado',
        mensagem: `${nomeAnalista} acionou o botão de pânico e solicitou apoio urgente.`,
        prioridade: 'alta',
        lida: false
      });

      // Mostrar mensagem de confirmação visual
      const mensagemConfirmacao = document.createElement('div');
      mensagemConfirmacao.className = 'fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-top';
      mensagemConfirmacao.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <div>
          <p class="font-bold text-lg">✓ Pânico Enviado!</p>
          <p class="text-sm">Mensagem de emergência enviada com sucesso</p>
        </div>
      `;
      document.body.appendChild(mensagemConfirmacao);
      setTimeout(() => mensagemConfirmacao.remove(), 5000);
    } catch (error) {
      alert('Erro ao enviar mensagem: ' + error.message);
    } finally {
      setEnviando(false);
      setIsPressed(false);
      setPressTime(0);
      setClickCount(0);
    }
  };

  const progressPercentage = (pressTime / 15000) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          onClick={handleClick}
          disabled={enviando}
          style={{ backgroundColor: '#C0392B' }}
          className="hover:opacity-90 text-white border-0 px-8 py-4 rounded-xl shadow-lg relative overflow-hidden"
        >
          {enviando ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 mr-2" />
              Botão de Pânico
              {clickCount > 0 && clickCount < 10 && (
                <span className="ml-2 text-xs bg-white text-red-600 px-2 py-0.5 rounded-full font-bold">
                  {clickCount}/10
                </span>
              )}
            </>
          )}
          
          {/* Barra de progresso */}
          {isPressed && (
            <div 
              className="absolute bottom-0 left-0 h-1 bg-yellow-300 transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
          )}
        </Button>

        {isPressed && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 rounded text-xs whitespace-nowrap">
            Mantenha pressionado: {Math.ceil((15000 - pressTime) / 1000)}s
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowConfig(true)}
        className="h-12 w-12"
      >
        <Settings2 className="w-5 h-5" />
      </Button>

      {/* Dialog de Configuração */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Configurações do Botão de Pânico
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <p className="font-semibold mb-1">Como funciona:</p>
              <ul className="space-y-1 text-xs">
                <li>• Pressione continuamente por <strong>15 segundos</strong></li>
                <li>• OU clique <strong>10 vezes consecutivas</strong></li>
                <li>• Uma mensagem será enviada via WhatsApp</li>
              </ul>
            </div>

            <div>
              <Label>Número de WhatsApp (com DDD)</Label>
              <Input
                value={config.whatsapp_numero}
                onChange={(e) => setConfig({ ...config, whatsapp_numero: e.target.value })}
                placeholder="Ex: 5511999999999"
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                Número do grupo ou contato que receberá o alerta
              </p>
            </div>

            <div>
              <Label>Mensagem Customizada (opcional)</Label>
              <Textarea
                value={config.mensagem_customizada}
                onChange={(e) => setConfig({ ...config, mensagem_customizada: e.target.value })}
                placeholder={`Deixe vazio para usar a mensagem padrão:\n\n"O analista [seu nome] solicita o seu apoio urgente. Por favor, entre em contato."`}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfig(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => salvarConfigMutation.mutate(config)}
              disabled={salvarConfigMutation.isPending || !config.whatsapp_numero}
              className="bg-red-600 hover:bg-red-700"
            >
              Salvar Configuração
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}