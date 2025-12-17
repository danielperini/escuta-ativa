import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DetectorDuplicatas() {
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const queryClient = useQueryClient();

  const detectarDuplicatas = async () => {
    setProcessando(true);
    try {
      // Registros
      const registros = await base44.entities.Registro.list('-created_date', 500);
      const registrosDuplicados = encontrarDuplicatas(registros, [
        r => `${r.titulo?.toLowerCase().trim()}-${r.comunidade?.toLowerCase().trim()}-${r.data_registro}`
      ]);

      // Casos
      const casos = await base44.entities.Caso.list('-created_date', 500);
      const casosDuplicados = encontrarDuplicatas(casos, [
        c => `${c.titulo?.toLowerCase().trim()}-${c.comunidade?.toLowerCase().trim()}`
      ]);

      // Riscos Sociais
      const riscos = await base44.entities.RiscoSocial.list('-created_date', 500);
      const riscosDuplicados = encontrarDuplicatas(riscos, [
        r => `${r.titulo?.toLowerCase().trim()}-${r.comunidade?.toLowerCase().trim()}`
      ]);

      // Stakeholders
      const stakeholders = await base44.entities.Stakeholder.list('-created_date', 500);
      const stakeholdersDuplicados = encontrarDuplicatas(stakeholders, [
        s => `${s.nome?.toLowerCase().trim()}-${s.comunidade?.toLowerCase().trim()}`
      ]);

      setResultado({
        registros: registrosDuplicados,
        casos: casosDuplicados,
        riscos: riscosDuplicados,
        stakeholders: stakeholdersDuplicados
      });

      const total = registrosDuplicados.length + casosDuplicados.length + 
                    riscosDuplicados.length + stakeholdersDuplicados.length;

      toast.success(`Análise concluída: ${total} duplicatas encontradas`);
    } catch (error) {
      toast.error('Erro ao detectar duplicatas: ' + error.message);
    } finally {
      setProcessando(false);
    }
  };

  const encontrarDuplicatas = (items, keyGenerators) => {
    const seen = new Map();
    const duplicatas = [];

    items.forEach(item => {
      for (const keyGen of keyGenerators) {
        const key = keyGen(item);
        if (key && key !== 'undefined-undefined' && key !== '--') {
          if (seen.has(key)) {
            duplicatas.push({
              item,
              original: seen.get(key),
              key
            });
          } else {
            seen.set(key, item);
          }
        }
      }
    });

    return duplicatas;
  };

  const removerDuplicata = async (entidade, id) => {
    try {
      await base44.entities[entidade].delete(id);
      toast.success('Duplicata removida');
      await detectarDuplicatas();
      queryClient.invalidateQueries();
    } catch (error) {
      toast.error('Erro ao remover: ' + error.message);
    }
  };

  const limparTodasDuplicatas = async () => {
    if (!confirm('Remover TODAS as duplicatas? Esta ação não pode ser desfeita!')) return;

    setProcessando(true);
    try {
      let removidos = 0;

      // Remover duplicatas de registros
      for (const dup of resultado.registros) {
        await base44.entities.Registro.delete(dup.item.id);
        removidos++;
      }

      // Remover duplicatas de casos
      for (const dup of resultado.casos) {
        await base44.entities.Caso.delete(dup.item.id);
        removidos++;
      }

      // Remover duplicatas de riscos
      for (const dup of resultado.riscos) {
        await base44.entities.RiscoSocial.delete(dup.item.id);
        removidos++;
      }

      // Remover duplicatas de stakeholders
      for (const dup of resultado.stakeholders) {
        await base44.entities.Stakeholder.delete(dup.item.id);
        removidos++;
      }

      toast.success(`${removidos} duplicatas removidas com sucesso!`);
      setResultado(null);
      queryClient.invalidateQueries();
    } catch (error) {
      toast.error('Erro ao limpar duplicatas: ' + error.message);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Detector de Duplicatas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Analisa registros, casos, riscos sociais e stakeholders para encontrar duplicatas baseadas em 
          título/nome, comunidade e data.
        </p>

        <Button
          onClick={detectarDuplicatas}
          disabled={processando}
          className="w-full gap-2"
        >
          {processando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              Iniciar Análise
            </>
          )}
        </Button>

        {resultado && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 mb-1">Registros</p>
                <p className="text-2xl font-bold text-blue-900">{resultado.registros.length}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-700 mb-1">Casos</p>
                <p className="text-2xl font-bold text-purple-900">{resultado.casos.length}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-xs text-red-700 mb-1">Riscos</p>
                <p className="text-2xl font-bold text-red-900">{resultado.riscos.length}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <p className="text-xs text-emerald-700 mb-1">Stakeholders</p>
                <p className="text-2xl font-bold text-emerald-900">{resultado.stakeholders.length}</p>
              </div>
            </div>

            {(resultado.registros.length + resultado.casos.length + 
              resultado.riscos.length + resultado.stakeholders.length) > 0 && (
              <>
                <Button
                  onClick={limparTodasDuplicatas}
                  disabled={processando}
                  variant="destructive"
                  className="w-full gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover Todas as Duplicatas
                </Button>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {resultado.registros.map((dup, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded border text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-1">Registro</Badge>
                          <p className="font-medium">{dup.item.titulo}</p>
                          <p className="text-xs text-slate-500">
                            {dup.item.comunidade} • {dup.item.data_registro}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removerDuplicata('Registro', dup.item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {resultado.casos.map((dup, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded border text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-1">Caso</Badge>
                          <p className="font-medium">{dup.item.titulo}</p>
                          <p className="text-xs text-slate-500">{dup.item.comunidade}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removerDuplicata('Caso', dup.item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {resultado.riscos.map((dup, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded border text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-1">Risco Social</Badge>
                          <p className="font-medium">{dup.item.titulo}</p>
                          <p className="text-xs text-slate-500">{dup.item.comunidade}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removerDuplicata('RiscoSocial', dup.item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {resultado.stakeholders.map((dup, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded border text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-1">Stakeholder</Badge>
                          <p className="font-medium">{dup.item.nome}</p>
                          <p className="text-xs text-slate-500">{dup.item.comunidade}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removerDuplicata('Stakeholder', dup.item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {(resultado.registros.length + resultado.casos.length + 
              resultado.riscos.length + resultado.stakeholders.length) === 0 && (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                <p className="font-medium text-emerald-900">Nenhuma duplicata encontrada!</p>
                <p className="text-sm text-slate-500">Seu banco de dados está limpo.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}