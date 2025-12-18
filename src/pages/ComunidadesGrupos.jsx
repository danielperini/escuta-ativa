import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Users,
  Music,
  Home,
  MoreVertical,
  X,
  Globe,
  Target,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

const TIPO_COMUNIDADE_CONFIG = {
  bairro: { label: 'Bairro', icon: Home, color: 'bg-blue-100 text-blue-700' },
  vila: { label: 'Vila', icon: Home, color: 'bg-green-100 text-green-700' },
  distrito: { label: 'Distrito', icon: MapPin, color: 'bg-purple-100 text-purple-700' },
  assentamento: { label: 'Assentamento', icon: Users, color: 'bg-amber-100 text-amber-700' },
  quilombo: { label: 'Quilombo', icon: Users, color: 'bg-red-100 text-red-700' },
  indigena: { label: 'Indígena', icon: Users, color: 'bg-orange-100 text-orange-700' },
  favela: { label: 'Favela', icon: Home, color: 'bg-cyan-100 text-cyan-700' },
  povoado: { label: 'Povoado', icon: Home, color: 'bg-lime-100 text-lime-700' },
  outro: { label: 'Outro', icon: MapPin, color: 'bg-slate-100 text-slate-700' }
};

const TIPO_GRUPO_CONFIG = {
  cultural: { label: 'Cultural', icon: Music, color: 'bg-pink-100 text-pink-700' },
  artistico: { label: 'Artístico', icon: Music, color: 'bg-purple-100 text-purple-700' },
  esportivo: { label: 'Esportivo', icon: Target, color: 'bg-blue-100 text-blue-700' },
  religioso: { label: 'Religioso', icon: Users, color: 'bg-amber-100 text-amber-700' },
  educacional: { label: 'Educacional', icon: Users, color: 'bg-green-100 text-green-700' },
  ambiental: { label: 'Ambiental', icon: Globe, color: 'bg-emerald-100 text-emerald-700' },
  profissional: { label: 'Profissional', icon: Users, color: 'bg-indigo-100 text-indigo-700' },
  outro: { label: 'Outro', icon: Users, color: 'bg-slate-100 text-slate-700' }
};

