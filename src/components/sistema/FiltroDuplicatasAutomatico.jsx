// Hook para filtrar duplicatas automaticamente em queries
export function removerDuplicatas(items, tipo) {
  if (!items || items.length === 0) return items;

  const seen = new Map();
  
  return items.filter(item => {
    let key;
    
    switch(tipo) {
      case 'registro':
        key = `${item.titulo?.toLowerCase().trim()}-${item.comunidade?.toLowerCase().trim()}-${item.data_registro}`;
        break;
      case 'caso':
        key = `${item.titulo?.toLowerCase().trim()}-${item.comunidade?.toLowerCase().trim()}`;
        break;
      case 'risco':
        key = `${item.titulo?.toLowerCase().trim()}-${item.comunidade?.toLowerCase().trim()}-${item.nivel}`;
        break;
      case 'stakeholder':
        key = `${item.nome?.toLowerCase().trim()}-${item.comunidade?.toLowerCase().trim()}-${item.municipio?.toLowerCase().trim()}`;
        break;
      default:
        return true;
    }

    // Ignorar chaves inválidas
    if (!key || key === 'undefined-undefined' || key === '--' || key === 'undefined-undefined-undefined') {
      return true;
    }

    if (seen.has(key)) {
      return false; // É duplicata, remover
    }
    
    seen.set(key, true);
    return true; // Manter este item
  });
}