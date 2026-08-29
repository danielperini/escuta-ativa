import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { getModuloByRoute } from '@/lib/tourModuleRegistry';
import {
  MessageSquareText,
  Sparkles,
  Send,
  Loader2,
  HelpCircle,
  Plus,
  History,
  X,
  MapPin,
  Copy,
  Trash2,
  Lightbulb,
} from 'lucide-react';

const STORAGE_KEY = 'societa_chat_ia_historico_v1';

const SUGESTOES_DEFAULT = [
  'Quantas comunidades cadastradas aqui?',
  'Quais são as principais demandas deste território?',
  'Quais registros ainda precisam de devolutiva?',
  'Quais stakeholders são mais relevantes?',
];

const SUGESTOES_POR_PAGINA = {
  Registros: ['Quantos registros recentes?', 'Quais temas aparecem mais?', 'Quais demandas ainda estão sem devolutiva?'],
  Stakeholders: ['Quais stakeholders estão relacionados a demandas de água?', 'Atores mais influentes deste território?'],
  ComunidadesGrupos: ['Quantas comunidades cadastradas aqui?', 'Termômetro social atual das comunidades'],
  Mapa: ['Registros por localidade', 'Riscos territoriais no mapa'],
  Materialidade: ['Quais temas têm maior materialidade neste território?'],
  DadosSecundarios: ['Quais fontes do território estão disponíveis?', 'Compare indicadores sociais do território'],
  AnaliseDemografica: ['Demografia do município', 'Pirâmide etária e distribuição'],
  Dashboard: ['Quantas comunidades cadastradas aqui?', 'Riscos ativos no território'],
  VozComunidade: ['Quais vozes da comunidade estão em destaque?', 'Demandas mais urgentes'],
  GestorDemandas: ['Demandas em andamento', 'Demandas críticas'],
  Casos: ['Casos ativos do território', 'Casos de continuidade'],
  Agenda: ['Próximos compromissos', 'Compromissos atrasados'],
};

const MANUAL_TEXT = `### O que posso perguntar?

O Assistente IA ajuda você a investigar comunidades e territórios usando os dados registrados na societá.ai e fontes públicas conectadas (IBGE, ANA, ANATEL, DATASUS, INEP, SICONFI, etc.).

**Exemplos:**
- *Quantas comunidades cadastradas aqui?*
- *Quais são as principais demandas de Matozinhos?*
- *Resuma a situação da comunidade X.*
- *Compare Matozinhos e Arcos.*
- *Quais registros precisam de devolutiva?*
- *Cruze demandas de saúde com DATASUS.*

**Classificação obrigatória:** toda resposta diferencia DADO INTERNO, DADO OFICIAL, PERCEPÇÃO COMUNITÁRIA, ALEGAÇÃO, INFERÊNCIA IA e HIPÓTESE PARA INVESTIGAÇÃO. Correlação não significa causalidade.

**Território:** informe o município no campo "Município (ex: Matozinhos/MG)" no topo. A IA usa o contexto da página atual automaticamente; "aqui" se refere ao app/dados cadastrados.`;

