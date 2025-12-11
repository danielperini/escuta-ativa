import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { 
  ArrowLeft, 
  Upload, 
  Mic, 
  Video, 
  Camera,
  FileText,
  Loader2,
  X,
  Plus,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Save
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';

const tipoOptions = [
  { value: 'reuniao', label: 'Reunião' },
  { value: 'conversa_campo', label: 'Conversa de Campo' },
  { value: 'ocorrencia', label: 'Ocorrência' },
  { value: 'demanda', label: 'Demanda' },
  { value: 'visita', label: 'Visita' }
];

export default function NovoRegistro() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'conversa_campo',
    descricao: '',
    comunidade: '',
    participantes: [],
    temas_identificados: [],
    demandas: [],
    compromissos: [],
    proximos_passos: [],
    arquivos: [],
    status: 'rascunho'
  });
  const [novoParticipante, setNovoParticipante] = useState('');
  const [novoTema, setNovoTema] = useState('');
  const [novaDemanda, setNovaDemanda] = useState({ descricao: '', urgencia: 'media' });
  const [novoCompromisso, setNovoCompromisso] = useState({ descricao: '', responsavel: '', prazo: '' });
  const [novoProximoPasso, setNovoProximoPasso] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Registro.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros'] });
      window.location.href = createPageUrl('Registros');
    }
  });

  const handleFileUpload = async (e, tipo) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    setFormData(prev => ({
      ...prev,
      arquivos: [...prev.arquivos, { url: file_url, tipo, nome: file.name }]
    }));
    setIsUploading(false);
  };

  const removeArquivo = (index) => {
    setFormData(prev => ({
      ...prev,
      arquivos: prev.arquivos.filter((_, i) => i !== index)
    }));
  };

  const addParticipante = () => {
    if (novoParticipante.trim()) {
      setFormData(prev => ({
        ...prev,
        participantes: [...prev.participantes, novoParticipante.trim()]
      }));
      setNovoParticipante('');
    }
  };

  const removeParticipante = (index) => {
    setFormData(prev => ({
      ...prev,
      participantes: prev.participantes.filter((_, i) => i !== index)
    }));
  };

  const addTema = () => {
    if (novoTema.trim()) {
      setFormData(prev => ({
        ...prev,
        temas_identificados: [...prev.temas_identificados, novoTema.trim()]
      }));
      setNovoTema('');
    }
  };

  const removeTema = (index) => {
    setFormData(prev => ({
      ...prev,
      temas_identificados: prev.temas_identificados.filter((_, i) => i !== index)
    }));
  };

  const addDemanda = () => {
    if (novaDemanda.descricao.trim()) {
      setFormData(prev => ({
        ...prev,
        demandas: [...prev.demandas, { ...novaDemanda, status: 'pendente' }]
      }));
      setNovaDemanda({ descricao: '', urgencia: 'media' });
    }
  };

  const removeDemanda = (index) => {
    setFormData(prev => ({
      ...prev,
      demandas: prev.demandas.filter((_, i) => i !== index)
    }));
  };

  const addCompromisso = () => {
    if (novoCompromisso.descricao.trim() && novoCompromisso.responsavel.trim()) {
      setFormData(prev => ({
        ...prev,
        compromissos: [...prev.compromissos, { ...novoCompromisso, status: 'pendente' }]
      }));
      setNovoCompromisso({ descricao: '', responsavel: '', prazo: '' });
    }
  };

  const removeCompromisso = (index) => {
    setFormData(prev => ({
      ...prev,
      compromissos: prev.compromissos.filter((_, i) => i !== index)
    }));
  };

  const addProximoPasso = () => {
    if (novoProximoPasso.trim()) {
      setFormData(prev => ({
        ...prev,
        proximos_passos: [...prev.proximos_passos, novoProximoPasso.trim()]
      }));
      setNovoProximoPasso('');
    }
  };

  const removeProximoPasso = (index) => {
    setFormData(prev => ({
      ...prev,
      proximos_passos: prev.proximos_passos.filter((_, i) => i !== index)
    }));
  };

  const analyzeWithAI = async () => {
    if (!formData.descricao && formData.arquivos.length === 0) return;

    setIsAnalyzing(true);
    
    const prompt = `Analise o seguinte registro de campo comunitário e extraia:
1. Temas principais identificados (lista de strings)
2. Sentimento geral (positivo, neutro, negativo ou misto)
3. Demandas da comunidade (lista com descrição e urgência: baixa, media, alta, critica)
4. Sugestões de próximos passos (lista de strings)

Descrição do registro:
${formData.descricao}

Tipo: ${formData.tipo}
Comunidade: ${formData.comunidade || 'Não especificada'}
Participantes: ${formData.participantes.join(', ') || 'Não especificados'}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          temas: { type: "array", items: { type: "string" } },
          sentimento: { type: "string", enum: ["positivo", "neutro", "negativo", "misto"] },
          demandas: { 
            type: "array", 
            items: { 
              type: "object",
              properties: {
                descricao: { type: "string" },
                urgencia: { type: "string", enum: ["baixa", "media", "alta", "critica"] }
              }
            }
          },
          proximos_passos: { type: "array", items: { type: "string" } }
        }
      }
    });

    setFormData(prev => ({
      ...prev,
      temas_identificados: [...prev.temas_identificados, ...(result.temas || [])],
      sentimento: result.sentimento || prev.sentimento,
      demandas: [...prev.demandas, ...(result.demandas?.map(d => ({ ...d, status: 'pendente' })) || [])],
      proximos_passos: [...prev.proximos_passos, ...(result.proximos_passos || [])]
    }));

    setIsAnalyzing(false);
  };

  const handleSubmit = (status = 'finalizado') => {
    createMutation.mutate({ ...formData, status });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Registros')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Novo Registro</h2>
          <p className="text-slate-500">Registre uma interação comunitária</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Reunião com associação de moradores"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comunidade">Comunidade</Label>
              <Select
                value={formData.comunidade}
                onValueChange={(value) => setFormData(prev => ({ ...prev, comunidade: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma comunidade" />
                </SelectTrigger>
                <SelectContent>
                  {comunidades.map(com => (
                    <SelectItem key={com.id} value={com.nome}>{com.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva os principais pontos da interação..."
                rows={5}
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anexos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <Mic className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-sm text-slate-600">Áudio</span>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'audio')}
                />
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <Video className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-sm text-slate-600">Vídeo</span>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'video')}
                />
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <Camera className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-sm text-slate-600">Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'foto')}
                />
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <FileText className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-sm text-slate-600">Documento</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'documento')}
                />
              </label>
            </div>

            {isUploading && (
              <div className="flex items-center gap-2 mt-4 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando arquivo...</span>
              </div>
            )}

            {formData.arquivos.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.arquivos.map((arquivo, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {arquivo.tipo === 'audio' && <Mic className="w-4 h-4 text-slate-500" />}
                      {arquivo.tipo === 'video' && <Video className="w-4 h-4 text-slate-500" />}
                      {arquivo.tipo === 'foto' && <Camera className="w-4 h-4 text-slate-500" />}
                      {arquivo.tipo === 'documento' && <FileText className="w-4 h-4 text-slate-500" />}
                      <span className="text-sm text-slate-700 truncate max-w-xs">{arquivo.nome}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeArquivo(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Analysis Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 border-[#40916C] text-[#40916C] hover:bg-[#40916C]/10"
          onClick={analyzeWithAI}
          disabled={isAnalyzing || (!formData.descricao && formData.arquivos.length === 0)}
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Analisar com IA
        </Button>

        {/* Participantes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome do participante"
                value={novoParticipante}
                onChange={(e) => setNovoParticipante(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipante())}
              />
              <Button type="button" onClick={addParticipante} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.participantes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.participantes.map((p, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                    {p}
                    <button onClick={() => removeParticipante(idx)} className="ml-1 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Temas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Temas Identificados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite um tema"
                value={novoTema}
                onChange={(e) => setNovoTema(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTema())}
              />
              <Button type="button" onClick={addTema} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.temas_identificados.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.temas_identificados.map((t, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1 pr-1 bg-emerald-100 text-emerald-700">
                    {t}
                    <button onClick={() => removeTema(idx)} className="ml-1 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demandas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demandas da Comunidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Descrição da demanda"
                value={novaDemanda.descricao}
                onChange={(e) => setNovaDemanda(prev => ({ ...prev, descricao: e.target.value }))}
                className="flex-1"
              />
              <Select
                value={novaDemanda.urgencia}
                onValueChange={(value) => setNovaDemanda(prev => ({ ...prev, urgencia: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" onClick={addDemanda} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.demandas.length > 0 && (
              <div className="space-y-2">
                {formData.demandas.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={cn(
                        d.urgencia === 'critica' ? 'bg-red-100 text-red-700' :
                        d.urgencia === 'alta' ? 'bg-orange-100 text-orange-700' :
                        d.urgencia === 'media' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      )}>
                        {d.urgencia}
                      </Badge>
                      <span className="text-sm text-slate-700">{d.descricao}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeDemanda(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compromissos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compromissos Assumidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Descrição"
                value={novoCompromisso.descricao}
                onChange={(e) => setNovoCompromisso(prev => ({ ...prev, descricao: e.target.value }))}
              />
              <Input
                placeholder="Responsável"
                value={novoCompromisso.responsavel}
                onChange={(e) => setNovoCompromisso(prev => ({ ...prev, responsavel: e.target.value }))}
              />
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={novoCompromisso.prazo}
                  onChange={(e) => setNovoCompromisso(prev => ({ ...prev, prazo: e.target.value }))}
                />
                <Button type="button" onClick={addCompromisso} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {formData.compromissos.length > 0 && (
              <div className="space-y-2">
                {formData.compromissos.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{c.descricao}</p>
                      <p className="text-xs text-slate-500">
                        {c.responsavel} • {c.prazo ? new Date(c.prazo).toLocaleDateString('pt-BR') : 'Sem prazo'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeCompromisso(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximos Passos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Descreva o próximo passo"
                value={novoProximoPasso}
                onChange={(e) => setNovoProximoPasso(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProximoPasso())}
              />
              <Button type="button" onClick={addProximoPasso} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.proximos_passos.length > 0 && (
              <div className="space-y-2">
                {formData.proximos_passos.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-700">{p}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeProximoPasso(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => handleSubmit('rascunho')}
            disabled={!formData.titulo || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Rascunho
          </Button>
          <Button
            type="button"
            className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] gap-2"
            onClick={() => handleSubmit('finalizado')}
            disabled={!formData.titulo || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Finalizar Registro
          </Button>
        </div>
      </div>
    </div>
  );
}