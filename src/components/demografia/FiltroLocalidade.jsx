import React, { useState, useEffect } from 'react';
import { listarEstados, listarMunicipios } from '@/lib/demografiaApi';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Loader2, MapPin, Building2 } from 'lucide-react';

/**
 * Bloco de filtros UF + Município.
 * Ao trocar a UF, recarrega a lista de municípios dinamicamente.
 */
export default function FiltroLocalidade({ uf, municipioId, onEstadoChange, onMunicipioChange, carregandoMun }) {
  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [carregandoEstados, setCarregandoEstados] = useState(true);
  const [carregandoMunInterno, setCarregandoMunInterno] = useState(false);

  // Carrega UFs uma única vez
  useEffect(() => {
    (async () => {
      try {
        const lista = await listarEstados();
        setEstados(lista);
      } catch (e) {
        console.error('Erro ao carregar estados:', e);
      } finally {
        setCarregandoEstados(false);
      }
    })();
  }, []);

  // Carrega municípios quando muda a UF
  useEffect(() => {
    if (!uf) { setMunicipios([]); return; }
    setCarregandoMunInterno(true);
    setMunicipios([]);
    listarMunicipios(uf)
      .then(setMunicipios)
      .catch(e => console.error('Erro ao carregar municípios:', e))
      .finally(() => setCarregandoMunInterno(false));
  }, [uf]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label className="mb-1.5 block text-sm font-medium">Estado (UF)</Label>
        <Select
          value={uf || ''}
          onValueChange={(v) => onEstadoChange(v)}
          disabled={carregandoEstados}
        >
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder={carregandoEstados ? 'Carregando…' : 'Selecione o estado'} />
            </div>
          </SelectTrigger>
          <SelectContent>
            {estados.map(e => (
              <SelectItem key={e.id} value={e.sigla}>{e.nome} ({e.sigla})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1.5 block text-sm font-medium">Município (opcional)</Label>
        <Select
          value={municipioId || ''}
          onValueChange={(v) => onMunicipioChange(v === 'todos' ? '' : v)}
          disabled={!uf || carregandoMunInterno}
        >
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder={
                !uf ? 'Selecione um estado primeiro' :
                carregandoMunInterno || carregandoMun ? 'Carregando…' :
                'Todo o estado'
              } />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo o estado</SelectItem>
            {municipios.map(m => (
              <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}