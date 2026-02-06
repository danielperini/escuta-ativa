import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, AlertTriangle, Users, FileText, Target, Activity, ThermometerSun } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const COLORS = {
    baixo: '#10b981',
    medio: '#f59e0b',
    alto: '#f97316',
    critico: '#ef4444'
};

function MapUpdater({ center }) {
    const map = useMap();
    React.useEffect(() => {
        if (center) {
            map.setView(center, 10);
        }
    }, [center, map]);
    return null;
}

export default function DashboardAnalitico() {
    const [periodoFiltro, setPeriodoFiltro] = useState('30');
    const [estadoFiltro, setEstadoFiltro] = useState('todos');
    const [municipioFiltro, setMunicipioFiltro] = useState('todos');
    const [mapCenter, setMapCenter] = useState([-15.7942, -47.8822]); // Brasília default

    // Fetch data
    const { data: registros = [] } = useQuery({
        queryKey: ['registros'],
        queryFn: () => base44.entities.Registro.list('-created_date', 1000)
    });

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    const { data: grupos = [] } = useQuery({
        queryKey: ['grupos'],
        queryFn: () => base44.entities.GrupoColetivo.list()
    });

    const { data: stakeholders = [] } = useQuery({
        queryKey: ['stakeholders'],
        queryFn: () => base44.entities.Stakeholder.list('-updated_date', 500)
    });

    // Filtros de período
    const dataLimite = useMemo(() => {
        const hoje = new Date();
        hoje.setDate(hoje.getDate() - parseInt(periodoFiltro));
        return hoje;
    }, [periodoFiltro]);

    const registrosFiltrados = useMemo(() => {
        return registros.filter(r => {
            const dataRegistro = new Date(r.created_date);
            const dentroPerido = dataRegistro >= dataLimite;
            const dentroEstado = estadoFiltro === 'todos' || r.localizacao?.estado === estadoFiltro;
            const dentroMunicipio = municipioFiltro === 'todos' || r.localizacao?.municipio === municipioFiltro;
            return dentroPerido && dentroEstado && dentroMunicipio;
        });
    }, [registros, dataLimite, estadoFiltro, municipioFiltro]);

    // Estados e municípios únicos
    const estadosUnicos = useMemo(() => {
        const estados = new Set();
        [...registros, ...comunidades].forEach(item => {
            if (item.localizacao?.estado) estados.add(item.localizacao.estado);
            if (item.estado) estados.add(item.estado);
        });
        return Array.from(estados).sort();
    }, [registros, comunidades]);

    const municipiosUnicos = useMemo(() => {
        const municipios = new Set();
        [...registros, ...comunidades].forEach(item => {
            if (item.localizacao?.municipio) municipios.add(item.localizacao.municipio);
            if (item.municipio) municipios.add(item.municipio);
        });
        return Array.from(municipios).sort();
    }, [registros, comunidades]);

    // KPIs
    const kpis = useMemo(() => {
        const demandasAbertas = registrosFiltrados.reduce((acc, r) => {
            return acc + (r.demandas?.filter(d => d.status === 'pendente').length || 0);
        }, 0);

        const comunidadesAtivas = new Set(
            registrosFiltrados.map(r => r.comunidade).filter(Boolean)
        ).size;

        const temperaturaMedia = registrosFiltrados.length > 0 ?
            registrosFiltrados.reduce((acc, r) => {
                const peso = { baixo: 1, medio: 2, alto: 3, critico: 4 }[r.temperatura_territorio] || 0;
                return acc + peso;
            }, 0) / registrosFiltrados.length : 0;

        const riscoMedio = registrosFiltrados.length > 0 ?
            registrosFiltrados.reduce((acc, r) => {
                const peso = { baixo: 1, medio: 2, alto: 3, critico: 4 }[r.indicadores_risco?.[0]] || 0;
                return acc + peso;
            }, 0) / registrosFiltrados.length : 0;

        return {
            totalRegistros: registrosFiltrados.length,
            comunidadesAtivas,
            demandasAbertas,
            temperaturaMedia: temperaturaMedia.toFixed(1),
            riscoMedio: riscoMedio.toFixed(1),
            stakeholdersAtivos: stakeholders.length
        };
    }, [registrosFiltrados, stakeholders]);

    // Dados para gráficos - Tendências temporais
    const dadosTendencias = useMemo(() => {
        const grupos = {};
        registrosFiltrados.forEach(r => {
            const data = new Date(r.created_date);
            const mes = `${data.getMonth() + 1}/${data.getFullYear()}`;
            if (!grupos[mes]) {
                grupos[mes] = { mes, registros: 0, demandas: 0, temperatura: 0, count: 0 };
            }
            grupos[mes].registros++;
            grupos[mes].demandas += r.demandas?.length || 0;
            const peso = { baixo: 1, medio: 2, alto: 3, critico: 4 }[r.temperatura_territorio] || 0;
            grupos[mes].temperatura += peso;
            grupos[mes].count++;
        });

        return Object.values(grupos)
            .map(g => ({
                ...g,
                temperaturaMedia: g.count > 0 ? (g.temperatura / g.count).toFixed(1) : 0
            }))
            .sort((a, b) => {
                const [mesA, anoA] = a.mes.split('/').map(Number);
                const [mesB, anoB] = b.mes.split('/').map(Number);
                return anoA !== anoB ? anoA - anoB : mesA - mesB;
            });
    }, [registrosFiltrados]);

    // Termômetro Social por Município
    const termometroPorMunicipio = useMemo(() => {
        const municipios = {};
        registrosFiltrados.forEach(r => {
            const mun = r.localizacao?.municipio || r.comunidade;
            if (!mun) return;
            if (!municipios[mun]) {
                municipios[mun] = { baixo: 0, medio: 0, alto: 0, critico: 0, total: 0 };
            }
            const temp = r.temperatura_territorio || 'medio';
            municipios[mun][temp]++;
            municipios[mun].total++;
        });

        return Object.entries(municipios)
            .map(([municipio, dados]) => ({
                municipio,
                ...dados,
                dominante: Object.entries(dados)
                    .filter(([key]) => key !== 'total')
                    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'medio'
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }, [registrosFiltrados]);

    // Distribuição de temas
    const distribuicaoTemas = useMemo(() => {
        const temas = {};
        registrosFiltrados.forEach(r => {
            r.temas_identificados?.forEach(tema => {
                temas[tema] = (temas[tema] || 0) + 1;
            });
        });

        return Object.entries(temas)
            .map(([tema, total]) => ({ tema, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);
    }, [registrosFiltrados]);

    // Pontos no mapa
    const pontosMapa = useMemo(() => {
        const pontos = [];
        
        // Comunidades
        comunidades.forEach(c => {
            if (c.localizacao?.lat && c.localizacao?.lng) {
                pontos.push({
                    tipo: 'comunidade',
                    nome: c.nome,
                    lat: c.localizacao.lat,
                    lng: c.localizacao.lng,
                    temperatura: c.termometro_social || 'medio',
                    dados: c
                });
            }
        });

        // Registros com localização
        registrosFiltrados.forEach(r => {
            if (r.localizacao?.lat && r.localizacao?.lng) {
                pontos.push({
                    tipo: 'registro',
                    nome: r.titulo,
                    lat: r.localizacao.lat,
                    lng: r.localizacao.lng,
                    temperatura: r.temperatura_territorio || 'medio',
                    dados: r
                });
            }
        });

        return pontos;
    }, [comunidades, registrosFiltrados]);

    const getTemperaturaColor = (temp) => {
        return COLORS[temp] || COLORS.medio;
    };

    const getTemperaturaNivel = (valor) => {
        if (valor < 1.5) return 'Baixo';
        if (valor < 2.5) return 'Médio';
        if (valor < 3.5) return 'Alto';
        return 'Crítico';
    };

    return (
        <div className="space-y-6">
            {/* Header e Filtros */}
            <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard Analítico</h1>
                    <p className="text-slate-600 mt-1">Gestão centralizada de comunidades, grupos e registros</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Últimos 7 dias</SelectItem>
                            <SelectItem value="30">Últimos 30 dias</SelectItem>
                            <SelectItem value="90">Últimos 90 dias</SelectItem>
                            <SelectItem value="180">Últimos 6 meses</SelectItem>
                            <SelectItem value="365">Último ano</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos Estados</SelectItem>
                            {estadosUnicos.map(estado => (
                                <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={municipioFiltro} onValueChange={setMunicipioFiltro}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Município" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos Municípios</SelectItem>
                            {municipiosUnicos.map(mun => (
                                <SelectItem key={mun} value={mun}>{mun}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Registros</p>
                                <p className="text-2xl font-bold text-slate-900">{kpis.totalRegistros}</p>
                            </div>
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Comunidades</p>
                                <p className="text-2xl font-bold text-slate-900">{kpis.comunidadesAtivas}</p>
                            </div>
                            <MapPin className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Demandas</p>
                                <p className="text-2xl font-bold text-slate-900">{kpis.demandasAbertas}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Stakeholders</p>
                                <p className="text-2xl font-bold text-slate-900">{kpis.stakeholdersAtivos}</p>
                            </div>
                            <Users className="w-8 h-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Temperatura</p>
                                <p className="text-2xl font-bold" style={{ color: getTemperaturaColor(getTemperaturaNivel(kpis.temperaturaMedia).toLowerCase()) }}>
                                    {getTemperaturaNivel(kpis.temperaturaMedia)}
                                </p>
                            </div>
                            <ThermometerSun className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Risco Social</p>
                                <p className="text-2xl font-bold" style={{ color: getTemperaturaColor(getTemperaturaNivel(kpis.riscoMedio).toLowerCase()) }}>
                                    {getTemperaturaNivel(kpis.riscoMedio)}
                                </p>
                            </div>
                            <Target className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos - Linha 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tendências Temporais */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#E31E24]" />
                            Tendências ao Longo do Tempo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dadosTendencias}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="mes" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="registros" stroke="#3b82f6" name="Registros" strokeWidth={2} />
                                <Line type="monotone" dataKey="demandas" stroke="#f59e0b" name="Demandas" strokeWidth={2} />
                                <Line type="monotone" dataKey="temperaturaMedia" stroke="#ef4444" name="Temperatura Média" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Distribuição de Temas */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[#E31E24]" />
                            Principais Temas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={distribuicaoTemas} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="tema" type="category" width={150} />
                                <Tooltip />
                                <Bar dataKey="total" fill="#8b5cf6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Termômetro Social por Município */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ThermometerSun className="w-5 h-5 text-[#E31E24]" />
                        Termômetro Social por Município
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {termometroPorMunicipio.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-40 truncate">
                                    <p className="font-medium text-sm">{item.municipio}</p>
                                    <p className="text-xs text-slate-500">{item.total} registros</p>
                                </div>
                                <div className="flex-1 flex gap-1">
                                    {['critico', 'alto', 'medio', 'baixo'].map(nivel => {
                                        const valor = item[nivel] || 0;
                                        const percentual = (valor / item.total) * 100;
                                        return percentual > 0 ? (
                                            <div
                                                key={nivel}
                                                className="h-8 flex items-center justify-center text-xs text-white font-medium rounded"
                                                style={{
                                                    width: `${percentual}%`,
                                                    backgroundColor: COLORS[nivel],
                                                    minWidth: '30px'
                                                }}
                                            >
                                                {valor}
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                                <Badge
                                    className="w-20 justify-center"
                                    style={{
                                        backgroundColor: COLORS[item.dominante],
                                        color: 'white'
                                    }}
                                >
                                    {item.dominante}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Mapa Interativo */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#E31E24]" />
                        Mapa Territorial Interativo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[500px] rounded-lg overflow-hidden border border-slate-200">
                        <MapContainer
                            center={mapCenter}
                            zoom={6}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            <MapUpdater center={mapCenter} />
                            
                            {pontosMapa.map((ponto, index) => (
                                <CircleMarker
                                    key={index}
                                    center={[ponto.lat, ponto.lng]}
                                    radius={ponto.tipo === 'comunidade' ? 10 : 6}
                                    fillColor={getTemperaturaColor(ponto.temperatura)}
                                    color="white"
                                    weight={2}
                                    opacity={1}
                                    fillOpacity={0.8}
                                >
                                    <Popup>
                                        <div className="p-2">
                                            <p className="font-bold text-sm mb-1">{ponto.nome}</p>
                                            <p className="text-xs text-slate-600 mb-2">
                                                {ponto.tipo === 'comunidade' ? '📍 Comunidade' : '📝 Registro'}
                                            </p>
                                            <Badge
                                                style={{
                                                    backgroundColor: getTemperaturaColor(ponto.temperatura),
                                                    color: 'white'
                                                }}
                                            >
                                                {ponto.temperatura}
                                            </Badge>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            ))}
                        </MapContainer>
                    </div>
                    
                    <div className="flex gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.baixo }}></div>
                            <span>Baixo</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.medio }}></div>
                            <span>Médio</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.alto }}></div>
                            <span>Alto</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.critico }}></div>
                            <span>Crítico</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}