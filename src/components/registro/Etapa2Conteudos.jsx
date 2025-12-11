import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  Plus, 
  X, 
  ArrowLeft,
  Zap,
  Save,
  Loader2
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Etapa2Conteudos({ 
  formData, 
  setFormData, 
  camposPreenchidosAuto,
  onVoltarEtapa,
  onFinalizar,
  isFinalizando
}) {
  const [novoTema, setNovoTema] = React.useState('');
  const [novaDemanda, setNovaDemanda] = React.useState({ descricao: '', urgencia: 'media' });
  const [novoCompromisso, setNovoCompromisso] = React.useState({ descricao: '', responsavel: '', prazo: '' });
  const [novoProximoPasso, setNovoProximoPasso] = React.useState('');

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
    if (novoCompromisso.descricao.trim()) {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#40916C]" />
            Etapa 2: Temas e Conteúdos
          </CardTitle>
          <p className="text-sm text-slate-500">
            Revise as categorias identificadas pela IA e adicione informações se necessário
          </p>
        </CardHeader>
      </Card>

      {/* Temas Identificados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Temas Identificados</CardTitle>
            {camposPreenchidosAuto.includes('temas') && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                <Zap className="w-3 h-3 mr-1" /> {formData.temas_identificados.length} detectados
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">Assuntos e tópicos mencionados na interação</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Adicione um tema"
              value={novoTema}
              onChange={(e) => setNovoTema(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTema())}
            />
            <Button type="button" onClick={addTema} variant="outline" size="icon">
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

      {/* Demandas da Comunidade */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Demandas da Comunidade
            </CardTitle>
            {camposPreenchidosAuto.includes('demandas') && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                <Zap className="w-3 h-3 mr-1" /> {formData.demandas.length} detectadas
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">Solicitações e necessidades apresentadas</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="Descrição da demanda"
              className="md:col-span-2"
              value={novaDemanda.descricao}
              onChange={(e) => setNovaDemanda(prev => ({ ...prev, descricao: e.target.value }))}
            />
            <Select
              value={novaDemanda.urgencia}
              onValueChange={(value) => setNovaDemanda(prev => ({ ...prev, urgencia: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={addDemanda} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Demanda
          </Button>
          {formData.demandas.length > 0 && (
            <div className="space-y-2">
              {formData.demandas.map((d, idx) => (
                <div key={idx} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border">
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{d.descricao}</p>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "mt-1 text-xs",
                        d.urgencia === 'critica' && 'bg-red-100 text-red-700',
                        d.urgencia === 'alta' && 'bg-orange-100 text-orange-700',
                        d.urgencia === 'media' && 'bg-amber-100 text-amber-700',
                        d.urgencia === 'baixa' && 'bg-slate-100 text-slate-700'
                      )}
                    >
                      Urgência: {d.urgencia}
                    </Badge>
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

      {/* Compromissos Assumidos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Compromissos Assumidos pela Empresa
            </CardTitle>
            {camposPreenchidosAuto.includes('compromissos') && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                <Zap className="w-3 h-3 mr-1" /> {formData.compromissos.length} detectados
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">Ações e obrigações assumidas</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="O que foi comprometido"
              value={novoCompromisso.descricao}
              onChange={(e) => setNovoCompromisso(prev => ({ ...prev, descricao: e.target.value }))}
            />
            <Input
              placeholder="Responsável"
              value={novoCompromisso.responsavel}
              onChange={(e) => setNovoCompromisso(prev => ({ ...prev, responsavel: e.target.value }))}
            />
            <Input
              type="date"
              value={novoCompromisso.prazo}
              onChange={(e) => setNovoCompromisso(prev => ({ ...prev, prazo: e.target.value }))}
            />
          </div>
          <Button type="button" onClick={addCompromisso} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Compromisso
          </Button>
          {formData.compromissos.length > 0 && (
            <div className="space-y-2">
              {formData.compromissos.map((c, idx) => (
                <div key={idx} className="flex items-start justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{c.descricao}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {c.responsavel && `Responsável: ${c.responsavel}`}
                      {c.responsavel && c.prazo && ' • '}
                      {c.prazo && `Prazo: ${new Date(c.prazo).toLocaleDateString('pt-BR')}`}
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Próximos Passos</CardTitle>
            {camposPreenchidosAuto.includes('proximos_passos') && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                <Zap className="w-3 h-3 mr-1" /> {formData.proximos_passos.length} sugeridos
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">Ações recomendadas e encaminhamentos</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Adicione uma ação"
              value={novoProximoPasso}
              onChange={(e) => setNovoProximoPasso(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProximoPasso())}
            />
            <Button type="button" onClick={addProximoPasso} variant="outline" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {formData.proximos_passos.length > 0 && (
            <div className="space-y-2">
              {formData.proximos_passos.map((p, idx) => (
                <div key={idx} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-slate-700">{p}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeProximoPasso(idx)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botões de navegação */}
      <div className="flex justify-between pt-4">
        <Button
          onClick={onVoltarEtapa}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button
          onClick={onFinalizar}
          disabled={isFinalizando}
          className="bg-[#2D6A4F] hover:bg-[#1B4332] gap-2"
          size="lg"
        >
          {isFinalizando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Finalizar Registro
            </>
          )}
        </Button>
      </div>
    </div>
  );
}