import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Crown,
  ShieldCheck,
  UserCheck,
  MapPin,
  Target,
  TrendingUp,
  Calendar,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const funcaoConfig = {
  coordenador_geral: { label: 'Coordenador Geral', icon: Crown, color: 'bg-purple-100 text-purple-700' },
  coordenador: { label: 'Coordenador', icon: ShieldCheck, color: 'bg-blue-100 text-blue-700' },
  supervisor: { label: 'Supervisor', icon: UserCheck, color: 'bg-emerald-100 text-emerald-700' },
  membro: { label: 'Membro', icon: Users, color: 'bg-slate-100 text-slate-700' }
};

export default function DetalhesEquipe({ equipe, open, onOpenChange, onEdit }) {
  if (!equipe) return null;

  const membrosAtivos = equipe.membros?.filter(m => m.ativo) || [];
  const membrosInativos = equipe.membros?.filter(m => !m.ativo) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {equipe.cor_identificacao && (
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: equipe.cor_identificacao }}
                />
              )}
              <DialogTitle>{equipe.nome}</DialogTitle>
            </div>
            <Button onClick={onEdit} variant="outline" size="sm" className="gap-2">
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="membros" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="membros">Membros</TabsTrigger>
            <TabsTrigger value="territorios">Territórios</TabsTrigger>
            <TabsTrigger value="metas">Metas</TabsTrigger>
            <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          </TabsList>

          {/* Membros */}
          <TabsContent value="membros" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Membros Ativos ({membrosAtivos.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {membrosAtivos.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Nenhum membro ativo</p>
                ) : (
                  membrosAtivos.map((membro, idx) => {
                    const FuncaoIcon = funcaoConfig[membro.funcao]?.icon || Users;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white">
                            <FuncaoIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{membro.nome || membro.email}</p>
                            <p className="text-xs text-slate-500">{membro.email}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={funcaoConfig[membro.funcao]?.color}>
                          {funcaoConfig[membro.funcao]?.label}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {membrosInativos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Membros Inativos ({membrosInativos.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {membrosInativos.map((membro, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg opacity-60">
                      <div>
                        <p className="font-medium text-sm">{membro.nome || membro.email}</p>
                        <p className="text-xs text-slate-500">{membro.email}</p>
                      </div>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                        Inativo
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Territórios */}
          <TabsContent value="territorios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Comunidades Atendidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {equipe.comunidades_atendidas?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {equipe.comunidades_atendidas.map((com, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-emerald-100 text-emerald-700">
                        {com}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhuma comunidade atribuída</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Territórios de Responsabilidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                {equipe.territorios_responsabilidade?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {equipe.territorios_responsabilidade.map((ter, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-700">
                        {ter}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhum território atribuído</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metas */}
          <TabsContent value="metas" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Registros/Mês</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {equipe.metas?.registros_mes || 0}
                      </p>
                    </div>
                    <Target className="w-10 h-10 text-slate-300" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Reuniões/Mês</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {equipe.metas?.reunioes_mes || 0}
                      </p>
                    </div>
                    <Calendar className="w-10 h-10 text-slate-300" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Prazo Devolutivas</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {equipe.metas?.devolutivas_prazo || 15} dias
                      </p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-slate-300" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Estatísticas */}
          <TabsContent value="estatisticas" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Total de Registros</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {equipe.estatisticas?.total_registros || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Total de Reuniões</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {equipe.estatisticas?.total_reunioes || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Casos Abertos</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {equipe.estatisticas?.casos_abertos || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {equipe.estatisticas?.ultima_atividade && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500 mb-1">Última Atividade</p>
                  <p className="font-medium">
                    {format(new Date(equipe.estatisticas.ultima_atividade), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>
            )}

            {equipe.descricao && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700">{equipe.descricao}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}