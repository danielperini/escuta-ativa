import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Quote, ChevronLeft, ChevronRight, ArrowRight, Pin, EyeOff, MapPin, Calendar,
  MessageSquare, Tag, Loader2
} from 'lucide-react';
import { corParaChave } from '@/lib/odsCores';

const ROTACAO_MS = 8000;

export default function VozesTerritorio({ vozes = [], controle, onControleChange, loading }) {
  const navigate = useNavigate();
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const touchStartX = useRef(null);

  // Filtra vozes ocultas e aplica fixada no topo
  const ocultas = controle?.vozes_ocultas || [];
  const fixadaId = controle?.voz_fixada_id;

  const visiveis = React.useMemo(() => {
    const lista = vozes.filter(v => v && v.registro_id && !ocultas.includes(v.registro_id));
    if (!fixadaId) return lista;
    const fixada = lista.find(v => v.registro_id === fixadaId);
    if (!fixada) return lista;
    return [fixada, ...lista.filter(v => v.registro_id !== fixadaId)];
  }, [vozes, ocultas, fixadaId]);

  useEffect(() => {
    if (indice >= visiveis.length) setIndice(0);
  }, [visiveis.length, indice]);

  const total = visiveis.length;
  const avancar = useCallback(() => setIndice(i => (i + 1) % Math.max(1, total)), [total]);
  const voltar = useCallback(() => setIndice(i => (i - 1 + total) % Math.max(1, total)), [total]);

  useEffect(() => {
    if (pausado || total <= 1) return;
    const t = setInterval(avancar, ROTACAO_MS);
    return () => clearInterval(t);
  }, [pausado, total, avancar]);

  const atual = visiveis[indice];

  const handleHide = async () => {
    if (!atual) return;
    const ocultasNovas = Array.from(new Set([...ocultas, atual.registro_id]));
    await onControleChange({ vozes_ocultas: ocultasNovas });
  };
  const handlePin = async () => {
    if (!atual) return;
    const novoId = fixadaId === atual.registro_id ? '' : atual.registro_id;
    await onControleChange({ voz_fixada_id: novoId || null });
  };

  // Swipe
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) { dx < 0 ? avancar() : voltar(); }
    touchStartX.current = null;
  };

  return (
    <section className="space-y-3" aria-label="Vozes do Território">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <MessageSquare className="w-4 h-4 text-primary" />
          </span>
          <h2 className="text-xl font-semibold text-foreground">Vozes do Território</h2>
        </div>
        <p className="text-sm text-muted-foreground">O que as pessoas estão dizendo — trechos reais extraídos dos registros</p>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {loading ? (
          <Card className="p-8 flex items-center justify-center min-h-[200px]">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </Card>
        ) : total === 0 ? (
          <Card className="p-8 text-center min-h-[200px] flex flex-col items-center justify-center">
            <Quote className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Não há falas elegíveis para exibir no momento.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Registros com descrições detalhadas serão automaticamente considerados.
            </p>
          </Card>
        ) : (
          <>
            <div className="relative min-h-[210px]">
              {atual && (
                <Card key={atual.registro_id + indice} className="overflow-hidden">
                  {/* Barra superior com cor de acento ODS (discreta) */}
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: corParaChave(atual.tema_principal || atual.comunidade) }}
                  />
                  <div className="p-5 md:p-6">
                    <div className="flex items-start gap-3">
                      <Quote className="w-7 h-7 text-primary/30 shrink-0 -ml-1" />
                      <div className="flex-1 min-w-0 space-y-3">
                        <p className="text-lg md:text-xl leading-relaxed text-foreground font-medium">
                          “{atual.trecho}”
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" /> {labelNatureza(atual.natureza)}
                          </span>
                          {atual.comunidade && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {atual.comunidade}
                            </span>
                          )}
                          {atual.tipo_interacao && (
                            <Badge variant="outline" className="text-[11px] font-normal capitalize">
                              {labelTipo(atual.tipo_interacao)}
                            </Badge>
                          )}
                          {atual.data && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {formatData(atual.data)}
                            </span>
                          )}
                          {atual.tema_principal && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Tema:</span> {atual.tema_principal}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground"
                            onClick={() => navigate(createPageUrl('VerRegistro') + `?id=${atual.registro_id}`)}
                          >
                            Ver registro original <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" onClick={handlePin}>
                            <Pin className={`w-3.5 h-3.5 mr-1 ${fixadaId === atual.registro_id ? 'fill-primary text-primary' : ''}`} />
                            {fixadaId === atual.registro_id ? 'Fixada' : 'Fixar'}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" onClick={handleHide}>
                            <EyeOff className="w-3.5 h-3.5 mr-1" /> Ocultar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {total > 1 && (
              <div className="flex items-center justify-center gap-3 mt-3">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={voltar} aria-label="Voltar">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1.5">
                  {visiveis.map((v, i) => (
                    <button
                      key={v.registro_id + i}
                      onClick={() => setIndice(i)}
                      aria-label={`Voz ${i + 1}`}
                      className={`h-2 rounded-full transition-all ${i === indice ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'}`}
                    />
                  ))}
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={avancar} aria-label="Avançar">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function labelNatureza(n) {
  switch (n) {
    case 'percepcao_necessidade': return 'Percepção / Necessidade';
    case 'preocupacao_demanda': return 'Preocupação / Demanda';
    case 'oportunidade_reconhecimento': return 'Oportunidade / Reconhecimento';
    default: return 'Manifestação';
  }
}
function labelTipo(t) {
  const m = {
    reuniao: 'Reunião',
    conversa_campo: 'Conversa de campo',
    visita: 'Visita',
    demanda: 'Demanda',
    ocorrencia: 'Ocorrência'
  };
  return m[t] || t || '';
}
function formatData(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (_) { return ''; }
}