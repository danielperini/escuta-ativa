import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ExportadorDados({ 
  dados, 
  colunas, 
  nomeArquivo = "dados", 
  titulo = "Relatório de Dados",
  variant = "outline"
}) {
  const [exportando, setExportando] = useState(false);

  const exportarCSV = () => {
    setExportando(true);
    try {
      // Cabeçalhos
      const headers = colunas.map(c => c.label).join(',');
      
      // Linhas de dados
      const rows = dados.map(item => 
        colunas.map(col => {
          let valor = item[col.key];
          
          // Tratamento de arrays
          if (Array.isArray(valor)) {
            valor = valor.join('; ');
          }
          
          // Tratamento de objetos
          if (typeof valor === 'object' && valor !== null) {
            valor = JSON.stringify(valor);
          }
          
          // Escapar vírgulas e aspas
          valor = String(valor || '').replace(/"/g, '""');
          if (valor.includes(',') || valor.includes('\n') || valor.includes('"')) {
            valor = `"${valor}"`;
          }
          
          return valor;
        }).join(',')
      ).join('\n');
      
      const csv = headers + '\n' + rows;
      
      // Download
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      alert('Erro ao exportar CSV: ' + error.message);
    } finally {
      setExportando(false);
    }
  };

  const exportarPDF = () => {
    setExportando(true);
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      
      // Cabeçalho
      doc.setFontSize(18);
      doc.setTextColor(227, 30, 36);
      doc.text(titulo, 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 27);
      
      // Preparar dados para tabela
      const tableData = dados.map(item => 
        colunas.map(col => {
          let valor = item[col.key];
          
          if (Array.isArray(valor)) {
            return valor.join(', ');
          }
          
          if (typeof valor === 'object' && valor !== null) {
            return JSON.stringify(valor);
          }
          
          return String(valor || '-');
        })
      );
      
      // Tabela
      doc.autoTable({
        head: [colunas.map(c => c.label)],
        body: tableData,
        startY: 35,
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [227, 30, 36],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 35, left: 14, right: 14 }
      });
      
      // Rodapé
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      doc.save(`${nomeArquivo}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      alert('Erro ao exportar PDF: ' + error.message);
    } finally {
      setExportando(false);
    }
  };

  if (exportando) {
    return (
      <Button variant={variant} disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Exportando...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportarCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
          Exportar como CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportarPDF}>
          <FileText className="w-4 h-4 mr-2 text-red-600" />
          Exportar como PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}