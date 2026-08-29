import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Eye, EyeOff, Pin, PinOff, ThumbsDown, RefreshCw,
  ExternalLink, ChevronDown, ChevronUp, Settings2,
  Loader2, BookOpen, Database, Globe, AlertTriangle,
  MapPin, Lightbulb, MessageSquare, Shield, Info, X
} from 'lucide-react';
import ChipComunidade from '@/components/shared/ChipComunidade';

// ── Ícone SVG original do Botão do Pânico ──────────────────────────────────
const IconePanico = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ── Mapeamento de cor de acento ──────────────────────────────────────────────
const COR_CONFIG = {
  azul:    { borda: 'border-l-blue-500',  badge: 'bg-blue-100 text-blue-800',   icone: MessageSquare, label: 'Escuta/Diálogo' },
  laranja: { borda: 'border-l-orange-500', badge: 'bg-orange-100 text-orange-800', icone: AlertTriangle, label: 'Atenção' },
  verde:   { borda: 'border-l-green-500',  badge: 'bg-green-100 text-green-800',  icone: Lightbulb, label: 'Oportunidade' },
  vermelho: { borda: 'border-l-red-500',   badge: 'bg-red-100 text-red-800',      icone: Shield, label: 'Urgente' },
};

const FONTE_ICONE = {
  bibliografica: { icone: BookOpen, label: 'Biblioteca', tooltip: 'Relacionamento Comunitário: um Diálogo Social — Daniel Perini-Santos' },
  dados_internos: { icone: Database, label: 'Dados internos', tooltip: 'Baseado nos registros da plataforma' },
  web_publica: { icone: Globe, label: 'Fonte pública', tooltip: 'Baseado em fontes públicas verificadas' },
  combinada: { icone: Globe, label: 'Combinada', tooltip: 'Biblioteca + dados internos + fontes públicas' },
};

