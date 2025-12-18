import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Target, TrendingUp, Plus, BarChart3, Settings } from 'lucide-react';
import { toast } from 'sonner';
import ODSCard from '@/components/ods/ODSCard';
import GraficoProgressoODS from '@/components/ods/GraficoProgressoODS';
import DialogMetaODS from '@/components/ods/DialogMetaODS';
import VisaoGeralODS from '@/components/ods/VisaoGeralODS';

const ODS_INFO = {
  1: { nome: 'Erradicação da Pobreza', cor: '#E5243B', icon: '🏚️' },
  2: { nome: 'Fome Zero e Agricultura Sustentável', cor: '#DDA63A', icon: '🌾' },
  3: { nome: 'Saúde e Bem-Estar', cor: '#4C9F38', icon: '❤️' },
  4: { nome: 'Educação de Qualidade', cor: '#C5192D', icon: '📚' },
  5: { nome: 'Igualdade de Gênero', cor: '#FF3A21', icon: '⚖️' },
  6: { nome: 'Água Potável e Saneamento', cor: '#26BDE2', icon: '💧' },
  7: { nome: 'Energia Limpa e Acessível', cor: '#FCC30B', icon: '⚡' },
  8: { nome: 'Trabalho Decente e Crescimento Econômico', cor: '#A21942', icon: '📈' },
  9: { nome: 'Indústria, Inovação e Infraestrutura', cor: '#FD6925', icon: '🏗️' },
  10: { nome: 'Redução das Desigualdades', cor: '#DD1367', icon: '🤝' },
  11: { nome: 'Cidades e Comunidades Sustentáveis', cor: '#FD9D24', icon: '🏙️' },
  12: { nome: 'Consumo e Produção Responsáveis', cor: '#BF8B2E', icon: '♻️' },
  13: { nome: 'Ação Contra a Mudança Global do Clima', cor: '#3F7E44', icon: '🌍' },
  14: { nome: 'Vida na Água', cor: '#0A97D9', icon: '🐟' },
  15: { nome: 'Vida Terrestre', cor: '#56C02B', icon: '🌳' },
  16: { nome: 'Paz, Justiça e Instituições Eficazes', cor: '#00689D', icon: '⚖️' },
  17: { nome: 'Parcerias e Meios de Implementação', cor: '#19486A', icon: '🤝' }
};

export default function ODSPage() {
  const queryClient = useQueryClient();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('visao-geral');

  const { data: metas = [] } = useQuery({
    queryKey: ['metas-ods'],
    queryFn: () => base44.entities.MetaODS.list('-created_date', 200)
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-ods'],
    queryFn: () => base44.entities.Registro.list('-created_date', 1000)
  });

  // Calcular ações por ODS
  const acoesPorODS = React.useMemo(() => {
    const contagem = {};
    for (let i = 1; i <= 17; i++) {
      contagem[i] = 0;
    }

    registros.forEach(r => {
      if (r.vinculacao_ods && Array.isArray(r.vinculacao_ods)) {
        r.vinculacao_ods.forEach(ods => {
          if (contagem[ods] !== undefined) {
            contagem[ods]++;
          }
        });
      }
    });

    return contagem;
  }, [registros]);

  const handleNovaMeta = () => {
    setMetaSelecionada(null);
    setDialogAberto(true);
  };

  const handleEditarMeta = (meta) => {
    setMetaSelecionada(meta);
    setDialogAberto(true);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Objetivos de Desenvolvimento Sustentável</h1>
          <p className="text-slate-500 mt-1">Monitore o progresso e gerencie metas alinhadas aos ODS da ONU</p>
        </div>
        <Button onClick={handleNovaMeta} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta ODS
        </Button>
      </div>

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="visao-geral">
            <Globe className="w-4 h-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="metas">
            <Target className="w-4 h-4 mr-2" />
            Metas
          </TabsTrigger>
          <TabsTrigger value="graficos">
            <BarChart3 className="w-4 h-4 mr-2" />
            Gráficos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6 mt-6">
          <VisaoGeralODS 
            acoesPorODS={acoesPorODS} 
            metas={metas}
            odsInfo={ODS_INFO}
          />
        </TabsContent>

        <TabsContent value="metas" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(ODS_INFO).map(num => {
              const numero = parseInt(num);
              const info = ODS_INFO[numero];
              const metasODS = metas.filter(m => m.ods_numero === numero);
              const totalAcoes = acoesPorODS[numero] || 0;

              return (
                <ODSCard
                  key={numero}
                  numero={numero}
                  nome={info.nome}
                  cor={info.cor}
                  icon={info.icon}
                  totalAcoes={totalAcoes}
                  metas={metasODS}
                  onEditarMeta={handleEditarMeta}
                  onNovaMeta={() => {
                    setMetaSelecionada({ ods_numero: numero, ods_nome: info.nome });
                    setDialogAberto(true);
                  }}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="graficos" className="space-y-6 mt-6">
          <GraficoProgressoODS 
            acoesPorODS={acoesPorODS}
            metas={metas}
            odsInfo={ODS_INFO}
          />
        </TabsContent>
      </Tabs>

      <DialogMetaODS
        aberto={dialogAberto}
        onFechar={() => {
          setDialogAberto(false);
          setMetaSelecionada(null);
        }}
        meta={metaSelecionada}
        odsInfo={ODS_INFO}
      />
    </div>
  );
}