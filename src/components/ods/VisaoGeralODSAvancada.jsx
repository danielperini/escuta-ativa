import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Target, TrendingUp, CheckCircle2, AlertCircle, Calendar, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { subMonths, isWithinInterval, startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function VisaoGeralODSAvancada({ acoesPorODS, metas, odsInfo, registros = [] }) {
  const [periodo, setPeriodo] = useState('todos');
  const [tipoAcao, setTipoAcao] = useState('todas');

  // Filtrar registros por período
  const registrosFiltrados = useMemo(() => {
    if (periodo === 'todos') return registros;
    
    const hoje = new Date();
    let dataInicio;
    
    switch(periodo) {
      case '30dias':
        dataInicio = subMonths(hoje, 1);
        break;
      case '3meses':
        dataInicio = subMonths(hoje, 3);
        break;
      case '6meses':
        dataInicio = subMonths(hoje, 6);
        break;
      case '12meses':
        dataInicio = subMonths(hoje, 12);
        break;
      default:
        return registros;
    }
    
    return registros.filter(r => {
      const dataRegistro = new Date(r.data_registro || r.created_date);
      return dataRegistro >= dataInicio;
    });
  }, [registros, periodo]);

  // Filtrar por tipo de ação
  const registrosComFiltroTipo = useMemo(() => {
    if (tipoAcao === 'todas') return registrosFiltrados;
    return registrosFiltrados.filter(r => r.tipo === tipoAcao);
  }, [registrosFiltrados, tipoAcao]);

  // Recalcular ações por ODS com filtros
  const acoesFiltradas = useMemo(() => {
    const contagem = {};
    for (let i = 1; i <= 17; i++) {
      contagem[i] = 0;
    }

    registrosComFiltroTipo.forEach(r => {
      if (r.vinculacao_ods && Array.isArray(r.vinculacao_ods)) {
        r.vinculacao_ods.forEach(ods => {
          if (contagem[ods] !== undefined) {
            contagem[ods]++;
          }
        });
      }
    });

    return contagem;
  }, [registrosComFiltroTipo]);

  const totalAcoesFiltradas = Object.values(acoesFiltradas).reduce((acc, val) => acc + val, 0);
  const odsComAcoesFiltradas = Object.values(acoesFiltradas).filter(val => val > 0).length;
  const metasAtingidas = metas.filter(m => m.status === 'atingida').length;
  const metasAtrasadas = metas.filter(m => m.status === 'atrasada').length;

  // Dados para gráfico comparativo
  const dadosComparativos = useMemo(() => {
    return Object.entries(acoesFiltradas)
      .filter(([_, count]) => count > 0)
      .map(([numero, count]) => {
        const metasODS = metas.filter(m => m.ods_numero === parseInt(numero));
        const progressoMedio = metasODS.length > 0
          ? metasODS.reduce((acc, m) => acc + (m.percentual_conclusao || 0), 0) / metasODS.length
          : 0;
        
        return {
          ods: `ODS ${numero}`,
          numero: parseInt(numero),
          acoes: count,
          progresso: Math.round(progressoMedio),
          metas: metasODS.length,
          cor: odsInfo[numero].cor
        };
      })
      .sort((a, b) => b.acoes - a.acoes);
  }, [acoesFiltradas, metas, odsInfo]);

  // Evolução temporal
  const evolucaoTemporal = useMemo(() => {
    if (periodo === 'todos') return [];
    
    const meses = [];
    const hoje = new Date();
    const numMeses = periodo === '3meses' ? 3 : periodo === '6meses' ? 6 : 12;
    
    for (let i = numMeses - 1; i >= 0; i--) {
      const mes = subMonths(hoje, i);
      const inicio = startOfMonth(mes);
      const fim = endOfMonth(mes);
      
      const registrosMes = registros.filter(r => {
        const data = new Date(r.data_registro || r.created_date);
        return isWithinInterval(data, { start: inicio, end: fim });
      });
      
      const acoesComODS = registrosMes.filter(r => r.vinculacao_ods && r.vinculacao_ods.length > 0).length;
      
      meses.push({
        mes: format(mes, 'MMM/yy', { locale: ptBR }),
        acoes: acoesComODS
      });
    }
    
    return meses;
  }, [registros, periodo]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os registros</SelectItem>
                  <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="3meses">Últimos 3 meses</SelectItem>
                  <SelectItem value="6meses">Últimos 6 meses</SelectItem>
                  <SelectItem value="12meses">Últimos 12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Ação</Label>
              <Select value={tipoAcao} onValueChange={setTipoAcao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as ações</SelectItem>
                  <SelectItem value="reuniao">Reuniões</SelectItem>
                  <SelectItem value="conversa_campo">Conversas de Campo</SelectItem>
                  <SelectItem value="visita">Visitas</SelectItem>
                  <SelectItem value="demanda">Demandas</SelectItem>
                  <SelectItem value="ocorrencia">Ocorrências</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Ações no Período</p>
                <p className="text-3xl font-bold text-blue-600">{totalAcoesFiltradas}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">ODS Ativos</p>
                <p className="text-3xl font-bold text-emerald-600">{odsComAcoesFiltradas}/17</p>
              </div>
              <Target className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Metas Atingidas</p>
                <p className="text-3xl font-bold text-green-600">{metasAtingidas}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Metas Atrasadas</p>
                <p className="text-3xl font-bold text-amber-600">{metasAtrasadas}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Comparativo */}
      {dadosComparativos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparativo: Ações vs Progresso das Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dadosComparativos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ods" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="acoes" fill="#3B82F6" name="Ações Realizadas" />
                <Bar yAxisId="right" dataKey="progresso" fill="#10B981" name="Progresso (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Evolução Temporal */}
      {evolucaoTemporal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução Temporal das Ações ODS</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolucaoTemporal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="acoes" stroke="#3B82F6" strokeWidth={2} name="Ações com ODS" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top ODS no período */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking de ODS no Período Selecionado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dadosComparativos.length > 0 ? dadosComparativos.slice(0, 10).map((item, index) => {
            const info = odsInfo[item.numero];
            return (
              <div key={item.numero} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="text-lg font-bold text-slate-400 w-6">#{index + 1}</div>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: info.cor }}
                >
                  {info.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">ODS {item.numero} - {info.nome}</p>
                  <p className="text-xs text-slate-500">{item.acoes} ações • {item.metas} metas</p>
                </div>
                <Badge style={{ backgroundColor: `${info.cor}20`, color: info.cor }}>
                  {item.progresso}% progresso
                </Badge>
              </div>
            );
          }) : (
            <p className="text-center text-slate-500 py-8">Nenhuma ação encontrada no período selecionado</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}