import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

const TIPO_LABEL = {
  reuniao: 'Reunião',
  conversa_campo: 'Conversa de Campo',
  visita: 'Visita',
  demanda: 'Demanda',
  ocorrencia: 'Ocorrência'
};

const SENTIMENTO_LABEL = {
  positivo: 'Positivo',
  neutro: 'Neutro',
  negativo: 'Negativo',
  misto: 'Misto'
};

const TEMPERATURA_LABEL = {
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
  critico: 'Crítico'
};

const STATUS_LABEL = {
  rascunho: 'Rascunho',
  finalizado: 'Finalizado',
  arquivado: 'Arquivado'
};

function formatarData(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('pt-BR');
  } catch (_) { return String(iso); }
}

function textoLista(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  return arr.filter(Boolean).join(', ');
}

function limparSlug(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/\s+/g, '-');
}

async function carregarImagemDataUrl(url) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type?.startsWith('image/')) return null;
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (_) { return null; }
}

function ehImagem(arq) {
  if (arq?.tipo && /^image\//i.test(arq.tipo)) return true;
  return /\.(png|jpe?g|webp|gif|bmp)(\?|$)/i.test(arq?.url || '');
}

const VERDE = [45, 106, 79];
const ESCURO = [30, 41, 59];
const CINZA = [100, 116, 139];
const TEXTO = [51, 65, 85];

export default function ExportadorPDFRegistros({ registros, filtros }) {
  const [gerando, setGerando] = useState(false);

  const handleClick = async () => {
    if (!registros || registros.length === 0 || gerando) return;
    setGerando(true);
    try {
      await gerarPDF(registros, filtros);
    } catch (e) {
      console.error('Erro ao gerar PDF de registros:', e);
      alert('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setGerando(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleClick} disabled={gerando || !registros?.length} className="gap-2">
      {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {gerando ? 'Gerando PDF…' : 'Exportar PDF'}
    </Button>
  );
}

async function gerarPDF(registros, filtros) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const paginaW = doc.internal.pageSize.getWidth();
  const paginaH = doc.internal.pageSize.getHeight();
  const margemEsq = 48;
  const margemDir = 48;
  const larguraTextual = paginaW - margemEsq - margemDir;
  const limiteY = paginaH - 56;
  let y = 56;

  // ===== Cabeçalho societá.ai =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...VERDE);
  doc.text('societá.ai', margemEsq, y);
  y += 24;

  doc.setFontSize(16);
  doc.setTextColor(...ESCURO);
  doc.text('Registros de Campo', margemEsq, y);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...CINZA);

  if (filtros?.dataInicio || filtros?.dataFim) {
    const inicio = filtros.dataInicio ? formatarData(filtros.dataInicio) : 'início';
    const fim = filtros.dataFim ? formatarData(filtros.dataFim) : 'hoje';
    doc.text(`Período: ${inicio} a ${fim}`, margemEsq, y);
    y += 14;
  }
  const municipioSel = filtros?.municipio && filtros.municipio !== 'todas' ? filtros.municipio : null;
  if (municipioSel) {
    doc.text(`Território: ${municipioSel}`, margemEsq, y);
    y += 14;
  }
  if (filtros?.comunidade && filtros.comunidade !== 'todas') {
    doc.text(`Comunidade: ${filtros.comunidade}`, margemEsq, y);
    y += 14;
  }
  if (filtros?.tipo && filtros.tipo !== 'todos') {
    doc.text(`Tipo: ${TIPO_LABEL[filtros.tipo] || filtros.tipo}`, margemEsq, y);
    y += 14;
  }
  if (filtros?.tema && filtros.tema !== 'todos') {
    doc.text(`Tema: ${filtros.tema}`, margemEsq, y);
    y += 14;
  }
  if (filtros?.status && filtros.status !== 'todos') {
    doc.text(`Status: ${STATUS_LABEL[filtros.status] || filtros.status}`, margemEsq, y);
    y += 14;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...ESCURO);
  doc.text(`Total: ${registros.length} registro(s)`, margemEsq, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...CINZA);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, margemEsq, y);
  y += 16;

  // Separador
  doc.setDrawColor(210, 220, 226);
  doc.setLineWidth(0.5);
  doc.line(margemEsq, y, paginaW - margemDir, y);
  y += 14;

  // ===== Registros =====
  for (let i = 0; i < registros.length; i++) {
    const r = registros[i];
    const numRegistro = String(i + 1).padStart(2, '0');

    if (y > limiteY - 40) { doc.addPage(); y = 56; }

    // Título do registro
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...VERDE);
    doc.text(`Registro ${numRegistro}`, margemEsq, y);
    y += 16;

    doc.setFontSize(12);
    doc.setTextColor(...ESCURO);
    const titulo = r.titulo || '—';
    const tituloLines = doc.splitTextToSize(titulo, larguraTextual);
    for (const ln of tituloLines) {
      if (y > limiteY) { doc.addPage(); y = 56; }
      doc.text(ln, margemEsq, y);
      y += 14;
    }
    y += 4;

    // Campos chave-valor
    const linhas = [];
    const add = (label, val) => {
      const v = (val === null || val === undefined) ? '' : String(val).trim();
      if (!v) return;
      linhas.push([label, v]);
    };

    add('Código', r.codigo_unico);
    add('Data', formatarData(r.data_registro));
    add('Tipo', TIPO_LABEL[r.tipo] || r.tipo);
    add('Comunidade', r.comunidade);
    add('Município', r.localizacao?.municipio || (r.comunidade ? r.comunidade.split(',')[0] : ''));
    add('Estado', r.localizacao?.estado);
    add('Local', r.local);
    add('Responsável', r.usuario_criador || r.usuario_ultima_atualizacao);
    add('Equipe', r.equipe_nome);
    add('Participantes', textoLista(r.participantes));
    add('Temas', textoLista(r.temas_identificados));
    add('Sentimento', SENTIMENTO_LABEL[r.sentimento] || r.sentimento);
    add('Temperatura do território', TEMPERATURA_LABEL[r.temperatura_territorio] || r.temperatura_territorio);
    add('Risco', textoLista(r.indicadores_risco));
    add('Status', STATUS_LABEL[r.status] || r.status);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...TEXTO);

    for (const [label, val] of linhas) {
      if (y > limiteY) { doc.addPage(); y = 56; }
      doc.setFont('helvetica', 'bold');
      const labelStr = `${label}: `;
      doc.text(labelStr, margemEsq, y);
      const labelW = doc.getTextWidth(labelStr);
      doc.setFont('helvetica', 'normal');
      const wrapped = doc.splitTextToSize(val, larguraTextual - labelW);
      doc.text(wrapped, margemEsq + labelW, y);
      y += Math.max(13, wrapped.length * 13);
    }

    y = blocoTexto(doc, 'Descrição / Relato', r.descricao, y, margemEsq, larguraTextual, limiteY);
    y = blocoTexto(doc, 'Transcrição', r.transcricao, y, margemEsq, larguraTextual, limiteY);

    // Demandas
    if (Array.isArray(r.demandas) && r.demandas.length > 0) {
      const txt = r.demandas.map((d, idx) => {
        const partes = [`${idx + 1}. ${d.descricao || ''}`.trim()];
        if (d.urgencia) partes.push(`urgência: ${d.urgencia}`);
        if (d.status) partes.push(`status: ${d.status}`);
        return partes.join(' • ');
      }).join('\n');
      y = blocoTexto(doc, 'Demandas', txt, y, margemEsq, larguraTextual, limiteY);
    }

    // Encaminhamentos
    if (r.encaminhamento_realizado || r.descricao_encaminhamento) {
      const partes = [];
      if (r.encaminhamento_realizado) partes.push('Encaminhamento realizado.');
      if (r.descricao_encaminhamento) partes.push(r.descricao_encaminhamento);
      y = blocoTexto(doc, 'Encaminhamentos', partes.join(' '), y, margemEsq, larguraTextual, limiteY);
    }

    // Compromissos
    if (Array.isArray(r.compromissos) && r.compromissos.length > 0) {
      const txt = r.compromissos.map((c, idx) => {
        const partes = [`${idx + 1}. ${c.descricao || ''}`.trim()];
        if (c.responsavel) partes.push(`Resp.: ${c.responsavel}`);
        if (c.prazo) partes.push(`Prazo: ${formatarData(c.prazo)}`);
        if (c.status) partes.push(`Status: ${c.status}`);
        return partes.join(' • ');
      }).join('\n');
      y = blocoTexto(doc, 'Compromissos relacionados', txt, y, margemEsq, larguraTextual, limiteY);
    }

    // Evidências / Fotos
    const arquivos = Array.isArray(r.arquivos) ? r.arquivos.filter(a => a && a.url) : [];
    if (arquivos.length > 0) {
      y = tituloBloco(doc, 'Evidências', y, margemEsq, limiteY);
      let xCursor = margemEsq;
      let alturaLinha = 0;
      const maxW = 150;
      const maxH = 110;
      const gap = 8;

      for (const a of arquivos) {
        if (ehImagem(a)) {
          const dataUrl = await carregarImagemDataUrl(a.url);
          if (!dataUrl) {
            y = listarArquivo(doc, a, y, margemEsq, limiteY);
            continue;
          }
          try {
            const fmt = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            const props = doc.getImageProperties(dataUrl);
            const ratio = Math.min(maxW / props.width, maxH / props.height, 1);
            const w = props.width * ratio;
            const h = props.height * ratio;
            if (xCursor + w > paginaW - margemDir) {
              xCursor = margemEsq;
              y += alturaLinha + gap;
              alturaLinha = 0;
            }
            if (y + h > limiteY) { doc.addPage(); y = 56; xCursor = margemEsq; alturaLinha = 0; }
            doc.addImage(dataUrl, fmt, xCursor, y, w, h);
            xCursor += w + gap;
            alturaLinha = Math.max(alturaLinha, h);
          } catch (_) {
            y = listarArquivo(doc, a, y, margemEsq, limiteY);
          }
        } else {
          y = listarArquivo(doc, a, y, margemEsq, limiteY);
        }
      }
      y += alturaLinha + 14;
    }

    y += 6;
  }

  // Rodapé com numeração
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 160, 170);
    doc.text(
      `societá.ai • Registros de Campo • Página ${i} de ${totalPaginas}`,
      paginaW / 2,
      paginaH - 24,
      { align: 'center' }
    );
  }

  // Nome do arquivo
  const hoje = new Date();
  const aaa = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, '0');
  const dd = String(hoje.getDate()).padStart(2, '0');
  const sufixo = municipioSel ? '-' + limparSlug(municipioSel) : '-societa';
  doc.save(`registros-campo${sufixo}-${aaa}-${mm}-${dd}.pdf`);
}

function tituloBloco(doc, titulo, y, margemEsq, limiteY) {
  if (y > limiteY) { doc.addPage(); y = 56; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...VERDE);
  doc.text(titulo, margemEsq, y);
  return y + 14;
}

function blocoTexto(doc, titulo, conteudo, y, margemEsq, larguraTextual, limiteY) {
  if (!conteudo) return y;
  y = tituloBloco(doc, titulo, y, margemEsq, limiteY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...TEXTO);
  const wrapped = doc.splitTextToSize(String(conteudo), larguraTextual);
  for (const ln of wrapped) {
    if (y > limiteY) { doc.addPage(); y = 56; }
    doc.text(ln, margemEsq, y);
    y += 13;
  }
  return y + 8;
}

function listarArquivo(doc, arq, y, margemEsq, limiteY) {
  if (y > limiteY) { doc.addPage(); y = 56; }
  const nome = arq.nome || (arq.url ? arq.url.split('/').pop() : 'Arquivo');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...CINZA);
  doc.text(`• ${nome}`, margemEsq, y);
  return y + 12;
}