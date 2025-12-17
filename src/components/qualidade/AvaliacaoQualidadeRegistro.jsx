import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Award, Shield } from 'lucide-react';
import { toast } from 'sonner';

const TIPOS_FONTE = {
  documento_formal: { label: 'Documento Formal', forca: 'forte', peso: 1.0 },
  ata_reuniao: { label: 'Ata de Reunião', forca: 'forte', peso: 0.95 },
  relato_presencial: { label: 'Relato Presencial Estruturado', forca: 'forte', peso: 0.9 },
  fala_direta: { label: 'Fala Direta Contextualizada', forca: 'forte', peso: 0.85 },
  reuniao_online: { label: 'Reunião Online Registrada', forca: 'intermediaria', peso: 0.7 },
  audio_contexto: { label: 'Áudio com Contexto Claro', forca: 'intermediaria', peso: 0.65 },
  email_identificado: { label: 'E-mail Identificado', forca: 'intermediaria', peso: 0.6 },
  whatsapp_grupo: { label: 'WhatsApp em Grupo', forca: 'fraca', peso: 0.4 },
  audio_sem_contexto: { label: 'Áudio sem Contexto', forca: 'fraca', peso: 0.35 },
  relato_indireto: { label: 'Relato Indireto/Informal', forca: 'fraca', peso: 0.3 }
};

const CRITICIDADE_CONFIG = {
  baixa: { label: 'Baixa', pesoRevisao: 0.15 },
  media: { label: 'Média', pesoRevisao: 0.30 },
  alta: { label: 'Alta', pesoRevisao: 0.40 },
  critica: { label: 'Crítica', pesoRevisao: 0.50 }
};

