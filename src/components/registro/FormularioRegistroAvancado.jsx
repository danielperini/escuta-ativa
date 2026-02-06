import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SeletorTemplates from './SeletorTemplates';
import VinculadorRegistros from './VinculadorRegistros';

const registroSchema = z.object({
  titulo: z.string().min(5, 'Título deve ter no mínimo 5 caracteres').max(200, 'Título muito longo'),
  tipo: z.enum(['reuniao', 'conversa_campo', 'visita', 'demanda', 'ocorrencia'], {
    required_error: 'Tipo é obrigatório'
  }),
  data_registro: z.string().min(1, 'Data é obrigatória'),
  comunidade: z.string().min(2, 'Comunidade é obrigatória'),
  local: z.string().optional(),
  descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  participantes: z.array(z.string()).optional(),
  temas_identificados: z.array(z.string()).optional()
});

export default function FormularioRegistroAvancado({ registroInicial, onSalvar, onCancelar }) {
  const [comunidades, setComunidades] = useState([]);
  const [registrosVinculados, setRegistrosVinculados] = useState([]);
  const [templateSelecionado, setTemplateSelecionado] = useState(null);
  const [validacaoEmAndamento, setValidacaoEmAndamento] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, dirtyFields },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(registroSchema),
    mode: 'onChange',
    defaultValues: registroInicial || {
      titulo: '',
      tipo: 'conversa_campo',
      data_registro: new Date().toISOString().split('T')[0],
      comunidade: '',
      local: '',
      descricao: '',
      participantes: [],
      temas_identificados: []
    }
  });

  const watchTipo = watch('tipo');
  const watchComunidade = watch('comunidade');
  const watchTitulo = watch('titulo');

  useEffect(() => {
    loadComunidades();
  }, []);

  const loadComunidades = async () => {
    const data = await base44.entities.Comunidade.list();
    setComunidades(data);
  };

  const aplicarTemplate = (template) => {
    setTemplateSelecionado(template);
    const campos = template.campos_padrao || {};
    
    Object.keys(campos).forEach(campo => {
      if (campos[campo] !== undefined && campos[campo] !== null) {
        setValue(campo, campos[campo], { shouldValidate: true, shouldDirty: true });
      }
    });

    toast.success(`Template "${template.nome}" aplicado`);
  };

  const onSubmit = async (data) => {
    try {
      setValidacaoEmAndamento(true);

      const registroData = {
        ...data,
        registros_continuidade: registrosVinculados,
        template_utilizado: templateSelecionado?.id,
        status: 'finalizado'
      };

      // Atualizar contador do template
      if (templateSelecionado) {
        await base44.entities.TemplateRegistro.update(templateSelecionado.id, {
          uso_total: (templateSelecionado.uso_total || 0) + 1
        });
      }

      // Criar ou atualizar registro
      if (registroInicial?.id) {
        await base44.entities.Registro.update(registroInicial.id, registroData);
        toast.success('Registro atualizado com sucesso');
      } else {
        const novoRegistro = await base44.entities.Registro.create(registroData);
        
        // Atualizar registros vinculados
        for (const vinculadoId of registrosVinculados) {
          const vinculado = await base44.entities.Registro.get(vinculadoId);
          await base44.entities.Registro.update(vinculadoId, {
            registros_continuidade: [...(vinculado.registros_continuidade || []), novoRegistro.id]
          });
        }

        toast.success('Registro criado com sucesso');
      }

      if (onSalvar) {
        onSalvar(registroData);
      }
    } catch (error) {
      toast.error('Erro ao salvar registro: ' + error.message);
    } finally {
      setValidacaoEmAndamento(false);
    }
  };

  const getCampoStatus = (campo) => {
    if (errors[campo]) return 'error';
    if (dirtyFields[campo]) return 'success';
    return 'default';
  };

  const getCampoIcon = (campo) => {
    if (errors[campo]) return <AlertCircle className="w-4 h-4 text-red-600" />;
    if (dirtyFields[campo] && !errors[campo]) return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    return null;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Seletor de Templates */}
      <SeletorTemplates onSelecionar={aplicarTemplate} tipoAtual={watchTipo} />

      {/* Vinculador de Registros */}
      <VinculadorRegistros
        registrosVinculados={registrosVinculados}
        onVincular={setRegistrosVinculados}
        comunidadeAtual={watchComunidade}
      />

      {/* Tipo de Registro */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          Tipo de Registro *
          {getCampoIcon('tipo')}
        </label>
        <Select
          value={watch('tipo')}
          onValueChange={(value) => setValue('tipo', value, { shouldValidate: true, shouldDirty: true })}
        >
          <SelectTrigger className={errors.tipo ? 'border-red-500' : ''}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reuniao">Reunião</SelectItem>
            <SelectItem value="conversa_campo">Conversa de Campo</SelectItem>
            <SelectItem value="visita">Visita</SelectItem>
            <SelectItem value="demanda">Demanda</SelectItem>
            <SelectItem value="ocorrencia">Ocorrência</SelectItem>
          </SelectContent>
        </Select>
        {errors.tipo && (
          <p className="text-sm text-red-600">{errors.tipo.message}</p>
        )}
      </div>

      {/* Data */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          Data *
          {getCampoIcon('data_registro')}
        </label>
        <Input
          type="date"
          {...register('data_registro')}
          className={errors.data_registro ? 'border-red-500' : ''}
        />
        {errors.data_registro && (
          <p className="text-sm text-red-600">{errors.data_registro.message}</p>
        )}
      </div>

      {/* Comunidade */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          Comunidade *
          {getCampoIcon('comunidade')}
        </label>
        <Select
          value={watch('comunidade')}
          onValueChange={(value) => setValue('comunidade', value, { shouldValidate: true, shouldDirty: true })}
        >
          <SelectTrigger className={errors.comunidade ? 'border-red-500' : ''}>
            <SelectValue placeholder="Selecione uma comunidade" />
          </SelectTrigger>
          <SelectContent>
            {comunidades.map(c => (
              <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.comunidade && (
          <p className="text-sm text-red-600">{errors.comunidade.message}</p>
        )}
      </div>

      {/* Título */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          Título *
          {getCampoIcon('titulo')}
          {watchTitulo && (
            <Badge variant="outline" className="ml-auto">
              {watchTitulo.length}/200
            </Badge>
          )}
        </label>
        <Input
          {...register('titulo')}
          placeholder="Ex: Reunião Comunitária sobre Educação"
          className={errors.titulo ? 'border-red-500' : ''}
        />
        {errors.titulo && (
          <p className="text-sm text-red-600">{errors.titulo.message}</p>
        )}
      </div>

      {/* Local */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          Local
          {getCampoIcon('local')}
        </label>
        <Input
          {...register('local')}
          placeholder="Ex: Salão da Igreja, Praça Central"
        />
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          Descrição *
          {getCampoIcon('descricao')}
        </label>
        <Textarea
          {...register('descricao')}
          placeholder="Descreva o que aconteceu, as discussões principais, etc."
          rows={5}
          className={errors.descricao ? 'border-red-500' : ''}
        />
        {errors.descricao && (
          <p className="text-sm text-red-600">{errors.descricao.message}</p>
        )}
      </div>

      {/* Status de Validação */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border">
        {isValid ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Formulário válido - pronto para salvar</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-amber-700">
              {Object.keys(errors).length} campo(s) precisam ser corrigidos
            </span>
          </>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-3 justify-end">
        {onCancelar && (
          <Button type="button" variant="outline" onClick={onCancelar}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={!isValid || validacaoEmAndamento}
          className="bg-[#E31E24] hover:bg-[#B01419]"
        >
          {validacaoEmAndamento ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            registroInicial ? 'Atualizar Registro' : 'Criar Registro'
          )}
        </Button>
      </div>
    </form>
  );
}