import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ExportadorDashboard({ dados, titulo = "Dashboard" }) {
  const [exportando, setExportando] = useState(false);

  const exportarCSV = () => {
    setExportando(true);
    try {
      const { registros = [], compromissos = [], riscos = [], stakeholders = [] } = dados;

      // Preparar dados para CSV
      const linhas = [
        ['DASHBOARD - RESUMO EXECUTIVO'],
        ['Gerado em:', format(new Date(), 'dd/MM/yyyy HH:mm')],
        [''],
        ['REGISTROS'],
        ['Total de Registros', registros.length],
        ['Registros Últimos 7 Dias', registros.filter(r => {
          const diff = (new Date() - new Date(r.created_date)) / (1000 * 60 * 60 * 24);
          return diff <= 7;
        }).length],
        [''],
        ['COMPROMISSOS'],
        ['Total de Compromissos', compromissos.length],
        ['Compromissos Pendentes', compromissos.filter(c => c.status === 'pendente').length],
        ['Compromissos Atrasados', compromissos.filter(c => {
          return c.prazo && new Date(c.prazo) < new Date() && c.status !== 'concluido';
        }).length],
        [''],
        ['RISCOS SOCIAIS'],
        ['Total de Riscos Ativos', riscos.filter(r => r.status === 'ativo').length],
        ['Riscos Críticos', riscos.filter(r => r.status === 'ativo' && r.nivel === 'critico').length],
        ['Riscos Altos', riscos.filter(r => r.status === 'ativo' && r.nivel === 'alto').length],
        [''],
        ['STAKEHOLDERS'],
        ['Total de Stakeholders', stakeholders.length],
        ['Stakeholders Ativos', stakeholders.filter(s => s.nivel_atividade === 'alto').length],
        ['Score Médio de Engajamento', Math.round(stakeholders.reduce((acc, s) => acc + (s.score_engajamento || 0), 0) / stakeholders.length || 0)]
      ];

      const csvContent = linhas.map(linha => linha.join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('CSV exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar CSV: ' + error.message);
    } finally {
      setExportando(false);
    }
  };

  const exportarPDF = () => {
    setExportando(true);
    try {
      const { registros = [], compromissos = [], riscos = [], stakeholders = [] } = dados;

      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.setTextColor(227, 30, 36);
      doc.text('Dashboard - Resumo Executivo', 20, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 20, 28);

      let y = 40;

      // KPIs Principais
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('KPIs Principais', 20, y);
      y += 10;

      const kpis = [
        ['Total de Registros', registros.length],
        ['Registros Últimos 7 Dias', registros.filter(r => {
          const diff = (new Date() - new Date(r.created_date)) / (1000 * 60 * 60 * 24);
          return diff <= 7;
        }).length],
        ['Compromissos Pendentes', compromissos.filter(c => c.status === 'pendente').length],
        ['Compromissos Atrasados', compromissos.filter(c => {
          return c.prazo && new Date(c.prazo) < new Date() && c.status !== 'concluido';
        }).length],
        ['Riscos Ativos', riscos.filter(r => r.status === 'ativo').length],
        ['Riscos Críticos', riscos.filter(r => r.status === 'ativo' && r.nivel === 'critico').length],
        ['Total de Stakeholders', stakeholders.length],
        ['Score Médio Engajamento', Math.round(stakeholders.reduce((acc, s) => acc + (s.score_engajamento || 0), 0) / stakeholders.length || 0)]
      ];

      doc.autoTable({
        startY: y,
        head: [['Indicador', 'Valor']],
        body: kpis,
        theme: 'grid',
        headStyles: { fillColor: [227, 30, 36] }
      });

      y = doc.lastAutoTable.finalY + 15;

      // Riscos Críticos
      const riscosCriticos = riscos.filter(r => r.status === 'ativo' && ['critico', 'alto'].includes(r.nivel));
      if (riscosCriticos.length > 0) {
        doc.setFontSize(14);
        doc.text('Riscos Críticos e Altos', 20, y);
        y += 10;

        const dadosRiscos = riscosCriticos.slice(0, 5).map(r => [
          r.titulo,
          r.nivel,
          r.comunidade || 'N/A'
        ]);

        doc.autoTable({
          startY: y,
          head: [['Risco', 'Nível', 'Comunidade']],
          body: dadosRiscos,
          theme: 'grid',
          headStyles: { fillColor: [227, 30, 36] }
        });

        y = doc.lastAutoTable.finalY + 15;
      }

      // Stakeholders Engajados
      const topStakeholders = stakeholders
        .sort((a, b) => (b.score_engajamento || 0) - (a.score_engajamento || 0))
        .slice(0, 5);

      if (topStakeholders.length > 0 && y < 250) {
        doc.setFontSize(14);
        doc.text('Top 5 Stakeholders Engajados', 20, y);
        y += 10;

        const dadosStakeholders = topStakeholders.map(s => [
          s.nome,
          s.score_engajamento || 0,
          s.comunidade || 'N/A'
        ]);

        doc.autoTable({
          startY: y,
          head: [['Nome', 'Score', 'Comunidade']],
          body: dadosStakeholders,
          theme: 'grid',
          headStyles: { fillColor: [227, 30, 36] }
        });
      }

      doc.save(`dashboard_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar PDF: ' + error.message);
    } finally {
      setExportando(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exportando} className="gap-2">
          <Download className="w-4 h-4" />
          {exportando ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportarCSV} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportarPDF} className="gap-2">
          <FileText className="w-4 h-4" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}