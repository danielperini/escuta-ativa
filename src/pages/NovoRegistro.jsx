import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Mic, 
  Video, 
  Camera,
  FileText,
  Loader2,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import AnalisadorMidia from '@/components/registro/AnalisadorMidia';
import Etapa1Basico from '@/components/registro/Etapa1Basico';
import Etapa2Conteudos from '@/components/registro/Etapa2Conteudos';

export default function NovoRegistro() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [etapaAtual, setEtapaAtual] = useState('upload'); // upload, etapa1, etapa2
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'conversa_campo',
    descricao: '',
    transcricao: '',
    participantes: [],
    comunidade: '',
    local: '',
    data_registro: new Date().toISOString().split('T')[0],
    temas_identificados: [],
    sentimento: '',
    temperatura_territorio: '',
    indicadores_risco: [],
    demandas: [],
    compromissos: [],
    proximos_passos: [],
    arquivos: [],
    resumo_automatico: '',
    status: 'rascunho',
    status_sincronizacao: 'concluido'
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [arquivoParaAnalisar, setArquivoParaAnalisar] = useState(null);
  const [camposPreenchidosAuto, setCamposPreenchidosAuto] = useState([]);
  const [camposPendentes, setCamposPendentes] = useState([]);
  const [statusSincronizacao, setStatusSincronizacao] = useState('concluido');
  const [textoDigitado, setTextoDigitado] = useState('');
  const [modoTexto, setModoTexto] = useState(false);

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Registro.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros'] });
      navigate(createPageUrl('Registros'));
    }
  });

  const handleFileUpload = async (e, tipo) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setStatusSincronizacao('sincronizando');
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const arquivoInfo = { url: file_url, tipo, nome: file.name };
      
      setFormData(prev => ({
        ...prev,
        arquivos: [...prev.arquivos, arquivoInfo]
      }));
      
      setArquivoParaAnalisar(arquivoInfo);
      setStatusSincronizacao('concluido');
    } catch (error) {
      setStatusSincronizacao('erro');
      console.error('Erro no upload:', error);
    }
    
    setIsUploading(false);
  };

  const handleAnalisarTexto = () => {
    if (!textoDigitado.trim()) return;
    
    const arquivoTexto = {
      tipo: 'texto',
      nome: 'Texto digitado',
      conteudo: textoDigitado
    };
    
    setArquivoParaAnalisar(arquivoTexto);
  };

  const handleAnaliseCompleta = (resultado) => {
    const { analise, transcricao, camposPreenchidos } = resultado;
    
    const novosValores = {
      titulo: analise.titulo_sugerido || formData.titulo,
      tipo: analise.tipo_sugerido || formData.tipo,
      descricao: analise.resumo_automatico || formData.descricao,
      transcricao: transcricao,
      participantes: [...formData.participantes, ...(analise.participantes || [])],
      comunidade: analise.comunidade || formData.comunidade,
      data_registro: analise.data_mencionada || formData.data_registro,
      temas_identificados: [...formData.temas_identificados, ...(analise.temas || [])],
      sentimento: analise.sentimento || formData.sentimento,
      temperatura_territorio: analise.temperatura_territorio,
      indicadores_risco: analise.indicadores_risco || [],
      demandas: [...formData.demandas, ...(analise.demandas?.map(d => ({ ...d, status: 'pendente' })) || [])],
      compromissos: [...formData.compromissos, ...(analise.compromissos?.map(c => ({ ...c, status: 'pendente' })) || [])],
      proximos_passos: [...formData.proximos_passos, ...(analise.proximos_passos || [])],
      resumo_automatico: analise.resumo_automatico,
      preenchimento_automatico: {
        origem: resultado.origem,
        campos_preenchidos: camposPreenchidos,
        confianca: resultado.confianca,
        timestamp: new Date().toISOString()
      },
      auditoria: {
        arquivos_originais: formData.arquivos.map(a => a.url),
        transcricao_raw: transcricao,
        versao_estruturada: analise,
        insights_ia: analise.insights || [],
        materialidade_detectada: analise.temas || [],
        historico_alteracoes: []
      }
    };

    setFormData(prev => ({ ...prev, ...novosValores }));
    setCamposPreenchidosAuto(camposPreenchidos);
    
    const pendentes = [];
    if (!novosValores.titulo) pendentes.push('titulo');
    if (!novosValores.comunidade) pendentes.push('comunidade');
    if (novosValores.participantes.length === 0) pendentes.push('participantes');
    
    setCamposPendentes(pendentes);
    setArquivoParaAnalisar(null);
    
    // Avançar automaticamente para etapa 1
    setEtapaAtual('etapa1');
  };

  const handleProximaEtapa = () => {
    setEtapaAtual('etapa2');
  };

  const handleVoltarEtapa = () => {
    setEtapaAtual('etapa1');
  };

  const handleFinalizar = () => {
    const dadosFinais = {
      ...formData,
      status: 'finalizado',
      localizacao: formData.local ? { endereco: formData.local } : undefined
    };
    createMutation.mutate(dadosFinais);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Registros')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Novo Registro de Campo</h2>
            <p className="text-slate-500">
              {etapaAtual === 'upload' && 'Envie um documento para análise automática'}
              {etapaAtual === 'etapa1' && 'Etapa 1 de 2: Informações Básicas'}
              {etapaAtual === 'etapa2' && 'Etapa 2 de 2: Temas e Conteúdos'}
            </p>
          </div>
        </div>
        
        {statusSincronizacao !== 'concluido' && (
          <Badge 
            variant="secondary" 
            className={cn(
              statusSincronizacao === 'sincronizando' && "bg-blue-100 text-blue-700 animate-pulse",
              statusSincronizacao === 'pendente' && "bg-amber-100 text-amber-700",
              statusSincronizacao === 'erro' && "bg-red-100 text-red-700"
            )}
          >
            {statusSincronizacao === 'sincronizando' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            {statusSincronizacao}
          </Badge>
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
          etapaAtual === 'upload' ? "bg-[#2D6A4F] text-white" : "bg-slate-200 text-slate-600"
        )}>
          <Upload className="w-4 h-4" />
          Upload
        </div>
        <div className="w-8 h-px bg-slate-300" />
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
          etapaAtual === 'etapa1' ? "bg-[#2D6A4F] text-white" : "bg-slate-200 text-slate-600"
        )}>
          1
        </div>
        <div className="w-8 h-px bg-slate-300" />
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
          etapaAtual === 'etapa2' ? "bg-[#2D6A4F] text-white" : "bg-slate-200 text-slate-600"
        )}>
          2
        </div>
      </div>

      {/* Upload Stage */}
      {etapaAtual === 'upload' && (
        <div className="space-y-6">
          <Card className="border-2 border-dashed border-[#40916C]/30 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#40916C]/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-[#40916C]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Envie seu documento para análise automática
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    A IA vai ler, interpretar e preencher todos os campos automaticamente
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-3xl mx-auto pt-4">
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors hover:border-[#40916C]">
                    <Mic className="w-8 h-8 text-[#40916C] mb-2" />
                    <span className="text-sm font-medium text-slate-700">Áudio</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'audio')}
                      disabled={isUploading}
                    />
                  </label>
                  
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors hover:border-[#40916C]">
                    <Video className="w-8 h-8 text-[#40916C] mb-2" />
                    <span className="text-sm font-medium text-slate-700">Vídeo</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'video')}
                      disabled={isUploading}
                    />
                  </label>
                  
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors hover:border-[#40916C]">
                    <Camera className="w-8 h-8 text-[#40916C] mb-2" />
                    <span className="text-sm font-medium text-slate-700">Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'foto')}
                      disabled={isUploading}
                    />
                  </label>
                  
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors hover:border-[#40916C]">
                    <FileText className="w-8 h-8 text-[#40916C] mb-2" />
                    <span className="text-sm font-medium text-slate-700">PDF/Doc</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'documento')}
                      disabled={isUploading}
                    />
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => setModoTexto(!modoTexto)}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-colors",
                      modoTexto 
                        ? "bg-[#40916C] border-[#40916C] text-white" 
                        : "hover:bg-slate-50 hover:border-[#40916C]"
                    )}
                  >
                    <FileText className={cn("w-8 h-8 mb-2", modoTexto ? "text-white" : "text-[#40916C]")} />
                    <span className="text-sm font-medium">Texto</span>
                  </button>
                </div>

                {isUploading && (
                  <div className="flex items-center justify-center gap-2 text-slate-600 pt-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando arquivo...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Text input mode */}
          {modoTexto && (
            <Card className="border-2 border-[#40916C]">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      Digite ou Cole o Texto da Reunião
                    </h3>
                    <p className="text-sm text-slate-500">
                      Escreva ou cole a descrição, ata ou anotações da interação comunitária
                    </p>
                  </div>
                  <textarea
                    className="w-full min-h-[300px] p-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40916C] focus:border-transparent resize-none"
                    placeholder="Cole ou digite aqui...&#10;&#10;Exemplo:&#10;Reunião realizada em 10/01/2025 com a Associação de Moradores da Vila Nova.&#10;&#10;Participantes: Maria Silva (presidente), João Santos, Pedro Oliveira.&#10;&#10;Pautas discutidas:&#10;- Solicitação de reforma do posto de saúde&#10;- Demanda por cursos de capacitação para jovens&#10;&#10;Compromissos:&#10;- Empresa irá apresentar proposta até dia 20/01&#10;- Responsável: equipe de projetos sociais..."
                    value={textoDigitado}
                    onChange={(e) => setTextoDigitado(e.target.value)}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">
                      {textoDigitado.length} caracteres
                    </span>
                    <Button
                      onClick={handleAnalisarTexto}
                      disabled={!textoDigitado.trim()}
                      className="bg-[#40916C] hover:bg-[#2D6A4F] gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Analisar com IA
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info card */}
          <Card className="bg-blue-50/50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Como funciona:</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Envie um documento (ata, foto de caderno, áudio de reunião, etc)</li>
                    <li>• A IA analisa e extrai: título, participantes, temas, demandas e compromissos</li>
                    <li>• Você revisa e completa informações em 2 etapas simples</li>
                    <li>• Pronto! Seu registro alimenta automaticamente o dashboard</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analisador de mídia */}
      {arquivoParaAnalisar && (
        <AnalisadorMidia
          arquivo={arquivoParaAnalisar}
          onAnaliseCompleta={handleAnaliseCompleta}
        />
      )}

      {/* Notification after analysis */}
      {etapaAtual === 'etapa1' && camposPreenchidosAuto.length > 0 && (
        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-900">
                  Análise concluída! {camposPreenchidosAuto.length} campos preenchidos
                </h3>
                <p className="text-sm text-emerald-700 mt-1">
                  Revise as informações abaixo e complete os campos em destaque, depois avance para a próxima etapa.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa 1 */}
      {etapaAtual === 'etapa1' && (
        <Etapa1Basico
          formData={formData}
          setFormData={setFormData}
          comunidades={comunidades}
          camposPreenchidosAuto={camposPreenchidosAuto}
          camposPendentes={camposPendentes}
          onProximaEtapa={handleProximaEtapa}
        />
      )}

      {/* Etapa 2 */}
      {etapaAtual === 'etapa2' && (
        <Etapa2Conteudos
          formData={formData}
          setFormData={setFormData}
          camposPreenchidosAuto={camposPreenchidosAuto}
          onVoltarEtapa={handleVoltarEtapa}
          onFinalizar={handleFinalizar}
          isFinalizando={createMutation.isPending}
        />
      )}
    </div>
  );
}