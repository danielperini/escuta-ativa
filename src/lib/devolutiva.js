// Helpers do ciclo de Devolutiva (Demanda ↔ Registro/Atividade)

export const DEVOLUTIVA_STATUS_LIST = [
  { value: 'pendente', label: 'Pendente', emoji: '🟡', badge: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
  { value: 'realizada', label: 'Realizada', emoji: '🟢', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
  { value: 'nao_realizada', label: 'Não realizada', emoji: '🔴', badge: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-500' },
  { value: 'nao_se_aplica', label: 'Não se aplica', emoji: '⚪', badge: 'bg-slate-100 text-slate-600 border-slate-300', dot: 'bg-slate-400' }
];

export const DEVOLUTIVA_STATUS_MAP = Object.fromEntries(
  DEVOLUTIVA_STATUS_LIST.map(s => [s.value, s])
);

export const DEVOLUTIVA_FORMAS = [
  { value: 'reuniao', label: 'Reunião' },
  { value: 'visita', label: 'Visita' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'mensagem', label: 'Mensagem' },
  { value: 'email', label: 'E-mail' },
  { value: 'oficio', label: 'Ofício' },
  { value: 'evento', label: 'Evento' },
  { value: 'outra', label: 'Outra' }
];

// Normaliza o status legado (devolutiva_realizada / requer_devolutiva) para o novo enum.
// Migração sem perda: se devolutiva_status já existir, usa-o; senão deriva dos campos antigos.
export function statusDevolutiva(demanda) {
  if (!demanda) return 'pendente';
  if (demanda.devolutiva_status) return demanda.devolutiva_status;
  if (demanda.devolutiva_realizada === true) return 'realizada';
  if (demanda.requer_devolutiva === false) return 'nao_se_aplica';
  return 'pendente';
}

export function devolutivaStatusConfig(demanda) {
  return DEVOLUTIVA_STATUS_MAP[statusDevolutiva(demanda)] || DEVOLUTIVA_STATUS_LIST[0];
}

// Ao salvar, sincroniza campos legado (devolutiva_realizada / data_devolutiva) com o novo status,
// mantendo compatibilidade com monitores/notificações existentes (sem perda de dados).
export function sincronizarLegadoDevolutiva(dados) {
  const out = { ...dados };
  const status = out.devolutiva_status;
  if (status === 'realizada') {
    out.devolutiva_realizada = true;
    const hoje = new Date().toISOString().split('T')[0];
    if (!out.devolutiva_data_realizada) out.devolutiva_data_realizada = hoje;
    if (!out.data_devolutiva) out.data_devolutiva = out.devolutiva_data_realizada;
  } else if (status === 'nao_realizada') {
    out.devolutiva_realizada = false;
    // mantém data_devolutiva legado se houver (histórico)
  } else if (status === 'nao_se_aplica') {
    out.devolutiva_realizada = false;
  } else {
    // pendente
    out.devolutiva_realizada = false;
  }
  return out;
}

// Verifica se concluir a demanda esbarra em devolutiva pendente (§5)
export function devolutivaPendente(demanda) {
  return statusDevolutiva(demanda) === 'pendente';
}