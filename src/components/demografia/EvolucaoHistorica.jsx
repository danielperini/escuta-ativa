import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2, LineChart as LineIcon, AlertTriangle, RefreshCw, History
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { obterIpeadata } from '@/lib/demografiaApi';

const SERIE_PADRAO = { q: 'Expectativa de vida' };

/**
 * Linha do tempo histórica de uma série do Ipeadata.
 * Chama a função backend `consultarIpeadata` que busca no site do Ipea
 * (HTTP + sem CORS) e devolve os valores normalizados por ano.
 */
export default function EvolucaoHistorica() {
  const [data, setData] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = async (payload = SERIE_PADRAO) => {
    setCarregando(true);
    setErro(null);
    setData(null);
    try {
      const res = await obterIpeadata(payload);
      if (res?.error) {
        setErro(res.error);
      } else if (res?.valores?.length) {
        setData(res);
      } else {
        setErro('Nenhum valor retornado para a série.');
      }
    } catch (e) {
      setErro(e?.message || 'Falha inesperada ao consultar o Ipeadata.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const valores = data?.valores || [];
  const serieNome = data?.serie?.nome || 'Série histórica';
  const unidade = data?.serie?.unidade || '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="w-5 h-5 text-primary" />
              Evolução Histórica — Ipeadata
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {data?.serie?.nome || 'Expectativa de vida ao nascer e séries sociais'}
            </p>
          </div>
          <button onClick={() => carregar()} disabled={carregando}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="flex flex-col items-center justify-center h-72 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Consultando a API do Ipeadata (pode levar até 20s)…
            </p>
          </div>
        ) : erro ? (
          <div className="flex flex-col items-center justify-center h-72 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
            <p className="text-sm text-muted-foreground max-w-md">{erro}</p>
            <p className="text-xs text-muted-foreground mt-2">
              A API governamental do Ipeadata pode estar fora do ar ou lenta.
              Tente novamente em instantes.
            </p>
          </div>
        ) : valores.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">Sem dados.</p>
        ) : (
          <>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={valores} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }}
                    tickFormatter={v => Number(v).toLocaleString('pt-BR')} />
                  <Tooltip
                    formatter={(v) => [`${Number(v).toLocaleString('pt-BR', {maximumFractionDigits: 2})} ${unidade}`, serieNome]}
                    labelFormatter={(l) => `Ano: ${l}`}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="valor" name={serieNome}
                    stroke="#14557A" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {data?.alternativas?.length > 0 && (
              <div className="mt-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Outras séries relacionadas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.alternativas.slice(0, 5).map((a, i) => (
                    <button key={i}
                      onClick={() => carregar({ codigo: a.codigo })}
                      className="px-2 py-0.5 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                      {a.nome?.slice(0, 40)}…
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Fonte: Ipeadata (API de consulta • serviço data.aspx/odata4).
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}