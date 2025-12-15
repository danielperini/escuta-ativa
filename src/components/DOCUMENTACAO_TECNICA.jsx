import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Database, Code, Shield, Zap } from 'lucide-react';

export default function DocumentacaoTecnica() {
  const baixarDocumentacao = () => {
    const conteudo = `# Societa.ai - Documentação Técnica

## 📋 Índice
1. Visão Geral
2. Arquitetura do Sistema
3. Stack Tecnológico
4. Modelo de Dados
5. Funcionalidades Principais
6. Backend Functions
7. Integrações Externas
8. Autenticação e Permissões
9. Configuração e Deploy
10. Manutenção e Monitoramento

---

## 1. Visão Geral

### Propósito
Societa.ai é uma plataforma de inteligência social para gestão de relacionamento comunitário empresarial. O sistema permite registrar, analisar e gerenciar interações com comunidades territoriais, identificando demandas, riscos sociais, compromissos e continuidades através de IA.

### Principais Capacidades
- ✅ Registro multimídia de interações (áudio, vídeo, foto, documentos)
- 🤖 Transcrição automática com Whisper API
- 📊 Análise de sentimento e temperatura social
- 🎯 Detecção automática de riscos e demandas
- 👥 Gestão de stakeholders e atores
- 📅 Agendamento e devolutivas obrigatórias
- 🗺️ Mapeamento territorial com coordenadas
- 📈 Dashboard com KPIs e visualizações interativas
- 🔗 Integrações com Google Calendar e Slack

---

## 2. Arquitetura do Sistema

### Estrutura de Pastas
/
├── entities/              # Esquemas JSON de entidades
├── pages/                 # Páginas React (flat, sem subpastas)
├── components/            # Componentes React reutilizáveis
│   ├── dashboard/        # Componentes do dashboard
│   ├── registro/         # Componentes de registro
│   ├── integracoes/      # Integrações externas
│   ├── devolutiva/       # Sistema de devolutivas
│   ├── stakeholders/     # Gestão de stakeholders
│   └── ...
├── functions/            # Backend functions (Deno)
├── agents/               # Configuração de agentes IA
├── Layout.js             # Layout principal da aplicação
└── globals.css           # Estilos globais

### Fluxo de Dados
Usuário → Interface React → Base44 SDK → Backend as a Service
                           ↓
                    LLM APIs (OpenAI/Anthropic)
                           ↓
                    Entidades no Banco de Dados

---

## 3. Stack Tecnológico

### Frontend
- **Framework**: React 18.2
- **Roteamento**: React Router DOM 6.26
- **Gerenciamento de Estado**: TanStack React Query 5.84
- **UI Components**: Shadcn/ui (Radix UI + Tailwind), Lucide React, Recharts
- **Estilização**: Tailwind CSS 3.x
- **Formulários**: React Hook Form 7.54
- **Mapas**: React Leaflet 4.2
- **Markdown**: React Markdown 9.0
- **Animações**: Framer Motion 11.16

### Backend
- **Runtime**: Deno Deploy
- **SDK**: Base44 SDK 0.8.4
- **Integrações**: OpenAI Whisper, Google Calendar API, Slack API

### Banco de Dados
- **Tipo**: Base44 Managed Database (PostgreSQL)
- **ORM**: Base44 Entities SDK

### IA e Machine Learning
- **Modelos**: GPT-4, Claude 3.5 Sonnet
- **Casos de Uso**:
  - Transcrição de áudio (Whisper)
  - OCR de imagens
  - Extração de texto de documentos
  - Análise de sentimento
  - Detecção de riscos
  - Geração de resumos

---

## 4. Modelo de Dados

### Entidades Principais

#### Registro
Interação com comunidade (reunião, visita, conversa)
- codigo_unico: String única (RE-UT-XXXXXX-AAAA)
- titulo: String (obrigatório)
- tipo: Enum (reuniao, conversa_campo, visita, demanda, ocorrencia)
- comunidade: String
- transcricao: Text (extraído de áudio/vídeo)
- participantes: Array<String>
- temas_identificados: Array<String>
- temperatura_territorio: Enum (baixo, medio, alto, critico)
- demandas: Array<Object> (com prazo_devolutiva, urgencia)
- compromissos: Array<Object>
- arquivos: Array<Object> (URLs de mídia)
- localizacao: Object (lat, lng, municipio, estado)
- auditoria: Object (trilha de alterações)

#### Stakeholder (LiderancaComunitaria + ProjetoOrganizacao)
Atores sociais (lideranças e organizações)
- nome, tipo, comunidade
- contato: Object (telefone, email, whatsapp)
- nivel_influencia: Enum (baixo, medio, alto)
- historico_auditoria: Array (LGPD compliant)

#### Caso
Demanda que requer acompanhamento formal
- codigo_unico: String (CA-UT-XXXXXX-AAAA)
- tipo: Enum (devolutiva, demanda_individual, etc)
- stakeholders_envolvidos: Array<ID> (obrigatório)
- status: Enum (em_aberto, pendente, em_andamento, concluido)
- prazo: Date (padrão 15 dias)

#### RiscoSocial
Risco territorial detectado
- titulo, nivel, status, comunidade
- tendencia: Enum (subindo, estavel, caindo)

#### Agenda
Compromissos agendados
- titulo, data, tipo, status
- evidencias_realizacao: Array<String>

---

## 5. Funcionalidades Principais

### Registro Unificado
**Fluxo**:
1. Upload de arquivo multimídia
2. Processamento e extração de texto via IA
3. Análise automática e preenchimento
4. Revisão manual
5. Detecção de vínculos
6. Finalização

**Formatos Suportados**: MP3, WAV, M4A, OGG, WEBM, MP4, JPG, PNG, PDF, DOC

**IA Integrada**: Whisper (transcrição), GPT-4 Vision (OCR), análise estruturada

### Dashboard Interativo
- KPIs: Registros, demandas urgentes, riscos ativos, agendas
- Gráficos de tendência (Recharts)
- Widgets personalizáveis
- Alertas em tempo real

### Sistema de Devolutivas
- Prazo padrão: 15 dias (configurável)
- Urgência ajusta prazo
- Alertas automáticos
- Status tracking

---

## 6. Backend Functions

### Estrutura Padrão
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Lógica
  return Response.json({ success: true });
});

### Functions Disponíveis
- syncGoogleCalendar.js: Criar eventos no Google Calendar
- sendSlackNotification.js: Enviar mensagens no Slack

---

## 7. Integrações Externas

### Google Calendar
- OAuth 2.0 (scopes: calendar.events, calendar.readonly)
- Sincronização bidirecional
- Backend function dedicada

### Slack
- OAuth 2.0 (scopes: chat:write, channels:read)
- Notificações de riscos e alertas
- Backend function dedicada

### Exportação
- CSV e XLSX
- Campos customizáveis
- Biblioteca: xlsx@0.18.5

---

## 8. Autenticação e Permissões

### Sistema de Roles
- Admin: Acesso total
- User: Acesso padrão
- Customizados: Definidos por admins

### Estrutura de Permissões
{
  "registros": { "visualizar": true, "criar": true, ... },
  "stakeholders": { ... },
  "usuarios": { ... }
}

### Auditoria
- LogAcesso: Todos os acessos
- HistoricoPermissoes: Alterações de permissões
- LGPD compliant

---

## 9. Configuração e Deploy

### Variáveis de Ambiente
BASE44_APP_ID=auto
BASE44_SERVICE_ROLE_KEY=auto
OPENAI_API_KEY=sk-... (opcional)

### Secrets
Configurados via Dashboard → Settings → Environment Variables

### App Connectors
OAuth configurado via código:
await base44.connectors.requestAuthorization({
  integration_type: 'googlecalendar',
  scopes: [...],
  reason: 'Para criar eventos'
});

---

## 10. Manutenção e Monitoramento

### Performance
- TanStack Query com cache
- Lazy loading
- Debouncing em buscas

### Segurança
- HTTPS em todas comunicações
- OAuth 2.0 para integrações
- Service Role isolado
- LGPD compliance

### Backup
- Dados gerenciados pela plataforma
- Versionamento via Git
- Auditoria para rollback

---

## Glossário

| Termo | Definição |
|-------|-----------|
| Registro | Documento de interação com comunidade |
| Stakeholder | Liderança ou organização comunitária |
| Caso | Demanda que requer acompanhamento formal |
| Devolutiva | Resposta obrigatória a uma demanda |
| Temperatura Social | Nível de tensão no território |
| Continuidade | Vínculo entre registros relacionados |
| Materialidade | Temas relevantes para comunidade e empresa |

---

## Diagrama de Arquitetura

┌─────────────────────────────────────┐
│        FRONTEND (React)              │
│  Dashboard │ Registros │ Stakeh.    │
│           Base44 SDK                 │
└───────────────┬─────────────────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
┌───▼───┐   ┌──▼───┐   ┌──▼────┐
│Backend│   │BaaS  │   │Ext.   │
│Funcs  │   │DB    │   │APIs   │
└───────┘   └──────┘   └───────┘

---

**Versão**: 1.0  
**Data**: Dezembro 2025  
**Status**: Produção
`;

    const blob = new Blob([conteudo], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DOCUMENTACAO_TECNICA_SOCIETA.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const secoes = [
    { titulo: 'Visão Geral', icone: FileText, itens: ['Propósito do sistema', 'Capacidades principais', 'Público-alvo'] },
    { titulo: 'Arquitetura', icone: Code, itens: ['Estrutura de pastas', 'Fluxo de dados', 'Componentes'] },
    { titulo: 'Dados', icone: Database, itens: ['21 entidades principais', 'Relacionamentos', 'Esquemas JSON'] },
    { titulo: 'Integrações', icone: Zap, itens: ['Google Calendar', 'Slack', 'OpenAI Whisper'] },
    { titulo: 'Segurança', icone: Shield, itens: ['OAuth 2.0', 'LGPD compliance', 'Auditoria completa'] }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">Documentação Técnica</h1>
        <p className="text-slate-600">Societa.ai - Sistema de Inteligência Social</p>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="p-8 text-center space-y-4">
          <FileText className="w-16 h-16 mx-auto text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Documentação Completa para TI</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Documentação técnica detalhada incluindo arquitetura, modelo de dados, 
            integrações, segurança e guia de deploy.
          </p>
          <Button 
            onClick={baixarDocumentacao}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Download className="w-5 h-5" />
            Baixar Documentação (.md)
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {secoes.map((secao, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <secao.icone className="w-5 h-5 text-blue-600" />
                {secao.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                {secao.itens.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conteúdo da Documentação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900">📋 Seções Incluídas</h3>
              <ul className="space-y-1 text-slate-600">
                <li>✓ Visão Geral do Sistema</li>
                <li>✓ Arquitetura e Fluxo de Dados</li>
                <li>✓ Stack Tecnológico Completo</li>
                <li>✓ Modelo de Dados (21 entidades)</li>
                <li>✓ Funcionalidades Principais</li>
                <li>✓ Backend Functions (Deno)</li>
                <li>✓ Integrações Externas</li>
                <li>✓ Sistema de Permissões</li>
                <li>✓ Guia de Deploy</li>
                <li>✓ Manutenção e Monitoramento</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900">🔧 Informações Técnicas</h3>
              <ul className="space-y-1 text-slate-600">
                <li>✓ React 18.2 + Tailwind CSS</li>
                <li>✓ Base44 SDK 0.8.4</li>
                <li>✓ TanStack Query 5.84</li>
                <li>✓ Deno Deploy (Backend)</li>
                <li>✓ PostgreSQL (Managed)</li>
                <li>✓ OpenAI Whisper API</li>
                <li>✓ Google Calendar OAuth</li>
                <li>✓ Slack Integration</li>
                <li>✓ LGPD Compliance</li>
                <li>✓ Diagramas de Arquitetura</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}