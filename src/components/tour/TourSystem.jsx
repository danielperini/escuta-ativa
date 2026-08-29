// TourSystem — coordena estado do Tour Guiado, Modal Manual e botão.
// Montado pelo Layout/ChatIA. Carrega user one-time e repassa prefs.
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { TOUR_VERSION } from '@/lib/tourModuleRegistry';
import BotaoTour from './BotaoTour';
import TourGuiado from './TourGuiado';
import ManualModal from './ManualModal';

export default function TourSystem() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [jaVisto, setJaVisto] = useState(true);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [tourLastStep, setTourLastStep] = useState(0);
  const [tourMode, setTourMode] = useState(null); // 'sidebar' | 'page' | null
  const [manualAberto, setManualAberto] = useState(false);
  const [manualCapitulo, setManualCapitulo] = useState(null);
  const [tourKey, setTourKey] = useState(0); // força remount em "Reiniciar"

  // Carrega user (uma vez)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (!mounted) return;
        setUser(u);
        const prefs = u?.configuracoes || {};
        const seenVersion = prefs.tour_version === TOUR_VERSION;
        setJaVisto(!!prefs.tour_seen && seenVersion);
        setTourCompleted(!!prefs.tour_completed && seenVersion);
        setTourLastStep(typeof prefs.tour_last_step === 'number' ? prefs.tour_last_step : 0);
      } catch {
        if (mounted) setJaVisto(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const routeAtual = (location.pathname.replace('/', '') || 'Dashboard').split('?')[0];

  const marcarVisto = useCallback(async () => {
    setJaVisto(true);
    try { await base44.auth.updateMe({ configuracoes: { tour_seen: true, tour_version: TOUR_VERSION } }); } catch {}
  }, []);

  const iniciarTourCompleto = useCallback(() => setTourMode('sidebar'), []);
  const iniciarTourPagina = useCallback(() => setTourMode('page'), []);
  const fecharTour = useCallback(() => setTourMode(null), []);

  // Callback do TourGuiado para atualizar último passo em memória (estado local reflete o persistido)
  const onTourStepChange = useCallback((step) => setTourLastStep(step), []);

  const abrirManual = useCallback((capitulo) => {
    setManualCapitulo(capitulo || routeAtual);
    setManualAberto(true);
  }, [routeAtual]);

  const fecharManual = useCallback(() => setManualAberto(false), []);

  const perguntarChat = useCallback((pergunta, moduloRoute) => {
    window.dispatchEvent(new CustomEvent('societa-tour-perguntar', {
      detail: { pergunta, modulo: moduloRoute, route: routeAtual },
    }));
  }, [routeAtual]);

  const reiniciarTour = useCallback(async () => {
    setTourMode(null); // fecha Tour existente (se houver)
    setTourCompleted(false);
    setTourLastStep(0);
    setTourKey(k => k + 1); // força remount
    try {
      await base44.auth.updateMe({
        configuracoes: {
          tour_seen: true, tour_completed: false, tour_last_step: 0, tour_version: TOUR_VERSION,
        },
      });
    } catch {}
    setTimeout(() => setTourMode('sidebar'), 60);
  }, []);

  return (
    <>
      <BotaoTour
        jaVisto={jaVisto}
        tourCompleted={tourCompleted}
        onIniciarTourCompleto={iniciarTourCompleto}
        onIniciarTourPagina={iniciarTourPagina}
        onAbrirManual={() => abrirManual(routeAtual)}
        onReiniciarTour={reiniciarTour}
        onMarcarVisto={marcarVisto}
      />
      {tourMode && (
        <TourGuiado
          key={tourKey}
          mode={tourMode}
          moduloAtual={routeAtual}
          userRole={user?.role}
          initialStep={tourMode === 'sidebar' ? tourLastStep : 0}
          onClose={fecharTour}
          onPerguntarChat={perguntarChat}
          onAbrirManual={(r) => { fecharTour(); abrirManual(r); }}
          onStepChange={onTourStepChange}
        />
      )}
      <ManualModal
        aberto={manualAberto}
        capituloInicial={manualCapitulo}
        onClose={fecharManual}
      />
    </>
  );
}