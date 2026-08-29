import React, { useState } from 'react';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldAlert, ShieldQuestion, ExternalLink, Calendar, MapPin, Database } from 'lucide-react';

const CONF_INFO = {
  oficial: { cor: 'bg-emerald-100 text-emerald-700', icone: Shield, label: 'Fonte oficial' },
  nao_verificado: { cor: 'bg-amber-100 text-amber-800', icone: ShieldAlert, label: 'Não verificado' },
  inferido_ia: { cor: 'bg-violet-100 text-violet-700', icone: ShieldQuestion, label: 'Inferência da IA' },
  estimado: { cor: 'bg-blue-100 text-blue-700', icone: ShieldAlert, label: 'Estimado' }
};

const METHOD_LABEL = {
  API: 'API oficial',
  DOWNLOAD_OFICIAL: 'Base oficial',
  PORTAL_OFICIAL: 'Portal oficial',
  PESQUISA_WEB_IA: 'Pesquisa assistida por IA',
  CACHE: 'Cache local'
};

const GEO_LABEL = {
  MUNICIPAL: 'Municipal',
  SUBMUNICIPAL: 'Submunicipal',
  COMUNITARIO: 'Comunitário',
  GEOESPACIAL: 'Geoespacial',
  INTERNO_SOCIEDATA: 'Interno societá.ai'
};

export function IndicadorComFonte({ rotulo, valor, unit = '', fonte, confidence = 'nao_verificado', periodo, method, geographic_level, dataConsulta }) {
  const [open, setOpen] = useState(false);
  const info = CONF_INFO[confidence] || CONF_INFO.nao_verificado;
  const Icone = info.icone;

  const fonteTexto = fonte?.nome || '';
  const fonteUrl = fonte?.url || '';
  const dataConsultaVal = fonte?.data_consulta || dataConsulta || '';
  const methodLabel = METHOD_LABEL[method] || (method === 'CACHE' ? 'Cache local' : (confidence === 'oficial' ? 'API/portal oficial' : 'Pesquisa web'));

  return (
    <div className="bg-card border border-border rounded-lg p-3 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide leading-tight">
          {rotulo}
        </p>
        <div className="flex items-center gap-1">
          {geographic_level && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 gap-0.5 bg-slate-100 text-slate-600 border-0">
              <MapPin className="w-2.5 h-2.5" />
            </Badge>
          )}
          <Badge variant="outline" className={`text-[9px] px-1 py-0 gap-0.5 ${info.cor} border-0`}>
            <Icone className="w-2.5 h-2.5" />
          </Badge>
        </div>
      </div>
      <p className="text-lg font-semibold text-foreground leading-tight">
        {valor}{unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
      </p>
      <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
        <Database className="w-2.5 h-2.5 shrink-0" />
        <span className="truncate">{fonteTexto || methodLabel}</span>
      </p>
      <div className="flex items-center justify-between mt-1">
        <button
          onClick={() => setOpen(true)}
          className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
        >
          {fonteUrl ? <>Ver fonte <ExternalLink className="w-2.5 h-2.5" /></> : 'Sem URL rastreável'}
        </button>
        {periodo && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Calendar className="w-2.5 h-2.5" /> {periodo}
          </span>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <span className="hidden" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 text-xs space-y-1.5">
          <div>
            <span className="font-medium">Fonte:</span> {fonteTexto || '—'}
          </div>
          {fonteUrl && (
            <div className="truncate">
              <span className="font-medium">URL:</span>{' '}
              <a href={fonteUrl} target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5">
                {fonteUrl.slice(0, 40)}… <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}
          {dataConsultaVal && (
            <div><span className="font-medium">Atualizado:</span> {dataConsultaVal}</div>
          )}
          {periodo && (
            <div><span className="font-medium">Referência:</span> {periodo}</div>
          )}
          {method && (
            <div><span className="font-medium">Método:</span> {methodLabel}</div>
          )}
          {geographic_level && (
            <div><span className="font-medium">Nível territorial:</span> {GEO_LABEL[geographic_level] || geographic_level}</div>
          )}
          <div className="pt-1 border-t mt-1">
            <Badge className={`${info.cor} border-0 text-[10px] gap-1`}>
              <Icone className="w-3 h-3" /> {info.label}
            </Badge>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}