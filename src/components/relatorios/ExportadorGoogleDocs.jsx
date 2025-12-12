import { base44 } from '@/api/base44Client';

export const exportarParaGoogleDocs = async (dados, tipoRelatorio) => {
  try {
    // Montar conteúdo do documento
    let conteudoDocumento = `ESCUTA ATIVA - INTELIGÊNCIA TERRITORIAL\n\n`;
    conteudoDocumento += `TIPO: ${dados.titulo}\n`;
    conteudoDocumento += `DATA DE GERAÇÃO: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}\n\n`;
    conteudoDocumento += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Resumo Executivo
    if (dados.resumo) {
      conteudoDocumento += `RESUMO EXECUTIVO\n\n`;
      conteudoDocumento += `${dados.resumo}\n\n`;
      conteudoDocumento += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    // KPIs
    if (dados.kpis && Object.keys(dados.kpis).length > 0) {
      conteudoDocumento += `INDICADORES-CHAVE (KPIs)\n\n`;
      Object.entries(dados.kpis).forEach(([chave, valor]) => {
        conteudoDocumento += `• ${chave}: ${valor}\n`;
      });
      conteudoDocumento += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    // Insights
    if (dados.insights && dados.insights.length > 0) {
      conteudoDocumento += `PRINCIPAIS INSIGHTS\n\n`;
      dados.insights.forEach((insight, idx) => {
        conteudoDocumento += `${idx + 1}. ${insight}\n`;
      });
      conteudoDocumento += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    // Tabela de dados
    if (dados.tabela && dados.tabela.length > 0) {
      conteudoDocumento += `DADOS DETALHADOS\n\n`;
      
      const colunas = Object.keys(dados.tabela[0]);
      
      // Cabeçalho
      conteudoDocumento += colunas.map(c => c.toUpperCase()).join(' | ') + '\n';
      conteudoDocumento += '─'.repeat(100) + '\n';
      
      // Linhas (limitado a 100 registros para não sobrecarregar)
      dados.tabela.slice(0, 100).forEach(row => {
        conteudoDocumento += colunas.map(col => {
          const valor = row[col];
          if (Array.isArray(valor)) return valor.join(', ');
          if (typeof valor === 'object') return JSON.stringify(valor);
          return valor || '-';
        }).join(' | ') + '\n';
      });
      
      if (dados.tabela.length > 100) {
        conteudoDocumento += `\n... e mais ${dados.tabela.length - 100} registros\n`;
      }
      
      conteudoDocumento += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    // Análises Avançadas
    if (dados.analises_avancadas) {
      conteudoDocumento += `ANÁLISES AVANÇADAS\n\n`;
      conteudoDocumento += JSON.stringify(dados.analises_avancadas, null, 2);
      conteudoDocumento += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    // Rodapé
    conteudoDocumento += `GERADO AUTOMATICAMENTE PELO SISTEMA ESCUTA ATIVA\n`;
    conteudoDocumento += `Data: ${new Date().toLocaleString('pt-BR')}\n`;

    // Criar o documento através da LLM com formatação
    const prompt = `Converta o seguinte conteúdo em um documento Google Docs bem formatado.

Use formatação profissional com:
- Títulos grandes e em negrito
- Seções bem delimitadas
- Tabelas formatadas quando aplicável
- Listas numeradas/com marcadores
- Destaque para números e métricas importantes

CONTEÚDO:
${conteudoDocumento}

Retorne o texto formatado pronto para Google Docs.`;

    const textoFormatado = await base44.integrations.Core.InvokeLLM({
      prompt,
    });

    // Criar nome do arquivo
    const nomeArquivo = `Escuta_Ativa_${dados.titulo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;

    // Criar blob e download (arquivo de texto que pode ser aberto/copiado para Google Docs)
    const blob = new Blob([textoFormatado], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return nomeArquivo;
  } catch (error) {
    console.error('Erro ao exportar para Google Docs:', error);
    throw error;
  }
};