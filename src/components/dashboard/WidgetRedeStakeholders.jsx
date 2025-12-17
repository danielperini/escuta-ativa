import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, Users, TrendingUp, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function WidgetRedeStakeholders() {
  const [expandido, setExpandido] = useState(false);
  
  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders-rede'],
    queryFn: () => base44.entities.Stakeholder.list('-score_engajamento', 100)
  });

  // Processar rede de contatos
  const redeData = React.useMemo(() => {
    const stakeholdersComRede = stakeholders.filter(s => s.rede_contatos && s.rede_contatos.length > 0);
    
    const conexoes = new Map();
    const stakeholderMap = new Map(stakeholders.map(s => [s.id, s]));

    stakeholdersComRede.forEach(s => {
      s.rede_contatos.forEach(contato => {
        const alvo = stakeholderMap.get(contato.stakeholder_id);
        if (!alvo) return;

        const key = [s.id, contato.stakeholder_id].sort().join('-');
        if (!conexoes.has(key)) {
          conexoes.set(key, {
            de: s.nome,
            para: alvo.nome,
            tipo: contato.tipo_relacao,
            forca: contato.forca_relacao,
            engajamentoDe: s.score_engajamento || 0,
            engajamentoPara: alvo.score_engajamento || 0
          });
        }
      });
    });

    return {
      totalStakeholders: stakeholdersComRede.length,
      totalConexoes: conexoes.size,
      conexoes: Array.from(conexoes.values()).slice(0, expandido ? 50 : 8),
      stakeholdersChave: stakeholdersComRede
        .sort((a, b) => (b.rede_contatos?.length || 0) - (a.rede_contatos?.length || 0))
        .slice(0, 5)
    };
  }, [stakeholders, expandido]);

  const getTipoConfig = (tipo) => {
    const config = {
      colaborador: { color: 'bg-emerald-100 text-emerald-700', icon: '🤝' },
      aliado: { color: 'bg-blue-100 text-blue-700', icon: '👥' },
      opositor: { color: 'bg-red-100 text-red-700', icon: '⚔️' },
      neutro: { color: 'bg-slate-100 text-slate-700', icon: '🔘' },
      familiar: { color: 'bg-purple-100 text-purple-700', icon: '👨‍👩‍👧‍👦' },
      profissional: { color: 'bg-indigo-100 text-indigo-700', icon: '💼' }
    };
    return config[tipo] || config.neutro;
  };

  const getForcaConfig = (forca) => {
    const config = {
      fraca: { width: 'w-1/4', color: 'bg-slate-300' },
      moderada: { width: 'w-2/4', color: 'bg-blue-400' },
      forte: { width: 'w-full', color: 'bg-emerald-500' }
    };
    return config[forca] || config.moderada;
  };

  const ConteudoRede = () => (
    <div className="space-y-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
          <div className="text-2xl font-bold text-blue-900">{redeData.totalStakeholders}</div>
          <div className="text-xs text-blue-700">Com conexões</div>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg text-center">
          <Network className="w-5 h-5 mx-auto mb-1 text-purple-600" />
          <div className="text-2xl font-bold text-purple-900">{redeData.totalConexoes}</div>
          <div className="text-xs text-purple-700">Total conexões</div>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
          <div className="text-2xl font-bold text-emerald-900">
            {redeData.totalStakeholders > 0 ? Math.round(redeData.totalConexoes / redeData.totalStakeholders * 10) / 10 : 0}
          </div>
          <div className="text-xs text-emerald-700">Média p/ pessoa</div>
        </div>
      </div>

      {/* Stakeholders Chave */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Stakeholders Mais Conectados</h4>
        <div className="space-y-2">
          {redeData.stakeholdersChave.map((s, idx) => (
            <Link key={idx} to={createPageUrl('PerfilStakeholder') + `?id=${s.id}`}>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded hover:bg-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                    {s.nome[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-900">{s.nome}</span>
                </div>
                <Badge variant="secondary">{s.rede_contatos?.length || 0} conexões</Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Lista de Conexões */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Conexões Mapeadas</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {redeData.conexoes.map((conexao, idx) => {
            const tipoConfig = getTipoConfig(conexao.tipo);
            const forcaConfig = getForcaConfig(conexao.forca);
            
            return (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">{tipoConfig.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium text-slate-900">{conexao.de}</span>
                        <span className="text-slate-500 mx-1">↔</span>
                        <span className="font-medium text-slate-900">{conexao.para}</span>
                      </div>
                      <Badge className={tipoConfig.color} variant="secondary" size="sm">
                        {conexao.tipo}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Força da relação:</span>
                    <span className="font-medium capitalize">{conexao.forca}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${forcaConfig.color} ${forcaConfig.width}`}></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 pt-1">
                    <span>Engajamento: {conexao.engajamentoDe}</span>
                    <span>Engajamento: {conexao.engajamentoPara}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-purple-600" />
              Rede de Stakeholders
              <Badge variant="secondary">{redeData.totalConexoes} conexões</Badge>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setExpandido(true)}
              className="gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              Expandir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {redeData.totalConexoes === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Nenhuma conexão mapeada entre stakeholders
            </p>
          ) : (
            <ConteudoRede />
          )}
        </CardContent>
      </Card>

      <Dialog open={expandido} onOpenChange={setExpandido}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-purple-600" />
              Rede Completa de Stakeholders
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            <ConteudoRede />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}