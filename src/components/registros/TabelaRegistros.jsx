import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ChevronLeft, ChevronRight, ArrowUpDown, MapPin, Calendar, 
  Users, Target, AlertTriangle, ThermometerSun, Eye, MoreVertical, Trash2, Edit
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { relacionamentoLabel, relacionamentoBadgeClass } from "@/lib/relationshipClassification";

const ITEMS_POR_PAGINA = 20;

const termometroColors = {
  baixo: 'bg-emerald-100 text-emerald-700',
  medio: 'bg-amber-100 text-amber-700',
  alto: 'bg-orange-100 text-orange-700',
  critico: 'bg-red-100 text-red-700'
};

export default function TabelaRegistros({ registros, onExcluir }) {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacao, setOrdenacao] = useState({ campo: 'created_date', direcao: 'desc' });

  const toggleOrdenacao = (campo) => {
    if (ordenacao.campo === campo) {
      setOrdenacao({ campo, direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc' });
    } else {
      setOrdenacao({ campo, direcao: 'desc' });
    }
  };

  const registrosOrdenados = [...registros].sort((a, b) => {
    const { campo, direcao } = ordenacao;
    const mult = direcao === 'asc' ? 1 : -1;
    
    if (campo === 'created_date' || campo === 'data_registro') {
      return mult * (new Date(a[campo] || a.created_date) - new Date(b[campo] || b.created_date));
    }
    if (campo === 'titulo' || campo === 'comunidade') {
      return mult * ((a[campo] || '').localeCompare(b[campo] || ''));
    }
    if (campo === 'temperatura_territorio') {
      const niveis = { critico: 4, alto: 3, medio: 2, baixo: 1 };
      return mult * ((niveis[a[campo]] || 0) - (niveis[b[campo]] || 0));
    }
    return 0;
  });

  const totalPaginas = Math.ceil(registrosOrdenados.length / ITEMS_POR_PAGINA);
  const inicio = (paginaAtual - 1) * ITEMS_POR_PAGINA;
  const registrosPaginados = registrosOrdenados.slice(inicio, inicio + ITEMS_POR_PAGINA);

  const ColunaSortable = ({ campo, children }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
      onClick={() => toggleOrdenacao(campo)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn(
          "w-3 h-3",
          ordenacao.campo === campo ? "text-blue-600" : "text-slate-400"
        )} />
      </div>
    </th>
  );

  return (
    <>
      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-3">
        {registrosPaginados.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            Nenhum registro encontrado
          </Card>
        ) : (
          registrosPaginados.map(registro => (
            <Card key={registro.id} className="p-4">
              <div className="space-y-3">
                <div>
                  <Link to={createPageUrl('VerRegistro') + `?id=${registro.id}`}>
                    <h3 className="font-semibold text-slate-900 mb-1 hover:text-[#2D6A4F] transition-colors cursor-pointer">
                      {registro.titulo}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(registro.created_date || registro.data_registro).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Município</p>
                      <p className="font-medium text-slate-700">
                        {registro.localizacao?.municipio || registro.comunidade?.split(',')[0] || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Comunidade</p>
                      <p className="font-medium text-slate-700">
                        {registro.comunidade?.includes(',') ? registro.comunidade.split(',')[1]?.trim() : registro.local || '-'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {registro.tipo?.replace('_', ' ')}
                    </Badge>
                    {registro.relationship_classification?.classificacao && (
                      <Badge className={cn("text-xs", relacionamentoBadgeClass(registro.relationship_classification.classificacao))}>
                        {relacionamentoLabel(registro.relationship_classification.classificacao)}
                      </Badge>
                    )}
                    {registro.temperatura_territorio && (
                      <Badge className={cn("text-xs", termometroColors[registro.temperatura_territorio])}>
                        {registro.temperatura_territorio}
                      </Badge>
                    )}
                    <Badge className={cn("text-xs",
                      registro.status === 'finalizado' ? 'bg-emerald-100 text-emerald-700' :
                      registro.status === 'rascunho' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    )}>
                      {registro.status}
                    </Badge>
                  </div>
                  
                  {registro.temas_identificados?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {registro.temas_identificados.slice(0, 3).map((tema, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tema}
                        </Badge>
                      ))}
                      {registro.temas_identificados.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{registro.temas_identificados.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <Link 
                    to={createPageUrl('RegistroUnificado') + `?editar=${registro.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onExcluir(registro.id);
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
        
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600">
              {paginaAtual} / {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Desktop Table View */}
      <Card className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <ColunaSortable campo="titulo">Título</ColunaSortable>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Município</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Comunidade</th>
              <ColunaSortable campo="created_date">Data</ColunaSortable>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Relação</th>
              <ColunaSortable campo="temperatura_territorio">Temperatura</ColunaSortable>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Temas</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {registrosPaginados.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-12 text-center text-slate-500">
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              registrosPaginados.map(registro => (
                <tr key={registro.id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link 
                      to={createPageUrl('VerRegistro') + `?id=${registro.id}`}
                      className="block hover:text-blue-600 transition-colors"
                    >
                      <p className="font-medium text-sm text-slate-900 hover:text-blue-600">{registro.titulo}</p>
                      {registro.participantes?.length > 0 && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3" />
                          {registro.participantes.slice(0, 2).join(', ')}
                          {registro.participantes.length > 2 && ` +${registro.participantes.length - 2}`}
                        </p>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-slate-700">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {registro.localizacao?.municipio || registro.comunidade?.split(',')[0] || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-700">
                      {registro.comunidade?.includes(',') ? registro.comunidade.split(',')[1]?.trim() : registro.local || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(registro.created_date || registro.data_registro).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs capitalize">
                      {registro.tipo?.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      className={cn("text-xs capitalize", termometroColors[registro.temperatura_territorio] || 'bg-slate-100 text-slate-700')}
                    >
                      <ThermometerSun className="w-3 h-3 mr-1" />
                      {registro.temperatura_territorio || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(registro.temas_identificados || []).slice(0, 2).map((tema, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tema}
                        </Badge>
                      ))}
                      {registro.temas_identificados?.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{registro.temas_identificados.length - 2}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      className={cn("text-xs capitalize", 
                        registro.status === 'finalizado' ? 'bg-emerald-100 text-emerald-700' :
                        registro.status === 'rascunho' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      )}
                    >
                      {registro.status || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('VerRegistro') + `?id=${registro.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('RegistroUnificado') + `?editar=${registro.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => onExcluir(registro.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-sm text-slate-600">
            Mostrando {inicio + 1} a {Math.min(inicio + ITEMS_POR_PAGINA, registrosOrdenados.length)} de {registrosOrdenados.length} registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      </Card>
    </>
  );
}