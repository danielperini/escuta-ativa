import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Users, MapPin, Tag, Save, X } from 'lucide-react';

// Formulário mínimo para criar um Registro/Atividade de devolutiva (tipo=devolutiva)
// pré-preenchido com o contexto da demanda. NÃO cria sistema paralelo: usa Registro normal.
export default function FormularioRegistroDevolutiva({
  demanda,
  registroOrigem,
  onSalvo
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    titulo: `Devolutiva — ${recortar(demanda?.descricao, 60)}`,
    descricao: '',
    data_registro: new Date().toISOString().split('T')[0],
    comunidade: registroOrigem?.comunidade || demanda?.comunidade || '',
    participantes: (registroOrigem?.participantes || []).join(', '),
    temas_identificados: (registroOrigem?.temas_identificados || []).join(', '),
    devolutiva_responsavel: demanda?.responsavel || registroOrigem?.usuario_criador || '',
    local: registroOrigem?.local || ''
  });
  const [salvando, setSalvando] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSalvar = async () => {
    if (!form.titulo) {
      toast({ title: 'Título obrigatório', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      const participantesArr = form.participantes
        ? form.participantes.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const temasArr = form.temas_identificados
        ? form.temas_identificados.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const novo = await base44.entities.Registro.create({
        titulo: form.titulo,
        tipo: 'devolutiva',
        descricao: form.descricao,
        data_registro: form.data_registro,
        comunidade: form.comunidade || null,
        local: form.local || null,
        participantes: participantesArr,
        temas_identificados: temasArr,
        status: 'finalizado',
        demanda_relacionada: {
          registro_origem_id: demanda?.registroId || registroOrigem?.id,
          demanda_index: demanda?.demandaIndex,
          descricao: demanda?.descricao,
          comunidade: demanda?.comunidade || registroOrigem?.comunidade
        }
      });
      toast({ title: 'Atividade de devolutiva registrada', description: 'Vinculando à demanda...' });
      onSalvo?.(novo.id || novo._id);
    } catch (e) {
      toast({ title: 'Erro ao salvar registro', description: e?.message, variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onSalvo?.(null)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Registrar atividade de devolutiva
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="p-3 rounded-md bg-slate-50 border text-sm">
            <p className="font-medium text-slate-800">Demanda:</p>
            <p className="text-slate-600">“{recortar(demanda?.descricao, 140)}”</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {demanda?.comunidade || '—'}
            </p>
          </div>

          <div>
            <Label className="text-xs">Título *</Label>
            <Input className="mt-1" value={form.titulo} onChange={e => set('titulo', e.target.value)} />
          </div>

          <div>
            <Label className="text-xs">Descrição / resumo da atividade</Label>
            <Textarea className="mt-1" rows={3} value={form.descricao}
              placeholder="Como foi a devolutiva, o que foi repassado..."
              onChange={e => set('descricao', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="date" className="mt-1" value={form.data_registro}
                onChange={e => set('data_registro', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Local</Label>
              <Input className="mt-1" value={form.local}
                onChange={e => set('local', e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> Comunidade</Label>
            <Input className="mt-1" value={form.comunidade}
              onChange={e => set('comunidade', e.target.value)} />
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Stakeholders/Participantes (vírgula)</Label>
            <Input className="mt-1" value={form.participantes}
              onChange={e => set('participantes', e.target.value)} />
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1"><Tag className="w-3 h-3" /> Temas (vírgula)</Label>
            <Input className="mt-1" value={form.temas_identificados}
              onChange={e => set('temas_identificados', e.target.value)} />
          </div>

          <div>
            <Label className="text-xs">Responsável pela devolutiva</Label>
            <Input className="mt-1" value={form.devolutiva_responsavel}
              onChange={e => set('devolutiva_responsavel', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onSalvo?.(null)} disabled={salvando}>
            <X className="w-3.5 h-3.5" /> Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={salvando}>
            <Save className="w-3.5 h-3.5" /> {salvando ? 'Salvando...' : 'Salvar e vincular'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function recortar(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}