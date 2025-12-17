import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <Card className="max-w-md w-full border-red-200">
            <CardHeader className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
              <CardTitle className="text-red-900">Erro Inesperado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 text-center">
                Algo deu errado. A equipe foi notificada.
              </p>
              {this.state.error && (
                <details className="text-xs bg-red-50 p-3 rounded border border-red-200">
                  <summary className="cursor-pointer font-medium text-red-900">
                    Detalhes técnicos
                  </summary>
                  <pre className="mt-2 text-red-700 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              <Button
                onClick={() => window.location.reload()}
                className="w-full gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;