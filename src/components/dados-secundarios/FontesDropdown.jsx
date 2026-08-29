import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Layers, Check, X, ChevronDown } from 'lucide-react';
import { FONTES } from '@/lib/publicTerritorialDataService';

export function FontesDropdown({ selecionadas = [], onChange }) {
  const [aberto, setAberto] = useState(false);

  const toggle = (id) => {
    if (selecionadas.includes(id)) {
      onChange(selecionadas.filter(f => f !== id));
    } else {
      onChange([...selecionadas, id]);
    }
  };
  const todas = () => onChange(FONTES.map(f => f.id));
  const limpar = () => onChange([]);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm"
          className="flex items-center gap-2 min-w-44 justify-start">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="flex-1 text-left">Fontes de dados</span>
          {selecionadas.length > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px]">
              {selecionadas.length}
            </Badge>
          )}
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="flex items-center justify-between p-2 border-b border-border">
          <Button variant="ghost" size="sm" onClick={todas} className="h-7 px-2 text-xs">
            <Check className="w-3.5 h-3.5 mr-1" /> Selecionar todas
          </Button>
          <Button variant="ghost" size="sm" onClick={limpar} className="h-7 px-2 text-xs">
            <X className="w-3.5 h-3.5 mr-1" /> Limpar
          </Button>
        </div>
        <ScrollArea className="h-72">
          <div className="p-1">
            {FONTES.map(f => {
              const sel = selecionadas.includes(f.id);
              return (
                <label key={f.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer">
                  <Checkbox checked={sel} onCheckedChange={() => toggle(f.id)} />
                  <span className="text-sm flex-1">{f.nome}</span>
                  {!f.ativo && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      planejado
                    </Badge>
                  )}
                </label>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}