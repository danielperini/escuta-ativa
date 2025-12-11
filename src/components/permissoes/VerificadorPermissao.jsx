import React from "react";
import { usePermissoes } from "./usePermissoes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export default function VerificadorPermissao({ 
    entidade, 
    acao, 
    comunidade = null,
    children, 
    mensagemNegado = "Você não tem permissão para realizar esta ação.",
    mostrarAlerta = false 
}) {
    const { verificarPermissao, verificarAcessoComunidade } = usePermissoes();

    const temPermissao = verificarPermissao(entidade, acao);
    const temAcessoComunidade = comunidade ? verificarAcessoComunidade(comunidade) : true;

    if (!temPermissao || !temAcessoComunidade) {
        if (mostrarAlerta) {
            return (
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertDescription>{mensagemNegado}</AlertDescription>
                </Alert>
            );
        }
        return null;
    }

    return <>{children}</>;
}