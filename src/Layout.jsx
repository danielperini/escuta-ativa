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
  Shield
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/NotificationCenter";
import NotificationGenerator from "@/components/NotificationGenerator";
import BuscaInteligenteCodigo from "@/components/codigos/BuscaInteligenteCodigo";
import MonitorAgendaAtraso from "@/components/agenda/MonitorAgendaAtraso";
import DetectorRiscos from "@/components/mapa/DetectorRiscos";
import MonitorDevolutivas from "@/components/notificacoes/MonitorDevolutivas";
import MobileNavigation from "@/components/MobileNavigation";
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
  { name: 'Registros', href: 'Registros', icon: FileText },
  { name: 'Agenda', href: 'Agenda', icon: CalendarDays },
  { name: 'Mapa', href: 'Mapa', icon: MapPin },
  { name: 'Materialidade', href: 'Materialidade', icon: Target },
  { name: 'Voz da Comunidade', href: 'VozComunidade', icon: MessageCircle },
  { name: 'Stakeholders', href: 'Stakeholders', icon: UsersIcon },
  { name: 'Mapa de Stakeholders', href: 'MapaStakeholders', icon: Users },
  { name: 'Casos', href: 'Casos', icon: CheckSquare },
  { name: 'Análise', href: 'Analise', icon: BarChart3 },
  { name: 'Equipes', href: 'GerenciarEquipes', icon: Users },
  { name: 'Usuários', href: 'GerenciarUsuarios', icon: User }
  ];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const estiloTema = tema === 'escuro' ? {
    background: '#1e293b',
    backgroundAlt: '#0f172a',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#334155',
    cardBg: '#1e293b'
  } : {
    background: '#f8fafc',
    backgroundAlt: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    cardBg: '#ffffff'
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: estiloTema.background }}>
      <NotificationGenerator />
      <MonitorAgendaAtraso />
      <DetectorRiscos />
      <MonitorDevolutivas />
      <style>{`
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
          
          ${tema === 'escuro' ? `
            --bg-main: #1e293b;
            --bg-card: #1e293b;
            --text-primary: #f1f5f9;
            --text-secondary: #94a3b8;
            --border-color: #334155;
          ` : `
            --bg-main: #f8fafc;
            --bg-card: #ffffff;
            --text-primary: #0f172a;
            --text-secondary: #64748b;
            --border-color: #e2e8f0;
          `}
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
        "fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-[#E31E24] to-[#B01419] transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693acc814baf8083c262896b/6ef53ae31_transparent-Photoroom12.png"
                alt="Societa.ai"
                className="h-10 object-contain"
              />
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
                              const isActive = currentPageName === item.href;
                              const requerAdmin = item.href === 'GerenciarUsuarios';

                              // Ocultar link de Usuários se não for admin
                              if (requerAdmin && user?.role !== 'admin') return null;

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
                                  {requerAdmin && <Shield className="w-3 h-3 ml-auto" />}
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
            <Link
              to={createPageUrl('Configuracoes')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white text-sm font-medium transition-all"
            >
              <Settings className="w-5 h-5" />
              Configurações
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 pb-safe">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 border-b px-4 lg:px-8 bg-white" style={{
          backgroundColor: estiloTema.backgroundAlt,
          borderColor: estiloTema.border
        }}>
          <div className="flex items-center justify-between h-full">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold" style={{ color: estiloTema.text }}>
                {navigation.find(n => n.href === currentPageName)?.name || currentPageName}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:block w-80">
                <BuscaInteligenteCodigo />
              </div>

              <NotificationCenter />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
                    <div className="w-8 h-8 rounded-full bg-[#E31E24] flex items-center justify-center text-white text-sm font-medium">
                      {user?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-slate-700">
                      {user?.full_name || 'Usuário'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
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
        <main className="p-4 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>

        {/* Mobile Navigation */}
        <MobileNavigation currentPageName={currentPageName} />
        </div>
        </div>
        );
        }