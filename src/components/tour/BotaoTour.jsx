// Botão flutuante do Tour (ônibus) + menu de ações.
// Fica imediatamente à esquerda do Chat IA.
// No primeiro acesso (tour_seen=false) exibe "🚌 Fazer Tour" por 10s e recolhe.
import React, { useState, useEffect, useRef } from 'react';
import { Bus, Play, FileText, BookOpen, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BotaoTour({
  jaVisto = true,
  tourCompleted = false,
  onIniciarTourCompleto,
  onIniciarTourPagina,
  onAbrirManual,
  onReiniciarTour,
  onMarcarVisto,
}) {
  const [expandido, setExpandido] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const containerRef = useRef(null);

  // Primeiro acesso — expande por 10 segundos
  useEffect(() => {
    if (!jaVisto) {
      setExpandido(true);
      const t1 = setTimeout(() => setExpandido(false), 10000);
      // Marca como visto (persistido) após 2s — não enche se o usuário não interagir
      const t2 = setTimeout(() => {
        onMarcarVisto?.();
      }, 2000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [jaVisto]);

  // Fecha menu ao clicar fora
  useEffect(() => {
    if (!menuAberto) return;
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuAberto]);

  const handleMenuAction = (action) => {
    setMenuAberto(false);
    if (action === 'completo') onIniciarTourCompleto?.();
    else if (action === 'pagina') onIniciarTourPagina?.();
    else if (action === 'manual') onAbrirManual?.();
    else if (action === 'reiniciar') onReiniciarTour?.();
    if (action === 'completo' || action === 'reiniciar') setExpandido(false);
  };

  const Icon = Bus;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setMenuAberto(!menuAberto)}
        title="Tour Guiado da societá.ai"
        aria-label="Tour Guiado"
        className={cn(
          "flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 text-primary border border-primary/30 shadow-md hover:bg-primary/5 hover:border-primary/60 active:scale-95 transition-all",
          expandido ? "px-3 py-3 pr-4" : "p-3"
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {expandido && (
          <span className="text-sm font-medium whitespace-nowrap pr-1 leading-none">
            Fazer Tour
          </span>
        )}
      </button>

      {menuAberto && (
        <div className="absolute bottom-full mb-2 right-0 w-64 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 bg-primary/10 border-b border-border">
            <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5" /> Tour Guiado
            </p>
            <p className="text-[10px] text-muted-foreground">Conheça a societá.ai</p>
          </div>
          <button onClick={() => handleMenuAction('completo')} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted text-left">
            <Play className="w-4 h-4 text-primary shrink-0" /> Iniciar Tour Completo
          </button>
          <button onClick={() => handleMenuAction('pagina')} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted text-left">
            <FileText className="w-4 h-4 text-primary shrink-0" /> Tour desta página
          </button>
          <button onClick={() => handleMenuAction('manual')} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted text-left">
            <BookOpen className="w-4 h-4 text-primary shrink-0" /> Manual do Usuário
          </button>
          <div className="border-t border-border" />
          <button onClick={() => handleMenuAction('reiniciar')} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted text-left">
            <RotateCcw className="w-4 h-4 text-primary shrink-0" /> Reiniciar Tour
          </button>
          {tourCompleted && (
            <div className="px-3 py-1.5 bg-emerald-50 text-[10px] text-emerald-700 border-t border-border">
              ✓ Você já completou o tour
            </div>
          )}
        </div>
      )}
    </div>
  );
}