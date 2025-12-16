import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Settings } from 'lucide-react';
import CentralNotificacoesComponent from '@/components/notificacoes/CentralNotificacoes';
import PreferenciasNotificacoes from '@/components/notificacoes/PreferenciasNotificacoes';

export default function CentralNotificacoesPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Notificações</h1>
        <p className="text-slate-500 mt-1">Gerencie alertas e preferências de notificações</p>
      </div>

      <Tabs defaultValue="central" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="central" className="gap-2">
            <Bell className="w-4 h-4" />
            Central de Notificações
          </TabsTrigger>
          <TabsTrigger value="preferencias" className="gap-2">
            <Settings className="w-4 h-4" />
            Preferências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="central" className="mt-6">
          <CentralNotificacoesComponent />
        </TabsContent>

        <TabsContent value="preferencias" className="mt-6">
          <PreferenciasNotificacoes />
        </TabsContent>
      </Tabs>
    </div>
  );
}