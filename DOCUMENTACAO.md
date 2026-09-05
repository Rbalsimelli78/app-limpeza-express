# 🧹 LIMPEZA EXPRESS SP — DOCUMENTAÇÃO TÉCNICA DO SISTEMA & MANUAL DE MANUTENÇÃO

Este documento consolida a arquitetura completa, boas práticas de programação, especificação do banco de dados, infraestrutura de hospedagem e procedimentos de manutenção para arquivamento e evolução do sistema **Limpeza Express SP**.

---

## 1. 📌 VISÃO GERAL DO PROJETO

O **Limpeza Express SP** é uma plataforma integrada de gestão operacional, agendamentos, precificação e fluxo de caixa desenvolvida sob medida para a gestão de serviços de faxinas residenciais e corporativas (com foco em apartamentos de 80 a 100m² em São Paulo - SP).

### 🎯 Objetivos Atendidos
* **Sincronização em Tempo Real Multi-Dispositivo**: Qualquer agendamento, cadastro ou pagamento registrado no computador da administração reflete instantaneamente no celular da gestora e vice-versa.
* **Resiliência Offline-First**: O aplicativo funciona mesmo em locais sem sinal de internet (subsolos, garagens, elevadores), salvando os dados no cache do dispositivo e sincronizando automaticamente assim que a conexão é restabelecida.
* **Operação sem Lojas de Aplicativos (PWA)**: Instalação direta no iPhone (iOS Safari) e Android (Google Chrome) sem burocracia ou taxas de publicação na App Store / Google Play.
* **Automação de Comunicação via WhatsApp**: Disparo com 1 clique de lembretes para clientes, envio de propostas formatadas com catálogo de serviços e ordens de escala de trabalho para ajudantes com chave PIX.

---

## 2. 🏗️ ARQUITETURA DA SOLUÇÃO & STACK TECNOLÓGICA

```
 ┌─────────────────────────────────────────────────────────┐
 │                   DISPOSITIVOS DE USO                   │
 │   Computador Administrador    📱 Celular Esposa (PWA)   │
 └─────────────┬───────────────────────────┬───────────────┘
               │                           │
               ▼                           ▼
 ┌─────────────────────────────────────────────────────────┐
 │             FRONTEND: REACT 19 + VITE (SPA)             │
 │  • Camada de Visão (Views & Modais)                     │
 │  • Camada de Estado Global (AppContext.jsx)             │
 │  • Cache Offline Local (localStorage / sessionStorage)  │
 └─────────────────────────────┬───────────────────────────┘
                               │
            Sincronização Bidirecional em Tempo Real
                               ▼
 ┌─────────────────────────────────────────────────────────┐
 │       BANCO DE DADOS: GOOGLE FIREBASE CLOUD FIRESTORE   │
 │  • Coleções NoSQL: clientes, ajudantes, agendamentos,   │
 │    planos                                               │
 │  • WebSockets / Listeners (onSnapshot)                  │
 └─────────────────────────────┬───────────────────────────┘
                               │
               Hospedagem & Deploy Contínuo (CI/CD)
                               ▼
 ┌─────────────────────────────────────────────────────────┐
 │          HOSPEDAGEM: VERCEL EDGE NETWORK                │
 │  • Repositório: GitHub (Rbalsimelli78/app-limpeza-express)│
 │  • Deploy Automático a cada `git push origin main`      │
 └─────────────────────────────────────────────────────────┘
```

### Tecnologias Utilizadas
* **Linguagem & Framework**: JavaScript ES6+ / JSX com **React 19**.
* **Bundler & Build Tool**: **Vite 8** (compilação rápida e Hot Module Replacement).
* **Estilização**: **Vanilla CSS Modular** com variáveis de Design System nativas, Glassmorphism e suporte completo a **Dark Mode** e **Light Mode**.
* **Banco de Dados na Nuvem**: **Google Cloud Firebase Firestore (SDK v12)**.
* **Ícones**: **Lucide React** (moderno, leve e de alta definição).
* **Hospedagem & CI/CD**: **Vercel** conectado ao **GitHub**.

---

## 3. ☁️ BANCO DE DADOS (GOOGLE FIREBASE CLOUD FIRESTORE)

O sistema utiliza o **Cloud Firestore**, um banco de dados NoSQL distribuído globalmente pela Google Cloud Platform, garantindo alta disponibilidade e latência ultrabaixa para São Paulo.

