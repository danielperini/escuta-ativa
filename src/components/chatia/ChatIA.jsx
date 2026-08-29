import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { MessageSquareText, Sparkles, X } from 'lucide-react';
import ChatIACore from '@/components/chatia/ChatIACore';

export default function ChatIA() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botão flutuante fixo à direita */}
      <button
        onClick={() => setOpen(true)}
        title="Pergunte à inteligência territorial"
        className="fixed right-4 lg:right-6 bottom-24 lg:bottom-8 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
      >
        <MessageSquareText className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">Assistente IA</span>
        <Sparkles className="w-3.5 h-3.5 opacity-70" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between space-y-0">
            <div>
              <SheetTitle className="text-base flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-primary" /> Assistente IA
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </SheetTitle>
              <SheetDescription className="text-xs">
                Pergunte sobre comunidades, territórios e dados da societá.ai
              </SheetDescription>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
              <X className="w-4 h-4" />
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <ChatIACore onCloseLink={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}