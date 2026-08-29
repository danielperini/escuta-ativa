import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// ============================================================
// Biblioteca de dicas bibliográficas (fallback offline)
// Baseadas em: "Relacionamento Comunitário: um Diálogo Social"
// Daniel Perini-Santos, 2025
// ============================================================
const BIBLIOTECA_BIBLIOGRAFICA = [
  {
    titulo: "ESCUTE ANTES DE RESPONDER",
    texto: "Uma tensão pode estar expressando uma pauta diferente daquela apresentada inicialmente. Interprete contexto, expectativas e silêncios antes de construir a resposta.",
    texto_expandido: "Segundo Daniel Perini-Santos, escutar não significa apenas obter informações — significa interpretar silêncios, compreender expectativas e dialogar sem pressa. A escuta ativa é uma prática de interpretação social, não técnica de coleta. Somente quando moradores percebem que suas experiências são reconhecidas é que a empresa conquista legitimidade para permanecer no diálogo.",
    categoria: "escuta_dialogo",
    cor_acento: "azul",
    fonte_tipo: "bibliografica",
    fontes: [{ titulo: "Relacionamento Comunitário: um Diálogo Social — Daniel Perini-Santos", tipo: "BIBLIOGRAFIA_INTERNA" }],
    nivel_confianca: "alto",
    prioridade: 85
  },
  {
    titulo: "PRESENÇA NÃO É SÓ CRISE",
    texto: "A relação se fortalece quando a equipe aparece também fora de situações críticas. Presença constante cria interlocutores confiáveis.",
    texto_expandido: "Uma presença que aparece apenas em momentos de crise ou exigência regulatória produz desconfiança. Uma presença constante, coerente e saudável cria condições para que o território reconheça um interlocutor confiável. A licença social é concedida e retirada pela comunidade — ela existe quando há confiança e se desfaz quando a convivência se rompe.",
    categoria: "presenca_territorio",
    cor_acento: "verde",
    fonte_tipo: "bibliografica",
    fontes: [{ titulo: "Relacionamento Comunitário: um Diálogo Social — Daniel Perini-Santos", tipo: "BIBLIOGRAFIA_INTERNA" }],
    nivel_confianca: "alto",
    prioridade: 80
  },
  {
    titulo: "DEVOLVA O QUE FOI ESCUTADO",
    texto: "A escuta perde legitimidade quando a comunidade não sabe o que aconteceu com sua contribuição. Devolutiva oportuna é parte do contrato social.",
    texto_expandido: "A devolutiva pública é uma das ferramentas mais importantes da participação. Sem ela, a escuta se torna vazia — moradores não percebem efeito do que foi dito. A devolutiva precisa ser didática, objetiva, explicativa e tempestiva, em linguagem acessível. É nesse movimento que se consolida a confiança.",
    categoria: "stakeholder_devolutiva",
    cor_acento: "laranja",
    fonte_tipo: "bibliografica",
    fontes: [{ titulo: "Relacionamento Comunitário: um Diálogo Social — Daniel Perini-Santos", tipo: "BIBLIOGRAFIA_INTERNA" }],
    nivel_confianca: "alto",
    prioridade: 90
  },
  {
    titulo: "DIVERSIFIQUE AS VOZES",
    texto: "Evite construir a leitura do território a partir de uma única liderança. Cada grupo social carrega percepções distintas.",
    texto_expandido: "A participação social não se limita à expressão de opiniões individuais — ela constitui um sistema. Participação é a capacidade de um território produzir leituras próprias sobre si mesmo. Isso exige que múltiplas vozes encontrem espaços legítimos: lideranças, jovens, mulheres, povos tradicionais, coletivos culturais.",
    categoria: "escuta_dialogo",
    cor_acento: "azul",
    fonte_tipo: "bibliografica",
    fontes: [{ titulo: "Relacionamento Comunitário: um Diálogo Social — Daniel Perini-Santos", tipo: "BIBLIOGRAFIA_INTERNA" }],
    nivel_confianca: "alto",
    prioridade: 78
  },
  {
    titulo: "REGISTRE O HISTÓRICO",
    texto: "A memória institucional reduz contradições e melhora decisões futuras. Sem registros, cada profissional atua a partir da própria memória individual.",
    texto_expandido: "O registro sistemático é a base que sustenta todo o processo. Ele transforma a experiência cotidiana em conhecimento acumulado. Um registro consistente permite comparar períodos, identificar padrões, acompanhar mudanças de percepção e compreender como acontecimentos reverberam no cotidiano das comunidades.",
    categoria: "memoria_registros",
    cor_acento: "verde",
    fonte_tipo: "bibliografica",
    fontes: [{ titulo: "Relacionamento Comunitário: um Diálogo Social — Daniel Perini-Santos", tipo: "BIBLIOGRAFIA_INTERNA" }],
    nivel_confianca: "alto",
    prioridade: 72
  },
  {
    titulo: "RISCO TAMBÉM É PERCEPÇÃO",
    texto: "A percepção comunitária pode elevar ou reduzir a dimensão social de um evento. Um pequeno incidente pode adquirir grande impacto se há desconfiança acumulada.",
    texto_expandido: "A teoria da amplificação social do risco (Kasperson) demonstrou que a percepção coletiva é capaz de alterar a intensidade de um evento. Um acontecimento pequeno pode adquirir grande impacto quando associado a memórias negativas, falta de informação ou ausência de confiança. Situações mais sensíveis podem ser absorvidas sem tensão quando existe legitimidade e diálogo contínuo.",
    categoria: "risco_territorial",
    cor_acento: "laranja",
    fonte_tipo: "bibliografica",
    fontes: [{ titulo: "Relacionamento Comunitário: um Diálogo Social — Daniel Perini-Santos", tipo: "BIBLIOGRAFIA_INTERNA" }],
    nivel_confianca: "alto",
    prioridade: 88
  },
  {
    titulo: "OBSERVE O NÃO DITO",
    texto: "Silêncios, afastamentos e mudanças de participação também são sinais territoriais. A ausência pode indicar baixa participação ou falta de canal.",
    texto_expandido: "A observação profunda exige atenção aos detalhes, às interações cotidianas, às expressões não verbais, às dinâmicas de poder e aos movimentos do território. Na fala cotidiana, nas perguntas lançadas com cuidado, nos comentários discretos e nos silêncios prolongados é que emergem as inquietações que realmente orientam o comportamento comunitário.",
    categoria: "presenca_territorio",
    cor_acento: "azul",
    fonte_tipo: "bibliografica",
    fontes: [{ titulo: "Relacionamento Comunitário: um Diálogo Social — Daniel Perini-Santos", tipo: "BIBLIOGRAFIA_INTERNA" }],
    nivel_confianca: "alto",
    prioridade: 76
  },
  {
    titulo: "NÃO RESPONDA AO CONFLITO COM PRESSA",
    texto: "Primeiro identifique atores, causas, histórico e natureza da reivindicação. A mediação estruturada transforma disputas em acordos.",
    texto_expandido: "Conflitos não são desvios — são parte constitutiva da vida comunitária. Eles aparecem quando interesses se opõem, quando leituras sobre impactos divergem. Uma empresa que se recusa a escutar críticas aprofunda tensões. A mediação estruturada cria espaço de reorganização e permite transformar disputas em acordos parciais, capazes de introduzir novos equilíbrios.",
    categoria: "conflito_mediacao",
    cor_acento: "laranja",
    fonte_tipo: "bibliografica",
    fontes: [{ titulo: "Relacionamento Comunitário: um Diálogo Social — Daniel Perini-Santos", tipo: "BIBLIOGRAFIA_INTERNA" }],
    nivel_confianca: "alto",
    prioridade: 82
  },
  {
    titulo: "COMUNIQUE ANTES DO VAZIO",
    texto: "Ausência de informação favorece rumores e interpretações espontâneas. Lacunas informacionais são preenchidas por narrativas que não refletem a realidade.",
    texto_expandido: "Em contextos de risco social, comunicar não é repassar informações — é construir confiança. Transparência, frequência, linguagem adequada e canais diversificados são condições essenciais para reduzir ruídos, prevenir boatos e estabilizar expectativas.",
    categoria: "comunicacao",
    cor_acento: "laranja",
    fonte_tipo: "bibliografica",
    fontes: [{ titulo: "Relacionamento Comunitário: um Diálogo Social — Daniel Perini-Santos", tipo: "BIBLIOGRAFIA_INTERNA" }],
    nivel_confianca: "alto",
    prioridade: 80
  },
  {
    titulo: "LEIA O TERRITÓRIO COMO REDE",
    texto: "Entenda quem influencia quem, por onde circulam informações e quais grupos estão pouco representados.",
    texto_expandido: "Redes de parentesco, coletivos culturais, associações, movimentos religiosos, lideranças informais e organizações de base formam um tecido social complexo. Putnam denomina esse conjunto capital social. A análise de redes permite compreender onde circulam mensagens, quem exerce influência, quais são os pontos de tensão e como se distribuem expectativas.",
    categoria: "stakeholder_devolutiva",
    cor_acento: "azul",
    fonte_tipo: "bibliografica",
    fontes: [{ titulo: "Relacionamento Comunitário: um Diálogo Social — Daniel Perini-Santos", tipo: "BIBLIOGRAFIA_INTERNA" }],
    nivel_confianca: "alto",
    prioridade: 74
  },
  {
    titulo: "CONECTE DEMANDAS RECORRENTES",
    texto: "Várias manifestações individuais podem representar uma questão estrutural. Identifique padrões antes de responder caso a caso.",
    texto_expandido: "Sistemas internos de tramitação de demandas auxiliam a empresa a identificar padrões, recorrências e temas que precisam ser tratados de forma estrutural, e não apenas caso a caso. Quando a empresa não responde às informações vindas do território, a confiança se deteriora.",
    categoria: "stakeholder_devolutiva",
    cor_acento: "verde",
    fonte_tipo: "bibliografica",
    fontes: [{ titulo: "Relacionamento Comunitário: um Diálogo Social — Daniel Perini-Santos", tipo: "BIBLIOGRAFIA_INTERNA" }],
    nivel_confianca: "alto",
    prioridade: 77
  },
  {
    titulo: "EXPLIQUE LIMITES COM RESPEITO",
    texto: "Uma negativa clara e respeitosa pode preservar confiança. O que importa é assegurar uma resposta assertiva, mesmo que parcial.",
    texto_expandido: "A postura ética não consiste em negar de forma ríspida, mas em esclarecer com cuidado, acolher a necessidade apresentada e ajudar a direcionar corretamente. Ao agir assim, o profissional evita criar expectativas inviáveis e preserva a confiança na relação.",
    categoria: "confianca_legitimidade",
    cor_acento: "verde",
    fonte_tipo: "bibliografica",
    fontes: [{ titulo: "Relacionamento Comunitário: um Diálogo Social — Daniel Perini-Santos", tipo: "BIBLIOGRAFIA_INTERNA" }],
    nivel_confianca: "alto",
    prioridade: 70
  }
];