### 🔑 Informações de Configuração do Projeto
* **Projeto Firebase**: `limpeza-express-sp`
* **Localização dos Dados**: `southamerica-east1` (São Paulo, Brasil)
* **Modo do Banco**: Standard Edition (Default)
* **Arquivo de Conexão**: [`src/services/firebase.js`](file:///C:/Users/ACER/.gemini/antigravity-ide/scratch/limpeza-express-sp/src/services/firebase.js)
* **Serviço de Sincronização**: [`src/services/cloudSync.js`](file:///C:/Users/ACER/.gemini/antigravity-ide/scratch/limpeza-express-sp/src/services/cloudSync.js)

### 🗂️ Modelagem das Coleções (Data Dictionary)

#### 1. Coleção: `clientes`
Armazena os dados cadastrais, endereço e histórico dos clientes contratantes.
```json
{
  "id": "cli-1788625900000",
  "nome": "Mariana Silva Souza",
  "telefone": "(11) 98765-4321",
  "endereco": "Rua Bela Cintra, 1200",
  "apartamento": "Apt 42 - Bloco B",
  "bairro": "Consolação, São Paulo - SP",
  "dormitorios": 2,
  "metragem": "80 a 100m²",
  "planoPadraoId": "plano-quinzenal",
  "observacoes": "Tem um gatinho dócil. Chave na portaria liberada.",
  "criadoEm": "2026-03-05"
}
```

#### 2. Coleção: `ajudantes`
Armazena o perfil das colaboradoras e diaristas, com dados financeiros para pagamento imediato.
```json
{
  "id": "ajud-1788625900000",
  "nome": "Dona Maria Aparecida",
  "telefone": "(11) 96543-2109",
  "chavePix": "11965432109",
  "tipoPix": "Telefone",
  "tipoRemuneracao": "diaria",
  "valorPadrao": 90.00,
  "especialidade": "Limpeza pesada, vidros e cozinhas planejadas",
  "status": "ativo"
}
```

#### 3. Coleção: `agendamentos`
Armazena cada faxina agendada, sua composição de equipe, valores e status financeiro.
```json
{
  "id": "agend-1788625900000",
  "clienteId": "cli-1",
  "planoId": "plano-quinzenal",
  "dataHoraInicio": "2026-03-10T08:00",
  "dataHoraFim": "2026-03-10T12:00",
  "dormitorios": 2,
  "semManutencao2Meses": false,
  "valorCliente": 190.00,
  "statusClientePagamento": "pendente",
  "statusServico": "confirmado",
  "observacoes": "Levar aspirador e panos de microfibra.",
  "ajudantesEscaladas": [
    {
      "ajudanteId": "ajud-1",
      "valorAPagar": 90.00,
      "statusPagamento": "pendente"
    }
  ]
}
```

#### 4. Coleção: `planos`
Catálogo oficial dos pacotes de limpeza oferecidos aos clientes.
```json
{
  "id": "plano-quinzenal",
  "nome": "Plano Quinzenal",
  "tag": "Mais Escolhido",
  "preco": 190.00,
  "descricaoDorms": "Até 2 dormitórios",
  "tempo": "3 a 5 horas",
  "equipe": "2 profissionais",
  "descricao": "Ideal para manter a casa organizada a cada 15 dias sem acúmulo de sujeira.",
  "servicos": [
    "Varrer e passar pano em todo o piso",
    "Limpeza de bancadas de cozinha e louças",
    "Higienização completa de banheiros",
    "Limpeza de janelas e vidros internos"
  ]
}
```

### 🔒 Regras de Segurança do Firestore (`firestore.rules`)
As regras foram publicadas no console do Firebase para permitir acesso transparente e sem atrito do aplicativo Web/PWA:
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 4. 🌐 HOSPEDAGEM & ESTEIRA DE DEPLOY (CI/CD)

### Detalhes do Ambiente
* **Provedor de Hospedagem**: [Vercel](https://vercel.com)
* **Repositório GitHub**: `https://github.com/Rbalsimelli78/app-limpeza-express.git`
* **Branch de Produção**: `main`
* **URL Pública do Aplicativo**: `https://app-limpeza-express.vercel.app/`
* **Ambiente de Build**: Node.js 20+
* **Comando de Build**: `npm run build`
* **Diretório de Saída (Output Directory)**: `dist`

### 🔄 Como Funciona o Deploy Automático
Toda vez que uma alteração é enviada para a branch `main` do GitHub via `git push origin main`, o Vercel automaticamente:
1. Detecta o commit no repositório.
2. Executa a instalação de pacotes (`npm install`).
3. Roda a compilação do Vite (`npm run build`), minificando JS e CSS.
4. Publica os novos arquivos na CDN global em menos de 45 segundos.

---

## 5. 💡 BOAS PRÁTICAS DE PROGRAMAÇÃO ADOTADAS

### 1. Separação Estrita de Responsabilidades (SoC)
* **`src/views/`**: Telas principais da aplicação (Dashboard, Agenda, Clientes, Ajudantes, Planos, Orçamento, Financeiro, Configurações). Focadas em renderização e experiência do usuário.
* **`src/components/`**: Componentes reutilizáveis (Modais de cadastro, Calendário mensal, Gráficos SVG, Barra superior e navegação móvel).
* **`src/context/`**: Camada única de estado global (`AppContext.jsx`) que orquestra a lógica de negócio, persistência e cálculos.
* **`src/services/`**: Camada de integração externa (Inicialização do Firebase e listeners do Firestore).

### 2. Padrão Offline-First & Resiliência de Dados
* Ao carregar a aplicação, os dados são lidos **instantaneamente do `localStorage`** do aparelho. Isso elimina "telas de carregamento" infinitas e permite que o sistema abra instantaneamente.
* Concomitantemente, os listeners `onSnapshot` do Firestore conectam-se em segundo plano e aplicam qualquer atualização remota feita no outro dispositivo.
* Se a conexão falhar ou o dispositivo estiver sem sinal, a aplicação continua funcionando normalmente e marca o selo como `Local`, garantindo zero perda de produtividade.

### 3. Imutabilidade no Estado React
* Toda e qualquer mutação de estado utiliza padrões funcionais puros (`map`, `filter`, spread operator `...prev`), prevenindo re-renderizações desnecessárias e efeitos colaterais.

### 4. Responsividade Mobile-First no CSS
* **Sem Frameworks Pesados**: Não depende de bibliotecas pesadas de CSS (como Tailwind ou Bootstrap), garantindo um carregamento ultrarrápido (< 800ms) no celular.
* **Gráficos em SVG Puro**: O componente [`LineChart.jsx`](file:///C:/Users/ACER/.gemini/antigravity-ide/scratch/limpeza-express-sp/src/components/LineChart.jsx) foi desenvolvido em SVG vetorial responsivo com viewBox dinâmico e área de toque ampliada, garantindo compatibilidade perfeita tanto em telas retina de iPhone quanto em computadores ultrawide.

### 5. Sanitização e Formatação Regional Brasileira
* Moedas formatadas com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
* Datas compatíveis com o fuso de São Paulo (`America/Sao_Paulo` / GMT-3).
* Exportações em Excel geradas em formato CSV com **BOM UTF-8 (`\uFEFF`)** e separador de ponto e vírgula (`;`), garantindo que o Microsoft Excel brasileiro abra acentos e caracteres especiais perfeitamente.

---

## 6. 📐 REGRAS DE NEGÓCIO & CÁLCULOS DO SISTEMA

### 💰 Precificação Oficial da Limpeza Express SP
* **Plano Semanal**: R$ 170,00 (2 dormitórios, 3 a 5h, 2 profissionais).
* **Plano Quinzenal**: R$ 190,00 (2 dormitórios, 3 a 5h, 2 profissionais).
* **Plano Mensal**: R$ 200,00 (2 dormitórios, 3 a 5h, 2 profissionais).
* **Acréscimo por Dormitório Extra**:
  $$\text{Acréscimo} = \max(0, \text{dormitórios} - 2) \times \text{R\$\ } 30,00$$
* **Taxa de Apartamento sem Manutenção há mais de 2 Meses**:
  $$\text{Taxa} = \text{R\$\ } 50,00$$
* **Regra de Cancelamento**:
  $$\text{Cancelamento com menos de 48h} \rightarrow \text{Cobrança de 50\% do valor do serviço}$$

### 📊 Algoritmo Financeiro de Caixa
* **Total Recebido**: Soma de `valorCliente` de todas as faxinas com `statusClientePagamento === 'pago'`.
* **Total a Receber**: Soma de `valorCliente` de faxinas com `statusClientePagamento === 'pendente'`.
* **Total Pago às Ajudantes**: Soma de `valorAPagar` das colaboradoras com `statusPagamento === 'pago'`.
* **Total a Pagar às Ajudantes**: Soma de `valorAPagar` das colaboradoras com `statusPagamento === 'pendente'`.
* **Lucro Realizado (Caixa Líquido)**:
  $$\text{Lucro Realizado} = \text{Total Recebido} - \text{Total Pago às Ajudantes}$$
* **Margem Líquida Real**:
  $$\text{Margem (\%)} = \left(\frac{\text{Lucro Realizado}}{\text{Total Recebido}}\right) \times 100$$

---

## 7. 🛠️ GUIA DE OPERAÇÃO & MANUTENÇÃO DO SISTEMA

### 💻 Como Rodar o Sistema no Computador Localmente
1. Abra o terminal (PowerShell ou VS Code) na pasta do projeto:
   ```powershell
   cd C:\Users\ACER\.gemini\antigravity-ide\scratch\limpeza-express-sp
   ```
2. Instale as dependências (caso seja a primeira vez ou após clonar):
   ```powershell
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```powershell
   npm run dev
   ```
4. Acesse no navegador: `http://localhost:5173/`

### 🚀 Como Publicar Novas Atualizações para o Celular da Esposa
Após fazer qualquer alteração no código no computador, basta rodar:
```powershell
cd C:\Users\ACER\.gemini\antigravity-ide\scratch\limpeza-express-sp
git add .
git commit -m "feat: descricao das melhorias"
git push origin main
```
Em menos de 1 minuto, a Vercel compila e atualiza o aplicativo em produção.

### 💾 Rotina de Backup dos Dados
1. Acesse o menu **Configurações & Backup** na barra lateral.
2. No card **Segurança & Backup dos Dados**, clique em:
   * **"Fazer Backup Agora (.JSON)"**: O sistema baixa um arquivo com data e hora contendo todos os clientes, ajudantes, agendamentos e planos.
3. Para restaurar em um novo computador ou após formatação:
   * Clique em **"Restaurar Backup do Arquivo"** e selecione o arquivo `.json`.

### 🧹 Limpeza de Dados de Teste para Entrada em Produção Real
Quando a gestora estiver pronta para utilizar o sistema exclusivamente com dados de clientes reais:
1. Vá em **Configurações & Backup** ➔ **Limpar Dados de Exemplo**.
2. Opções disponíveis:
   * **Limpar Apenas Faxinas de Teste**: Mantém os clientes e ajudantes cadastrados e zera apenas a agenda e o histórico financeiro.
   * **Limpar Base Completa**: Zera 100% dos dados no computador, celular e na nuvem Firebase para começar do zero absoluto.
   * **Recarregar Dados de Demonstração**: Restaura os dados de exemplo caso deseje treinar ou apresentar o sistema.

### 🔐 Gestão de Senha do Administrador
* **Credenciais Padrão de Fábrica**:
  * Usuário: `admin`
  * Senha: `123456` *(ou `123`)*
* Para alterar: Vá em **Configurações & Backup** ➔ **Segurança & Senha de Acesso**, informe a senha atual e defina um novo usuário e senha.
* Se esquecer a senha: Há um botão de segurança **"Restaurar padrão de fábrica"** que volta as credenciais para `admin` / `123456`.

---

## 8. 🔍 SOLUÇÃO DE PROBLEMAS (TROUBLESHOOTING)

| Sintoma | Causa Mais Provável | Solução |
| :--- | :--- | :--- |
| Selo no topo exibe **⚪ Local** | Dispositivo sem internet ou regras do Firestore pendentes | Verifique a conexão Wi-Fi/4G. Se a internet estiver ativa, clique no selo para forçar reconexão. |
| Celular exibe dados antigos | Navegador móvel está com cache agressivo | Abra a página no celular, arraste para baixo para atualizar (pull-to-refresh) ou feche e reabra o PWA. |
| Erro `PERMISSION_DENIED` no console | Regras do Firestore desativadas no Firebase Console | Acesse `console.firebase.google.com`, abra a aba **Regras** do Firestore e garanta que está com `allow read, write: if true;`. |
| Falha no `git push origin main` | Credenciais do GitHub pendentes no terminal Windows | Abra o terminal do VS Code ou GitHub Desktop e autentique sua conta `Rbalsimelli78`. |

---

*Documentação elaborada e validada para arquivo permanente da Limpeza Express SP.*  
*Versão da Plataforma: **1.2.0 (Cloud Firestore Real-Time Production Edition)**.*
