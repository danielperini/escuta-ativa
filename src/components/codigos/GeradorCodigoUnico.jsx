import { base44 } from '@/api/base44Client';

/**
 * Sistema de geração de códigos únicos automáticos
 * Formato: TIPO-UT-XXXXXX-AAAA
 * 
 * @param {string} tipo - 'RE' (Registro), 'CA' (Caso), 'DOC' (Documento)
 * @param {string} municipio - Nome do município/comunidade para identificar unidade
 * @returns {Promise<string>} Código gerado (ex: RE-AIM-000123-2026)
 */
export async function gerarCodigoUnico(tipo, municipio) {
  try {
    // 1. Identificar código da unidade/território
    const codigoUnidade = await obterCodigoUnidade(municipio);
    
    // 2. Obter ano atual
    const ano = new Date().getFullYear();
    
    // 3. Criar chave composta
    const chaveComposta = `${tipo}-${codigoUnidade}-${ano}`;
    
    // 4. Buscar ou criar contador
    const contadores = await base44.entities.ContadorCodigo.filter({ 
      chave_composta: chaveComposta 
    });
    
    let contador;
    let proximoNumero;
    
    if (contadores.length > 0) {
      // Contador já existe - incrementar
      contador = contadores[0];
      proximoNumero = contador.ultimo_numero + 1;
      
      await base44.entities.ContadorCodigo.update(contador.id, {
        ultimo_numero: proximoNumero
      });
    } else {
      // Criar novo contador
      proximoNumero = 1;
      
      await base44.entities.ContadorCodigo.create({
        tipo,
        unidade_territorio: codigoUnidade,
        ano,
        ultimo_numero: proximoNumero,
        chave_composta: chaveComposta
      });
    }
    
    // 5. Formatar código final
    const numeroFormatado = proximoNumero.toString().padStart(6, '0');
    const codigoFinal = `${tipo}-${codigoUnidade}-${numeroFormatado}-${ano}`;
    
    return codigoFinal;
    
  } catch (error) {
    console.error('Erro ao gerar código único:', error);
    // Fallback: gerar código sem território
    const ano = new Date().getFullYear();
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `${tipo}-GER-${random}-${ano}`;
  }
}

/**
 * Obter código da unidade/território baseado no município
 */
async function obterCodigoUnidade(municipio) {
  if (!municipio) return 'GER';
  
  try {
    // Buscar unidade cadastrada
    const unidades = await base44.entities.UnidadeTerritorio.filter({ 
      municipio: municipio 
    });
    
    if (unidades.length > 0) {
      return unidades[0].codigo.toUpperCase();
    }
    
    // Gerar código automático baseado no nome do município
    const codigo = municipio
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z\s]/g, '') // Remove caracteres especiais
      .split(' ')
      .map(palavra => palavra[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);
    
    return codigo || 'GER';
    
  } catch (error) {
    console.error('Erro ao obter código de unidade:', error);
    return 'GER';
  }
}

/**
 * Extrair informações de um código
 */
export function decodificarCodigo(codigo) {
  if (!codigo) return null;
  
  const partes = codigo.split('-');
  if (partes.length !== 4) return null;
  
  return {
    tipo: partes[0], // RE, CA, DOC
    unidade: partes[1],
    numero: partes[2],
    ano: partes[3],
    codigoCompleto: codigo
  };
}

/**
 * Buscar registros por código (completo ou parcial)
 */
export async function buscarPorCodigo(termoBusca) {
  const resultados = [];
  
  try {
    // Normalizar termo de busca
    const termo = termoBusca.toUpperCase().trim();
    
    // Buscar em Registros
    const registros = await base44.entities.Registro.list();
    const registrosFiltrados = registros.filter(r => 
      r.codigo_unico?.includes(termo)
    );
    resultados.push(...registrosFiltrados.map(r => ({
      ...r,
      tipo_busca: 'Registro',
      icon: 'FileText'
    })));
    
    // Buscar em Casos
    const casos = await base44.entities.Caso.list();
    const casosFiltrados = casos.filter(c => 
      c.codigo_unico?.includes(termo)
    );
    resultados.push(...casosFiltrados.map(c => ({
      ...c,
      tipo_busca: 'Caso',
      icon: 'CheckSquare'
    })));
    
    // Buscar em Documentos (se houver entidade específica)
    // const documentos = await base44.entities.DocumentoProcessado.list();
    // ...
    
    return resultados;
    
  } catch (error) {
    console.error('Erro ao buscar por código:', error);
    return [];
  }
}