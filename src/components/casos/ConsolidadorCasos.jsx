import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Merge, X } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ConsolidadorCasos({ casos }) {
  const queryClient = useQueryClient();
  const [consolidando, setConsolidando] = useState(false);
  
  // Detectar casos duplicados/similares
  const detectarDuplicatas = () => {
    const grupos = new Map();
    
    casos.forEach(caso => {
      const key = `${caso.comunidade?.toLowerCase()}-${caso.tema?.toLowerCase()}`;
      if (!grupos.has(key)) {
        grupos.set(key, []);
      }
      grupos.get(key).push(caso);
    });
    
    // Retornar apenas grupos com mais de 1 caso
    return Array.from(grupos.values()).filter(grupo => grupo.length > 1);
  };
  
  const duplicatas = detectarDuplicatas();
  
  const consolidarMutation = useMutation({
    mutationFn: async (grupo) => {
      // Manter o caso mais antigo (primeiro criado) como principal
      const [principal, ...secundarios] = grupo.sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );
      
      // Consolidar stakeholders
      const todosStakeholders = [...new Set([
        ...(principal.stakeholders_envolvidos || []),
        ...secundarios.flatMap(c => c.stakeholders_envolvidos || [])
      ])];
      
      // Consolidar histórico
      const todoHistorico = [
        ...(principal.historico_atualizacoes || []),
        ...secundarios.flatMap(c => c.historico_atualizacoes || [])
      ].sort((a, b) => new Date(a.data) - new Date(b.data));
      
      // Atualizar caso principal
      await base44.entities.Caso.update(principal.id, {
        stakeholders_envolvidos: todosStakeholders,
        historico_atualizacoes: [
          ...todoHistorico,
          {
            data: new Date().toISOString(),
            usuario: (await base44.auth.me()).email,
            acao: `Consolidados ${secundarios.length} caso(s) duplicado(s)`,
            observacao: `IDs consolidados: ${secundarios.map(c => c.id).join(', ')}`
          }
        ]
      });
      
      // Deletar casos secundários
      await Promise.all(secundarios.map(c => base44.entities.Caso.delete(c.id)));
      
      return principal.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casos'] });
    }
  });
  
  if (duplicatas.length === 0) return null;
  
  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="w-4 h-4 text-amber-600" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-amber-900">
              {duplicatas.reduce((sum, g) => sum + g.length, 0)} casos similares detectados em {duplicatas.length} grupo(s)
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Consolidar casos duplicados melhora a gestão e evita retrabalho
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setConsolidando(true);
              Promise.all(duplicatas.map(grupo => consolidarMutation.mutateAsync(grupo)))
                .then(() => setConsolidando(false));
            }}
            disabled={consolidando}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Merge className="w-4 h-4 mr-2" />
            Consolidar Todos
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}