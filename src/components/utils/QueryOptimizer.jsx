import { QueryClient } from '@tanstack/react-query';

// Configuração otimizada do QueryClient para societa.ai v2.1
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    }
  }
});

// Prefetch estratégico para dados críticos
export const prefetchCriticalData = async (base44) => {
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['stakeholders'],
      queryFn: () => base44.entities.Stakeholder.list('-updated_date', 100),
      staleTime: 10 * 60 * 1000
    }),
    queryClient.prefetchQuery({
      queryKey: ['registros-recentes'],
      queryFn: () => base44.entities.Registro.list('-created_date', 50),
      staleTime: 5 * 60 * 1000
    }),
    queryClient.prefetchQuery({
      queryKey: ['comunidades'],
      queryFn: () => base44.entities.Comunidade.list(),
      staleTime: 15 * 60 * 1000
    })
  ]);
};

export default queryClient;