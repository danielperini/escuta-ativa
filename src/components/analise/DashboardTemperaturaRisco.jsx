import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  Download,
  Calendar,
  MapPin,
  Thermometer,
  FileText
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

const CORES_TEMPERATURA = {
  baixo: '#10B981',
  medio: '#F59E0B',
  alto: '#F97316',
  critico: '#EF4444'
};

const CORES_RISCO = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

export default function DashboardTemperaturaRisco() {
  const [periodoMeses, setPeriodoMeses] = useState(3);
  const [comunidadeFiltro, setComunidadeFiltro] = useState('todas');
  const [tipoGrafico, setTipoGrafico] = useState('linha');

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-analise'],
    queryFn: () => base44.entities.Registro.list('-data_registro', 500)
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades-analise'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: riscos = [] } = useQuery({
    queryKey: ['riscos-analise'],
    queryFn: () => base44.entities.RiscoSocial.list('-created_date', 200)
  });

  // Processar dados de temperatura ao longo do tempo
  const dadosTemperaturaTimeline = useMemo(() => {
    const dataInicio = subMonths(new Date(), periodoMeses);
    const registrosFiltrados = registros.filter(r => {
      const dataRegistro = new Date(r.data_registro || r.created_date);
      const matchPeriodo = dataRegistro >= dataInicio;
      const matchComunidade = comunidadeFiltro === 'todas' || r.comunidade === comunidadeFiltro;
      return matchPeriodo && matchComunidade && r.temperatura_territorio;
    });

    const mesesMap = {};
    registrosFiltrados.forEach(r => {
      const mes = format(new Date(r.data_registro || r.created_date), 'MM/yyyy');
      if (!mesesMap[mes]) {
        mesesMap[mes] = { baixo: 0, medio: 0, alto: 0, critico: 0 };
      }
      mesesMap[mes][r.temperatura_territorio]++;
    });

    return Object.entries(mesesMap).map(([mes, dados]) => ({
      mes,
      ...dados,
      total: dados.baixo + dados.medio + dados.alto + dados.critico
    })).sort((a, b) => {
      const [mesA, anoA] = a.mes.split('/');
      const [mesB, anoB] = b.mes.split('/');
      return new Date(anoA, mesA - 1) - new Date(anoB, mesB - 1);
    });
  }, [registros, periodoMeses, comunidadeFiltro]);

  // Distribuição atual de temperatura
  const dadosTemperaturaAtual = useMemo(() => {
    const registrosRecentes = registros
      .filter(r => {
        const matchComunidade = comunidadeFiltro === 'todas' || r.comunidade === comunidadeFiltro;
        return matchComunidade && r.temperatura_territorio;
      })
      .slice(0, 100);

    const distribuicao = { baixo: 0, medio: 0, alto: 0, critico: 0 };
    registrosRecentes.forEach(r => {
      if (r.temperatura_territorio) distribuicao[r.temperatura_territorio]++;
    });

    return Object.entries(distribuicao)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: CORES_TEMPERATURA[name]
      }));
  }, [registros, comunidadeFiltro]);

  // Top indicadores de risco
  const topIndicadoresRisco = useMemo(() => {
    const indicadoresMap = {};
    
    registros.forEach(r => {
      (r.indicadores_risco || []).forEach(indicador => {
        indicadoresMap[indicador] = (indicadoresMap[indicador] || 0) + 1;
      });
    });

    riscos.forEach(r => {
      const tipo = r.tipo_risco || r.descricao?.substring(0, 30);
      indicadoresMap[tipo] = (indicadoresMap[tipo] || 0) + 1;
    });

    return Object.entries(indicadoresMap)
      .map(([indicador, quantidade]) => ({ indicador, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }, [registros, riscos]);

  // Dados de risco por comunidade
  const dadosRiscoPorComunidade = useMemo(() => {
    const comunidadesMap = {};
    
    registros.forEach(r => {
      if (!r.comunidade) return;
      if (!comunidadesMap[r.comunidade]) {
        comunidadesMap[r.comunidade] = {
          nome: r.comunidade,
          temperatura_critica: 0,
          temperatura_alta: 0,
          total_riscos: (r.indicadores_risco || []).length
        };
      }
      
      if (r.temperatura_territorio === 'critico') comunidadesMap[r.comunidade].temperatura_critica++;
      if (r.temperatura_territorio === 'alto') comunidadesMap[r.comunidade].temperatura_alta++;
      comunidadesMap[r.comunidade].total_riscos += (r.indicadores_risco || []).length;
    });

    return Object.values(comunidadesMap)
      .sort((a, b) => (b.temperatura_critica + b.temperatura_alta) - (a.temperatura_critica + a.temperatura_alta))
      .slice(0, 8);
  }, [registros]);

  // Exportar PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Relatório de Temperatura e Riscos', 20, 20);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 30);
    doc.text(`Período: ${periodoMeses} meses`, 20, 36);
    doc.text(`Filtro: ${comunidadeFiltro === 'todas' ? 'Todas comunidades' : comunidadeFiltro}`, 20, 42);

    let y = 55;

    doc.setFontSize(14);
    doc.text('Distribuição de Temperatura Atual', 20, y);
    y += 10;

    dadosTemperaturaAtual.forEach(item => {
      doc.setFontSize(10);
      doc.text(`${item.name}: ${item.value} registros (${((item.value / dadosTemperaturaAtual.reduce((sum, i) => sum + i.value, 0)) * 100).toFixed(1)}%)`, 30, y);
      y += 6;
    });

    y += 10;
    doc.setFontSize(14);
    doc.text('Top 10 Indicadores de Risco', 20, y);
    y += 10;

    topIndicadoresRisco.forEach((item, idx) => {
      doc.setFontSize(10);
      doc.text(`${idx + 1}. ${item.indicador}: ${item.quantidade} menções`, 30, y);
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`relatorio-temperatura-riscos-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('Relatório PDF gerado!');
  };

  // Exportar CSV
  const exportarCSV = () => {
    let csv = 'Relatório de Temperatura e Riscos\n\n';
    csv += `Gerado em,${format(new Date(), 'dd/MM/yyyy HH:mm')}\n`;
    csv += `Período,${periodoMeses} meses\n\n`;

    csv += 'Distribuição de Temperatura\n';
    csv += 'Nível,Quantidade,Percentual\n';
    dadosTemperaturaAtual.forEach(item => {
      const total = dadosTemperaturaAtual.reduce((sum, i) => sum + i.value, 0);
      csv += `${item.name},${item.value},${((item.value / total) * 100).toFixed(1)}%\n`;
    });

    csv += '\nTop Indicadores de Risco\n';
    csv += 'Posição,Indicador,Quantidade\n';
    topIndicadoresRisco.forEach((item, idx) => {
      csv += `${idx + 1},${item.indicador},${item.quantidade}\n`;
    });

    csv += '\nRiscos por Comunidade\n';
    csv += 'Comunidade,Temp. Crítica,Temp. Alta,Total Riscos\n';
    dadosRiscoPorComunidade.forEach(item => {
      csv += `${item.nome},${item.temperatura_critica},${item.temperatura_alta},${item.total_riscos}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-temperatura-riscos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('Relatório CSV gerado!');
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={periodoMeses.toString()} onValueChange={(v) => setPeriodoMeses(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Último mês</SelectItem>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Último ano</SelectItem>
              </SelectContent>
            </Select>

            <Select value={comunidadeFiltro} onValueChange={setComunidadeFiltro}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Comunidades</SelectItem>
                {comunidades.map(c => (
                  <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tipoGrafico} onValueChange={setTipoGrafico}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linha">Gráfico de Linha</SelectItem>
                <SelectItem value="barra">Gráfico de Barras</SelectItem>
                <SelectItem value="area">Gráfico de Área</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={exportarPDF} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button onClick={exportarCSV} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Crítico</p>
                <p className="text-2xl font-bold text-red-600">
                  {dadosTemperaturaAtual.find(d => d.name === 'Critico')?.value || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Thermometer className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Alto</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dadosTemperaturaAtual.find(d => d.name === 'Alto')?.value || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Médio</p>
                <p className="text-2xl font-bold text-amber-600">
                  {dadosTemperaturaAtual.find(d => d.name === 'Medio')?.value || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Riscos</p>
                <p className="text-2xl font-bold text-slate-900">
                  {riscos.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução Temporal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#E31E24]" />
            Evolução da Temperatura do Território
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            {tipoGrafico === 'linha' && (
              <LineChart data={dadosTemperaturaTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="critico" stroke="#EF4444" strokeWidth={2} name="Crítico" />
                <Line type="monotone" dataKey="alto" stroke="#F97316" strokeWidth={2} name="Alto" />
                <Line type="monotone" dataKey="medio" stroke="#F59E0B" strokeWidth={2} name="Médio" />
                <Line type="monotone" dataKey="baixo" stroke="#10B981" strokeWidth={2} name="Baixo" />
              </LineChart>
            )}
            {tipoGrafico === 'barra' && (
              <BarChart data={dadosTemperaturaTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="critico" fill="#EF4444" name="Crítico" />
                <Bar dataKey="alto" fill="#F97316" name="Alto" />
                <Bar dataKey="medio" fill="#F59E0B" name="Médio" />
                <Bar dataKey="baixo" fill="#10B981" name="Baixo" />
              </BarChart>
            )}
            {tipoGrafico === 'area' && (
              <AreaChart data={dadosTemperaturaTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="critico" stackId="1" stroke="#EF4444" fill="#EF4444" name="Crítico" />
                <Area type="monotone" dataKey="alto" stackId="1" stroke="#F97316" fill="#F97316" name="Alto" />
                <Area type="monotone" dataKey="medio" stackId="1" stroke="#F59E0B" fill="#F59E0B" name="Médio" />
                <Area type="monotone" dataKey="baixo" stackId="1" stroke="#10B981" fill="#10B981" name="Baixo" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição Atual de Temperatura */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição Atual de Temperatura</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosTemperaturaAtual}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosTemperaturaAtual.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Indicadores de Risco */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 Indicadores de Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topIndicadoresRisco} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="indicador" type="category" width={150} fontSize={11} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#E31E24" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Comunidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#E31E24]" />
            Comunidades com Maior Risco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={dadosRiscoPorComunidade}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" angle={-45} textAnchor="end" height={100} fontSize={11} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="temperatura_critica" fill="#EF4444" name="Temp. Crítica" />
              <Bar dataKey="temperatura_alta" fill="#F97316" name="Temp. Alta" />
              <Bar dataKey="total_riscos" fill="#8B5CF6" name="Total Riscos" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Radar de Riscos por Categoria */}
      {topIndicadoresRisco.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Radar de Categorias de Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={topIndicadoresRisco.slice(0, 6)}>
                <PolarGrid />
                <PolarAngleAxis dataKey="indicador" fontSize={11} />
                <PolarRadiusAxis />
                <Radar name="Quantidade" dataKey="quantidade" stroke="#E31E24" fill="#E31E24" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}