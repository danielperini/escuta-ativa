import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { TEMA_INFO, useTema } from '@/components/ThemeProvider';

export default function Aparencia() {
  const navigate = useNavigate();
  const { tema, setTema, temas } = useTema();

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(createPageUrl('PreferenciasUsuario'))}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Aparência</h1>
          <p className="text-muted-foreground mt-1">
            Escolha o tema visual aplicado a todo o app. Sua escolha é salva por usuário.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Temas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {temas.map((id) => {
              const info = TEMA_INFO[id];
              const ativo = tema === id;
              return (
                <div
                  key={id}
                  className={`relative rounded-xl border-2 p-4 transition-all ${
                    ativo
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {ativo && (
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                      <Check className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                  )}

                  {/* Mini paleta */}
                  <div className="flex gap-1.5 mb-3">
                    {info.swatches.map((c, i) => (
                      <div
                        key={i}
                        className="flex-1 h-10 rounded-md border border-border"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>

                  <h3 className="font-semibold text-foreground">{info.nome}</h3>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[2.5rem]">{info.descricao}</p>

                  <Button
                    onClick={() => setTema(id)}
                    disabled={ativo}
                    className="w-full mt-3"
                    variant={ativo ? 'secondary' : 'default'}
                  >
                    {ativo ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Aplicado
                      </>
                    ) : (
                      'Aplicar'
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            O tema é aplicado imediatamente e persiste entre sessões. Em tema escuro (NOITE), cards,
            tabelas, mapas, modais e o assistente de IA acompanham o modo escuro.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}