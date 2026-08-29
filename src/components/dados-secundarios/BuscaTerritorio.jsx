import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, X, Search, Users, GitCompareArrows, Loader2 } from 'lucide-react';
import { listarMunicipiosDisponiveis, listarComunidadesCadastradas, resolverCodigoIBGE } from '@/lib/publicTerritorialDataService';

/**
 * Busca + multiseleção de territórios (municípios e comunidades).
 * Aceiona callback onSelecaoChange com array de { tipo, nome, uf, ibge, comunidade_id }.
 * Sugere "Comparar territórios" quando 2+ selecionados.
 */
export function BuscaTerritorio({ selecao, onSelecaoChange, onComparar, comparando, carregando }) {
  const [busca, setBusca] = useState('');
  const [foco, setFoco] = useState(false);
  const [municipios, setMunicipios] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [resolvendo, setResolvendo] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [m, c] = await Promise.all([
        listarMunicipiosDisponiveis(),
        listarComunidadesCadastradas()
      ]);
      setMunicipios(m || []);
      setComunidades(c || []);
    })().catch(() => {});
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setFoco(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const q = busca.trim().toLowerCase();
  const sugestoesMun = municipios.filter(m =>
    m.nome.toLowerCase().includes(q) || (m.uf || '').toLowerCase().includes(q)
  );
  const sugestoesCom = comunidades.filter(c =>
    c.nome?.toLowerCase().includes(q) || (c.municipio || '').toLowerCase().includes(q)
  );

  const jaSelecionado = (chave) =>
    selecao.some(s => `${s.nome}|${s.tipo}` === chave);

  const adicionarMunicipio = async (m) => {
    setResolvendo(true);
    const ibge = await resolverCodigoIBGE(m.nome, m.uf);
    setResolvendo(false);
    if (!ibge) {
      alert(`Não foi possível resolver o código IBGE de ${m.nome}/${m.uf}.`);
      return;
    }
    const chave = `${m.nome}/${m.uf}`;
    if (jaSelecionado(`${m.nome}|municipio`)) return;
    onSelecaoChange([...selecao, {
      tipo: 'municipio', nome: m.nome, uf: m.uf,
      ibge: ibge.id, label: chave
    }]);
    setBusca('');
    setFoco(false);
  };

  const adicionarComunidade = (c) => {
    const chave = `${c.nome}|comunidade`;
    if (jaSelecionado(chave)) return;
    onSelecaoChange([...selecao, {
      tipo: 'comunidade', nome: c.nome, uf: c.uf || '',
      municipio: c.municipio, ibge: null, comunidade_id: c.id,
      label: `${c.nome} (comunidade) — ${c.municipio || ''}/${c.uf || ''}`
    }]);
    setBusca('');
    setFoco(false);
  };

  const remover = (idx) => {
    onSelecaoChange(selecao.filter((_, i) => i !== idx));
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 relative">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onFocus={() => setFoco(true)}
            placeholder="Buscar município ou comunidade..."
            className="pl-9"
            disabled={resolvendo}
          />
          {resolvendo && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
          )}
        </div>
        {selecao.length >= 2 && (
          <button
            onClick={onComparar}
            className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border transition-colors ${
              comparando
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            <GitCompareArrows className="w-4 h-4" />
            {comparando ? 'Sair da comparação' : 'Comparar territórios'}
          </button>
        )}
      </div>

      {/* Chips de seleção */}
      {selecao.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {selecao.map((s, i) => (
            <Badge key={i} variant="secondary"
              className="py-1 pl-2 pr-1 text-xs gap-1">
              {s.tipo === 'municipio' ? <MapPin className="w-3 h-3" /> : <Users className="w-3 h-3" />}
              {s.label}
              <button onClick={() => remover(i)} className="ml-1 hover:bg-foreground/10 rounded p-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Sugestões */}
      {foco && q && (
        <div className="absolute z-30 mt-1 w-full max-w-md bg-popover border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto py-1">
          {sugestoesMun.length === 0 && sugestoesCom.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Nenhum município ou comunidade encontrado para "{busca}".
            </p>
          )}
          {sugestoesMun.slice(0, 8).map((m, i) => {
            const chave = `${m.nome}|municipio`;
            const sel = jaSelecionado(chave);
            return (
              <button key={`m${i}`}
                onClick={() => adicionarMunicipio(m)}
                disabled={sel}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left ${
                  sel ? 'opacity-40 cursor-not-allowed' : ''
                }`}>
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="flex-1">{m.nome}/{m.uf}</span>
                {sel && <span className="text-xs text-muted-foreground">já selecionado</span>}
              </button>
            );
          })}
          {sugestoesCom.slice(0, 8).map((c, i) => {
            const chave = `${c.nome}|comunidade`;
            const sel = jaSelecionado(chave);
            return (
              <button key={`c${i}`}
                onClick={() => adicionarComunidade(c)}
                disabled={sel}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left border-t ${sel ? 'opacity-40 cursor-not-allowed' : ''}`}>
                <Users className="w-3.5 h-3.5 text-primary" />
                <span className="flex-1">{c.nome}</span>
                <span className="text-xs text-muted-foreground">{c.municipio || ''}/{c.uf || ''}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}