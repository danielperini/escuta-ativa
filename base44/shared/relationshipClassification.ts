import OpenAI from 'npm:openai@4.68.0';
import { secrets } from 'base44:runtime';

// ===================================================================
// relationshipClassification.ts — Lógica compartilhada de classificação
// do tipo de relacionamento (Comunitário / Institucional / ambos).
//
// Campos (planos) persistidos no Registro:
//   relationship_classification          — COMUNITARIO | INSTITUCIONAL | COMUNITARIO_INSTITUCIONAL
//   relationship_classification_source   — manual | ia | retroativo_ia
//   relationship_classification_confidence — 0-100
//   relationship_classification_reason    — justificativa curta
//   relationship_classification_updated_at — ISO date-time
//   relationship_classification_user      — email quando manual
//   relationship_primary_objective        — ESCUTA | INFORMACAO | ... | OUTRO
//   relationship_community_signals         — sinais comunitários detectados
//   relationship_institutional_signals     — sinais institucionais detectados
//
// Regra de prioridade: classificação MANUAL nunca é sobrescrita pela IA.
// Evidências (ata, transcrição, lista de presença, fotografia) não geram
// classificação independente — herdam a do registro principal.
// ===================================================================

export const CLASSIFICACAO_VALUES = ['COMUNITARIO', 'INSTITUCIONAL', 'COMUNITARIO_INSTITUCIONAL'] as const;

export const PRIMARY_OBJECTIVE_VALUES = [
  'ESCUTA', 'INFORMACAO', 'NEGOCIACAO', 'ARTICULACAO', 'CONSULTA',
  'MOBILIZACAO', 'GESTAO_DE_CONFLITO', 'ACOMPANHAMENTO', 'DELIBERACAO',
  'PARCERIA', 'OUTRO',
] as const;

export const RELACIONAMENTO_RULES = `Você é o classificador de TIPO DE RELACIONAMENTO da societá.ai — Plataforma de relacionamento comunitário.

Classifique a atividade territorial em UMA das três categorias:

- COMUNITARIO — Relacionamento Comunitário
- INSTITUCIONAL — Relacionamento Institucional
- COMUNITARIO_INSTITUCIONAL — Relacionamento Comunitário e Institucional

_RELACIONAMENTO COMUNITÁRIO_ quando a finalidade principal for diálogo, escuta ou atuação junto a: comunidades, moradores, lideranças comunitárias, associações de moradores, coletivos territoriais, grupos comunitários, pessoas diretamente impactadas, públicos de determinado território. Fortes indicadores: assembleia comunitária, reunião com moradores, escuta, diálogo social, visita comunitária, consulta à comunidade, mobilização, encontro comunitário, reunião territorial, demanda comunitária.

_RELACIONAMENTO INSTITUCIONAL_ quando a finalidade principal for articulação entre instituições: prefeitura, secretarias, órgãos públicos, Ministério Público, Defensoria Pública, Câmara Municipal, universidades, empresas, fundações, OSCs, conselhos, entidades parceiras.

_COMUNITÁRIO E INSTITUCIONAL_ apenas quando os DOIS componentes forem materialmente relevantes para o OBJETIVO da atividade.

REGRAS CRÍTICAS:
1. NÃO classifique como misto apenas porque um representante institucional participou de uma atividade comunitária. A presença isolada não transforma a classificação.
2. O OBJETIVO PRINCIPAL da atividade determina a classificação — em ordem: objetivo declarado, título, descrição, transcrição, ata, participantes, lista de presença, organizações, território, documentos, evidências.
3. Exemplo: assembleia sobre uma ponte com moradores de Aimorés continua COMUNITARIO mesmo com a prefeitura presente, se a finalidade for ouvir a comunidade.
4. Ata, transcrição, lista de presença e fotografia são EVIDÊNCIAS — não geram classificação independente; herdam a do registro principal.
5. Quando houver lista de presença, estime perfil_comunitario_percentual e perfil_institucional_percentual, mas NÃO decida só pela proporção — o objetivo prevalece.

Retorne SOMENTE JSON:
{"classification":"COMUNITARIO|INSTITUCIONAL|COMUNITARIO_INSTITUCIONAL","confidence":0-100,"reason":"string curta em português","primary_objective":"ESCUTA|INFORMACAO|NEGOCIACAO|ARTICULACAO|CONSULTA|MOBILIZACAO|GESTAO_DE_CONFLITO|ACOMPANHAMENTO|DELIBERACAO|PARCERIA|OUTRO","community_signals":["string"],"institutional_signals":["string"],"mixed_relevance":boolean}`;

