# 📋 BACKLOG DE MELHORIAS & CORREÇÕES — LIMPEZA EXPRESS SP

Este documento gerencia o backlog de tarefas técnicas, correções de bugs, otimizações de performance e melhorias de produto do sistema **Limpeza Express SP**.

---

## 📊 Matriz de Priorização (Status Geral)

| ID | Tipo | Descrição | Prioridade | Esforço Est. | Status |
| :---: | :---: | :--- | :---: | :---: | :---: |
| ID | Tipo | Descrição | Prioridade | Esforço Est. | Status |
| :---: | :---: | :--- | :---: | :---: | :---: |
| **BUG-01** | 🐛 Bugfix | [Corrigir violação de Hooks do React no ModalPreviewEscalaSemanal](#bug-01--correção-de-hooks-no-modalpreviewescalasemanal) | 🔴 Alta | 15 min | ✅ Concluído |
| **FEAT-07**| ✨ Melhoria | [Cálculo da Virada de Mês ancorado na última faxina com linha amarela informativa](#feat-07--cálculo-de-virada-de-mês-ancorado-na-última-faxina) | 🔴 Alta | 30 min | ✅ Concluído |
| **PWA-02** | 📱 PWA | [Criar manifest.json e suporte PWA completo para celular](#pwa-02--manifestjson-e-instalação-pwa-no-celular) | 🟡 Média | 30 min | 📝 A Fazer |
| **PERF-03**| ⚡ Otimização | [Code-Splitting e Lazy Loading do ExcelJS (reduzir bundle de 2MB)](#perf-03--code-splitting--lazy-loading-do-exceljs) | 🟡 Média | 30 min | 📝 A Fazer |
| **SEC-04** | 🔒 Segurança | [Proteção e hash de senhas / migração de autenticação](#sec-04--segurança-e-autenticação-reforçada) | 🟡 Média | 1 hora | 📝 A Fazer |
| **CLEAN-05**| 🧹 Refatoração| [Limpeza de imports e variáveis não utilizadas (Oxlint)](#clean-05--limpeza-de-código-e-imports-inúteis) | 🟢 Baixa | 45 min | 📝 A Fazer |
| **TEST-06**| 🧪 Testes | [Testes unitários para regras de cálculo e inadimplência](#test-06--testes-unitários-para-regras-críticas) | 🟢 Baixa | 1 hora | 📝 A Fazer |

---

## 📌 Detalhamento dos Itens

### BUG-01 — Correção de Hooks no `ModalPreviewEscalaSemanal`
* **Arquivo:** [`src/components/ModalPreviewEscalaSemanal.jsx`](./src/components/ModalPreviewEscalaSemanal.jsx)
* **Severidade:** 🔴 Alta (Violação do *Rules of Hooks* do React 19)
* **Status:** ✅ Concluído em 20/09/2026.
* **Problema:** 
  O componente possuía um retorno antecipado condicional (`if (!isOpen || !ajudante) return null;`) na linha 14, **antes** das declarações de `useState` e `useEffect`.
* **Critérios de Aceite:**
  - [x] Mover todos os hooks (`useState`, `useEffect`) para o topo absoluto do componente.
  - [x] Aplicar o retorno condicional (`if (!isOpen || !ajudante) return null;`) após os hooks.
  - [x] Validar com `npx oxlint` e confirmar 0 erros de hooks.

---

### FEAT-07 — Cálculo de Virada de Mês Ancorado na Última Faxina
* **Arquivos:** [`src/utils/recurrence.js`](./src/utils/recurrence.js), [`src/components/ModalViradaMes.jsx`](./src/components/ModalViradaMes.jsx)
* **Severidade:** 🔴 Alta (Precisão de escala do cliente final)
* **Status:** ✅ Concluído em 20/09/2026.
* **Problema:** 
  A virada de mês calculava as datas quinzenais e mensais a partir do início do mês (índices 0 e 2), gerando agendamentos já no primeiro dia do mês mesmo quando a última faxina ocorreu no fim do mês anterior (ex: caso Mayara Filha Miriam).
* **Critérios de Aceite:**
  - [x] Ancorar a projeção da cadência quinzenal estritamente em +14 dias e semanal em +7 dias após a data da última faxina do mês anterior.
  - [x] Inserir linha em amarelo de destaque exibindo a data e o status da última limpeza (Efetuada/Concluída ou Agendada/Pendente).
  - [x] Exibir detalhes da cadência na tela de aprovação da virada de mês.

---

### PWA-02 — Manifest.json e Instalação PWA no Celular
* **Arquivos:** [`public/manifest.json`](./public/manifest.json), [`index.html`](./index.html)
* **Severidade:** 🟡 Média (Experiência mobile da usuária)
* **Problema:** 
  O app já conta com meta tags para iPhone e Android, mas não possui um `manifest.json` com `theme_color`, `background_color`, `display: standalone` e mapeamento formal de ícones (`favicon.png`, `logo.jpg`).
* **Critérios de Aceite:**
  - [ ] Criar arquivo `public/manifest.json` estruturado no padrão W3C Web App Manifest.
  - [ ] Vincular `<link rel="manifest" href="/manifest.json" />` no `index.html`.
  - [ ] Garantir abertura sem barra de navegador do Safari/Chrome quando adicionado à tela inicial.

---

### PERF-03 — Code-Splitting & Lazy Loading do ExcelJS
* **Arquivos:** [`src/utils/exportExcel.js`](./src/utils/exportExcel.js), [`vite.config.js`](./vite.config.js)
* **Severidade:** 🟡 Média (Performance em 3G/4G móvel)
* **Problema:** 
  O bundle compilado de produção (`index-*.js`) atinge **2.04 MB** porque a biblioteca `exceljs` (~1 MB) está sendo importada estaticamente na inicialização do aplicativo, mesmo que o usuário só utilize exportação esporadicamente.
* **Critérios de Aceite:**
  - [ ] Transformar `import ExcelJS from 'exceljs'` em importação dinâmica (`const ExcelJS = (await import('exceljs')).default`).
  - [ ] Configurar divisão de chunks no `vite.config.js` (`manualChunks` para vendor e exceljs).
  - [ ] Reduzir o bundle principal inicial para menos de 600 kB.

---

### SEC-04 — Segurança e Autenticação Reforçada
* **Arquivos:** [`src/context/AppContext.jsx`](./src/context/AppContext.jsx), [`src/views/LoginView.jsx`](./src/views/LoginView.jsx)
* **Severidade:** 🟡 Média
* **Problema:** 
  As senhas dos usuários do sistema estão salvas em texto puro no `localStorage` e na coleção `usuarios` do Firestore.
* **Critérios de Aceite:**
  - [ ] Aplicar hash (ex: SHA-256 via Web Crypto API nativa do navegador sem dependências extras) antes de persistir e comparar senhas.
  - [ ] Revisar regras de segurança do Firestore (`firestore.rules`) para proteger a coleção de usuários.

---

### CLEAN-05 — Limpeza de Código e Imports Inúteis
* **Arquivos:** [`src/components/CalendarView.jsx`](./src/components/CalendarView.jsx), [`src/components/ModalAgendamento.jsx`](./src/components/ModalAgendamento.jsx), etc.
* **Severidade:** 🟢 Baixa
* **Problema:** 
  O Oxlint apontou cerca de 160 advertências de ícones, variáveis e parâmetros capturados em `catch` que não são utilizados.
* **Critérios de Aceite:**
  - [ ] Remover imports não utilizados de `lucide-react`.
  - [ ] Corrigir dependências exaustivas nos `useEffect` apontadas pelo linter.
  - [ ] Rodar `npm run lint` e reduzir as advertências.

---

### TEST-06 — Testes Unitários para Regras Críticas
* **Arquivos:** `src/utils/__tests__/inadimplencia.test.js`, `src/utils/__tests__/conflicts.test.js`
* **Severidade:** 🟢 Baixa
* **Problema:** 
  As regras de negócio para cálculo de inadimplência, conflitos de agenda de ajudantes e acréscimo de quartos não possuem testes unitários automatizados.
* **Critérios de Aceite:**
  - [ ] Configurar Vitest (integrado com o Vite).
  - [ ] Cobrir cenários de sobreposição de horários de faxinas da mesma ajudante.
  - [ ] Cobrir cálculo de status de inadimplência e tolerância de dias.

---

*Última atualização: 20/09/2026.*
