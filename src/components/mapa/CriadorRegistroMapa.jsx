import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPin, X, Save, Loader2, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function CriadorRegistroMapa({ 
  open, 
  onClose, 
  coordenadas, 
  comunidades = [] 
}) {
  const queryClient = useQueryClient();
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'demanda',
    descricao: '',
    comunidade: '',
    local: '',
    temperatura_territorio: 'medio',
    urgencia: 'media'
  });

  const salvarRegistro = async () => {
    if (!formData.titulo || !coordenadas) {
      toast.error('Título e localização são obrigatórios');
      return;
    }

    setSalvando(true);
    try {
      // Buscar endereço reverso
      let endereco = formData.local;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coordenadas.lat}&lon=${coordenadas.lng}&format=json`
        );
        const data = await response.json();
        if (data.display_name) {
          endereco = data.display_name;
        }
      } catch (error) {
        console.log('Erro ao buscar endereço:', error);
      }

      const novoRegistro = {
        titulo: formData.titulo,
        tipo: formData.tipo,
        descricao: formData.descricao,
        comunidade: formData.comunidade,
        local: endereco || `${coordenadas.lat}, ${coordenadas.lng}`,
        localizacao: {
          lat: coordenadas.lat,
          lng: coordenadas.lng,
          endereco: endereco
        },
        temperatura_territorio: formData.temperatura_territorio,
        data_registro: new Date().toISOString().split('T')[0],
        status: 'rascunho',
        demandas: formData.tipo === 'demanda' ? [{
          descricao: formData.descricao,
          urgencia: formData.urgencia,
          status: 'pendente',
          requer_devolutiva: true
        }] : []
      };

      await base44.entities.Registro.create(novoRegistro);
      queryClient.invalidateQueries({ queryKey: ['registros'] });
      
      toast.success('Registro criado no mapa!');
      onClose();
      
      // Resetar form
      setFormData({
        titulo: '',
        tipo: 'demanda',
        descricao: '',
        comunidade: '',
        local: '',
        temperatura_territorio: 'medio',
        urgencia: 'media'
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao criar registro');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#E31E24]" />
            Criar Registro Georeferenciado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Lat: {coordenadas?.lat.toFixed(6)}, Lng: {coordenadas?.lng.toFixed(6)}
            </p>
          </div>

          <div>
            <Label>Título *</Label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ex: Demanda por iluminação pública"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(v) => setFormData(prev => ({ ...prev, tipo: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demanda">Demanda</SelectItem>
                  <SelectItem value="ocorrencia">Ocorrência</SelectItem>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                  <SelectItem value="visita">Visita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Temperatura</Label>
              <Select
                value={formData.temperatura_territorio}
                onValueChange={(v) => setFormData(prev => ({ ...prev, temperatura_territorio: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">🟢 Baixo</SelectItem>
                  <SelectItem value="medio">🟡 Médio</SelectItem>
                  <SelectItem value="alto">🟠 Alto</SelectItem>
                  <SelectItem value="critico">🔴 Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Comunidade</Label>
            <Select
              value={formData.comunidade}
              onValueChange={(v) => setFormData(prev => ({ ...prev, comunidade: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {comunidades.map(c => (
                  <SelectItem key={c.id} value={c.nome}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva a ocorrência ou demanda..."
              rows={3}
            />
          </div>

          {formData.tipo === 'demanda' && (
            <div>
              <Label>Urgência</Label>
              <Select
                value={formData.urgencia}
                onValueChange={(v) => setFormData(prev => ({ ...prev, urgencia: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button 
            onClick={salvarRegistro} 
            disabled={salvando || !formData.titulo}
            className="bg-[#E31E24] hover:bg-[#B01419]"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Criar Registro
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}