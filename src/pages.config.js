import Dashboard from './pages/Dashboard';
import Registros from './pages/Registros';
import NovoRegistro from './pages/NovoRegistro';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Registros": Registros,
    "NovoRegistro": NovoRegistro,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};