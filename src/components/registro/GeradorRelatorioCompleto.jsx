import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, FileDown, Edit3, Save, Image as ImageIcon, FileText, Users, CheckCircle2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { gerarQRCodeDataURL } from '@/components/codigos/QRCodeGenerator';

export default function GeradorRelatorioCompleto({ registro, open, onOpenChange }) {
  const [etapa, setEtapa] = useState('selecao'); // selecao, edicao, preview
  const [gerando, setGerando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  const [opcoes, setOpcoes] = useState({
    incluirFotos: true,
    incluirListaPresenca: true,
    incluirTranscricao: true,
    incluirDemandas: true,
    incluirCompromissos: true,
    incluirProximosPassos: true,
    incluirAnexos: true
  });

  const [dadosRelatorio, setDadosRelatorio] = useState({
    titulo: '',
    elaboradoPor: '',
    cargo: '',
    conteudo: '',
    fotosAnexas: [],
    documentosAnexos: []
  });

  React.useEffect(() => {
    if (open && registro) {
      setDadosRelatorio({
        titulo: `Relatório de Campo - ${registro.titulo}`,
        elaboradoPor: '',
        cargo: '',
        conteudo: gerarConteudoInicial(),
        fotosAnexas: [],
        documentosAnexos: []
      });
    }
  }, [open, registro]);

  const gerarConteudoInicial = () => {
    if (!registro) return '';

    let conteudo = `<h2>Relatório de Campo</h2>`;
    conteudo += `<p><strong>Título:</strong> ${registro.titulo}</p>`;
    conteudo += `<p><strong>Data:</strong> ${registro.data_registro ? format(new Date(registro.data_registro), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Não informado'}</p>`;
    conteudo += `<p><strong>Tipo:</strong> ${registro.tipo}</p>`;
    conteudo += `<p><strong>Comunidade:</strong> ${registro.comunidade || 'Não informado'}</p>`;
    conteudo += `<p><strong>Local:</strong> ${registro.local || 'Não informado'}</p>`;
    
    conteudo += `<br/><h3>1. Contextualização</h3>`;
    conteudo += `<p>${registro.descricao || 'Sem descrição disponível.'}</p>`;

    if (opcoes.incluirListaPresenca && registro.participantes?.length > 0) {
      conteudo += `<br/><h3>2. Participantes</h3>`;
      conteudo += `<ul>`;
      registro.participantes.forEach(p => {
        conteudo += `<li>${p}</li>`;
      });
      conteudo += `</ul>`;
    }

    if (opcoes.incluirTranscricao && registro.transcricao) {
      conteudo += `<br/><h3>3. Registro de Diálogo</h3>`;
      conteudo += `<p>${registro.transcricao}</p>`;
    }

    if (opcoes.incluirDemandas && registro.demandas?.length > 0) {
      conteudo += `<br/><h3>4. Demandas Identificadas</h3>`;
      conteudo += `<ul>`;
      registro.demandas.forEach(d => {
        conteudo += `<li><strong>${d.descricao}</strong> - Urgência: ${d.urgencia || 'média'}</li>`;
      });
      conteudo += `</ul>`;
    }

    if (opcoes.incluirCompromissos && registro.compromissos?.length > 0) {
      conteudo += `<br/><h3>5. Compromissos Assumidos</h3>`;
      conteudo += `<ul>`;
      registro.compromissos.forEach(c => {
        conteudo += `<li><strong>${c.descricao}</strong> - Responsável: ${c.responsavel || 'Não definido'} - Prazo: ${c.prazo || 'Não definido'}</li>`;
      });
      conteudo += `</ul>`;
    }

    if (opcoes.incluirProximosPassos && registro.proximos_passos?.length > 0) {
      conteudo += `<br/><h3>6. Próximos Passos</h3>`;
      conteudo += `<ul>`;
      registro.proximos_passos.forEach(p => {
        conteudo += `<li>${p}</li>`;
      });
      conteudo += `</ul>`;
    }

    conteudo += `<br/><h3>7. Considerações Finais</h3>`;
    conteudo += `<p>[Insira aqui suas considerações e análises sobre o registro]</p>`;

    return conteudo;
  };

  const proximaEtapa = () => {
    if (etapa === 'selecao') {
      setDadosRelatorio(prev => ({
        ...prev,
        conteudo: gerarConteudoInicial()
      }));
      setEtapa('edicao');
    } else if (etapa === 'edicao') {
      setEtapa('preview');
    }
  };

  const voltarEtapa = () => {
    if (etapa === 'preview') setEtapa('edicao');
    else if (etapa === 'edicao') setEtapa('selecao');
  };

  const salvarRelatorio = async () => {
    setSalvando(true);
    try {
      const relatorioData = {
        tipo_relatorio: 'registros',
        formato: 'PDF',
        descricao: dadosRelatorio.titulo,
        periodo: registro.data_registro,
        filtros: {
          registro_id: registro.id,
          opcoes: opcoes,
          elaborado_por: dadosRelatorio.elaboradoPor,
          cargo: dadosRelatorio.cargo
        }
      };

      await base44.entities.RelatorioGerado.create(relatorioData);
      toast.success('Relatório salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar relatório');
      console.error(error);
    } finally {
      setSalvando(false);
    }
  };

  const gerarPDF = async () => {
    setGerando(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Cabeçalho corporativo
      pdf.setFillColor(43, 106, 79); // #2D6A4F
      pdf.rect(0, 0, pageWidth, 35, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Relatório de Campo', pageWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Sistema Escutativa - Gestão Territorial', pageWidth / 2, 25, { align: 'center' });

      // QR Code no canto superior direito
      if (registro.codigo_unico) {
        try {
          const qrDataUrl = await gerarQRCodeDataURL(registro.codigo_unico);
          if (qrDataUrl) {
            const qrSize = 25;
            pdf.addImage(qrDataUrl, 'PNG', pageWidth - margin - qrSize, 5, qrSize, qrSize);
          }
        } catch (error) {
          console.error('Erro ao adicionar QR Code:', error);
        }
      }

      yPosition = 50;

      // Informações do relatório
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      
      // Código único
      if (registro.codigo_unico) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Código:', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(registro.codigo_unico, margin + 25, yPosition);
        yPosition += 6;
      }
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Título:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      const tituloLines = pdf.splitTextToSize(dadosRelatorio.titulo, contentWidth - 30);
      pdf.text(tituloLines, margin + 25, yPosition);
      yPosition += (tituloLines.length * 5) + 5;

      if (dadosRelatorio.elaboradoPor) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Elaborado por:', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(dadosRelatorio.elaboradoPor, margin + 35, yPosition);
        yPosition += 6;
      }

      if (dadosRelatorio.cargo) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Cargo:', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(dadosRelatorio.cargo, margin + 20, yPosition);
        yPosition += 6;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.text('Data:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), margin + 18, yPosition);
      yPosition += 10;

      // Linha separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Conteúdo do relatório (remover HTML tags)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = dadosRelatorio.conteudo;
      const textoLimpo = tempDiv.textContent || tempDiv.innerText || '';
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const linhas = textoLimpo.split('\n');
      for (let linha of linhas) {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }
        
        const linhasQuebradas = pdf.splitTextToSize(linha, contentWidth);
        
        for (let linhaQuebrada of linhasQuebradas) {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(linhaQuebrada, margin, yPosition);
          yPosition += 6;
        }
      }

      // Fotos anexas
      if (opcoes.incluirFotos && registro.arquivos?.length > 0) {
        const fotos = registro.arquivos.filter(a => a.tipo?.includes('image'));
        if (fotos.length > 0) {
          pdf.addPage();
          yPosition = margin;
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Anexo - Registros Fotográficos', margin, yPosition);
          yPosition += 10;

          for (let i = 0; i < fotos.length; i++) {
            const foto = fotos[i];
            try {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.src = foto.url;
              await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              });

              const imgWidth = 80;
              const imgHeight = 60;

              if (yPosition + imgHeight > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
              }

              pdf.addImage(img, 'JPEG', margin, yPosition, imgWidth, imgHeight);
              pdf.setFontSize(9);
              pdf.setFont('helvetica', 'italic');
              pdf.text(`Foto ${i + 1}: ${foto.nome || 'Sem descrição'}`, margin, yPosition + imgHeight + 5);
              yPosition += imgHeight + 15;
            } catch (error) {
              console.error('Erro ao adicionar foto:', error);
            }
          }
        }
      }

      // Lista de presença
      if (opcoes.incluirListaPresenca && registro.participantes?.length > 0) {
        pdf.addPage();
        yPosition = margin;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Anexo - Lista de Presença', margin, yPosition);
        yPosition += 10;

        const participantesData = registro.participantes.map((p, idx) => [
          idx + 1,
          p,
          '________________'
        ]);

        pdf.autoTable({
          startY: yPosition,
          head: [['#', 'Nome', 'Assinatura']],
          body: participantesData,
          theme: 'grid',
          headStyles: { fillColor: [43, 106, 79] },
          margin: { left: margin, right: margin }
        });
      }

      // Rodapé em todas as páginas
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Página ${i} de ${totalPages} - Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      pdf.save(`Relatorio_Campo_${registro.titulo?.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
      
      await salvarRelatorio();
      toast.success('PDF gerado com sucesso!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao gerar PDF');
      console.error(error);
    } finally {
      setGerando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2D6A4F]" />
            Gerador de Relatório de Campo
          </DialogTitle>
        </DialogHeader>

        {/* Indicador de etapas */}
        <div className="flex items-center justify-between mb-6 px-4">
          <div className={`flex items-center gap-2 ${etapa === 'selecao' ? 'text-[#2D6A4F] font-semibold' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${etapa === 'selecao' ? 'bg-[#2D6A4F] text-white' : 'bg-slate-200'}`}>1</div>
            <span className="hidden sm:inline">Seleção</span>
          </div>
          <div className="flex-1 h-0.5 bg-slate-200 mx-2" />
          <div className={`flex items-center gap-2 ${etapa === 'edicao' ? 'text-[#2D6A4F] font-semibold' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${etapa === 'edicao' ? 'bg-[#2D6A4F] text-white' : 'bg-slate-200'}`}>2</div>
            <span className="hidden sm:inline">Edição</span>
          </div>
          <div className="flex-1 h-0.5 bg-slate-200 mx-2" />
          <div className={`flex items-center gap-2 ${etapa === 'preview' ? 'text-[#2D6A4F] font-semibold' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${etapa === 'preview' ? 'bg-[#2D6A4F] text-white' : 'bg-slate-200'}`}>3</div>
            <span className="hidden sm:inline">Finalizar</span>
          </div>
        </div>

        {/* Etapa 1: Seleção de conteúdo */}
        {etapa === 'selecao' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#2D6A4F]" />
                  Selecione o conteúdo a ser incluído no relatório
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer">
                    <Checkbox
                      checked={opcoes.incluirFotos}
                      onCheckedChange={(checked) => setOpcoes(p => ({ ...p, incluirFotos: checked }))}
                    />
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    <span>Fotos e Imagens</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer">
                    <Checkbox
                      checked={opcoes.incluirListaPresenca}
                      onCheckedChange={(checked) => setOpcoes(p => ({ ...p, incluirListaPresenca: checked }))}
                    />
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Lista de Presença</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer">
                    <Checkbox
                      checked={opcoes.incluirTranscricao}
                      onCheckedChange={(checked) => setOpcoes(p => ({ ...p, incluirTranscricao: checked }))}
                    />
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>Transcrição/Diálogo</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer">
                    <Checkbox
                      checked={opcoes.incluirDemandas}
                      onCheckedChange={(checked) => setOpcoes(p => ({ ...p, incluirDemandas: checked }))}
                    />
                    <span>Demandas Identificadas</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer">
                    <Checkbox
                      checked={opcoes.incluirCompromissos}
                      onCheckedChange={(checked) => setOpcoes(p => ({ ...p, incluirCompromissos: checked }))}
                    />
                    <span>Compromissos Assumidos</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer">
                    <Checkbox
                      checked={opcoes.incluirProximosPassos}
                      onCheckedChange={(checked) => setOpcoes(p => ({ ...p, incluirProximosPassos: checked }))}
                    />
                    <span>Próximos Passos</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Elaborado por</Label>
                <Input
                  value={dadosRelatorio.elaboradoPor}
                  onChange={(e) => setDadosRelatorio(p => ({ ...p, elaboradoPor: e.target.value }))}
                  placeholder="Nome do responsável"
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo/Função</Label>
                <Input
                  value={dadosRelatorio.cargo}
                  onChange={(e) => setDadosRelatorio(p => ({ ...p, cargo: e.target.value }))}
                  placeholder="Ex: Analista de Relações Comunitárias"
                />
              </div>
            </div>
          </div>
        )}

        {/* Etapa 2: Edição de conteúdo */}
        {etapa === 'edicao' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título do Relatório</Label>
              <Input
                value={dadosRelatorio.titulo}
                onChange={(e) => setDadosRelatorio(p => ({ ...p, titulo: e.target.value }))}
                placeholder="Digite o título do relatório"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Conteúdo do Relatório (editável)
              </Label>
              <div className="border rounded-lg overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={dadosRelatorio.conteudo}
                  onChange={(value) => setDadosRelatorio(p => ({ ...p, conteudo: value }))}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'align': [] }],
                      ['link'],
                      ['clean']
                    ]
                  }}
                  style={{ height: '400px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Etapa 3: Preview */}
        {etapa === 'preview' && (
          <div className="space-y-4">
            <Card className="bg-slate-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Resumo do Relatório</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Título:</strong> {dadosRelatorio.titulo}</p>
                  {dadosRelatorio.elaboradoPor && <p><strong>Elaborado por:</strong> {dadosRelatorio.elaboradoPor}</p>}
                  {dadosRelatorio.cargo && <p><strong>Cargo:</strong> {dadosRelatorio.cargo}</p>}
                  <p><strong>Incluir fotos:</strong> {opcoes.incluirFotos ? 'Sim' : 'Não'}</p>
                  <p><strong>Incluir lista de presença:</strong> {opcoes.incluirListaPresenca ? 'Sim' : 'Não'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Preview do Conteúdo</h3>
                <div 
                  className="prose prose-sm max-w-none border rounded-lg p-4 bg-white max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: dadosRelatorio.conteudo }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {etapa !== 'selecao' && (
            <Button variant="outline" onClick={voltarEtapa}>
              Voltar
            </Button>
          )}
          {etapa !== 'preview' && (
            <Button onClick={proximaEtapa} className="bg-[#2D6A4F] hover:bg-[#1B4332]">
              Próximo
            </Button>
          )}
          {etapa === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setEtapa('edicao')}>
                <Edit3 className="w-4 h-4 mr-2" />
                Editar Novamente
              </Button>
              <Button 
                onClick={gerarPDF} 
                disabled={gerando || salvando}
                className="bg-[#2D6A4F] hover:bg-[#1B4332]"
              >
                {gerando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}