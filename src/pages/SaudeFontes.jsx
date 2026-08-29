import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, RefreshCw, ShieldCheck, AlertTriangle, XCircle,
  Eye, EyeOff, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  ATIVA: { label: 'ATIVA', className: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  DEGRADADA: { label: 'DEGRADADA', className: 'bg-amber-100 text-amber-800 border-amber-300', icon: AlertTriangle },
  EM_TESTE: { label: 'EM TESTE', className: 'bg-blue-100 text-blue-800 border-blue-300', icon: Loader2 },
  INDISPONIVEL: { label: 'INDISPONÍVEL', className: 'bg-muted text-muted-foreground border-border', icon: XCircle },
  ERRO_DE_AUTENTICACAO: { label: 'ERRO DE AUTH', className: 'bg-red-100 text-red-800 border-red-300', icon: AlertTriangle },
  ERRO_DE_ENDPOINT: { label: 'ERRO DE ENDPOINT', className: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
  SEM_DADOS_PARA_O_MUNICIPIO: { label: 'SEM DADOS', className: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertTriangle },
  RESPOSTA_INVALIDA: { label: 'RESPOSTA INVÁLIDA', className: 'bg-rose-100 text-rose-800 border-rose-300', icon: AlertTriangle },
  DESCONTINUADA: { label: 'DESCONTINUADA', className: 'bg-muted text-muted-foreground border-border', icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, className: '', icon: AlertTriangle };
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cfg.className}>
      <Icon className="w-3 h-3 mr-1" />
      {cfg.label}
    </Badge>
  );
}

function formatarData(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch (_) { return '—'; }
}

