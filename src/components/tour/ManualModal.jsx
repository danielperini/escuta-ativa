// Modal do Manual do Usuário — gerado a partir de TourModuleRegistry.
// Capítulos agrupados pela mesma estrutura da sidebar reorganizada.
import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TOUR_MODULES, TOUR_GROUPS, getModuloByRoute, getModulosAgrupados
} from '@/lib/tourModuleRegistry';

export default function ManualModal({ aberto, capituloInicial, onClose }) {
  const [search, setSearch] = useState('');
  const [activeRoute, setActiveRoute] = useState('Dashboard');

  useEffect(() => {
    if (aberto && capituloInicial) {
      const m = getModuloByRoute(capituloInicial);
      if (m) setActiveRoute(m.route);
    }
  }, [aberto, capituloInicial]);

  // Sem busca: lista agrupada pela sidebar. Com busca: lista plana filtrada.
  const { top, grupos, byGroup } = useMemo(() => getModulosAgrupados(), []);
  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return TOUR_MODULES.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      (m.features || []).some(f => f.toLowerCase().includes(q))
    );
  }, [search]);

  const activeModule = useMemo(() => getModuloByRoute(activeRoute), [activeRoute]);

  const renderItem = (m, indent = false) => (
    <button
      key={m.route}
      onClick={() => setActiveRoute(m.route)}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs",
        indent && "pl-6",
        activeRoute === m.route ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      )}
    >
      <m.icon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{m.title}</span>
    </button>
  );

  const renderGroupHeader = (g) => (
    <div key={`grp-${g.key}`} className="px-2 pt-2 pb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      <g.icon className="w-3 h-3" />
      {g.title}
    </div>
  );

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
              {filteredModules ? (
                filteredModules.map(m => renderItem(m))
              ) : (
                <>
                  {top.map(m => renderItem(m))}
                  {grupos.map(gKey => {
                    const g = TOUR_GROUPS.find(x => x.key === gKey);
                    if (!g) return null;
                    return (
                      <React.Fragment key={gKey}>
                        {renderGroupHeader(g)}
                        {(byGroup.get(gKey) || []).map(m => renderItem(m, true))}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
              {filteredModules && filteredModules.length === 0 && (
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
                    {activeModule.sidebar_group && (
                      <span className="text-[11px] text-muted-foreground">
                        Grupo: {TOUR_GROUPS.find(g => g.key === activeModule.sidebar_group)?.title}
                      </span>
                    )}
                    {!activeModule.in_sidebar && (
                      <span className="text-[11px] text-muted-foreground"> · acesso indireto (não está no menu lateral)</span>
                    )}
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