import React from 'react';

/**
 * Gera QR Code com link direto para o registro/caso
 * Usa a API do Google Charts para gerar QR Code
 */
export function gerarQRCodeUrl(codigo, baseUrl = window.location.origin) {
  if (!codigo) return '';
  
  // Construir URL direta baseada no tipo de código
  let targetUrl = baseUrl;
  
  if (codigo.startsWith('RE-')) {
    targetUrl += `/app/buscar?codigo=${encodeURIComponent(codigo)}`;
  } else if (codigo.startsWith('CA-')) {
    targetUrl += `/app/buscar?codigo=${encodeURIComponent(codigo)}`;
  } else if (codigo.startsWith('DOC-')) {
    targetUrl += `/app/buscar?codigo=${encodeURIComponent(codigo)}`;
  }
  
  // API do Google Charts para QR Code
  const qrSize = 200;
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=${qrSize}x${qrSize}&chl=${encodeURIComponent(targetUrl)}`;
  
  return qrUrl;
}

/**
 * Componente para exibir QR Code
 */
export function QRCode({ codigo, size = 120, className = '' }) {
  if (!codigo) return null;
  
  const qrUrl = gerarQRCodeUrl(codigo);
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img 
        src={qrUrl} 
        alt={`QR Code ${codigo}`}
        width={size}
        height={size}
        className="border rounded"
      />
      <p className="text-xs text-slate-500 mt-2 font-mono">{codigo}</p>
    </div>
  );
}

/**
 * Gera QR Code como data URL para inclusão em PDF
 */
export async function gerarQRCodeDataURL(codigo) {
  const qrUrl = gerarQRCodeUrl(codigo);
  
  try {
    const response = await fetch(qrUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    return null;
  }
}