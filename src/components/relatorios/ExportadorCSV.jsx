export const exportarParaCSV = (dadosRelatorio, tipoRelatorio) => {
    if (!dadosRelatorio.tabela || dadosRelatorio.tabela.length === 0) {
        alert("Não há dados tabulares para exportar em CSV");
        return;
    }

    // Preparar cabeçalhos
    const headers = Object.keys(dadosRelatorio.tabela[0]);
    
    // Converter dados para CSV
    const csvRows = [];
    
    // Adicionar cabeçalho
    csvRows.push(headers.join(','));
    
    // Adicionar dados
    dadosRelatorio.tabela.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            
            // Tratar arrays
            if (Array.isArray(value)) {
                return `"${value.join('; ')}"`;
            }
            
            // Tratar strings com vírgulas ou quebras de linha
            if (typeof value === 'string') {
                if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }
            
            // Tratar null/undefined
            if (value == null) return '';
            
            return value;
        });
        csvRows.push(values.join(','));
    });

    // Criar Blob e fazer download
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para UTF-8
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${tipoRelatorio}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return `relatorio_${tipoRelatorio}_${new Date().toISOString().split('T')[0]}.csv`;
};

export const exportarParaExcel = (dadosRelatorio, tipoRelatorio) => {
    if (!dadosRelatorio.tabela || dadosRelatorio.tabela.length === 0) {
        alert("Não há dados tabulares para exportar");
        return;
    }

    // Preparar dados para Excel (HTML table)
    const headers = Object.keys(dadosRelatorio.tabela[0]);
    
    let htmlContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    htmlContent += '<head><meta charset="utf-8"><style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #0B1E33; color: white; font-weight: bold; }</style></head><body>';
    
    // Título e metadados
    htmlContent += `<h1>Escuta Ativa - ${dadosRelatorio.titulo}</h1>`;
    htmlContent += `<p><strong>Data de Geração:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>`;
    
    // Resumo executivo
    if (dadosRelatorio.resumo) {
        htmlContent += `<h2>Resumo Executivo</h2>`;
        htmlContent += `<p>${dadosRelatorio.resumo}</p>`;
    }
    
    // KPIs
    if (dadosRelatorio.kpis && Object.keys(dadosRelatorio.kpis).length > 0) {
        htmlContent += `<h2>Indicadores</h2>`;
        htmlContent += '<table><tr><th>Indicador</th><th>Valor</th></tr>';
        Object.entries(dadosRelatorio.kpis).forEach(([key, value]) => {
            htmlContent += `<tr><td>${key.replace(/_/g, ' ')}</td><td>${value}</td></tr>`;
        });
        htmlContent += '</table><br/>';
    }
    
    // Tabela principal
    htmlContent += '<h2>Dados Detalhados</h2>';
    htmlContent += '<table><tr>';
    headers.forEach(header => {
        htmlContent += `<th>${header.replace(/_/g, ' ')}</th>`;
    });
    htmlContent += '</tr>';
    
    dadosRelatorio.tabela.forEach(row => {
        htmlContent += '<tr>';
        headers.forEach(header => {
            const value = row[header];
            if (Array.isArray(value)) {
                htmlContent += `<td>${value.join(', ')}</td>`;
            } else {
                htmlContent += `<td>${value || ''}</td>`;
            }
        });
        htmlContent += '</tr>';
    });
    
    htmlContent += '</table></body></html>';

    // Criar Blob e fazer download
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${tipoRelatorio}_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return `relatorio_${tipoRelatorio}_${new Date().toISOString().split('T')[0]}.xls`;
};