import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Download } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";

export default function StorytellingTerritorial() {
  const [comunidadeSelecionada, setComunidadeSelecionada] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [narrativa, setNarrativa] = useState('');

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-story'],
    queryFn: () => base44.entities.Registro.list('-created_date', 500)
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders-story'],
    queryFn: () => base44.entities.Stakeholder.list()
  });

  const { data: casos = [] } = useQuery({
    queryKey: ['casos-story'],
    queryFn: () => base44.entities.Caso.list()
  });

  const gerarStory = async () => {
    if (!comunidadeSelecionada) return;

    setCarregando(true);
    
    const comunidade = comunidades.find(c => c.id === comunidadeSelecionada);
    if (!comunidade) return;

    // Filtrar dados da comunidade
    const registrosComunidade = registros.filter(r => r.comunidade === comunidade.nome);
    const stakeholdersComunidade = stakeholders.filter(s => s.comunidade === comunidade.nome);
    const casosComunidade = casos.filter(c => c.comunidade === comunidade.nome);

    // Extrair temas e demandas
    const temas = [...new Set(registrosComunidade.flatMap(r => r.temas_identificados || []))];
    const demandas = registrosComunidade.flatMap(r => r.demandas || []).slice(0, 10);

    // Preparar contexto
    const contextoRegistros = registrosComunidade.slice(0, 20).map(r => 
      `${r.titulo}: ${r.descricao || r.transcricao?.substring(0, 200)}`
    ).join('\n\n');

    const contextoStakeholders = stakeholdersComunidade.slice(0, 10).map(s =>
      `${s.nome} - ${s.papel_social || s.tipo}`
    ).join(', ');

    const contextoCasos = casosComunidade.slice(0, 5).map(c =>
      `${c.titulo}: ${c.descricao?.substring(0, 150)}`
    ).join('\n');

    const prompt = `Você é um jornalista narrativo especializado em histórias comunitárias. Crie uma narrativa envolvente sobre a comunidade "${comunidade.nome}".

**ESTILO:**
- Use frases curtas e diretas
- Evite excesso de adjetivos
- Foque em fatos e pessoas reais
- Seja objetivo mas humanizado
- Use storytelling para conectar dados e vivências

**ESTRUTURA:**
1. Contexto histórico e geográfico do município (dados do IBGE quando disponíveis)
2. A comunidade hoje: população, características, desafios
3. Vozes da comunidade: stakeholders e suas histórias
4. Temas emergentes e demandas principais
5. Casos emblemáticos que ilustram a realidade local

**DADOS DISPONÍVEIS:**

Município/Comunidade: ${comunidade.nome}

Registros recentes (resumo):
${contextoRegistros}

Principais stakeholders:
${contextoStakeholders}

Temas identificados:
${temas.join(', ')}

Casos em andamento:
${contextoCasos}

**IMPORTANTE:**
- Comece buscando dados históricos e do IBGE sobre o município
- Teça uma narrativa coesa conectando história, presente e futuro
- Cite pessoas e situações reais dos registros
- Mantenha tom jornalístico e respeitoso
- Máximo 800 palavras

Gere a narrativa em português do Brasil, em texto corrido.`;

    try {
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });

      setNarrativa(resultado);
    } catch (error) {
      alert('Erro ao gerar narrativa: ' + error.message);
    } finally {
      setCarregando(false);
    }
  };

  const copiarTexto = () => {
    navigator.clipboard.writeText(narrativa);
    alert('✓ Narrativa copiada para a área de transferência!');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#2D6A4F]" />
            Storytelling Territorial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900">
              Gera uma narrativa jornalística sobre a comunidade, integrando dados históricos do IBGE, 
              registros da plataforma, stakeholders mapeados e casos em andamento.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Selecione a Comunidade</Label>
              <Select value={comunidadeSelecionada} onValueChange={setComunidadeSelecionada}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Escolha uma comunidade para gerar a narrativa" />
                </SelectTrigger>
                <SelectContent>
                  {comunidades.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={gerarStory}
              disabled={!comunidadeSelecionada || carregando}
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando narrativa...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Gerar Storytelling
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {narrativa && (
        <Card className="border-[#2D6A4F]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Narrativa Gerada</CardTitle>
              <Button variant="outline" size="sm" onClick={copiarTexto}>
                <Download className="w-4 h-4 mr-2" />
                Copiar Texto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={narrativa}
              onChange={(e) => setNarrativa(e.target.value)}
              rows={25}
              className="font-serif text-base leading-relaxed"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}