import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';
import { MapPin, Search, LocateFixed, Loader2 } from 'lucide-react';

// Fix default Leaflet marker icon (Vite bundler quebra os caminhos relativos)
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Municípios-base da societá.ai (código IBGE + coordenadas centrais para o mapa)
const MUNICIPIOS_BASE = [
  { nome: 'Matozinhos', estado: 'MG', ibge: '3141305', lat: -19.5613, lng: -44.0877 },
  { nome: 'Sete Lagoas', estado: 'MG', ibge: '3167206', lat: -19.4665, lng: -44.2477 },
  { nome: 'Arcos', estado: 'MG', ibge: '3104201', lat: -20.2891, lng: -45.4228 },
  { nome: 'Cataguases', estado: 'MG', ibge: '3114400', lat: -21.3858, lng: -42.6897 },
  { nome: 'Recife', estado: 'PE', ibge: '2611606', lat: -8.0476, lng: -34.8770 },
  { nome: 'Belo Horizonte', estado: 'MG', ibge: '3106200', lat: -19.9166, lng: -43.9345 },
  { nome: 'Colatina', estado: 'ES', ibge: '3203202', lat: -19.5171, lng: -40.6319 },
  { nome: 'São Francisco do Sul', estado: 'SC', ibge: '4216205', lat: -26.2437, lng: -48.6406 },
];

const TIPO_OPCOES = [
  { value: 'bairro', label: 'Bairro' },
  { value: 'vila', label: 'Vila' },
  { value: 'comunidade', label: 'Comunidade' },
  { value: 'comunidade_rural', label: 'Comunidade Rural' },
  { value: 'distrito', label: 'Distrito' },
  { value: 'localidade', label: 'Localidade' },
  { value: 'povoado', label: 'Povoado' },
  { value: 'assentamento', label: 'Assentamento' },
  { value: 'ocupacao', label: 'Ocupação' },
  { value: 'conjunto_habitacional', label: 'Conjunto Habitacional' },
  { value: 'territorio_tradicional', label: 'Território Tradicional' },
  { value: 'quilombo', label: 'Quilombo' },
  { value: 'indigena', label: 'Indígena' },
  { value: 'favela', label: 'Favela' },
  { value: 'outro', label: 'Outro' },
];

// Sincroniza o mapa quando o centro/zoom mudam e captura clicks
function MapSync({ centro, zoom, onMapClick }) {
  const map = useMap();
  useEffect(() => {
    if (centro) {
      map.setView(centro, zoom, { animate: true });
      const t = setTimeout(() => map.invalidateSize(), 250);
      return () => clearTimeout(t);
    }
  }, [centro?.[0], centro?.[1], zoom, map]);
  useMapEvents({
    click: (e) => onMapClick && onMapClick(e.latlng),
  });
  return null;
}

const INITIAL_FORM = {
  nome: '', tipo: 'bairro', municipio: '', estado: '', municipality_ibge_code: '',
  endereco: '', cep: '', lat: '', lng: '',
  populacao_estimada: '', numero_familias: '',
  area_urbana_rural: 'nao_informado', descricao: '',
};

