import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Calendar as CalendarIcon, Loader2, CheckCircle2, AlertCircle, Leaf, Globe, Users, Target } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ClassificadorAutomaticoESG from '@/components/sustentabilidade/ClassificadorAutomaticoESG.jsx';
import PreviewRelatorioESG from '@/components/sustentabilidade/PreviewRelatorioESG.jsx';
import PainelDadosSecundarios from '@/components/relatorios/PainelDadosSecundarios.jsx';

export default function GeradorRelatorioSustentabilidade() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [etapa, setEtapa] = useState(1); // 1: Configuração, 2: Preview, 3: Gerando
  const [configuracao, setConfiguracao] = useState({
    titulo: `Relatório de Sustentabilidade ${format(new Date(), 'yyyy')}`,
    tipo_escopo: 'plataforma_completa',
    data_inicio: subMonths(new Date(), 12),
    data_fim: new Date(),
    comunidade: '',
    territorio: '',
    registros_selecionados: []
  });
  
  const [dadosClassificados, setDadosClassificados] = useState(null);
  const [dadosSecundarios, setDadosSecundarios] = useState(null);

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-sustentabilidade'],
    queryFn: () => base44.entities.Registro.list('-created_date', 1000)
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades-sustentabilidade'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: configuracaoESG } = useQuery({
    queryKey: ['configuracao-esg'],
    queryFn: async () => {
      const configs = await base44.entities.ConfiguracaoESG.list('-created_date', 1);
      return configs[0] || null;
    }
  });

  const gerarRelatorioMutation = useMutation({
    mutationFn: async (dados) => {
      return await base44.entities.RelatorioSustentabilidade.create(dados);
    },
    onSuccess: (relatorio) => {
      queryClient.invalidateQueries({ queryKey: ['relatorios-sustentabilidade'] });
      toast.success('Relatório gerado com sucesso!');
      navigate(createPageUrl('RelatoriosGerados'));
    },
    onError: () => {
      toast.error('Erro ao gerar relatório');
      setEtapa(1);
    }
  });

  const { data: casos = [] } = useQuery({
    queryKey: ['casos-sustentabilidade'],
    queryFn: () => base44.entities.Caso.list('-created_date', 1000)
  });

  const registrosFiltrados = React.useMemo(() => {
    let filtered = registros.filter(r => {
      const dataRegistro = new Date(r.data_registro || r.created_date);
      return dataRegistro >= configuracao.data_inicio && dataRegistro <= configuracao.data_fim;
    });

    if (configuracao.tipo_escopo === 'comunidade' && configuracao.comunidade) {
      filtered = filtered.filter(r => r.comunidade === configuracao.comunidade);
    }

    if (configuracao.tipo_escopo === 'territorio' && configuracao.territorio) {
      filtered = filtered.filter(r => r.localizacao?.municipio === configuracao.territorio);
    }

    if (configuracao.tipo_escopo === 'multiplos_registros' && configuracao.registros_selecionados.length > 0) {
      filtered = filtered.filter(r => configuracao.registros_selecionados.includes(r.id));
    }

    return filtered;
  }, [registros, configuracao]);

  const casosFiltrados = React.useMemo(() => {
    return casos.filter(caso => {
      const dataCaso = new Date(caso.created_date);
      return dataCaso >= configuracao.data_inicio && dataCaso <= configuracao.data_fim;
    });
  }, [casos, configuracao]);

  const handleAvancarEtapa = () => {
    if (!configuracaoESG) {
      toast.error('Configure os dados da empresa primeiro em Configurações ESG');
      navigate(createPageUrl('ConfiguracoesESG'));
      return;
    }

    if (registrosFiltrados.length === 0) {
      toast.error('Nenhum registro encontrado para o período selecionado');
      return;
    }

    setEtapa(2);
  };

  const handleGerarRelatorio = async () => {
    setEtapa(3);
    
    // Classificar registros e casos
    const classificador = new ClassificadorAutomaticoESG([...registrosFiltrados, ...casosFiltrados]);
    const dadosClassificados = classificador.classificar();
    
    setDadosClassificados(dadosClassificados);

    // Vincular GRI, ODS, ESRS aos registros e casos
    await vincularPadroesESG(registrosFiltrados, casosFiltrados, dadosClassificados);

    // Criar relatório
    const relatorio = {
      titulo: configuracao.titulo,
      tipo_escopo: configuracao.tipo_escopo,
      data_inicio: format(configuracao.data_inicio, 'yyyy-MM-dd'),
      data_fim: format(configuracao.data_fim, 'yyyy-MM-dd'),
      registros_incluidos: registrosFiltrados.map(r => r.id),
      casos_incluidos: casosFiltrados.map(c => c.id),
      comunidade: configuracao.comunidade,
      territorio: configuracao.territorio,
      total_registros: registrosFiltrados.length,
      total_casos: casosFiltrados.length,
      dados_secundarios: dadosSecundarios ? {
        categorias: dadosSecundarios.categorias,
        indicadoresPorCategoria: dadosSecundarios.indicadoresPorCategoria,
        contexto: dadosSecundarios.contexto,
      } : undefined,
      ...dadosClassificados,
      status: 'concluido',
      versao: '1.0'
    };

    gerarRelatorioMutation.mutate(relatorio);
  };

  const vincularPadroesESG = async (registros, casos, dados) => {
    try {
      // Vincular aos registros
      const updatePromises = registros.slice(0, 50).map(registro => {
        const classificacaoRegistro = classificarRegistroIndividual(registro);
        if (classificacaoRegistro.categorias.length === 0) return Promise.resolve();
        
        return base44.entities.Registro.update(registro.id, {
          vinculacao_gri: dados.vinculacao_gri.slice(0, 5).map(g => g.codigo),
          vinculacao_ods: dados.vinculacao_ods.slice(0, 5).map(o => o.numero),
          vinculacao_esrs: dados.vinculacao_esrs.slice(0, 3).map(e => e.codigo)
        }).catch(err => console.log('Erro ao vincular registro:', err));
      });

      // Vincular aos casos
      const casosPromises = casos.slice(0, 50).map(caso => {
        return base44.entities.Caso.update(caso.id, {
          vinculacao_gri: dados.vinculacao_gri.slice(0, 5).map(g => g.codigo),
          vinculacao_ods: dados.vinculacao_ods.slice(0, 5).map(o => o.numero),
          vinculacao_esrs: dados.vinculacao_esrs.slice(0, 3).map(e => e.codigo)
        }).catch(err => console.log('Erro ao vincular caso:', err));
      });

      await Promise.allSettled([...updatePromises, ...casosPromises]);
    } catch (error) {
      console.log('Erro na vinculação ESG:', error);
    }
  };

  const classificarRegistroIndividual = (registro) => {
    const texto = [
      registro.titulo,
      registro.descricao,
      registro.transcricao,
      ...(registro.temas_identificados || [])
    ].filter(Boolean).join(' ').toLowerCase();

    const palavrasChave = {
      direitos_humanos: ['direito', 'liberdade', 'igualdade'],
      participacao_social: ['participação', 'consulta', 'envolvimento'],
      dialogo_comunitario: ['diálogo', 'conversa', 'escuta'],
      desenvolvimento_local: ['emprego', 'renda', 'capacitação']
    };

    const categorias = [];
    Object.keys(palavrasChave).forEach(categoria => {
      const matches = palavrasChave[categoria].filter(palavra => texto.includes(palavra));
      if (matches.length > 0) categorias.push(categoria);
    });

    return { categorias };
  };

  if (etapa === 3) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <Card className="border-2 border-emerald-200">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-6 text-emerald-600 animate-spin" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Gerando Relatório de Sustentabilidade</h2>
            <p className="text-slate-600 mb-8">
              Analisando {registrosFiltrados.length} registros e {casosFiltrados.length} casos, vinculando aos padrões GRI, ODS, Pacto Global e CSRD/ESRS...
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-slate-700">Classificação automática das ações</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-slate-700">Vinculação GRI Standards</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-slate-700">Mapeamento ODS</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                <span className="text-sm text-slate-700">Crosswalk CSRD/ESRS</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (etapa === 2) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Preview do Relatório</h1>
            <p className="text-slate-500 mt-1">{registrosFiltrados.length} registros analisados</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setEtapa(1)}>
              Voltar
            </Button>
            <Button onClick={handleGerarRelatorio} className="bg-emerald-600 hover:bg-emerald-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Relatório Final
            </Button>
          </div>
        </div>

        <PreviewRelatorioESG
          configuracao={configuracao}
          registros={registrosFiltrados}
          casos={casosFiltrados}
          configuracaoESG={configuracaoESG}
          dadosSecundarios={dadosSecundarios}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gerador de Relatório de Sustentabilidade</h1>
          <p className="text-slate-500 mt-1">GRI • Pacto Global • ODS • CSRD/ESRS</p>
        </div>
      </div>

      {!configuracaoESG && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 mt-1" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Configuração Necessária</h3>
                <p className="text-sm text-amber-800 mb-4">
                  Configure os dados da empresa antes de gerar o relatório.
                </p>
                <Button 
                  onClick={() => navigate(createPageUrl('ConfiguracoesESG'))}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Configurar Empresa
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Configuração do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Título do Relatório</Label>
            <Input
              value={configuracao.titulo}
              onChange={(e) => setConfiguracao({ ...configuracao, titulo: e.target.value })}
              placeholder="Relatório de Sustentabilidade 2024"
            />
          </div>

          <div className="space-y-2">
            <Label>Escopo do Relatório</Label>
            <Select
              value={configuracao.tipo_escopo}
              onValueChange={(value) => setConfiguracao({ ...configuracao, tipo_escopo: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plataforma_completa">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Toda a Plataforma
                  </div>
                </SelectItem>
                <SelectItem value="comunidade">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Por Comunidade
                  </div>
                </SelectItem>
                <SelectItem value="territorio">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Por Território
                  </div>
                </SelectItem>
                <SelectItem value="multiplos_registros">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Registros Selecionados
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {configuracao.tipo_escopo === 'comunidade' && (
            <div className="space-y-2">
              <Label>Comunidade</Label>
              <Select
                value={configuracao.comunidade}
                onValueChange={(value) => setConfiguracao({ ...configuracao, comunidade: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma comunidade" />
                </SelectTrigger>
                <SelectContent>
                  {comunidades.map(c => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(configuracao.data_inicio, 'dd/MM/yyyy', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={configuracao.data_inicio}
                    onSelect={(date) => setConfiguracao({ ...configuracao, data_inicio: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(configuracao.data_fim, 'dd/MM/yyyy', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={configuracao.data_fim}
                    onSelect={(date) => setConfiguracao({ ...configuracao, data_fim: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{registrosFiltrados.length}</p>
                <p className="text-xs text-slate-600">Registros</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(registrosFiltrados.map(r => r.comunidade)).size}
                </p>
                <p className="text-xs text-slate-600">Comunidades</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(registrosFiltrados.flatMap(r => r.participantes || [])).size}
                </p>
                <p className="text-xs text-slate-600">Participantes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {registrosFiltrados.filter(r => r.demandas?.length > 0).length}
                </p>
                <p className="text-xs text-slate-600">Com Demandas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PainelDadosSecundarios
        configuracao={configuracao}
        registrosFiltrados={registrosFiltrados}
        comunidades={comunidades}
        onChange={setDadosSecundarios}
      />

      <div className="flex justify-end gap-3">
        <Button onClick={handleAvancarEtapa} className="bg-emerald-600 hover:bg-emerald-700" size="lg">
          <Leaf className="w-4 h-4 mr-2" />
          Avançar para Preview
        </Button>
      </div>
    </div>
  );
}