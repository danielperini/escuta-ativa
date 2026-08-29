// Helper de labels/cores para o campo relationship_classification (frontend).
// A lógica de IA vive em base44/shared/relationshipClassification.ts.

export const RELACIONAMENTO_LABELS = {
  COMUNITARIO: 'Relacionamento Comunitário',
  INSTITUCIONAL: 'Relacionamento Institucional',
  COMUNITARIO_INSTITUCIONAL: 'Relacionamento Comunitário e Institucional',
};

export const RELACIONAMENTO_KEYS = ['COMUNITARIO', 'INSTITUCIONAL', 'COMUNITARIO_INSTITUCIONAL'];

// Valor padrão do seletor no formulário quando o usuário não escolhe manualmente.
export const RELACIONAMENTO_AUTO = 'auto';

export const RELACIONAMENTO_OPCOES_FORM = [
  { value: 'auto', label: 'Classificar automaticamente com IA' },
  { value: 'COMUNITARIO', label: 'Relacionamento Comunitário' },
  { value: 'INSTITUCIONAL', label: 'Relacionamento Institucional' },
  { value: 'COMUNITARIO_INSTITUCIONAL', label: 'Relacionamento Comunitário e Institucional' },
];

// Badge classes (mesmo padrão visual dos badges de tipo/sentimento já usados).
export const RELACIONAMENTO_BADGE = {
  COMUNITARIO: 'bg-emerald-100 text-emerald-700',
  INSTITUCIONAL: 'bg-indigo-100 text-indigo-700',
  COMUNITARIO_INSTITUCIONAL: 'bg-teal-100 text-teal-800',
};

export function relacionamentoLabel(classificacao) {
  return RELACIONAMENTO_LABELS[classificacao] || classificacao || '';
}

export function relacionamentoBadgeClass(classificacao) {
  return RELACIONAMENTO_BADGE[classificacao] || 'bg-slate-100 text-slate-700';
}

// Constrói o objeto relationship_classification a persistir a partir do formData.
// - Se o usuário escolheu uma opção manual (diferente de 'auto'), gera classificação manual.
// - Se escolheu 'auto', mantém a classificação que veio da IA (se houver).
// - Retorna null quando não há nada a persistir (deixa a IA classificar depois).
export function classificacaoParaPersistir(formData, userEmail) {
  const input = formData?.relationship_input;
  if (input && input !== 'auto') {
    return {
      classificacao: input,
      origem: 'manual',
      data_classificacao: new Date().toISOString(),
      confianca_ia: null,
      justificativa: '',
      usuario_responsavel: userEmail || '',
    };
  }
  // auto: preserva classificação IA já presente (do analisarNovoRegistro)
  if (formData?.relationship_classification) {
    return formData.relationship_classification;
  }
  return null;
}