export default function ModalNovaComunidade({ open, onOpenChange, municipiosExistentes = [] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(INITIAL_FORM);
  const [municipioBusca, setMunicipioBusca] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [enderecoBusca, setEnderecoBusca] = useState('');
  const [buscandoEnd, setBuscandoEnd] = useState(false);
  const [geolocando, setGeolocando] = useState(false);
  const [mapaCentro, setMapaCentro] = useState(null);
  const [mapaZoom, setMapaZoom] = useState(12);
  const [marcador, setMarcador] = useState(null);
  const [saving, setSaving] = useState(false);

  // Reset form quando o modal abre
  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM);
      setMarcador(null);
      setMapaCentro(null);
      setMunicipioBusca('');
      setEnderecoBusca('');
    }
  }, [open]);

  // Lista unificada de municípios (base + cadastrados)
  const municipiosLista = useMemo(() => {
    const mapa = new Map();
    MUNICIPIOS_BASE.forEach((m) => mapa.set(`${m.nome}/${m.estado}`, m));
    municipiosExistentes.forEach((m) => {
      if (!m?.nome) return;
      const key = `${m.nome}/${m.estado || ''}`;
      if (!mapa.has(key)) {
        mapa.set(key, {
          nome: m.nome, estado: m.estado || '', ibge: m.ibge || '',
          lat: m.lat || null, lng: m.lng || null,
        });
      }
    });
    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [municipiosExistentes]);

  const municipiosFiltrados = useMemo(() => {
    if (!municipioBusca.trim()) return municipiosLista;
    const b = municipioBusca.toLowerCase();
    return municipiosLista.filter((m) => m.nome.toLowerCase().includes(b) || (m.estado || '').toLowerCase().includes(b));
  }, [municipiosLista, municipioBusca]);

  const selecionarMunicipio = (m) => {
    setForm((f) => ({ ...f, municipio: m.nome, estado: m.estado || '', municipality_ibge_code: m.ibge || '' }));
    if (m.lat != null && m.lng != null) {
      setMapaCentro([m.lat, m.lng]);
      setMapaZoom(12);
    }
    setPopoverOpen(false);
  };

  const latValido = (lat, lng) => {
    const la = parseFloat(lat); const ln = parseFloat(lng);
    return !isNaN(la) && !isNaN(ln) && la >= -90 && la <= 90 && ln >= -180 && ln <= 180;
  };

  const buildCentro = () => {
    if (mapaCentro) return mapaCentro;
    if (form.lat && form.lng && latValido(form.lat, form.lng)) {
      return [parseFloat(form.lat), parseFloat(form.lng)];
    }
    return null;
  };
  const centroParaMapa = buildCentro();
  const temCentro = !!centroParaMapa;
  const zoomParaMapa = mapaZoom || (form.lat && form.lng ? 15 : 12);

  const buscarEndereco = async () => {
    if (!enderecoBusca.trim()) return;
    setBuscandoEnd(true);
    try {
      const q = `${enderecoBusca}${form.municipio ? ', ' + form.municipio : ''}${form.estado ? ' - ' + form.estado : ''}, Brasil`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
      const json = await res.json();
      if (json && json[0]) {
        const lat = parseFloat(json[0].lat);
        const lng = parseFloat(json[0].lon);
        setForm((f) => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
        setMarcador([lat, lng]);
        setMapaCentro([lat, lng]);
        setMapaZoom(16);
      } else {
        toast.info('Endereço não encontrado. Tente outro termo.');
      }
    } catch (e) {
      toast.error('Erro ao buscar endereço.');
    } finally {
      setBuscandoEnd(false);
    }
  };

  const usarMinhaLocalizacao = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada pelo navegador.');
      return;
    }
    setGeolocando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm((f) => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
        setMarcador([lat, lng]);
        setMapaCentro([lat, lng]);
        setMapaZoom(15);
        setGeolocando(false);
      },
      () => {
        toast.error('Permissão de localização negada ou indisponível.');
        setGeolocando(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onMapClick = (latlng) => {
    setForm((f) => ({ ...f, lat: latlng.lat.toFixed(6), lng: latlng.lng.toFixed(6) }));
    setMarcador([latlng.lat, latlng.lng]);
  };

  const onMarkerDrag = (e) => {
    const ll = e.target.getLatLng();
    setForm((f) => ({ ...f, lat: ll.lat.toFixed(6), lng: ll.lng.toFixed(6) }));
    setMarcador([ll.lat, ll.lng]);
  };

  // Lat/lng manualmente → ajustar marcador e recentro se ficou sem centro
  useEffect(() => {
    if (form.lat && form.lng && latValido(form.lat, form.lng)) {
      const la = parseFloat(form.lat); const ln = parseFloat(form.lng);
      if (!marcador || marcador[0] !== la || marcador[1] !== ln) {
        setMarcador([la, ln]);
      }
      if (!mapaCentro) {
        setMapaCentro([la, ln]);
        setMapaZoom(15);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.lat, form.lng]);

  const salvar = async () => {
    if (!form.nome.trim()) { toast.error('Informe o Nome da comunidade.'); return; }
    if (!form.tipo) { toast.error('Selecione o Tipo.'); return; }
    if (!form.municipio.trim()) { toast.error('Selecione o Município.'); return; }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        tipo: form.tipo,
        municipio: form.municipio.trim(),
        estado: form.estado || '',
      };
      if (form.municipality_ibge_code) payload.municipality_ibge_code = form.municipality_ibge_code;
      if (form.endereco?.trim()) payload.endereco = form.endereco.trim();
      if (form.cep?.trim()) payload.cep = form.cep.trim();
      if (form.populacao_estimada !== '') payload.populacao_estimada = Number(form.populacao_estimada);
      if (form.numero_familias !== '') payload.numero_familias = Number(form.numero_familias);
      if (form.area_urbana_rural && form.area_urbana_rural !== 'nao_informado') payload.area_urbana_rural = form.area_urbana_rural;
      if (form.descricao?.trim()) payload.descricao = form.descricao.trim();
      if (form.lat !== '' && form.lng !== '' && latValido(form.lat, form.lng)) {
        payload.localizacao = { lat: parseFloat(form.lat), lng: parseFloat(form.lng) };
      }
      await base44.entities.Comunidade.create(payload);
      queryClient.invalidateQueries({ queryKey: ['comunidades-gestao'] });
      queryClient.invalidateQueries({ queryKey: ['registros-comunidades'] });
      toast.success('Comunidade cadastrada com sucesso.');
      onOpenChange(false);
    } catch (e) {
      toast.error('Erro ao cadastrar: ' + (e.message || 'tente novamente'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[820px] max-h-[90vh] h-[90vh] w-[95vw] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border bg-card">
          <DialogTitle className="text-lg">Nova Comunidade Territorial</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* === IDENTIFICAÇÃO === */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
              Identificação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome da comunidade *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Vila Nova"
                />
              </div>
              <div className="space-y-1">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {TIPO_OPCOES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Município *</Label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                      <span className={form.municipio ? '' : 'text-muted-foreground'}>
                        {form.municipio ? `${form.municipio}${form.estado ? '/' + form.estado : ''}` : 'Selecione o município'}
                      </span>
                      <Search className="w-4 h-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <Command>
                      <CommandInput placeholder="Buscar município..." value={municipioBusca} onValueChange={setMunicipioBusca} />
                      <CommandList>
                        <CommandEmpty>Nenhum município encontrado.</CommandEmpty>
                        <CommandGroup>
                          {municipiosFiltrados.map((m) => (
                            <CommandItem
                              key={`${m.nome}/${m.estado}`}
                              value={`${m.nome} ${m.estado}`}
                              onSelect={() => selecionarMunicipio(m)}
                            >
                              <MapPin className="w-3.5 h-3.5 mr-2 opacity-60" />
                              <span className="flex-1">{m.nome}</span>
                              <span className="text-xs text-muted-foreground">{m.estado || ''}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label>UF</Label>
                <Input
                  value={form.estado}
                  readOnly
                  disabled
                  className="bg-muted/40"
                  placeholder="Preenchido automaticamente"
                />
              </div>
            </div>
          </section>

          {/* === LOCALIZAÇÃO === */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
              Localização
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
              <div className="space-y-1">
                <Label>🔎 Buscar endereço ou local</Label>
                <Input
                  value={enderecoBusca}
                  onChange={(e) => setEnderecoBusca(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarEndereco(); } }}
                  placeholder="Ex: Rua das Flores, Bairro Centro, CEP..."
                  disabled={buscandoEnd}
                />
              </div>
              <Button onClick={buscarEndereco} disabled={buscandoEnd} variant="secondary" className="h-10">
                {buscandoEnd ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
                {buscandoEnd ? 'Buscando…' : 'Buscar'}
              </Button>
            </div>

            {/* MAPA */}
            {!temCentro ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 py-14 text-center text-sm text-muted-foreground">
                <MapPin className="w-6 h-6 mx-auto mb-2 opacity-50" />
                Selecione um município para localizar a comunidade no mapa.
              </div>
            ) : (
              <div className="relative space-y-1">
                <div
                  className="rounded-lg overflow-hidden border border-border bg-muted/30"
                  style={{ height: 300, width: '100%' }}
                >
                  <MapContainer
                    center={centroParaMapa}
                    zoom={zoomParaMapa}
                    style={{ height: '100%', width: '100%' }}
                    worldCopyJump={false}
                    whenReady={(e) => { setTimeout(() => e.target.invalidateSize(), 250); }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    <MapSync centro={mapaCentro || centroParaMapa} zoom={zoomParaMapa} onMapClick={onMapClick} />
                    {marcador && (
                      <Marker
                        position={marcador}
                        draggable
                        eventHandlers={{ dragend: onMarkerDrag }}
                      />
                    )}
                  </MapContainer>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Clique no mapa para marcar o centro da comunidade. Arraste o marcador para ajustar.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label>Latitude</Label>
                <Input
                  value={form.lat}
                  onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                  placeholder="-19.56"
                />
              </div>
              <div className="space-y-1">
                <Label>Longitude</Label>
                <Input
                  value={form.lng}
                  onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                  placeholder="-44.08"
                />
              </div>
              <div className="col-span-2 sm:col-span-2 flex items-end">
                <Button onClick={usarMinhaLocalizacao} disabled={geolocando} variant="outline" className="w-full h-10">
                  {geolocando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LocateFixed className="w-4 h-4 mr-2" />}
                  {geolocando ? 'Localizando…' : 'Usar minha localização'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label>Endereço ou referência</Label>
                <Input
                  value={form.endereco}
                  onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
                  placeholder="Ex: Próximo à Escola Municipal X"
                />
              </div>
              <div className="space-y-1">
                <Label>CEP</Label>
                <Input
                  value={form.cep}
                  onChange={(e) => setForm((f) => ({ ...f, cep: e.target.value }))}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </section>

          {/* === CARACTERIZAÇÃO === */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
              Caracterização
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Área urbana/rural</Label>
                <Select
                  value={form.area_urbana_rural}
                  onValueChange={(v) => setForm((f) => ({ ...f, area_urbana_rural: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao_informado">Não informado</SelectItem>
                    <SelectItem value="urbana">Urbana</SelectItem>
                    <SelectItem value="rural">Rural</SelectItem>
                    <SelectItem value="periurbana">Periurbana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>População estimada</Label>
                <Input
                  type="number"
                  value={form.populacao_estimada}
                  onChange={(e) => setForm((f) => ({ ...f, populacao_estimada: e.target.value }))}
                  placeholder="Ex: 5000"
                />
              </div>
              <div className="space-y-1">
                <Label>Nº aprox. de famílias</Label>
                <Input
                  type="number"
                  value={form.numero_familias}
                  onChange={(e) => setForm((f) => ({ ...f, numero_familias: e.target.value }))}
                  placeholder="Ex: 1200"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Características gerais, histórico ou observações sobre a comunidade."
                rows={3}
              />
            </div>
          </section>

          {/* === RELACIONAMENTO COMUNITÁRIO === */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
              Relacionamento comunitário
            </h3>
            <p className="text-xs text-muted-foreground">
              Após salvar a comunidade, vincule lideranças, stakeholders, grupos, organizações,
              temas, registros e casos pela página de detalhes da comunidade.
            </p>
          </section>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-card">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={saving}>
            <MapPin className="w-4 h-4 mr-1" />
            {saving ? 'Salvando…' : 'Salvar Comunidade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}