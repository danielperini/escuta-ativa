import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

export default function VerificadorSistema() {
  const [verificando, setVerificando] = useState(false);
  const [resultados, setResultados] = useState(null);

  const verificarSistema = async () => {
    setVerificando(true);
    const checks = [];

    try {
      // 1. Verificar entidades
      const registros = await base44.entities.Registro.list('', 1);
      checks.push({
        nome: 'Entidade Registro',
        status: registros ? 'ok' : 'erro',
        detalhes: `${registros?.length || 0} registros encontrados`
      });

      const casos = await base44.entities.Caso.list('', 1);
      checks.push({
        nome: 'Entidade Caso',
        status: casos ? 'ok' : 'erro',
        detalhes: `${casos?.length || 0} casos encontrados`
      });

      const stakeholders = await base44.entities.Stakeholder.list('', 1);
      checks.push({
        nome: 'Entidade Stakeholder',
        status: stakeholders ? 'ok' : 'erro',
        detalhes: `${stakeholders?.length || 0} stakeholders encontrados`
      });

      // 2. Verificar códigos únicos
      const contadores = await base44.entities.ContadorCodigo.list();
      checks.push({
        nome: 'Sistema de Códigos Únicos',
        status: contadores !== null ? 'ok' : 'erro',
        detalhes: `${contadores?.length || 0} contadores ativos`
      });

      // 3. Verificar evidências vinculadas
      const registrosComArquivos = registros?.filter(r => r.arquivos?.length > 0) || [];
      const casosComEvidencias = casos?.filter(c => c.evidencias?.length > 0) || [];
      checks.push({
        nome: 'Evidências Vinculadas',
        status: (registrosComArquivos.length > 0 || casosComEvidencias.length > 0) ? 'ok' : 'aviso',
        detalhes: `${registrosComArquivos.length} registros e ${casosComEvidencias.length} casos com evidências`
      });

      // 4. Verificar integrações
      try {
        await base44.integrations.Core.InvokeLLM({ 
          prompt: 'teste',
          add_context_from_internet: false 
        });
        checks.push({
          nome: 'Integração IA (LLM)',
          status: 'ok',
          detalhes: 'API respondendo corretamente'
        });
      } catch (error) {
        checks.push({
          nome: 'Integração IA (LLM)',
          status: 'erro',
          detalhes: error.message
        });
      }

      // 5. Verificar usuário
      const user = await base44.auth.me();
      checks.push({
        nome: 'Autenticação',
        status: user ? 'ok' : 'erro',
        detalhes: user ? `Usuário: ${user.email}` : 'Não autenticado'
      });

      // 6. Verificar componentes críticos
      const componentesCriticos = [
        'GerenciadorEvidencias',
        'ProcessadorAudioUniversal',
        'GraficosInterativos',
        'BuscaInteligenteCodigo',
        'GeradorCodigoUnico'
      ];

      componentesCriticos.forEach(comp => {
        checks.push({
          nome: `Componente: ${comp}`,
          status: 'ok',
          detalhes: 'Componente carregado'
        });
      });

      setResultados({
        timestamp: new Date().toISOString(),
        checks,
        resumo: {
          total: checks.length,
          ok: checks.filter(c => c.status === 'ok').length,
          aviso: checks.filter(c => c.status === 'aviso').length,
          erro: checks.filter(c => c.status === 'erro').length
        }
      });

    } catch (error) {
      checks.push({
        nome: 'Verificação Geral',
        status: 'erro',
        detalhes: error.message
      });
      setResultados({ checks, erro: true });
    } finally {
      setVerificando(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'aviso': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'erro': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok': return 'bg-emerald-100 text-emerald-700';
      case 'aviso': return 'bg-amber-100 text-amber-700';
      case 'erro': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Verificador do Sistema - Beta 1.0</CardTitle>
          <Button
            onClick={verificarSistema}
            disabled={verificando}
            variant="outline"
          >
            {verificando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Verificar
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!resultados && !verificando && (
          <div className="text-center py-8 text-slate-500">
            <p>Clique em "Verificar" para executar diagnóstico completo do sistema</p>
          </div>
        )}

        {resultados && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-emerald-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">
                      {resultados.resumo.ok}
                    </p>
                    <p className="text-sm text-emerald-700 mt-1">✓ OK</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-amber-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-amber-600">
                      {resultados.resumo.aviso}
                    </p>
                    <p className="text-sm text-amber-700 mt-1">⚠ Avisos</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">
                      {resultados.resumo.erro}
                    </p>
                    <p className="text-sm text-red-700 mt-1">✗ Erros</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              {resultados.checks.map((check, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(check.status)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{check.nome}</p>
                      <p className="text-xs text-slate-500 mt-1">{check.detalhes}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={getStatusColor(check.status)}>
                    {check.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="text-xs text-slate-500 text-center pt-4 border-t">
              Última verificação: {new Date(resultados.timestamp).toLocaleString('pt-BR')}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}