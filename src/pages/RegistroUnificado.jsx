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
import DetectorStakeholders from '@/components/stakeholders/DetectorStakeholders';
import DetectorCasosAutomatico from '@/components/casos/DetectorCasosAutomatico';
import SeletorRegistrosVinculados from '@/components/continuidade/SeletorRegistrosVinculados';
import ProcessadorMidia from '@/components/registro/ProcessadorMidia';
import AnalisadorTempoReal from '@/components/registro/AnalisadorTempoReal';
import { criarAgendasAutomaticas, atualizarHistoricoAtor, registrarAuditoria } from '@/components/registro/AutomacaoAgenda';
import { sincronizarAposRegistro, obterCoordenadas } from '@/components/registro/SincronizadorDados';
import { analisarRiscosSociais, criarRiscosSociais } from '@/components/analise/AnalisadorRiscosAvancado';
import { gerarCompromissosInteligentes, criarCompromissos } from '@/components/analise/GeradorCompromissosInteligente';
import { detectarContinuidadeInteligente } from '@/components/analise/DetectorContinuidadeAvancado';
import { gerarResumoExecutivo, gerarAtaReuniao } from '@/components/analise/GeradorResumoExecutivo';
import GravadorAudioCompleto from '@/components/registro/GravadorAudioCompleto';
import TranscricaoWhisper from '@/components/registro/TranscricaoWhisper';
import { processarRegistroCompleto, alimentarModulos } from '@/components/registro/ProcessadorIALote';
import TranscricaoNativa from '@/components/registro/TranscricaoNativa';
import SugestoesIARegistro from '@/components/registro/SugestoesIARegistro';

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
  
  const urlParams = new URLSearchParams(window.location.search);
  const registroIdEditar = urlParams.get('editar');
  const modoManual = urlParams.get('manual') === 'true';
  const modoEdicao = !!registroIdEditar;
  
  const [etapaAtual, setEtapaAtual] = useState(
    modoEdicao ? 'formulario' : 
    modoManual ? 'formulario' : 
    'upload'
  );
  const [secaoExpandida, setSecaoExpandida] = useState('basico');
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'conversa_campo',
    descricao: '',
    transcricao: '',
    participantes: [],
    comunidade: '',
    grupo_coletivo: '',
    organizacao: '',
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
    localizacao: { municipio: '', estado: '' }
  });
  
  const [processando, setProcessando] = useState(false);
  const [analisando, setAnalisando] = useState(false);
  const [textoConsolidado, setTextoConsolidado] = useState('');
  const [arquivosProcessados, setArquivosProcessados] = useState([]);
  const [novoParticipante, setNovoParticipante] = useState('');
  const [mostrarDetectores, setMostrarDetectores] = useState(false);
  const [registroTemporario, setRegistroTemporario] = useState(null);
  const [errosProcessamento, setErrosProcessamento] = useState([]);
  const [sugestoesIA, setSugestoesIA] = useState(null);
  const [mostrarGravador, setMostrarGravador] = useState(false);
  const [transcricaoTempoReal, setTranscricaoTempoReal] = useState(false);
  const [duplicatasDetectadas, setDuplicatasDetectadas] = useState([]);
  const [mostrarAlertaDuplicatas, setMostrarAlertaDuplicatas] = useState(false);

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: gruposColetivos = [] } = useQuery({
    queryKey: ['grupos-coletivos'],
    queryFn: () => base44.entities.GrupoColetivo.list()
  });

  const { data: organizacoes = [] } = useQuery({
    queryKey: ['organizacoes'],
    queryFn: () => base44.entities.ProjetoOrganizacao.list()
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser-registro'],
    queryFn: () => base44.auth.me()
  });

  const { data: todosRegistros = [] } = useQuery({
    queryKey: ['todos-registros'],
    queryFn: () => base44.entities.Registro.list('-created_date', 100)
  });

  const { data: registroExistente, isLoading: carregandoRegistro } = useQuery({
    queryKey: ['registro-editar', registroIdEditar],
    queryFn: () => base44.entities.Registro.list().then(registros => registros.find(r => r.id === registroIdEditar)),
    enabled: modoEdicao
  });

  // Carregar dados do registro existente em modo edição
  React.useEffect(() => {
    if (modoEdicao && registroExistente) {
      setFormData({
        titulo: registroExistente.titulo || '',
        tipo: registroExistente.tipo || 'conversa_campo',
        descricao: registroExistente.descricao || '',
        transcricao: registroExistente.transcricao || '',
        participantes: registroExistente.participantes || [],
        comunidade: registroExistente.comunidade || '',
        grupo_coletivo: registroExistente.grupo_coletivo || '',
        organizacao: registroExistente.organizacao || '',
        local: registroExistente.local || '',
        data_registro: registroExistente.data_registro || new Date().toISOString().split('T')[0],
        temas_identificados: registroExistente.temas_identificados || [],
        sentimento: registroExistente.sentimento || '',
        temperatura_territorio: registroExistente.temperatura_territorio || '',
        indicadores_risco: registroExistente.indicadores_risco || [],
        demandas: registroExistente.demandas || [],
        compromissos: registroExistente.compromissos || [],
        proximos_passos: registroExistente.proximos_passos || [],
        arquivos: registroExistente.arquivos || [],
        resumo_automatico: registroExistente.resumo_automatico || '',
        status: registroExistente.status || 'rascunho',
        localizacao: registroExistente.localizacao || { municipio: '', estado: '' }
      });
      setTextoConsolidado(registroExistente.transcricao || '');
      setArquivosProcessados(registroExistente.arquivos || []);
    }
  }, [modoEdicao, registroExistente]);

  const createMutation = useMutation({
    mutationFn: (data) => modoEdicao 
      ? base44.entities.Registro.update(registroIdEditar, data)
      : base44.entities.Registro.create(data),
    onSuccess: (novoRegistro) => {
      queryClient.invalidateQueries({ queryKey: ['registros'] });
      // Redirecionar para revisão do registro criado
      const registroId = modoEdicao ? registroIdEditar : novoRegistro.id;
      navigate(createPageUrl('VerRegistro') + `?id=${registroId}`);
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
      // Mostrar preview imediato na caixa
      const blocoProcessando = `\n\n--- ⏳ Processando ${tipo}: ${file.name} ---\n`;
      setTextoConsolidado(prev => prev + blocoProcessando);

      // Preparar arquivo com detecção robusta de formato
      let extensao = 'mp3';
      let mimeType = 'audio/mpeg';

      if (tipo === 'audio') {
        const nomeArquivo = file.name.toLowerCase();
        if (nomeArquivo.endsWith('.ogg')) {
          extensao = 'ogg';
          mimeType = 'audio/ogg';
        } else if (nomeArquivo.endsWith('.mp4') || nomeArquivo.endsWith('.m4a')) {
          extensao = 'm4a';
          mimeType = 'audio/mp4';
        } else if (nomeArquivo.endsWith('.wav')) {
          extensao = 'wav';
          mimeType = 'audio/wav';
        } else if (nomeArquivo.endsWith('.mp3')) {
          extensao = 'mp3';
          mimeType = 'audio/mpeg';
        } else if (file.type) {
          const tipo = file.type;
          if (tipo.includes('ogg')) {
            extensao = 'ogg';
            mimeType = 'audio/ogg';
          } else if (tipo.includes('mp4') || tipo.includes('m4a')) {
            extensao = 'm4a';
            mimeType = 'audio/mp4';
          } else if (tipo.includes('wav')) {
            extensao = 'wav';
            mimeType = 'audio/wav';
          } else if (tipo.includes('webm')) {
            extensao = 'webm';
            mimeType = 'audio/webm';
          }
        }
      }

      // Criar arquivo com formato correto
      const arquivoParaUpload = tipo === 'audio' 
        ? new File([file], `audio-${Date.now()}.${extensao}`, { type: mimeType })
        : file;

      const { file_url } = await base44.integrations.Core.UploadFile({ file: arquivoParaUpload });

      const arquivoInfo = { url: file_url, tipo, nome: file.name };
      setArquivosProcessados(prev => [...prev, arquivoInfo]);

      setFormData(prev => ({
        ...prev,
        arquivos: [...prev.arquivos, arquivoInfo]
      }));

      // Extrair texto do arquivo com prompts específicos por tipo
      let promptExtracao = '';

      if (tipo === 'audio') {
        promptExtracao = `Você tem acesso ao modelo Whisper de transcrição de áudio. Transcreva o áudio anexado em português brasileiro.

  IMPORTANTE: 
  - Retorne APENAS o texto transcrito, sem comentários
  - Use pontuação correta
  - Identifique falantes diferentes se houver
  - Mantenha expressões coloquiais

  Transcreva:`;
      } else if (tipo === 'video') {
        promptExtracao = `Extraia TODO o conteúdo deste vídeo:

      ÁUDIO: Transcreva todas as falas e sons
      VISUAL: Descreva cenas importantes, textos visíveis na tela
      OCR: Extraia qualquer texto escrito que apareça no vídeo

      Retorne no formato:
      [TRANSCRIÇÃO ÁUDIO]
      ...
      [TEXTO VISUAL/OCR]
      ...`;
      } else if (tipo === 'foto') {
        promptExtracao = `Execute OCR COMPLETO nesta imagem:

      EXTRAIA:
      - Todo texto visível (placas, cartazes, documentos, anotações)
      - Números, datas, nomes
      - Legendas, títulos
      - Textos manuscritos (descreva se ilegível)

      IMPORTANTE: Preserve formatação, quebras de linha e disposição espacial dos textos`;
      } else {
        promptExtracao = `Extraia TODO o texto deste documento:

      - Preserve estrutura (títulos, parágrafos, listas)
      - Mantenha formatação de tabelas quando possível
      - Inclua notas de rodapé
      - Não omita nenhuma seção`;
      }

      // Para áudio, usar abordagem simplificada do Whisper
      let textoExtraido = '';

      if (tipo === 'audio' || tipo === 'video') {
        const resultado = await base44.integrations.Core.InvokeLLM({
          prompt: promptExtracao,
          file_urls: [file_url]
        });

        if (!resultado || resultado.length < 3) {
          throw new Error('Transcrição vazia. O áudio pode estar sem fala ou corrompido.');
        }

        textoExtraido = resultado;
      } else {
        // Para outros tipos, usar schema estruturado
        const extracao = await base44.integrations.Core.InvokeLLM({
          prompt: promptExtracao,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              texto_extraido: { type: "string" },
              tipo_conteudo: { type: "string" },
              qualidade_extracao: { type: "string" },
              metadados: { 
                type: "object",
                properties: {
                  duracao_estimada: { type: "string" },
                  numero_falantes: { type: "number" },
                  idioma_detectado: { type: "string" },
                  confianca_ocr: { type: "string" }
                }
              }
            }
          }
        });

        if (!extracao.texto_extraido) {
          throw new Error('Não foi possível extrair texto do arquivo');
        }

        textoExtraido = extracao.texto_extraido;
      }

      // Substituir bloco de processamento pelo texto final
      const blocoTexto = `\n\n--- ✅ ${tipo.toUpperCase()} - ${file.name} ---\n${textoExtraido}\n`;
      setTextoConsolidado(prev => {
        const textoLimpo = prev.replace(/\n\n--- ⏳ Processando.*?---\n/g, '');
        return textoLimpo + blocoTexto;
      });

      setEtapaAtual('texto');
    } catch (error) {
      console.error('Erro ao processar:', error);
      setErrosProcessamento(prev => [...prev, { arquivo: file.name, erro: error.message }]);

      // Remover bloco de processamento em caso de erro
      setTextoConsolidado(prev => prev.replace(/\n\n--- ⏳ Processando.*?---\n/g, ''));

      toast.error('Erro ao processar: ' + error.message);
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
      // USAR PROCESSAMENTO EM LOTE ÚNICO
      const analiseCompleta = await processarRegistroCompleto(textoConsolidado, formData.comunidade);
      
      // Popular formData com análise completa
      const demandasProcessadas = (analiseCompleta.demandas || []).map(d => ({
        descricao: d.descricao,
        urgencia: d.urgencia || 'media',
        status: 'pendente',
        requer_devolutiva: d.requer_devolutiva !== false,
        prazo_devolutiva: d.prazo_sugerido || calcularPrazoDevolutiva(d.urgencia),
        devolutiva_realizada: false
      }));

      const compromissosProcessados = (analiseCompleta.compromissos || []).map(c => ({
        descricao: c.descricao,
        responsavel: c.responsavel || 'A definir',
        status: 'pendente',
        prioridade: c.prioridade || 'media',
        prazo: c.prazo || calcularPrazoDevolutiva('media')
      }));

      setFormData(prev => ({
        ...prev,
        titulo: analiseCompleta.identificacao?.titulo || prev.titulo,
        tipo: analiseCompleta.identificacao?.tipo || prev.tipo,
        descricao: analiseCompleta.identificacao?.resumo || textoConsolidado.substring(0, 500),
        transcricao: textoConsolidado,
        participantes: analiseCompleta.analise?.participantes || [],
        comunidade: analiseCompleta.identificacao?.comunidade || prev.comunidade,
        local: analiseCompleta.identificacao?.local || prev.local,
        temas_identificados: analiseCompleta.analise?.temas || [],
        sentimento: analiseCompleta.analise?.sentimento || '',
        temperatura_territorio: analiseCompleta.analise?.temperatura || '',
        demandas: demandasProcessadas,
        compromissos: compromissosProcessados,
        proximos_passos: analiseCompleta.proximos_passos || [],
        resumo_automatico: analiseCompleta.identificacao?.resumo || '',
        localizacao: analiseCompleta.localizacao || null,
        auditoria: {
          ...prev.auditoria,
          analise_lote_unico: analiseCompleta
        }
      }));

      setSugestoesIA({
        analise_basica: analiseCompleta,
        riscos: { riscos_identificados: analiseCompleta.riscos || [], temperatura_geral: analiseCompleta.analise?.temperatura },
        atores: analiseCompleta.atores,
        materialidade: analiseCompleta.materialidade,
        agenda_futura: analiseCompleta.agenda_futura
      });

      setEtapaAtual('formulario');
      setSecaoExpandida('basico');
      return;

      /* CÓDIGO ANTIGO (REDUNDANTE) - Remover
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
      */
    } catch (error) {
      alert('Erro ao analisar texto: ' + error.message);
    } finally {
      setAnalisando(false);
    }
  };

  const detectarDuplicatas = async () => {
    const duplicatas = todosRegistros.filter(r => {
      if (modoEdicao && r.id === registroIdEditar) return false;
      
      // Verificar similaridade de título
      const tituloSimilar = r.titulo?.toLowerCase().includes(formData.titulo?.toLowerCase().substring(0, 20)) ||
                           formData.titulo?.toLowerCase().includes(r.titulo?.toLowerCase().substring(0, 20));
      
      // Verificar mesma data, comunidade e tipo
      const mesmaData = r.data_registro === formData.data_registro;
      const mesmaComunidade = r.comunidade === formData.comunidade;
      const mesmoTipo = r.tipo === formData.tipo;
      
      // Participantes em comum
      const participantesComuns = formData.participantes?.some(p => 
        r.participantes?.some(rp => rp.toLowerCase() === p.toLowerCase())
      );
      
      return (tituloSimilar && mesmaComunidade) || 
             (mesmaData && mesmaComunidade && mesmoTipo && participantesComuns);
    });
    
    return duplicatas;
  };

  const handleFinalizar = async () => {
    if (!formData.titulo || !formData.localizacao?.municipio) {
      alert('Preencha título e município');
      return;
    }
    
    // Detectar duplicatas
    const duplicatas = await detectarDuplicatas();
    if (duplicatas.length > 0 && !modoEdicao) {
      setDuplicatasDetectadas(duplicatas);
      setMostrarAlertaDuplicatas(true);
      return;
    }

    // Em modo edição, salvar direto sem detectores
    if (modoEdicao) {
      const dadosFinais = {
        ...formData,
        status: 'finalizado'
      };
      
      try {
        await base44.entities.Registro.update(registroIdEditar, dadosFinais);
        queryClient.invalidateQueries({ queryKey: ['registros'] });
        navigate(createPageUrl('Registros'));
      } catch (error) {
        alert('Erro ao salvar: ' + error.message);
      }
      return;
    }

    setRegistroTemporario(formData);
    setMostrarDetectores(true);
  };

  const finalizarComVinculacoes = async (stakeholdersVinculados = [], continuidades = [], casosVinculados = []) => {
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

      // Limpar dados inválidos antes de salvar
      const demandas = (formData.demandas || []).map(d => ({
        ...d,
        prazo_devolutiva: d.prazo_devolutiva && !isNaN(new Date(d.prazo_devolutiva).getTime()) 
          ? d.prazo_devolutiva 
          : calcularPrazoDevolutiva(d.urgencia || 'media'),
        data_devolutiva: d.data_devolutiva && !isNaN(new Date(d.data_devolutiva).getTime())
          ? d.data_devolutiva
          : null
      }));

      const compromissos = (formData.compromissos || []).map(c => ({
        ...c,
        prazo: c.prazo && !isNaN(new Date(c.prazo).getTime())
          ? c.prazo
          : calcularPrazoDevolutiva('media')
      }));

      const dadosFinais = {
        ...formData,
        demandas,
        compromissos,
        localizacao,
        status: 'finalizado',
        stakeholders_vinculados: stakeholdersVinculados,
        liderancas_vinculadas: stakeholdersVinculados,
        registros_continuidade: continuidades,
        casos_vinculados: casosVinculados
      };

    try {
      const registroCriado = modoEdicao 
        ? await base44.entities.Registro.update(registroIdEditar, dadosFinais)
        : await base44.entities.Registro.create(dadosFinais);
      
      const registroId = modoEdicao ? registroIdEditar : registroCriado.id;
      
      // ALIMENTAR TODOS OS MÓDULOS EM PARALELO (apenas em criação)
      if (!modoEdicao) {
        const analiseCompleta = formData.auditoria?.analise_lote_unico;
        
        if (analiseCompleta) {
          await alimentarModulos(registroId, analiseCompleta);
        }
      }
      
      // Criar riscos e compromissos da análise avançada
      const analiseAvancada = formData.auditoria?.analise_avancada;
      
      const registroAtualizado = modoEdicao ? { ...registroExistente, ...dadosFinais, id: registroId } : registroCriado;
      
      const automacoes = [
        criarAgendasAutomaticas(registroAtualizado),
        sincronizarAposRegistro(registroAtualizado),
        ...stakeholdersVinculados.map(stakeholderId => atualizarHistoricoAtor(stakeholderId, registroId)),
        registrarAuditoria('Registro', registroId, modoEdicao ? 'atualizacao' : 'criacao_completa', registroExistente, dadosFinais, modoEdicao ? 'atualizacao' : 'criacao')
      ];

      // Criar riscos sociais detectados (apenas em criação)
      if (!modoEdicao && analiseAvancada?.riscos?.riscos_identificados?.length > 0) {
        automacoes.push(
          criarRiscosSociais(
            analiseAvancada.riscos.riscos_identificados,
            registroId,
            registroAtualizado.comunidade,
            registroAtualizado.localizacao
          )
        );
      }

      // Criar compromissos sugeridos pela IA (apenas em criação)
      if (!modoEdicao && analiseAvancada?.compromissos_ia?.compromissos_sugeridos?.length > 0) {
        automacoes.push(
          criarCompromissos(
            analiseAvancada.compromissos_ia.compromissos_sugeridos.slice(0, 3), // Top 3
            registroId,
            registroAtualizado.comunidade
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
    <Card className={cn("transition-all", secaoExpandida === id && "ring-2 ring-[#E31E24]")}>
      <CardHeader 
        className="cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setSecaoExpandida(secaoExpandida === id ? null : id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icone className="w-5 h-5 text-[#E31E24]" />
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
        <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">{modoEdicao ? 'Editar Registro' : 'Novo Registro'}</h2>
              <p className="text-slate-500">
                {etapaAtual === 'upload' ? 'Envie arquivos ou digite o texto' : 'Revise o texto antes de analisar'}
              </p>
            </div>
            {etapaAtual === 'upload' && (
              <Button
                onClick={() => setEtapaAtual('texto')}
                size="lg"
                variant="outline"
                className="border-slate-300"
              >
                <FileText className="w-5 h-5 mr-2" />
                Pular e Digitar
              </Button>
            )}
          </div>

        {etapaAtual === 'upload' && (
          <Card className="border-2 border-dashed border-[#E31E24]/30">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#E31E24]/10 flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-[#E31E24]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Envie arquivos ou digite</h3>
                  <p className="text-sm text-slate-500">Todos os arquivos serão convertidos em texto editável</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3">🎙️ Transcrição de Áudio</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                      <button
                        onClick={() => {
                          setMostrarGravador(true);
                          setEtapaAtual('texto');
                        }}
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl hover:bg-slate-50 hover:border-[#E31E24] transition-all bg-gradient-to-br from-red-50 to-red-100"
                      >
                        <Mic className="w-8 h-8 text-red-600 mb-2 animate-pulse" />
                        <span className="text-sm font-medium">Gravar e Transcrever</span>
                        <span className="text-xs text-slate-400 mt-1">Automático</span>
                      </button>

                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#E31E24] transition-all active:scale-95">
                        <Upload className="w-8 h-8 text-[#E31E24] mb-2" />
                        <span className="text-sm font-medium">Upload Áudio</span>
                        <span className="text-xs text-slate-400 mt-1">MP3/WhatsApp/M4A</span>
                        <input 
                          type="file" 
                          accept="audio/*,.ogg,.opus,.mp3,.wav,.m4a,.aac,.webm,.mp4" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Adicionar arquivo à lista imediatamente
                              const arquivoInfo = { 
                                url: null, 
                                tipo: 'audio', 
                                nome: file.name,
                                arquivo: file,
                                processando: true
                              };
                              setArquivosProcessados(prev => [...prev, arquivoInfo]);
                              setMostrarGravador(true);
                              setEtapaAtual('texto');
                            }
                          }}
                          disabled={processando}
                          capture="environment"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3">📷 Evidências com OCR</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#E31E24] transition-all active:scale-95 bg-blue-50">
                        <Camera className="w-8 h-8 text-blue-600 mb-2" />
                        <span className="text-sm font-medium">Foto/OCR</span>
                        <span className="text-xs text-slate-400 mt-1">Extrai texto</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'foto')} disabled={processando} capture="environment" />
                      </label>

                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#E31E24] transition-all active:scale-95 bg-purple-50">
                        <Video className="w-8 h-8 text-purple-600 mb-2" />
                        <span className="text-sm font-medium">Vídeo</span>
                        <span className="text-xs text-slate-400 mt-1">Transcreve áudio</span>
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} disabled={processando} capture="environment" />
                      </label>

                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#E31E24] transition-all">
                        <FileText className="w-8 h-8 text-[#E31E24] mb-2" />
                        <span className="text-sm font-medium">PDF/Doc</span>
                        <span className="text-xs text-slate-400 mt-1">Extrai texto</span>
                        <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileUpload(e, 'documento')} disabled={processando} />
                      </label>
                    </div>
                  </div>
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

        {transcricaoTempoReal && (
          <Card className="border-2 border-[#E31E24] bg-gradient-to-br from-red-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#E31E24]">
                <Mic className="w-5 h-5 animate-pulse" />
                Transcrição em Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TranscricaoNativa
                onTranscricaoFinal={(transcricao) => {
                  const blocoTranscricao = `\n\n--- Transcrição Tempo Real ---\n${transcricao}\n`;
                  setTextoConsolidado(prev => prev + blocoTranscricao);
                  setTranscricaoTempoReal(false);
                }}
                onTranscricaoTempoReal={(transcricaoParcial) => {
                  // Atualizar texto consolidado em tempo real
                  setTextoConsolidado(prev => {
                    // Remover transcrição parcial anterior se existir
                    const textoSemParcial = prev.replace(/\n\n--- Transcrição em Andamento ---\n[\s\S]*?(?=\n\n---|\n\n\[|$)/, '');
                    return textoSemParcial + `\n\n--- Transcrição em Andamento ---\n${transcricaoParcial}\n`;
                  });
                }}
              />
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => setTranscricaoTempoReal(false)}
                  size="sm"
                >
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {mostrarGravador && (
          <Card className="border-2 border-[#E31E24] bg-gradient-to-br from-red-50 to-pink-50">
            <CardHeader className="bg-red-100 border-b border-red-200">
              <CardTitle className="flex items-center justify-between text-[#E31E24]">
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Transcrição de Áudio Whisper
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarGravador(false)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <TranscricaoWhisper
                arquivoExterno={arquivosProcessados.find(a => a.processando)?.arquivo}
                onTranscricaoTempoReal={(transcricaoParcial, file_url) => {
                  // Atualizar texto consolidado em tempo real
                  const blocoTemp = `\n\n--- 🎙️ Transcrevendo Áudio... ---\n${transcricaoParcial}\n`;
                  setTextoConsolidado(prev => {
                    // Remover bloco anterior de transcrição em andamento
                    const textoLimpo = prev.replace(/\n\n--- 🎙️ Transcrevendo Áudio\.\.\. ---\n[\s\S]*?(?=\n\n---|$)/g, '');
                    return textoLimpo + blocoTemp;
                  });
                }}
                onTranscricaoCompleta={async (transcricao, file_url) => {
                  // Substituir transcrição temporária pela final
                  const blocoTranscricao = `\n\n--- ✅ Transcrição do Áudio ---\n${transcricao}\n`;
                  setTextoConsolidado(prev => {
                    const textoLimpo = prev.replace(/\n\n--- 🎙️ Transcrevendo Áudio\.\.\. ---\n[\s\S]*?(?=\n\n---|$)/g, '');
                    return textoLimpo + blocoTranscricao;
                  });
                  setMostrarGravador(false);

                  // Atualizar arquivo processado
                  setArquivosProcessados(prev => prev.map(a => 
                    a.processando ? { 
                      ...a, 
                      url: file_url, 
                      processando: false,
                      transcricao: transcricao
                    } : a
                  ));

                  setFormData(prev => ({
                    ...prev,
                    arquivos: [...prev.arquivos.filter(a => a.url), { 
                      url: file_url, 
                      tipo: 'audio', 
                      nome: arquivosProcessados.find(a => a.processando)?.nome || 'Áudio.mp3' 
                    }]
                  }));
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Lista de Arquivos Anexados */}
        {arquivosProcessados.length > 0 && (
          <Card className="border-2 border-amber-500">
            <CardHeader className="bg-amber-50 pb-3">
              <CardTitle className="flex items-center justify-between text-amber-900">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Arquivos Anexados ({arquivosProcessados.length})
                </div>
                <div className="flex gap-2">
                  <label>
                    <Button variant="outline" size="sm" asChild>
                      <div>
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </div>
                    </Button>
                    <input 
                      type="file" 
                      accept="audio/*,video/*,image/*,.pdf,.doc,.docx"
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const tipo = file.type.startsWith('audio/') ? 'audio' :
                                      file.type.startsWith('video/') ? 'video' :
                                      file.type.startsWith('image/') ? 'foto' : 'documento';
                          processarArquivo(file, tipo);
                        }
                      }}
                    />
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setArquivosProcessados([]);
                      setFormData(prev => ({ ...prev, arquivos: [] }));
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpar Todos
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {arquivosProcessados.map((arquivo, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {arquivo.tipo === 'audio' && <Mic className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                      {arquivo.tipo === 'video' && <Video className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                      {arquivo.tipo === 'foto' && <Camera className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                      {arquivo.tipo === 'documento' && <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{arquivo.nome}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">{arquivo.tipo}</Badge>
                          {arquivo.processando ? (
                            <Badge className="text-xs bg-blue-100 text-blue-700">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Transcrevendo...
                            </Badge>
                          ) : (
                            <Badge className="text-xs bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Processado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(arquivo.tipo === 'audio' || arquivo.tipo === 'video') && arquivo.transcricao && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const blob = new Blob([arquivo.transcricao], { type: 'text/plain;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `transcricao_${arquivo.nome.replace(/\.[^/.]+$/, '')}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Baixar .txt
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setArquivosProcessados(prev => prev.filter((_, i) => i !== index));
                          setFormData(prev => ({
                            ...prev,
                            arquivos: prev.arquivos.filter((_, i) => i !== index)
                          }));
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        disabled={arquivo.processando}
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

        {/* CAIXA DE TEXTO CONSOLIDADA */}
        <Card className="border-2 border-[#E31E24]">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-[#E31E24]">
              <FileText className="w-5 h-5" />
              Texto Consolidado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">

            <Textarea
              className="min-h-[400px] font-mono text-sm leading-relaxed"
              placeholder="O texto extraído dos arquivos aparecerá aqui em tempo real. Você pode editar antes de analisar.

            Ou digite/cole o conteúdo diretamente..."
              value={textoConsolidado}
              onChange={(e) => setTextoConsolidado(e.target.value)}
            />

            {textoConsolidado && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{textoConsolidado.length} caracteres</span>
                <span>{textoConsolidado.split(/\s+/).filter(Boolean).length} palavras</span>
              </div>
            )}

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
                className="flex-1 bg-[#E31E24] hover:bg-[#B01419] active:bg-[#8A0F13] transition-all"
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

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Transcrição em tempo real ativa</span>
              </div>
              <span>•</span>
              <span>IA analisa automaticamente</span>
            </div>
          </CardContent>
        </Card>

        {/* Sugestões Inteligentes de IA */}
        <SugestoesIARegistro
          textoConsolidado={textoConsolidado}
          comunidades={comunidades}
          formData={formData}
          onAplicarSugestao={(campo, valor) => {
            setFormData(prev => ({ ...prev, [campo]: valor }));
          }}
        />

        {/* Analisador em Tempo Real */}
        <AnalisadorTempoReal
          textoConsolidado={textoConsolidado}
          formData={formData}
          onSugestoesGeradas={(sugestoes) => {
            setSugestoesIA(sugestoes);
            
            // Auto-preencher campos com sugestões
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
                status: 'pendente',
                prazo: calcularPrazoDevolutiva('media')
              })),
              sentimento: sugestoes.analise_basica.sentimento || prev.sentimento,
              temperatura_territorio: sugestoes.analise_basica.temperatura_territorio || prev.temperatura_territorio,
              local: sugestoes.analise_basica.local_especifico || prev.local,
              transcricao: textoConsolidado,
              auditoria: {
                ...prev.auditoria,
                analise_avancada: {
                  riscos: sugestoes.riscos,
                  compromissos_ia: sugestoes.compromissos_ia,
                  continuidade: sugestoes.continuidade
                }
              }
            }));
            
            setEtapaAtual('formulario');
          }}
        />

        {sugestoesIA && (
          <div className="flex justify-center">
            <Button
              onClick={() => setEtapaAtual('formulario')}
              size="lg"
              className="bg-[#E31E24] hover:bg-[#B01419]"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Revisar e Completar Registro
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (mostrarDetectores) {
      return (
        <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => setMostrarDetectores(false)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold">Detectando Vínculos</h2>
              <p className="text-sm text-slate-500">A IA está identificando continuidades e atores</p>
            </div>
          </div>

          <SeletorRegistrosVinculados
            textoAtual={textoConsolidado}
            comunidade={registroTemporario?.comunidade}
            participantes={registroTemporario?.participantes || []}
            onRegistrosSelecionados={(registrosIds) => {
              setFormData(prev => ({ ...prev, registros_continuidade: registrosIds }));
            }}
          />

          <Card className="border-2 border-purple-600">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Users className="w-6 h-6" />
                Vincular Stakeholders
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <DetectorStakeholders
                textoConsolidado={textoConsolidado}
                comunidade={registroTemporario?.comunidade}
                municipio={registroTemporario?.localizacao?.municipio || formData.localizacao?.municipio}
                registroId={null}
                onStakeholdersVinculados={(stakeholders) => {
                  console.log('Stakeholders vinculados:', stakeholders);
                  setFormData(prev => ({ ...prev, stakeholders_vinculados: stakeholders }));
                }}
              />
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-600">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Target className="w-6 h-6" />
                Abertura Automática de Casos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <DetectorCasosAutomatico
                textoConsolidado={textoConsolidado}
                demandasExtraidas={registroTemporario?.demandas}
                comunidade={registroTemporario?.comunidade}
                municipio={registroTemporario?.localizacao?.municipio || formData.localizacao?.municipio}
                stakeholdersVinculados={formData.stakeholders_vinculados}
                registroId={null}
                onCasosCriados={(casos) => {
                  console.log('Casos criados:', casos);
                  setFormData(prev => ({ ...prev, casos_vinculados: casos }));
                }}
              />
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              onClick={() => finalizarComVinculacoes(
                formData.stakeholders_vinculados || [], 
                formData.registros_continuidade || [],
                formData.casos_vinculados || []
              )}
              size="lg"
              className="bg-[#E31E24] hover:bg-[#B01419] active:bg-[#8A0F13] transition-all"
            >
              <Save className="w-5 h-5 mr-2" />
              Finalizar Registro
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
            <h2 className="text-2xl font-bold">{modoEdicao ? 'Editar Registro' : 'Novo Registro'}</h2>
            <p className="text-sm text-slate-500">Revise e complete as informações</p>
          </div>
        </div>
        <Button onClick={handleFinalizar} disabled={createMutation.isPending || carregandoRegistro} className="bg-[#E31E24] hover:bg-[#B01419] active:bg-[#8A0F13] transition-all">
          {(createMutation.isPending || carregandoRegistro) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {modoEdicao ? 'Salvar Alterações' : 'Finalizar'}
        </Button>
      </div>

      {/* Análise Avançada IA */}
      {sugestoesIA && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Sparkles className="w-5 h-5" />
              Análise Avançada IA
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-3 text-sm">
            {sugestoesIA.riscos?.riscos_identificados?.length > 0 && (
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <p className="font-semibold text-red-900 mb-1">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  {sugestoesIA.riscos.riscos_identificados.length} Risco(s)
                </p>
                <p className="text-xs text-red-700">
                  Nível: {sugestoesIA.riscos.temperatura_geral}
                </p>
              </div>
            )}
            {sugestoesIA.compromissos_ia?.compromissos_sugeridos?.length > 0 && (
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="font-semibold text-blue-900 mb-1">
                  <Target className="w-4 h-4 inline mr-1" />
                  {sugestoesIA.compromissos_ia.compromissos_sugeridos.length} Compromisso(s)
                </p>
                <p className="text-xs text-blue-700">Sugeridos pela IA</p>
              </div>
            )}
            {sugestoesIA.continuidade?.continuidades_detectadas?.length > 0 && (
              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                <p className="font-semibold text-purple-900 mb-1">
                  <Users className="w-4 h-4 inline mr-1" />
                  {sugestoesIA.continuidade.continuidades_detectadas.length} Continuidade(s)
                </p>
                <p className="text-xs text-purple-700">Casos relacionados</p>
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
          badge={(!formData.titulo || !formData.localizacao?.municipio) && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
        >
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={formData.titulo} onChange={(e) => setFormData(p => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Reunião com Associação" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label>Comunidade Territorial</Label>
                <Select value={formData.comunidade} onValueChange={(v) => setFormData(p => ({ ...p, comunidade: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione bairro/vila" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhuma</SelectItem>
                    {comunidades.map(c => (
                      <SelectItem key={c.id} value={c.nome}>
                        {c.nome} ({c.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Município *</Label>
                <Input 
                  value={formData.localizacao?.municipio || ''} 
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    localizacao: { ...p.localizacao, municipio: e.target.value } 
                  }))}
                  placeholder="Ex: Belo Horizonte"
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Select 
                  value={formData.localizacao?.estado || ''} 
                  onValueChange={(v) => setFormData(p => ({ 
                    ...p, 
                    localizacao: { ...p.localizacao, estado: v } 
                  }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Grupo/Coletivo (opcional)</Label>
                <Select 
                  value={formData.grupo_coletivo || ''} 
                  onValueChange={(v) => setFormData(p => ({ ...p, grupo_coletivo: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Ex: Grupo Musical" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum</SelectItem>
                    {gruposColetivos.map(g => (
                      <SelectItem key={g.id} value={g.nome}>
                        {g.nome} ({g.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Organização (opcional)</Label>
                <Select 
                  value={formData.organizacao || ''} 
                  onValueChange={(v) => setFormData(p => ({ ...p, organizacao: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Ex: ONG, Associação" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhuma</SelectItem>
                    {organizacoes.map(o => (
                      <SelectItem key={o.id} value={o.nome_oficial}>
                        {o.nome_fantasia || o.nome_oficial}
                      </SelectItem>
                    ))}
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
          badge={formData.temas_identificados.length > 0 && <Badge className="bg-emerald-100 text-emerald-700">{formData.temas_identificados.length} IA</Badge>}
        >
          <div className="bg-blue-50 p-3 rounded mb-3 border border-blue-200">
            <p className="text-xs text-blue-800">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Temas detectados automaticamente pela IA. Você pode editar ou remover.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.temas_identificados.map((t, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {t}
                <button onClick={() => setFormData(prev => ({ ...prev, temas_identificados: prev.temas_identificados.filter((_, idx) => idx !== i) }))}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </SecaoCollapsible>

        <SecaoCollapsible 
          id="demandas" 
          titulo="Demandas da Comunidade" 
          icone={AlertTriangle}
          badge={formData.demandas.length > 0 && <Badge className="bg-amber-100 text-amber-700">{formData.demandas.length} IA</Badge>}
        >
          <div className="bg-amber-50 p-3 rounded mb-3 border border-amber-200">
            <p className="text-xs text-amber-800">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Demandas detectadas automaticamente. Revise urgência e prazos.
            </p>
          </div>
          <div className="space-y-2">
            {formData.demandas.map((d, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded border relative group">
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, demandas: prev.demandas.filter((_, idx) => idx !== i) }))}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
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
          titulo="Compromissos Assumidos" 
          icone={CheckCircle2}
          badge={formData.compromissos.length > 0 && <Badge className="bg-emerald-100 text-emerald-700">{formData.compromissos.length} IA</Badge>}
        >
          <div className="bg-emerald-50 p-3 rounded mb-3 border border-emerald-200">
            <p className="text-xs text-emerald-800">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Compromissos identificados automaticamente. Revise responsáveis e prazos.
            </p>
          </div>
          <div className="space-y-2">
            {formData.compromissos.map((c, i) => (
              <div key={i} className="p-3 bg-emerald-50 rounded border border-emerald-200 relative group">
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, compromissos: prev.compromissos.filter((_, idx) => idx !== i) }))}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
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