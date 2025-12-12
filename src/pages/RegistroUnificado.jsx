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
  CheckCircle2,
  Plus,
  Save,
  Users,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import DetectorContinuidade from '@/components/continuidade/DetectorContinuidade';
import DetectorAtores from '@/components/atores/DetectorAtores';
import ProcessadorMidia from '@/components/registro/ProcessadorMidia';
import { criarAgendasAutomaticas, atualizarHistoricoAtor, registrarAuditoria } from '@/components/registro/AutomacaoAgenda';
import { sincronizarAposRegistro, obterCoordenadas } from '@/components/registro/SincronizadorDados';
import { analisarRiscosSociais, criarRiscosSociais } from '@/components/analise/AnalisadorRiscosAvancado';
import { gerarCompromissosInteligentes, criarCompromissos } from '@/components/analise/GeradorCompromissosInteligente';
import { detectarContinuidadeInteligente } from '@/components/analise/DetectorContinuidadeAvancado';
import { gerarResumoExecutivo, gerarAtaReuniao } from '@/components/analise/GeradorResumoExecutivo';

const tipoOptions = [
  { value: 'reuniao', label: 'Reunião' },
  { value: 'conversa_campo', label: 'Conversa Informal' },
  { value: 'visita', label: 'Visita Técnica' },
  { value: 'demanda', label: 'Demanda Espontânea' },
  { value: 'ocorrencia', label: 'Atividade Comunitária' }
];

