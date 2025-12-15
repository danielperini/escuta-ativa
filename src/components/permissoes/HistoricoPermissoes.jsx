import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, UserPlus, UserMinus, Edit, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TIPO_ALTERACAO_CONFIG = {
  papel_adicionado: { label: 'Papel Adicionado', icon: UserPlus, color: 'bg-green-100 text-green-700' },
  papel_removido: { label: 'Papel Removido', icon: UserMinus, color: 'bg-red-100 text-red-700' },
  permissao_alterada: { label: 'Permissão Alterada', icon: Edit, color: 'bg-blue-100 text-blue-700' },
  role_criado: { label: 'Papel Criado', icon: Shield, color: 'bg-purple-100 text-purple-700' },
  role_atualizado: { label: 'Papel Atualizado', icon: Edit, color: 'bg-amber-100 text-amber-700' },
  usuario_desativado: { label: 'Usuário Desativado', icon: AlertCircle, color: 'bg-slate-100 text-slate-700' },
  usuario_reativado: { label: 'Usuário Reativado', icon: AlertCircle, color: 'bg-emerald-100 text-emerald-700' }
};

export default function HistoricoPermissoes({ usuarioId }) {
  const { data: historico = [] } = useQuery({
    queryKey: ['historico-permissoes', usuarioId],
    queryFn: async () => {
      const todos = await base44.entities.HistoricoPermissoes.list('-created_date', 100);
      return usuarioId 
        ? todos.filter(h => h.usuario_afetado_id === usuarioId)
        : todos;
    }
  });

  if (historico.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Nenhuma alteração de permissão registrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico de Alterações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {historico.map((item, idx) => {
            const config = TIPO_ALTERACAO_CONFIG[item.tipo_alteracao];
            const Icon = config?.icon || Edit;

            return (
              <div key={idx} className="p-4 border rounded-lg bg-slate-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={config?.color || 'bg-slate-100'}>
                      <Icon className="w-3 h-3 mr-1" />
                      {config?.label || item.tipo_alteracao}
                    </Badge>
                    {item.papel_nome && (
                      <Badge variant="outline" className="text-xs">
                        {item.papel_nome}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {format(new Date(item.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Usuário afetado:</strong> {item.usuario_afetado_nome} ({item.usuario_afetado_email})
                  </p>
                  <p>
                    <strong>Realizado por:</strong> {item.usuario_responsavel_nome || 'Sistema'}
                  </p>
                  {item.justificativa && (
                    <p className="text-slate-600 italic">
                      <strong>Justificativa:</strong> {item.justificativa}
                    </p>
                  )}
                </div>

                {/* Detalhes da alteração */}
                {item.detalhes_anterior && item.detalhes_novo && (
                  <div className="mt-3 p-3 bg-white rounded border text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="font-semibold text-slate-700 mb-1">Anterior:</p>
                        <pre className="text-xs text-slate-600 overflow-auto">
                          {JSON.stringify(item.detalhes_anterior, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700 mb-1">Novo:</p>
                        <pre className="text-xs text-slate-600 overflow-auto">
                          {JSON.stringify(item.detalhes_novo, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}