// Overlay do Tour Guiado: spotlight + painel lateral com Anterior/Próximo/Abrir módulo/Perguntar ao Chat IA/Fechar.
// mode='sidebar' percorre todos os módulos visíveis; mode='page' mostra o módulo atual.
// Preserva estado dos menus (abre sidebar mobile e fecha de volta). Pula etapa se elemento não for encontrado.
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ExternalLink, MessageSquareText, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  TOUR_VERSION, TOUR_GROUPS, getModulosVisiveis, getSidebarModules, getModuloByRoute, buildSidebarSelector
} from '@/lib/tourModuleRegistry';

export default function TourGuiado({
  mode,
  moduloAtual,
  userRole,
  initialStep = 0,
  onClose,
  onPerguntarChat,
  onAbrirManual,
  onStepChange,
}) {
  const navigate = useNavigate();
  // Retoma do último passo persistido (se válido)
  const [stepIdx, setStepIdx] = useState(() => {
    const s = Number(initialStep) || 0;
    return Number.isFinite(s) ? s : 0;
  });
  const [rect, setRect] = useState(null);
  const [panelPos, setPanelPos] = useState('right');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const sidebarAutoAbertaRef = useRef(false); // true quando abrimos programaticamente
  const updateFnRef = useRef(null);

  // Rastreia viewport para re-ativar setupStep quando cruza 1024px
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Constrói lista de passos — sidebar mode insere um passo de "grupo" antes do
  // primeiro subitem de cada grupo colapsável, e expande o grupo ao destacar cada subitem.
  const steps = useMemo(() => {
    if (mode === 'sidebar') {
      const mods = getSidebarModules(userRole);
      const out = [];
      let lastGroup = '__none__';
      mods.forEach(m => {
        const g = m.sidebar_group;
        if (g && g !== lastGroup) {
          const grp = TOUR_GROUPS.find(x => x.key === g);
          if (grp) {
            out.push({
              tipo: 'group',
              modulo: null,
              groupKey: grp.key,
              groupTitle: grp.title,
              title: grp.title,
              description: grp.description,
              features: [],
              selector: null,
              icon: grp.icon,
            });
          }
          lastGroup = g;
        }
        out.push({
          tipo: 'sidebar',
          modulo: m,
          groupKey: g,
          groupTitle: g ? (TOUR_GROUPS.find(x => x.key === g)?.title || null) : null,
          title: m.title,
          description: m.description,
          features: m.features,
          selector: buildSidebarSelector(m.route),
          icon: m.icon,
        });
      });
      return out;
    }
    if (mode === 'page' && moduloAtual) {
      const m = getModuloByRoute(moduloAtual);
      if (!m) return [];
      return [{
        tipo: 'page',
        modulo: m,
        title: m.title,
        description: m.description,
        features: m.features,
        // Foco genérico no conteúdo principal
        selector: 'main',
        icon: m.icon,
      }];
    }
    return [];
  }, [mode, moduloAtual, userRole]);

  // Fecha o sidebar mobile que abrimos automaticamente durante o Tour (se aplicável)
  useEffect(() => {
    if (steps.length === 0) return;
    return () => {
      if (sidebarAutoAbertaRef.current) {
        const overlay = document.querySelector('div.fixed.inset-0.z-40.bg-black\\/50');
        if (overlay) overlay.click();
        sidebarAutoAbertaRef.current = false;
      }
    };
  }, [steps]);

  // Para cada passo: posiciona spotlight e rastreia
  useEffect(() => {
    if (steps.length === 0) return;
    const step = steps[stepIdx];
    if (!step) return;
    let targetEl = null;
    let cancelled = false;

    const updateRect = () => {
      if (cancelled || !targetEl) { setRect(null); return; }
      const r = targetEl.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) { setRect(null); return; }
      setRect({
        top: r.top, left: r.left, width: r.width, height: r.height,
        bottom: r.bottom, right: r.right,
      });
      const vw = window.innerWidth, vh = window.innerHeight;
      const spaceRight = vw - r.right, spaceLeft = r.left;
      const spaceBelow = vh - r.bottom, spaceAbove = r.top;
      if (spaceRight > 340 && r.left < vw / 2) setPanelPos('right');
      else if (spaceLeft > 340 && r.right > vw / 2) setPanelPos('left');
      else if (spaceBelow > 260) setPanelPos('bottom');
      else if (spaceAbove > 260) setPanelPos('top');
      else setPanelPos('right');
    };
    updateFnRef.current = updateRect;

    // Garante que o grupo colapsável da sidebar esteja aberto. Retorna o botão do grupo.
    const ensureGroupExpanded = (groupTitle) => {
      if (!groupTitle) return null;
      const btns = Array.from(document.querySelectorAll('aside nav button[type="button"]'));
      const btn = btns.find(b => (b.innerText || '').trim().startsWith(groupTitle));
      if (!btn) return null;
      const childContainer = btn.parentElement.querySelector('.ml-2.border-l');
      const isOpen = !!(childContainer && childContainer.querySelector('a'));
      if (!isOpen) btn.click();
      return btn;
    };

    const setupStep = async () => {
      // Mobile: garante sidebar aberto para passos da sidebar/grupo
      if ((step.tipo === 'sidebar' || step.tipo === 'group') && isMobile) {
        const aside = document.querySelector('aside');
        const r = aside?.getBoundingClientRect();
        const visualmenteFechado = !aside || (r && r.right <= 0);
        if (visualmenteFechado) {
          const candidateBtns = Array.from(document.querySelectorAll('button.lg\\:hidden'));
          const menuBtn = candidateBtns.find(b => b.querySelector('svg.lucide-menu'));
          if (menuBtn) {
            menuBtn.click();
            sidebarAutoAbertaRef.current = true;
            await new Promise(r => setTimeout(r, 450));
          }
        }
      }

      // Passo de grupo: destaca o cabeçalho colapsável do grupo
      if (step.tipo === 'group') {
        targetEl = ensureGroupExpanded(step.groupTitle);
        if (!targetEl) { setRect(null); return; }
        try { targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }); } catch {}
        await new Promise(r => setTimeout(r, 400));
        updateRect();
        return;
      }

      // Passo de subitem: abre o grupo pai antes de localizar o link
      if (step.tipo === 'sidebar' && step.groupTitle) {
        ensureGroupExpanded(step.groupTitle);
        await new Promise(r => setTimeout(r, 220));
      }

      // Localiza alvo
      if (step.selector) {
        try { targetEl = document.querySelector(step.selector); } catch {}
      }
      if (!targetEl) { setRect(null); return; }

      // Rola até o elemento
      try { targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }); } catch {}
      await new Promise(r => setTimeout(r, 400));
      updateRect();
    };

    setupStep();

    // Listeners de movimento
    const onResize = () => updateFnRef.current && updateFnRef.current();
    const onScroll = () => updateFnRef.current && updateFnRef.current();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [stepIdx, steps, isMobile]);

  // Clamp inicial — se initialStep passou do limite, volta a 0
  useEffect(() => {
    if (steps.length > 0 && stepIdx >= steps.length) setStepIdx(0);
  }, [steps.length, stepIdx]);

  // Persiste tour_last_step e avisa TourSystem para manter em memória
  useEffect(() => {
    if (steps.length === 0) return;
    onStepChange?.(stepIdx);
    try {
      base44.auth.updateMe({ configuracoes: { tour_last_step: stepIdx, tour_version: TOUR_VERSION } });
    } catch {}
  }, [stepIdx, steps.length]);

  const handleNext = useCallback(() => {
    if (stepIdx === steps.length - 1) {
      try { base44.auth.updateMe({ configuracoes: { tour_completed: true, tour_seen: true, tour_version: TOUR_VERSION } }); } catch {}
      onClose();
    } else {
      setStepIdx(stepIdx + 1);
    }
  }, [stepIdx, steps.length, onClose]);

  const handlePrev = useCallback(() => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }, [stepIdx]);

  const handleAbrirModulo = useCallback(() => {
    const step = steps[stepIdx];
    if (step?.modulo) {
      navigate(createPageUrl(step.modulo.route));
      onClose();
    }
  }, [steps, stepIdx, navigate, onClose]);

  const handlePerguntar = useCallback(() => {
    const step = steps[stepIdx];
    if (step?.modulo) {
      onPerguntarChat?.(
        `Explique o módulo "${step.modulo.title}": ${step.modulo.description}`,
        step.modulo.route
      );
    }
  }, [steps, stepIdx, onPerguntarChat]);

  const handleAjuda = useCallback(() => {
    const step = steps[stepIdx];
    if (step?.modulo) {
      onAbrirManual?.(step.modulo.route);
    }
  }, [steps, stepIdx, onAbrirManual]);

  if (steps.length === 0) return null;

  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;
  const isFirst = stepIdx === 0;
  const StepIcon = step.icon;

  // Posição do painel
  const vw = window.innerWidth;
  const panelWidth = 320;
  const panelMaxHeight = 420;
  let panelStyle = {};
  if (rect) {
    const margin = 16;
    if (panelPos === 'right') {
      panelStyle = { top: Math.max(16, rect.top), left: Math.min(vw - panelWidth - 16, rect.right + margin), width: panelWidth };
    } else if (panelPos === 'left') {
      panelStyle = { top: Math.max(16, rect.top), right: vw - rect.left + margin, width: panelWidth };
    } else if (panelPos === 'bottom') {
      panelStyle = { top: rect.bottom + margin, left: Math.max(16, Math.min(rect.left, vw - panelWidth - 16)), width: panelWidth };
    } else { // top
      panelStyle = { top: Math.max(16, rect.top - panelMaxHeight - margin), left: Math.max(16, Math.min(rect.left, vw - panelWidth - 16)), width: panelWidth };
    }
    if ((panelStyle.top || 0) + panelMaxHeight > window.innerHeight - 16) {
      panelStyle.top = window.innerHeight - panelMaxHeight - 16;
    }
    if ((panelStyle.top || 0) < 16) panelStyle.top = 16;
  } else {
    // Sem alvo: centro da tela
    panelStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: panelWidth };
  }

  const overlay = (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Tour Guiado">
      {/* Click-catcher para fechar */}
      <div onClick={onClose} className="absolute inset-0 bg-transparent" />

      {/* Véus escurecedores com "buraco" no alvo */}
      {rect && (
        <>
          <div className="absolute bg-black/40" style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }} />
          <div className="absolute bg-black/40" style={{ top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }} />
          <div className="absolute bg-black/40" style={{ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height }} />
          <div className="absolute bg-black/40" style={{ top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }} />
          {/* Borda destacada */}
          <div
            className="absolute border-2 border-primary rounded-md pointer-events-none transition-all duration-200"
            style={{
              top: rect.top - 4, left: rect.left - 4,
              width: rect.width + 8, height: rect.height + 8,
              boxShadow: '0 0 0 4px rgba(255,255,255,0.25), 0 4px 24px 4px rgba(0,0,0,0.35)',
            }}
          />
        </>
      )}

      {/* Indicador flutuante sobre o alvo */}
      {rect && (
        <div
          className="absolute bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none shadow"
          style={{ top: Math.max(8, rect.top - 22), left: rect.left + 4 }}
        >
          {stepIdx + 1} / {steps.length}
        </div>
      )}

      {/* Painel lateral */}
      <div
        className={cn(
          "absolute bg-card border border-border rounded-xl shadow-2xl transition-all duration-200 max-h-[80vh] overflow-y-auto",
        )}
        style={panelStyle}
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <StepIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Passo {stepIdx + 1} de {steps.length}
                  {mode === 'page' && ' · Tour da página'}
                  {step.tipo === 'group' && ' · Grupo do menu'}
                </p>
                <h3 className="font-semibold text-base truncate">{step.title}</h3>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded shrink-0" aria-label="Fechar">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Para que serve */}
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Para que serve</p>
            <p className="text-sm mt-1">{step.description}</p>
          </div>

          {/* O que você encontra aqui (apenas em passos de módulo) */}
          {step.features?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">O que você encontra aqui</p>
              <ul className="mt-1 space-y-1">
                {step.features.map((f, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Aviso caso o alvo não tenha sido localizado */}
          {!rect && step.selector && (
            <div className="text-[10px] italic text-muted-foreground bg-muted/40 rounded px-2 py-1">
              Elemento não visível nesta tela — descrição exibida sem destaque.
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
            <Button size="sm" variant="outline" onClick={handlePrev} disabled={isFirst} className="h-7 text-xs">
              <ChevronLeft className="w-3 h-3 mr-1" /> Anterior
            </Button>
            <Button size="sm" variant="default" onClick={handleNext} className="h-7 text-xs">
              {isLast ? 'Concluir' : 'Próximo'}
              {!isLast && <ChevronRight className="w-3 h-3 ml-1" />}
            </Button>
            {step.modulo && (
              <Button size="sm" variant="outline" onClick={handleAbrirModulo} className="h-7 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" /> Abrir módulo
              </Button>
            )}
            {step.modulo && (
              <Button size="sm" variant="outline" onClick={handlePerguntar} className="h-7 text-xs">
                <MessageSquareText className="w-3 h-3 mr-1" /> Perguntar ao Chat IA
              </Button>
            )}
            {step.modulo && (
              <Button size="sm" variant="outline" onClick={handleAjuda} className="h-7 text-xs">
                <BookOpen className="w-3 h-3 mr-1" /> Ajuda
              </Button>
            )}
          </div>

          {/* Link Fechar */}
          <button
            onClick={onClose}
            className="text-[11px] text-muted-foreground hover:text-foreground underline w-full text-center"
          >
            Fechar Tour
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}