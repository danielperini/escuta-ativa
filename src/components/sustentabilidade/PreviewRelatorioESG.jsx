import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Globe, Users, Target, BarChart3, FileText } from 'lucide-react';
import ClassificadorAutomaticoESG from './ClassificadorAutomaticoESG.jsx';

export default function PreviewRelatorioESG({ configuracao, registros, configuracaoESG }) {
  const classificador = new ClassificadorAutomaticoESG(registros);
  const dados = classificador.classificar();

  const coresODS = {
    1: '#E5243B', 4: '#C5192D', 5: '#FF3A21', 8: '#A21942',
    10: '#DD1367', 11: '#FD9D24', 16: '#00689D', 17: '#19486A'
  };

  return (
    <div className="space-y-6">
      {/* Perfil da Empresa */}
      <Card className="border-2 border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            Perfil da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Nome da Empresa</p>
              <p className="font-semibold text-slate-900">{configuracaoESG?.nome_empresa || 'Não configurado'}</p>
            </div>
            {configuracaoESG?.cnpj && (
              <div>
                <p className="text-sm text-slate-500">CNPJ</p>
                <p className="font-semibold text-slate-900">{configuracaoESG.cnpj}</p>
              </div>
            )}
            {configuracaoESG?.setor_atuacao && (
              <div>
                <p className="text-sm text-slate-500">Setor de Atuação</p>
                <p className="font-semibold text-slate-900">{configuracaoESG.setor_atuacao}</p>
              </div>
            )}
            {configuracaoESG?.compromissos_publicos && (
              <div>
                <p className="text-sm text-slate-500 mb-2">Compromissos Públicos</p>
                <div className="flex flex-wrap gap-2">
                  {configuracaoESG.compromissos_publicos.map((c, idx) => (
                    <Badge key={idx} className="bg-emerald-100 text-emerald-700">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Panorama das Ações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Panorama das Ações de Sustentabilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">{dados.classificacoes_acoes.direitos_humanos}</p>
              <p className="text-sm text-slate-700">Direitos Humanos</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-2xl font-bold text-purple-600">{dados.classificacoes_acoes.participacao_social}</p>
              <p className="text-sm text-slate-700">Participação Social</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-600">{dados.classificacoes_acoes.dialogo_comunitario}</p>
              <p className="text-sm text-slate-700">Diálogo Comunitário</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-2xl font-bold text-orange-600">{dados.classificacoes_acoes.desenvolvimento_local}</p>
              <p className="text-sm text-slate-700">Desenvolvimento Local</p>
            </div>
            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
              <p className="text-2xl font-bold text-teal-600">{dados.classificacoes_acoes.governanca_social}</p>
              <p className="text-sm text-slate-700">Governança Social</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-2xl font-bold text-indigo-600">{dados.classificacoes_acoes.gestao_impactos}</p>
              <p className="text-sm text-slate-700">Gestão de Impactos</p>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
              <p className="text-2xl font-bold text-pink-600">{dados.classificacoes_acoes.cultura_identidade}</p>
              <p className="text-sm text-slate-700">Cultura e Identidade</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-2xl font-bold text-amber-600">{dados.classificacoes_acoes.construcao_conjunta}</p>
              <p className="text-sm text-slate-700">Construção Conjunta</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRI Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Alinhamento com GRI Standards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dados.vinculacao_gri.map((gri, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div>
                  <p className="font-semibold text-slate-900">{gri.codigo}</p>
                  <p className="text-sm text-slate-600">{gri.descricao}</p>
                </div>
                <Badge className="bg-indigo-600 text-white">{gri.quantidade} ações</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ODS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Alinhamento com Objetivos de Desenvolvimento Sustentável
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dados.vinculacao_ods.map((ods, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 p-3 rounded-lg border-2"
                style={{ 
                  borderColor: coresODS[ods.numero],
                  backgroundColor: `${coresODS[ods.numero]}10`
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: coresODS[ods.numero] }}
                >
                  {ods.numero}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm">{ods.nome}</p>
                  <p className="text-xs text-slate-600">{ods.quantidade} ações vinculadas</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pacto Global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Alinhamento com Pacto Global da ONU
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dados.vinculacao_pacto_global.map((pacto, idx) => (
              <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{pacto.principio}</p>
                    <Badge className="mt-1 bg-purple-100 text-purple-700">{pacto.categoria}</Badge>
                  </div>
                  <Badge className="bg-purple-600 text-white">{pacto.quantidade}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CSRD / ESRS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Conformidade CSRD / ESRS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dados.vinculacao_esrs.map((esrs, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div>
                  <p className="font-semibold text-slate-900">{esrs.codigo}</p>
                  <p className="text-sm text-slate-600">{esrs.descricao}</p>
                </div>
                <Badge className="bg-emerald-600 text-white">{esrs.quantidade} ações</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metodologia */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">Metodologia de Consolidação</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 leading-relaxed">
            Este relatório consolida {registros.length} registros de interações sociais no período de{' '}
            {new Date(configuracao.data_inicio).toLocaleDateString('pt-BR')} a{' '}
            {new Date(configuracao.data_fim).toLocaleDateString('pt-BR')}. As ações foram classificadas automaticamente
            por inteligência artificial utilizando análise de palavras-chave e contexto temático, com vinculação automática
            aos padrões GRI Standards, Objetivos de Desenvolvimento Sustentável (ODS), Princípios do Pacto Global da ONU
            e European Sustainability Reporting Standards (ESRS/CSRD).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}