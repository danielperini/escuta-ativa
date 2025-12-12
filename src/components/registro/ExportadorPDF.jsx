import React from 'react';
import { Button } from "@/components/ui/button";
import { FileDown, FileText, Users } from 'lucide-react';
import { jsPDF } from 'jspdf';
import moment from 'moment';

export function exportarTranscricaoPDF(registro) {
  const doc = new jsPDF();
  const margemEsquerda = 20;
  const margemDireita = 190;
  const larguraLinha = margemDireita - margemEsquerda;
  let y = 20;

  // Cabeçalho
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSCRIÇÃO', margemEsquerda, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Registro: ${registro.titulo || 'Sem título'}`, margemEsquerda, y);
  y += 6;
  doc.text(`Data: ${moment(registro.data_registro).format('DD/MM/YYYY')}`, margemEsquerda, y);
  y += 6;
  doc.text(`Comunidade: ${registro.comunidade || 'Não especificada'}`, margemEsquerda, y);
  y += 6;
  doc.text(`Local: ${registro.local || 'Não especificado'}`, margemEsquerda, y);
  y += 10;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(margemEsquerda, y, margemDireita, y);
  y += 10;

  // Transcrição
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSCRIÇÃO COMPLETA', margemEsquerda, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const transcricao = registro.transcricao || registro.descricao || 'Sem transcrição disponível';
  const linhas = doc.splitTextToSize(transcricao, larguraLinha);
  
  linhas.forEach((linha) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(linha, margemEsquerda, y);
    y += 6;
  });

  // Rodapé
  y += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Gerado em: ${moment().format('DD/MM/YYYY HH:mm')}`, margemEsquerda, y);

  doc.save(`transcricao_${registro.id}_${moment().format('YYYYMMDD')}.pdf`);
}

export function exportarListaPresencasPDF(registro) {
  const doc = new jsPDF();
  const margemEsquerda = 20;
  const margemDireita = 190;
  let y = 20;

  // Cabeçalho
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTA DE PRESENÇAS', margemEsquerda, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Registro: ${registro.titulo || 'Sem título'}`, margemEsquerda, y);
  y += 6;
  doc.text(`Data: ${moment(registro.data_registro).format('DD/MM/YYYY')}`, margemEsquerda, y);
  y += 6;
  doc.text(`Comunidade: ${registro.comunidade || 'Não especificada'}`, margemEsquerda, y);
  y += 6;
  doc.text(`Local: ${registro.local || 'Não especificado'}`, margemEsquerda, y);
  y += 12;

  // Tabela de presenças
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PARTICIPANTES', margemEsquerda, y);
  y += 8;

  const participantes = registro.participantes || [];
  
  if (participantes.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhum participante registrado', margemEsquerda, y);
  } else {
    // Cabeçalho da tabela
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Nº', margemEsquerda, y);
    doc.text('Nome', margemEsquerda + 15, y);
    doc.text('Assinatura', margemEsquerda + 100, y);
    y += 2;
    doc.setLineWidth(0.3);
    doc.line(margemEsquerda, y, margemDireita, y);
    y += 8;

    // Lista de participantes
    doc.setFont('helvetica', 'normal');
    participantes.forEach((participante, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${index + 1}`, margemEsquerda, y);
      doc.text(participante, margemEsquerda + 15, y);
      doc.line(margemEsquerda + 100, y + 2, margemDireita, y + 2);
      y += 12;
    });
  }

  // Rodapé
  y += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Gerado em: ${moment().format('DD/MM/YYYY HH:mm')}`, margemEsquerda, y);

  doc.save(`lista_presencas_${registro.id}_${moment().format('YYYYMMDD')}.pdf`);
}

export function exportarAtaPDF(registro) {
  const doc = new jsPDF();
  const margemEsquerda = 20;
  const margemDireita = 190;
  const larguraLinha = margemDireita - margemEsquerda;
  let y = 20;

  // Cabeçalho
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ATA DE REUNIÃO', margemEsquerda, y);
  y += 10;

  // Informações básicas
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Registro Nº: ${registro.id}`, margemEsquerda, y);
  y += 6;
  doc.text(`Título: ${registro.titulo || 'Sem título'}`, margemEsquerda, y);
  y += 6;
  doc.text(`Data: ${moment(registro.data_registro).format('DD/MM/YYYY')}`, margemEsquerda, y);
  y += 6;
  doc.text(`Comunidade: ${registro.comunidade || 'Não especificada'}`, margemEsquerda, y);
  y += 6;
  doc.text(`Local: ${registro.local || 'Não especificado'}`, margemEsquerda, y);
  y += 10;

  doc.setLineWidth(0.5);
  doc.line(margemEsquerda, y, margemDireita, y);
  y += 10;

  // Participantes
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PARTICIPANTES', margemEsquerda, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const participantes = registro.participantes || [];
  if (participantes.length > 0) {
    participantes.forEach((p, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${i + 1}. ${p}`, margemEsquerda, y);
      y += 6;
    });
  } else {
    doc.text('Nenhum participante registrado', margemEsquerda, y);
    y += 6;
  }
  y += 8;

  // Resumo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO', margemEsquerda, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const resumo = registro.resumo_automatico || registro.descricao || 'Sem resumo disponível';
  const linhasResumo = doc.splitTextToSize(resumo, larguraLinha);
  
  linhasResumo.forEach((linha) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(linha, margemEsquerda, y);
    y += 6;
  });
  y += 8;

  // Temas
  if (registro.temas_identificados && registro.temas_identificados.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TEMAS ABORDADOS', margemEsquerda, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    registro.temas_identificados.forEach((tema) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`• ${tema}`, margemEsquerda, y);
      y += 6;
    });
    y += 8;
  }

  // Demandas
  if (registro.demandas && registro.demandas.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DEMANDAS REGISTRADAS', margemEsquerda, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    registro.demandas.forEach((demanda, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const textoDemanda = `${i + 1}. ${demanda.descricao} (Urgência: ${demanda.urgencia || 'média'})`;
      const linhasDemanda = doc.splitTextToSize(textoDemanda, larguraLinha);
      linhasDemanda.forEach(linha => {
        doc.text(linha, margemEsquerda, y);
        y += 6;
      });
      y += 3;
    });
    y += 8;
  }

  // Compromissos
  if (registro.compromissos && registro.compromissos.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROMISSOS ASSUMIDOS', margemEsquerda, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    registro.compromissos.forEach((comp, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const textoComp = `${i + 1}. ${comp.descricao}`;
      const linhasComp = doc.splitTextToSize(textoComp, larguraLinha);
      linhasComp.forEach(linha => {
        doc.text(linha, margemEsquerda, y);
        y += 6;
      });
      if (comp.responsavel) {
        doc.setFont('helvetica', 'italic');
        doc.text(`   Responsável: ${comp.responsavel}`, margemEsquerda, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
      }
      y += 3;
    });
    y += 8;
  }

  // Próximos passos
  if (registro.proximos_passos && registro.proximos_passos.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PRÓXIMOS PASSOS', margemEsquerda, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    registro.proximos_passos.forEach((passo) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`• ${passo}`, margemEsquerda, y);
      y += 6;
    });
  }

  // Rodapé
  if (y > 250) {
    doc.addPage();
    y = 20;
  } else {
    y += 15;
  }
  
  doc.setLineWidth(0.5);
  doc.line(margemEsquerda, y, margemDireita, y);
  y += 8;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Ata gerada automaticamente pelo Sistema Escutativa`, margemEsquerda, y);
  y += 5;
  doc.text(`Data de geração: ${moment().format('DD/MM/YYYY HH:mm')}`, margemEsquerda, y);

  doc.save(`ata_${registro.id}_${moment().format('YYYYMMDD')}.pdf`);
}

export function BotoesExportacao({ registro }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportarTranscricaoPDF(registro)}
        className="gap-2"
      >
        <FileText className="w-4 h-4" />
        Baixar Transcrição PDF
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportarListaPresencasPDF(registro)}
        className="gap-2"
      >
        <Users className="w-4 h-4" />
        Baixar Lista de Presenças PDF
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportarAtaPDF(registro)}
        className="gap-2"
      >
        <FileDown className="w-4 h-4" />
        Baixar Ata PDF
      </Button>
    </div>
  );
}