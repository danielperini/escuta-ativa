// Classificador automático de registros em categorias ESG
// GRI, ODS, Pacto Global, CSRD/ESRS

export default class ClassificadorAutomaticoESG {
  constructor(registros) {
    this.registros = registros;
  }

  classificar() {
    const classificacoes = this.classificarAcoes();
    const vinculacaoGRI = this.vincularGRI(classificacoes);
    const vinculacaoODS = this.vincularODS(classificacoes);
    const vinculacaoPacto = this.vincularPactoGlobal(classificacoes);
    const vinculacaoESRS = this.vincularESRS(vinculacaoGRI);

    return {
      classificacoes_acoes: classificacoes,
      vinculacao_gri: vinculacaoGRI,
      vinculacao_ods: vinculacaoODS,
      vinculacao_pacto_global: vinculacaoPacto,
      vinculacao_esrs: vinculacaoESRS
    };
  }

  classificarAcoes() {
    const classificacoes = {
      direitos_humanos: 0,
      participacao_social: 0,
      dialogo_comunitario: 0,
      construcao_conjunta: 0,
      desenvolvimento_local: 0,
      governanca_social: 0,
      gestao_impactos: 0,
      cultura_identidade: 0
    };

    const palavrasChave = {
      direitos_humanos: ['direito', 'liberdade', 'igualdade', 'discriminação', 'trabalho infantil', 'trabalho forçado', 'dignidade'],
      participacao_social: ['participação', 'participacao', 'consulta', 'envolvimento', 'assembleia', 'reunião', 'reuniao comunitária', 'ouvir comunidade'],
      dialogo_comunitario: ['diálogo', 'dialogo', 'conversa', 'escuta', 'fala', 'comunicação', 'comunicacao', 'interação', 'interacao'],
      construcao_conjunta: ['conjunto', 'parceria', 'colaboração', 'colaboracao', 'coletivo', 'construir junto', 'decisão compartilhada'],
      desenvolvimento_local: ['emprego', 'renda', 'capacitação', 'capacitacao', 'treinamento', 'oportunidade', 'desenvolvimento'],
      governanca_social: ['gestão', 'gestao', 'política', 'politica', 'procedimento', 'transparência', 'transparencia', 'prestação de contas', 'auditoria'],
      gestao_impactos: ['impacto', 'mitigação', 'mitigacao', 'compensação', 'compensacao', 'prevenção', 'prevencao', 'monitoramento', 'avaliação', 'avaliacao'],
      cultura_identidade: ['cultura', 'tradição', 'tradicao', 'identidade', 'patrimônio', 'patrimonio', 'memória', 'memoria', 'costumes']
    };

    this.registros.forEach(registro => {
      try {
        const textoCompleto = [
          registro.titulo || '',
          registro.descricao || '',
          registro.transcricao || '',
          ...(registro.temas_identificados || []),
          ...(registro.demandas || []).map(d => d?.descricao || '')
        ].filter(Boolean).join(' ').toLowerCase();

        Object.keys(palavrasChave).forEach(categoria => {
          const matches = palavrasChave[categoria].filter(palavra => 
            textoCompleto.includes(palavra.toLowerCase())
          );
          if (matches.length > 0) {
            classificacoes[categoria]++;
          }
        });
      } catch (error) {
        console.log('Erro ao classificar registro:', error);
      }
    });

    return classificacoes;
  }

  vincularGRI(classificacoes) {
    const mapeamento = [
      { codigo: 'GRI 413', descricao: 'Comunidades Locais', quantidade: classificacoes.dialogo_comunitario + classificacoes.participacao_social },
      { codigo: 'GRI 403', descricao: 'Saúde e Segurança Ocupacional', quantidade: Math.floor(classificacoes.direitos_humanos * 0.3) },
      { codigo: 'GRI 404', descricao: 'Treinamento e Educação', quantidade: classificacoes.desenvolvimento_local },
      { codigo: 'GRI 405', descricao: 'Diversidade e Igualdade', quantidade: Math.floor(classificacoes.direitos_humanos * 0.4) },
      { codigo: 'GRI 406', descricao: 'Não Discriminação', quantidade: Math.floor(classificacoes.direitos_humanos * 0.3) },
      { codigo: 'GRI 408', descricao: 'Trabalho Infantil', quantidade: 0 },
      { codigo: 'GRI 409', descricao: 'Trabalho Forçado', quantidade: 0 },
      { codigo: 'GRI 102/103', descricao: 'Informações Gerais', quantidade: classificacoes.governanca_social }
    ];

    return mapeamento.filter(m => m.quantidade > 0);
  }

