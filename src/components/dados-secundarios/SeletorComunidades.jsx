import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Users, Home, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * SeletorComunidades — multiseleção de comunidades dos municípios selecionados.
 * Renderiza apenas quando há comunidades cadastradas para os municípios atuais.
 * Quando não há comunidades, mostra discreta "Nenhuma comunidade cadastra neste município".
 * Aviso legal: dados PÚBLICOS municipais não são apresentados como específicos de comunidade.
 */
export function SeletorComunidades({ municipios, comunidades, selecionadas, onChange }) {
  const lista = useMemo(() => comunidades || [], [comunidades]);

  // Não há município selecionado → não renderiza
  if (!municipios || municipios.length === 0) return null;

  // Não há comunidades cadastradas → mensagem discreta
  if (lista.length === 0) {
    return (
      <Card className="p-3">
        <div className="flex items-start gap-2 text-sm">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-muted-foreground">Nenhuma comunidade cadastrada neste município.</p>
            <Link
              to={createPageUrl('ComunidadesGrupos')}
              className="text-xs text-primary hover:underline mt-0.5 inline-flex items-center gap-1"
            >
              <Home className="w-3 h-3" /> Cadastrar comunidade
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const todas = selecionadas.length === 0 || selecionadas.length === lista.length;
  const toggleTodas = () => onChange(todas ? [] : lista.map(c => c.id));
  const toggleUma = (id) => {
    if (selecionadas.includes(id)) {
      onChange(selecionadas.filter(x => x !== id));
    } else {
      onChange([...selecionadas, id]);
    }
  };

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="w-4 h-4 text-primary" />
          Comunidades ({lista.length})
        </div>
        <Button variant="ghost" size="sm" onClick={toggleTodas} className="text-xs">
          {todas ? 'Limpar seleção' : 'Selecionar todas'}
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {lista.map(c => {
          const checked = selecionadas.includes(c.id);
          const municipioAcima = municipios.find(m => m.nome === c.municipio);
          return (
            <div
              key={c.id}
              className="flex items-center gap-2 p-1.5 hover:bg-muted/40 rounded cursor-pointer"
              onClick={() => toggleUma(c.id)}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggleUma(c.id)}
              />
              <span className="text-sm text-foreground">{c.nome}</span>
              {c.municipio && (
                <span className="text-[11px] text-muted-foreground">
                  · {c.municipio}{municipioAcima?.uf ? `/${municipioAcima.uf}` : ''}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2 italic">
        Dados públicos municipais continuam sendo apresentados como contexto geral — não como dados específicos da comunidade.
      </p>
    </Card>
  );
}