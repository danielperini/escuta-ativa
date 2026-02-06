/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Agenda from './pages/Agenda';
import Analise from './pages/Analise';
import Atividades from './pages/Atividades';
import Atores from './pages/Atores';
import AuditoriaRegistro from './pages/AuditoriaRegistro';
import CadernoNotas from './pages/CadernoNotas';
import CardsEducativos from './pages/CardsEducativos';
import Casos from './pages/Casos';
import CentralAnalise from './pages/CentralAnalise';
import CodigoEtica from './pages/CodigoEtica';
import Compromissos from './pages/Compromissos';
import Comunicacao from './pages/Comunicacao';
import ComunidadesGrupos from './pages/ComunidadesGrupos';
import Configuracoes from './pages/Configuracoes';
import ConfiguracoesESG from './pages/ConfiguracoesESG';
import ConfiguracoesSistema from './pages/ConfiguracoesSistema';
import Dashboard from './pages/Dashboard';
import DashboardAnalitico from './pages/DashboardAnalitico';
import DetalheTema from './pages/DetalheTema';
import DetalhesComunidade from './pages/DetalhesComunidade';
import DicasRelacionamento from './pages/DicasRelacionamento';
import Documentacao from './pages/Documentacao';
import Documentos from './pages/Documentos';
import Etapa1 from './pages/Etapa1';
import Etapa2 from './pages/Etapa2';
import GeradorRelatorioSustentabilidade from './pages/GeradorRelatorioSustentabilidade';
import GerenciarEquipes from './pages/GerenciarEquipes';
import GerenciarEquipesSimples from './pages/GerenciarEquipesSimples';
import GerenciarLiderancas from './pages/GerenciarLiderancas';
import GerenciarOrganizacoes from './pages/GerenciarOrganizacoes';
import GerenciarPermissoes from './pages/GerenciarPermissoes';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import Home from './pages/Home';
import Integracoes from './pages/Integracoes';
import Landing from './pages/Landing';
import Liderancas from './pages/Liderancas';
import LimpezaDados from './pages/LimpezaDados';
import Mapa from './pages/Mapa';
import MapaAtores from './pages/MapaAtores';
import MapaStakeholders from './pages/MapaStakeholders';
import Materialidade from './pages/Materialidade';
import MaterialidadeViva from './pages/MaterialidadeViva';
import NovaAtividade from './pages/NovaAtividade';
import ODS from './pages/ODS';
import PerfilStakeholder from './pages/PerfilStakeholder';
import PreferenciasUsuario from './pages/PreferenciasUsuario';
import RegistroUnificado from './pages/RegistroUnificado';
import Registros from './pages/Registros';
import Relatorios from './pages/Relatorios';
import RelatoriosGerados from './pages/RelatoriosGerados';
import ReunioesRealizadas from './pages/ReunioesRealizadas';
import Stakeholders from './pages/Stakeholders';
import VerCaso from './pages/VerCaso';
import VerRegistro from './pages/VerRegistro';
import VisaoGeral from './pages/VisaoGeral';
import VozComunidade from './pages/VozComunidade';
import Welcome from './pages/Welcome';
import GestorDemandas from './pages/GestorDemandas';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Agenda": Agenda,
    "Analise": Analise,
    "Atividades": Atividades,
    "Atores": Atores,
    "AuditoriaRegistro": AuditoriaRegistro,
    "CadernoNotas": CadernoNotas,
    "CardsEducativos": CardsEducativos,
    "Casos": Casos,
    "CentralAnalise": CentralAnalise,
    "CodigoEtica": CodigoEtica,
    "Compromissos": Compromissos,
    "Comunicacao": Comunicacao,
    "ComunidadesGrupos": ComunidadesGrupos,
    "Configuracoes": Configuracoes,
    "ConfiguracoesESG": ConfiguracoesESG,
    "ConfiguracoesSistema": ConfiguracoesSistema,
    "Dashboard": Dashboard,
    "DashboardAnalitico": DashboardAnalitico,
    "DetalheTema": DetalheTema,
    "DetalhesComunidade": DetalhesComunidade,
    "DicasRelacionamento": DicasRelacionamento,
    "Documentacao": Documentacao,
    "Documentos": Documentos,
    "Etapa1": Etapa1,
    "Etapa2": Etapa2,
    "GeradorRelatorioSustentabilidade": GeradorRelatorioSustentabilidade,
    "GerenciarEquipes": GerenciarEquipes,
    "GerenciarEquipesSimples": GerenciarEquipesSimples,
    "GerenciarLiderancas": GerenciarLiderancas,
    "GerenciarOrganizacoes": GerenciarOrganizacoes,
    "GerenciarPermissoes": GerenciarPermissoes,
    "GerenciarUsuarios": GerenciarUsuarios,
    "Home": Home,
    "Integracoes": Integracoes,
    "Landing": Landing,
    "Liderancas": Liderancas,
    "LimpezaDados": LimpezaDados,
    "Mapa": Mapa,
    "MapaAtores": MapaAtores,
    "MapaStakeholders": MapaStakeholders,
    "Materialidade": Materialidade,
    "MaterialidadeViva": MaterialidadeViva,
    "NovaAtividade": NovaAtividade,
    "ODS": ODS,
    "PerfilStakeholder": PerfilStakeholder,
    "PreferenciasUsuario": PreferenciasUsuario,
    "RegistroUnificado": RegistroUnificado,
    "Registros": Registros,
    "Relatorios": Relatorios,
    "RelatoriosGerados": RelatoriosGerados,
    "ReunioesRealizadas": ReunioesRealizadas,
    "Stakeholders": Stakeholders,
    "VerCaso": VerCaso,
    "VerRegistro": VerRegistro,
    "VisaoGeral": VisaoGeral,
    "VozComunidade": VozComunidade,
    "Welcome": Welcome,
    "GestorDemandas": GestorDemandas,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};