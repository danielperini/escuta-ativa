import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function ContatosCustomizados({ stakeholder }) {
  const [adicionando, setAdicionando] = useState(false);
  const [novoContato, setNovoContato] = useState({ tipo: '', valor: '', principal: false });
  
  const queryClient = useQueryClient();
  const contatos = stakeholder.contatos_customizados || [];

  const salvarContatoMutation = useMutation({
    mutationFn: async (contato) => {
      const contatosAtualizados = [...contatos, contato];
      await base44.entities.Stakeholder.update(stakeholder.id, {
        contatos_customizados: contatosAtualizados
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stakeholder', stakeholder.id]);
      setAdicionando(false);
      setNovoContato({ tipo: '', valor: '', principal: false });
      toast.success('Contato adicionado!');
    }
  });

  const excluirContatoMutation = useMutation({
    mutationFn: async (contatoParaExcluir) => {
      const contatosAtualizados = contatos.filter(c => c !== contatoParaExcluir);
      await base44.entities.Stakeholder.update(stakeholder.id, {
        contatos_customizados: contatosAtualizados
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stakeholder', stakeholder.id]);
      toast.success('Contato excluído!');
    }
  });

  const marcarPrincipalMutation = useMutation({
    mutationFn: async (contatoPrincipal) => {
      const contatosAtualizados = contatos.map(c => ({
        ...c,
        principal: c === contatoPrincipal
      }));
      await base44.entities.Stakeholder.update(stakeholder.id, {
        contatos_customizados: contatosAtualizados
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stakeholder', stakeholder.id]);
      toast.success('Contato principal atualizado!');
    }
  });

  const handleSalvar = () => {
    if (!novoContato.tipo || !novoContato.valor) {
      toast.error('Preencha tipo e valor do contato');
      return;
    }
    salvarContatoMutation.mutate(novoContato);
  };

  const contatosPadrao = [
    { tipo: 'Telefone', valor: stakeholder.contato?.telefone, icone: Phone },
    { tipo: 'WhatsApp', valor: stakeholder.contato?.whatsapp, icone: Phone },
    { tipo: 'Email', valor: stakeholder.contato?.email, icone: Mail }
  ].filter(c => c.valor);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contatos
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAdicionando(!adicionando)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário de Novo Contato */}
        {adicionando && (
          <div className="p-4 bg-slate-50 rounded-lg border-2 border-blue-200 space-y-3">
            <Input
              placeholder="Tipo (ex: Telegram, LinkedIn, Instagram)"
              value={novoContato.tipo}
              onChange={(e) => setNovoContato({ ...novoContato, tipo: e.target.value })}
            />
            <Input
              placeholder="Valor do contato"
              value={novoContato.valor}
              onChange={(e) => setNovoContato({ ...novoContato, valor: e.target.value })}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={novoContato.principal}
                onChange={(e) => setNovoContato({ ...novoContato, principal: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm flex items-center gap-1">
                <Star className="w-3 h-3" />
                Contato principal
              </span>
            </label>
            
            <div className="flex gap-2">
              <Button onClick={handleSalvar} className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332]">
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setAdicionando(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Contatos Padrão */}
        {contatosPadrao.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">Contatos Principais</p>
            {contatosPadrao.map((contato, idx) => {
              const Icone = contato.icone;
              return (
                <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Icone className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">{contato.tipo}</p>
                    <p className="text-sm font-medium text-slate-900">{contato.valor}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Contatos Customizados */}
        {contatos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">Contatos Adicionais</p>
            {contatos.map((contato, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Phone className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500">{contato.tipo}</p>
                    {contato.principal && (
                      <Badge className="bg-amber-100 text-amber-700">
                        <Star className="w-3 h-3 mr-1" />
                        Principal
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-900">{contato.valor}</p>
                </div>
                <div className="flex gap-1">
                  {!contato.principal && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => marcarPrincipalMutation.mutate(contato)}
                      title="Marcar como principal"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                    onClick={() => excluirContatoMutation.mutate(contato)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {contatos.length === 0 && contatosPadrao.length === 0 && !adicionando && (
          <div className="text-center py-8 text-slate-500">
            <Phone className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Nenhum contato cadastrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}