import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  FileText, 
  Copy, 
  Download, 
  Loader2,
  CheckCircle2,
  Calendar,
  MapPin,
  Users
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function IntegradorTextoIA() {
  const [registrosSelecionados, setRegistrosSelecionados] = useState([]);
  const [tipoTexto, setTipoTexto] = useState('relatorio');
  const [textoGerado, setTextoGerado] = useState('');
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroComunidade, setFiltroComunidade] = useState('todas');

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ['registros-integracao'],
    queryFn: () => base44.entities.Registro.list('-created_date', 100)
  });

  // Extrair comunidades únicas
  const comunidadesUnicas = React.useMemo(() => {
    if (!registros) return [];
    const comunidades = new Set();
    registros.forEach(r => {
      if (r.comunidade) comunidades.add(r.comunidade);
    });
    return Array.from(comunidades).sort();
  }, [registros]);

  // Filtrar registros
  const registrosFiltrados = registros.filter(r => {
    const matchStatus = filtroStatus === 'todos' || r.status === filtroStatus;
    const matchComunidade = filtroComunidade === 'todas' || r.comunidade === filtroComunidade;
    return matchStatus && matchComunidade;
  });

  const toggleRegistro = (id) => {
    setRegistrosSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(rid => rid !== id)
        : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    if (registrosSelecionados.length === registrosFiltrados.length) {
      setRegistrosSelecionados([]);
    } else {
      setRegistrosSelecionados(registrosFiltrados.map(r => r.id));
    }
  };

  const gerarTextoIntegrado = async () => {
    if (registrosSelecionados.length === 0) return;

    setGerando(true);
    try {
      const registrosParaIntegrar = registros.filter(r => 
        registrosSelecionados.includes(r.id)
      );

      // Preparar dados dos registros
      const dadosRegistros = registrosParaIntegrar.map(r => ({
        titulo: r.titulo,
        tipo: r.tipo,
        data: r.data_registro,
        comunidade: r.comunidade,
        descricao: r.descricao,
        transcricao: r.transcricao,
        participantes: r.participantes,
        temas: r.temas_identificados,
        demandas: r.demandas,
        compromissos: r.compromissos,
        temperatura: r.temperatura_territorio,
        sentimento: r.sentimento
      }));

      // Definir tipo de texto
      const tiposTexto = {
        relatorio: 'Relatório Executivo',
        narrativa: 'Narrativa Territorial',
        ata: 'Ata de Reunião Consolidada',
        analise: 'Análise Crítica',
        sintese: 'Síntese Temática'
      };

      // Prompt para a IA
      const prompt = `Você é um especialista em análise territorial e elaboração de textos integrados.

**TAREFA**: Criar um(a) ${tiposTexto[tipoTexto]} integrando os seguintes ${registrosParaIntegrar.length} registros de campo:

${JSON.stringify(dadosRegistros, null, 2)}

**INSTRUÇÕES**:
1. Integre todas as informações de forma coerente e fluida
2. Identifique padrões, conexões e tendências entre os registros
3. Destaque demandas recorrentes e compromissos assumidos
4. Analise a temperatura territorial e sentimentos predominantes
5. Organize por temas quando relevante
6. Use uma linguagem ${tipoTexto === 'relatorio' ? 'formal e executiva' : tipoTexto === 'ata' ? 'formal e estruturada' : 'narrativa e envolvente'}
7. Inclua datas, locais e participantes relevantes
8. Faça uma análise crítica quando apropriado

**FORMATO DO TEXTO**:
${tipoTexto === 'relatorio' ? '- Resumo Executivo\n- Contexto\n- Principais Achados\n- Demandas Identificadas\n- Compromissos\n- Recomendações' : 
  tipoTexto === 'narrativa' ? '- Introdução contextual\n- Desenvolvimento narrativo\n- Vozes do território\n- Conclusão e perspectivas' :
  tipoTexto === 'ata' ? '- Cabeçalho\n- Presentes\n- Pauta\n- Deliberações\n- Encaminhamentos\n- Assinaturas' :
  tipoTexto === 'analise' ? '- Contexto\n- Análise dos dados\n- Identificação de riscos e oportunidades\n- Considerações finais' :
  '- Visão geral\n- Síntese por tema\n- Conclusões'}

Gere o texto completo, bem estruturado e pronto para uso.`;

      const resposta = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setTextoGerado(resposta);
    } catch (error) {
      console.error('Erro ao gerar texto:', error);
      setTextoGerado('Erro ao gerar o texto integrado. Tente novamente.');
    } finally {
      setGerando(false);
    }
  };

  const copiarTexto = () => {
    navigator.clipboard.writeText(textoGerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const baixarTexto = () => {
    const blob = new Blob([textoGerado], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `texto-integrado-${tipoTexto}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Integrador de Texto com IA</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Selecione registros e crie textos integrados automaticamente
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Seleção de Registros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Selecionar Registros ({registrosSelecionados.length})</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={selecionarTodos}
              >
                {registrosSelecionados.length === registrosFiltrados.length ? 'Desmarcar' : 'Marcar'} Todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="finalizado">Finalizados</SelectItem>
                    <SelectItem value="rascunho">Rascunhos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Comunidade</Label>
                <Select value={filtroComunidade} onValueChange={setFiltroComunidade}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {comunidadesUnicas.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lista de Registros */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">
                  <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />
                  Carregando registros...
                </div>
              ) : registrosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  Nenhum registro encontrado
                </div>
              ) : (
                registrosFiltrados.map(registro => (
                  <div
                    key={registro.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => toggleRegistro(registro.id)}
                  >
                    <Checkbox
                      checked={registrosSelecionados.includes(registro.id)}
                      onCheckedChange={() => toggleRegistro(registro.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-slate-900 truncate">
                        {registro.titulo}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        {registro.data_registro && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(registro.data_registro).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {registro.comunidade && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {registro.comunidade}
                          </span>
                        )}
                      </div>
                      {registro.participantes?.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                          <Users className="w-3 h-3" />
                          {registro.participantes.length} participantes
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuração e Geração */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuração do Texto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Texto</Label>
              <Select value={tipoTexto} onValueChange={setTipoTexto}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relatorio">📊 Relatório Executivo</SelectItem>
                  <SelectItem value="narrativa">📖 Narrativa Territorial</SelectItem>
                  <SelectItem value="ata">📝 Ata Consolidada</SelectItem>
                  <SelectItem value="analise">🔍 Análise Crítica</SelectItem>
                  <SelectItem value="sintese">💡 Síntese Temática</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={gerarTextoIntegrado}
              disabled={registrosSelecionados.length === 0 || gerando}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {gerando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando texto integrado...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Texto Integrado
                </>
              )}
            </Button>

            {textoGerado && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Texto Gerado</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copiarTexto}
                    >
                      {copiado ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={baixarTexto}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={textoGerado}
                  onChange={(e) => setTextoGerado(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}