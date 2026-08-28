import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPin, Calendar, Users, ThermometerSun, MessageSquare, AlertTriangle, CheckCircle2, ExternalLink, Target } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const termometroColors = {
  baixo: '#22c55e',
  medio: '#f59e0b',
  alto: '#f97316',
  critico: '#ef4444'
};

export default function DetalhesRegistroMapa({ registro, onClose }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-slate-900">{registro.titulo}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            {new Date(registro.created_date).toLocaleDateString('pt-BR')}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Comunidade
          </p>
          <p className="font-semibold text-sm">{registro.comunidade}</p>
        </div>
        
        <div className="bg-slate-50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <ThermometerSun className="w-3 h-3" />
            Temperatura
          </p>
          <p 
            className="font-semibold capitalize text-sm" 
            style={{ color: termometroColors[registro.temperatura_territorio] }}
          >
            {registro.temperatura_territorio || 'Baixo'}
          </p>
        </div>
        
        <div className="bg-slate-50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            Sentimento
          </p>
          <p className="font-semibold text-sm capitalize">
            {registro.sentimento || '-'}
          </p>
        </div>
        
        <div className="bg-slate-50 p-3 rounded-lg">
          <p className="text-xs text-slate-500">Tipo</p>
          <p className="font-semibold text-sm capitalize">
            {registro.tipo?.replace('_', ' ') || '-'}
          </p>
        </div>
      </div>

      {registro.temas_identificados?.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
            <Target className="w-4 h-4" />
            Temas
          </p>
          <div className="flex flex-wrap gap-2">
            {registro.temas_identificados.map((tema, idx) => (
              <Badge key={idx} variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                {tema}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {registro.participantes?.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
            <Users className="w-4 h-4" />
            Participantes
          </p>
          <div className="flex flex-wrap gap-2">
            {registro.participantes.slice(0, 5).map((p, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">{p}</Badge>
            ))}
            {registro.participantes.length > 5 && (
              <Badge variant="outline" className="text-xs">+{registro.participantes.length - 5}</Badge>
            )}
          </div>
        </div>
      )}

      {registro.demandas?.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Demandas ({registro.demandas.length})
          </p>
          <div className="space-y-2">
            {registro.demandas.slice(0, 2).map((d, idx) => (
              <div key={idx} className="text-xs bg-amber-50 p-2 rounded border border-amber-200">
                <p className="font-medium">{d.descricao}</p>
                <div className="flex gap-2 mt-1">
                  <Badge className="text-xs bg-amber-600">{d.urgencia}</Badge>
                  {d.requer_devolutiva && (
                    <Badge variant="outline" className="text-xs">
                      Devolutiva: {new Date(d.prazo_devolutiva).toLocaleDateString('pt-BR')}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {registro.demandas.length > 2 && (
              <p className="text-xs text-slate-500">+{registro.demandas.length - 2} demanda(s)</p>
            )}
          </div>
        </div>
      )}

      {registro.compromissos?.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Compromissos ({registro.compromissos.length})
          </p>
          <div className="space-y-2">
            {registro.compromissos.slice(0, 2).map((c, idx) => (
              <div key={idx} className="text-xs bg-emerald-50 p-2 rounded border border-emerald-200">
                <p className="font-medium">{c.descricao}</p>
                {c.responsavel && (
                  <p className="text-slate-600 mt-1">Responsável: {c.responsavel}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Link to={createPageUrl('VerRegistro') + `?id=${registro.id}`}>
        <Button variant="outline" size="sm" className="w-full">
          <ExternalLink className="w-4 h-4 mr-2" />
          Ver Detalhes Completos
        </Button>
      </Link>
    </Card>
  );
}