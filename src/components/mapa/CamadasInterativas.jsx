import React from 'react';
import { LayerGroup, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AlertTriangle, Users, FileText, MapPin, Eye } from 'lucide-react';

const CORES_TEMPERATURA = {
  baixo: '#10B981',
  medio: '#F59E0B',
  alto: '#F97316',
  critico: '#EF4444'
};

const CORES_RISCO = {
  baixo: '#3B82F6',
  medio: '#F59E0B',
  alto: '#F97316',
  critico: '#EF4444'
};

export function CamadaRegistros({ registros, visivel }) {
  if (!visivel) return null;

  return (
    <LayerGroup>
      {registros
        .filter(r => r.localizacao?.lat && r.localizacao?.lng)
        .map(registro => (
          <CircleMarker
            key={registro.id}
            center={[registro.localizacao.lat, registro.localizacao.lng]}
            radius={8}
            fillColor={CORES_TEMPERATURA[registro.temperatura_territorio] || '#6B7280'}
            color="#fff"
            weight={2}
            opacity={1}
            fillOpacity={0.8}
          >
            <Popup>
              <div className="p-2 min-w-[250px]">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{registro.titulo}</h3>
                  <Badge 
                    className="ml-2"
                    style={{ backgroundColor: CORES_TEMPERATURA[registro.temperatura_territorio] }}
                  >
                    {registro.temperatura_territorio}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-slate-600 mb-3">
                  <p><MapPin className="w-3 h-3 inline mr-1" />{registro.comunidade || registro.local}</p>
                  <p><FileText className="w-3 h-3 inline mr-1" />{registro.tipo}</p>
                  {registro.data_registro && (
                    <p>📅 {new Date(registro.data_registro).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
                <Link to={createPageUrl('VerRegistro') + `?id=${registro.id}`}>
                  <Button size="sm" className="w-full bg-[#E31E24] hover:bg-[#B01419]">
                    <Eye className="w-3 h-3 mr-1" />
                    Ver Detalhes
                  </Button>
                </Link>
              </div>
            </Popup>
            <Tooltip>{registro.titulo}</Tooltip>
          </CircleMarker>
        ))}
    </LayerGroup>
  );
}

export function CamadaStakeholders({ stakeholders, visivel }) {
  if (!visivel) return null;

  return (
    <LayerGroup>
      {stakeholders
        .filter(s => s.localizacao?.lat && s.localizacao?.lng)
        .map(stakeholder => (
          <CircleMarker
            key={stakeholder.id}
            center={[stakeholder.localizacao.lat, stakeholder.localizacao.lng]}
            radius={10}
            fillColor="#8B5CF6"
            color="#fff"
            weight={2}
            opacity={1}
            fillOpacity={0.9}
          >
            <Popup>
              <div className="p-2 min-w-[250px]">
                <h3 className="font-semibold text-sm mb-2">{stakeholder.nome}</h3>
                <div className="space-y-1 text-xs text-slate-600 mb-3">
                  <p><Badge variant="outline">{stakeholder.tipo}</Badge></p>
                  <p><MapPin className="w-3 h-3 inline mr-1" />{stakeholder.comunidade}</p>
                  {stakeholder.cargo && <p>🎯 {stakeholder.cargo}</p>}
                  {stakeholder.nivel_influencia && (
                    <p>📊 Influência: {stakeholder.nivel_influencia}</p>
                  )}
                </div>
                <Link to={createPageUrl('PerfilStakeholder') + `?id=${stakeholder.id}`}>
                  <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                    <Users className="w-3 h-3 mr-1" />
                    Ver Perfil
                  </Button>
                </Link>
              </div>
            </Popup>
            <Tooltip>{stakeholder.nome}</Tooltip>
          </CircleMarker>
        ))}
    </LayerGroup>
  );
}

export function CamadaRiscos({ riscos, visivel }) {
  if (!visivel) return null;

  return (
    <LayerGroup>
      {riscos
        .filter(r => r.localizacao?.lat && r.localizacao?.lng)
        .map(risco => (
          <CircleMarker
            key={risco.id}
            center={[risco.localizacao.lat, risco.localizacao.lng]}
            radius={12}
            fillColor={CORES_RISCO[risco.nivel_gravidade] || '#EF4444'}
            color="#fff"
            weight={2}
            opacity={1}
            fillOpacity={0.7}
            className="animate-pulse"
          >
            <Popup>
              <div className="p-2 min-w-[250px]">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <h3 className="font-semibold text-sm">{risco.tipo_risco || 'Risco Social'}</h3>
                </div>
                <p className="text-xs text-slate-700 mb-2">{risco.descricao?.substring(0, 150)}</p>
                <div className="space-y-1 text-xs">
                  <Badge className="bg-red-100 text-red-700">{risco.nivel_gravidade}</Badge>
                  {risco.comunidade && <p><MapPin className="w-3 h-3 inline mr-1" />{risco.comunidade}</p>}
                  {risco.status && <p>Status: {risco.status}</p>}
                </div>
              </div>
            </Popup>
            <Tooltip>⚠️ {risco.tipo_risco}</Tooltip>
          </CircleMarker>
        ))}
    </LayerGroup>
  );
}

export function CamadaComunidades({ comunidades, visivel }) {
  if (!visivel) return null;

  return (
    <LayerGroup>
      {comunidades
        .filter(c => c.localizacao?.lat && c.localizacao?.lng)
        .map(comunidade => (
          <CircleMarker
            key={comunidade.id}
            center={[comunidade.localizacao.lat, comunidade.localizacao.lng]}
            radius={15}
            fillColor={CORES_TEMPERATURA[comunidade.termometro_social] || '#3B82F6'}
            color="#fff"
            weight={3}
            opacity={1}
            fillOpacity={0.4}
          >
            <Popup>
              <div className="p-2 min-w-[250px]">
                <h3 className="font-semibold text-sm mb-2">{comunidade.nome}</h3>
                <div className="space-y-1 text-xs text-slate-600 mb-3">
                  <p><Badge variant="outline">{comunidade.tipo}</Badge></p>
                  <p>📍 {comunidade.municipio} - {comunidade.estado}</p>
                  {comunidade.populacao_estimada && (
                    <p>👥 População: {comunidade.populacao_estimada}</p>
                  )}
                  {comunidade.termometro_social && (
                    <Badge style={{ backgroundColor: CORES_TEMPERATURA[comunidade.termometro_social] }}>
                      Temperatura: {comunidade.termometro_social}
                    </Badge>
                  )}
                </div>
                <Link to={createPageUrl('DetalhesComunidade') + `?id=${comunidade.id}`}>
                  <Button size="sm" className="w-full bg-[#E31E24] hover:bg-[#B01419]">
                    Ver Comunidade
                  </Button>
                </Link>
              </div>
            </Popup>
            <Tooltip>{comunidade.nome}</Tooltip>
          </CircleMarker>
        ))}
    </LayerGroup>
  );
}