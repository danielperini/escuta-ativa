import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportarParaPDF = (dadosRelatorio, tipoRelatorio, filtros) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Configurar fonte para suportar caracteres especiais
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(11, 30, 51); // #0B1E33
    
    // Título
    doc.text("Escuta Ativa", pageWidth / 2, yPos, { align: "center" });
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Inteligencia Aplicada ao Territorio", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Tipo de relatório
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(11, 30, 51);
    doc.text(dadosRelatorio.titulo, pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Informações do relatório
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Data de Geracao: ${new Date().toLocaleDateString('pt-BR')}`, 14, yPos);
    yPos += 6;
    doc.text(`Periodo: ${filtros.periodo}`, 14, yPos);
    yPos += 6;
    if (filtros.comunidade && filtros.comunidade !== "todas") {
        doc.text(`Comunidade: ${filtros.comunidade}`, 14, yPos);
        yPos += 6;
    }
    if (filtros.tipoRegistro && filtros.tipoRegistro !== "todos") {
        doc.text(`Tipo de Registro: ${filtros.tipoRegistro}`, 14, yPos);
        yPos += 6;
    }
    if (filtros.tema && filtros.tema !== "todos") {
        doc.text(`Tema: ${filtros.tema}`, 14, yPos);
        yPos += 6;
    }
    yPos += 10;

    // Resumo Executivo
    if (dadosRelatorio.resumo) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(242, 182, 50); // #F2B632
        doc.text("Resumo Executivo", 14, yPos);
        yPos += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const resumoLines = doc.splitTextToSize(dadosRelatorio.resumo, pageWidth - 28);
        doc.text(resumoLines, 14, yPos);
        yPos += resumoLines.length * 5 + 10;
    }

    // KPIs
    if (dadosRelatorio.kpis && Object.keys(dadosRelatorio.kpis).length > 0) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(242, 182, 50);
        doc.text("Indicadores Principais", 14, yPos);
        yPos += 10;

        const kpiData = Object.entries(dadosRelatorio.kpis).map(([key, value]) => [
            key.replace(/_/g, ' ').toUpperCase(),
            value.toString()
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Indicador', 'Valor']],
            body: kpiData,
            theme: 'grid',
            headStyles: { fillColor: [11, 30, 51], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 15;
    }

    // Tabela de dados
    if (dadosRelatorio.tabela && dadosRelatorio.tabela.length > 0) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(242, 182, 50);
        doc.text("Dados Detalhados", 14, yPos);
        yPos += 10;

        const headers = Object.keys(dadosRelatorio.tabela[0]);
        const tableData = dadosRelatorio.tabela.map(row => 
            headers.map(header => {
                const value = row[header];
                if (Array.isArray(value)) return value.slice(0, 2).join(', ');
                if (typeof value === 'string' && value.length > 50) return value.substring(0, 47) + '...';
                return value || '-';
            })
        );

        doc.autoTable({
            startY: yPos,
            head: [headers.map(h => h.replace(/_/g, ' ').toUpperCase())],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [11, 30, 51], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [248, 248, 248] },
            margin: { left: 14, right: 14 },
            styles: { fontSize: 8, cellPadding: 3 }
        });

        yPos = doc.lastAutoTable.finalY + 15;
    }

    // Insights
    if (dadosRelatorio.insights && dadosRelatorio.insights.length > 0) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(242, 182, 50);
        doc.text("Insights e Recomendacoes", 14, yPos);
        yPos += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);

        dadosRelatorio.insights.forEach((insight, idx) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            const insightText = `${idx + 1}. ${insight}`;
            const lines = doc.splitTextToSize(insightText, pageWidth - 28);
            doc.text(lines, 14, yPos);
            yPos += lines.length * 5 + 5;
        });
    }

    // Rodapé em todas as páginas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Pagina ${i} de ${pageCount} - Gerado em ${new Date().toLocaleString('pt-BR')}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
        );
    }

    // Salvar PDF
    const nomeArquivo = `relatorio_${tipoRelatorio}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nomeArquivo);

    return nomeArquivo;
};