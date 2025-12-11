import Dashboard from './pages/Dashboard';
import Registros from './pages/Registros';
import NovoRegistro from './pages/NovoRegistro';
import VerRegistro from './pages/VerRegistro';
import Mapa from './pages/Mapa';
import Materialidade from './pages/Materialidade';
import VozComunidade from './pages/VozComunidade';
import Atores from './pages/Atores';
import Compromissos from './pages/Compromissos';
import Configuracoes from './pages/Configuracoes';
import AuditoriaRegistro from './pages/AuditoriaRegistro';
import Agenda from './pages/Agenda';
import Landing from './pages/Landing';
import MaterialidadeViva from './pages/MaterialidadeViva';
import Welcome from './pages/Welcome';
import Etapa1 from './pages/Etapa1';
import Etapa2 from './pages/Etapa2';
import NovaAtividade from './pages/NovaAtividade';
import Atividades from './pages/Atividades';
import CodigoEtica from './pages/CodigoEtica';
import DicasRelacionamento from './pages/DicasRelacionamento';
import Relatorios from './pages/Relatorios';
import RegistreEscuta from './pages/RegistreEscuta';
import Liderancas from './pages/Liderancas';
import GerenciarLiderancas from './pages/GerenciarLiderancas';
import GerenciarOrganizacoes from './pages/GerenciarOrganizacoes';
import Analise from './pages/Analise';
import ReunioesRealizadas from './pages/ReunioesRealizadas';
import Comunicacao from './pages/Comunicacao';
import Documentos from './pages/Documentos';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Registros": Registros,
    "NovoRegistro": NovoRegistro,
    "VerRegistro": VerRegistro,
    "Mapa": Mapa,
    "Materialidade": Materialidade,
    "VozComunidade": VozComunidade,
    "Atores": Atores,
    "Compromissos": Compromissos,
    "Configuracoes": Configuracoes,
    "AuditoriaRegistro": AuditoriaRegistro,
    "Agenda": Agenda,
    "Landing": Landing,
    "MaterialidadeViva": MaterialidadeViva,
    "Welcome": Welcome,
    "Etapa1": Etapa1,
    "Etapa2": Etapa2,
    "NovaAtividade": NovaAtividade,
    "Atividades": Atividades,
    "CodigoEtica": CodigoEtica,
    "DicasRelacionamento": DicasRelacionamento,
    "Relatorios": Relatorios,
    "RegistreEscuta": RegistreEscuta,
    "Liderancas": Liderancas,
    "GerenciarLiderancas": GerenciarLiderancas,
    "GerenciarOrganizacoes": GerenciarOrganizacoes,
    "Analise": Analise,
    "ReunioesRealizadas": ReunioesRealizadas,
    "Comunicacao": Comunicacao,
    "Documentos": Documentos,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};