import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link2, X, Search, Calendar } from 'lucide-react';

export default function VinculadorRegistros({ registrosVinculados = [], onVincular, comunidadeAtual }) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [busca, setBusca] = useState('');

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-para-vincular', comunidadeAtual],
    queryFn: async () => {
      if (!comunidadeAtual) return [];
      const todos = await base44.entities.Registro.list('-created_date', 100);
      return todos.filter(r => r.comunidade === comunidadeAtual);
    },
    enabled: !!comunidadeAtual
  });

  const registrosFiltrados = registros.filter(r => {
    if (!busca) return true;
    return r.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
           r.descricao?.toLowerCase().includes(busca.toLowerCase());
  });

  const registrosDetalhes = registros.filter(r => registrosVinculados.includes(r.id));

  const toggleVinculo = (registroId) => {
    if (registrosVinculados.includes(registroId)) {
      onVincular(registrosVinculados.filter(id => id !== registroId));
    } else {
      onVincular([...registrosVinculados, registroId]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#E31E24]" />
            Registros Relacionados
            {registrosVinculados.length > 0 && (
              <Badge>{registrosVinculados.length}</Badge>
            )}
          </div>
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={!comunidadeAtual}>
                <Link2 className="w-4 h-4 mr-2" />
                Vincular Registros
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Vincular Registros da mesma Comunidade</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar registros..."
                    className="pl-10"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {registrosFiltrados.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                      Nenhum registro encontrado nesta comunidade
                    </p>
                  ) : (
                    registrosFiltrados.map(registro => (
                      <div
                        key={registro.id}
                        className={`
                          border rounded-lg p-3 cursor-pointer transition-all
                          ${registrosVinculados.includes(registro.id)
                            ? 'border-[#E31E24] bg-red-50'
                            : 'hover:border-slate-300'
                          }
                        `}
                        onClick={() => toggleVinculo(registro.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{registro.titulo}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(registro.data_registro || registro.created_date).toLocaleDateString('pt-BR')}
                              <Badge variant="outline" className="text-xs">
                                {registro.tipo}
                              </Badge>
                            </div>
                          </div>
                          {registrosVinculados.includes(registro.id) && (
                            <Badge className="bg-[#E31E24]">Vinculado</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogAberto(false)}>
                  Fechar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {registrosDetalhes.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-2">
            Nenhum registro vinculado. Vincule registros relacionados para criar uma linha do tempo.
          </p>
        ) : (
          <div className="space-y-2">
            {registrosDetalhes.map(registro => (
              <div
                key={registro.id}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{registro.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(registro.data_registro || registro.created_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleVinculo(registro.id)}
                >
                  <X className="w-4 h-4 text-slate-600" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}