import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import VerificadorSistema from '@/components/sistema/VerificadorSistema';
import { Settings, Info, CheckCircle } from 'lucide-react';

export default function ConfiguracoesSistema() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configurações do Sistema</h2>
          <p className="text-slate-500 mt-1">Sistema Escutativa - Gestão Territorial Inteligente</p>
        </div>
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
          Beta 1.0
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Informações da Versão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Versão</p>
              <p className="font-semibold">Beta 1.0</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Build</p>
              <p className="font-mono text-sm">20251213-001</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Data de Release</p>
              <p className="text-sm">13 de Dezembro de 2025</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <Badge className="bg-emerald-600">Produção (Beta)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Funcionalidades Principais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Sistema de Códigos Únicos (RE/CA/DOC)',
              'Transcrição de Áudio PT-BR Universal',
              'Gestão de Registros de Campo',
              'Gestão de Casos e Devolutivas',
              'Stakeholders e Rede de Relações',
              'Gráficos Interativos e Dashboards',
              'Matriz de Materialidade',
              'Gestão de Equipes e Permissões',
              'Upload de Evidências Vinculadas',
              'QR Codes em Relatórios',
              'Busca Inteligente Global',
              'Análise de IA e Predição'
            ].map((func, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm">{func}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <VerificadorSistema />

      <Card>
        <CardHeader>
          <CardTitle>Compatibilidade de Áudio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { formato: 'MP3', status: true },
              { formato: 'WAV', status: true },
              { formato: 'OGG (WhatsApp)', status: true },
              { formato: 'M4A', status: true },
              { formato: 'AAC', status: true },
              { formato: 'WEBM', status: true },
              { formato: 'MP4 (WhatsApp)', status: true },
              { formato: 'Transcrição PT-BR', status: true }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium">{item.formato}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 mb-2">
            <strong>Documentação Completa:</strong> Consulte RELEASE_NOTES_BETA_1.0.md
          </p>
          <p className="text-xs text-blue-800">
            Para suporte técnico ou dúvidas, entre em contato com a equipe de desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}