  vincularODS(classificacoes) {
    const mapeamento = [
      { numero: 1, nome: 'Erradicação da Pobreza', quantidade: Math.floor(classificacoes.desenvolvimento_local * 0.5) },
      { numero: 4, nome: 'Educação de Qualidade', quantidade: classificacoes.desenvolvimento_local },
      { numero: 5, nome: 'Igualdade de Gênero', quantidade: Math.floor(classificacoes.direitos_humanos * 0.4) },
      { numero: 8, nome: 'Trabalho Decente', quantidade: classificacoes.desenvolvimento_local + classificacoes.direitos_humanos },
      { numero: 10, nome: 'Redução das Desigualdades', quantidade: classificacoes.direitos_humanos + classificacoes.participacao_social },
      { numero: 11, nome: 'Cidades Sustentáveis', quantidade: classificacoes.gestao_impactos + classificacoes.dialogo_comunitario },
      { numero: 16, nome: 'Paz e Justiça', quantidade: classificacoes.governanca_social + classificacoes.direitos_humanos },
      { numero: 17, nome: 'Parcerias', quantidade: classificacoes.construcao_conjunta + classificacoes.participacao_social }
    ];

    return mapeamento.filter(m => m.quantidade > 0).sort((a, b) => b.quantidade - a.quantidade);
  }

  vincularPactoGlobal(classificacoes) {
    const principios = [
      { principio: 'Princípio 1 - Apoiar e respeitar direitos humanos', categoria: 'Direitos Humanos', quantidade: classificacoes.direitos_humanos },
      { principio: 'Princípio 2 - Não cumplicidade em abusos', categoria: 'Direitos Humanos', quantidade: Math.floor(classificacoes.direitos_humanos * 0.5) },
      { principio: 'Princípio 3 - Liberdade de associação', categoria: 'Trabalho', quantidade: classificacoes.participacao_social },
      { principio: 'Princípio 4 - Eliminação do trabalho forçado', categoria: 'Trabalho', quantidade: 0 },
      { principio: 'Princípio 5 - Abolição do trabalho infantil', categoria: 'Trabalho', quantidade: 0 },
      { principio: 'Princípio 6 - Não discriminação no emprego', categoria: 'Trabalho', quantidade: Math.floor(classificacoes.direitos_humanos * 0.4) },
      { principio: 'Princípio 10 - Combate à corrupção', categoria: 'Anticorrupção', quantidade: classificacoes.governanca_social }
    ];

    return principios.filter(p => p.quantidade > 0);
  }

  vincularESRS(vinculacaoGRI) {
    // Crosswalk GRI → ESRS
    const crosswalk = {
      'GRI 413': { codigo: 'ESRS S3', descricao: 'Affected Communities' },
      'GRI 403': { codigo: 'ESRS S1', descricao: 'Own Workforce - Health & Safety' },
      'GRI 404': { codigo: 'ESRS S1', descricao: 'Own Workforce - Training' },
      'GRI 405': { codigo: 'ESRS S1', descricao: 'Own Workforce - Equal Treatment' },
      'GRI 406': { codigo: 'ESRS S1', descricao: 'Own Workforce - Non-discrimination' },
      'GRI 102/103': { codigo: 'ESRS 2', descricao: 'General Disclosures' }
    };

    const vinculacaoESRS = [];
    const esrsMap = {};

    vinculacaoGRI.forEach(gri => {
      const esrs = crosswalk[gri.codigo];
      if (esrs) {
        if (!esrsMap[esrs.codigo]) {
          esrsMap[esrs.codigo] = { ...esrs, quantidade: 0 };
        }
        esrsMap[esrs.codigo].quantidade += gri.quantidade;
      }
    });

    return Object.values(esrsMap);
  }
}