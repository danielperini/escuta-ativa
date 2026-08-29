import React, { createContext, useContext, useState, useLayoutEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export const TEMAS = ['ponte', 'noite', 'mato', 'terra', 'perini', 'ods', 'agua'];

export const TEMA_INFO = {
  ponte: {
    nome: 'PONTE SOCIAL',
    descricao: 'Verde escuro, verde, verde claro e branco. Visual institucional, confiável e colaborativo.',
    swatches: ['#1B5E20', '#2E8B57', '#A5D6A7', '#FFFFFF'],
    dark: false,
  },
  noite: {
    nome: 'NOITE',
    descricao: 'Tema escuro sofisticado. Azul, verde e violeta como acentos.',
    swatches: ['#0B1115', '#111A20', '#2563EB', '#58B66B'],
    dark: true,
  },
  mato: {
    nome: 'MATO',
    descricao: 'Verde, branco e tons naturais. Território, natureza e ESG.',
    swatches: ['#276738', '#4F8A55', '#91C47C', '#F8FAF6'],
    dark: false,
  },
  terra: {
    nome: 'TERRA',
    descricao: 'Tons terrosos. Aparência acolhedora, territorial e institucional.',
    swatches: ['#6F432A', '#B96839', '#D9B88F', '#F7F2EA'],
    dark: false,
  },
  perini: {
    nome: 'PERINI PROJETOS',
    descricao: 'Laranja, preto e branco. Alto contraste, energético e contemporâneo.',
    swatches: ['#FF5A00', '#0B0B0B', '#FFFFFF', '#F5F5F5'],
    dark: false,
  },
  ods: {
    nome: 'ODS',
    descricao: 'Branco institucional premium. Acentos discretos das cores dos Objetivos de Desenvolvimento Sustentável.',
    swatches: ['#00689D', '#4C9F38', '#FCC30B', '#E5243B'],
    dark: false,
  },
  agua: {
    nome: 'ÁGUA',
    descricao: 'Azul profundo e preto. Visual contemporâneo, sofisticado e institucional.',
    swatches: ['#0A1A2F', '#1565C0', '#42A5F5', '#E3F2FD'],
    dark: false,
  },
};

const STORAGE_KEY = 'societa:tema_aparencia';
const DEFAULT_TEMA = 'ponte';

const ThemeContext = createContext({
  tema: DEFAULT_TEMA,
  setTema: () => {},
  temas: TEMAS,
});

function lerInicial() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s && TEMAS.includes(s)) return s;
  } catch (_) {}
  return DEFAULT_TEMA;
}

// Aplica o tema antes do primeiro paint para evitar flash.
if (typeof document !== 'undefined') {
  try {
    document.documentElement.setAttribute('data-theme', lerInicial());
  } catch (_) {
    document.documentElement.setAttribute('data-theme', DEFAULT_TEMA);
  }
}

export function ThemeProvider({ children }) {
  const [tema, setTemaState] = useState(lerInicial);

  // Atualiza o atributo + localStorage assim que o tema muda.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    try {
      localStorage.setItem(STORAGE_KEY, tema);
    } catch (_) {}
    // Habilita a transição suave após o primeiro paint (evita animar tudo no load).
    const t = setTimeout(() => document.documentElement.classList.add('theme-transitions'), 60);
    return () => clearTimeout(t);
  }, [tema]);

  // Reconcilia com a preferência persistida no usuário (Base44) uma única vez.
  useLayoutEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!ativo || !me) return;
        const pref = me.configuracoes?.tema_aparencia;
        if (pref && TEMAS.includes(pref) && pref !== tema) {
          setTemaState(pref);
          try { localStorage.setItem(STORAGE_KEY, pref); } catch (_) {}
        }
      } catch (_) {}
    })();
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTema = useCallback((novo) => {
    if (!TEMAS.includes(novo)) return;
    setTemaState(novo);
    (async () => {
      try {
        const me = await base44.auth.me();
        await base44.auth.updateMe({
          configuracoes: { ...(me?.configuracoes || {}), tema_aparencia: novo },
        });
      } catch (_) {}
    })();
  }, []);

  return (
    <ThemeContext.Provider value={{ tema, setTema, temas: TEMAS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTema = () => useContext(ThemeContext);