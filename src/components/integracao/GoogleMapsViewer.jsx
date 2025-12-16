import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { toast } from 'sonner';

export default function GoogleMapsViewer({ endereco, lat, lng, titulo }) {
  const [mapUrl, setMapUrl] = useState('');
  const [integracaoAtiva, setIntegracaoAtiva] = useState(false);

  const { data: integracoes = [] } = useQuery({
    queryKey: ['integracoes-maps'],
    queryFn: () => base44.entities.IntegracaoExterna.filter({ 
      provedor: 'Google', 
      ativa: true 
    })
  });

  useEffect(() => {
    const integracao = integracoes.find(i => i.tipo === 'maps');
    setIntegracaoAtiva(!!integracao);

    if (integracao) {
      // Construir URL do Google Maps
      let url;
      if (lat && lng) {
        url = `https://www.google.com/maps/embed/v1/place?key=${integracao.configuracoes?.api_key || 'DEMO_KEY'}&q=${lat},${lng}&zoom=15`;
      } else if (endereco) {
        const enderecoEncoded = encodeURIComponent(endereco);
        url = `https://www.google.com/maps/embed/v1/place?key=${integracao.configuracoes?.api_key || 'DEMO_KEY'}&q=${enderecoEncoded}&zoom=14`;
      }
      setMapUrl(url);
    }
  }, [integracoes, endereco, lat, lng]);

  const abrirNoGoogleMaps = () => {
    let url;
    if (lat && lng) {
      url = `https://www.google.com/maps?q=${lat},${lng}`;
    } else if (endereco) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
    }
    window.open(url, '_blank');
  };

  if (!integracaoAtiva) {
    return (
      <Card className="border-2 border-dashed border-slate-300">
        <CardContent className="py-8 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500 mb-2">
            Integração Google Maps não configurada
          </p>
          <p className="text-xs text-slate-400">
            Configure a integração para visualizar mapas
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!mapUrl) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-slate-500">
            Endereço ou coordenadas não disponíveis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" />
            {titulo || 'Localização'}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={abrirNoGoogleMaps}
            className="gap-1"
          >
            <Navigation className="w-3 h-3" />
            Abrir no Maps
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg overflow-hidden border-2 border-slate-200">
          <iframe
            width="100%"
            height="300"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl}
          />
        </div>
        {endereco && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4" />
            <span>{endereco}</span>
          </div>
        )}
        {lat && lng && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}