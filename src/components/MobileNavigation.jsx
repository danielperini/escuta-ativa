import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, 
  FileText, 
  MapPin, 
  Users,
  BarChart3,
  Menu
} from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
  { name: 'Registros', href: 'Registros', icon: FileText },
  { name: 'Mapa', href: 'Mapa', icon: MapPin },
  { name: 'Stakeholders', href: 'Stakeholders', icon: Users },
];

const allNavItems = [
  { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
  { name: 'Registros', href: 'Registros', icon: FileText },
  { name: 'Agenda', href: 'Agenda', icon: FileText },
  { name: 'Mapa', href: 'Mapa', icon: MapPin },
  { name: 'Materialidade', href: 'Materialidade', icon: BarChart3 },
  { name: 'Stakeholders', href: 'Stakeholders', icon: Users },
  { name: 'Casos', href: 'Casos', icon: FileText },
  { name: 'Análise', href: 'Analise', icon: BarChart3 },
];

export default function MobileNavigation({ currentPageName }) {
  const location = useLocation();
  
  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {mainNavItems.map((item) => {
            const isActive = currentPageName === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                  isActive 
                    ? "text-[#2D6A4F]" 
                    : "text-slate-500 active:bg-slate-50"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "fill-[#2D6A4F]/10")} />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
          
          {/* More Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-slate-500 active:bg-slate-50 transition-colors">
                <Menu className="w-5 h-5" />
                <span className="text-xs font-medium">Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle>Menu Completo</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {allNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.href;
                  
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.href)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all active:scale-95",
                        isActive 
                          ? "bg-[#2D6A4F]/10 border-[#2D6A4F] text-[#2D6A4F]" 
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <Icon className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium text-center">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      
      {/* Spacer for fixed bottom nav */}
      <div className="h-16 lg:hidden" />
    </>
  );
}