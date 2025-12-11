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
import { Calendar, MapPin, Users, FileText, X, Plus, ArrowRight, Zap, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

const tipoOptions = [
  { value: 'reuniao', label: 'Reunião' },
  { value: 'conversa_campo', label: 'Conversa Informal' },
  { value: 'visita', label: 'Visita Técnica' },
  { value: 'demanda', label: 'Demanda Espontânea' },
  { value: 'ocorrencia', label: 'Atividade Comunitária' }
];

export default function Etapa1Basico({ 
  formData, 
  setFormData, 
  comunidades, 
  camposPreenchidosAuto,
  camposPendentes,
  onProximaEtapa 
}) {
  const [novoParticipante, setNovoParticipante] = React.useState('');

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

  const isEtapa1Valida = formData.titulo && formData.tipo && formData.comunidade;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#40916C]" />
            Etapa 1: Informações Básicas
          </CardTitle>
          <p className="text-sm text-slate-500">Revise e confirme os dados extraídos pela IA</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="titulo">Título do Registro *</Label>
              {camposPreenchidosAuto.includes('titulo_sugerido') && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                  <Zap className="w-3 h-3 mr-1" /> Preenchido por IA
                </Badge>
              )}
              {camposPendentes.includes('titulo') && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" /> Complete este campo
                </Badge>
              )}
            </div>
            <Input
              id="titulo"
              placeholder="Ex: Reunião com Associação de Moradores"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              className={cn(camposPendentes.includes('titulo') && "border-amber-300 bg-amber-50/50")}
            />
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tipo de Interação *</Label>
              {camposPreenchidosAuto.includes('tipo_sugerido') && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                  <Zap className="w-3 h-3 mr-1" /> Preenchido por IA
                </Badge>
              )}
            </div>
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

          {/* Comunidade */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Comunidade / Território *</Label>
              {camposPreenchidosAuto.includes('comunidade') && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                  <Zap className="w-3 h-3 mr-1" /> Preenchido por IA
                </Badge>
              )}
              {camposPendentes.includes('comunidade') && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" /> Complete este campo
                </Badge>
              )}
            </div>
            <Select
              value={formData.comunidade}
              onValueChange={(value) => setFormData(prev => ({ ...prev, comunidade: value }))}
            >
              <SelectTrigger className={cn(camposPendentes.includes('comunidade') && "border-amber-300 bg-amber-50/50")}>
                <SelectValue placeholder="Selecione a comunidade" />
              </SelectTrigger>
              <SelectContent>
                {comunidades.map(c => (
                  <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={formData.data_registro || new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData(prev => ({ ...prev, data_registro: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="local">Local (opcional)</Label>
              <Input
                id="local"
                placeholder="Ex: Salão da comunidade"
                value={formData.local || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, local: e.target.value }))}
              />
            </div>
          </div>

          {/* Participantes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Participantes</Label>
              {camposPreenchidosAuto.includes('participantes') && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                  <Zap className="w-3 h-3 mr-1" /> {formData.participantes.length} detectados
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nome do participante"
                value={novoParticipante}
                onChange={(e) => setNovoParticipante(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipante())}
              />
              <Button type="button" onClick={addParticipante} variant="outline" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.participantes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.participantes.map((p, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                    <Users className="w-3 h-3" />
                    {p}
                    <button onClick={() => removeParticipante(idx)} className="ml-1 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="descricao">Descrição Geral</Label>
              {camposPreenchidosAuto.includes('resumo_automatico') && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                  <Zap className="w-3 h-3 mr-1" /> Gerado por IA
                </Badge>
              )}
            </div>
            <Textarea
              id="descricao"
              placeholder="Resumo do que ocorreu..."
              rows={4}
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
            />
          </div>

          {/* Anexos */}
          {formData.arquivos?.length > 0 && (
            <div className="space-y-2">
              <Label>Documentos Anexados</Label>
              <div className="space-y-2">
                {formData.arquivos.map((arquivo, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded text-sm">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="flex-1 truncate">{arquivo.nome}</span>
                    <Badge variant="secondary" className="text-xs capitalize">{arquivo.tipo}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão próxima etapa */}
      <div className="flex justify-end">
        <Button
          onClick={onProximaEtapa}
          disabled={!isEtapa1Valida}
          className="bg-[#2D6A4F] hover:bg-[#1B4332] gap-2"
          size="lg"
        >
          Próxima Etapa
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {!isEtapa1Valida && (
        <p className="text-sm text-amber-600 text-center">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          Preencha os campos obrigatórios para continuar
        </p>
      )}
    </div>
  );
}