export default function AvaliacaoQualidadeRegistro({ open, onOpenChange, registro }) {
  const queryClient = useQueryClient();
  const [avaliacao, setAvaliacao] = useState({
    tipo_fonte: 'relato_presencial',
    criticidade_caso: 'media',
    revisao_humana_certificada: false,
    justificativa_revisao: '',
    componentes: {
      clareza: 5,
      identificacao_territorial: 5,
      tipo_demanda: 5,
      encaminhamentos: 5,
      responsavel_identificado: 5
    }
  });

  const calcularNota = () => {
    const { componentes, tipo_fonte, criticidade_caso, revisao_humana_certificada } = avaliacao;
    
    // Nota base (média dos componentes, normalizada para 10)
    const notaBase = (
      componentes.clareza +
      componentes.identificacao_territorial +
      componentes.tipo_demanda +
      componentes.encaminhamentos +
      componentes.responsavel_identificado
    ) / 5;

    // Peso da fonte
    const pesoFonte = TIPOS_FONTE[tipo_fonte].peso;
    
    // Peso da revisão humana (varia conforme criticidade)
    const pesoRevisao = revisao_humana_certificada 
      ? CRITICIDADE_CONFIG[criticidade_caso].pesoRevisao 
      : 0;

    // Cálculo final: nota_base * peso_fonte + bônus de revisão
    const notaComFonte = notaBase * pesoFonte;
    const bonusRevisao = revisao_humana_certificada ? (10 - notaComFonte) * pesoRevisao : 0;
    const notaFinal = Math.min(10, notaComFonte + bonusRevisao);

    return {
      nota_final: Math.round(notaFinal * 10) / 10,
      nota_base: Math.round(notaBase * 10) / 10,
      peso_fonte: pesoFonte,
      peso_revisao_humana: pesoRevisao
    };
  };

  const salvarMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const notas = calcularNota();
      
      const avaliacaoCompleta = {
        ...notas,
        forca_fonte: TIPOS_FONTE[avaliacao.tipo_fonte].forca,
        tipo_fonte: avaliacao.tipo_fonte,
        criticidade_caso: avaliacao.criticidade_caso,
        revisao_humana_certificada: avaliacao.revisao_humana_certificada,
        revisor_nome: avaliacao.revisao_humana_certificada ? user?.full_name : null,
        revisor_email: avaliacao.revisao_humana_certificada ? user?.email : null,
        data_revisao: avaliacao.revisao_humana_certificada ? new Date().toISOString() : null,
        justificativa_revisao: avaliacao.justificativa_revisao,
        componentes_nota: avaliacao.componentes
      };

      await base44.entities.Registro.update(registro.id, {
        avaliacao_qualidade: avaliacaoCompleta,
        usuario_ultima_atualizacao: user?.email,
        validado_em: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registro'] });
      queryClient.invalidateQueries({ queryKey: ['registros'] });
      toast.success('Avaliação de qualidade salva!');
      onOpenChange(false);
    }
  });

  const notas = calcularNota();
  const fonteConfig = TIPOS_FONTE[avaliacao.tipo_fonte];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliação de Qualidade do Registro</DialogTitle>
          <DialogDescription>
            Avalie a qualidade da informação (não a criticidade do conteúdo)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nota Final Preview */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Nota de Qualidade</p>
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-bold text-slate-900">{notas.nota_final}</span>
                    <span className="text-lg text-slate-500">/10</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Base: {notas.nota_base} • Fonte: {(notas.peso_fonte * 100).toFixed(0)}% • 
                    Revisão: {(notas.peso_revisao_humana * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={
                    notas.nota_final >= 8 ? 'bg-emerald-100 text-emerald-700' :
                    notas.nota_final >= 6 ? 'bg-blue-100 text-blue-700' :
                    notas.nota_final >= 4 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {notas.nota_final >= 8 ? 'Excelente' :
                     notas.nota_final >= 6 ? 'Bom' :
                     notas.nota_final >= 4 ? 'Utilizável' : 'Frágil'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tipo de Fonte */}
          <div className="space-y-2">
            <Label>Tipo de Fonte *</Label>
            <Select
              value={avaliacao.tipo_fonte}
              onValueChange={(v) => setAvaliacao(prev => ({ ...prev, tipo_fonte: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPOS_FONTE).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={
                        config.forca === 'forte' ? 'text-emerald-600' :
                        config.forca === 'intermediaria' ? 'text-amber-600' :
                        'text-red-600'
                      }>
                        {config.forca === 'forte' ? '🔵' : config.forca === 'intermediaria' ? '🟡' : '🔴'}
                      </Badge>
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="font-medium text-slate-700">
                Força da Fonte: <span className={
                  fonteConfig.forca === 'forte' ? 'text-emerald-600' :
                  fonteConfig.forca === 'intermediaria' ? 'text-amber-600' :
                  'text-red-600'
                }>{fonteConfig.forca.toUpperCase()}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Peso aplicado: {(fonteConfig.peso * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Componentes da Nota Base */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Componentes da Avaliação</Label>
            
            {Object.entries({
              clareza: 'Clareza das Informações',
              identificacao_territorial: 'Identificação Territorial',
              tipo_demanda: 'Tipo de Demanda Identificado',
              encaminhamentos: 'Encaminhamentos Registrados',
              responsavel_identificado: 'Responsável Identificado'
            }).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{label}</Label>
                  <span className="text-sm font-medium text-slate-700">
                    {avaliacao.componentes[key]}/10
                  </span>
                </div>
                <Slider
                  value={[avaliacao.componentes[key]]}
                  onValueChange={([v]) => setAvaliacao(prev => ({
                    ...prev,
                    componentes: { ...prev.componentes, [key]: v }
                  }))}
                  min={0}
                  max={10}
                  step={0.5}
                />
              </div>
            ))}
          </div>

          {/* Criticidade do Caso */}
          <div className="space-y-2">
            <Label>Criticidade do Caso (para ponderar revisão humana)</Label>
            <Select
              value={avaliacao.criticidade_caso}
              onValueChange={(v) => setAvaliacao(prev => ({ ...prev, criticidade_caso: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CRITICIDADE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label} (revisão vale {(config.pesoRevisao * 100).toFixed(0)}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Revisão Humana Certificada */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 mt-1" />
                  <div>
                    <p className="font-medium text-amber-900">Revisão Humana Certificada</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Declaro que as informações foram produzidas, relatadas e conferidas por profissionais humanos
                    </p>
                  </div>
                </div>
                <Switch
                  checked={avaliacao.revisao_humana_certificada}
                  onCheckedChange={(v) => setAvaliacao(prev => ({ ...prev, revisao_humana_certificada: v }))}
                />
              </div>

              {avaliacao.revisao_humana_certificada && (
                <div className="space-y-2 pt-3 border-t border-amber-200">
                  <Label className="text-sm">Justificativa da Revisão</Label>
                  <Textarea
                    placeholder="Descreva o processo de revisão realizado..."
                    value={avaliacao.justificativa_revisao}
                    onChange={(e) => setAvaliacao(prev => ({ ...prev, justificativa_revisao: e.target.value }))}
                    rows={3}
                  />
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Peso da revisão neste caso: {(CRITICIDADE_CONFIG[avaliacao.criticidade_caso].pesoRevisao * 100).toFixed(0)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => salvarMutation.mutate()}
            disabled={salvarMutation.isPending}
            className="bg-[#2D6A4F] hover:bg-[#1B4332]"
          >
            <Award className="w-4 h-4 mr-2" />
            Salvar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}