import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// ===================================================================
// Função backend: consulta a séries históricas do Ipeadata.
// O site http://ipeadata.gov.br só expõe HTTP e não envia cabeçalho CORS,
// o que impede fetch direto do navegador. Por isso chamamos do servidor.
// ===================================================================

const IPEA_BASE = "http://www.ipeadata.gov.br/api/odata4";

async function fetchComTimeout(url: string, ms = 12000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
  } finally {
    clearTimeout(t);
  }
}

async function buscarValores(codigo: string) {
  const url = `${IPEA_BASE}/ValoresSerie(SERCODIGO='${encodeURIComponent(codigo)}')?$format=json`;
  const res = await fetchComTimeout(url, 10000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: any = await res.json();
  const raw: any[] = data?.value || [];
  const valores = raw
    .filter((v) => v?.VALVALOR !== null && v?.VALVALOR !== undefined)
    .map((v) => {
      const ano = v?.VALDATA ? new Date(v.VALDATA).getFullYear() : Number(v?.YEAR || 0);
      return { ano, valor: Number(v.VALVALOR) };
    })
    .filter((v) => Number.isFinite(v.ano) && Number.isFinite(v.valor))
    .sort((a, b) => a.ano - b.ano);
  return valores;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // Modo 1: série direta por código (sem busca no catálogo — mais rápido).
    if (body?.codigo) {
      const valores = await buscarValores(String(body.codigo));
      if (!valores.length) return Response.json({ error: "Série sem valores." }, { status: 404 });
      return Response.json({ codigo: body.codigo, valores });
    }

    // Modo 2: busca por termo no nome, usando filter simples (sem tolower).
    const query: string = String(body?.q || "Mortalidade").trim();
    const limit: number = Math.min(Number(body?.limit) || 6, 12);
    const catUrl =
      `${IPEA_BASE}/Metadados?$filter=contains(SERNOME,'${encodeURIComponent(query)}')` +
      `&$top=${limit}&$format=json`;

    const catRes = await fetchComTimeout(catUrl, 12000);
    if (!catRes.ok) {
      return Response.json(
        { error: `Ipeadata indisponível (HTTP ${catRes.status}). A API governamental pode estar temporariamente fora do ar.` },
        { status: 502 }
      );
    }
    const catData: any = await catRes.json();
    const metas: any[] = catData?.value || [];
    if (!Array.isArray(metas) || metas.length === 0) {
      return Response.json({ error: `Nenhuma série encontrada para "${query}".` }, { status: 404 });
    }

    // Primeira série com dados válidos vence.
    for (let i = 0; i < Math.min(metas.length, 3); i++) {
      try {
        const s = metas[i];
        const valores = await buscarValores(s.SERCODIGO);
        if (valores.length) {
          return Response.json({
            serie: {
              codigo: s.SERCODIGO,
              nome: s.SERNOME,
              unidade: s.SERUNIDADE,
              comentario: s.SERCOMENTARIO || "",
              fonte: s.FNTNOME || "Ipeadata",
            },
            valores,
            alternativas: metas.slice(0, 8).map((m) => ({ codigo: m.SERCODIGO, nome: m.SERNOME })),
          });
        }
      } catch (_) { /* tenta a próxima */ }
    }
    return Response.json({ error: "Séries encontradas, mas sem valores disponíveis." }, { status: 404 });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      return Response.json({ error: "Tempo limite excedido ao consultar o Ipeadata." }, { status: 504 });
    }
    return Response.json({ error: error?.message || "Erro inesperado" }, { status: 500 });
  }
}