// Contexto territorial Cimento Nacional
const CONTEXTO_TERRITORIAL = {
  territorios: ["Matozinhos", "Sete Lagoas", "Arcos"],
  empresa: "Cimento Nacional",
  temas_monitoramento: [
    "mineração de calcário", "uso e disponibilidade de água", "contexto cárstico",
    "cavernas e patrimônio espeleológico", "tráfego de caminhões", "poeira e material particulado",
    "ruído e vibração", "uso do solo", "emprego e economia local", "saúde percebida",
    "percepção sobre a empresa", "movimentos sociais", "lideranças comunitárias"
  ]
};

// Seleciona 3 dicas diversificadas da biblioteca
function selecionarDicasBibliograficas(demandas_pendentes, concentracao_interlocutores, sentimento_negativo) {
  const pool = [...BIBLIOTECA_BIBLIOGRAFICA];
  
  // Boost por contexto
  if (demandas_pendentes) {
    pool.find(d => d.titulo.includes("DEVOLVA"))?.prioridade && 
      (pool.find(d => d.titulo.includes("DEVOLVA")).prioridade += 15);
  }
  if (concentracao_interlocutores) {
    pool.find(d => d.titulo.includes("DIVERSIFIQUE"))?.prioridade &&
      (pool.find(d => d.titulo.includes("DIVERSIFIQUE")).prioridade += 15);
  }
  if (sentimento_negativo) {
    pool.find(d => d.titulo.includes("RISCO"))?.prioridade &&
      (pool.find(d => d.titulo.includes("RISCO")).prioridade += 20);
  }
  
  pool.sort((a, b) => (b.prioridade || 0) - (a.prioridade || 0));
  
  // Garantir diversidade de categorias
  const selecionadas = [];
  const categorias_usadas = new Set();
  
  for (const dica of pool) {
    if (selecionadas.length >= 3) break;
    if (!categorias_usadas.has(dica.categoria)) {
      selecionadas.push(dica);
      categorias_usadas.add(dica.categoria);
    }
  }
  
  // Preencher se necessário
  if (selecionadas.length < 3) {
    for (const dica of pool) {
      if (selecionadas.length >= 3) break;
      if (!selecionadas.includes(dica)) selecionadas.push(dica);
    }
  }
  
  return selecionadas.slice(0, 3);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    
    // Permite execução via workflow (sem auth de usuário)
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {}

    const hoje = new Date().toISOString().split('T')[0];
    
    // Verificar se já existe dicas para hoje
    const dicasHoje = await base44.asServiceRole.entities.DicaTerritorial.filter({
      data_exibicao: hoje,
      selecionada_do_dia: true
    });
    
    if (dicasHoje && dicasHoje.length >= 3) {
      return Response.json({ 
        dicas: dicasHoje.slice(0, 3),
        fonte: "cache",
        data: hoje
      });
    }

    // ========================================
    // CAMADA 1: Análise dos dados internos
    // ========================================
    let dadosInternos = {};
    try {
      const registros = await base44.asServiceRole.entities.Registro.list('-created_date', 100);
      const riscos = await base44.asServiceRole.entities.RiscoSocial.filter({ status: 'ativo' });
      const compromissos = await base44.asServiceRole.entities.Compromisso.list('-created_date', 50);
      const stakeholders = await base44.asServiceRole.entities.Stakeholder.list('-created_date', 100);
      
      // Análise de demandas pendentes
      const demandasPendentes = registros.reduce((acc, r) =>
        acc + (r.demandas?.filter(d => d.status === 'pendente').length || 0), 0);
      
      // Análise de sentimento
      const sentimentos = registros.slice(0, 30).map(r => r.sentimento).filter(Boolean);
      const negativos = sentimentos.filter(s => ['negativo', 'misto'].includes(s)).length;
      const sentimentoNegativo = negativos > sentimentos.length * 0.4;
      
      // Análise de concentração de interlocutores
      const comunidades = registros.map(r => r.comunidade).filter(Boolean);
      const comunidadeUnique = new Set(comunidades).size;
      const concentrado = comunidades.length > 10 && comunidadeUnique < 3;
      
      // Riscos críticos
      const riscosCriticos = riscos.filter(r => ['alto', 'critico'].includes(r.nivel));
      
      // Compromissos atrasados
      const agoraDt = new Date();
      const atrasados = compromissos.filter(c => 
        c.prazo && new Date(c.prazo) < agoraDt && c.status !== 'concluido'
      );
      
      // Territorios com mais registros
      const terrsCount = registros.reduce((acc, r) => {
        if (r.comunidade) acc[r.comunidade] = (acc[r.comunidade] || 0) + 1;
        return acc;
      }, {});
      const topTerritorios = Object.entries(terrsCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t]) => t);
      
      dadosInternos = {
        total_registros: registros.length,
        demandas_pendentes: demandasPendentes,
        sentimento_negativo: sentimentoNegativo,
        concentrado,
        riscos_criticos: riscosCriticos.length,
        compromissos_atrasados: atrasados.length,
        top_territorios: topTerritorios,
        temas_frequentes: (() => {
          const temas = registros.reduce((acc, r) => {
            r.temas_identificados?.forEach(t => acc[t] = (acc[t] || 0) + 1);
            return acc;
          }, {});
          return Object.entries(temas).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
        })()
      };
    } catch (err) {
      console.warn("Aviso: erro ao carregar dados internos:", err.message);
    }

    // ========================================
    // CAMADA 2 & 3: Geração via OpenAI com contexto bibliográfico + web
    // ========================================
    let dicasIA = [];
    try {
      const openaiKey = secrets.get("OPENAI_API_KEY");
      
      const contextoInterno = dadosInternos.total_registros > 0 ? `
DADOS INTERNOS DA PLATAFORMA (hoje):
- Total de registros: ${dadosInternos.total_registros}
- Demandas pendentes sem resposta: ${dadosInternos.demandas_pendentes}
- Sentimento territorial negativo/misto: ${dadosInternos.sentimento_negativo ? 'SIM' : 'NÃO'}
- Interações concentradas em poucos territórios: ${dadosInternos.concentrado ? 'SIM' : 'NÃO'}
- Riscos ativos críticos/altos: ${dadosInternos.riscos_criticos}
- Compromissos atrasados: ${dadosInternos.compromissos_atrasados}
- Top territórios com registro: ${dadosInternos.top_territorios.join(', ') || 'nenhum'}
- Temas mais frequentes: ${dadosInternos.temas_frequentes.join(', ') || 'nenhum'}
` : 'Plataforma sem dados internos ainda.';

      const prompt = `Você é um especialista em relacionamento comunitário e gestão social territorial, com profundo conhecimento do livro "Relacionamento Comunitário: um Diálogo Social" de Daniel Perini-Santos (2025).

CONTEXTO OPERACIONAL:
Empresa: Cimento Nacional
Territórios de atuação: Matozinhos/MG, Sete Lagoas/MG, Arcos/MG
Temas relevantes: mineração de calcário, contexto cárstico, tráfego, poeira, água subterrânea, licença social, percepção de risco

${contextoInterno}

TAREFA:
Gere exatamente 3 cards de orientação territorial para hoje (${hoje}). Cada card deve ser:
1. Curto, objetivo e acionável
2. Baseado prioritariamente no livro de Daniel Perini-Santos
3. Adaptado ao contexto real dos dados acima, quando relevante
4. Diferente em tema/categoria dos outros 2

Para cada card, forneça:
- titulo: 4 a 7 palavras em MAIÚSCULAS
- texto: 120-220 caracteres, orientação prática concreta
- texto_expandido: explicação de 3-5 linhas com fundamentação
- categoria: uma de [escuta_dialogo, risco_territorial, stakeholder_devolutiva, presenca_territorio, confianca_legitimidade, conflito_mediacao, materialidade_esg, memoria_registros, comunicacao, investimento_social]
- cor_acento: azul (escuta/diálogo), laranja (atenção/risco), verde (oportunidade), vermelho (urgência real — usar raramente)
- fonte_tipo: bibliografica, dados_internos, combinada
- nivel_confianca: alto, medio, baixo
- prioridade: 1-100

IMPORTANTE:
- NÃO inventar protestos, ações judiciais, problemas de saúde ou conflitos sem evidência
- Se mencionar contexto territorial, diferenciar FATO_VERIFICADO de PERCEPCAO_COMUNITARIA
- Não usar vermelho automaticamente — apenas para urgência real baseada em dados
- Os 3 cards devem ter categorias distintas

Responda APENAS com JSON válido, sem markdown:
{"dicas": [{...}, {...}, {...}]}`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          response_format: { type: "json_object" }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        if (parsed.dicas && Array.isArray(parsed.dicas) && parsed.dicas.length > 0) {
          dicasIA = parsed.dicas.slice(0, 3);
        }
      }
    } catch (err) {
      console.warn("Aviso: IA indisponível, usando biblioteca bibliográfica:", err.message);
    }

    // Fallback para biblioteca se IA falhou
    const dicasFinal = dicasIA.length >= 3 ? dicasIA :
      selecionarDicasBibliograficas(
        dadosInternos.demandas_pendentes > 0,
        dadosInternos.concentrado,
        dadosInternos.sentimento_negativo
      );

    // ========================================
    // Persistir dicas do dia
    // ========================================
    // Limpar dicas antigas não fixadas do dia anterior
    try {
      const dicasOntem = await base44.asServiceRole.entities.DicaTerritorial.filter({
        selecionada_do_dia: true
      });
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const ontemStr = ontem.toISOString().split('T')[0];
      
      for (const d of dicasOntem) {
        if (d.data_exibicao && d.data_exibicao <= ontemStr && !d.fixada) {
          await base44.asServiceRole.entities.DicaTerritorial.update(d.id, { selecionada_do_dia: false });
        }
      }
    } catch (_) {}

    // Criar novas dicas do dia
    const dicasCriadas = [];
    for (const dica of dicasFinal) {
      try {
        const criada = await base44.asServiceRole.entities.DicaTerritorial.create({
          titulo: dica.titulo || "ORIENTAÇÃO DO DIA",
          texto: dica.texto || "",
          texto_expandido: dica.texto_expandido || "",
          categoria: dica.categoria || "escuta_dialogo",
          cor_acento: dica.cor_acento || "azul",
          fonte_tipo: dica.fonte_tipo || "bibliografica",
          fontes: dica.fontes || [{ titulo: "Relacionamento Comunitário: um Diálogo Social — Daniel Perini-Santos", tipo: "BIBLIOGRAFIA_INTERNA" }],
          nivel_confianca: dica.nivel_confianca || "alto",
          prioridade: dica.prioridade || 70,
          data_referencia: hoje,
          data_exibicao: hoje,
          gerada_por_ia: dicasIA.length >= 3,
          selecionada_do_dia: true,
          oculta: false,
          validada: false
        });
        dicasCriadas.push(criada);
      } catch (err) {
        console.error("Erro ao criar dica:", err.message);
        dicasCriadas.push(dica);
      }
    }

    return Response.json({
      dicas: dicasCriadas,
      fonte: dicasIA.length >= 3 ? "ia" : "biblioteca",
      data: hoje,
      contexto_interno: {
        demandas_pendentes: dadosInternos.demandas_pendentes,
        riscos_criticos: dadosInternos.riscos_criticos
      }
    });

  } catch (error) {
    console.error("Erro em gerarDicasTerritorial:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}