import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, Map, Target, Shield } from 'lucide-react';
import AbaOrganizacao from '@/components/esg/AbaOrganizacao';
import AbaUnidades from '@/components/esg/AbaUnidades';
import AbaEstrategia from '@/components/esg/AbaEstrategia';
import AbaReferenciais from '@/components/esg/AbaReferenciais';

export default function ConfiguracoesESG() {
  const { data: configuracao, isLoading } = useQuery({
    queryKey: ['configuracao-esg'],
    queryFn: async () => {
      const configs = await base44.entities.ConfiguracaoESG.list('-created_date', 1);
      return configs[0] || null;
    }
  });

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Configurações ESG</h1>
          <p className="text-slate-500 mt-1 max-w-3xl">
            Cadastre o grupo ou organização e suas unidades, plantas ou operações territoriais. Estrutura hierárquica: Organização → Unidade → Território → Comunidade.
          </p>
        </div>
      </div>

      <Tabs defaultValue="organizacao" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="organizacao" className="gap-1.5">
            <Building2 className="w-4 h-4" />
            <span className="hidden md:inline">Organização</span>
            <span className="md:hidden">Org.</span>
          </TabsTrigger>
          <TabsTrigger value="unidades" className="gap-1.5">
            <Map className="w-4 h-4" />
            <span className="hidden md:inline">Unidades / Plantas</span>
            <span className="md:hidden">Unidades</span>
          </TabsTrigger>
          <TabsTrigger value="estrategia" className="gap-1.5">
            <Target className="w-4 h-4" />
            <span className="hidden md:inline">Estratégia</span>
            <span className="md:hidden">Estrat.</span>
          </TabsTrigger>
          <TabsTrigger value="referenciais" className="gap-1.5">
            <Shield className="w-4 h-4" />
            <span className="hidden md:inline">Referenciais</span>
            <span className="md:hidden">Ref. ESG</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizacao" className="mt-4">
          <AbaOrganizacao configuracao={configuracao} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="unidades" className="mt-4">
          <AbaUnidades configuracao={configuracao} />
        </TabsContent>
        <TabsContent value="estrategia" className="mt-4">
          {configuracao ? <AbaEstrategia configuracao={configuracao} /> : (
            <div className="p-6 text-center text-slate-500">Cadastre a organização na aba "Organização" antes de configurar estratégias.</div>
          )}
        </TabsContent>
        <TabsContent value="referenciais" className="mt-4">
          {configuracao ? <AbaReferenciais configuracao={configuracao} /> : (
            <div className="p-6 text-center text-slate-500">Cadastre a organização na aba "Organização" antes de configurar referenciais.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}