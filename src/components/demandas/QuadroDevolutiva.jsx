import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageSquareReply, Calendar, User, FileText, ExternalLink, Save, Plus,
  Paperclip, AlertTriangle, CheckCircle2, XCircle, MinusCircle
} from 'lucide-react';
import {
  DEVOLUTIVA_STATUS_LIST, DEVOLUTIVA_FORMAS, statusDevolutiva,
  devolutivaStatusConfig, sincronizarLegadoDevolutiva
} from '@/lib/devolutiva';

export default function QuadroDevolutiva({
  demanda,
  registros = [],
  usuarios = [],
  onSalvar,
  onAbrirRegistro,
  onRegistrarAtividade,
  salvando = false
}) {
  const statusAtual = statusDevolutiva(demanda);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    devolutiva_status: statusAtual,
    devolutiva_data_prevista: demanda?.devolutiva_data_prevista || demanda?.prazo_devolutiva || '',
    devolutiva_data_realizada: demanda?.devolutiva_data_realizada || demanda?.data_devolutiva || '',
    devolutiva_responsavel: demanda?.devolutiva_responsavel || demanda?.responsavel || '',
    devolutiva_forma: demanda?.devolutiva_forma || '',
    devolutiva_publico: demanda?.devolutiva_publico || '',
    devolutiva_resumo: demanda?.devolutiva_resumo || '',
    devolutiva_justificativa: demanda?.devolutiva_justificativa || '',
    devolutiva_registro_id: (demanda?.devolutiva_registro_ids || [])[0] || ''
  });

  const vinculados = useMemo(() => {
    const ids = demanda?.devolutiva_registro_ids || [];
    return ids.map(id => registros.find(r => r.id === id)).filter(Boolean);
  }, [demanda, registros]);

  // Candidatos a registro de devolutiva: mesmos filtros territoriais (§2)
  const registrosCandidatos = useMemo(() => {
    return registros.filter(r => {
      if (!r.id || r.id === demanda?.registroId) return false;
      const mesmaComunidade = demanda?.comunidade ? r.comunidade === demanda.comunidade : true;
      const mesmaOrg = demanda?.organizacao ? r.organizacao === demanda.organizacao : true;
      return mesmaComunidade || mesmaOrg;
    }).slice(0, 200);
  }, [registros, demanda]);

  const config = devolutivaStatusConfig(demanda);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSalvar = () => {
    const dados = { ...form };
    if (dados.devolutiva_registro_id) {
      dados.devolutiva_registro_ids = Array.from(new Set([
        ...(demanda?.devolutiva_registro_ids || []),
        dados.devolutiva_registro_id
      ]));
    }
    const sync = sincronizarLegadoDevolutiva(dados);
    onSalvar?.(sync);
    setEditando(false);
  };

  const statusIcon = (s) => {
    if (s === 'realizada') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (s === 'nao_realizada') return <XCircle className="w-4 h-4 text-red-600" />;
    if (s === 'nao_se_aplica') return <MinusCircle className="w-4 h-4 text-slate-500" />;
    return <AlertTriangle className="w-4 h-4 text-amber-600" />;
  };

  return (
    <Card className="border-2" style={{ borderColor: 'hsl(var(--border))' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareReply className="w-5 h-5 text-primary" />
            Devolutiva
          </CardTitle>
          <Badge className={`${config.badge} border`}>
            {config.emoji} {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!editando ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <Campo label="Status" icon={statusIcon(statusAtual)} value={config.label} />
              <Campo label="Data prevista" icon={<Calendar className="w-3.5 h-3.5 text-slate-400" />}
                value={form.devolutiva_data_prevista ? formatarData(form.devolutiva_data_prevista) : '—'} />
              <Campo label="Data realizada" icon={<Calendar className="w-3.5 h-3.5 text-slate-400" />}
                value={form.devolutiva_data_realizada ? formatarData(form.devolutiva_data_realizada) : '—'} />
              <Campo label="Responsável" icon={<User className="w-3.5 h-3.5 text-slate-400" />}
                value={form.devolutiva_responsavel || '—'} />
              <Campo label="Forma" icon={<MessageSquareReply className="w-3.5 h-3.5 text-slate-400" />}
                value={DEVOLUTIVA_FORMAS.find(f => f.value === form.devolutiva_forma)?.label || '—'} />
              <Campo label="Público/Stakeholder" icon={<User className="w-3.5 h-3.5 text-slate-400" />}
                value={form.devolutiva_publico || '—'} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Resumo da devolutiva</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {form.devolutiva_resumo || '—'}
              </p>
            </div>

            {(statusAtual === 'nao_se_aplica' || statusAtual === 'nao_realizada') && form.devolutiva_justificativa && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Justificativa</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{form.devolutiva_justificativa}</p>
              </div>
            )}

            {/* Registro relacionado + evidências (§3, §4) */}
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Registro(s) comprobatório(s)
              </p>
              {vinculados.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Nenhum registro vinculado.</p>
              ) : (
                <div className="space-y-2">
                  {vinculados.map(r => (
                    <div key={r.id} className="flex items-start justify-between gap-2 p-2 rounded-md bg-slate-50 border">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{r.titulo}</p>
                        <p className="text-xs text-slate-500">
                          {r.tipo} • {formatarData(r.data_registro || r.created_date)}
                        </p>
                        {/* Evidências/anexos do registro (§3) */}
                        {r.arquivos?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.arquivos.slice(0, 4).map((a, i) => (
                              <span key={i} className="inline-flex items-center gap-1 text-xs bg-white border rounded px-1.5 py-0.5 text-slate-600">
                                <Paperclip className="w-3 h-3" /> {a.nome || 'anexo'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {onAbrirRegistro && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs"
                          onClick={() => onAbrirRegistro(r.id)}>
                          Abrir <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setEditando(true)}>
                Editar devolutiva
              </Button>
              {onRegistrarAtividade && (
                <Button size="sm" onClick={onRegistrarAtividade}>
                  <Plus className="w-3.5 h-3.5" /> Registrar atividade de devolutiva
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {/* Status */}
            <div>
              <Label className="text-xs">Status da devolutiva *</Label>
              <Select value={form.devolutiva_status} onValueChange={v => set('devolutiva_status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEVOLUTIVA_STATUS_LIST.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.emoji} {s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Data prevista</Label>
                <Input type="date" className="mt-1" value={form.devolutiva_data_prevista}
                  onChange={e => set('devolutiva_data_prevista', e.target.value)} />
              </div>
              {form.devolutiva_status === 'realizada' && (
                <div>
                  <Label className="text-xs">Data realizada</Label>
                  <Input type="date" className="mt-1" value={form.devolutiva_data_realizada}
                    onChange={e => set('devolutiva_data_realizada', e.target.value)} />
                </div>
              )}
              <div>
                <Label className="text-xs">Responsável</Label>
                <Select value={form.devolutiva_responsavel} onValueChange={v => set('devolutiva_responsavel', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>— Não atribuído —</SelectItem>
                    {usuarios.map(u => (
                      <SelectItem key={u.id} value={u.full_name || u.email}>
                        {u.full_name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Forma</Label>
                <Select value={form.devolutiva_forma} onValueChange={v => set('devolutiva_forma', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>—</SelectItem>
                    {DEVOLUTIVA_FORMAS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Público/Stakeholder</Label>
                <Input className="mt-1" value={form.devolutiva_publico}
                  placeholder="Ex: Associação de moradores, liderança comunitária..."
                  onChange={e => set('devolutiva_publico', e.target.value)} />
              </div>
            </div>

            {/* Registro relacionado (existente) */}
            <div>
              <Label className="text-xs">Registro da devolutiva (já existente)</Label>
              <Select value={form.devolutiva_registro_id} onValueChange={v => set('devolutiva_registro_id', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Vincular registro existente..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>— Nenhum —</SelectItem>
                  {registrosCandidatos.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.titulo} ({r.tipo || 'registro'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Filtrado por comunidade/organização da demanda. Ou use “Registrar atividade de devolutiva” para criar novo.
              </p>
            </div>

            <div>
              <Label className="text-xs">Resumo da devolutiva</Label>
              <Textarea className="mt-1" rows={3} value={form.devolutiva_resumo}
                placeholder="O que foi repassado ao território..."
                onChange={e => set('devolutiva_resumo', e.target.value)} />
            </div>

            {(form.devolutiva_status === 'nao_se_aplica' || form.devolutiva_status === 'nao_realizada') && (
              <div>
                <Label className="text-xs">
                  {form.devolutiva_status === 'nao_se_aplica' ? 'Motivo (não se aplica)' : 'Motivo (não realizada)'}
                </Label>
                <Textarea className="mt-1" rows={2} value={form.devolutiva_justificativa}
                  onChange={e => set('devolutiva_justificativa', e.target.value)} />
              </div>
            )}

            {form.devolutiva_status === 'realizada' && vinculados.length === 0 && !form.devolutiva_registro_id && (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Devolutiva “Realizada” deve ter um registro comprobatório vinculado, salvo exceção administrativa justificada no resumo.</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSalvar} disabled={salvando}>
                <Save className="w-3.5 h-3.5" /> {salvando ? 'Salvando...' : 'Salvar devolutiva'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditando(false)}>Cancelar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Campo({ label, icon, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-0.5">{icon} {label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}

function formatarData(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('pt-BR');
}