export default function RegistroUnificado() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [etapaAtual, setEtapaAtual] = useState('upload');
  const [secaoExpandida, setSecaoExpandida] = useState('basico');
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
    status: 'rascunho'
  });
  
  const [processando, setProcessando] = useState(false);
  const [analisando, setAnalisando] = useState(false);
  const [textoConsolidado, setTextoConsolidado] = useState('');
  const [arquivosProcessados, setArquivosProcessados] = useState([]);
  const [novoParticipante, setNovoParticipante] = useState('');
  const [mostrarDetectores, setMostrarDetectores] = useState(false);
  const [registroTemporario, setRegistroTemporario] = useState(null);
  const [errosProcessamento, setErrosProcessamento] = useState([]);

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser-registro'],
    queryFn: () => base44.auth.me()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Registro.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros'] });
      navigate(createPageUrl('Registros'));
    }
  });

  const calcularPrazoDevolutiva = (urgencia = 'media') => {
    const diasBase = user?.configuracoes?.prazo_devolutiva_dias || 15;
    const multiplicador = urgencia === 'critica' ? 0.5 : urgencia === 'alta' ? 0.75 : urgencia === 'baixa' ? 1.5 : 1;
    const dias = Math.round(diasBase * multiplicador);
    const prazo = new Date();
    prazo.setDate(prazo.getDate() + dias);
    return prazo.toISOString().split('T')[0];
  };

  const processarArquivo = async (file, tipo) => {
    setProcessando(true);
    setErrosProcessamento([]);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const arquivoInfo = { url: file_url, tipo, nome: file.name };
      setArquivosProcessados(prev => [...prev, arquivoInfo]);
      
      setFormData(prev => ({
        ...prev,
        arquivos: [...prev.arquivos, arquivoInfo]
      }));

      // Extrair texto do arquivo
      const promptExtracao = `Extraia TODO o texto deste ${tipo}:

Para ${tipo === 'audio' ? 'áudio, faça transcrição completa' : tipo === 'video' ? 'vídeo, extraia o áudio e transcreva' : tipo === 'foto' ? 'foto/imagem, extraia todo texto visível (OCR)' : tipo === 'documento' ? 'PDF/DOC, extraia todo o texto preservando estrutura' : 'arquivo, extraia todo o conteúdo textual'}

IMPORTANTE: 
- Retorne APENAS o texto extraído/transcrito
- Não faça análise nem interpretação
- Mantenha ordem e formatação quando possível
- Se for conversa, mantenha falas identificadas
- Se for documento, preserve títulos e parágrafos`;

      const extracao = await base44.integrations.Core.InvokeLLM({
        prompt: promptExtracao,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            texto_extraido: { type: "string" },
            tipo_conteudo: { type: "string" },
            qualidade_extracao: { type: "string" }
          }
        }
      });

      if (!extracao.texto_extraido) {
        throw new Error('Não foi possível extrair texto do arquivo');
      }

      // Adicionar texto extraído à caixa consolidada
      const blocoTexto = `\n\n[${tipo.toUpperCase()} - ${file.name}]\n${extracao.texto_extraido}\n`;
      setTextoConsolidado(prev => prev + blocoTexto);
      
      setEtapaAtual('texto');
    } catch (error) {
      console.error('Erro ao processar:', error);
      setErrosProcessamento(prev => [...prev, { arquivo: file.name, erro: error.message }]);
      alert('Erro ao processar arquivo: ' + error.message + '\n\nTente reprocessar ou digite o conteúdo manualmente.');
    } finally {
      setProcessando(false);
    }
  };

  const handleFileUpload = (e, tipo) => {
    const file = e.target.files[0];
    if (file) processarArquivo(file, tipo);
  };

  const analisarTextoConsolidado = async () => {
    if (!textoConsolidado.trim()) {
      alert('A caixa de texto está vazia. Adicione conteúdo antes de analisar.');
      return;
    }
    
    setAnalisando(true);

    try {
      const analise = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise APENAS este texto consolidado de interação comunitária e extraia dados estruturados:

TEXTO PARA ANÁLISE:
${textoConsolidado}

Extraia:
1. Título sugerido
2. Tipo (reuniao, conversa_campo, visita, demanda, ocorrencia)
3. Participantes mencionados
4. Comunidade/território
5. Data (YYYY-MM-DD)
6. Temas discutidos
7. Demandas (cada uma com descricao e urgencia)
8. Compromissos (cada um com descricao, responsavel, prazo)
9. Próximos passos
10. Sentimento (positivo/neutro/negativo/misto)
11. Temperatura do território (baixo/medio/alto/critico)
12. Resumo em 2-3 parágrafos`,
        response_json_schema: {
          type: "object",
          properties: {
            titulo_sugerido: { type: "string" },
            tipo_sugerido: { type: "string" },
            participantes: { type: "array", items: { type: "string" } },
            comunidade: { type: "string" },
            temas: { type: "array", items: { type: "string" } },
            demandas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  descricao: { type: "string" },
                  urgencia: { type: "string" }
                }
              }
            },
            compromissos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  descricao: { type: "string" },
                  responsavel: { type: "string" }
                }
              }
            },
            resumo_automatico: { type: "string" }
          }
        }
      });

      const demandasProcessadas = (analise.demandas || []).map(d => ({
        ...d,
        status: 'pendente',
        requer_devolutiva: true,
        prazo_devolutiva: calcularPrazoDevolutiva(d.urgencia),
        devolutiva_realizada: false
      }));

      const compromissosProcessados = (analise.compromissos || []).map(c => ({
        ...c,
        status: 'pendente',
        prazo: calcularPrazoDevolutiva('media')
      }));

      setFormData(prev => ({
        ...prev,
        titulo: analise.titulo_sugerido || prev.titulo,
        tipo: analise.tipo_sugerido || prev.tipo,
        descricao: analise.resumo_automatico || textoConsolidado.substring(0, 500),
        transcricao: textoConsolidado,
        participantes: analise.participantes || [],
        comunidade: analise.comunidade || '',
        data_registro: analise.data_mencionada || prev.data_registro,
        temas_identificados: analise.temas || [],
        sentimento: analise.sentimento || '',
        temperatura_territorio: analise.temperatura_territorio || '',
        demandas: demandasProcessadas,
        compromissos: compromissosProcessados,
        proximos_passos: analise.proximos_passos || [],
        resumo_automatico: analise.resumo_automatico
      }));

      setEtapaAtual('formulario');
      setSecaoExpandida('basico');
    } catch (error) {
      alert('Erro ao analisar texto: ' + error.message);
    } finally {
      setAnalisando(false);
    }
  };

  const handleFinalizar = async () => {
    if (!formData.titulo || !formData.comunidade) {
      alert('Preencha título e comunidade');
      return;
    }

    setRegistroTemporario(formData);
    setMostrarDetectores(true);
  };

  const finalizarComVinculacoes = async (atoresVinculados = [], continuidades = []) => {
    // Obter coordenadas se tiver local mas não tiver localização
    let localizacao = formData.localizacao;
    if (formData.local && !localizacao?.lat) {
      const coords = await obterCoordenadas(formData.local, formData.comunidade);
      if (coords) {
        localizacao = {
          lat: coords.lat,
          lng: coords.lng,
          endereco: formData.local
        };
      }
    }

    const dadosFinais = {
      ...formData,
      localizacao,
      status: 'finalizado',
      liderancas_vinculadas: atoresVinculados,
      registros_continuidade: continuidades
    };

    try {
      const registroCriado = await base44.entities.Registro.create(dadosFinais);
      
      // Criar riscos e compromissos da análise avançada
      const analiseAvancada = formData.auditoria?.analise_avancada;
      
      const automacoes = [
        criarAgendasAutomaticas(registroCriado),
        sincronizarAposRegistro(registroCriado),
        ...atoresVinculados.map(atorId => atualizarHistoricoAtor(atorId, registroCriado.id)),
        registrarAuditoria('Registro', registroCriado.id, 'criacao_completa', null, dadosFinais, 'criacao')
      ];

      // Criar riscos sociais detectados
      if (analiseAvancada?.riscos?.riscos_identificados?.length > 0) {
        automacoes.push(
          criarRiscosSociais(
            analiseAvancada.riscos.riscos_identificados,
            registroCriado.id,
            registroCriado.comunidade,
            registroCriado.localizacao
          )
        );
      }

      // Criar compromissos sugeridos pela IA
      if (analiseAvancada?.compromissos_ia?.compromissos_sugeridos?.length > 0) {
        automacoes.push(
          criarCompromissos(
            analiseAvancada.compromissos_ia.compromissos_sugeridos.slice(0, 3), // Top 3
            registroCriado.id,
            registroCriado.comunidade
          )
        );
      }

      await Promise.all(automacoes);

      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['registros'] });
      queryClient.invalidateQueries({ queryKey: ['agendas'] });
      queryClient.invalidateQueries({ queryKey: ['atores'] });
      queryClient.invalidateQueries({ queryKey: ['comunidades'] });
      queryClient.invalidateQueries({ queryKey: ['temas'] });
      queryClient.invalidateQueries({ queryKey: ['riscos'] });
      queryClient.invalidateQueries({ queryKey: ['compromissos'] });
      
      navigate(createPageUrl('Registros'));
    } catch (error) {
      alert('Erro ao finalizar registro: ' + error.message);
    }
  };

  const SecaoCollapsible = ({ id, titulo, icone: Icone, children, badge }) => (
    <Card className={cn("transition-all", secaoExpandida === id && "ring-2 ring-[#40916C]")}>
      <CardHeader 
        className="cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setSecaoExpandida(secaoExpandida === id ? null : id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icone className="w-5 h-5 text-[#40916C]" />
            <CardTitle className="text-lg">{titulo}</CardTitle>
            {badge}
          </div>
          {secaoExpandida === id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </CardHeader>
      {secaoExpandida === id && <CardContent className="pt-4">{children}</CardContent>}
    </Card>
  );

  if (etapaAtual === 'upload' || etapaAtual === 'texto') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Novo Registro</h2>
            <p className="text-slate-500">
              {etapaAtual === 'upload' ? 'Envie arquivos ou digite o texto' : 'Revise o texto antes de analisar'}
            </p>
          </div>
        </div>

        {etapaAtual === 'upload' && (
          <Card className="border-2 border-dashed border-[#40916C]/30">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#40916C]/10 flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-[#40916C]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Envie arquivos ou digite</h3>
                  <p className="text-sm text-slate-500">Todos os arquivos serão convertidos em texto editável</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-3xl mx-auto pt-4">
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#40916C] transition-all">
                    <Mic className="w-8 h-8 text-[#40916C] mb-2" />
                    <span className="text-sm font-medium">Áudio</span>
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'audio')} disabled={processando} />
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
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileUpload(e, 'documento')} disabled={processando} />
                  </label>
                  
                  <button
                    onClick={() => setEtapaAtual('texto')}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl hover:bg-slate-50 hover:border-[#40916C] transition-all"
                  >
                    <FileText className="w-8 h-8 text-[#40916C] mb-2" />
                    <span className="text-sm font-medium">Digitar</span>
                  </button>
                </div>

                {processando && (
                  <div className="flex items-center justify-center gap-2 text-slate-600 pt-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando e extraindo texto...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CAIXA DE TEXTO CONSOLIDADA */}
        <Card className="border-2 border-[#40916C]">
          <CardHeader className="bg-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Texto Consolidado
              {arquivosProcessados.length > 0 && (
                <Badge className="bg-emerald-600">{arquivosProcessados.length} arquivo(s)</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {arquivosProcessados.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {arquivosProcessados.map((arq, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {arq.tipo}: {arq.nome}
                  </Badge>
                ))}
              </div>
            )}

            <Textarea
              className="min-h-[400px] font-mono text-sm"
              placeholder="O texto extraído dos arquivos aparecerá aqui. Você pode editar antes de analisar.

Ou digite/cole o conteúdo diretamente..."
              value={textoConsolidado}
              onChange={(e) => setTextoConsolidado(e.target.value)}
            />

            {errosProcessamento.length > 0 && (
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <p className="text-sm font-semibold text-red-900 mb-2">⚠️ Erros de Processamento:</p>
                {errosProcessamento.map((err, i) => (
                  <p key={i} className="text-xs text-red-700">• {err.arquivo}: {err.erro}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={analisarTextoConsolidado}
                disabled={!textoConsolidado.trim() || analisando}
                className="flex-1 bg-[#2D6A4F]"
                size="lg"
              >
                {analisando ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analisando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analisar Texto com IA
                  </>
                )}
              </Button>
              {textoConsolidado && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setTextoConsolidado('');
                    setArquivosProcessados([]);
                    setErrosProcessamento([]);
                  }}
                >
                  Limpar
                </Button>
              )}
            </div>

            <p className="text-xs text-slate-500 text-center">
              ⚠️ A análise será baseada APENAS no texto desta caixa. Revise antes de continuar.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mostrarDetectores) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setMostrarDetectores(false)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Detectando Vínculos</h2>
            <p className="text-sm text-slate-500">A IA está identificando continuidades e atores</p>
          </div>
        </div>

        <DetectorContinuidade
          atividadeNova={registroTemporario}
          onVincular={(continuidades) => {
            setFormData(prev => ({ ...prev, registros_continuidade: continuidades }));
          }}
          onIgnorar={() => {}}
        />

        <DetectorAtores
          registro={registroTemporario}
          onAtoresVinculados={(atores) => {
            finalizarComVinculacoes(atores, formData.registros_continuidade || []);
          }}
        />

        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => finalizarComVinculacoes([], formData.registros_continuidade || [])}
          >
            Pular e Finalizar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setEtapaAtual('upload')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Novo Registro</h2>
            <p className="text-sm text-slate-500">Revise e complete as informações</p>
          </div>
        </div>
        <Button onClick={handleFinalizar} disabled={createMutation.isPending} className="bg-[#2D6A4F]">
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Finalizar
        </Button>
      </div>

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
              <Input value={formData.titulo} onChange={(e) => setFormData(p => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Reunião com Associação" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
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
              <Label>Descrição</Label>
              <Textarea rows={4} value={formData.descricao} onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div>
              <Label>Participantes</Label>
              <div className="flex gap-2 mb-2">
                <Input placeholder="Nome" value={novoParticipante} onChange={(e) => setNovoParticipante(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), novoParticipante.trim() && setFormData(p => ({ ...p, participantes: [...p.participantes, novoParticipante.trim()] })), setNovoParticipante(''))} />
                <Button size="icon" variant="outline" onClick={() => { if (novoParticipante.trim()) { setFormData(p => ({ ...p, participantes: [...p.participantes, novoParticipante.trim()] })); setNovoParticipante(''); } }}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.participantes.map((p, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    <Users className="w-3 h-3" />{p}
                    <button onClick={() => setFormData(prev => ({ ...prev, participantes: prev.participantes.filter((_, idx) => idx !== i) }))}><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </SecaoCollapsible>

        <SecaoCollapsible 
          id="temas" 
          titulo="Temas Identificados" 
          icone={Target}
          badge={formData.temas_identificados.length > 0 && <Badge className="bg-emerald-100 text-emerald-700">{formData.temas_identificados.length}</Badge>}
        >
          <div className="flex flex-wrap gap-2">
            {formData.temas_identificados.map((t, i) => (
              <Badge key={i} variant="secondary">{t}</Badge>
            ))}
          </div>
        </SecaoCollapsible>

        <SecaoCollapsible 
          id="demandas" 
          titulo="Demandas da Comunidade" 
          icone={AlertTriangle}
          badge={formData.demandas.length > 0 && <Badge className="bg-amber-100 text-amber-700">{formData.demandas.length}</Badge>}
        >
          <div className="space-y-2">
            {formData.demandas.map((d, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded border">
                <p className="text-sm font-medium">{d.descricao}</p>
                <div className="flex gap-2 mt-2 text-xs">
                  <Badge variant="secondary">{d.urgencia}</Badge>
                  <Badge variant="outline">Prazo devolutiva: {new Date(d.prazo_devolutiva).toLocaleDateString('pt-BR')}</Badge>
                </div>
              </div>
            ))}
          </div>
        </SecaoCollapsible>

        <SecaoCollapsible 
          id="compromissos" 
          titulo="Compromissos Assumidos" 
          icone={CheckCircle2}
          badge={formData.compromissos.length > 0 && <Badge className="bg-emerald-100 text-emerald-700">{formData.compromissos.length}</Badge>}
        >
          <div className="space-y-2">
            {formData.compromissos.map((c, i) => (
              <div key={i} className="p-3 bg-emerald-50 rounded border border-emerald-200">
                <p className="text-sm font-medium">{c.descricao}</p>
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