// Monta o contexto textual utilizado pela IA para classificar.
// Considera: título, descrição, tipo, território, participantes, organizações,
// stakeholders, transcrição, ata, documentos, evidências e temas.
export function montarContextoClassificacao(registro: any): string {
  const partes: string[] = [];
  if (registro?.titulo) partes.push(`Título: ${registro.titulo}`);
  if (registro?.tipo) partes.push(`Tipo da atividade: ${registro.tipo}`);
  if (registro?.descricao) partes.push(`Descrição: ${(registro.descricao || '').slice(0, 3000)}`);
  const territorio = [registro?.comunidade, registro?.localizacao?.municipio, registro?.localizacao?.estado]
    .filter(Boolean).join(' - ');
  if (territorio) partes.push(`Território: ${territorio}`);
  if (registro?.participantes?.length) partes.push(`Participantes: ${registro.participantes.join(', ')}`);
  if (registro?.organizacao) partes.push(`Organização: ${registro.organizacao}`);
  if (registro?.grupo_coletivo) partes.push(`Grupo/Coletivo: ${registro.grupo_coletivo}`);
  if (registro?.liderancas_vinculadas?.length) partes.push(`Lideranças vinculadas: ${registro.liderancas_vinculadas.length}`);
  if (registro?.organizacoes_vinculadas?.length) partes.push(`Organizações vinculadas: ${registro.organizacoes_vinculadas.length}`);
  if (registro?.temas_identificados?.length) partes.push(`Temas identificados: ${registro.temas_identificados.join(', ')}`);
  if (registro?.tipo_demanda) partes.push(`Tipo de demanda: ${registro.tipo_demanda}`);
  if (registro?.demandas?.length) {
    partes.push(`Demandas: ${registro.demandas.map((d: any) => d?.descricao).filter(Boolean).join('; ')}`);
  }
  if (registro?.transcricao) partes.push(`Transcrição: ${(registro.transcricao).slice(0, 4000)}`);
  if (registro?.ata_gerada) partes.push(`Ata: ${(registro.ata_gerada).slice(0, 4000)}`);
  if (registro?.arquivos?.length) {
    const nomes = registro.arquivos.map((a: any) => a?.nome).filter(Boolean);
    if (nomes.length) partes.push(`Documentos/evidências anexos: ${nomes.join(', ')}`);
    const transcricoes = registro.arquivos.map((a: any) => a?.transcricao).filter(Boolean).join(' \n');
    if (transcricoes) partes.push(`Transcrições de anexos: ${transcricoes.slice(0, 3000)}`);
  }
  return partes.join('\n');
}

// Chama a IA (OpenAI) e devolve a classificação estruturada.
export async function classificarRelacionamentoViaIA(
  openai: OpenAI,
  registro: any
): Promise<{
  classification: string;
  confidence: number;
  reason: string;
  primary_objective: string;
  community_signals: string[];
  institutional_signals: string[];
  mixed_relevance: boolean;
}> {
  const contexto = montarContextoClassificacao(registro);
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: RELACIONAMENTO_RULES },
      {
        role: 'user',
        content: `Classifique o tipo de relacionamento da atividade abaixo.\n\n${contexto}\n\nRetorne SOMENTE o JSON especificado.`,
      },
    ],
  });
  const raw = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(raw);
  const classification = CLASSIFICACAO_VALUES.includes(parsed.classification)
    ? parsed.classification
    : 'COMUNITARIO';
  const confidence = typeof parsed.confidence === 'number'
    ? Math.max(0, Math.min(100, Math.round(parsed.confidence)))
    : 60;
  const primary_objective = PRIMARY_OBJECTIVE_VALUES.includes(parsed.primary_objective)
    ? parsed.primary_objective
    : 'OUTRO';
  return {
    classification,
    confidence,
    reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    primary_objective,
    community_signals: Array.isArray(parsed.community_signals) ? parsed.community_signals : [],
    institutional_signals: Array.isArray(parsed.institutional_signals) ? parsed.institutional_signals : [],
    mixed_relevance: !!parsed.mixed_relevance,
  };
}

// True quando a classificação atual NÃO é manual (pode ser sobrescrita pela IA).
export function podeSobrescreverClassificacao(registro: any): boolean {
  const source = registro?.relationship_classification_source;
  return source !== 'manual';
}

// Constrói o payload de campos planos a persistir a partir da análise da IA.
export function montarClassificacaoIA(
  analise: any,
  source: 'ia' | 'retroativo_ia' = 'ia'
): any {
  return {
    relationship_classification: analise.classification,
    relationship_classification_source: source,
    relationship_classification_confidence: analise.confidence,
    relationship_classification_reason: analise.reason,
    relationship_classification_updated_at: new Date().toISOString(),
    relationship_classification_user: '',
    relationship_primary_objective: analise.primary_objective || 'OUTRO',
    relationship_community_signals: analise.community_signals || [],
    relationship_institutional_signals: analise.institutional_signals || [],
  };
}

// Constrói o payload para uma classificação MANUAL.
export function montarClassificacaoManual(classificacao: string, usuarioEmail: string, razao = ''): any {
  return {
    relationship_classification: classificacao,
    relationship_classification_source: 'manual',
    relationship_classification_confidence: 100,
    relationship_classification_reason: razao,
    relationship_classification_updated_at: new Date().toISOString(),
    relationship_classification_user: usuarioEmail || '',
  };
}

// Registra auditoria da alteração de classificação no HistoricoAuditoria.
export async function registrarAuditoriaClassificacao(
  base44: any,
  entidadeId: string,
  anterior: any,
  nova: any
): Promise<void> {
  try {
    const valorAnterior = anterior?.relationship_classification
      ? `${anterior.relationship_classification} (${anterior.relationship_classification_source || 'ia'})`
      : 'sem classificação';
    const valorNovo = `${nova.relationship_classification} (${nova.relationship_classification_source})`;
    await base44.entities.HistoricoAuditoria.create({
      entidade_tipo: 'Registro',
      entidade_id: entidadeId,
      campo_alterado: 'relationship_classification',
      valor_anterior: valorAnterior,
      valor_novo: valorNovo,
      tipo_operacao: 'atualizacao',
      usuario_responsavel: nova.relationship_classification_user || 'sistema_ia',
      justificativa: nova.relationship_classification_reason || '',
      fonte_origem: nova.relationship_classification_source === 'ia'
        ? 'classificacao_ia'
        : nova.relationship_classification_source === 'retroativo_ia'
        ? 'classificacao_retroativa_ia'
        : 'classificacao_manual',
    });
  } catch (e) {
    // auditoria é best-effort: não derrubar o fluxo principal
  }
}