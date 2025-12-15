import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, AlertTriangle, MapPin, Layers } from 'lucide-react';

export default function ControlesCamadas({ camadas, onToggleCamada, contadores }) {
  const camadasConfig = [
    {
      id: 'registros',
      nome: 'Registros',
      icone: FileText,
      cor: 'text-blue-600',
      descricao: 'Registros de campo com temperatura'
    },
    {
      id: 'stakeholders',
      nome: 'Stakeholders',
      icone: Users,
      cor: 'text-purple-600',
      descricao: 'Lideranças e organizações'
    },
    {
      id: 'riscos',
      nome: 'Riscos Sociais',
      icone: AlertTriangle,
      cor: 'text-red-600',
      descricao: 'Alertas e indicadores de risco'
    },
    {
      id: 'comunidades',
      nome: 'Comunidades',
      icone: MapPin,
      cor: 'text-emerald-600',
      descricao: 'Áreas territoriais'
    }
  ];

  return (
    <Card className="absolute top-4 right-4 z-[1000] w-72 shadow-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-[#E31E24]" />
          <h3 className="font-semibold text-slate-900">Camadas do Mapa</h3>
        </div>

        {camadasConfig.map(camada => {
          const Icon = camada.icone;
          const ativo = camadas[camada.id];
          const contador = contadores[camada.id] || 0;

          return (
            <div 
              key={camada.id}
              className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                ativo ? 'bg-slate-50 border-[#E31E24]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <Icon className={`w-5 h-5 ${camada.cor}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium text-sm cursor-pointer" htmlFor={camada.id}>
                      {camada.nome}
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {contador}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{camada.descricao}</p>
                </div>
              </div>
              <Switch
                id={camada.id}
                checked={ativo}
                onCheckedChange={() => onToggleCamada(camada.id)}
              />
            </div>
          );
        })}

        <div className="pt-3 border-t text-xs text-slate-500 space-y-1">
          <p>🌡️ Cores representam temperatura do território</p>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Baixo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Médio</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Alto</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Crítico</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}