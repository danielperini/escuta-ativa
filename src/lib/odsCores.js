// Paleta oficial dos Objetivos de Desenvolvimento Sustentável (ODS)
// Usada apenas como acentos discretos: barras superiores de cards, badges, ícones e indicadores.
export const ODS_CORES = {
  1: '#E5243B', // Erradicação da pobreza
  2: '#DDA63A', // Fome zero
  3: '#4C9F38', // Saúde e bem-estar
  4: '#C5192D', // Educação de qualidade
  5: '#FF3A21', // Igualdade de gênero
  6: '#26BDE2', // Água potável
  7: '#FCC30B', // Energia limpa
  8: '#A21942', // Trabalho decente
  9: '#FD6925', // Indústria, inovação e infraestrutura
  10: '#DD1367', // Redução das desigualdades
  11: '#FD9D24', // Cidades e comunidades sustentáveis
  12: '#BF8B2E', // Consumo e produção responsáveis
  13: '#3F7E44', // Ação climática
  14: '#0A97D9', // Vida na água
  15: '#56C02B', // Vida terrestre
  16: '#00689D', // Paz, justiça e instituições eficazes
  17: '#19486A'  // Parcerias e meios de implementação
};

const PALETA_ACENTOS = Object.values(ODS_CORES);

// Mapeia um texto (tema, categoria, território, regiao) para uma cor estável da paleta.
export function corParaChave(texto) {
  if (!texto) return ODS_CORES[11];
  let h = 0;
  const s = String(texto);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETA_ACENTOS[h % PALETA_ACENTOS.length];
}

// Mapeia tipos de dica para cores e ícones ODS (acento discreto)
export const TIPO_DICA_META = {
  devolutiva: { cor: ODS_CORES[6], icone: 'ArrowLeftRight', label: 'Devolutiva' },
  presenca: { cor: ODS_CORES[11], icone: 'MapPin', label: 'Presença territorial' },
  recorrência: { cor: ODS_CORES[9], icone: 'Repeat', label: 'Recorrência' },
  stakeholders: { cor: ODS_CORES[5], icone: 'Users', label: 'Ampliar escuta' },
  compromissos: { cor: ODS_CORES[16], icone: 'CalendarClock', label: 'Compromissos' },
  sentimento: { cor: ODS_CORES[10], icone: 'HeartPulse', label: 'Sentimento' },
  riscos: { cor: ODS_CORES[1], icone: 'AlertTriangle', label: 'Riscos' },
  oportunidades: { cor: ODS_CORES[3], icone: 'Sparkles', label: 'Oportunidade' }
};