import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Download, Calendar, Eye, Search, Leaf, Trash2, Globe, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RelatoriosGerados() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: relatorios = [] } = useQuery({
    queryKey: ['relatorios-sustentabilidade'],
    queryFn: () => base44.entities.RelatorioSustentabilidade.list('-created_date', 100)
  });

  const relatoriosFiltrados = relatorios.filter(r =>
    r.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    r.comunidade?.toLowerCase().includes(search.toLowerCase())
  );

  const getIconeEscopo = (tipo) => {
    const icones = {
      plataforma_completa: Globe,
      comunidade: Users,
      territorio: Users,
      multiplos_registros: FileText
    };
    return icones[tipo] || FileText;
  };

  const getCorStatus = (status) => {
    const cores = {
      gerando: 'bg-amber-100 text-amber-700',
      concluido: 'bg-emerald-100 text-emerald-700',
      erro: 'bg-red-100 text-red-700'
    };
    return cores[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Relatórios de Sustentabilidade Gerados</h1>
          <p className="text-slate-500 mt-1">{relatorios.length} relatórios disponíveis</p>
        </div>
        <Button 
          onClick={() => navigate(createPageUrl('GeradorRelatorioSustentabilidade'))}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Leaf className="w-4 h-4 mr-2" />
          Gerar Novo Relatório
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar relatórios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {relatoriosFiltrados.map(relatorio => {
          const IconeEscopo = getIconeEscopo(relatorio.tipo_escopo);
          
          return (
            <Card key={relatorio.id} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                      <IconeEscopo className="w-7 h-7" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900 mb-2">{relatorio.titulo}</h3>
                      
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge className={getCorStatus(relatorio.status)}>
                          {relatorio.status}
                        </Badge>
                        <Badge variant="outline">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(relatorio.data_inicio), 'dd/MM/yyyy')} - {format(new Date(relatorio.data_fim), 'dd/MM/yyyy')}
                        </Badge>
                        <Badge variant="outline">
                          {relatorio.total_registros} registros
                        </Badge>
                        {relatorio.comunidade && (
                          <Badge className="bg-blue-100 text-blue-700">
                            {relatorio.comunidade}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">GRI Standards</p>
                          <p className="font-semibold text-slate-900">{relatorio.vinculacao_gri?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">ODS Vinculadas</p>
                          <p className="font-semibold text-slate-900">{relatorio.vinculacao_ods?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">ESRS</p>
                          <p className="font-semibold text-slate-900">{relatorio.vinculacao_esrs?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Versão</p>
                          <p className="font-semibold text-slate-900">{relatorio.versao || '1.0'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={!relatorio.arquivo_pdf_url}
                      onClick={() => relatorio.arquivo_pdf_url && window.open(relatorio.arquivo_pdf_url, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={!relatorio.arquivo_docx_url}
                      onClick={() => relatorio.arquivo_docx_url && window.open(relatorio.arquivo_docx_url, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      DOCX
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-slate-500">
                    Gerado por {relatorio.created_by} em {format(new Date(relatorio.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {relatoriosFiltrados.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum relatório encontrado</h3>
              <p className="text-slate-500 mb-6">Comece gerando seu primeiro relatório de sustentabilidade</p>
              <Button 
                onClick={() => navigate(createPageUrl('GeradorRelatorioSustentabilidade'))}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Leaf className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}