import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plug, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Integracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Integrações</h2>
        <p className="text-slate-500 mt-1">Conecte ferramentas externas ao sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="w-5 h-5 text-[#2D6A4F]" />
            Integrações Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Em breve você poderá conectar ferramentas externas como Slack, Google Drive, e muito mais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}