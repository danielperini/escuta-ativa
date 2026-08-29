import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
} from 'lucide-react';

const STORAGE_KEY = 'societa_chat_ia_historico_v1';

const SUGESTOES_DEFAULT = [
  'Quais são as principais demandas deste território?',
  'Quais registros ainda precisam de devolutiva?',
  'Como evoluiu o sentimento comunitário recentemente?',
  'Quais stakeholders são mais relevantes?',
];

const SUGESTOES_POR_PAGINA = {
  Registros: ['Resuma os registros recentes do território', 'Quais temas aparecem mais?', 'Quantos registros tivemos nos últimos 90 dias?', 'Quais demandas ainda estão sem devolutiva?'],
  Stakeholders: ['Quais stakeholders estão relacionados a demandas de água?', 'Atores mais influentes deste território?'],
  ComunidadesGrupos: ['Faça um perfil completo desta comunidade', 'Termômetro social atual das comunidades'],
  Mapa: ['Registros por localidade', 'Riscos territoriais no mapa'],
  Materialidade: ['Quais temas têm maior materialidade neste território?'],
  DadosSecundarios: ['Quais fontes do território estão disponíveis?', 'Compare indicadores sociais do território'],
  AnaliseDemografica: ['Demografia do município', 'Pirâmide etária e distribuição'],
  Dashboard: ['Resumo territorial completo', 'Riscos ativos no território'],
  VozComunidade: ['Quais vozes da comunidade estão em destaque?', 'Demandas mais urgentes'],
  GestorDemandas: ['Demandas em andamento', 'Demandas críticas'],
  Casos: ['Casos ativos do território', 'Casos de continuidade'],
  Agenda: ['Próximos compromissos', 'Compromissos atrasados'],
};

const MANUAL_TEXT = `### O que posso perguntar?

O Chat IA ajuda você a investigar comunidades e territórios usando os dados registrados na societá.ai e fontes públicas conectadas (IBGE, ANA, ANATEL, DATASUS, INEP, SICONFI, etc.).

**Exemplos:**
- *Quais são as principais demandas de Matozinhos?*
- *Resuma a situação da comunidade X.*
- *Compare Matozinhos e Arcos.*
- *Quais registros precisam de devolutiva?*
- *Cruze demandas de saúde com DATASUS.*
- *Quais conselhos municipais existem?*

**Classificação obrigatória:** toda resposta diferencia DADO INTERNO, DADO OFICIAL, PERCEPÇÃO COMUNITÁRIA, ALEGAÇÃO, INFERÊNCIA IA e HIPÓTESE PARA INVESTIGAÇÃO. Correlação não significa causalidade.

**Território:** informe o município no campo "Município (ex: Matozinhos/MG)" no topo. A IA usa o contexto da página atual automaticamente.`;

export default function ChatIA() {
  const [open, setOpen] = useState(false);
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
    if (open) setContextoPagina(window.location.pathname.replace('/', '') || 'Home');
  }, [open]);

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

  const enviar = async () => {
    if (!input.trim() || loading) return;
    const pergunta = input.trim();
    setInput('');
    const novas = [...mensagens, { role: 'user', content: pergunta }];
    setMensagens(novas);
    setLoading(true);
    try {
      const res = await base44.functions.invoke('chatIATerritorial', {
        pergunta,
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
    <>
      {/* Botão flutuante fixo à direita */}
      <button
        onClick={() => setOpen(true)}
        title="Pergunte à inteligência territorial"
        className="fixed right-4 lg:right-6 bottom-24 lg:bottom-8 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
      >
        <MessageSquareText className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">Chat IA</span>
        <Sparkles className="w-3.5 h-3.5 opacity-70" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between space-y-0">
            <div>
              <SheetTitle className="text-base flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-primary" /> Chat IA
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </SheetTitle>
              <SheetDescription className="text-xs">
                Pergunte sobre comunidades, territórios e dados da societá.ai
              </SheetDescription>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
              <X className="w-4 h-4" />
            </button>
          </SheetHeader>

          {/* Contexto do território + página */}
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
                <p className="text-xs text-muted-foreground">Sugestões de perguntas:</p>
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
                          onClick={() => setOpen(false)}
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
        </SheetContent>
      </Sheet>
    </>
  );
}