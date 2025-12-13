import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, CheckSquare, File, Loader2, X } from 'lucide-react';
import { buscarPorCodigo, decodificarCodigo } from './GeradorCodigoUnico';
import { cn } from "@/lib/utils";

export default function BuscaInteligenteCodigo({ className }) {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const handleBuscar = async () => {
    if (!busca.trim()) return;
    
    setBuscando(true);
    try {
      const results = await buscarPorCodigo(busca);
      setResultados(results);
      setMostrarResultados(true);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setBuscando(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  const handleSelecionarResultado = (resultado) => {
    // Redirecionar baseado no tipo
    if (resultado.tipo_busca === 'Registro') {
      navigate(createPageUrl('VerRegistro') + `?id=${resultado.id}`);
    } else if (resultado.tipo_busca === 'Caso') {
      navigate(createPageUrl('VerCaso') + `?id=${resultado.id}`);
    }
    
    // Limpar busca
    setBusca('');
    setMostrarResultados(false);
    setResultados([]);
  };

  const limparBusca = () => {
    setBusca('');
    setMostrarResultados(false);
    setResultados([]);
  };

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'Registro': return FileText;
      case 'Caso': return CheckSquare;
      case 'Documento': return File;
      default: return FileText;
    }
  };

  const getTipoBadgeColor = (tipo) => {
    switch (tipo) {
      case 'Registro': return 'bg-blue-100 text-blue-700';
      case 'Caso': return 'bg-emerald-100 text-emerald-700';
      case 'Documento': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Campo de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Buscar por código (ex: CA-AIM-000045-2026)"
          className="pl-10 pr-24"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {busca && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={limparBusca}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleBuscar}
            disabled={buscando || !busca.trim()}
            className="h-7"
          >
            {buscando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Buscar'
            )}
          </Button>
        </div>
      </div>

      {/* Resultados */}
      {mostrarResultados && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-3">
            {resultados.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <Search className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Nenhum resultado encontrado</p>
                <p className="text-xs mt-1">Tente: RE-AIM-000123-2026 ou apenas 000123</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-500 mb-3">
                  {resultados.length} resultado{resultados.length !== 1 && 's'} encontrado{resultados.length !== 1 && 's'}
                </p>
                {resultados.map((resultado, idx) => {
                  const Icon = getIcon(resultado.tipo_busca);
                  const info = decodificarCodigo(resultado.codigo_unico);
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelecionarResultado(resultado)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#2D6A4F] flex items-center justify-center text-white flex-shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className={getTipoBadgeColor(resultado.tipo_busca)}>
                              {resultado.tipo_busca}
                            </Badge>
                            <span className="text-xs font-mono text-slate-500">
                              {resultado.codigo_unico}
                            </span>
                          </div>
                          <p className="font-medium text-sm truncate">
                            {resultado.titulo || resultado.descricao}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            {resultado.comunidade && <span>📍 {resultado.comunidade}</span>}
                            {info && <span>🏢 {info.unidade}</span>}
                            {resultado.data_registro && (
                              <span>📅 {new Date(resultado.data_registro).toLocaleDateString('pt-BR')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overlay para fechar */}
      {mostrarResultados && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setMostrarResultados(false)}
        />
      )}
    </div>
  );
}