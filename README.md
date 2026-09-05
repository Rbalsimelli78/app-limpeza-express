# 🧹 Limpeza Express SP — Sistema de Gestão & Agendamentos

Sistema completo de Gestão Operacional, Agendamentos, Equipe e Fluxo de Caixa desenvolvido sob medida para a **Limpeza Express SP** (especializada em apartamentos de 80 a 100m² em São Paulo).

![Banner Limpeza Express SP](/public/banner.jpg)

---

## 🌟 Principais Recursos do Sistema

* ☁️ **Sincronização em Tempo Real (Google Firebase Cloud Firestore)**: Computador e celular 100% sincronizados instantaneamente.
* 📅 **Calendário Operacional Interativo**: Visualização mensal com quantidade de clientes por dia, preview de faturamento e tela de detalhes por dia com agenda completa e ajudantes escaladas.
* 👥 **Controle de Ajudantes & Diárias**: Cadastro com chave PIX em destaque, botão de copiar em 1 clique e envio automático de escala no WhatsApp.
* 📦 **Catálogo & Gestão de Planos**: Cadastro de pacotes (Semanal, Quinzenal, Mensal) com envio de proposta completa dos 9 serviços inclusos no WhatsApp.
* 📊 **Extratos Financeiros com Gráficos SVG**: Gráficos de linha interativos dia a dia para clientes e colaboradoras, com exportação para Excel (.csv) e recibo em WhatsApp/PDF.
* 💰 **Fluxo de Caixa & Margem Líquida**: Cálculo automático de lucro realizado (caixa líquido), lucro projetado e margem real do negócio.
* 🔐 **Segurança & Login com Senha**: Proteção de acesso com tela de login, memorização no aparelho e painel de troca de senha.
* 📱 **PWA (Progressive Web App)**: Funciona como aplicativo nativo no iPhone e Android sem precisar de lojas de app.
* 🌐 **Offline-First**: Funciona mesmo se a internet oscilar ou cair temporariamente.

---

## 📖 Documentação Técnica Completa

Para detalhes aprofundados sobre arquitetura, modelagem de banco de dados, dicionário de dados, boas práticas e rotinas de manutenção, consulte o arquivo oficial:

👉 **[DOCUMENTACAO.md](./DOCUMENTACAO.md)**

---

## 🚀 Como Executar Localmente no Computador

1. Abra a pasta do projeto no terminal:
   ```powershell
   cd C:\Users\ACER\.gemini\antigravity-ide\scratch\limpeza-express-sp
   ```
2. Instale as dependências:
   ```powershell
   npm install
   ```
3. Inicie o servidor:
   ```powershell
   npm run dev
   ```
4. Acesse no navegador: `http://localhost:5173/`

---

## ☁️ Publicação & Hospedagem

* **Repositório GitHub**: `https://github.com/Rbalsimelli78/app-limpeza-express`
* **Hospedagem em Produção**: `https://app-limpeza-express.vercel.app/`
* **Deploy Automático**: A cada `git push origin main`, a Vercel compila e atualiza o aplicativo em produção automaticamente.

---

## 📱 Instalação no Celular da Esposa (PWA)

* **No iPhone (Safari)**: Abra `https://app-limpeza-express.vercel.app/`, toque no ícone de **Compartilhar** (quadrado com seta para cima) e selecione **"Adicionar à Tela de Início"**.
* **No Android (Chrome)**: Abra o link, toque nos **3 pontinhos** no canto superior direito e selecione **"Instalar Aplicativo"** ou **"Adicionar à tela inicial"**.
