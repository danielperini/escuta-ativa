import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Upload, Mic, Video, Camera, FileText, Loader2, X, Sparkles, 
  Save, Users, Target, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Plus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import AnalisadorTempoReal from '@/components/registro/AnalisadorTempoReal';
import DetectorContinuidade from '@/components/continuidade/DetectorContinuidade';
import DetectorAtores from '@/components/atores/DetectorAtores';
import GravadorAudioCompleto from '@/components/registro/GravadorAudioCompleto';
import { criarAgendasAutomaticas, atualizarHistoricoAtor, registrarAuditoria } from '@/components/registro/AutomacaoAgenda';
import { sincronizarAposRegistro, obterCoordenadas } from '@/components/registro/SincronizadorDados';
import { criarRiscosSociais } from '@/components/analise/AnalisadorRiscosAvancado';
import { criarCompromissos } from '@/components/analise/GeradorCompromissosInteligente';

const tipoOptions = [
  { value: 'reuniao', label: 'Reunião' },
  { value: 'conversa_campo', label: 'Conversa Informal' },
  { value: 'visita', label: 'Visita Técnica' },
  { value: 'demanda', label: 'Demanda Espontânea' },
  { value: 'ocorrencia', label: 'Atividade Comunitária' }
];

export default function NovoRegistro() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [etapa, setEtapa] = useState('entrada');
  const [secaoExpandida, setSecaoExpandida] = useState('basico');
  const [textoConsolidado, setTextoConsolidado] = useState('');
  const [processando, setProcessando] = useState(false);
  const [sugestoesIA, setSugestoesIA] = useState(null);
  const [mostrarDetectores, setMostrarDetectores] = useState(false);
  const [novoParticipante, setNovoParticipante] = useState('');
  const [mostrarGravador, setMostrarGravador] = useState(false);
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
    demandas: [],
    compromissos: [],
    proximos_passos: [],
    arquivos: [],
    resumo_automatico: '',
    status: 'rascunho'
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser-registro'],
    queryFn: () => base44.auth.me()
  });

  const calcularPrazoDevolutiva = (urgencia = 'media') => {
    const diasBase = user?.configuracoes?.prazo_devolutiva_dias || 15;
    const multiplicador = urgencia === 'critica' ? 0.5 : urgencia === 'alta' ? 0.75 : urgencia === 'baixa' ? 1.5 : 1;
    const dias = Math.round(diasBase * multiplicador);
    const prazo = new Date();
    prazo.setDate(prazo.getDate() + dias);
    return prazo.toISOString().split('T')[0];
  };

  const processarArquivo = async (file, tipo, tentativa = 1) => {
    setProcessando(true);
    
    try {
      // Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setFormData(prev => ({
        ...prev,
        arquivos: [...prev.arquivos, { url: file_url, tipo, nome: file.name }]
      }));

      // Prompt específico por tipo
      const promptExtracao = tipo === 'audio' 
        ? `Transcreva COMPLETAMENTE este áudio. Aceite qualquer formato de áudio (.ogg, .opus, .mp3, .wav, .m4a, .aac, .webm). Retorne APENAS o texto transcrito, preservando pontuação e estrutura. Se o formato não for suportado nativamente, tente extrair o máximo possível de informação.`
        : tipo === 'video' 
        ? `Extraia o áudio deste vídeo e transcreva completamente. Retorne APENAS o texto transcrito.`
        : tipo === 'foto' 
        ? `Extraia TODO o texto visível nesta imagem (OCR). Preserve formatação e estrutura.`
        : `Extraia TODO o conteúdo textual deste documento preservando estrutura e formatação.`;

      const extracao = await base44.integrations.Core.InvokeLLM({
        prompt: promptExtracao,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            texto_extraido: { type: "string" },
            formato_detectado: { type: "string" },
            qualidade_extracao: { type: "string" }
          }
        }
      });

      if (extracao.texto_extraido && extracao.texto_extraido.trim()) {
        const blocoTexto = `\n\n[${tipo.toUpperCase()} - ${file.name}]\n${extracao.texto_extraido}\n`;
        setTextoConsolidado(prev => prev + blocoTexto);
        alert(`✅ ${tipo === 'audio' ? 'Áudio transcrito' : 'Arquivo processado'} com sucesso!`);
      } else {
        throw new Error('Nenhum conteúdo foi extraído');
      }
    } catch (error) {
      console.error(`Erro na tentativa ${tentativa}:`, error);
      
      // Retry automático até 2 tentativas
      if (tentativa < 2) {
        alert(`⚠️ Tentando novamente... (${tentativa}/2)`);
        return processarArquivo(file, tipo, tentativa + 1);
      }
      
      // Mensagem amigável após falha
      const tipoNome = tipo === 'audio' ? 'áudio' : tipo === 'video' ? 'vídeo' : 'arquivo';
      alert(
        `❌ Não foi possível processar o ${tipoNome}.\n\n` +
        `Motivo: ${error.message}\n\n` +
        `Dicas:\n` +
        `• Para áudos do WhatsApp (.ogg/.opus): tente gravar novamente\n` +
        `• Verifique se o arquivo não está corrompido\n` +
        `• Tente converter para .mp3 ou .wav antes de enviar\n\n` +
        `O arquivo foi salvo, mas sem transcrição automática.`
      );
    } finally {
      setProcessando(false);
    }
  };

  const handleFileUpload = (e, tipo) => {
    const file = e.target.files[0];
    if (file) processarArquivo(file, tipo);
  };

  const handleTranscricaoAudio = (transcricao, audioUrl) => {
    const blocoTranscricao = `\n\n--- Transcrição do Áudio ---\n${transcricao}\n`;
    setTextoConsolidado(prev => prev + blocoTranscricao);
    setMostrarGravador(false);
  };

  const handleArquivoProcessado = (arquivo) => {
    setFormData(prev => ({
      ...prev,
      arquivos: [...prev.arquivos, arquivo]
    }));
  };

  const removerArquivo = (index) => {
    if (confirm('Deseja remover este arquivo?')) {
      setFormData(prev => ({
        ...prev,
        arquivos: prev.arquivos.filter((_, i) => i !== index)
      }));
    }
  };

  const handleFinalizar = () => {
    if (!formData.titulo || !formData.comunidade) {
      alert('Preencha título e comunidade');
      return;
    }
    setMostrarDetectores(true);
  };

  const finalizarRegistro = async (atoresVinculados = [], continuidades = []) => {
    try {
      // Geocodificar localização
      let localizacao = formData.localizacao;
      if (formData.local && !localizacao?.lat) {
        const coords = await obterCoordenadas(formData.local, formData.comunidade);
        if (coords) {
          localizacao = { lat: coords.lat, lng: coords.lng, endereco: formData.local };
        }
      }

      const dadosFinais = {
        ...formData,
        localizacao,
        status: 'finalizado',
        liderancas_vinculadas: atoresVinculados,
        registros_continuidade: continuidades
      };

      // Criar registro
      const registro = await base44.entities.Registro.create(dadosFinais);
      console.log('✅ Registro criado:', registro.id);
      
      const analiseAvancada = formData.auditoria?.analise_avancada;
      
      // Execuções em paralelo
      const resultados = await Promise.allSettled([
        criarAgendasAutomaticas(registro),
        sincronizarAposRegistro(registro),
        ...atoresVinculados.map(atorId => atualizarHistoricoAtor(atorId, registro.id)),
        registrarAuditoria('Registro', registro.id, 'criacao_completa', null, dadosFinais, 'criacao'),
        analiseAvancada?.riscos?.riscos_identificados?.length > 0 
          ? criarRiscosSociais(analiseAvancada.riscos.riscos_identificados, registro.id, registro.comunidade, localizacao)
          : Promise.resolve([]),
        analiseAvancada?.compromissos_ia?.compromissos_sugeridos?.length > 0
          ? criarCompromissos(analiseAvancada.compromissos_ia.compromissos_sugeridos.slice(0, 3), registro.id, registro.comunidade)
          : Promise.resolve([])
      ]);

      // Log dos resultados
      resultados.forEach((resultado, idx) => {
        if (resultado.status === 'fulfilled') {
          console.log(`✅ Tarefa ${idx + 1} concluída`);
        } else {
          console.error(`❌ Erro na tarefa ${idx + 1}:`, resultado.reason);
        }
      });

      queryClient.invalidateQueries();
      alert('✅ Registro salvo com sucesso!');
      navigate(createPageUrl('Registros'));
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      alert('❌ Erro ao salvar: ' + error.message);
    }
  };

  const SecaoCollapsible = ({ id, titulo, icone: Icone, children, badge }) => (
    <Card className={cn("transition-all", secaoExpandida === id && "ring-2 ring-[#40916C]")}>
      <CardHeader 
        className="cursor-pointer hover:bg-slate-50 transition-colors py-3"
        onClick={() => setSecaoExpandida(secaoExpandida === id ? null : id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icone className="w-5 h-5 text-[#40916C]" />
            <CardTitle className="text-base">{titulo}</CardTitle>
            {badge}
          </div>
          {secaoExpandida === id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </CardHeader>
      {secaoExpandida === id && <CardContent className="pt-4">{children}</CardContent>}
    </Card>
  );

  if (mostrarDetectores) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setMostrarDetectores(false)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Detectando Vínculos</h2>
            <p className="text-sm text-slate-500">IA identificando continuidades e atores</p>
          </div>
        </div>

        <DetectorContinuidade
          atividadeNova={formData}
          onVincular={(continuidades) => setFormData(p => ({ ...p, registros_continuidade: continuidades }))}
          onIgnorar={() => {}}
        />

        <DetectorAtores
          registro={formData}
          onAtoresVinculados={(atores) => finalizarRegistro(atores, formData.registros_continuidade || [])}
        />

        <Button variant="outline" onClick={() => finalizarRegistro([], formData.registros_continuidade || [])}>
          Pular e Finalizar
        </Button>
      </div>
    );
  }

  if (etapa === 'formulario') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setEtapa('entrada')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold">Revisar Registro</h2>
              <p className="text-sm text-slate-500">Ajuste as sugestões da IA</p>
            </div>
          </div>
          <Button onClick={handleFinalizar} className="bg-[#2D6A4F]">
            <Save className="w-4 h-4 mr-2" />
            Finalizar
          </Button>
        </div>

        {sugestoesIA && (
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-900 text-base">
                <Sparkles className="w-5 h-5" />
                Análise IA Completa
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3">
              {sugestoesIA.riscos?.riscos_identificados?.length > 0 && (
                <div className="bg-red-50 p-3 rounded">
                  <p className="font-semibold text-sm text-red-900">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {sugestoesIA.riscos.riscos_identificados.length} Risco(s)
                  </p>
                </div>
              )}
              {sugestoesIA.compromissos_ia?.compromissos_sugeridos?.length > 0 && (
                <div className="bg-blue-50 p-3 rounded">
                  <p className="font-semibold text-sm text-blue-900">
                    <Target className="w-4 h-4 inline mr-1" />
                    {sugestoesIA.compromissos_ia.compromissos_sugeridos.length} Compromisso(s)
                  </p>
                </div>
              )}
              {sugestoesIA.continuidade?.continuidades_detectadas?.length > 0 && (
                <div className="bg-purple-50 p-3 rounded">
                  <p className="font-semibold text-sm text-purple-900">
                    <Users className="w-4 h-4 inline mr-1" />
                    {sugestoesIA.continuidade.continuidades_detectadas.length} Continuidade(s)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <SecaoCollapsible 
            id="basico" 
            titulo="Informações Básicas" 
            icone={FileText}
            badge={(!formData.titulo || !formData.comunidade) && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
          >
            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input value={formData.titulo} onChange={(e) => setFormData(p => ({ ...p, titulo: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(v) => setFormData(p => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tipoOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Comunidade *</Label>
                  <Select value={formData.comunidade} onValueChange={(v) => setFormData(p => ({ ...p, comunidade: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {comunidades.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Local</Label>
                <Input value={formData.local} onChange={(e) => setFormData(p => ({ ...p, local: e.target.value }))} />
              </div>
              <div>
                <Label>Participantes</Label>
                <div className="flex gap-2 mb-2">
                  <Input 
                    placeholder="Nome" 
                    value={novoParticipante} 
                    onChange={(e) => setNovoParticipante(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && novoParticipante.trim()) {
                        e.preventDefault();
                        setFormData(p => ({ ...p, participantes: [...p.participantes, novoParticipante.trim()] }));
                        setNovoParticipante('');
                      }
                    }}
                  />
                  <Button size="icon" variant="outline" onClick={() => {
                    if (novoParticipante.trim()) {
                      setFormData(p => ({ ...p, participantes: [...p.participantes, novoParticipante.trim()] }));
                      setNovoParticipante('');
                    }
                  }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.participantes.map((p, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      {p}
                      <button onClick={() => setFormData(prev => ({ ...prev, participantes: prev.participantes.filter((_, idx) => idx !== i) }))}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </SecaoCollapsible>

          <SecaoCollapsible 
            id="temas" 
            titulo="Temas" 
            icone={Target}
            badge={formData.temas_identificados.length > 0 && <Badge className="bg-emerald-100 text-emerald-700">{formData.temas_identificados.length}</Badge>}
          >
            <div className="flex flex-wrap gap-2">
              {formData.temas_identificados.map((t, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {t}
                  <button onClick={() => setFormData(p => ({ ...p, temas_identificados: p.temas_identificados.filter((_, idx) => idx !== i) }))}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </SecaoCollapsible>

          <SecaoCollapsible 
            id="demandas" 
            titulo="Demandas" 
            icone={AlertTriangle}
            badge={formData.demandas.length > 0 && <Badge className="bg-amber-100 text-amber-700">{formData.demandas.length}</Badge>}
          >
            <div className="space-y-2">
              {formData.demandas.map((d, i) => (
                <div key={i} className="p-3 bg-amber-50 rounded border group relative">
                  <button 
                    onClick={() => setFormData(p => ({ ...p, demandas: p.demandas.filter((_, idx) => idx !== i) }))}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                  <p className="text-sm font-medium pr-6">{d.descricao}</p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <Badge variant="secondary">{d.urgencia}</Badge>
                    <Badge variant="outline">Devolutiva: {new Date(d.prazo_devolutiva).toLocaleDateString('pt-BR')}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </SecaoCollapsible>

          <SecaoCollapsible 
            id="compromissos" 
            titulo="Compromissos" 
            icone={CheckCircle2}
            badge={formData.compromissos.length > 0 && <Badge className="bg-emerald-100 text-emerald-700">{formData.compromissos.length}</Badge>}
          >
            <div className="space-y-2">
              {formData.compromissos.map((c, i) => (
                <div key={i} className="p-3 bg-emerald-50 rounded border group relative">
                  <button 
                    onClick={() => setFormData(p => ({ ...p, compromissos: p.compromissos.filter((_, idx) => idx !== i) }))}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                  <p className="text-sm font-medium pr-6">{c.descricao}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {c.responsavel && `Responsável: ${c.responsavel}`}
                    {c.prazo && ` • Prazo: ${new Date(c.prazo).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
              ))}
            </div>
          </SecaoCollapsible>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Novo Registro</h2>
          <p className="text-slate-500">Grave, envie ou digite sua escuta</p>
        </div>
      </div>

      {mostrarGravador && (
        <GravadorAudioCompleto
          onTranscricao={handleTranscricaoAudio}
          onArquivoProcessado={handleArquivoProcessado}
        />
      )}

      <Card className="border-2 border-dashed border-[#40916C]/30">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#40916C]/10 flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-[#40916C]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Escolha o formato</h3>
              <p className="text-sm text-slate-500">Tudo será convertido em texto editável</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-3xl mx-auto pt-4">
              <button
                onClick={() => setMostrarGravador(!mostrarGravador)}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl hover:bg-slate-50 hover:border-[#40916C] transition-all"
              >
                <Mic className="w-8 h-8 text-[#40916C] mb-2" />
                <span className="text-sm font-medium">Gravar</span>
                <span className="text-xs text-slate-400 mt-1">Microfone</span>
              </button>
              
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#40916C] transition-all">
                <Upload className="w-8 h-8 text-[#40916C] mb-2" />
                <span className="text-sm font-medium">Áudio</span>
                <span className="text-xs text-slate-400 mt-1">ogg, opus, mp3</span>
                <input 
                  type="file" 
                  accept="audio/*,.ogg,.opus,.mp3,.wav,.m4a,.aac,.webm" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'audio')} 
                  disabled={processando} 
                />
              </label>
              
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#40916C] transition-all">
                <Video className="w-8 h-8 text-[#40916C] mb-2" />
                <span className="text-sm font-medium">Vídeo</span>
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} disabled={processando} />
              </label>
              
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#40916C] transition-all">
                <Camera className="w-8 h-8 text-[#40916C] mb-2" />
                <span className="text-sm font-medium">Foto</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'foto')} disabled={processando} />
              </label>
              
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#40916C] transition-all">
                <FileText className="w-8 h-8 text-[#40916C] mb-2" />
                <span className="text-sm font-medium">PDF/Doc</span>
                <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => handleFileUpload(e, 'documento')} disabled={processando} />
              </label>
              
              <button
                onClick={() => setEtapa('entrada')}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl hover:bg-slate-50 hover:border-[#40916C] transition-all"
              >
                <FileText className="w-8 h-8 text-[#40916C] mb-2" />
                <span className="text-sm font-medium">Digitar</span>
              </button>
            </div>

            {processando && (
              <div className="flex items-center justify-center gap-2 text-slate-600 pt-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processando...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {formData.arquivos.length > 0 && (
        <Card className="border-2 border-blue-500">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-base">
              📎 Arquivos Anexados ({formData.arquivos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {formData.arquivos.map((arquivo, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {arquivo.tipo === 'audio' ? <Mic className="w-5 h-5 text-blue-600" /> :
                     arquivo.tipo === 'video' ? <Video className="w-5 h-5 text-purple-600" /> :
                     arquivo.tipo === 'foto' ? <Camera className="w-5 h-5 text-green-600" /> :
                     <FileText className="w-5 h-5 text-slate-600" />}
                    <div>
                      <p className="text-sm font-medium">{arquivo.nome}</p>
                      <p className="text-xs text-slate-500">{arquivo.tipo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(arquivo.url, '_blank')}
                    >
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerArquivo(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-[#40916C]">
        <CardHeader className="bg-emerald-50">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5" />
            Texto Consolidado
            {textoConsolidado.length > 0 && (
              <Badge className="bg-emerald-600">{textoConsolidado.length} caracteres</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Textarea
            className="min-h-[400px] font-mono text-sm"
            placeholder="Digite ou cole o conteúdo aqui. A IA analisará automaticamente..."
            value={textoConsolidado}
            onChange={(e) => setTextoConsolidado(e.target.value)}
          />

          <p className="text-xs text-slate-500 text-center">
            💡 A IA analisa automaticamente enquanto você digita
          </p>
        </CardContent>
      </Card>

      <AnalisadorTempoReal
        textoConsolidado={textoConsolidado}
        formData={formData}
        onSugestoesGeradas={(sugestoes) => {
          setSugestoesIA(sugestoes);
          
          setFormData(prev => ({
            ...prev,
            titulo: sugestoes.analise_basica.titulo_sugerido || prev.titulo,
            tipo: sugestoes.analise_basica.tipo_sugerido || prev.tipo,
            temas_identificados: sugestoes.analise_basica.temas_identificados || [],
            participantes: [...new Set([...prev.participantes, ...(sugestoes.analise_basica.participantes || [])])],
            demandas: (sugestoes.analise_basica.demandas || []).map(d => ({
              descricao: d.descricao,
              urgencia: d.urgencia,
              status: 'pendente',
              requer_devolutiva: true,
              prazo_devolutiva: calcularPrazoDevolutiva(d.urgencia)
            })),
            compromissos: (sugestoes.analise_basica.compromissos || []).map(c => ({
              descricao: c.descricao,
              responsavel: c.responsavel || 'A definir',
              status: 'pendente'
            })),
            sentimento: sugestoes.analise_basica.sentimento || prev.sentimento,
            temperatura_territorio: sugestoes.analise_basica.temperatura_territorio || prev.temperatura_territorio,
            local: sugestoes.analise_basica.local_especifico || prev.local,
            transcricao: textoConsolidado,
            auditoria: {
              analise_avancada: {
                riscos: sugestoes.riscos,
                compromissos_ia: sugestoes.compromissos_ia,
                continuidade: sugestoes.continuidade
              }
            }
          }));
          
          setEtapa('formulario');
        }}
      />
    </div>
  );
}