export default function SaudeFontes() {
  const queryClient = useQueryClient();
  const [testando, setTestando] = useState(false);
  const [erroModal, setErroModal] = useState(null);

  const { data: fontes = [], isLoading } = useQuery({
    queryKey: ['saude-fontes'],
    queryFn: async () => {
      const list = await base44.entities.FonteDados.list('-last_test_at', 100);
      return list;
    },
  });

  const total = fontes.length;
  const ativas = fontes.filter((f) => f.status === 'ATIVA').length;
  const indisponiveis = fontes.filter((f) => !f.visible).length;
  const pct = total > 0 ? Math.round((ativas / total) * 100) : 0;
  const corClass = pct >= 75 ? 'text-emerald-600' : (pct >= 50 ? 'text-amber-600' : 'text-red-600');

  const testarTudo = async () => {
    setTestando(true);
    try {
      const res = await base44.functions.invoke('validarFontesDados', {});
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      toast.success(`Validação concluída: ${data?.ativas ?? 0} de ${data?.total_fontes_cadastradas ?? total} ativas.`);
      queryClient.invalidateQueries({ queryKey: ['saude-fontes'] });
      queryClient.invalidateQueries({ queryKey: ['cobertura-fontes'] });
    } catch (e) {
      toast.error('Erro: ' + (e.message || 'tente novamente'));
    } finally {
      setTestando(false);
    }
  };

  const testarUm = async (source_id) => {
    try {
      const res = await base44.functions.invoke('validarFontesDados', { source_id });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ['saude-fontes'] });
      queryClient.invalidateQueries({ queryKey: ['cobertura-fontes'] });
      toast.success(`Teste concluído: ${source_id}.`);
    } catch (e) {
      toast.error('Erro: ' + (e.message || 'tente novamente'));
    }
  };

  const alternarVisivel = async (fonte) => {
    const estaVisivel = !!fonte.visible;
    try {
      await base44.entities.FonteDados.update(fonte.id, {
        visible: !estaVisivel,
        deactivated: estaVisivel,
        status: estaVisivel ? 'INDISPONIVEL' : 'EM_TESTE',
      });
      queryClient.invalidateQueries({ queryKey: ['saude-fontes'] });
      queryClient.invalidateQueries({ queryKey: ['cobertura-fontes'] });
      toast.success(estaVisivel ? 'Fonte ocultada dos usuários.' : 'Fonte reativada — execute o teste para validar.');
    } catch (e) {
      toast.error('Erro: ' + (e.message || 'tente novamente'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> Saúde das Fontes
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Validação técnica automática de APIs e fontes públicas. Apenas fontes ATIVAS são exibidas
            no dropdown de Dados Secundários e no Chat IA.
          </p>
        </div>
        <Button onClick={testarTudo} disabled={testando}>
          {testando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {testando ? 'Validando…' : 'Validar tudo agora'}
        </Button>
      </div>

      {/* Resumo de cobertura */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase">Cobertura</p>
          <p className={`text-2xl font-bold ${corClass}`}>
            {total > 0 ? `${ativas} de ${total} ativas` : '—'}
          </p>
          {total > 0 && (
            <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
            </div>
          )}
          {total > 0 && <p className="text-xs text-muted-foreground mt-1">{pct}% disponível</p>}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase">Visíveis aos usuários</p>
          <p className="text-2xl font-bold text-blue-700">{fontes.filter((f) => f.visible).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase">Indisponíveis / ocultas</p>
          <p className="text-2xl font-bold text-amber-700">{indisponiveis}</p>
        </Card>
      </div>

      {/* Matriz de fontes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Matriz de fontes cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold">Fonte</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Último teste</th>
                <th className="text-left p-3 font-semibold">Tempo</th>
                <th className="text-left p-3 font-semibold">Dados válidos</th>
                <th className="text-right p-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Carregando fontes…
                </td></tr>
              )}
              {!isLoading && total === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Nenhuma fonte registrada ainda. Clique em <strong>“Validar tudo agora”</strong> para iniciar
                  o inventário e os testes técnicos.
                </td></tr>
              )}
              {fontes.map((f) => (
                <tr key={f.id} className="border-b border-border/40">
                  <td className="p-3 align-top">
                    <div className="font-medium">{f.source_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {f.category} · {f.requires_auth ? 'requer auth' : 'pública'}
                    </div>
                    {!f.visible && (
                      <div className="text-[10px] text-amber-700 mt-1">
                        Fonte indisponível — não exibida aos usuários
                      </div>
                    )}
                  </td>
                  <td className="p-3 align-top">
                    <StatusBadge status={f.status} />
                    {f.consecutive_failures > 0 && (
                      <div className="text-[10px] text-amber-700 mt-1">
                        {f.consecutive_failures} falha(s) consecutiva(s)
                      </div>
                    )}
                  </td>
                  <td className="p-3 align-top text-xs text-muted-foreground">{formatarData(f.last_test_at)}</td>
                  <td className="p-3 align-top text-xs">
                    {f.response_time_ms != null ? `${f.response_time_ms} ms` : '—'}
                    {f.http_status && <div className="text-muted-foreground">HTTP {f.http_status}</div>}
                  </td>
                  <td className="p-3 align-top">
                    {f.data_valid ? (
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" />Válido
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                        <XCircle className="w-3 h-3 mr-1" />Inválido
                      </Badge>
                    )}
                    {f.coherence_observacao && (
                      <div className="text-[10px] text-muted-foreground mt-1 max-w-xs">
                        {f.coherence_observacao}
                      </div>
                    )}
                  </td>
                  <td className="p-3 align-top">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => testarUm(f.source_id)}>
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />Testar
                      </Button>
                      {f.error_message && (
                        <Button size="sm" variant="outline" onClick={() => setErroModal(f)}>
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />Ver erro
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => alternarVisivel(f)}>
                        {f.visible ? (
                          <><EyeOff className="w-3.5 h-3.5 mr-1" />Desativar</>
                        ) : (
                          <><Eye className="w-3.5 h-3.5 mr-1" />Reativar</>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal de erro técnico */}
      {erroModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setErroModal(null)}
        >
          <Card className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-base">Erro técnico — {erroModal.source_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase">Status técnico</p>
                <p className="font-medium">{erroModal.status_tecnico || erroModal.status}</p>
              </div>
              {erroModal.error_message && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Mensagem</p>
                  <p className="text-red-700 font-mono text-xs whitespace-pre-wrap break-words">
                    {erroModal.error_message}
                  </p>
                </div>
              )}
              {erroModal.endpoint && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Endpoint</p>
                  <p className="text-xs break-all">{erroModal.endpoint}</p>
                </div>
              )}
              {erroModal.coherence_observacao && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Observação da IA (coerência)</p>
                  <p className="text-xs">{erroModal.coherence_observacao}</p>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <Button size="sm" variant="outline" onClick={() => setErroModal(null)}>Fechar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}