// ── Card de Orientação ───────────────────────────────────────────────────────
function CardOrientacao({ dica, onOcultar, onFixar, onNaoPertinente, onSolicitarNova }) {
  const [expandido, setExpandido] = useState(false);
  const cor = COR_CONFIG[dica.cor_acento] || COR_CONFIG.azul;
  const IconeCor = cor.icone;
  const fonteInfo = FONTE_ICONE[dica.fonte_tipo] || FONTE_ICONE.combinada;
  const IconeFonte = fonteInfo.icone;

  return (
    <div className={`relative bg-card rounded-lg border border-border border-l-4 ${cor.borda} p-4 shadow-sm transition-all`}>
      {/* Linha superior: badge + ações */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={`text-xs px-2 py-0.5 ${cor.badge} border-0`}>
            <IconeCor className="w-3 h-3 mr-1" />
            {cor.label}
          </Badge>
          {dica.fixada && (
            <Badge className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 border-0">
              <Pin className="w-3 h-3 mr-1" /> Fixado
            </Badge>
          )}
          {dica.territorio && (
            <ChipComunidade nome={dica.territorio} variant="neutro" />
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => onFixar(dica)} title={dica.fixada ? "Desafixar" : "Fixar"}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            {dica.fixada ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onNaoPertinente(dica)} title="Não pertinente"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onOcultar(dica)} title="Ocultar"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Título */}
      <p className="text-sm font-bold text-foreground tracking-wide mb-1">
        {dica.titulo}
      </p>

      {/* Texto principal */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {dica.texto}
      </p>

      {/* Expandir */}
      <button
        onClick={() => setExpandido(!expandido)}
        className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
      >
        {expandido ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expandido ? "Fechar" : "Entenda por quê"}
      </button>

      {/* Conteúdo expandido */}
      {expandido && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          {dica.texto_expandido && (
            <p className="text-sm text-foreground leading-relaxed">
              {dica.texto_expandido}
            </p>
          )}

          {/* Fonte */}
          <div className="flex items-start gap-2 bg-muted/50 rounded-md p-2">
            <IconeFonte className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Fonte: </span>
              {dica.fontes?.map((f, i) => (
                <span key={i}>
                  {f.url ? (
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5">
                      {f.titulo || fonteInfo.tooltip} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span>{f.titulo || fonteInfo.tooltip}</span>
                  )}
                  {f.tipo && <span className="ml-1 italic">({f.tipo.replace(/_/g, ' ').toLowerCase()})</span>}
                  {i < (dica.fontes?.length || 0) - 1 && '; '}
                </span>
              )) || fonteInfo.tooltip}
            </div>
          </div>

          {/* Data + confiança */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Análise: {dica.data_referencia || new Date().toLocaleDateString('pt-BR')}</span>
            <Badge className={`text-xs border-0 ${
              dica.nivel_confianca === 'alto' ? 'bg-green-100 text-green-700' :
              dica.nivel_confianca === 'medio' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              Confiança {dica.nivel_confianca}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function PainelOrientacaoTerritorial() {
  const queryClient = useQueryClient();
  const pressIntervalRef = useRef(null);
  const clickTimeoutRef = useRef(null);

  const [painelAberto, setPainelAberto] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [pressTime, setPressTime] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [enviandoPanico, setEnviandoPanico] = useState(false);
  const [gerandoNova, setGerandoNova] = useState(false);
  const [dicasOcultas, setDicasOcultas] = useState(new Set());
  const [configPanico, setConfigPanico] = useState({ whatsapp_numero: '', mensagem_customizada: '' });

  const { data: user } = useQuery({
    queryKey: ['currentUser-orientacao'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000
  });

  const hoje = new Date().toISOString().split('T')[0];

  const { data: dicas = [], isLoading, refetch } = useQuery({
    queryKey: ['dicas-territoriais-hoje', hoje],
    queryFn: async () => {
      // Tentar buscar do cache primeiro
      const existentes = await base44.entities.DicaTerritorial.filter({
        data_exibicao: hoje,
        selecionada_do_dia: true,
        oculta: false
      });
      if (existentes && existentes.length >= 3) return existentes.slice(0, 3);
      
      // Gerar novas se necessário
      const res = await base44.functions.invoke('gerarDicasTerritorial', {});
      const data = res?.data ?? res;
      return data?.dicas || [];
    },
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: painelAberto
  });

  useEffect(() => {
    if (user?.configuracoes?.botao_panico) {
      setConfigPanico({
        whatsapp_numero: user.configuracoes.botao_panico.whatsapp_numero || '',
        mensagem_customizada: user.configuracoes.botao_panico.mensagem_customizada || ''
      });
    }
  }, [user]);

  const salvarConfigMutation = useMutation({
    mutationFn: async (novaConfig) => {
      await base44.auth.updateMe({
        configuracoes: { ...user?.configuracoes, botao_panico: novaConfig }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser-orientacao'] });
      setShowConfig(false);
    }
  });

  const atualizarDicaMutation = useMutation({
    mutationFn: async ({ id, patch }) => {
      if (id) await base44.entities.DicaTerritorial.update(id, patch);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dicas-territoriais-hoje'] })
  });

  const handleOcultar = (dica) => {
    setDicasOcultas(prev => new Set([...prev, dica.id]));
    if (dica.id) atualizarDicaMutation.mutate({ id: dica.id, patch: { oculta: true } });
  };

  const handleFixar = (dica) => {
    if (dica.id) atualizarDicaMutation.mutate({ id: dica.id, patch: { fixada: !dica.fixada } });
  };

  const handleNaoPertinente = (dica) => {
    if (dica.id) atualizarDicaMutation.mutate({ id: dica.id, patch: { marcada_nao_pertinente: true, oculta: true } });
    setDicasOcultas(prev => new Set([...prev, dica.id]));
  };

  const handleSolicitarNova = async () => {
    setGerandoNova(true);
    try {
      await base44.functions.invoke('gerarDicasTerritorial', { forcar_nova: true });
      await refetch();
    } catch (_) {}
    setGerandoNova(false);
  };

  // ── Lógica do Botão do Pânico ──────────────────────────────────────────────
  const handleMouseDown = () => {
    setIsPressed(true);
    pressIntervalRef.current = setInterval(() => {
      setPressTime(prev => {
        const t = prev + 100;
        if (t >= 15000) { dispararPanico(); clearInterval(pressIntervalRef.current); }
        return t;
      });
    }, 100);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    setPressTime(0);
    if (pressIntervalRef.current) clearInterval(pressIntervalRef.current);
  };

  const handleClickPanico = () => {
    const n = clickCount + 1;
    setClickCount(n);
    if (n >= 10) { dispararPanico(); setClickCount(0); }
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => setClickCount(0), 3000);
  };

  const dispararPanico = async () => {
    if (enviandoPanico) return;
    const numero = configPanico.whatsapp_numero || user?.configuracoes?.botao_panico?.whatsapp_numero;
    if (!numero) { alert('⚠️ Configure o número de WhatsApp nas configurações!'); setShowConfig(true); return; }
    const nomeAnalista = user?.full_name || 'Analista';
    const mensagem = configPanico.mensagem_customizada ||
      `⚠️ *ALERTA DE EMERGÊNCIA* ⚠️\n\nO analista *${nomeAnalista}* solicita apoio urgente.\n\nPor favor, entre em contato imediatamente.`;
    setEnviandoPanico(true);
    try {
      const numeroLimpo = numero.replace(/\D/g, '');
      window.open(`https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');
      await base44.entities.Notificacao.create({
        tipo: 'alerta_etico', titulo: '🚨 Pânico Acionado',
        mensagem: `${nomeAnalista} acionou o botão de pânico.`, prioridade: 'alta', lida: false
      });
    } catch (_) {}
    setEnviandoPanico(false);
    setIsPressed(false); setPressTime(0); setClickCount(0);
  };

  const progresso = (pressTime / 15000) * 100;
  const dicasVisiveis = dicas.filter(d => !dicasOcultas.has(d.id) && !d.oculta);

  return (
    <>
      {/* ── Botão flutuante ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Botão principal: abre painel */}
        <button
          onClick={() => setPainelAberto(true)}
          aria-label="Orientações e alertas territoriais"
          title="Painel de Orientação Territorial"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground shadow-md hover:opacity-90 active:scale-95 transition-all text-sm font-semibold"
        >
          <Lightbulb className="w-4 h-4" />
          <span className="hidden sm:inline">Orientações Territoriais</span>
          <span className="sm:hidden">Orientações</span>
          {dicasVisiveis.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-primary text-xs font-bold flex items-center justify-center">
              {dicasVisiveis.length}
            </span>
          )}
        </button>

        {/* Botão de pânico compacto */}
        <div className="relative">
          <button
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            onClick={handleClickPanico}
            disabled={enviandoPanico}
            aria-label="Botão de pânico — emergência territorial"
            title="Segure 15s ou clique 10x para disparar alerta"
            className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-destructive text-destructive-foreground shadow-md hover:opacity-90 active:scale-95 transition-all overflow-hidden disabled:opacity-50"
          >
            {enviandoPanico
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <IconePanico className="w-4 h-4" />
            }
            {clickCount > 0 && clickCount < 10 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 text-black text-xs font-bold flex items-center justify-center leading-none">
                {clickCount}
              </span>
            )}
            {isPressed && (
              <div className="absolute bottom-0 left-0 h-1 bg-yellow-300 transition-all duration-100"
                style={{ width: `${progresso}%` }} />
            )}
          </button>
          {isPressed && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-0.5 rounded text-xs whitespace-nowrap z-10">
              {Math.ceil((15000 - pressTime) / 1000)}s
            </div>
          )}
        </div>

        {/* Config */}
        <button onClick={() => setShowConfig(true)} title="Configurar pânico"
          className="flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-background hover:bg-muted transition-colors">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* ── Painel lateral de Orientações ───────────────────────────────── */}
      {painelAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPainelAberto(false)} />

          {/* Painel */}
          <div className="relative w-full max-w-md bg-background shadow-2xl flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-border shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground">Painel de Orientação Territorial</h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Orientações práticas para relacionamento e gestão territorial
                </p>
              </div>
              <button onClick={() => setPainelAberto(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subtítulo / fonte */}
            <div className="px-5 py-3 bg-muted/30 border-b border-border shrink-0">
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  Base: "Relacionamento Comunitário" — Perini-Santos
                </span>
                <span className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" />
                  Dados internos da plataforma
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Gerando orientações do dia…</p>
                </div>
              ) : dicasVisiveis.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Lightbulb className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Nenhuma orientação visível</p>
                  <p className="text-xs text-muted-foreground">Todas as orientações do dia foram ocultadas.</p>
                  <Button size="sm" variant="outline" onClick={handleSolicitarNova} disabled={gerandoNova}>
                    {gerandoNova ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Gerar novas orientações
                  </Button>
                </div>
              ) : (
                <>
                  {dicasVisiveis.map((dica, i) => (
                    <CardOrientacao
                      key={dica.id || i}
                      dica={dica}
                      onOcultar={handleOcultar}
                      onFixar={handleFixar}
                      onNaoPertinente={handleNaoPertinente}
                      onSolicitarNova={handleSolicitarNova}
                    />
                  ))}

                  <div className="pt-2 flex justify-center">
                    <Button size="sm" variant="ghost" onClick={handleSolicitarNova} disabled={gerandoNova}
                      className="text-muted-foreground text-xs">
                      {gerandoNova
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Gerando...</>
                        : <><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Solicitar nova análise</>
                      }
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Rodapé: nota de integridade */}
            <div className="px-5 py-3 border-t border-border shrink-0 bg-muted/20">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  As orientações distinguem fatos verificados, percepções comunitárias e inferências da IA.
                  Nenhum conflito ou impacto é atribuído sem evidência.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Config Pânico ───────────────────────────────────────────────── */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconePanico className="w-5 h-5 text-destructive" />
              Configurar Botão de Emergência
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <p className="font-semibold mb-1">Como acionar:</p>
              <ul className="space-y-1">
                <li>• Pressione o ícone vermelho por <strong>15 segundos</strong></li>
                <li>• OU clique nele <strong>10 vezes consecutivas</strong></li>
              </ul>
            </div>
            <div>
              <Label>Número de WhatsApp (com código do país)</Label>
              <Input value={configPanico.whatsapp_numero}
                onChange={e => setConfigPanico({ ...configPanico, whatsapp_numero: e.target.value })}
                placeholder="Ex: 5531999999999" className="mt-1.5" />
            </div>
            <div>
              <Label>Mensagem personalizada (opcional)</Label>
              <Textarea value={configPanico.mensagem_customizada}
                onChange={e => setConfigPanico({ ...configPanico, mensagem_customizada: e.target.value })}
                placeholder="Deixe vazio para usar a mensagem padrão de emergência"
                rows={3} className="mt-1.5" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfig(false)}>Cancelar</Button>
            <Button onClick={() => salvarConfigMutation.mutate(configPanico)}
              disabled={salvarConfigMutation.isPending || !configPanico.whatsapp_numero}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {salvarConfigMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}