export default function ComunidadesGrupos() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('comunidades');
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroMunicipio, setFiltroMunicipio] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showCreateComunidade, setShowCreateComunidade] = useState(false);
  const [showCreateGrupo, setShowCreateGrupo] = useState(false);
  const [showEditComunidade, setShowEditComunidade] = useState(false);
  const [showEditGrupo, setShowEditGrupo] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [mostrarMapa, setMostrarMapa] = useState(true);

  const [formComunidade, setFormComunidade] = useState({
    nome: '',
    tipo: 'bairro',
    municipio: '',
    estado: '',
    populacao_estimada: '',
    localizacao: { lat: null, lng: null },
    notas: ''
  });

  const [formGrupo, setFormGrupo] = useState({
    nome: '',
    tipo: 'cultural',
    area_atuacao: '',
    descricao: '',
    comunidade_origem: '',
    municipio: '',
    estado: '',
    numero_membros: '',
    contato_principal: '',
    telefone: '',
    email: ''
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades-gestao'],
    queryFn: () => base44.entities.Comunidade.list('-created_date')
  });

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos-gestao'],
    queryFn: () => base44.entities.GrupoColetivo.list('-created_date')
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-comunidades'],
    queryFn: () => base44.entities.Registro.list('-created_date', 500)
  });

  const createComunidadeMutation = useMutation({
    mutationFn: (data) => base44.entities.Comunidade.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comunidades-gestao'] });
      setShowCreateComunidade(false);
      resetFormComunidade();
      toast.success('Comunidade criada!');
    }
  });

  const updateComunidadeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Comunidade.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comunidades-gestao'] });
      setShowEditComunidade(false);
      setEditingItem(null);
      toast.success('Comunidade atualizada!');
    }
  });

  const deleteComunidadeMutation = useMutation({
    mutationFn: (id) => base44.entities.Comunidade.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comunidades-gestao'] });
      toast.success('Comunidade removida!');
    }
  });

  const createGrupoMutation = useMutation({
    mutationFn: (data) => base44.entities.GrupoColetivo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos-gestao'] });
      setShowCreateGrupo(false);
      resetFormGrupo();
      toast.success('Grupo criado!');
    }
  });

  const updateGrupoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GrupoColetivo.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos-gestao'] });
      setShowEditGrupo(false);
      setEditingItem(null);
      toast.success('Grupo atualizado!');
    }
  });

  const deleteGrupoMutation = useMutation({
    mutationFn: (id) => base44.entities.GrupoColetivo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos-gestao'] });
      toast.success('Grupo removido!');
    }
  });

  const resetFormComunidade = () => {
    setFormComunidade({
      nome: '',
      tipo: 'bairro',
      municipio: '',
      estado: '',
      populacao_estimada: '',
      localizacao: { lat: null, lng: null },
      notas: ''
    });
  };

  const resetFormGrupo = () => {
    setFormGrupo({
      nome: '',
      tipo: 'cultural',
      area_atuacao: '',
      descricao: '',
      comunidade_origem: '',
      municipio: '',
      estado: '',
      numero_membros: '',
      contato_principal: '',
      telefone: '',
      email: ''
    });
  };

  const handleEditComunidade = (comunidade) => {
    setEditingItem(comunidade);
    setFormComunidade({
      nome: comunidade.nome || '',
      tipo: comunidade.tipo || 'bairro',
      municipio: comunidade.municipio || '',
      estado: comunidade.estado || '',
      populacao_estimada: comunidade.populacao_estimada || '',
      localizacao: comunidade.localizacao || { lat: null, lng: null },
      notas: comunidade.notas || ''
    });
    setShowEditComunidade(true);
  };

  const handleEditGrupo = (grupo) => {
    setEditingItem(grupo);
    setFormGrupo({
      nome: grupo.nome || '',
      tipo: grupo.tipo || 'cultural',
      area_atuacao: grupo.area_atuacao || '',
      descricao: grupo.descricao || '',
      comunidade_origem: grupo.comunidade_origem || '',
      municipio: grupo.municipio || '',
      estado: grupo.estado || '',
      numero_membros: grupo.numero_membros || '',
      contato_principal: grupo.contato_principal || '',
      telefone: grupo.telefone || '',
      email: grupo.email || ''
    });
    setShowEditGrupo(true);
  };

  const obterCoordenadasAutomaticas = async () => {
    if (!formComunidade.nome || !formComunidade.municipio) {
      toast.error('Preencha nome e município primeiro');
      return;
    }

    try {
      toast.info('Buscando localização...');
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: `Retorne as coordenadas geográficas (latitude e longitude) de: ${formComunidade.nome}, ${formComunidade.municipio}, ${formComunidade.estado || 'Brasil'}.
        
        Seja preciso e use fontes confiáveis.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            lat: { type: "number" },
            lng: { type: "number" },
            confianca: { type: "string" }
          }
        }
      });

      if (resultado.lat && resultado.lng) {
        setFormComunidade(prev => ({
          ...prev,
          localizacao: { lat: resultado.lat, lng: resultado.lng }
        }));
        toast.success('Localização encontrada!');
      } else {
        toast.error('Não foi possível obter coordenadas');
      }
    } catch (error) {
      toast.error('Erro ao buscar localização');
    }
  };

  // Atualizar contadores de registros nas comunidades
  React.useEffect(() => {
    if (registros.length > 0 && comunidades.length > 0) {
      const contagemPorComunidade = {};
      registros.forEach(r => {
        if (r.comunidade) {
          contagemPorComunidade[r.comunidade] = (contagemPorComunidade[r.comunidade] || 0) + 1;
        }
      });
      
      comunidades.forEach(c => {
        if (contagemPorComunidade[c.nome] && c.total_registros !== contagemPorComunidade[c.nome]) {
          base44.entities.Comunidade.update(c.id, { 
            total_registros: contagemPorComunidade[c.nome],
            ultima_interacao: new Date().toISOString()
          }).catch(() => {});
        }
      });
    }
  }, [registros.length, comunidades.length]);

  // Filtros
  const municipios = [...new Set([
    ...comunidades.map(c => c.municipio), 
    ...grupos.map(g => g.municipio),
    ...registros.map(r => r.localizacao?.municipio)
  ].filter(Boolean))].sort();
  
  const estados = [...new Set([
    ...comunidades.map(c => c.estado), 
    ...grupos.map(g => g.estado)
  ].filter(Boolean))].sort();

  const comunidadesFiltradas = comunidades
    .filter(c => {
      const matchSearch = !search || c.nome?.toLowerCase().includes(search.toLowerCase());
      const matchTipo = filtroTipo === 'todos' || c.tipo === filtroTipo;
      const matchMunicipio = filtroMunicipio === 'todos' || c.municipio === filtroMunicipio;
      const matchEstado = filtroEstado === 'todos' || c.estado === filtroEstado;
      return matchSearch && matchTipo && matchMunicipio && matchEstado;
    })
    .sort((a, b) => (b.total_registros || 0) - (a.total_registros || 0));

  const gruposFiltrados = grupos
    .filter(g => {
      const matchSearch = !search || g.nome?.toLowerCase().includes(search.toLowerCase()) || g.area_atuacao?.toLowerCase().includes(search.toLowerCase());
      const matchTipo = filtroTipo === 'todos' || g.tipo === filtroTipo;
      const matchMunicipio = filtroMunicipio === 'todos' || g.municipio === filtroMunicipio;
      const matchEstado = filtroEstado === 'todos' || g.estado === filtroEstado;
      return matchSearch && matchTipo && matchMunicipio && matchEstado;
    })
    .sort((a, b) => (b.numero_membros || 0) - (a.numero_membros || 0));

  const comunidadesComLocalizacao = comunidadesFiltradas.filter(c => c.localizacao?.lat && c.localizacao?.lng);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Comunidades e Grupos</h2>
          <p className="text-slate-500">Gestão de territórios e coletivos organizados</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroMunicipio} onValueChange={setFiltroMunicipio}>
            <SelectTrigger>
              <SelectValue placeholder="Município" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Municípios</SelectItem>
              {municipios.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Estados</SelectItem>
              {estados.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setSearch('');
              setFiltroTipo('todos');
              setFiltroMunicipio('todos');
              setFiltroEstado('todos');
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comunidades">
            <Home className="w-4 h-4 mr-2" />
            Comunidades Territoriais ({comunidadesFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="grupos">
            <Music className="w-4 h-4 mr-2" />
            Grupos e Coletivos ({gruposFiltrados.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB COMUNIDADES */}
        <TabsContent value="comunidades" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  {Object.entries(TIPO_COMUNIDADE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={mostrarMapa ? 'default' : 'outline'}
                onClick={() => setMostrarMapa(!mostrarMapa)}
                className={mostrarMapa ? 'bg-[#E31E24] hover:bg-[#B01419]' : ''}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Mapa
              </Button>
            </div>
            <Button onClick={() => setShowCreateComunidade(true)} className="bg-[#E31E24] hover:bg-[#B01419]">
              <Plus className="w-4 h-4 mr-2" />
              Nova Comunidade
            </Button>
          </div>

          {/* Mapa Interativo */}
          {mostrarMapa && comunidadesComLocalizacao.length > 0 && (
            <Card className="overflow-hidden shadow-lg">
              <CardContent className="p-0">
                <div style={{ height: '600px', width: '100%' }}>
                  <MapContainer
                    center={[comunidadesComLocalizacao[0].localizacao.lat, comunidadesComLocalizacao[0].localizacao.lng]}
                    zoom={6}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    {comunidadesComLocalizacao.map(comunidade => (
                      <Marker
                        key={comunidade.id}
                        position={[comunidade.localizacao.lat, comunidade.localizacao.lng]}
                      >
                        <Popup>
                          <div className="p-2 min-w-[200px]">
                            <p className="font-bold text-lg mb-1">{comunidade.nome}</p>
                            <p className="text-sm text-slate-600 mb-2">{comunidade.municipio} - {comunidade.estado}</p>
                            <Badge className={TIPO_COMUNIDADE_CONFIG[comunidade.tipo]?.color || 'bg-slate-100'}>
                              {TIPO_COMUNIDADE_CONFIG[comunidade.tipo]?.label}
                            </Badge>
                            {comunidade.populacao_estimada && (
                              <p className="text-xs text-slate-500 mt-2">
                                <Users className="w-3 h-3 inline mr-1" />
                                {comunidade.populacao_estimada.toLocaleString()} hab.
                              </p>
                            )}
                            {comunidade.total_registros > 0 && (
                              <p className="text-xs text-slate-500 mt-1">
                                <TrendingUp className="w-3 h-3 inline mr-1" />
                                {comunidade.total_registros} registros
                              </p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-xs text-blue-600 font-medium">Total Comunidades</p>
              <p className="text-2xl font-bold text-blue-700">{comunidadesFiltradas.length}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100">
              <p className="text-xs text-emerald-600 font-medium">Com Geolocalização</p>
              <p className="text-2xl font-bold text-emerald-700">{comunidadesComLocalizacao.length}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-xs text-purple-600 font-medium">Total Registros</p>
              <p className="text-2xl font-bold text-purple-700">
                {comunidadesFiltradas.reduce((acc, c) => acc + (c.total_registros || 0), 0)}
              </p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100">
              <p className="text-xs text-amber-600 font-medium">População Total</p>
              <p className="text-2xl font-bold text-amber-700">
                {comunidadesFiltradas.reduce((acc, c) => acc + (c.populacao_estimada || 0), 0).toLocaleString()}
              </p>
            </Card>
          </div>

          {/* Lista de Comunidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comunidadesFiltradas.map(comunidade => {
              const TipoIcon = TIPO_COMUNIDADE_CONFIG[comunidade.tipo]?.icon || MapPin;
              return (
                <Card key={comunidade.id} className="hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-lg ${TIPO_COMUNIDADE_CONFIG[comunidade.tipo]?.color.split(' ')[0] + '/20'} flex items-center justify-center`}>
                          <TipoIcon className="w-6 h-6" style={{ color: TIPO_COMUNIDADE_CONFIG[comunidade.tipo]?.color.includes('blue') ? '#3b82f6' : '#E31E24' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">{comunidade.nome}</h3>
                          <p className="text-xs text-slate-500">{comunidade.municipio} - {comunidade.estado}</p>
                          <Badge className={`text-xs mt-1 ${TIPO_COMUNIDADE_CONFIG[comunidade.tipo]?.color}`}>
                            {TIPO_COMUNIDADE_CONFIG[comunidade.tipo]?.label}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditComunidade(comunidade)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => deleteComunidadeMutation.mutate(comunidade.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2 text-sm">
                      {comunidade.populacao_estimada && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{comunidade.populacao_estimada.toLocaleString()} habitantes</span>
                        </div>
                      )}
                      {comunidade.total_registros > 0 && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{comunidade.total_registros} registro(s)</span>
                        </div>
                      )}
                      {comunidade.termometro_social && (
                        <Badge variant="outline" className="text-xs">
                          Termômetro: {comunidade.termometro_social}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB GRUPOS */}
        <TabsContent value="grupos" className="space-y-4">
          {/* Estatísticas Rápidas Grupos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100">
              <p className="text-xs text-pink-600 font-medium">Total Grupos</p>
              <p className="text-2xl font-bold text-pink-700">{gruposFiltrados.length}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100">
              <p className="text-xs text-indigo-600 font-medium">Total Membros</p>
              <p className="text-2xl font-bold text-indigo-700">
                {gruposFiltrados.reduce((acc, g) => acc + (g.numero_membros || 0), 0)}
              </p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100">
              <p className="text-xs text-cyan-600 font-medium">Tipos Diferentes</p>
              <p className="text-2xl font-bold text-cyan-700">
                {new Set(gruposFiltrados.map(g => g.tipo)).size}
              </p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-lime-50 to-lime-100">
              <p className="text-xs text-lime-600 font-medium">Com Comunidade</p>
              <p className="text-2xl font-bold text-lime-700">
                {gruposFiltrados.filter(g => g.comunidade_origem).length}
              </p>
            </Card>
          </div>

          <div className="flex justify-between items-center">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                {Object.entries(TIPO_GRUPO_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateGrupo(true)} className="bg-[#E31E24] hover:bg-[#B01419]">
              <Plus className="w-4 h-4 mr-2" />
              Novo Grupo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gruposFiltrados.map(grupo => {
              const TipoIcon = TIPO_GRUPO_CONFIG[grupo.tipo]?.icon || Music;
              return (
                <Card key={grupo.id} className="hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-lg ${TIPO_GRUPO_CONFIG[grupo.tipo]?.color.split(' ')[0] + '/20'} flex items-center justify-center`}>
                          <TipoIcon className="w-6 h-6" style={{ color: '#E31E24' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">{grupo.nome}</h3>
                          {grupo.area_atuacao && (
                            <p className="text-xs text-slate-500 truncate">{grupo.area_atuacao}</p>
                          )}
                          <Badge className={`text-xs mt-1 ${TIPO_GRUPO_CONFIG[grupo.tipo]?.color}`}>
                            {TIPO_GRUPO_CONFIG[grupo.tipo]?.label}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditGrupo(grupo)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => deleteGrupoMutation.mutate(grupo.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {grupo.municipio && grupo.estado ? `${grupo.municipio} - ${grupo.estado}` : 'Localização não definida'}
                      </div>
                      {grupo.numero_membros > 0 && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="w-4 h-4 text-slate-400" />
                          {grupo.numero_membros} membro(s)
                        </div>
                      )}
                      {grupo.comunidade_origem && (
                        <Badge variant="outline" className="text-xs">
                          Origem: {grupo.comunidade_origem}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Criar Comunidade */}
      <Dialog open={showCreateComunidade} onOpenChange={setShowCreateComunidade}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Comunidade Territorial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={formComunidade.nome}
                  onChange={(e) => setFormComunidade(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Vila Nova"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo *</label>
                <Select value={formComunidade.tipo} onValueChange={(v) => setFormComunidade(prev => ({ ...prev, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_COMUNIDADE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Município *</label>
                <Select 
                  value={formComunidade.municipio} 
                  onValueChange={(v) => setFormComunidade(prev => ({ ...prev, municipio: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione o município" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="Abreu e Lima">Abreu e Lima</SelectItem>
                    <SelectItem value="Aracaju">Aracaju</SelectItem>
                    <SelectItem value="Barueri">Barueri</SelectItem>
                    <SelectItem value="Belém">Belém</SelectItem>
                    <SelectItem value="Belo Horizonte">Belo Horizonte</SelectItem>
                    <SelectItem value="Betim">Betim</SelectItem>
                    <SelectItem value="Brasília">Brasília</SelectItem>
                    <SelectItem value="Cabo de Santo Agostinho">Cabo de Santo Agostinho</SelectItem>
                    <SelectItem value="Campinas">Campinas</SelectItem>
                    <SelectItem value="Carapicuíba">Carapicuíba</SelectItem>
                    <SelectItem value="Contagem">Contagem</SelectItem>
                    <SelectItem value="Curitiba">Curitiba</SelectItem>
                    <SelectItem value="Diadema">Diadema</SelectItem>
                    <SelectItem value="Fortaleza">Fortaleza</SelectItem>
                    <SelectItem value="Goiânia">Goiânia</SelectItem>
                    <SelectItem value="Guarulhos">Guarulhos</SelectItem>
                    <SelectItem value="Ipatinga">Ipatinga</SelectItem>
                    <SelectItem value="Jaboatão dos Guararapes">Jaboatão dos Guararapes</SelectItem>
                    <SelectItem value="Maracanaú">Maracanaú</SelectItem>
                    <SelectItem value="Mauá">Mauá</SelectItem>
                    <SelectItem value="Montes Claros">Montes Claros</SelectItem>
                    <SelectItem value="Natal">Natal</SelectItem>
                    <SelectItem value="Olinda">Olinda</SelectItem>
                    <SelectItem value="Osasco">Osasco</SelectItem>
                    <SelectItem value="Parauapebas">Parauapebas</SelectItem>
                    <SelectItem value="Paulista">Paulista</SelectItem>
                    <SelectItem value="Porto Alegre">Porto Alegre</SelectItem>
                    <SelectItem value="Recife">Recife</SelectItem>
                    <SelectItem value="Ribeirão das Neves">Ribeirão das Neves</SelectItem>
                    <SelectItem value="Rio de Janeiro">Rio de Janeiro</SelectItem>
                    <SelectItem value="Salvador">Salvador</SelectItem>
                    <SelectItem value="Santa Luzia">Santa Luzia</SelectItem>
                    <SelectItem value="Santo André">Santo André</SelectItem>
                    <SelectItem value="São Bernardo do Campo">São Bernardo do Campo</SelectItem>
                    <SelectItem value="São Gonçalo">São Gonçalo</SelectItem>
                    <SelectItem value="São João de Meriti">São João de Meriti</SelectItem>
                    <SelectItem value="São Luís">São Luís</SelectItem>
                    <SelectItem value="São Paulo">São Paulo</SelectItem>
                    <SelectItem value="Taboão da Serra">Taboão da Serra</SelectItem>
                    <SelectItem value="Uberlândia">Uberlândia</SelectItem>
                    <SelectItem value="Outro">Outro (digite manualmente)</SelectItem>
                  </SelectContent>
                </Select>
                {formComunidade.municipio === 'Outro' && (
                  <Input
                    placeholder="Digite o município"
                    onChange={(e) => setFormComunidade(prev => ({ ...prev, municipio: e.target.value }))}
                    className="mt-2"
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado *</label>
                <Select value={formComunidade.estado} onValueChange={(v) => setFormComunidade(prev => ({ ...prev, estado: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">População Estimada</label>
                <Input
                  type="number"
                  value={formComunidade.populacao_estimada}
                  onChange={(e) => setFormComunidade(prev => ({ ...prev, populacao_estimada: parseInt(e.target.value) || '' }))}
                  placeholder="Ex: 5000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Geolocalização</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="any"
                  value={formComunidade.localizacao?.lat || ''}
                  onChange={(e) => setFormComunidade(prev => ({ 
                    ...prev, 
                    localizacao: { ...prev.localizacao, lat: parseFloat(e.target.value) || null } 
                  }))}
                  placeholder="Latitude"
                />
                <Input
                  type="number"
                  step="any"
                  value={formComunidade.localizacao?.lng || ''}
                  onChange={(e) => setFormComunidade(prev => ({ 
                    ...prev, 
                    localizacao: { ...prev.localizacao, lng: parseFloat(e.target.value) || null } 
                  }))}
                  placeholder="Longitude"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={obterCoordenadasAutomaticas}
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Buscar Coordenadas Automaticamente
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                value={formComunidade.notas}
                onChange={(e) => setFormComunidade(prev => ({ ...prev, notas: e.target.value }))}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateComunidade(false)}>Cancelar</Button>
            <Button 
              onClick={() => createComunidadeMutation.mutate(formComunidade)}
              disabled={!formComunidade.nome || !formComunidade.municipio || !formComunidade.tipo}
              className="bg-[#E31E24] hover:bg-[#B01419]"
            >
              Criar Comunidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Comunidade */}
      <Dialog open={showEditComunidade} onOpenChange={setShowEditComunidade}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Comunidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={formComunidade.nome}
                  onChange={(e) => setFormComunidade(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo *</label>
                <Select value={formComunidade.tipo} onValueChange={(v) => setFormComunidade(prev => ({ ...prev, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_COMUNIDADE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Município *</label>
                <Select 
                  value={formComunidade.municipio} 
                  onValueChange={(v) => setFormComunidade(prev => ({ ...prev, municipio: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione o município" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="Abreu e Lima">Abreu e Lima</SelectItem>
                    <SelectItem value="Aracaju">Aracaju</SelectItem>
                    <SelectItem value="Barueri">Barueri</SelectItem>
                    <SelectItem value="Belém">Belém</SelectItem>
                    <SelectItem value="Belo Horizonte">Belo Horizonte</SelectItem>
                    <SelectItem value="Betim">Betim</SelectItem>
                    <SelectItem value="Brasília">Brasília</SelectItem>
                    <SelectItem value="Cabo de Santo Agostinho">Cabo de Santo Agostinho</SelectItem>
                    <SelectItem value="Campinas">Campinas</SelectItem>
                    <SelectItem value="Carapicuíba">Carapicuíba</SelectItem>
                    <SelectItem value="Contagem">Contagem</SelectItem>
                    <SelectItem value="Curitiba">Curitiba</SelectItem>
                    <SelectItem value="Diadema">Diadema</SelectItem>
                    <SelectItem value="Fortaleza">Fortaleza</SelectItem>
                    <SelectItem value="Goiânia">Goiânia</SelectItem>
                    <SelectItem value="Guarulhos">Guarulhos</SelectItem>
                    <SelectItem value="Ipatinga">Ipatinga</SelectItem>
                    <SelectItem value="Jaboatão dos Guararapes">Jaboatão dos Guararapes</SelectItem>
                    <SelectItem value="Maracanaú">Maracanaú</SelectItem>
                    <SelectItem value="Mauá">Mauá</SelectItem>
                    <SelectItem value="Montes Claros">Montes Claros</SelectItem>
                    <SelectItem value="Natal">Natal</SelectItem>
                    <SelectItem value="Olinda">Olinda</SelectItem>
                    <SelectItem value="Osasco">Osasco</SelectItem>
                    <SelectItem value="Parauapebas">Parauapebas</SelectItem>
                    <SelectItem value="Paulista">Paulista</SelectItem>
                    <SelectItem value="Porto Alegre">Porto Alegre</SelectItem>
                    <SelectItem value="Recife">Recife</SelectItem>
                    <SelectItem value="Ribeirão das Neves">Ribeirão das Neves</SelectItem>
                    <SelectItem value="Rio de Janeiro">Rio de Janeiro</SelectItem>
                    <SelectItem value="Salvador">Salvador</SelectItem>
                    <SelectItem value="Santa Luzia">Santa Luzia</SelectItem>
                    <SelectItem value="Santo André">Santo André</SelectItem>
                    <SelectItem value="São Bernardo do Campo">São Bernardo do Campo</SelectItem>
                    <SelectItem value="São Gonçalo">São Gonçalo</SelectItem>
                    <SelectItem value="São João de Meriti">São João de Meriti</SelectItem>
                    <SelectItem value="São Luís">São Luís</SelectItem>
                    <SelectItem value="São Paulo">São Paulo</SelectItem>
                    <SelectItem value="Taboão da Serra">Taboão da Serra</SelectItem>
                    <SelectItem value="Uberlândia">Uberlândia</SelectItem>
                    <SelectItem value="Outro">Outro (digite manualmente)</SelectItem>
                  </SelectContent>
                </Select>
                {formComunidade.municipio === 'Outro' && (
                  <Input
                    placeholder="Digite o município"
                    onChange={(e) => setFormComunidade(prev => ({ ...prev, municipio: e.target.value }))}
                    className="mt-2"
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado *</label>
                <Select value={formComunidade.estado} onValueChange={(v) => setFormComunidade(prev => ({ ...prev, estado: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">População Estimada</label>
                <Input
                  type="number"
                  value={formComunidade.populacao_estimada}
                  onChange={(e) => setFormComunidade(prev => ({ ...prev, populacao_estimada: parseInt(e.target.value) || '' }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Geolocalização</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="any"
                  value={formComunidade.localizacao?.lat || ''}
                  onChange={(e) => setFormComunidade(prev => ({ 
                    ...prev, 
                    localizacao: { ...prev.localizacao, lat: parseFloat(e.target.value) || null } 
                  }))}
                  placeholder="Latitude"
                />
                <Input
                  type="number"
                  step="any"
                  value={formComunidade.localizacao?.lng || ''}
                  onChange={(e) => setFormComunidade(prev => ({ 
                    ...prev, 
                    localizacao: { ...prev.localizacao, lng: parseFloat(e.target.value) || null } 
                  }))}
                  placeholder="Longitude"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={obterCoordenadasAutomaticas}
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Buscar Coordenadas Automaticamente
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                value={formComunidade.notas}
                onChange={(e) => setFormComunidade(prev => ({ ...prev, notas: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditComunidade(false)}>Cancelar</Button>
            <Button 
              onClick={() => updateComunidadeMutation.mutate({ id: editingItem.id, data: formComunidade })}
              className="bg-[#E31E24] hover:bg-[#B01419]"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Criar Grupo */}
      <Dialog open={showCreateGrupo} onOpenChange={setShowCreateGrupo}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Grupo ou Coletivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={formGrupo.nome}
                  onChange={(e) => setFormGrupo(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Grupo de Música Tradicional"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo *</label>
                <Select value={formGrupo.tipo} onValueChange={(v) => setFormGrupo(prev => ({ ...prev, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_GRUPO_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Área de Atuação</label>
                <Input
                  value={formGrupo.area_atuacao}
                  onChange={(e) => setFormGrupo(prev => ({ ...prev, area_atuacao: e.target.value }))}
                  placeholder="Ex: Samba, Capoeira, Teatro"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Número de Membros</label>
                <Input
                  type="number"
                  value={formGrupo.numero_membros}
                  onChange={(e) => setFormGrupo(prev => ({ ...prev, numero_membros: parseInt(e.target.value) || '' }))}
                  placeholder="Ex: 15"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Comunidade de Origem</label>
                <Select value={formGrupo.comunidade_origem} onValueChange={(v) => setFormGrupo(prev => ({ ...prev, comunidade_origem: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhuma</SelectItem>
                    {comunidades.map(c => (
                      <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Município</label>
                <Select 
                  value={formGrupo.municipio} 
                  onValueChange={(v) => setFormGrupo(prev => ({ ...prev, municipio: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value={null}>Nenhum</SelectItem>
                    <SelectItem value="Abreu e Lima">Abreu e Lima</SelectItem>
                    <SelectItem value="Aracaju">Aracaju</SelectItem>
                    <SelectItem value="Barueri">Barueri</SelectItem>
                    <SelectItem value="Belém">Belém</SelectItem>
                    <SelectItem value="Belo Horizonte">Belo Horizonte</SelectItem>
                    <SelectItem value="Betim">Betim</SelectItem>
                    <SelectItem value="Brasília">Brasília</SelectItem>
                    <SelectItem value="Cabo de Santo Agostinho">Cabo de Santo Agostinho</SelectItem>
                    <SelectItem value="Campinas">Campinas</SelectItem>
                    <SelectItem value="Carapicuíba">Carapicuíba</SelectItem>
                    <SelectItem value="Contagem">Contagem</SelectItem>
                    <SelectItem value="Curitiba">Curitiba</SelectItem>
                    <SelectItem value="Diadema">Diadema</SelectItem>
                    <SelectItem value="Fortaleza">Fortaleza</SelectItem>
                    <SelectItem value="Goiânia">Goiânia</SelectItem>
                    <SelectItem value="Guarulhos">Guarulhos</SelectItem>
                    <SelectItem value="Ipatinga">Ipatinga</SelectItem>
                    <SelectItem value="Jaboatão dos Guararapes">Jaboatão dos Guararapes</SelectItem>
                    <SelectItem value="Maracanaú">Maracanaú</SelectItem>
                    <SelectItem value="Mauá">Mauá</SelectItem>
                    <SelectItem value="Montes Claros">Montes Claros</SelectItem>
                    <SelectItem value="Natal">Natal</SelectItem>
                    <SelectItem value="Olinda">Olinda</SelectItem>
                    <SelectItem value="Osasco">Osasco</SelectItem>
                    <SelectItem value="Parauapebas">Parauapebas</SelectItem>
                    <SelectItem value="Paulista">Paulista</SelectItem>
                    <SelectItem value="Porto Alegre">Porto Alegre</SelectItem>
                    <SelectItem value="Recife">Recife</SelectItem>
                    <SelectItem value="Ribeirão das Neves">Ribeirão das Neves</SelectItem>
                    <SelectItem value="Rio de Janeiro">Rio de Janeiro</SelectItem>
                    <SelectItem value="Salvador">Salvador</SelectItem>
                    <SelectItem value="Santa Luzia">Santa Luzia</SelectItem>
                    <SelectItem value="Santo André">Santo André</SelectItem>
                    <SelectItem value="São Bernardo do Campo">São Bernardo do Campo</SelectItem>
                    <SelectItem value="São Gonçalo">São Gonçalo</SelectItem>
                    <SelectItem value="São João de Meriti">São João de Meriti</SelectItem>
                    <SelectItem value="São Luís">São Luís</SelectItem>
                    <SelectItem value="São Paulo">São Paulo</SelectItem>
                    <SelectItem value="Taboão da Serra">Taboão da Serra</SelectItem>
                    <SelectItem value="Uberlândia">Uberlândia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select value={formGrupo.estado} onValueChange={(v) => setFormGrupo(prev => ({ ...prev, estado: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={formGrupo.descricao}
                onChange={(e) => setFormGrupo(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o grupo, suas atividades e objetivos..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contato Principal</label>
                <Input
                  value={formGrupo.contato_principal}
                  onChange={(e) => setFormGrupo(prev => ({ ...prev, contato_principal: e.target.value }))}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={formGrupo.telefone}
                  onChange={(e) => setFormGrupo(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formGrupo.email}
                  onChange={(e) => setFormGrupo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="grupo@email.com"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateGrupo(false)}>Cancelar</Button>
            <Button 
              onClick={() => createGrupoMutation.mutate(formGrupo)}
              disabled={!formGrupo.nome || !formGrupo.tipo}
              className="bg-[#E31E24] hover:bg-[#B01419]"
            >
              Criar Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Grupo */}
      <Dialog open={showEditGrupo} onOpenChange={setShowEditGrupo}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={formGrupo.nome}
                  onChange={(e) => setFormGrupo(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo *</label>
                <Select value={formGrupo.tipo} onValueChange={(v) => setFormGrupo(prev => ({ ...prev, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_GRUPO_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Área de Atuação</label>
                <Input
                  value={formGrupo.area_atuacao}
                  onChange={(e) => setFormGrupo(prev => ({ ...prev, area_atuacao: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Número de Membros</label>
                <Input
                  type="number"
                  value={formGrupo.numero_membros}
                  onChange={(e) => setFormGrupo(prev => ({ ...prev, numero_membros: parseInt(e.target.value) || '' }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Comunidade de Origem</label>
                <Select value={formGrupo.comunidade_origem} onValueChange={(v) => setFormGrupo(prev => ({ ...prev, comunidade_origem: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhuma</SelectItem>
                    {comunidades.map(c => (
                      <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Município</label>
                <Select 
                  value={formGrupo.municipio} 
                  onValueChange={(v) => setFormGrupo(prev => ({ ...prev, municipio: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value={null}>Nenhum</SelectItem>
                    <SelectItem value="Abreu e Lima">Abreu e Lima</SelectItem>
                    <SelectItem value="Aracaju">Aracaju</SelectItem>
                    <SelectItem value="Barueri">Barueri</SelectItem>
                    <SelectItem value="Belém">Belém</SelectItem>
                    <SelectItem value="Belo Horizonte">Belo Horizonte</SelectItem>
                    <SelectItem value="Betim">Betim</SelectItem>
                    <SelectItem value="Brasília">Brasília</SelectItem>
                    <SelectItem value="Cabo de Santo Agostinho">Cabo de Santo Agostinho</SelectItem>
                    <SelectItem value="Campinas">Campinas</SelectItem>
                    <SelectItem value="Carapicuíba">Carapicuíba</SelectItem>
                    <SelectItem value="Contagem">Contagem</SelectItem>
                    <SelectItem value="Curitiba">Curitiba</SelectItem>
                    <SelectItem value="Diadema">Diadema</SelectItem>
                    <SelectItem value="Fortaleza">Fortaleza</SelectItem>
                    <SelectItem value="Goiânia">Goiânia</SelectItem>
                    <SelectItem value="Guarulhos">Guarulhos</SelectItem>
                    <SelectItem value="Ipatinga">Ipatinga</SelectItem>
                    <SelectItem value="Jaboatão dos Guararapes">Jaboatão dos Guararapes</SelectItem>
                    <SelectItem value="Maracanaú">Maracanaú</SelectItem>
                    <SelectItem value="Mauá">Mauá</SelectItem>
                    <SelectItem value="Montes Claros">Montes Claros</SelectItem>
                    <SelectItem value="Natal">Natal</SelectItem>
                    <SelectItem value="Olinda">Olinda</SelectItem>
                    <SelectItem value="Osasco">Osasco</SelectItem>
                    <SelectItem value="Parauapebas">Parauapebas</SelectItem>
                    <SelectItem value="Paulista">Paulista</SelectItem>
                    <SelectItem value="Porto Alegre">Porto Alegre</SelectItem>
                    <SelectItem value="Recife">Recife</SelectItem>
                    <SelectItem value="Ribeirão das Neves">Ribeirão das Neves</SelectItem>
                    <SelectItem value="Rio de Janeiro">Rio de Janeiro</SelectItem>
                    <SelectItem value="Salvador">Salvador</SelectItem>
                    <SelectItem value="Santa Luzia">Santa Luzia</SelectItem>
                    <SelectItem value="Santo André">Santo André</SelectItem>
                    <SelectItem value="São Bernardo do Campo">São Bernardo do Campo</SelectItem>
                    <SelectItem value="São Gonçalo">São Gonçalo</SelectItem>
                    <SelectItem value="São João de Meriti">São João de Meriti</SelectItem>
                    <SelectItem value="São Luís">São Luís</SelectItem>
                    <SelectItem value="São Paulo">São Paulo</SelectItem>
                    <SelectItem value="Taboão da Serra">Taboão da Serra</SelectItem>
                    <SelectItem value="Uberlândia">Uberlândia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select value={formGrupo.estado} onValueChange={(v) => setFormGrupo(prev => ({ ...prev, estado: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={formGrupo.descricao}
                onChange={(e) => setFormGrupo(prev => ({ ...prev, descricao: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contato Principal</label>
                <Input
                  value={formGrupo.contato_principal}
                  onChange={(e) => setFormGrupo(prev => ({ ...prev, contato_principal: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={formGrupo.telefone}
                  onChange={(e) => setFormGrupo(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formGrupo.email}
                  onChange={(e) => setFormGrupo(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditGrupo(false)}>Cancelar</Button>
            <Button 
              onClick={() => updateGrupoMutation.mutate({ id: editingItem.id, data: formGrupo })}
              className="bg-[#E31E24] hover:bg-[#B01419]"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}