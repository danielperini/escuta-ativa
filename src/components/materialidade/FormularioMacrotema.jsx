import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Info } from 'lucide-react';

const MACROTEMAS_PADRAO = [
  "Água", "Clima e Atmosfera", "Biodiversidade", "Resíduos, Rejeitos e Estéril",
  "Responsabilidade Social", "Gestão de Impactos", "Condicionantes",
  "Investimento Social", "Fornecedores Locais", "Diversidade, Equidade e Inclusão",
  "Planejamento do Trabalho", "Cultura Organizacional", "Conformidade",
  "Ética e Transparência", "Governança e Sustentabilidade",
  "Engajamento de Partes Interessadas", "Fornecimento Sustentável"
];

export default function FormularioMacrotema({ open, onOpenChange, tema, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'social',
    nivel_impacto: 3,
    nivel_presenca: 3,
    percepcao_comunidade: 3,
    classificacao_cor: 'medio',
    drives_avaliacao: {
      impacto_cotidiano: 3,
      clima_dialogo: 3,
      influencia_stakeholders: 3,
      presenca_equipes: 3,
      incidencia_protestos: 1,
      confianca_reputacao: 3
    },
    localidades: [],
    observacoes_qualitativas: ''
  });

  useEffect(() => {
    if (tema) {
      setFormData({
        nome: tema.nome,
        categoria: tema.categoria || 'social',
        nivel_impacto: tema.nivel_impacto,
        nivel_presenca: tema.nivel_presenca,
        percepcao_comunidade: tema.percepcao_comunidade,
        classificacao_cor: tema.classificacao_cor,
        drives_avaliacao: tema.drives_avaliacao || {
          impacto_cotidiano: 3,
          clima_dialogo: 3,
          influencia_stakeholders: 3,
          presenca_equipes: 3,
          incidencia_protestos: 1,
          confianca_reputacao: 3
        },
        localidades: tema.localidades || [],
        observacoes_qualitativas: tema.observacoes_qualitativas || ''
      });
    } else {
      resetForm();
    }
  }, [tema, open]);

  const resetForm = () => {
    setFormData({
      nome: '',
      categoria: 'social',
      nivel_impacto: 3,
      nivel_presenca: 3,
      percepcao_comunidade: 3,
      classificacao_cor: 'medio',
      drives_avaliacao: {
        impacto_cotidiano: 3,
        clima_dialogo: 3,
        influencia_stakeholders: 3,
        presenca_equipes: 3,
        incidencia_protestos: 1,
        confianca_reputacao: 3
      },
      localidades: [],
      observacoes_qualitativas: ''
    });
  };

  const calcularRiscoSocial = (data) => {
    const drives = data.drives_avaliacao;
    
    // Ponderação dos drives
    const score = (
      (drives.impacto_cotidiano * 0.25) +
      ((6 - drives.clima_dialogo) * 0.15) +
      (drives.influencia_stakeholders * 0.15) +
      ((6 - drives.presenca_equipes) * 0.15) +
      (drives.incidencia_protestos * 0.20) +
      ((6 - drives.confianca_reputacao) * 0.10)
    ) * 20;

    return Math.round(Math.min(100, Math.max(0, score)));
  };

  const determinarCategoriaRisco = (score) => {
    if (score >= 66) return 'alto';
    if (score >= 33) return 'medio';
    return 'baixo';
  };

  const determinarClassificacaoCor = (data) => {
    const { nivel_impacto, nivel_presenca, percepcao_comunidade } = data;
    
    // Vermelho: Alto impacto + alta presença + percepção negativa
    if (nivel_impacto >= 4 && nivel_presenca >= 4 && percepcao_comunidade <= 2) {
      return 'critico';
    }
    
    // Verde: Baixo impacto + boa percepção
    if (nivel_impacto <= 2 && percepcao_comunidade >= 4) {
      return 'positivo';
    }
    
    // Branco: Ausente
    if (nivel_impacto === 1 && nivel_presenca === 1) {
      return 'ausente';
    }
    
    // Amarelo: Casos intermediários
    return 'medio';
  };

  const mutation = useMutation({
    mutationFn: (data) => {
      const riscoSocial = calcularRiscoSocial(data);
      const categoriaRisco = determinarCategoriaRisco(riscoSocial);
      const classificacaoCor = determinarClassificacaoCor(data);

      const payload = {
        ...data,
        risco_social_calculado: riscoSocial,
        categoria_risco: categoriaRisco,
        classificacao_cor: classificacaoCor
      };

      return tema 
        ? base44.entities.Macrotema.update(tema.id, payload)
        : base44.entities.Macrotema.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['macrotemas'] });
      onSuccess?.();
    }
  });

  const riscoCalculado = calcularRiscoSocial(formData);
  const categoriaRisco = determinarCategoriaRisco(riscoCalculado);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tema ? 'Editar Macrotema' : 'Novo Macrotema'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label>Nome do Macrotema *</Label>
            <Select 
              value={formData.nome} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, nome: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um macrotema" />
              </SelectTrigger>
              <SelectContent>
                {MACROTEMAS_PADRAO.map(mt => (
                  <SelectItem key={mt} value={mt}>{mt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categoria ESG */}
          <div className="space-y-2">
            <Label>Categoria ESG</Label>
            <Select 
              value={formData.categoria} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, categoria: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ambiental">🌿 Ambiental</SelectItem>
                <SelectItem value="social">🤝 Social</SelectItem>
                <SelectItem value="governanca">⚖️ Governança</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Critérios de Materialidade */}
          <div className="border rounded-lg p-4 bg-slate-50">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Critérios de Materialidade
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Nível de Impacto: {formData.nivel_impacto}</Label>
                <Slider
                  value={[formData.nivel_impacto]}
                  onValueChange={([v]) => setFormData(prev => ({ ...prev, nivel_impacto: v }))}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Baixo</span>
                  <span>Alto</span>
                </div>
              </div>

              <div>
                <Label>Nível de Presença no Território: {formData.nivel_presenca}</Label>
                <Slider
                  value={[formData.nivel_presenca]}
                  onValueChange={([v]) => setFormData(prev => ({ ...prev, nivel_presenca: v }))}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Baixa</span>
                  <span>Alta</span>
                </div>
              </div>

              <div>
                <Label>Percepção da Comunidade: {formData.percepcao_comunidade}</Label>
                <Slider
                  value={[formData.percepcao_comunidade]}
                  onValueChange={([v]) => setFormData(prev => ({ ...prev, percepcao_comunidade: v }))}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Negativa</span>
                  <span>Positiva</span>
                </div>
              </div>
            </div>
          </div>

          {/* Drives de Avaliação Social */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold mb-4">Drives de Avaliação Social (Cálculo de Risco)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries({
                impacto_cotidiano: 'Impacto no Cotidiano Local',
                clima_dialogo: 'Clima nas Reuniões',
                influencia_stakeholders: 'Influência dos Stakeholders',
                presenca_equipes: 'Presença das Equipes',
                incidencia_protestos: 'Incidência de Protestos',
                confianca_reputacao: 'Confiança e Reputação'
              }).map(([key, label]) => (
                <div key={key}>
                  <Label className="text-sm">{label}: {formData.drives_avaliacao[key]}</Label>
                  <Slider
                    value={[formData.drives_avaliacao[key]]}
                    onValueChange={([v]) => setFormData(prev => ({
                      ...prev,
                      drives_avaliacao: { ...prev.drives_avaliacao, [key]: v }
                    }))}
                    min={1}
                    max={5}
                    step={1}
                    className="mt-2"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-white rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Risco Social Calculado:</span>
                <Badge className={
                  categoriaRisco === 'alto' ? 'bg-red-100 text-red-800' :
                  categoriaRisco === 'medio' ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }>
                  {riscoCalculado}/100 - {categoriaRisco.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Observações Qualitativas */}
          <div className="space-y-2">
            <Label>Observações Qualitativas</Label>
            <Textarea
              value={formData.observacoes_qualitativas}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes_qualitativas: e.target.value }))}
              placeholder="Ex: Percepção positiva identificada, fortalecimento de parcerias, educação ambiental ativa..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate(formData)}
            disabled={!formData.nome || mutation.isPending}
            className="bg-[#E31E24] hover:bg-[#B01419]"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {tema ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}