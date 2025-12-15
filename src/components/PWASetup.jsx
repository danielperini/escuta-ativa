import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Componente PWA Setup
 * Configura Progressive Web App capabilities:
 * - Instalação como app no celular
 * - Cache de assets para acesso offline
 * - Prompt de instalação
 */
export default function PWASetup() {
  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      const swCode = `
        const CACHE_NAME = 'societa-v1';
        const urlsToCache = [
          '/',
          '/index.html'
        ];

        self.addEventListener('install', (event) => {
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then((cache) => cache.addAll(urlsToCache))
          );
        });

        self.addEventListener('fetch', (event) => {
          event.respondWith(
            caches.match(event.request)
              .then((response) => response || fetch(event.request))
              .catch(() => caches.match('/'))
          );
        });

        self.addEventListener('activate', (event) => {
          event.waitUntil(
            caches.keys().then((cacheNames) => {
              return Promise.all(
                cacheNames.map((cacheName) => {
                  if (cacheName !== CACHE_NAME) {
                    return caches.delete(cacheName);
                  }
                })
              );
            })
          );
        });
      `;

      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);

      navigator.serviceWorker.register(swUrl)
        .then(() => {
          console.log('PWA: Service Worker registrado');
        })
        .catch((error) => {
          console.error('PWA: Erro ao registrar Service Worker', error);
        });
    }

    // Manifest dinâmico
    const manifestData = {
      name: 'Societa.ai',
      short_name: 'Societa',
      description: 'Sistema de Gestão de Relacionamento Comunitário',
      start_url: '/',
      display: 'standalone',
      background_color: '#E31E24',
      theme_color: '#E31E24',
      orientation: 'portrait-primary',
      icons: [
        {
          src: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693acc814baf8083c262896b/8a81a6207_transparent-Photoroom12.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);
    
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestUrl;
    document.head.appendChild(link);

    // Meta tags PWA
    const metaTags = [
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'Societa' },
      { name: 'theme-color', content: '#E31E24' }
    ];

    metaTags.forEach(({ name, content }) => {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    });

    // Apple touch icon
    const appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.href = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693acc814baf8083c262896b/8a81a6207_transparent-Photoroom12.png';
    document.head.appendChild(appleIcon);

    // Prompt de instalação
    let deferredPrompt;
    
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Mostrar toast após 3 segundos
      setTimeout(() => {
        toast.info('Instale o Societa.ai como app!', {
          description: 'Acesse mais rápido instalando no seu celular',
          action: {
            label: 'Instalar',
            onClick: () => {
              if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                  if (choiceResult.outcome === 'accepted') {
                    toast.success('App instalado com sucesso!');
                  }
                  deferredPrompt = null;
                });
              }
            }
          },
          duration: 10000
        });
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar quando o app foi instalado
    window.addEventListener('appinstalled', () => {
      toast.success('App instalado! Acesse pelo ícone na tela inicial.');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}