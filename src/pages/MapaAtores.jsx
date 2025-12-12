import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Network, Users, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import GrafoRedeAtores from '@/components/atores/GrafoRedeAtores';
import AnalisadorConexoes from '@/components/atores/AnalisadorConexoes';
import PerfilAtor from '@/components/atores/PerfilAtor';

export default function MapaAtores() {
  const [conexoes, setConexoes] = useState([]);
  const [atorSelecionado, setAtorSelecionado] = useState(null);

  const { data: atores = [], isLoading } = useQuery({
    queryKey: ['atores-mapa'],
    queryFn: () => base44.entities.Ator.list()
  });

  const { data: liderancas = [] } = useQuery({
    queryKey: ['liderancas-mapa'],
    queryFn: () => base44.entities.LiderancaComunitaria.list()
  });

  const { data: organizacoes = [] } = useQuery({
    queryKey: ['organizacoes-mapa'],
    queryFn: () => base44.entities.ProjetoOrganizacao.list()
  });

  // Consolidar todos os atores
  const todosAtores = [
    ...atores,
    ...liderancas.map(l => ({
      id: l.id,
      nome: l.nome,
      tipo: 'lideranca',
      comunidade: l.comunidade,
      cargo: l.papel_na_comunidade,
      nivel_influencia: 'alto',
      historico_interacoes: 1,
      temas_interesse: []
    })),
    ...organizacoes.map(o => ({
      id: o.id,
      nome: o.nome_oficial,
      tipo: 'associacao',
      comunidade: o.area_de_atuacao,
      nivel_influencia: 'medio',
      historico_interacoes: 1,
      temas_interesse: []
    }))
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Atores')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Network className="w-7 h-7 text-[#2D6A4F]" />
              Mapa de Rede de Atores
            </h2>
            <p className="text-slate-500 mt-1">
              Visualize relacionamentos e influência entre {todosAtores.length} atores
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="grafo" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="grafo" className="gap-2">
            <Network className="w-4 h-4" />
            Visualização de Rede
          </TabsTrigger>
          <TabsTrigger value="analise" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Análise de Conexões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grafo" className="space-y-6">
          <GrafoRedeAtores
            atores={todosAtores}
            conexoes={conexoes}
            onNodeClick={(ator) => setAtorSelecionado(ator)}
          />

          {atorSelecionado && (
            <PerfilAtor
              atorId={atorSelecionado.id}
              onClose={() => setAtorSelecionado(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="analise">
          <AnalisadorConexoes
            atores={todosAtores}
            onConexoesDetectadas={(conns) => setConexoes(conns)}
          />
        </TabsContent>
      </Tabs>

      {todosAtores.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Nenhum ator cadastrado
          </h3>
          <p className="text-slate-600 mb-4">
            Crie registros com participantes para começar a mapear a rede
          </p>
          <Link to={createPageUrl('RegistroUnificado')}>
            <Button className="bg-[#2D6A4F]">
              Criar Primeiro Registro
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}