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
  X
} from 'lucide-react';
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
  const [selectedComunidade, setSelectedComunidade] = useState(null);
  const [mapCenter, setMapCenter] = useState([-14.235, -51.9253]); // Brazil center
  const [mapZoom, setMapZoom] = useState(4);

  const { data: comunidades = [], isLoading: loadingComunidades } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros'],
    queryFn: () => base44.entities.Registro.list('-created_date', 100)
  });

  const { data: temas = [] } = useQuery({
    queryKey: ['temas'],
    queryFn: () => base44.entities.Tema.list()
  });

  const filteredComunidades = comunidades.filter(c => {
    const matchSearch = !search || 
      c.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.municipio?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Mapa Territorial</h2>
        <p className="text-slate-500 mt-1">Visualize registros e comunidades no território</p>
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
            <Select value={filterTema} onValueChange={setFilterTema}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Filtrar por tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os temas</SelectItem>
                {temas.map(t => (
                  <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Legend */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-slate-900 mb-3">Legenda</h3>
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
              
              {comunidadesWithLocation.map(comunidade => {
                const regs = getRegistrosByComunidade(comunidade.nome);
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
                          
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <FileText className="w-4 h-4" />
                              <span>{regs.length} registros</span>
                            </div>
                            {comunidade.populacao_estimada && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
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
            </MapContainer>
          </Card>

          {/* Selected Community Details */}
          {selectedComunidade && (
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