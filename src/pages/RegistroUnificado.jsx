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
  
  const [isUploading, setIsUploading] = useState(false);
  const [analisando, setAnalisando] = useState(false);
  const [textoDigitado, setTextoDigitado] = useState('');
  const [modoTexto, setModoTexto] = useState(false);
  const [novoParticipante, setNovoParticipante] = useState('');

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
    setIsUploading(true);
    setAnalisando(true);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const arquivoInfo = { url: file_url, tipo, nome: file.name };
      setFormData(prev => ({
        ...prev,
        arquivos: [...prev.arquivos, arquivoInfo]
      }));

      // Análise com IA
      const promptAnalise = `Analise este ${tipo} de interação comunitária e extraia:

1. Título sugerido
2. Tipo de interação (reuniao, conversa_campo, visita, demanda, ocorrencia)
3. Participantes mencionados
4. Comunidade/território
5. Data mencionada (YYYY-MM-DD)
6. Temas discutidos
7. Demandas da comunidade (cada uma com descricao e urgencia: baixa/media/alta/critica)
8. Compromissos assumidos pela empresa (cada um com descricao, responsavel, prazo se mencionado)
9. Próximos passos
10. Sentimento geral (positivo/neutro/negativo/misto)
11. Temperatura do território (baixo/medio/alto/critico)
12. Resumo em 2-3 parágrafos

Retorne null se não encontrar.`;

      const analise = await base44.integrations.Core.InvokeLLM({
        prompt: promptAnalise,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            titulo_sugerido: { type: "string" },
            tipo_sugerido: { type: "string" },
            participantes: { type: "array", items: { type: "string" } },
            comunidade: { type: "string" },
            data_mencionada: { type: "string" },
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
                  responsavel: { type: "string" },
                  prazo: { type: "string" }
                }
              }
            },
            proximos_passos: { type: "array", items: { type: "string" } },
            sentimento: { type: "string" },
            temperatura_territorio: { type: "string" },
            resumo_automatico: { type: "string" },
            transcricao: { type: "string" }
          }
        }
      });

      // Processar demandas com prazos automáticos
      const demandasProcessadas = (analise.demandas || []).map(d => ({
        ...d,
        status: 'pendente',
        requer_devolutiva: true,
        prazo_devolutiva: calcularPrazoDevolutiva(d.urgencia),
        devolutiva_realizada: false
      }));

      // Processar compromissos com prazos automáticos
      const compromissosProcessados = (analise.compromissos || []).map(c => ({
        ...c,
        status: 'pendente',
        prazo: c.prazo || calcularPrazoDevolutiva('media')
      }));

      setFormData(prev => ({
        ...prev,
        titulo: analise.titulo_sugerido || prev.titulo,
        tipo: analise.tipo_sugerido || prev.tipo,
        descricao: analise.resumo_automatico || prev.descricao,
        transcricao: analise.transcricao || prev.transcricao,
        participantes: [...new Set([...prev.participantes, ...(analise.participantes || [])])],
        comunidade: analise.comunidade || prev.comunidade,
        data_registro: analise.data_mencionada || prev.data_registro,
        temas_identificados: [...new Set([...prev.temas_identificados, ...(analise.temas || [])])],
        sentimento: analise.sentimento || prev.sentimento,
        temperatura_territorio: analise.temperatura_territorio || prev.temperatura_territorio,
        demandas: [...prev.demandas, ...demandasProcessadas],
        compromissos: [...prev.compromissos, ...compromissosProcessados],
        proximos_passos: [...new Set([...prev.proximos_passos, ...(analise.proximos_passos || [])])],
        resumo_automatico: analise.resumo_automatico
      }));

      setEtapaAtual('formulario');
      setSecaoExpandida('basico');
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao processar arquivo: ' + error.message);
    } finally {
      setIsUploading(false);
      setAnalisando(false);
    }
  };

  const handleFileUpload = (e, tipo) => {
    const file = e.target.files[0];
    if (file) processarArquivo(file, tipo);
  };

  const analisarTexto = async () => {
    if (!textoDigitado.trim()) return;
    setAnalisando(true);

    try {
      const analise = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise este texto de interação comunitária: "${textoDigitado}". Extraia todos os dados estruturados conforme schema.`,
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
        descricao: analise.resumo_automatico || textoDigitado,
        participantes: analise.participantes || [],
        comunidade: analise.comunidade || '',
        temas_identificados: analise.temas || [],
        demandas: demandasProcessadas,
        compromissos: compromissosProcessados,
        resumo_automatico: analise.resumo_automatico
      }));

      setEtapaAtual('formulario');
      setModoTexto(false);
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

    createMutation.mutate({
      ...formData,
      status: 'finalizado'
    });
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

  if (etapaAtual === 'upload') {
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
            <p className="text-slate-500">Envie um documento para análise automática</p>
          </div>
        </div>

        <Card className="border-2 border-dashed border-[#40916C]/30">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#40916C]/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-[#40916C]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Envie seu documento</h3>
                <p className="text-sm text-slate-500">A IA vai processar e preencher tudo automaticamente</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-3xl mx-auto pt-4">
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#40916C]">
                  <Mic className="w-8 h-8 text-[#40916C] mb-2" />
                  <span className="text-sm font-medium">Áudio</span>
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'audio')} disabled={isUploading} />
                </label>
                
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#40916C]">
                  <Video className="w-8 h-8 text-[#40916C] mb-2" />
                  <span className="text-sm font-medium">Vídeo</span>
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} disabled={isUploading} />
                </label>
                
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#40916C]">
                  <Camera className="w-8 h-8 text-[#40916C] mb-2" />
                  <span className="text-sm font-medium">Foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'foto')} disabled={isUploading} />
                </label>
                
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#40916C]">
                  <FileText className="w-8 h-8 text-[#40916C] mb-2" />
                  <span className="text-sm font-medium">PDF/Doc</span>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileUpload(e, 'documento')} disabled={isUploading} />
                </label>
                
                <button
                  onClick={() => setModoTexto(!modoTexto)}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl",
                    modoTexto ? "bg-[#40916C] text-white" : "hover:bg-slate-50 hover:border-[#40916C]"
                  )}
                >
                  <FileText className={cn("w-8 h-8 mb-2", modoTexto ? "text-white" : "text-[#40916C]")} />
                  <span className="text-sm font-medium">Texto</span>
                </button>
              </div>

              {(isUploading || analisando) && (
                <div className="flex items-center justify-center gap-2 text-slate-600 pt-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isUploading ? 'Enviando...' : 'Analisando com IA...'}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {modoTexto && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Digite ou Cole o Texto</h3>
              <Textarea
                className="min-h-[300px]"
                placeholder="Cole ou digite aqui..."
                value={textoDigitado}
                onChange={(e) => setTextoDigitado(e.target.value)}
              />
              <Button onClick={analisarTexto} disabled={!textoDigitado.trim() || analisando} className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                {analisando ? 'Analisando...' : 'Analisar com IA'}
              </Button>
            </CardContent>
          </Card>
        )}
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