import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import { Target, Navigation, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from 'sonner';
import { CamadaRegistros, CamadaStakeholders, CamadaRiscos, CamadaComunidades } from '@/components/mapa/CamadasInterativas';
import ControlesCamadas from '@/components/mapa/ControlesCamadas';
import FiltrosGeograficos from '@/components/mapa/FiltrosGeograficos';
import CriadorRegistroMapa from '@/components/mapa/CriadorRegistroMapa';
import DetectorRiscos from '@/components/mapa/DetectorRiscos';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

function MapClickHandler({ onMapClick, modoGeolocalizacao }) {
  useMapEvents({
    click(e) {
      if (modoGeolocalizacao) {
        onMapClick(e.latlng);
      }
    }
  });
  return null;
}

export default function Mapa() {
  const [mapCenter, setMapCenter] = useState([-14.235, -51.9253]);
  const [mapZoom, setMapZoom] = useState(4);
  const [modoGeolocalizacao, setModoGeolocalizacao] = useState(false);
  const [coordenadasSelecionadas, setCoordenadasSelecionadas] = useState(null);
  const [showCriadorDialog, setShowCriadorDialog] = useState(false);
  
  const [camadas, setCamadas] = useState({
    registros: true,
    stakeholders: true,
    riscos: true,
    comunidades: true
  });

  const [filtros, setFiltros] = useState({
    busca: '',
    comunidade: 'todas',
    temperatura: 'todas',
    periodo: '30',
    tipo: 'todos'
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-mapa'],
    queryFn: () => base44.entities.Registro.list('-data_registro', 500)
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders-mapa'],
    queryFn: async () => {
      const liderancas = await base44.entities.LiderancaComunitaria.list();
      const organizacoes = await base44.entities.ProjetoOrganizacao.list();
      return [...liderancas, ...organizacoes];
    }
  });

  const { data: riscos = [] } = useQuery({
    queryKey: ['riscos-mapa'],
    queryFn: () => base44.entities.RiscoSocial.list()
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades-mapa'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  // Aplicar filtros
  const registrosFiltrados = registros.filter(r => {
    if (!r.localizacao?.lat || !r.localizacao?.lng) return false;
    
    const matchBusca = !filtros.busca || 
      r.titulo?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      r.local?.toLowerCase().includes(filtros.busca.toLowerCase());
    
    const matchComunidade = filtros.comunidade === 'todas' || r.comunidade === filtros.comunidade;
    const matchTemperatura = filtros.temperatura === 'todas' || r.temperatura_territorio === filtros.temperatura;
    const matchTipo = filtros.tipo === 'todos' || r.tipo === filtros.tipo;
    
    let matchPeriodo = true;
    if (filtros.periodo !== 'all') {
      const dias = parseInt(filtros.periodo);
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - dias);
      const dataRegistro = new Date(r.data_registro || r.created_date);
      matchPeriodo = dataRegistro >= dataLimite;
    }
    
    return matchBusca && matchComunidade && matchTemperatura && matchTipo && matchPeriodo;
  });

  const stakeholdersFiltrados = stakeholders.filter(s => {
    if (!filtros.busca) return true;
    return s.nome?.toLowerCase().includes(filtros.busca.toLowerCase());
  });

  const riscosFiltrados = riscos.filter(r => {
    const matchComunidade = filtros.comunidade === 'todas' || r.comunidade === filtros.comunidade;
    return matchComunidade && r.status === 'ativo';
  });

  const toggleCamada = (camadaId) => {
    setCamadas(prev => ({ ...prev, [camadaId]: !prev[camadaId] }));
  };

  const limparFiltros = () => {
    setFiltros({
      busca: '',
      comunidade: 'todas',
      temperatura: 'todas',
      periodo: '30',
      tipo: 'todos'
    });
  };

  const obterLocalizacaoAtual = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setMapZoom(13);
          toast.success('Localização obtida!');
        },
        (error) => {
          toast.error('Erro ao obter localização');
        }
      );
    } else {
      toast.error('Geolocalização não disponível');
    }
  };

  const handleMapClick = (latlng) => {
    setCoordenadasSelecionadas(latlng);
    setShowCriadorDialog(true);
    toast.info('Ponto selecionado! Preencha os dados.');
  };

  const contadores = {
    registros: registrosFiltrados.length,
    stakeholders: stakeholdersFiltrados.filter(s => s.localizacao?.lat).length,
    riscos: riscosFiltrados.filter(r => r.localizacao?.lat).length,
    comunidades: comunidades.filter(c => c.localizacao?.lat).length
  };

  return (
    <div className="space-y-6">
      <DetectorRiscos />
      
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Mapa Territorial Inteligente</h2>
        <p className="text-slate-500 mt-1">Visualize camadas de dados interativas com geolocalização</p>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3">
        <Button
          onClick={obterLocalizacaoAtual}
          variant="outline"
          className="gap-2"
        >
          <Navigation className="w-4 h-4" />
          Minha Localização
        </Button>
        
        <Button
          onClick={() => setModoGeolocalizacao(!modoGeolocalizacao)}
          className={modoGeolocalizacao ? 'bg-[#E31E24] hover:bg-[#B01419]' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}
        >
          <Target className="w-4 h-4 mr-2" />
          {modoGeolocalizacao ? 'Modo Criação Ativo' : 'Criar Registro no Mapa'}
        </Button>
      </div>

      {modoGeolocalizacao && (
        <Card className="p-4 bg-blue-50 border-2 border-blue-500">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <Target className="w-4 h-4" />
            <strong>Modo Geolocalização Ativo:</strong> Clique em qualquer ponto do mapa para criar um novo registro
          </p>
        </Card>
      )}

      <div className="relative">
        <Card className="overflow-hidden h-[700px]">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full"
            style={{ height: '100%', width: '100%' }}
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            <MapClickHandler 
              onMapClick={handleMapClick} 
              modoGeolocalizacao={modoGeolocalizacao} 
            />
            
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <CamadaRegistros registros={registrosFiltrados} visivel={camadas.registros} />
            <CamadaStakeholders stakeholders={stakeholdersFiltrados} visivel={camadas.stakeholders} />
            <CamadaRiscos riscos={riscosFiltrados} visivel={camadas.riscos} />
            <CamadaComunidades comunidades={comunidades} visivel={camadas.comunidades} />
          </MapContainer>

          <ControlesCamadas 
            camadas={camadas} 
            onToggleCamada={toggleCamada}
            contadores={contadores}
          />
          
          <FiltrosGeograficos 
            filtros={filtros}
            onFiltrosChange={setFiltros}
            comunidades={comunidades}
            onLimparFiltros={limparFiltros}
          />
        </Card>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Card className="p-4">
            <p className="text-xs text-slate-500">Total Registros</p>
            <p className="text-2xl font-bold text-[#E31E24]">{registrosFiltrados.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500">Stakeholders</p>
            <p className="text-2xl font-bold text-purple-600">{stakeholdersFiltrados.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500">Riscos Ativos</p>
            <p className="text-2xl font-bold text-red-600">{riscosFiltrados.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500">Comunidades</p>
            <p className="text-2xl font-bold text-emerald-600">{comunidades.length}</p>
          </Card>
        </div>
      </div>

      <CriadorRegistroMapa
        open={showCriadorDialog}
        onClose={() => {
          setShowCriadorDialog(false);
          setModoGeolocalizacao(false);
          setCoordenadasSelecionadas(null);
        }}
        coordenadas={coordenadasSelecionadas}
        comunidades={comunidades}
      />
    </div>
  );
}