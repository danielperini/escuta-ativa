import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { 
  Search, 
  Filter, 
  MapPin, 
  AlertTriangle,
  Users,
  FileText,
  Layers,
  X,
  Lightbulb
} from 'lucide-react';
import DetectorRiscos from '../components/mapa/DetectorRiscos';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const termometroColors = {
  baixo: '#22c55e',
  medio: '#f59e0b',
  alto: '#f97316',
  critico: '#ef4444'
};

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function Mapa() {
  const [search, setSearch] = useState('');
  const [filterTema, setFilterTema] = useState('todos');
  const [filterRisco, setFilterRisco] = useState('todos');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [camadasVisiveis, setCamadasVisiveis] = useState({
    comunidades: true,
    riscos: true,
    oportunidades: true,
    registros: true
  });
  const [selectedComunidade, setSelectedComunidade] = useState(null);
  const [selectedRegistro, setSelectedRegistro] = useState(null);
  const [mapCenter, setMapCenter] = useState([-14.235, -51.9253]); // Brazil center
  const [mapZoom, setMapZoom] = useState(4);

  const { data: comunidades = [], isLoading: loadingComunidades } = useQuery({
    queryKey: ['comunidades-mapa'],
    queryFn: () => base44.entities.Comunidade.list('-created_date', 100),
    staleTime: 5 * 60 * 1000
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-mapa'],
    queryFn: () => base44.entities.Registro.list('-created_date', 200),
    staleTime: 30 * 1000,
    refetchInterval: 2 * 60 * 1000
  });

  const { data: temas = [] } = useQuery({
    queryKey: ['temas-mapa'],
    queryFn: () => base44.entities.Tema.list('-mencoes_total', 50),
    staleTime: 5 * 60 * 1000
  });

  const { data: riscos = [] } = useQuery({
    queryKey: ['riscos-mapa'],
    queryFn: () => base44.entities.RiscoSocial.list('-created_date', 100),
    staleTime: 30 * 1000,
    refetchInterval: 2 * 60 * 1000
  });

  const { data: oportunidades = [] } = useQuery({
    queryKey: ['oportunidades-mapa'],
    queryFn: () => base44.entities.Oportunidade.list('-created_date', 50),
    staleTime: 2 * 60 * 1000
  });

  const filteredComunidades = comunidades.filter(c => {
    const matchSearch = !search || 
      c.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.municipio?.toLowerCase().includes(search.toLowerCase());
    
    const matchRisco = filterRisco === 'todos' || c.termometro_social === filterRisco;
    
    return matchSearch && matchRisco;
  });

  const filteredRegistros = registros.filter(r => {
    const matchData = (!filterDataInicio || r.data_registro >= filterDataInicio) &&
                      (!filterDataFim || r.data_registro <= filterDataFim);
    
    const matchRisco = filterRisco === 'todos' || r.temperatura_territorio === filterRisco;
    
    return matchData && matchRisco && r.localizacao?.lat && r.localizacao?.lng;
  });

  const comunidadesWithLocation = filteredComunidades.filter(c => 
    c.localizacao?.lat && c.localizacao?.lng
  );

  const getRegistrosByComunidade = (comunidadeNome) => {
    return registros.filter(r => r.comunidade === comunidadeNome);
  };

  const handleComunidadeClick = (comunidade) => {
    setSelectedComunidade(comunidade);
    if (comunidade.localizacao?.lat && comunidade.localizacao?.lng) {
      setMapCenter([comunidade.localizacao.lat, comunidade.localizacao.lng]);
      setMapZoom(12);
    }
  };

  const getRiscoPorComunidade = (comunidadeNome) => {
    return riscos.filter(r => r.comunidade === comunidadeNome && r.status === "ativo");
  };

  const getOportunidadesPorComunidade = (comunidadeNome) => {
    return oportunidades.filter(o => o.comunidade === comunidadeNome);
  };

  return (
    <div className="space-y-6">
      <DetectorRiscos />
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Mapa Territorial Inteligente</h2>
        <p className="text-slate-500 mt-1">Visualize comunidades, riscos e oportunidades com análise IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Filters */}
          <Card className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar comunidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRisco} onValueChange={setFilterRisco}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Nível de risco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os níveis</SelectItem>
                <SelectItem value="baixo">Baixo</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
                <SelectItem value="critico">Crítico</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="space-y-2">
              <label className="text-xs text-slate-600">Período</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={filterDataInicio}
                  onChange={(e) => setFilterDataInicio(e.target.value)}
                  className="text-xs"
                  placeholder="Data inicial"
                />
                <Input
                  type="date"
                  value={filterDataFim}
                  onChange={(e) => setFilterDataFim(e.target.value)}
                  className="text-xs"
                  placeholder="Data final"
                />
              </div>
            </div>
          </Card>

          {/* Camadas */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-slate-900 mb-3">Camadas do Mapa</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={camadasVisiveis.comunidades}
                  onChange={() => setCamadasVisiveis({...camadasVisiveis, comunidades: !camadasVisiveis.comunidades})}
                  className="rounded"
                />
                <span className="text-sm">Comunidades</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={camadasVisiveis.riscos}
                  onChange={() => setCamadasVisiveis({...camadasVisiveis, riscos: !camadasVisiveis.riscos})}
                  className="rounded"
                />
                <span className="text-sm">Riscos Sociais</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={camadasVisiveis.oportunidades}
                  onChange={() => setCamadasVisiveis({...camadasVisiveis, oportunidades: !camadasVisiveis.oportunidades})}
                  className="rounded"
                />
                <span className="text-sm">Oportunidades</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={camadasVisiveis.registros}
                  onChange={() => setCamadasVisiveis({...camadasVisiveis, registros: !camadasVisiveis.registros})}
                  className="rounded"
                />
                <span className="text-sm">Registros Individuais</span>
              </label>
            </div>
          </Card>

          {/* Legend */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-slate-900 mb-3">Legenda - Termômetro Social</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Baixo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-600">Médio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-slate-600">Alto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-600">Crítico</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-xs font-medium">Risco Social</span>
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium">Oportunidade</span>
              </div>
            </div>
          </Card>

          {/* Communities List */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-slate-900 mb-3">
              Comunidades ({filteredComunidades.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loadingComunidades ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))
              ) : filteredComunidades.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Nenhuma comunidade encontrada</p>
              ) : (
                filteredComunidades.map(comunidade => (
                  <div
                    key={comunidade.id}
                    onClick={() => handleComunidadeClick(comunidade)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                      selectedComunidade?.id === comunidade.id 
                        ? "bg-[#40916C]/10 border border-[#40916C]" 
                        : "bg-slate-50 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{comunidade.nome}</span>
                    </div>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: termometroColors[comunidade.termometro_social] || termometroColors.baixo }}
                    />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden h-[600px]">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              className="h-full w-full"
              style={{ height: '100%', width: '100%' }}
            >
              <MapController center={mapCenter} zoom={mapZoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {camadasVisiveis.comunidades && comunidadesWithLocation.map(comunidade => {
                const regs = getRegistrosByComunidade(comunidade.nome);
                const riscosLocal = getRiscoPorComunidade(comunidade.nome);
                const oportunidadesLocal = getOportunidadesPorComunidade(comunidade.nome);
                const color = termometroColors[comunidade.termometro_social] || termometroColors.baixo;
                
                return (
                  <React.Fragment key={comunidade.id}>
                    <Circle
                      center={[comunidade.localizacao.lat, comunidade.localizacao.lng]}
                      radius={5000}
                      pathOptions={{
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.3
                      }}
                    />
                    <Marker 
                      position={[comunidade.localizacao.lat, comunidade.localizacao.lng]}
                      eventHandlers={{
                        click: () => setSelectedComunidade(comunidade)
                      }}
                    >
                      <Popup>
                        <div className="p-2 min-w-48">
                          <h3 className="font-semibold text-slate-900">{comunidade.nome}</h3>
                          <p className="text-sm text-slate-500">{comunidade.municipio}, {comunidade.estado}</p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant="secondary"
                              style={{ 
                                backgroundColor: `${color}20`,
                                color: color
                              }}
                            >
                              {comunidade.termometro_social || 'baixo'}
                            </Badge>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <FileText className="w-4 h-4" />
                              <span>{regs.length} registros</span>
                            </div>
                            {riscosLocal.length > 0 && (
                              <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertTriangle className="w-4 h-4" />
                                <span>{riscosLocal.length} risco(s) ativo(s)</span>
                              </div>
                            )}
                            {oportunidadesLocal.length > 0 && (
                              <div className="flex items-center gap-2 text-sm text-blue-600">
                                <Lightbulb className="w-4 h-4" />
                                <span>{oportunidadesLocal.length} oportunidade(s)</span>
                              </div>
                            )}
                            {comunidade.populacao_estimada && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Users className="w-4 h-4" />
                                <span>{comunidade.populacao_estimada.toLocaleString()} habitantes</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}

              {/* Registros Individuais */}
              {camadasVisiveis.registros && filteredRegistros.map(registro => {
                const color = termometroColors[registro.temperatura_territorio] || termometroColors.baixo;
                const riscoColor = registro.temperatura_territorio === 'critico' ? '#ef4444' : 
                                   registro.temperatura_territorio === 'alto' ? '#f97316' :
                                   registro.temperatura_territorio === 'medio' ? '#f59e0b' : '#22c55e';
                
                return (
                  <Marker 
                    key={registro.id}
                    position={[registro.localizacao.lat, registro.localizacao.lng]}
                    icon={L.divIcon({
                      className: 'custom-marker',
                      html: `<div style="background-color: ${riscoColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                      iconSize: [12, 12],
                      iconAnchor: [6, 6]
                    })}
                    eventHandlers={{
                      click: () => setSelectedRegistro(registro)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-64">
                        <h3 className="font-semibold text-slate-900">{registro.titulo}</h3>
                        <p className="text-xs text-slate-500 mt-1">{new Date(registro.created_date).toLocaleDateString('pt-BR')}</p>
                        
                        <div className="mt-2 space-y-1">
                          <Badge 
                            variant="secondary"
                            style={{ 
                              backgroundColor: `${color}20`,
                              color: color
                            }}
                          >
                            {registro.temperatura_territorio || 'baixo'}
                          </Badge>
                          
                          {registro.temas_identificados?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-slate-500">Temas:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {registro.temas_identificados.slice(0, 3).map((t, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {registro.demandas?.length > 0 && (
                            <p className="text-xs text-slate-600 mt-2">
                              {registro.demandas.length} demanda(s) registrada(s)
                            </p>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Riscos Sociais */}
              {camadasVisiveis.riscos && riscos.filter(r => r.status === 'ativo' && r.geolocalizacao).map(risco => {
                const coords = risco.geolocalizacao.split(',').map(c => parseFloat(c.trim()));
                if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return null;
                
                const riskColor = risco.nivel === 'critico' ? '#dc2626' :
                                 risco.nivel === 'alto' ? '#ea580c' :
                                 risco.nivel === 'moderado' ? '#f59e0b' : '#3b82f6';
                
                return (
                  <React.Fragment key={risco.id}>
                    <Circle
                      center={[coords[0], coords[1]]}
                      radius={1000}
                      pathOptions={{
                        color: riskColor,
                        fillColor: riskColor,
                        fillOpacity: 0.2,
                        weight: 2,
                        dashArray: '5, 5'
                      }}
                    />
                    <Marker 
                      position={[coords[0], coords[1]]}
                      icon={L.divIcon({
                        className: 'custom-marker-risk',
                        html: `<div style="background-color: ${riskColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2L1 21h22L12 2zm0 4l8.5 15h-17L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
                          </svg>
                        </div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                      })}
                    >
                      <Popup>
                        <div className="p-2 min-w-64">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5" style={{ color: riskColor }} />
                            <h3 className="font-semibold text-slate-900">{risco.titulo}</h3>
                          </div>
                          <Badge 
                            style={{ 
                              backgroundColor: `${riskColor}20`,
                              color: riskColor
                            }}
                          >
                            {risco.nivel.toUpperCase()}
                          </Badge>
                          <p className="text-sm text-slate-700 mt-2">{risco.descricao}</p>
                          
                          {risco.causas?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-slate-600">Causas:</p>
                              <ul className="text-xs text-slate-600 list-disc list-inside">
                                {risco.causas.slice(0, 2).map((c, i) => (
                                  <li key={i}>{c}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {risco.acoes_preventivas?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-emerald-700">Ações Preventivas:</p>
                              <ul className="text-xs text-emerald-700 list-disc list-inside">
                                {risco.acoes_preventivas.slice(0, 2).map((a, i) => (
                                  <li key={i}>{a}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </Card>

          {/* Selected Registro Details */}
          {selectedRegistro && (
            <Card className="mt-4 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">{selectedRegistro.titulo}</h3>
                  <p className="text-slate-500 text-sm">{selectedRegistro.comunidade}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedRegistro(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Data</p>
                  <p className="font-semibold text-sm">
                    {new Date(selectedRegistro.created_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Temperatura</p>
                  <p className="font-semibold capitalize text-sm" style={{ color: termometroColors[selectedRegistro.temperatura_territorio] }}>
                    {selectedRegistro.temperatura_territorio || 'Baixo'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Tipo</p>
                  <p className="font-semibold text-sm capitalize">
                    {selectedRegistro.tipo?.replace('_', ' ') || '-'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Sentimento</p>
                  <p className="font-semibold text-sm capitalize">
                    {selectedRegistro.sentimento || '-'}
                  </p>
                </div>
              </div>

              {selectedRegistro.temas_identificados?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-slate-500 mb-2">Temas Identificados</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRegistro.temas_identificados.map((tema, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-emerald-100 text-emerald-700">
                        {tema}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedRegistro.demandas?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Demandas ({selectedRegistro.demandas.length})</p>
                  <div className="space-y-2">
                    {selectedRegistro.demandas.slice(0, 2).map((d, idx) => (
                      <div key={idx} className="text-xs bg-amber-50 p-2 rounded border border-amber-200">
                        {d.descricao}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Selected Community Details */}
          {selectedComunidade && !selectedRegistro && (
            <Card className="mt-4 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">{selectedComunidade.nome}</h3>
                  <p className="text-slate-500">{selectedComunidade.municipio}, {selectedComunidade.estado}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedComunidade(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Termômetro</p>
                  <p className="font-semibold capitalize" style={{ color: termometroColors[selectedComunidade.termometro_social] }}>
                    {selectedComunidade.termometro_social || 'Baixo'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Registros</p>
                  <p className="font-semibold text-slate-900">
                    {getRegistrosByComunidade(selectedComunidade.nome).length}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Tipo</p>
                  <p className="font-semibold text-slate-900 capitalize">
                    {selectedComunidade.tipo?.replace('_', ' ') || '-'}
                  </p>
                </div>
                {selectedComunidade.populacao_estimada && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500">População</p>
                    <p className="font-semibold text-slate-900">
                      {selectedComunidade.populacao_estimada.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedComunidade.principais_temas?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-slate-500 mb-2">Principais Temas</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedComunidade.principais_temas.map((tema, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-emerald-100 text-emerald-700">
                        {tema}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}