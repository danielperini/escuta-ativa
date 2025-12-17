import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Search, ThumbsUp, Eye, Filter, Lightbulb, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORIAS = [
  "Todas",
  "Escuta e Diálogo",
  "Presença no Território",
  "Participação Social",
  "Conflitos e Mediação",
  "Confiança e Legitimidade",
  "Ética e Responsabilidade",
  "Materialidade e ESG",
  "Redes Comunitárias",
  "Planejamento e Governança",
  "Riscos Sociais"
];

const CORES_CATEGORIA = {
  "Escuta e Diálogo": "bg-blue-100 text-blue-700",
  "Presença no Território": "bg-emerald-100 text-emerald-700",
  "Participação Social": "bg-purple-100 text-purple-700",
  "Conflitos e Mediação": "bg-orange-100 text-orange-700",
  "Confiança e Legitimidade": "bg-indigo-100 text-indigo-700",
  "Ética e Responsabilidade": "bg-pink-100 text-pink-700",
  "Materialidade e ESG": "bg-teal-100 text-teal-700",
  "Redes Comunitárias": "bg-cyan-100 text-cyan-700",
  "Planejamento e Governança": "bg-violet-100 text-violet-700",
  "Riscos Sociais": "bg-red-100 text-red-700"
};

export default function CardsEducativos() {
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [cardSelecionado, setCardSelecionado] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [horarioUltimaAtualizacao, setHorarioUltimaAtualizacao] = useState(new Date());

  const { data: cards = [], isLoading, refetch } = useQuery({
    queryKey: ['cards-educativos'],
    queryFn: () => base44.entities.CardEducativo.list('-ordem', 200)
  });

  const { data: macrotemas = [] } = useQuery({
    queryKey: ['macrotemas'],
    queryFn: () => base44.entities.Macrotema.list()
  });

  const { data: registrosRecentes = [] } = useQuery({
    queryKey: ['registros-recentes-dicas'],
    queryFn: () => base44.entities.Registro.list('-created_date', 20)
  });

  // Contextualizar cards com base nos temas do sistema
  const contextualizarCards = () => {
    if (cards.length === 0) return [];

    // Temas do sistema (macrotemas + registros)
    const temasAtivos = new Set([
      ...macrotemas.map(m => m.nome.toLowerCase()),
      ...registrosRecentes.flatMap(r => (r.temas_identificados || []).map(t => t.toLowerCase()))
    ]);

    // Priorizar cards que mencionam temas ativos
    const cardsComScore = cards.map(card => {
      let score = 0;
      const textoCompleto = (card.titulo + ' ' + card.texto).toLowerCase();
      
      temasAtivos.forEach(tema => {
        if (textoCompleto.includes(tema)) score += 2;
      });

      // Bonus para categorias relacionadas aos macrotemas
      const categoriasSociais = ['Conflitos e Mediação', 'Riscos Sociais', 'Escuta e Diálogo'];
      if (categoriasSociais.includes(card.categoria)) score += 1;

      return { ...card, relevancia: score };
    });

    // Ordenar por relevância (mais relevantes primeiro)
    return cardsComScore.sort((a, b) => b.relevancia - a.relevancia);
  };

  const gerarCards = async () => {
    setGerando(true);
    try {
      const response = await base44.functions.invoke('gerarCardsEducativos', {});
      alert(response.data.message);
      refetch();
    } catch (error) {
      alert('Erro ao gerar cards: ' + error.message);
    } finally {
      setGerando(false);
    }
  };

  // Atualização automática às 7h, 12h e 20h
  React.useEffect(() => {
    const verificarHorario = () => {
      const agora = new Date();
      const hora = agora.getHours();
      const ultimaHora = horarioUltimaAtualizacao.getHours();

      // Horários de troca: 7h, 12h, 20h
      const horariosRotacao = [7, 12, 20];
      
      for (const horarioAlvo of horariosRotacao) {
        if (hora === horarioAlvo && ultimaHora !== horarioAlvo) {
          avancarDicas(2); // Avançar 2 cards
          setHorarioUltimaAtualizacao(agora);
          break;
        }
      }
    };

    const interval = setInterval(verificarHorario, 60000); // Verificar a cada 1 minuto
    return () => clearInterval(interval);
  }, [horarioUltimaAtualizacao, cards.length]);

  const avancarDicas = (quantidade = 2) => {
    const cardsContextualizados = contextualizarCards();
    setIndiceAtual(prev => (prev + quantidade) % cardsContextualizados.length);
  };

  const voltarDicas = () => {
    const cardsContextualizados = contextualizarCards();
    setIndiceAtual(prev => (prev - 2 + cardsContextualizados.length) % cardsContextualizados.length);
  };

  const cardsContextualizados = contextualizarCards();
  
  const cardsFiltrados = (busca || categoriaFiltro !== 'Todas' 
    ? cards 
    : cardsContextualizados
  ).filter(card => {
    const matchBusca = busca === '' || 
      card.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      card.texto.toLowerCase().includes(busca.toLowerCase());
    
    const matchCategoria = categoriaFiltro === 'Todas' || card.categoria === categoriaFiltro;
    
    return matchBusca && matchCategoria;
  });

  const cardsExibidos = [
    cardsFiltrados[indiceAtual % cardsFiltrados.length],
    cardsFiltrados[(indiceAtual + 1) % cardsFiltrados.length]
  ].filter(Boolean);

  const estatisticas = {
    total: cards.length,
    porCategoria: CATEGORIAS.slice(1).map(cat => ({
      nome: cat,
      count: cards.filter(c => c.categoria === cat).length
    }))
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-amber-500" />
            Cards Educativos
          </h2>
          <p className="text-slate-500 mt-1">
            Relacionamento Comunitário e Diálogo Social
          </p>
        </div>
        <Button 
          onClick={gerarCards}
          disabled={gerando || cards.length > 0}
          className="bg-[#2D6A4F] hover:bg-[#1B4332]"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          {gerando ? 'Gerando...' : cards.length > 0 ? 'Cards Gerados' : 'Gerar 150 Cards'}
        </Button>
      </div>

      {/* Estatísticas */}
      {cards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-slate-900">{estatisticas.total}</p>
              <p className="text-sm text-slate-500 mt-1">Total de Cards</p>
            </CardContent>
          </Card>
          {estatisticas.porCategoria.slice(0, 4).map(cat => (
            <Card key={cat.nome}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{cat.count}</p>
                <p className="text-xs text-slate-500 mt-1">{cat.nome}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filtros */}
      {cards.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por título ou conteúdo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="w-full sm:w-64">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Cards Carrossel - Modo Principal */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Carregando cards...</p>
        </div>
      ) : cards.length === 0 ? (
        <Card className="p-12 text-center">
          <Lightbulb className="w-16 h-16 mx-auto mb-4 text-amber-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Nenhum card gerado ainda
          </h3>
          <p className="text-slate-500 mb-4">
            Clique em "Gerar 150 Cards" para criar conteúdo educativo sobre Relacionamento Comunitário
          </p>
        </Card>
      ) : busca || categoriaFiltro !== 'Todas' ? (
        // Modo de busca/filtro: grid tradicional
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cardsFiltrados.map(card => (
            <Card 
              key={card.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCardSelecionado(card)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">
                    {card.titulo}
                  </CardTitle>
                  <Badge className={cn("shrink-0 text-xs", CORES_CATEGORIA[card.categoria])}>
                    #{card.card_id}
                  </Badge>
                </div>
                <Badge variant="outline" className={cn("w-fit", CORES_CATEGORIA[card.categoria])}>
                  {card.categoria}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600 line-clamp-4">
                  {card.texto}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {card.visualizacoes || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {card.curtidas || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Modo carrossel: 2 cards centralizados ocupando largura total
        <div className="space-y-6">
          {/* Indicador de rotação automática */}
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-4 flex items-center justify-center gap-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-900">
                <span className="font-semibold">Dicas contextualizadas</span> • 
                Atualização automática às 7h, 12h e 20h
              </p>
            </CardContent>
          </Card>

          {/* Container com navegação integrada */}
          <div className="relative">
            {/* Botão Anterior - fixo à esquerda */}
            <Button
              variant="ghost"
              size="icon"
              onClick={voltarDicas}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white shadow-lg hover:bg-slate-50 hover:scale-110 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            {/* Cards em destaque - largura total */}
            <div className="px-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cardsExibidos.map((card, idx) => (
                  <Card 
                    key={card?.id || idx}
                    className="hover:shadow-2xl transition-all duration-300 border-2 hover:border-[#E31E24] h-full"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge className={cn("text-xs", CORES_CATEGORIA[card?.categoria])}>
                          {card?.categoria}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          #{card?.card_id}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl leading-tight">
                        {card?.titulo}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-700 leading-relaxed text-base">
                        {card?.texto}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-400 pt-3 border-t">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {card?.visualizacoes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {card?.curtidas || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Botão Próxima - fixo à direita */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => avancarDicas(2)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white shadow-lg hover:bg-slate-50 hover:scale-110 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          {/* Indicador de posição centralizado */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 px-6 py-3 bg-slate-100 rounded-full">
              <span className="text-sm font-semibold text-slate-700">
                {Math.floor(indiceAtual / 2) + 1} de {Math.ceil(cardsFiltrados.length / 2)}
              </span>
            </div>
          </div>

            {/* Indicador de próxima rotação */}
            <div className="text-center mt-4">
              <p className="text-xs text-slate-400">
                Próxima rotação automática: {(() => {
                  const agora = new Date();
                  const hora = agora.getHours();
                  const proximoHorario = hora < 7 ? 7 : hora < 12 ? 12 : hora < 20 ? 20 : 7;
                  const proximoDia = proximoHorario === 7 && hora >= 20 ? 1 : 0;
                  const dataProxima = new Date(agora);
                  dataProxima.setDate(dataProxima.getDate() + proximoDia);
                  dataProxima.setHours(proximoHorario, 0, 0, 0);
                  return format(dataProxima, "dd/MM 'às' HH:mm", { locale: ptBR });
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {cardsFiltrados.length === 0 && cards.length > 0 && (
        <Card className="p-8 text-center">
          <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Nenhum card encontrado com os filtros aplicados</p>
        </Card>
      )}

      {/* Modal Card Detalhado */}
      {cardSelecionado && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setCardSelecionado(null)}
        >
          <Card 
            className="max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Badge className={cn("mb-2", CORES_CATEGORIA[cardSelecionado.categoria])}>
                    {cardSelecionado.categoria}
                  </Badge>
                  <CardTitle className="text-xl">{cardSelecionado.titulo}</CardTitle>
                </div>
                <Badge variant="outline">#{cardSelecionado.card_id}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700 leading-relaxed">
                {cardSelecionado.texto}
              </p>
              <div className="flex items-center gap-6 pt-4 border-t">
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <Eye className="w-4 h-4" />
                  {cardSelecionado.visualizacoes || 0} visualizações
                </span>
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <ThumbsUp className="w-4 h-4" />
                  {cardSelecionado.curtidas || 0} curtidas
                </span>
              </div>
              <Button 
                onClick={() => setCardSelecionado(null)}
                variant="outline"
                className="w-full"
              >
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}