import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User } from 'lucide-react';

export default function DialogAtribuirResponsavel({ demanda, usuarios, onClose, onAtribuir }) {
  const [responsavelSelecionado, setResponsavelSelecionado] = useState(demanda?.responsavel || '');

  const handleAtribuir = () => {
    if (responsavelSelecionado) {
      onAtribuir(responsavelSelecionado);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Atribuir Responsável
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-900">{demanda?.descricao}</p>
            <p className="text-xs text-slate-600 mt-1">
              Comunidade: {demanda?.comunidade || 'N/A'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Selecione o responsável</Label>
            <Select value={responsavelSelecionado} onValueChange={setResponsavelSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um usuário" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map(usuario => (
                  <SelectItem key={usuario.id} value={usuario.full_name || usuario.email}>
                    {usuario.full_name || usuario.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAtribuir}
            disabled={!responsavelSelecionado}
          >
            Atribuir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}