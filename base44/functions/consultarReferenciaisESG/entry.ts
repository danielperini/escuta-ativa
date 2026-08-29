import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const REFERENCIAIS_DESCRICAO = {
  'GRI': 'Global Reporting Initiative',
  'Pacto Global': 'Pacto Global da ONU',
  'ODS': 'Objetivos de Desenvolvimento Sustentável',
  'ISO 26000': 'Responsabilidade Social',
  'IFC Performance Standards': 'Padrões de desempenho do IFC',
  'Princípios do Equador': 'Risco socioambiental em projetos financiados',
  'AA1000': 'Engajamento de stakeholders',
  'Direitos Humanos / UNGP': 'UN Guiding Principles on Business and Human Rights',
  'Outro': 'Outro referencial'
};

function montarContexto(evidencias, config) {
  const linhas = [];
  linhas.push('=== CONTEXTO DA PLATAFORMA SOCIETÁ.AI ===');
  linhas.push('A societá.ai é uma plataforma de relacionamento comunitário, gestão de stakeholders e inteligência social e territorial.');
  linhas.push('Os registros representam EVIDÊNCIAS de atividades reais — NÃO representam certificação ou conformidade com qualquer padrão.');
  linhas.push('');

  if (config) {
    linhas.push('=== REFERENCIAIS ADOTADOS PELA ORGANIZAÇÃO ===');
    const refs = (config.compromissos_publicos || []).filter(Boolean);
    refs.forEach((r) => {
      const desc = REFERENCIAIS_DESCRICAO[r] || r;
      linhas.push(`- ${r} (${desc})`);
    });
    if (config.referenciais_prioritarios?.gri_detalhamento?.length) {
      linhas.push(`  Detalhamento GRI: ${(config.referenciais_prioritarios.gri_detalhamento || []).join(', ')}`);
    }
    if (config.referenciais_prioritarios?.ods_prioritarios?.length) {
      linhas.push(`  ODS prioritários: ${(config.referenciais_prioritarios.ods_prioritarios || []).join(', ')}`);
    }
    linhas.push('');
  }

  if (evidencias && evidencias.length) {
    linhas.push('=== EVIDÊNCIAS VINCULADAS (apenas dados existentes) ===');
    const porRef = {};
    evidencias.forEach((ev) => {
      const chave = ev.sub_referencial ? `${ev.referencial} » ${ev.sub_referencial}` : ev.referencial;
      if (!porRef[chave]) porRef[chave] = [];
      porRef[chave].push(ev);
    });
    Object.keys(porRef).forEach((chave) => {
      const lista = porRef[chave];
      linhas.push(`\n${chave} (${lista.length} evidência(s)):`);
      lista.slice(0, 15).forEach((ev) => {
        const partes = [
          `tipo=${ev.entidade_tipo}`,
          ev.entidade_nome ? `nome="${ev.entidade_nome}"` : null,
          ev.comunidade ? `comunidade="${ev.comunidade}"` : null,
          ev.territorio ? `territorio="${ev.territorio}"` : null,
          ev.status === 'sugerido' ? 'classificação=SUGESTÃO DA IA (não validada)' : 'classificação=VALIDADA PELO USUÁRIO'
        ].filter(Boolean);
        linhas.push(`  - ${partes.join(', ')}`);
      });
    });
  } else {
    linhas.push('=== EVIDÊNCIAS VINCULADAS ===');
    linhas.push('Nenhuma evidência vinculada encontrada.');
  }

  linhas.push('');
  linhas.push('=== REGRAS DE RESPOSTA ===');
  linhas.push('1. Use EXCLUSIVAMENTE os dados fornecidos acima. Não invente registros, comunidades ou vínculos.');
  linhas.push('2. NUNCA afirme que a organização "cumpre", "está em conformidade" ou "possui certificação" de qualquer padrão (GRI, IFC, UNGP, etc.) só por existirem registros associados.');
  linhas.push('3. Diferencie claramente SUGESTÃO DA IA (status=sugerido) de CLASSIFICAÇÃO VALIDADA PELO USUÁRIO (status=validado).');
  linhas.push('4. Quando não houver dados suficientes, diga explicitamente que não há evidências cadastradas para responder.');
  linhas.push('5. Mantenha o foco em relacionamento comunitário, stakeholders, territórios, demandas e direitos humanos.');
  return linhas.join('\n');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const pergunta = (body && body.pergunta || '').trim();
    if (!pergunta) {
      return Response.json({ error: 'Informe o parâmetro "pergunta".' }, { status: 400 });
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'OPENAI_API_KEY não configurada.' }, { status: 500 });
    }

    const evidencias = await base44.entities.ReferencialEvidencia.list('-created_date', 500);
    const configs = await base44.entities.ConfiguracaoESG.list('-created_date', 1);
    const config = configs[0] || null;

    const contexto = montarContexto(evidencias, config);

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: contexto },
        { role: 'user', content: pergunta }
      ],
    });

    const resposta = completion.choices[0]?.message?.content || '';

    return Response.json({
      resposta,
      total_evidencias: evidencias.length,
      disclaimer: 'Resposta baseada exclusivamente em dados existentes na plataforma. Não constitui declaração de conformidade ou certificação.'
    });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});