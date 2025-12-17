import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Lightbulb, Users, MessageCircle, Shield, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function WidgetDicasRelacionamento() {
  const [indiceAtual, setIndiceAtual] = useState(0);
  
  const dicas = [
    {
      icon: Heart,
      titulo: "Escuta Ativa",
      descricao: "Ouça atentamente sem interromper. Demonstre interesse genuíno pelas preocupações da comunidade.",
      cor: "text-red-600"
    },
    {
      icon: Users,
      titulo: "Respeito à Diversidade",
      descricao: "Valorize diferentes perspectivas e experiências. Cada voz é importante no diálogo comunitário.",
      cor: "text-purple-600"
    },
    {
      icon: MessageCircle,
      titulo: "Comunicação Clara",
      descricao: "Use linguagem acessível e evite termos técnicos desnecessários. Seja transparente sobre limites.",
      cor: "text-blue-600"
    },
    {
      icon: Shield,
      titulo: "Ética e Sigilo",
      descricao: "Mantenha confidencialidade das informações sensíveis. Respeite a LGPD e privacidade dos dados.",
      cor: "text-emerald-600"
    },
    {
      icon: CheckCircle2,
      titulo: "Comprometa-se",
      descricao: "Apenas prometa o que pode cumprir. Faça devolutivas dentro do prazo estabelecido.",
      cor: "text-amber-600"
    },
    {
      icon: Lightbulb,
      titulo: "Seja Proativo",
      descricao: "Antecipe necessidades e ofereça soluções. Mantenha contato regular com as lideranças.",
      cor: "text-orange-600"
    }
  ];

  const avancar = () => {
    setIndiceAtual((prev) => (prev + 2) % dicas.length);
  };

  const voltar = () => {
    setIndiceAtual((prev) => (prev - 2 + dicas.length) % dicas.length);
  };

  const dicasExibidas = [
    dicas[indiceAtual],
    dicas[(indiceAtual + 1) % dicas.length]
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#E31E24]" />
            Dicas de Relacionamento
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={voltar}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-slate-500">
              {Math.floor(indiceAtual / 2) + 1}/{Math.ceil(dicas.length / 2)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={avancar}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {dicasExibidas.map((dica, idx) => {
            const Icon = dica.icon;
            return (
              <div
                key={idx}
                className="flex gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border-2 border-slate-200">
                    <Icon className={`w-5 h-5 ${dica.cor}`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900 mb-1">{dica.titulo}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{dica.descricao}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}