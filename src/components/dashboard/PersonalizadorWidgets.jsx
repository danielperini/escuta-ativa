import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, GripVertical, Eye, EyeOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const widgetsDisponiveis = [
  { id: 'kpis', nome: 'KPIs Principais', descricao: 'Métricas chave do sistema' },
  { id: 'graficos', nome: 'Gráficos de Tendência', descricao: 'Evolução temporal dos dados' },
  { id: 'demandas_recorrentes', nome: 'Demandas Recorrentes', descricao: 'Alertas de demandas repetidas' },
  { id: 'devolutivas', nome: 'Monitor de Devolutivas', descricao: 'Prazos e pendências' },
  { id: 'voz_comunidade', nome: 'Voz da Comunidade', descricao: 'Citações relevantes' },
  { id: 'temperatura', nome: 'Temperatura Social', descricao: 'Mapa de calor territorial' },
  { id: 'proximas_agendas', nome: 'Próximas Agendas', descricao: 'Compromissos agendados' },
  { id: 'riscos_ativos', nome: 'Riscos Ativos', descricao: 'Alertas de riscos sociais' }
];

export default function PersonalizadorWidgets({ widgetsAtivos = [], onWidgetsChange }) {
  const [aberto, setAberto] = useState(false);
  const [widgets, setWidgets] = useState(widgetsAtivos);
  const [salvando, setSalvando] = useState(false);

  const toggleWidget = (widgetId) => {
    setWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const salvarPreferencias = async () => {
    setSalvando(true);
    try {
      const user = await base44.auth.me();
      await base44.auth.updateMe({
        configuracoes: {
          ...user.configuracoes,
          widgets_dashboard: widgets
        }
      });
      
      if (onWidgetsChange) {
        onWidgetsChange(widgets);
      }
      
      toast.success('Preferências salvas!');
      setAberto(false);
    } catch (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Personalizar Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Personalizar Dashboard</DialogTitle>
          <DialogDescription>
            Escolha quais widgets deseja visualizar no seu painel
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {widgetsDisponiveis.map(widget => (
            <Card 
              key={widget.id}
              className={widgets.includes(widget.id) ? 'border-blue-500 bg-blue-50' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={widget.id}
                    checked={widgets.includes(widget.id)}
                    onCheckedChange={() => toggleWidget(widget.id)}
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={widget.id}
                      className="cursor-pointer font-medium flex items-center gap-2"
                    >
                      {widgets.includes(widget.id) ? (
                        <Eye className="w-4 h-4 text-blue-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      )}
                      {widget.nome}
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">{widget.descricao}</p>
                  </div>
                  <GripVertical className="w-5 h-5 text-slate-300" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-slate-500">
            {widgets.length} de {widgetsDisponiveis.length} widgets selecionados
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarPreferencias} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Preferências'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}