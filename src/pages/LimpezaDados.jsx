import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from 'lucide-react';
import DetectorDuplicatas from '@/components/sistema/DetectorDuplicatas';

export default function LimpezaDados() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Limpeza de Dados</h2>
        <p className="text-slate-500 mt-1">
          Ferramentas para manutenção e integridade dos dados
        </p>
      </div>

      <DetectorDuplicatas />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-slate-600">Filtro automático de duplicatas</span>
            <span className="font-medium text-emerald-600">✓ Ativo</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-slate-600">Critérios de detecção</span>
            <span className="font-medium">Título + Comunidade + Data</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-600">Validação em tempo real</span>
            <span className="font-medium text-emerald-600">✓ Ativo</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}