export default function ChatIACore({ onCloseLink, className, contextoForcado, perguntaInicial, onPerguntaConsumida }) {
  const location = useLocation();
  const [mensagens, setMensagens] = useState([]);
  const [conversaAtual, setConversaAtual] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [mostrarManual, setMostrarManual] = useState(false);
  const [territorioInput, setTerritorioInput] = useState('');
  const [contextoPagina, setContextoPagina] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    setContextoPagina(contextoForcado || (location.pathname.replace('/', '').split('?')[0] || 'Home'));
  }, [contextoForcado, location.pathname]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, loading]);

  const salvarConversa = (msgs) => {
    setMensagens(msgs);
    if (msgs.length >= 2) {
      const id = conversaAtual?.id || Date.now().toString();
      const marker = msgs[0].content.slice(0, 60);
      const novo = { id, titulo: marker, msgs, data: new Date().toISOString() };
      try {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const idx = all.findIndex((c) => c.id === id);
        if (idx >= 0) all[idx] = novo;
        else all.unshift(novo);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 20)));
        setConversaAtual(novo);
      } catch (e) { /* ignore */ }
    }
  };

  const novaConversa = () => {
    setMensagens([]);
    setConversaAtual(null);
    setMostrarHistorico(false);
  };

  const abrirConversa = (c) => {
    setMensagens(c.msgs || []);
    setConversaAtual(c);
    setMostrarHistorico(false);
  };

  const excluirConversa = (id) => {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) { /* ignore */ }
    if (conversaAtual?.id === id) novaConversa();
  };

  const copiarResposta = (texto) => {
    navigator.clipboard?.writeText(texto).catch(() => {});
  };

  // Envia uma pergunta — recebe o texto pronto (usado por enviar(), Explique esta tela e Tour)
  const enviarPergunta = async (pergunta) => {
    if (!pergunta || !pergunta.trim() || loading) return;
    const novas = [...mensagens, { role: 'user', content: pergunta.trim() }];
    setMensagens(novas);
    setLoading(true);
    try {
      const res = await base44.functions.invoke('chatIATerritorial', {
        pergunta: pergunta.trim(),
        municipio: territorioInput.split('/')[0].trim(),
        uf: territorioInput.includes('/') ? territorioInput.split('/')[1].trim() : '',
        ibge: '',
        contextoPagina,
        historico: mensagens.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      });
      const data = res.data || res;
      const resposta = data.resposta || data.error || 'Sem resposta';
      const final = [
        ...novas,
        {
          role: 'assistant',
          content: resposta,
          fontesInternas: data.fontesInternas || [],
          fontesPublicas: data.fontesPublicas || [],
          territorio: data.territorio,
        },
      ];
      salvarConversa(final);
    } catch (e) {
      salvarConversa([...novas, { role: 'assistant', content: 'Erro temporário de conexão: ' + (e.message || 'falha na chamada') }]);
    } finally {
      setLoading(false);
    }
  };

  const enviar = () => {
    if (!input.trim() || loading) return;
    const pergunta = input.trim();
    setInput('');
    enviarPergunta(pergunta);
  };

  // "Explique esta tela": usa o Manual (TourModuleRegistry) como fonte prioritária + envia contexto ao backend
  const explicarTela = () => {
    const modulo = getModuloByRoute(contextoPagina);
    const descManual = modulo
      ? `Módulo "${modulo.title}": ${modulo.description}. Principais recursos: ${(modulo.features || []).slice(0, 5).join('; ')}.`
      : '';
    const pergunta = `Explique a funcionalidade desta tela (${contextoPagina}). Descreva o que ela faz, seus principais controles e como posso usá-la na prática. Contexto do manual: ${descManual}`;
    enviarPergunta(pergunta);
  };

  // Recebe pergunta forçada do Tour Guiado
  useEffect(() => {
    if (perguntaInicial) {
      enviarPergunta(perguntaInicial);
      onPerguntaConsumida?.();
    }
  }, [perguntaInicial]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  const sugestoes = SUGESTOES_POR_PAGINA[contextoPagina] || SUGESTOES_DEFAULT;

  const historicoLista = (() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  })();

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Contexto do território + página + ações */}
      <div className="px-4 py-2 border-b border-border text-xs space-y-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
          <input
            value={territorioInput}
            onChange={(e) => setTerritorioInput(e.target.value)}
            placeholder="Município (ex: Matozinhos/MG)"
            className="flex-1 h-7 bg-background border border-border rounded px-2 text-xs"
          />
        </div>
        <div className="text-muted-foreground">
          📄 Página atual: <span className="font-medium text-foreground">{contextoPagina || '—'}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={novaConversa} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Nova
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMostrarHistorico(!mostrarHistorico)} className="h-7 text-xs">
            <History className="w-3 h-3 mr-1" /> Histórico
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMostrarManual(!mostrarManual)} className="h-7 text-xs">
            <HelpCircle className="w-3 h-3 mr-1" /> Como usar
          </Button>
          <Button size="sm" variant="secondary" onClick={explicarTela} className="h-7 text-xs" title="Explica a tela atual usando o Manual">
            <Lightbulb className="w-3 h-3 mr-1" /> Explique esta tela
          </Button>
        </div>
      </div>

      {/* Manual */}
      {mostrarManual && (
        <div className="px-4 py-3 border-b border-border bg-amber-50 text-xs text-amber-900 overflow-y-auto max-h-56">
          <ReactMarkdown>{MANUAL_TEXT}</ReactMarkdown>
        </div>
      )}

      {/* Histórico */}
      {mostrarHistorico && (
        <div className="px-4 py-3 border-b border-border bg-muted/30 max-h-60 overflow-y-auto space-y-1">
          {historicoLista.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma conversa salva.</p>
          ) : (
            historicoLista.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 py-1">
                <button onClick={() => abrirConversa(c)} className="flex-1 text-left text-xs truncate hover:underline">
                  {c.titulo}
                </button>
                <button onClick={() => excluirConversa(c.id)} className="text-red-500 hover:text-red-700" aria-label="Excluir conversa">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-background">
        {mensagens.length === 0 && !loading && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Perguntas sugeridas:</p>
            {sugestoes.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="block w-full text-left text-xs px-3 py-2 rounded-md bg-muted/40 hover:bg-muted text-foreground border border-border"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {mensagens.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                m.role === 'user'
                  ? 'max-w-[88%] rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground'
                  : 'max-w-[88%] rounded-lg px-3 py-2 text-sm bg-muted/40 border border-border'
              }
            >
              <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0 [&_h2]:text-sm [&_h2]:mt-2 [&_h2]:mb-1">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>

              {m.role === 'assistant' && m.content && (
                <div className="mt-1">
                  <button
                    onClick={() => copiarResposta(m.content)}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copiar resposta
                  </button>
                </div>
              )}

              {m.fontesInternas && m.fontesInternas.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Registros relacionados</p>
                  {m.fontesInternas.map((f, j) => (
                    <Link
                      key={j}
                      to={
                        (f.tipo === 'stakeholder' ? createPageUrl('Stakeholders') : createPageUrl('VerRegistro')) +
                        (f.tipo === 'registro' ? `?id=${f.id}` : '')
                      }
                      onClick={() => { if (onCloseLink) onCloseLink(); }}
                      className="block text-[11px] text-blue-600 underline truncate"
                    >
                      ↳ Ver {f.tipo}: {f.titulo}
                    </Link>
                  ))}
                </div>
              )}

              {m.fontesPublicas && m.fontesPublicas.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Fontes públicas</p>
                  {m.fontesPublicas.map((f, j) => (
                    <a
                      key={j}
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-[11px] text-blue-600 underline truncate"
                    >
                      ↳ {f.fonte}{f.referencia ? ` (${f.referencia})` : ''}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2 text-sm bg-muted/40 border border-border flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Pensando…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-background">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Pergunte qualquer coisa sobre o território..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={enviar} disabled={loading || !input.trim()} size="icon">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
          Respostas podem conter inferências da IA; confira sempre as fontes. Correlação não implica causalidade.
        </p>
      </div>
    </div>
  );
}