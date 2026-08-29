// Helper de labels/cores/persistência para o campo relationship_classification (frontend).
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

export const PRIMARY_OBJECTIVE_LABELS = {
  ESCUTA: 'Escuta',
  INFORMACAO: 'Informação',
  NEGOCIACAO: 'Negociação',
  ARTICULACAO: 'Articulação',
  CONSULTA: 'Consulta',
  MOBILIZACAO: 'Mobilização',
  GESTAO_DE_CONFLITO: 'Gestão de Conflito',
  ACOMPANHAMENTO: 'Acompanhamento',
  DELIBERACAO: 'Deliberação',
  PARCERIA: 'Parceria',
  OUTRO: 'Outro',
};

export function relacionamentoLabel(classificacao) {
  return RELACIONAMENTO_LABELS[classificacao] || classificacao || '';
}

export function relacionamentoBadgeClass(classificacao) {
  return RELACIONAMENTO_BADGE[classificacao] || 'bg-slate-100 text-slate-700';
}

export function objetivoLabel(objetivo) {
  return PRIMARY_OBJECTIVE_LABELS[objetivo] || objetivo || '';
}

// Limiar de confiança abaixo do qual a classificação deve ser sinalizada para revisão.
export const CONFIANCA_BAIXA = 70;

export function confiancaBaixa(confianca) {
  return typeof confianca === 'number' && confianca < CONFIANCA_BAIXA;
}

// Constrói o payload de campos planos a persistir a partir do formData.
// - Escolha manual (relationship_input != 'auto'): classificação manual (prioridade).
// - 'auto': preserva os campos planos que vieram da IA (do analisarNovoRegistro).
// - Retorna null quando não há nada a persistir (deixa o backend classificar).
export function classificacaoParaPersistir(formData, userEmail) {
  const input = formData?.relationship_input;
  if (input && input !== RELACIONAMENTO_AUTO) {
    return {
      relationship_classification: input,
      relationship_classification_source: 'manual',
      relationship_classification_confidence: 100,
      relationship_classification_reason: '',
      relationship_classification_updated_at: new Date().toISOString(),
      relationship_classification_user: userEmail || '',
    };
  }
  // auto: preserva classificação IA já presente (campos planos do analisarNovoRegistro)
  if (formData?.relationship_classification) {
    return {
      relationship_classification: formData.relationship_classification,
      relationship_classification_source: formData.relationship_classification_source || 'ia',
      relationship_classification_confidence: formData.relationship_classification_confidence ?? null,
      relationship_classification_reason: formData.relationship_classification_reason || '',
      relationship_classification_updated_at: formData.relationship_classification_updated_at || new Date().toISOString(),
      relationship_primary_objective: formData.relationship_primary_objective || 'OUTRO',
      relationship_community_signals: formData.relationship_community_signals || [],
      relationship_institutional_signals: formData.relationship_institutional_signals || [],
      relationship_classification_user: '',
    };
  }
  return null;
}