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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};