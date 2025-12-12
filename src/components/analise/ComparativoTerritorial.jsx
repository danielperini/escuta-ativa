import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Users, TrendingUp, Building, Calendar, AlertCircle } from 'lucide-react';

export default function ComparativoTerritorial() {
  const [comunidadeSelecionada, setComunidadeSelecionada] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [dadosTerritorio, setDadosTerritorio] = useState(null);

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-territorio'],
    queryFn: () => base44.entities.Registro.list('-created_date', 500)
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders-territorio'],
    queryFn: () => base44.entities.Stakeholder.list()
  });

  const buscarDadosTerritorio = async () => {
    if (!comunidadeSelecionada) return;

    setCarregando(true);
    
    const comunidade = comunidades.find(c => c.id === comunidadeSelecionada);
    if (!comunidade) return;

    // Registros da comunidade
    const registrosComunidade = registros.filter(r => r.comunidade === comunidade.nome);
    const stakeholdersComunidade = stakeholders.filter(s => s.comunidade === comunidade.nome);

    // Extrair movimentos sociais mencionados
    const movimentosSociais = new Set();
    registrosComunidade.forEach(r => {
      (r.temas_identificados || []).forEach(tema => {
        if (tema.toLowerCase().includes('movimento') || 
            tema.toLowerCase().includes('mobilização') ||
            tema.toLowerCase().includes('coletivo') ||
            tema.toLowerCase().includes('associação')) {
          movimentosSociais.add(tema);
        }
      });
    });

    // Buscar dados do IBGE e informações municipais
    const prompt = `Busque informações atualizadas sobre o território/município relacionado à comunidade "${comunidade.nome}":

1. **Dados do IBGE:**
   - População estimada (mais recente)
   - Área territorial (km²)
   - Densidade demográfica
   - PIB per capita
   - IDH (se disponível)

2. **Dados Políticos:**
   - Nome do prefeito atual
   - Partido político do prefeito
   - Ano de início do mandato

3. **Contexto Histórico:**
   - Breve histórico da formação do município/comunidade (2-3 parágrafos)
   - Principais eventos históricos relevantes
   - Origem do nome

4. **Características Sociais:**
   - Principais atividades econômicas
   - Questões sociais relevantes conhecidas

Seja factual e cite fontes quando possível. Se não encontrar dados específicos, informe "Dado não disponível".`;

    try {
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            dados_ibge: {
              type: "object",
              properties: {
                populacao: { type: "string" },
                area_km2: { type: "string" },
                densidade: { type: "string" },
                pib_per_capita: { type: "string" },
                idh: { type: "string" }
              }
            },
            dados_politicos: {
              type: "object",
              properties: {
                prefeito: { type: "string" },
                partido: { type: "string" },
                mandato_inicio: { type: "string" }
              }
            },
            historico: {
              type: "array",
              items: { type: "string" }
            },
            caracteristicas_sociais: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setDadosTerritorio({
        comunidade: comunidade.nome,
        ...resultado,
        dados_plataforma: {
          total_registros: registrosComunidade.length,
          stakeholders: stakeholdersComunidade.length,
          movimentos_detectados: Array.from(movimentosSociais)
        }
      });
    } catch (error) {
      alert('Erro ao buscar dados: ' + error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#2D6A4F]" />
            Análise Territorial Completa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Selecione a Comunidade</Label>
              <Select value={comunidadeSelecionada} onValueChange={setComunidadeSelecionada}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Escolha uma comunidade" />
                </SelectTrigger>
                <SelectContent>
                  {comunidades.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={buscarDadosTerritorio}
              disabled={!comunidadeSelecionada || carregando}
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Buscando dados...
                </>
              ) : (
                'Buscar Dados do Território'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {dadosTerritorio && (
        <div className="space-y-6">
          {/* Dados do IBGE */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Oficiais (IBGE)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-500">População</p>
                  <p className="text-lg font-semibold">{dadosTerritorio.dados_ibge?.populacao || 'N/D'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Área (km²)</p>
                  <p className="text-lg font-semibold">{dadosTerritorio.dados_ibge?.area_km2 || 'N/D'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Densidade</p>
                  <p className="text-lg font-semibold">{dadosTerritorio.dados_ibge?.densidade || 'N/D'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">PIB per capita</p>
                  <p className="text-lg font-semibold">{dadosTerritorio.dados_ibge?.pib_per_capita || 'N/D'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">IDH</p>
                  <p className="text-lg font-semibold">{dadosTerritorio.dados_ibge?.idh || 'N/D'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados Políticos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5" />
                Gestão Municipal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Prefeito(a)</p>
                  <p className="text-lg font-semibold">{dadosTerritorio.dados_politicos?.prefeito || 'N/D'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Partido</p>
                  <Badge className="mt-1">{dadosTerritorio.dados_politicos?.partido || 'N/D'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Início do Mandato</p>
                  <p className="text-lg font-semibold">{dadosTerritorio.dados_politicos?.mandato_inicio || 'N/D'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico */}
          {dadosTerritorio.historico && dadosTerritorio.historico.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Contexto Histórico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {dadosTerritorio.historico.map((paragrafo, idx) => (
                    <p key={idx} className="text-slate-700 mb-3">{paragrafo}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Características Sociais */}
          {dadosTerritorio.caracteristicas_sociais && dadosTerritorio.caracteristicas_sociais.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Características Socioeconômicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {dadosTerritorio.caracteristicas_sociais.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Dados da Plataforma */}
          <Card className="border-[#2D6A4F]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2D6A4F]" />
                Dados Coletados na Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-500">Registros</p>
                  <p className="text-2xl font-bold text-[#2D6A4F]">{dadosTerritorio.dados_plataforma.total_registros}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Stakeholders Mapeados</p>
                  <p className="text-2xl font-bold text-[#2D6A4F]">{dadosTerritorio.dados_plataforma.stakeholders}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Movimentos Detectados</p>
                  <p className="text-2xl font-bold text-[#2D6A4F]">{dadosTerritorio.dados_plataforma.movimentos_detectados.length}</p>
                </div>
              </div>

              {dadosTerritorio.dados_plataforma.movimentos_detectados.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Movimentos Sociais Identificados:</p>
                  <div className="flex flex-wrap gap-2">
                    {dadosTerritorio.dados_plataforma.movimentos_detectados.map((mov, idx) => (
                      <Badge key={idx} variant="outline" className="bg-[#D8F3DC] text-[#1B4332]">
                        {mov}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}