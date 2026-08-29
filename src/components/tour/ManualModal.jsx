// Modal do Manual do Usuário — gerado a partir de TourModuleRegistry.
// Possui busca e abre diretamente no capítulo da página atual.
import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOUR_MODULES, getModuloByRoute } from '@/lib/tourModuleRegistry';

export default function ManualModal({ aberto, capituloInicial, onClose }) {
  const [search, setSearch] = useState('');
  const [activeRoute, setActiveRoute] = useState('Dashboard');

  useEffect(() => {
    if (aberto && capituloInicial) {
      const m = getModuloByRoute(capituloInicial);
      if (m) setActiveRoute(m.route);
    }
  }, [aberto, capituloInicial]);

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TOUR_MODULES;
    return TOUR_MODULES.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      (m.features || []).some(f => f.toLowerCase().includes(q))
    );
  }, [search]);

  const activeModule = useMemo(() => getModuloByRoute(activeRoute), [activeRoute]);

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 py-3 border-b border-border flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4 text-primary" /> Manual do Usuário — societá.ai
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 flex-1 overflow-hidden">
          {/* Lista de capítulos + busca */}
          <div className="border-r border-border flex flex-col min-h-0">
            <div className="p-2 border-b border-border flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar no manual..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
              {filteredModules.map(m => (
                <button
                  key={m.route}
                  onClick={() => setActiveRoute(m.route)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs",
                    activeRoute === m.route ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <m.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{m.title}</span>
                </button>
              ))}
              {filteredModules.length === 0 && (
                <p className="text-xs text-muted-foreground p-3">Nenhum resultado para "{search}".</p>
              )}
            </div>
          </div>
          {/* Conteúdo do capítulo */}
          <div className="md:col-span-2 overflow-y-auto p-4 space-y-3 min-h-0">
            {activeModule && (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                    <activeModule.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{activeModule.title}</h2>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Para que serve</p>
                  <p className="text-sm mt-1">{activeModule.description}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">O que você encontra aqui</p>
                  <ul className="mt-1 space-y-1">
                    {activeModule.features.map((f, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}