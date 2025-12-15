import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function GraficoTendencias({ dados, titulo, tipo = 'line' }) {
  const cores = {
    registros: '#3b82f6',
    demandas: '#f59e0b',
    riscos: '#ef4444',
    temperatura: '#8b5cf6'
  };

  const renderGrafico = () => {
    const props = {
      data: dados,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    if (tipo === 'area') {
      return (
        <AreaChart {...props}>
          <defs>
            <linearGradient id="colorRegistros" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={cores.registros} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={cores.registros} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="data" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="registros" 
            stroke={cores.registros} 
            fillOpacity={1} 
            fill="url(#colorRegistros)"
            strokeWidth={2}
          />
        </AreaChart>
      );
    }

    if (tipo === 'bar') {
      return (
        <BarChart {...props}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="data" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar dataKey="registros" fill={cores.registros} radius={[8, 8, 0, 0]} />
          <Bar dataKey="demandas" fill={cores.demandas} radius={[8, 8, 0, 0]} />
        </BarChart>
      );
    }

    return (
      <LineChart {...props}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="data" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="registros" 
          stroke={cores.registros} 
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        {dados[0]?.demandas !== undefined && (
          <Line 
            type="monotone" 
            dataKey="demandas" 
            stroke={cores.demandas} 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        )}
      </LineChart>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {renderGrafico()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}