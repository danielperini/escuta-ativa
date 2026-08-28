/**
 * Configurações otimizadas de queries para performance
 */

import { base44 } from '@/api/base44Client';

export const QUERY_LIMITS = {
  dashboard: 20,
  list_default: 50,
  list_large: 100,
  search: 30,
  recent: 10
};

export const QUERY_CONFIGS = {
  // Queries com cache longo (dados que mudam pouco)
  comunidades: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000
  },
  temas: {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  },
  
  // Queries com cache curto (dados dinâmicos)
  registros: {
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 2 * 60 * 1000
  },
  agendas: {
    staleTime: 60 * 1000, // 1 minuto
    cacheTime: 3 * 60 * 1000
  },
  
  // Queries de dashboard (refresh moderado)
  dashboard: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000 // Auto-refresh a cada 5 minutos
  }
};

/**
 * Hook otimizado para listas com paginação
 */
export function useOptimizedList(entityName, limit = QUERY_LIMITS.list_default, sortBy = '-created_date') {
  const queryKey = [entityName, limit, sortBy];
  
  return {
    queryKey,
    queryFn: () => base44.entities[entityName].list(sortBy, limit),
    ...QUERY_CONFIGS[entityName.toLowerCase()] || {}
  };
}