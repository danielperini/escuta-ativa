import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Trash2, Network } from 'lucide-react';

export default function RedeRelacionamentosVisual({ stakeholder, onUpdateRede }) {
  const [adicionandoRelacao, setAdicionandoRelacao] = useState(false);
  const [novaRelacao, setNovaRelacao] = useState({
    stakeholder_id: '',
    tipo_relacao: 'neutro',
    forca_relacao: 'moderada',
    descricao: ''
  });

  const { data: todosStakeholders = [] } = useQuery({
    queryKey: ['todos-stakeholders'],
    queryFn: () => base44.entities.Stakeholder.list()
  });

  const redeContatos = stakeholder.rede_contatos || [];

  const adicionarRelacao = () => {
    if (novaRelacao.stakeholder_id) {
      const novaRede = [...redeContatos, novaRelacao];
      onUpdateRede(novaRede);
      setNovaRelacao({
        stakeholder_id: '',
        tipo_relacao: 'neutro',
        forca_relacao: 'moderada',
        descricao: ''
      });
      setAdicionandoRelacao(false);
    }
  };

  const removerRelacao = (index) => {
    const novaRede = redeContatos.filter((_, i) => i !== index);
    onUpdateRede(novaRede);
  };

  const getStakeholderNome = (id) => {
    return todosStakeholders.find(s => s.id === id)?.nome || 'Desconhecido';
  };

  const tipoRelacaoConfig = {
    colaborador: { label: 'Colaborador', color: 'bg-green-100 text-green-700' },
    aliado: { label: 'Aliado', color: 'bg-blue-100 text-blue-700' },
    opositor: { label: 'Opositor', color: 'bg-red-100 text-red-700' },
    neutro: { label: 'Neutro', color: 'bg-slate-100 text-slate-700' },
    familiar: { label: 'Familiar', color: 'bg-purple-100 text-purple-700' },
    profissional: { label: 'Profissional', color: 'bg-amber-100 text-amber-700' }
  };

  const forcaRelacaoConfig = {
    fraca: { label: 'Fraca', width: 'w-1/3' },
    moderada: { label: 'Moderada', width: 'w-2/3' },
    forte: { label: 'Forte', width: 'w-full' }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Rede de Relacionamentos ({redeContatos.length})
            </CardTitle>
            <Button onClick={() => setAdicionandoRelacao(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Relação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Visual da Rede */}
            <div className="bg-slate-50 rounded-lg p-6 min-h-[300px]">
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-2xl font-bold mx-auto">
                    {stakeholder.nome?.[0]?.toUpperCase()}
                  </div>
                  <p className="font-semibold">{stakeholder.nome}</p>
                  
                  {redeContatos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                      {redeContatos.map((relacao, idx) => (
                        <div key={idx} className="relative">
                          <div className="w-16 h-16 rounded-full bg-slate-300 flex items-center justify-center text-white font-bold">
                            {getStakeholderNome(relacao.stakeholder_id)?.[0]?.toUpperCase()}
                          </div>
                          <p className="text-xs text-center mt-2">{getStakeholderNome(relacao.stakeholder_id)}</p>
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <Badge className={tipoRelacaoConfig[relacao.tipo_relacao]?.color}>
                              {tipoRelacaoConfig[relacao.tipo_relacao]?.label}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lista Detalhada */}
            <div className="space-y-3">
              {redeContatos.map((relacao, idx) => {
                const tipoConfig = tipoRelacaoConfig[relacao.tipo_relacao];
                const forcaConfig = forcaRelacaoConfig[relacao.forca_relacao];
                
                return (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">{getStakeholderNome(relacao.stakeholder_id)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={tipoConfig?.color}>
                            {tipoConfig?.label}
                          </Badge>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span>Força:</span>
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full bg-[#2D6A4F] ${forcaConfig?.width}`} />
                            </div>
                            <span className="text-xs">{forcaConfig?.label}</span>
                          </div>
                        </div>
                        {relacao.descricao && (
                          <p className="text-sm text-slate-600 mt-2">{relacao.descricao}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerRelacao(idx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Adicionar Relação */}
      {adicionandoRelacao && (
        <Card className="border-2 border-[#2D6A4F]">
          <CardHeader>
            <CardTitle>Nova Relação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Stakeholder</Label>
              <Select
                value={novaRelacao.stakeholder_id}
                onValueChange={(value) => setNovaRelacao({ ...novaRelacao, stakeholder_id: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione um stakeholder" />
                </SelectTrigger>
                <SelectContent>
                  {todosStakeholders
                    .filter(s => s.id !== stakeholder.id)
                    .map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Relação</Label>
              <Select
                value={novaRelacao.tipo_relacao}
                onValueChange={(value) => setNovaRelacao({ ...novaRelacao, tipo_relacao: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoRelacaoConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Força da Relação</Label>
              <Select
                value={novaRelacao.forca_relacao}
                onValueChange={(value) => setNovaRelacao({ ...novaRelacao, forca_relacao: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(forcaRelacaoConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={novaRelacao.descricao}
                onChange={(e) => setNovaRelacao({ ...novaRelacao, descricao: e.target.value })}
                rows={3}
                className="mt-2"
                placeholder="Descreva a natureza desta relação..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={adicionarRelacao} className="bg-[#2D6A4F] hover:bg-[#1B4332]">
                Adicionar
              </Button>
              <Button variant="outline" onClick={() => setAdicionandoRelacao(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}