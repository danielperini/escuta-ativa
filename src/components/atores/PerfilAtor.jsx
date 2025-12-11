import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  MapPin, 
  Building, 
  Phone, 
  Mail, 
  MessageCircle, 
  Target,
  TrendingUp,
  Calendar,
  Edit,
  FileText
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import moment from 'moment';

export default function PerfilAtor({ atorId, onEditar }) {
  const { data: ator, isLoading } = useQuery({
    queryKey: ['ator-perfil', atorId],
    queryFn: async () => {
      const atores = await base44.entities.Ator.list();
      return atores.find(a => a.id === atorId);
    },
    enabled: !!atorId
  });

  const { data: registrosRelacionados = [] } = useQuery({
    queryKey: ['registros-ator', atorId],
    queryFn: async () => {
      const registros = await base44.entities.Registro.list('-created_date', 100);
      return registros.filter(r => 
        r.participantes?.includes(ator?.nome) ||
        r.liderancas_vinculadas?.includes(atorId)
      );
    },
    enabled: !!ator
  });

  if (isLoading) {
    return <Card><CardContent className="pt-6">Carregando...</CardContent></Card>;
  }

  if (!ator) {
    return <Card><CardContent className="pt-6">Ator não encontrado</CardContent></Card>;
  }

  const corInfluencia = (nivel) => {
    switch(nivel) {
      case 'alto': return 'bg-red-100 text-red-800';
      case 'medio': return 'bg-amber-100 text-amber-800';
      case 'baixo': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const corAtividade = (nivel) => {
    switch(nivel) {
      case 'alto': return 'bg-green-100 text-green-800';
      case 'moderado': return 'bg-blue-100 text-blue-800';
      case 'baixo': return 'bg-amber-100 text-amber-800';
      case 'inativo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-full bg-[#40916C] flex items-center justify-center text-white text-3xl font-bold">
                {ator.nome?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{ator.nome}</h2>
                {ator.cargo && <p className="text-slate-600">{ator.cargo}</p>}
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{ator.tipo}</Badge>
                  <Badge className={corInfluencia(ator.nivel_influencia)}>
                    Influência: {ator.nivel_influencia}
                  </Badge>
                  <Badge className={corAtividade(ator.nivel_atividade)}>
                    Atividade: {ator.nivel_atividade}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => onEditar(ator)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Informações de Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ator.contato?.telefone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-slate-500" />
                <span>{ator.contato.telefone}</span>
              </div>
            )}
            {ator.contato?.whatsapp && (
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span>{ator.contato.whatsapp}</span>
              </div>
            )}
            {ator.contato?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>{ator.contato.email}</span>
              </div>
            )}
            {!ator.contato?.telefone && !ator.contato?.whatsapp && !ator.contato?.email && (
              <p className="text-sm text-slate-500">Sem informações de contato</p>
            )}
          </CardContent>
        </Card>

        {/* Afiliações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="w-5 h-5" />
              Afiliações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ator.comunidade && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Comunidade:</span>
                <span>{ator.comunidade}</span>
              </div>
            )}
            {ator.organizacao && (
              <div className="flex items-center gap-2 text-sm">
                <Building className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Organização:</span>
                <span>{ator.organizacao}</span>
              </div>
            )}
            {!ator.comunidade && !ator.organizacao && (
              <p className="text-sm text-slate-500">Sem afiliações registradas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Temas de Interesse */}
      {ator.temas_interesse && ator.temas_interesse.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Temas de Interesse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ator.temas_interesse.map((tema, i) => (
                <Badge key={i} variant="secondary">{tema}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Interações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Histórico de Interações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{registrosRelacionados.length}</p>
              <p className="text-xs text-slate-600">Total de Interações</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">
                {ator.ultima_interacao ? moment(ator.ultima_interacao).fromNow() : 'N/A'}
              </p>
              <p className="text-xs text-slate-600">Última Interação</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">
                {moment(ator.created_date).format('DD/MM/YYYY')}
              </p>
              <p className="text-xs text-slate-600">Cadastrado em</p>
            </div>
          </div>

          {registrosRelacionados.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold mb-3">Últimos Registros:</p>
              {registrosRelacionados.slice(0, 5).map(reg => (
                <div key={reg.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{reg.titulo}</p>
                      <p className="text-xs text-slate-600">{reg.comunidade}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {moment(reg.created_date).format('DD/MM/YYYY')}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">{reg.tipo}</Badge>
                    </div>
                  </div>
                </div>
              ))}
              {registrosRelacionados.length > 5 && (
                <p className="text-xs text-center text-slate-500 pt-2">
                  +{registrosRelacionados.length - 5} registros anteriores
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              Nenhuma interação registrada ainda
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notas */}
      {ator.notas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{ator.notas}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}