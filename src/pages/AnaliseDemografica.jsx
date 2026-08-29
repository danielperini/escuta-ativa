import React, { useState } from 'react';
import FiltroLocalidade from '@/components/demografia/FiltroLocalidade';
import IndicadorCard from '@/components/demografia/IndicadorCard';
import PiramideEtaria from '@/components/demografia/PiramideEtaria';
import DistribuicaoCorRaca from '@/components/demografia/DistribuicaoCorRaca';
import EvolucaoHistorica from '@/components/demografia/EvolucaoHistorica';
import { Users, Gauge, MapPin, Layers } from 'lucide-react';
import {
  obterPopulacao, obterAreaDensidade, obterPiramide, obterCorRaca,
  listarEstados
} from '@/lib/demografiaApi';

const formatarNumero = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const formatarHab = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export default function AnaliseDemografica() {
  const [uf, setUf] = useState('MG');          // Default: Minas Gerais
  const [ufId, setUfId] = useState('31');      // IBGE code (31 = MG)
  const [ufNome, setUfNome] = useState('Minas Gerais');
  const [municipioId, setMunicipioId] = useState('');
  const [municipioNome, setMunicipioNome] = useState('');

  const [populacao, setPopulacao] = useState(null);
  const [areaInfo, setAreaInfo] = useState(null);
  const [piramide, setPiramide] = useState([]);
  const [corRaca, setCorRaca] = useState([]);

  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState({});

  const localLabel = municipioNome ? `${municipioNome}/${uf}` : ufNome;

  const carregarDados = async (ufSigla, munId, ufIdOverride) => {
    setCarregando(true);
    setErros({});
    const u = ufIdOverride || ufId;
    const m = munId || '';
    const localErrors = {};

    // População total
    try {
      const pop = await obterPopulacao(u, m);
      setPopulacao(pop);
    } catch (e) {
      localErrors.populacao = 'Falha ao buscar população: ' + (e.message || 'erro desconhecido');
      setPopulacao(null);
    }
    // Área + densidade
    try {
      const ad = await obterAreaDensidade(u, m);
      setAreaInfo(ad);
    } catch (e) {
      localErrors.area = 'Área/densidade indisponível. Serviço IBGE pode estar instável.';
      setAreaInfo(null);
    }
    // Pirâmide
    try {
      const p = await obterPiramide(u, m);
      setPiramide(p);
    } catch (e) {
      localErrors.piramide = 'Falha ao buscar pirâmide etária. Tente novamente.';
      setPiramide([]);
    }
    // Cor/raça
    try {
      const cr = await obterCorRaca(u, m);
      setCorRaca(cr);
    } catch (e) {
      localErrors.corRaca = 'Falha ao buscar distribuição por cor/raça.';
      setCorRaca([]);
    }
    setErros(localErrors);
    setCarregando(false);
  };

  // Carregamento inicial
  React.useEffect(() => { carregarDados('MG', '', '31'); }, []);

  const mudarUF = async (sigla) => {
    setUf(sigla);
    setMunicipioId('');
    setMunicipioNome('');
    try {
      const ests = await listarEstados();
      const e = ests.find(x => x.sigla === sigla);
      if (e) {
        setUfId(String(e.id));
        setUfNome(e.nome);
        carregarDados(sigla, '', String(e.id));
      }
    } catch (_) {}
  };

  const mudarMunicipio = (mId) => {
    setMunicipioId(mId);
    carregarDados(uf, mId);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Demografia</p>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-1 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Análise Demográfica
        </h1>
        <p className="text-muted-foreground mt-1.5 max-w-3xl flex items-center gap-2 flex-wrap">
          <MapPin className="w-4 h-4" />
          Dados reais do IBGE (Censo 2022 e 2010) e séries históricas do Ipeadata —
          população, pirâmide etária, cor/raça e densidade. <span className="text-foreground font-medium">{localLabel}</span>
        </p>
      </div>

      {/* Filtros */}
      <FiltroLocalidade
        uf={uf}
        municipioId={municipioId}
        onEstadoChange={mudarUF}
        onMunicipioChange={mudarMunicipio}
        carregandoMun={carregando}
      />

      {/* Cards de destaque */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <IndicadorCard
          titulo="População Total"
          valor={populacao !== null && populacao !== undefined ? formatarNumero(populacao) : '—'}
          unidade="habitantes"
          descricao={`Censo 2022 • ${localLabel}`}
          icone={Users}
          corAccent="bg-blue-100 text-blue-700"
          carregando={carregando}
        />
        <IndicadorCard
          titulo="Densidade Demográfica"
          valor={areaInfo?.densidade !== null && areaInfo?.densidade !== undefined ? formatarHab(areaInfo.densidade) : '—'}
          unidade="hab/km²"
          descricao={areaInfo?.area ? `Área: ${formatarNumero(areaInfo.area)} km²` : 'Censo 2010'}
          icone={Gauge}
          corAccent="bg-emerald-100 text-emerald-700"
          carregando={carregando}
        />
        <IndicadorCard
          titulo="Recorte Territorial"
          valor={municipioId ? 'Município' : 'Estado'}
          descricao={municipioId ? 'Análise municipal selecionada' : 'Toda a Unidade da Federação'}
          icone={Layers}
          corAccent="bg-purple-100 text-purple-700"
          carregando={false}
        />
      </div>

      {/* Mensagem combinada de erros gerais (se houver) */}
      {Object.keys(erros).length > 0 && (
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
          <p className="font-medium mb-1">Alguns dados não puderam ser carregados agora:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {Object.entries(erros).map(([k, v]) => <li key={k}>{v}</li>)}
          </ul>
          <p className="mt-1 text-xs">As APIs governamentais (IBGE / Ipeadata) podem falhar esporadicamente.</p>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PiramideEtaria dados={piramide} carregando={carregando} erro={erros.piramide} />
        <DistribuicaoCorRaca dados={corRaca} carregando={carregando} erro={erros.corRaca} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1">
        <EvolucaoHistorica />
      </div>

      {/* Nota de fonte */}
      <div className="text-xs text-muted-foreground border-t border-border pt-4 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5" />
        <span>
          Fontes: IBGE — SIDRA/Agregados (Censo 2022 e 2010) e Ipeadata API de consulta.
          Dados abertos governamentais. Atualização conforme disponibilidade das APIs.
        </span>
      </div>
    </div>
  );
}