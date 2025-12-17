import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, Users, ExternalLink, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const nivelConfig = {
  baixo: { label: 'Baixo', color: 'bg-green-100 text-green-700 border-green-300' },
  moderado: { label: 'Moderado', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  alto: { label: 'Alto', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  critico: { label: 'Crítico', color: 'bg-red-100 text-red-700 border-red-300' }
};

const statusConfig = {
  ativo: { label: 'Ativo', color: 'bg-red-100 text-red-700' },
  monitorando: { label: 'Monitorando', color: 'bg-yellow-100 text-yellow-700' },
  resolvido: { label: 'Resolvido', color: 'bg-green-100 text-green-700' }
};

export default function RiscosSociais() {
  const { data: riscos = [], isLoading } = useQuery({
    queryKey: ['riscos-sociais'],
    queryFn: () => base44.entities.RiscoSocial.list('-created_date', 100)
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-riscos'],
    queryFn: () => base44.entities.Registro.list('-created_date', 200)
  });

  // Agrupar por status
  const riscosAtivos = riscos.filter(r => r.status === 'ativo');
  const riscosMonitorando = riscos.filter(r => r.status === 'monitorando');
  const riscosResolvidos = riscos.filter(r => r.status === 'resolvido');

  // Estatísticas
  const totalCriticos = riscos.filter(r => r.nivel === 'critico' && r.status === 'ativo').length;
  const totalAltos = riscos.filter(r => r.nivel === 'alto' && r.status === 'ativo').length;

  const getRegistrosRelacionados = (risco) => {
    if (!risco.registros_associados || risco.registros_associados.length === 0) return [];
    return registros.filter(r => risco.registros_associados.includes(r.id));
  };

  const RiscoCard = ({ risco }) => {
    const registrosRelacionados = getRegistrosRelacionados(risco);
    const nivel = nivelConfig[risco.nivel] || nivelConfig.baixo;
    const status = statusConfig[risco.status] || statusConfig.ativo;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight flex-1">
              {risco.titulo}
            </CardTitle>
            <Badge className={cn("shrink-0", nivel.color, "border")}>
              {nivel.label}
            </Badge>
          </div>
          <Badge variant="secondary" className={cn("w-fit text-xs", status.color)}>
            {status.label}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600 line-clamp-3">{risco.descricao}</p>
          
          {risco.comunidade && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="w-3 h-3" />
              {risco.comunidade}
            </div>
          )}

          {risco.liderancas_envolvidas && risco.liderancas_envolvidas.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Users className="w-3 h-3" />
              {risco.liderancas_envolvidas.length} liderança(s) envolvida(s)
            </div>
          )}

          {risco.previsao_agravamento && (
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className={cn(
                "w-3 h-3",
                risco.previsao_agravamento === 'alta' ? 'text-red-500' :
                risco.previsao_agravamento === 'media' ? 'text-yellow-500' :
                'text-green-500'
              )} />
              <span className={cn(
                "font-medium",
                risco.previsao_agravamento === 'alta' ? 'text-red-600' :
                risco.previsao_agravamento === 'media' ? 'text-yellow-600' :
                'text-green-600'
              )}>
                Previsão de agravamento: {risco.previsao_agravamento}
              </span>
            </div>
          )}

          {risco.created_date && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              {format(new Date(risco.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          )}

          {registrosRelacionados.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-slate-700 mb-2">
                Registros relacionados ({registrosRelacionados.length})
              </p>
              <div className="space-y-1">
                {registrosRelacionados.slice(0, 3).map(registro => (
                  <Link 
                    key={registro.id}
                    to={createPageUrl(`VerRegistro?id=${registro.id}`)}
                    className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {registro.titulo}
                  </Link>
                ))}
                {registrosRelacionados.length > 3 && (
                  <p className="text-xs text-slate-400 pl-5">
                    +{registrosRelacionados.length - 3} mais
                  </p>
                )}
              </div>
            </div>
          )}

          {risco.acoes_preventivas && risco.acoes_preventivas.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-slate-700 mb-1">Ações preventivas:</p>
              <ul className="space-y-1">
                {risco.acoes_preventivas.slice(0, 2).map((acao, idx) => (
                  <li key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                    <span className="text-emerald-600">•</span>
                    {acao}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Carregando riscos sociais...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{totalCriticos}</p>
            <p className="text-sm text-slate-500 mt-1">Riscos Críticos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{totalAltos}</p>
            <p className="text-sm text-slate-500 mt-1">Riscos Altos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{riscosMonitorando.length}</p>
            <p className="text-sm text-slate-500 mt-1">Em Monitoramento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{riscosResolvidos.length}</p>
            <p className="text-sm text-slate-500 mt-1">Riscos Resolvidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Riscos Ativos */}
      {riscosAtivos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Riscos Ativos ({riscosAtivos.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riscosAtivos.map(risco => (
              <RiscoCard key={risco.id} risco={risco} />
            ))}
          </div>
        </div>
      )}

      {/* Riscos em Monitoramento */}
      {riscosMonitorando.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            Em Monitoramento ({riscosMonitorando.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riscosMonitorando.map(risco => (
              <RiscoCard key={risco.id} risco={risco} />
            ))}
          </div>
        </div>
      )}

      {/* Riscos Resolvidos */}
      {riscosResolvidos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            Riscos Resolvidos ({riscosResolvidos.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riscosResolvidos.map(risco => (
              <RiscoCard key={risco.id} risco={risco} />
            ))}
          </div>
        </div>
      )}

      {riscos.length === 0 && (
        <Card className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Nenhum risco social registrado
          </h3>
          <p className="text-slate-500">
            Os riscos são detectados automaticamente a partir dos registros de campo
          </p>
        </Card>
      )}
    </div>
  );
}