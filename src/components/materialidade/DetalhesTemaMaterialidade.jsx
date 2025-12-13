import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, FileText, BarChart3 } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function DetalhesTemaMaterialidade({ tema }) {
  const { data: registros = [], isLoading: loadingRegistros } = useQuery({
    queryKey: ['registros-tema', tema.nome],
    queryFn: async () => {
      const allRegistros = await base44.entities.Registro.list('-created_date', 500);
      return allRegistros.filter(r => 
        r.temas_identificados?.some(t => 
          t.toLowerCase().includes(tema.nome.toLowerCase()) || 
          tema.nome.toLowerCase().includes(t.toLowerCase())
        )
      );
    },
    enabled: !!tema
  });

  // Agrupar por comunidade
  const porComunidade = registros.reduce((acc, r) => {
    const com = r.comunidade || 'Não especificada';
    acc[com] = (acc[com] || 0) + 1;
    return acc;
  }, {});

  const comunidadesOrdenadas = Object.entries(porComunidade)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Agrupar por município
  const porMunicipio = registros.reduce((acc, r) => {
    if (r.localizacao?.endereco) {
      const parts = r.localizacao.endereco.split(',');
      const municipio = parts[parts.length - 2]?.trim() || 'Não especificado';
      acc[municipio] = (acc[municipio] || 0) + 1;
    }
    return acc;
  }, {});

  const municipiosOrdenados = Object.entries(porMunicipio)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (loadingRegistros) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-900 font-medium mb-2">
          <BarChart3 className="w-5 h-5" />
          Resumo de Análise
        </div>
        <div className="text-sm text-blue-700">
          Este tema foi identificado em <strong>{registros.length} registro(s)</strong>,
          abrangendo <strong>{Object.keys(porComunidade).length} comunidade(s)</strong>
          {Object.keys(porMunicipio).length > 0 && (
            <> em <strong>{Object.keys(porMunicipio).length} município(s)</strong></>
          )}.
        </div>
      </div>

      {/* Comunidades */}
      {comunidadesOrdenadas.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
            <MapPin className="w-4 h-4" />
            Comunidades com mais menções
          </div>
          <div className="space-y-2">
            {comunidadesOrdenadas.map(([comunidade, count]) => (
              <div key={comunidade} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">{comunidade}</span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  {count} menção{count !== 1 && 'ões'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Municípios */}
      {municipiosOrdenados.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
            <MapPin className="w-4 h-4" />
            Municípios com mais ocorrências
          </div>
          <div className="space-y-2">
            {municipiosOrdenados.map(([municipio, count]) => (
              <div key={municipio} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">{municipio}</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {count} ocorrência{count !== 1 && 's'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registros recentes */}
      {registros.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
            <FileText className="w-4 h-4" />
            Registros recentes ({Math.min(5, registros.length)})
          </div>
          <div className="space-y-2">
            {registros.slice(0, 5).map(registro => (
              <div key={registro.id} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="text-sm font-medium text-slate-900">{registro.titulo}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>{registro.comunidade}</span>
                  {registro.data_registro && (
                    <span>{new Date(registro.data_registro).toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {registros.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p>Nenhum registro encontrado para este tema</p>
        </div>
      )}
    </div>
  );
}