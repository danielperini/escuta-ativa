import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
                      LayoutDashboard, 
                      FileText, 
                      MapPin, 
                      Users as UsersIcon,
                      Users, 
                      Target, 
                      MessageCircle,
                      CheckSquare,
                      Settings,
                      Menu,
                      X,
                      LogOut,
                      ChevronDown,
                      CalendarDays,
                      BarChart3,
                      User,
                      Shield,
                      ShieldCheck,
                      Home,
                      Sparkles,
                      CheckCircle2,
                      Plug,
                      Book,
                      Globe,
                      Palette,
                      PieChart,
                      UsersRound,
                      Database,
                      Activity
                      } from 'lucide-react';
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/NotificationCenter";
import NotificationGenerator from "@/components/NotificationGenerator";
import GeradorNotificacoesInteligente from "@/components/notificacoes/GeradorNotificacoesInteligente";
import BuscaInteligenteCodigo from "@/components/codigos/BuscaInteligenteCodigo";
import MonitorAgendaAtraso from "@/components/agenda/MonitorAgendaAtraso";
import DetectorRiscos from "@/components/mapa/DetectorRiscos";
import MonitorDevolutivas from "@/components/notificacoes/MonitorDevolutivas";
import MobileNavigation from "@/components/MobileNavigation";
import PWASetup from "@/components/PWASetup";
import ChatIA from "@/components/chatia/ChatIA";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
  {
    name: 'Escuta & Registro', icon: FileText, group: 'escuta',
    children: [
      { name: 'Registros', href: 'Registros', icon: FileText },
      { name: 'Voz da Comunidade', href: 'VozComunidade', icon: MessageCircle },
      { name: 'Gestão de Demandas', href: 'GestorDemandas', icon: CheckCircle2 },
      { name: 'Casos', href: 'Casos', icon: CheckSquare },
    ]
  },
  {
    name: 'Território', icon: MapPin, group: 'territorio',
    children: [
      { name: 'Mapa', href: 'Mapa', icon: MapPin },
      { name: 'Comunidades e Grupos', href: 'ComunidadesGrupos', icon: Home },
      { name: 'Análise Demográfica', href: 'AnaliseDemografica', icon: UsersRound },
      { name: 'Dados Secundários', href: 'DadosSecundarios', icon: Database },
    ]
  },
  {
    name: 'Relacionamento', icon: UsersIcon, group: 'relacionamento',
    children: [
      { name: 'Stakeholders', href: 'Stakeholders', icon: UsersIcon },
      { name: 'Mapa de Stakeholders', href: 'MapaStakeholders', icon: Users },
      { name: 'Agenda', href: 'Agenda', icon: CalendarDays },
      { name: 'Materialidade', href: 'Materialidade', icon: Target },
    ]
  },
  {
    name: 'Relatórios & ESG', icon: BarChart3, group: 'esg',
    children: [
      { name: 'Gerador de Relatório', href: 'GeradorRelatorioSustentabilidade', icon: Sparkles },
      { name: 'Relatórios Gerados', href: 'RelatoriosGerados', icon: FileText },
      { name: 'Referenciais ESG', href: 'ReferenciaisESG', icon: ShieldCheck },
      { name: 'ODS', href: 'ODS', icon: Globe },
      { name: 'Configurações ESG', href: 'ConfiguracoesESG', icon: Target },
    ]
  },
  {
    name: 'Sistema', icon: Settings, group: 'sistema',
    children: [
      { name: 'Equipes', href: 'GerenciarEquipes', icon: Users },
      { name: 'Usuários', href: 'GerenciarUsuarios', icon: User, admin: true },
      { name: 'Integrações', href: 'Integracoes', icon: Plug },
      { name: 'Saúde das Fontes', href: 'SaudeFontes', icon: Activity },
      { name: 'Limpeza de Dados', href: 'LimpezaDados', icon: Shield },
      { name: 'Aparência', href: 'Aparencia', icon: Palette },
      { name: 'Documentação', href: 'Documentacao', icon: Book },
    ]
  },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [user, setUser] = useState(null);
  const [tema, setTema] = useState('claro');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
    setTema(userData?.configuracoes?.tema || 'claro');
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const estiloTema = {
    background: '#f4f4f4',
    backgroundAlt: '#ffffff',
    text: '#333333',
    textMuted: '#64748b',
    border: '#e2e8f0',
    cardBg: '#ffffff'
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PWASetup />
      <NotificationGenerator />
      <MonitorAgendaAtraso />
      <DetectorRiscos />
      <MonitorDevolutivas />
      <style>{`
      /* societa.ai v2.1 - Sistema consolidado de escuta social */
      :root {
        --societa-red: #E31E24;
        --societa-red-dark: #B01419;
        --societa-red-light: #FF4D52;
        --societa-black: #000000;
        --societa-gray: #1a1a1a;
        --societa-pink: #FF9999;
        --amber-500: #F59E0B;
        --amber-600: #D97706;
        --social-blue: #3B82F6;
        --social-purple: #8B5CF6;
          
            --bg-main: #f4f4f4;
            --bg-card: #ffffff;
            --text-primary: #333333;
            --text-secondary: #64748b;
            --border-color: #e2e8f0;
          }
        }
        
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
      `}</style>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693acc814baf8083c262896b/8a81a6207_transparent-Photoroom12.png"
                alt="Societa.ai"
                className="h-8 object-contain"
              />
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <GeradorNotificacoesInteligente />

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              // Grupo colapsável
              if (item.children) {
                const visibleChildren = item.children.filter(c => !c.admin || user?.role === 'admin');
                if (visibleChildren.length === 0) return null;
                const hasActiveChild = visibleChildren.some(c => c.href === currentPageName);
                const isOpen = expandedGroups[item.group] ?? hasActiveChild;
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [item.group]: !(prev[item.group] ?? hasActiveChild) }))}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="flex-1 text-left">{item.name}</span>
                      <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen ? "rotate-0" : "-rotate-90")} />
                    </button>
                    {isOpen && (
                      <div className="space-y-1 ml-2 border-l border-white/10 pl-2">
                        {visibleChildren.map(child => {
                          const active = currentPageName === child.href;
                          return (
                            <Link
                              key={child.name}
                              to={createPageUrl(child.href)}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                active
                                  ? "bg-white/15 text-white"
                                  : "text-white/60 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              <child.icon className="w-4 h-4" />
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Link simples (top-level)
              const isActive = currentPageName === item.href;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/10 space-y-1">
            <Link
              to={createPageUrl('PreferenciasUsuario')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white text-sm font-medium transition-all"
            >
              <User className="w-5 h-5" />
              Meu Perfil
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
            <div className="lg:pl-64 pb-16 lg:pb-8">
              {/* Top bar */}
              <header className="sticky top-0 z-30 h-14 md:h-16 border-b border-border px-3 md:px-4 lg:px-8 bg-background text-foreground">
                <div className="flex items-center justify-between h-full gap-2">
                  <button 
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 active:scale-95"
                  >
                    <Menu className="w-5 h-5 md:w-6 md:h-6" />
                  </button>

            <div className="hidden lg:block flex-1 min-w-0">
              <h1 className="text-base md:text-lg font-semibold truncate text-foreground">
                {(() => {
                  const flat = navigation.flatMap(n => n.children ? n.children : [n]);
                  return flat.find(n => n.href === currentPageName)?.name || currentPageName;
                })()}
              </h1>
            </div>

            <div className="flex items-center gap-1 md:gap-2 lg:gap-4">
              <div className="hidden lg:block w-64 xl:w-80">
                <BuscaInteligenteCodigo />
              </div>

              <NotificationCenter />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 md:gap-2 pl-1 md:pl-2 pr-2 md:pr-3 h-9 md:h-10">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs md:text-sm font-medium">
                      {user?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
                      {user?.full_name || 'Usuário'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="text-sm">
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 md:p-4 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>

        {/* Mobile Navigation */}
        <MobileNavigation currentPageName={currentPageName} />
        </div>

      {/* Chat IA — painel contextual acessível em todas as páginas */}
      <ChatIA />
      </div>
        );
        }