// Referenciais ESG disponíveis na societá.ai.
// Foco: relacionamento comunitário, engajamento de stakeholders, direitos humanos,
// impacto social e gestão territorial. Não é um módulo de certificações ambientais.

export const REFERENCIAIS_ESG = [
  { id: 'GRI', nome: 'GRI', descricao: 'Global Reporting Initiative — padrões de relato de sustentabilidade.' },
  { id: 'Pacto Global', nome: 'Pacto Global da ONU', descricao: 'Dez princípios nas áreas de direitos humanos, trabalho, meio ambiente e anticorrupção.' },
  { id: 'ODS', nome: 'ODS', descricao: 'Objetivos de Desenvolvimento Sustentável da ONU.' },
  { id: 'ISO 26000', nome: 'ISO 26000', descricao: 'Diretrizes de responsabilidade social.' },
  { id: 'IFC Performance Standards', nome: 'IFC Performance Standards', descricao: 'Padrões de desempenho socioambiental do IFC.' },
  { id: 'Princípios do Equador', nome: 'Princípios do Equador', descricao: 'Gerenciamento de risco socioambiental em projetos financiados.' },
  { id: 'AA1000', nome: 'AA1000 Stakeholder Engagement Standard', descricao: 'Padrão de engajamento de stakeholders.' },
  { id: 'Direitos Humanos / UNGP', nome: 'Direitos Humanos / UNGP', descricao: 'UN Guiding Principles on Business and Human Rights.' },
  { id: 'Outro', nome: 'Outro', descricao: 'Outro referencial relacionado a relacionamento comunitário e impacto social.' },
];

// Detalhamento interno do GRI (não aparece como compromisso independente).
export const GRI_DETALHAMENTO = [
  { codigo: 'GRI 2-29', nome: 'GRI 2-29 – Approach to stakeholder engagement', descricao: 'Engajamento e relacionamento com stakeholders.' },
  { codigo: 'GRI 413', nome: 'GRI 413 – Local Communities', descricao: 'Impactos, relacionamento, participação e programas relacionados às comunidades locais.' },
];

export const ODS_LISTA = [
  { id: 1, nome: 'Erradicação da Pobreza' },
  { id: 2, nome: 'Fome Zero e Agricultura Sustentável' },
  { id: 3, nome: 'Saúde e Bem-Estar' },
  { id: 4, nome: 'Educação de Qualidade' },
  { id: 5, nome: 'Igualdade de Gênero' },
  { id: 6, nome: 'Água Potável e Saneamento' },
  { id: 7, nome: 'Energia Limpa e Acessível' },
  { id: 8, nome: 'Trabalho Decente e Crescimento Econômico' },
  { id: 9, nome: 'Indústria, Inovação e Infraestrutura' },
  { id: 10, nome: 'Redução das Desigualdades' },
  { id: 11, nome: 'Cidades e Comunidades Sustentáveis' },
  { id: 12, nome: 'Consumo e Produção Responsáveis' },
  { id: 13, nome: 'Ação contra a Mudança Global do Clima' },
  { id: 14, nome: 'Vida na Água' },
  { id: 15, nome: 'Vida Terrestre' },
  { id: 16, nome: 'Paz, Justiça e Instituições Eficazes' },
  { id: 17, nome: 'Parcerias e Meios de Implementação' },
];

// Tipos de entidade da societá.ai que podem servir de evidência.
export const ENTIDADES_VINCULAVEIS = [
  { id: 'registro', nome: 'Registro / Interação' },
  { id: 'reuniao', nome: 'Escuta / Reunião' },
  { id: 'stakeholder', nome: 'Stakeholder' },
  { id: 'comunidade', nome: 'Comunidade' },
  { id: 'demanda', nome: 'Demanda / Reclamação' },
  { id: 'compromisso', nome: 'Compromisso' },
  { id: 'caso', nome: 'Caso' },
  { id: 'risco_social', nome: 'Risco Social' },
  { id: 'oportunidade', nome: 'Oportunidade' },
  { id: 'acao_social', nome: 'Ação / Programa Social' },
  { id: 'territorio', nome: 'Território' },
  { id: 'documento', nome: 'Documento / Evidência' },
];

export const REFERENCIAIS_IDS = REFERENCIAIS_ESG.map(r => r.id);

// Legacy values kept in the enum for historical preservation (not offered as new options).
export const REFERENCIAIS_LEGACY = ['CSRD', 'B Corp'];