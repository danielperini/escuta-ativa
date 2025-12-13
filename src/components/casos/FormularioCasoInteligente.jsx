import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Plus, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

export default function FormularioCasoInteligente({ open, onOpenChange, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'devolutiva',
    comunidade: '',
    municipio: '',
    tema: '',
    stakeholders_envolvidos: [],
    prioridade: 'media',
    status: 'em_aberto',
    prazo: ''
  });
  const [analisando, setAnalisando] = useState(false);
  const [sugestoes, setSugestoes] = useState(null);
  const [stakeholderSearch, setStakeholderSearch] = useState('');

  // Buscar dados de contexto
  const { data: registros = [] } = useQuery({
    queryKey: ['registros-recentes'],
    queryFn: () => base44.entities.Registro.list('-created_date', 20)
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: temas = [] } = useQuery({
    queryKey: ['temas'],
    queryFn: () => base44.entities.Tema.list()
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders'],
    queryFn: () => base44.entities.Stakeholder.list()
  });

  // Mutation para criar caso
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Caso.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casos'] });
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      tipo: 'devolutiva',
      comunidade: '',
      municipio: '',
      tema: '',
      stakeholders_envolvidos: [],
      prioridade: 'media',
      status: 'em_aberto',
      prazo: ''
    });
    setSugestoes(null);
  };

  // Análise inteligente quando usuário digita
  useEffect(() => {
    if (!formData.titulo && !formData.descricao) {
      setSugestoes(null);
      return;
    }

    const timer = setTimeout(() => {
      analisarTexto();
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData.titulo, formData.descricao]);

  const analisarTexto = async () => {
    const texto = `${formData.titulo} ${formData.descricao}`.trim();
    if (texto.length < 10) return;

    setAnalisando(true);
    try {
      // Contexto de registros e demandas recentes
      const contextoRegistros = registros.slice(0, 5).map(r => ({
        titulo: r.titulo,
        comunidade: r.comunidade,
        temas: r.temas_identificados,
        demandas: r.demandas?.map(d => d.descricao)
      }));

      const analise = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise este texto de um novo caso e sugira informações inteligentes:

TEXTO DO CASO:
${texto}

CONTEXTO DE REGISTROS RECENTES:
${JSON.stringify(contextoRegistros, null, 2)}

COMUNIDADES EXISTENTES:
${comunidades.map(c => c.nome).join(', ')}

TEMAS EXISTENTES:
${temas.map(t => t.nome).join(', ')}

STAKEHOLDERS DISPONÍVEIS:
${stakeholders.slice(0, 50).map(s => `${s.nome} (${s.comunidade})`).join(', ')}

Extraia e sugira:
1. Título otimizado (claro e objetivo)
2. Descrição expandida (3-4 linhas contextualizando o caso)
3. Comunidade detectada
4. Município detectado
5. Tema principal relacionado
6. Stakeholders mencionados (use nomes exatos da lista acima)
7. Tipo de caso mais adequado
8. Prioridade sugerida
9. Prazo sugerido (data no formato YYYY-MM-DD)`,
        response_json_schema: {
          type: "object",
          properties: {
            titulo_sugerido: { type: "string" },
            descricao_expandida: { type: "string" },
            comunidade_detectada: { type: "string" },
            municipio_detectado: { type: "string" },
            tema_detectado: { type: "string" },
            stakeholders_nomes: { type: "array", items: { type: "string" } },
            tipo_sugerido: { type: "string" },
            prioridade_sugerida: { type: "string" },
            prazo_sugerido: { type: "string" },
            justificativa: { type: "string" }
          }
        }
      });

      // Mapear stakeholders por nome
      const stakeholdersIds = analise.stakeholders_nomes?.map(nome => {
        const encontrado = stakeholders.find(s => 
          s.nome.toLowerCase().includes(nome.toLowerCase()) ||
          nome.toLowerCase().includes(s.nome.toLowerCase())
        );
        return encontrado?.id;
      }).filter(Boolean) || [];

      setSugestoes({
        ...analise,
        stakeholders_ids: stakeholdersIds
      });

      // Auto-preencher campos vazios
      if (!formData.titulo && analise.titulo_sugerido) {
        setFormData(prev => ({ ...prev, titulo: analise.titulo_sugerido }));
      }
      if (!formData.descricao && analise.descricao_expandida) {
        setFormData(prev => ({ ...prev, descricao: analise.descricao_expandida }));
      }
      if (!formData.comunidade && analise.comunidade_detectada) {
        setFormData(prev => ({ ...prev, comunidade: analise.comunidade_detectada }));
      }
      if (!formData.municipio && analise.municipio_detectado) {
        setFormData(prev => ({ ...prev, municipio: analise.municipio_detectado }));
      }
      if (!formData.tema && analise.tema_detectado) {
        setFormData(prev => ({ ...prev, tema: analise.tema_detectado }));
      }
      if (stakeholdersIds.length > 0 && formData.stakeholders_envolvidos.length === 0) {
        setFormData(prev => ({ ...prev, stakeholders_envolvidos: stakeholdersIds }));
      }
      if (analise.tipo_sugerido) {
        setFormData(prev => ({ ...prev, tipo: analise.tipo_sugerido }));
      }
      if (analise.prioridade_sugerida) {
        setFormData(prev => ({ ...prev, prioridade: analise.prioridade_sugerida }));
      }
      if (analise.prazo_sugerido) {
        setFormData(prev => ({ ...prev, prazo: analise.prazo_sugerido }));
      }

    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setAnalisando(false);
    }
  };

  const aplicarSugestao = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const adicionarStakeholder = (id) => {
    if (!formData.stakeholders_envolvidos.includes(id)) {
      setFormData(prev => ({
        ...prev,
        stakeholders_envolvidos: [...prev.stakeholders_envolvidos, id]
      }));
    }
    setStakeholderSearch('');
  };

  const removerStakeholder = (id) => {
    setFormData(prev => ({
      ...prev,
      stakeholders_envolvidos: prev.stakeholders_envolvidos.filter(sid => sid !== id)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calcular prazo padrão se não definido (15 dias)
    const prazoFinal = formData.prazo || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    createMutation.mutate({
      ...formData,
      prazo: prazoFinal,
      data_abertura: new Date().toISOString()
    });
  };

  const stakeholdersFiltrados = stakeholderSearch
    ? stakeholders.filter(s => 
        s.nome.toLowerCase().includes(stakeholderSearch.toLowerCase()) ||
        s.comunidade?.toLowerCase().includes(stakeholderSearch.toLowerCase())
      ).slice(0, 10)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Criar Novo Caso (com IA)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sugestões da IA */}
          {analisando && (
            <Card className="p-3 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 text-sm text-purple-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analisando e gerando sugestões inteligentes...
              </div>
            </Card>
          )}

          {sugestoes && (
            <Card className="p-3 bg-emerald-50 border-emerald-200">
              <div className="text-sm font-medium text-emerald-800 mb-2">
                ✓ Análise concluída - Sugestões aplicadas automaticamente
              </div>
              {sugestoes.justificativa && (
                <p className="text-xs text-emerald-700">{sugestoes.justificativa}</p>
              )}
            </Card>
          )}

          {/* Título */}
          <div>
            <Label>Título *</Label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ex: Devolutiva sobre água na comunidade..."
              required
            />
            {sugestoes?.titulo_sugerido && formData.titulo !== sugestoes.titulo_sugerido && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-purple-600 mt-1"
                onClick={() => aplicarSugestao('titulo', sugestoes.titulo_sugerido)}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Usar: "{sugestoes.titulo_sugerido}"
              </Button>
            )}
          </div>

          {/* Descrição */}
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva o caso detalhadamente..."
              rows={4}
            />
            {sugestoes?.descricao_expandida && formData.descricao !== sugestoes.descricao_expandida && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-purple-600 mt-1"
                onClick={() => aplicarSugestao('descricao', sugestoes.descricao_expandida)}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Usar descrição sugerida
              </Button>
            )}
          </div>

          {/* Tipo e Prioridade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData(prev => ({ ...prev, tipo: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="devolutiva">Devolutiva</SelectItem>
                  <SelectItem value="demanda_individual">Demanda Individual</SelectItem>
                  <SelectItem value="demanda_coletiva">Demanda Coletiva</SelectItem>
                  <SelectItem value="indenizacao">Indenização</SelectItem>
                  <SelectItem value="servico">Serviço</SelectItem>
                  <SelectItem value="apoio">Apoio</SelectItem>
                  <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade *</Label>
              <Select value={formData.prioridade} onValueChange={(v) => setFormData(prev => ({ ...prev, prioridade: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comunidade e Município */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Comunidade *</Label>
              <Select value={formData.comunidade} onValueChange={(v) => setFormData(prev => ({ ...prev, comunidade: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {comunidades.map(c => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Município *</Label>
              <Input
                value={formData.municipio || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, municipio: e.target.value || 'Desconhecido' }))}
                placeholder="Digite o município"
              />
              {sugestoes?.municipio_detectado && formData.municipio !== sugestoes.municipio_detectado && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-purple-600 mt-1"
                  onClick={() => aplicarSugestao('municipio', sugestoes.municipio_detectado)}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Usar: "{sugestoes.municipio_detectado}"
                </Button>
              )}
            </div>
          </div>

          {/* Tema */}
          <div>
            <Label>Tema *</Label>
            <Input
              value={formData.tema}
              onChange={(e) => setFormData(prev => ({ ...prev, tema: e.target.value }))}
              placeholder="Ex: Água, Saúde, Infraestrutura..."
              required
            />
          </div>

          {/* Prazo */}
          <div>
            <Label>Prazo</Label>
            <Input
              type="date"
              value={formData.prazo}
              onChange={(e) => setFormData(prev => ({ ...prev, prazo: e.target.value }))}
            />
            <p className="text-xs text-slate-500 mt-1">Padrão: 15 dias a partir de hoje</p>
          </div>

          {/* Stakeholders */}
          <div>
            <Label>Stakeholders Envolvidos</Label>
            <div className="relative">
              <Input
                value={stakeholderSearch}
                onChange={(e) => setStakeholderSearch(e.target.value)}
                placeholder="Buscar stakeholder..."
              />
              {stakeholdersFiltrados.length > 0 && (
                <Card className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto">
                  {stakeholdersFiltrados.map(s => (
                    <div
                      key={s.id}
                      className="p-2 hover:bg-slate-100 cursor-pointer text-sm"
                      onClick={() => adicionarStakeholder(s.id)}
                    >
                      <div className="font-medium">{s.nome}</div>
                      <div className="text-xs text-slate-500">{s.comunidade}</div>
                    </div>
                  ))}
                </Card>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {formData.stakeholders_envolvidos.map(sid => {
                const stakeholder = stakeholders.find(s => s.id === sid);
                if (!stakeholder) return null;
                return (
                  <Badge key={sid} variant="secondary" className="gap-1">
                    {stakeholder.nome}
                    <button type="button" onClick={() => removerStakeholder(sid)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>

            {sugestoes?.stakeholders_ids?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-purple-600 mb-1">Stakeholders sugeridos pela IA:</p>
                <div className="flex flex-wrap gap-2">
                  {sugestoes.stakeholders_ids.map(sid => {
                    const stakeholder = stakeholders.find(s => s.id === sid);
                    if (!stakeholder || formData.stakeholders_envolvidos.includes(sid)) return null;
                    return (
                      <Button
                        key={sid}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => adicionarStakeholder(sid)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {stakeholder.nome}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || !formData.titulo || !formData.comunidade || !formData.municipio || !formData.tema}
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Caso
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}