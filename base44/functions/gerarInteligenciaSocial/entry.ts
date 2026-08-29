import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import OpenAI from 'npm:openai@4.67.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'OPENAI_API_KEY não configurada.' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const seed = body?.seed != null ? String(body.seed) : '';

    // Busca registros recentes com conteúdo textual (fonte das falas reais)
    const registros = await base44.entities.Registro.list('-created_date', 80);
    const compromissos = await base44.entities.Compromisso.list('-created_date', 100);
    const hoje = new Date();

    // ===== 1) VOZES DO TERRITÓRIO — extrai trechos verbatim das descrições reais =====
    const baseCands = (registros || [])
      .filter(r => r && r.titulo && r.descricao && r.descricao.trim().length >= 12)
      .slice(0, 60);
    // Quando seed presente, embaralha a ordem dos candidatos para variar a seleção
    const candidatos = (seed
      ? shuffleBySeed(baseCands, seed)
      : baseCands
    ).slice(0, 40).map(r => ({
        id: r.id,
        titulo: r.titulo,
        tipo: r.tipo,
        comunidade: r.comunidade || r.localizacao?.municipio || '',
        territorio: r.localizacao?.estado || '',
        data: r.data_registro || r.created_date,
        temas: (r.temas_identificados || []).slice(0, 4),
        descricao: String(r.descricao).slice(0, 1400)
      }));

    let vozes = [];
    if (candidatos.length > 0) {
      const contextoVozes = candidatos.map((r, i) =>
        `[REGISTRO ${i + 1}] id=${r.id}\nTÍTULO: ${r.titulo}\nTIPO: ${r.tipo}\nCOMUNIDADE: ${r.comunidade}\nTERRITÓRIO: ${territorioOu(r)}\nDATA: ${fmtData(r.data)}\nTEMAS: ${r.temas.join(', ')}\nDESCRIÇÃO:\n${r.descricao}\n`
      ).join('\n---\n');

      const schemaVozes = {
        type: 'object',
        additionalProperties: false,
        properties: {
          vozes: {
            type: 'array',
            description: 'Trechos verbatim extraídos das descrições fornecidas. Máximo 10 itens. Diversifique naturezas: ~3 percepção/necessidade, ~3 preocupação/demanda, ~3 oportunidade/reconhecimento. Varie comunidades e datas.',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                trecho: { type: 'string', description: 'Trecho extraído EXATAMENTE como aparece na descrição original, sem reescrever. Se houver nomes pessoais sensíveis, substitua por Morador(a) | Liderança | Representante mantendo o contexto.' },
                indice_registro: { type: 'number', description: 'Número do registro (1-based) de onde o trecho foi copiado' },
                tipo_interacao: { type: 'string', description: 'Tipo da interação (reunião, conversa_campo, visita, demanda, ocorrencia)' },
                tema_principal: { type: 'string', description: 'Tema principal do trecho (palavra curta)' },
                natureza: { type: 'string', enum: ['percepcao_necessidade', 'preocupacao_demanda', 'oportunidade_reconhecimento'], description: 'Natureza predominante da fala' }
              },
              required: ['trecho', 'indice_registro', 'tipo_interacao', 'tema_principal', 'natureza']
            }
          }
        },
        required: ['vozes']
      };

      const promptVozes = `Você é um analista de inteligência social. Abaixo estão registros reais de interações comunitárias.\n\nRegra ABSOLUTA:\n- Cada "trecho" deve ser copiado LITERALMENTE da descricao do registro (mesmas palavras), podendo apenas anonimizar nomes pessoais sensíveis.\n- NUNCA invente, reformule ou sintetize trechos que não existam textualmente na descrição.\n- NUNCA atribua a uma pessoa uma frase que não esteja na fonte.\n- Extraia até 10 trechos.\n- Busque diversidade: ~3 percepção/necessidade, ~3 preocupação/demanda, ~3 oportunidade/reconhecimento, mais 1 livre.\n- Varie comunidades, datas e temas — evite repetir o mesmo registro.\n- Priorize relevância, atualidade e representatividade territorial.\n- Se não houver trechos que representem efetivamente falas/manifestações, retorne array vazio.${seed ? `\n- Semente de variacao: ${seed}. Use-a para priorizar trechos DIFERENTES dos mais recentes.` : ''}\n\nRegistros:\n${contextoVozes}`;

      const openai = new OpenAI({ apiKey });
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: seed ? 0.5 : 0.2,
        response_format: { type: 'json_schema', json_schema: { name: 'vozes', schema: schemaVozes, strict: true } },
        messages: [
          { role: 'system', content: 'Você retorna JSON estrito. Os trechos são cópias verbatim de textos já fornecidos.' },
          { role: 'user', content: promptVozes }
        ]
      });
      const parsed = JSON.parse(resp.choices[0]?.message?.content || '{"vozes":[]}');
      for (const v of (parsed.vozes || [])) {
        const idx = Math.max(0, Math.min(candidatos.length - 1, Math.floor(v.indice_registro) - 1));
        const reg = candidatos[idx];
        if (reg && v.trecho) {
          vozes.push({
            trecho: String(v.trecho).trim(),
            registro_id: reg.id,
            tipo_interacao: v.tipo_interacao || reg.tipo || '',
            comunidade: reg.comunidade,
            territorio: reg.territorio,
            data: reg.data,
            tema_principal: v.tema_principal || (reg.temas?.[0] || ''),
            natureza: v.natureza || ''
          });
          if (vozes.length >= 10) break;
        }
      }
      if (vozes.length > 10) vozes = vozes.slice(0, 10);
    }

    // ===== 2) DICAS DE RELACIONAMENTO — regras determinísticas sobre dados reais =====
    const dicas = [];

    // 2a) Demandas sem resposta (devolutiva)
    const demandasPendentes = [];
    for (const r of (registros || [])) {
      for (const d of (r.demandas || [])) {
        if (d.status === 'pendente' || d.status === 'em_andamento') {
          demandasPendentes.push({ reg: r, d });
        }
      }
    }
    if (demandasPendentes.length >= 3) {
      dicas.push({
        id: 'devolutiva',
        tipo: 'devolutiva',
        titulo: 'Atenção à devolutiva',
        mensagem: 'Há crescimento de demandas aguardando resposta. Priorize devolutivas, inclusive quando ainda não houver solução definitiva.',
        prioridade: 'alta',
        explicacao: [
          `${demandasPendentes.length} demandas pendentes ou em andamento`,
          `Distribuídas em ${contarComunidades(demandasPendentes)} comunidades`
        ]
      });
    }

    // 2b) Baixa presença territorial
    const porComunidade = {};
    for (const r of (registros || [])) {
      if (!r.comunidade) continue;
      if (!porComunidade[r.comunidade]) porComunidade[r.comunidade] = { ultima: null };
      const d = r.data_registro ? new Date(r.data_registro) : new Date(r.created_date);
      if (!porComunidade[r.comunidade].ultima || d > porComunidade[r.comunidade].ultima) {
        porComunidade[r.comunidade].ultima = d;
      }
    }
    const semInteracaoRecente = Object.entries(porComunidade)
      .filter(([, v]) => v.ultima && (hoje - v.ultima) > 60 * 24 * 3600 * 1000)
      .map(([nome, v]) => ({ nome, dias: Math.floor((hoje - v.ultima) / (24 * 3600 * 1000)) }))
      .sort((a, b) => b.dias - a.dias)
      .slice(0, 3);
    if (semInteracaoRecente.length > 0) {
      dicas.push({
        id: 'presenca',
        tipo: 'presenca',
        titulo: 'Fortaleça a presença territorial',
        mensagem: 'Esta comunidade apresenta baixa frequência recente de interações. Considere uma ação de escuta ou presença territorial.',
        prioridade: 'media',
        explicacao: [
          `${semInteracaoRecente.length} comunidade(s) sem interação há mais de 60 dias`,
          `Maior intervalo: ${semInteracaoRecente[0].nome} (${semInteracaoRecente[0].dias} dias)`
        ]
      });
    }

    // 2c) Recorrência de temas
    const temasCount = {};
    for (const r of (registros || [])) {
      for (const t of (r.temas_identificados || [])) {
        temasCount[t] = (temasCount[t] || 0) + 1;
      }
    }
    const temasRecorrentes = Object.entries(temasCount)
      .sort((a, b) => b[1] - a[1])
      .filter(([, c]) => c >= 4)
      .slice(0, 3);
    if (temasRecorrentes.length > 0) {
      const [t, c] = temasRecorrentes[0];
      dicas.push({
        id: 'recorrencia',
        tipo: 'recorrência',
        titulo: 'Observe a recorrência',
        mensagem: `Este tema aparece repetidamente nas interações (${c} menções). Avalie se as manifestações individuais revelam uma questão estrutural.`,
        prioridade: 'media',
        explicacao: [
          `Tema mais recorrente: ${t} (${c} menções)`,
          ...temasRecorrentes.slice(1, 3).map(([n, x]) => `${n}: ${x} menções`)
        ]
      });
    }

    // 2d) Stakeholders — diversidade por comunidade
    const stakeholders = await base44.entities.Stakeholder.list('-created_date', 200);
    const porComunidadeSt = {};
    for (const s of (stakeholders || [])) {
      if (!s.comunidade) continue;
      porComunidadeSt[s.comunidade] = (porComunidadeSt[s.comunidade] || 0) + 1;
    }
    const poucaDiversidade = Object.entries(porComunidadeSt)
      .filter(([n, c]) => c <= 1 && n)
      .slice(0, 3);
    if (poucaDiversidade.length > 0) {
      dicas.push({
        id: 'stakeholders',
        tipo: 'stakeholders',
        titulo: 'Amplie a escuta',
        mensagem: 'A participação está concentrada em poucos interlocutores. Considere ampliar a escuta para outros grupos e atores do território.',
        prioridade: 'media',
        explicacao: [
          `${poucaDiversidade.length} comunidade(s) com apenas 1 interlocutor cadastrado`,
          `Exemplos: ${poucaDiversidade.slice(0, 2).map(([n]) => n).join(', ')}`
        ]
      });
    }

    // 2e) Compromissos próximos do vencimento (15 dias)
    const proximos = (compromissos || []).filter(c =>
      c.prazo && c.status !== 'concluido' && c.status !== 'cancelado' &&
      (new Date(c.prazo) - hoje) < 15 * 24 * 3600 * 1000 &&
      (new Date(c.prazo) - hoje) > -30 * 24 * 3600 * 1000
    );
    if (proximos.length > 0) {
      dicas.push({
        id: 'compromissos',
        tipo: 'compromissos',
        titulo: 'Proteja a confiança',
        mensagem: 'Há compromissos próximos do prazo acordado. Atualize o andamento e organize a devolutiva.',
        prioridade: 'alta',
        explicacao: [
          `${proximos.length} compromisso(s) com vencimento em até 15 dias`,
          `Responsáveis: ${listaResponsaveis(proximos)}`
        ]
      });
    }

    // 2f) Sentimento — deterioração recente
    const sentimentos = (registros || []).filter(r => r.sentimento);
    if (sentimentos.length >= 6) {
      const metade = Math.floor(sentimentos.length / 2);
      const recentes = sentimentos.slice(0, metade);
      const antigos = sentimentos.slice(metade);
      const score = (arr) => arr.filter(s => s.sentimento === 'positivo').length - arr.filter(s => s.sentimento === 'negativo').length;
      const delta = score(recentes) - score(antigos);
      if (delta < 0) {
        dicas.push({
          id: 'sentimento',
          tipo: 'sentimento',
          titulo: 'Mudança de percepção',
          mensagem: 'Os registros recentes indicam alteração da percepção neste território. Analise as causas antes de definir uma resposta.',
          prioridade: 'media',
          explicacao: [
            `Variação de ${delta} ponto(s) no saldo positivo x negativo`,
            `${recentes.filter(s => s.sentimento === 'negativo').length} registros negativos recentes`
          ]
        });
      }
    }

    // 2g) Riscos ativos
    const riscos = await base44.entities.RiscoSocial.filter({ status: 'ativo' });
    const riscosAltos = (riscos || []).filter(r => ['alto', 'critico'].includes(r.nivel));
    if (riscosAltos.length > 0) {
      dicas.push({
        id: 'riscos',
        tipo: 'riscos',
        titulo: 'Riscos sociais ativos',
        mensagem: 'Existem riscos sociais de alta criticidade ativos. Organize um plano de resposta e mantenha o acompanhamento próximo.',
        prioridade: 'alta',
        explicacao: [
          `${riscosAltos.length} risco(s) de alta criticidade`,
          `${(riscos || []).length} risco(s) ativos no total`
        ]
      });
    }

    // Se não houver dicas, gere uma neutra de boas-vindas metodológica (sem aspas, sem atribuição)
    if (dicainhasNenhuma(dicas) === false) {
      // noop
    }

    // ===== 3) DICA DO DIA — síntese metodológica curta (não é citação) =====
    let dicaDoDia = '';
    try {
      const resumo = [
        `demandas_pendentes=${demandasPendentes.length}`,
        `comunidades_sem_interacao=${semInteracaoRecente.length}`,
        `tema_mais_recorrente=${temasRecorrentes[0]?.[0] || ''}`,
        `compromissos_proximos=${proximos.length}`,
        `riscos_altos=${riscosAltos.length}`
      ].join('; ');
      const openai = new OpenAI({ apiKey });
      const respDica = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.8,
        max_tokens: 90,
        messages: [
          { role: 'system', content: 'Você escreve uma síntese metodológica curta, em português, alinhada aos princípios de Relacionamento Comunitário (escuta, devolutiva, presença territorial, confiança, memória institucional, tratamento de demandas). NÃO use aspas. NÃO atribua a autor. NÃO cite nomes. NÃO invente dados. Foco no método.' },
          { role: 'user', content: `Resumo atual do território: ${resumo}. Escreva uma orientação curta (até 140 caracteres) para a equipe hoje.` }
        ]
      });
      dicaDoDia = (respDica.choices[0]?.message?.content || '').trim();
    } catch (_) {
      dicaDoDia = '';
    }

    return Response.json({
      vozes,
      dicas,
      dica_do_dia: dicaDoDia,
      gerado_em: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
});

function fmtData(d) {
  try { return new Date(d).toISOString().slice(0, 10); } catch (_) { return ''; }
}
function territorioOu(r) { return r.territorio || (r.localizacao?.estado) || ''; }
function contarComunidades(arr) {
  const set = new Set();
  for (const x of arr) if (x.reg?.comunidade) set.add(x.reg.comunidade);
  return set.size;
}
function listaResponsaveis(arr) {
  const set = new Set();
  for (const c of arr) if (c.responsavel) set.add(c.responsavel);
  return Array.from(set).slice(0, 3).join(', ') || '—';
}
function dicainhasNenhuma(arr) { return arr.length === 0; }

// PRNG simples (Mulberry32) determinístico por seed — embaralha os candidatos
function shuffleBySeed(arr, seedStr) {
  const seed = hashStr(seedStr) >>> 0;
  let s = seed || 1;
  const rng = () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h;
}