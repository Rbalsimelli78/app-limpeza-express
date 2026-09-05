# 🧹 Limpeza Express SP - Sistema de Gestão & Agendamentos

Sistema completo de Gestão Operacional, Financeira e Agendamentos desenvolvido sob medida para a **Limpeza Express SP** (especializada em apartamentos de 80 a 100m² em São Paulo).

![Banner Limpeza Express SP](/public/banner.jpg)

---

## 🌟 Principais Funcionalidades

### 1. 📊 Painel Geral (Dashboard)
- Indicadores em tempo real:
  - **Lucro Líquido Realizado (Caixa)** e Lucro Total Projetado.
  - **Total Recebido** dos clientes e valores pendentes a receber.
  - **Valores a Pagar às Ajudantes** com controle de pendências.
  - Faxinas da semana e clientes ativos.
- Lista das próximas faxinas com identificação visual do dia (Hoje!), plano contratado e equipe escalada.

### 2. 📅 Agenda & Sincronização com Google Agenda (Google Calendar)
- **Botão "Google Agenda" em 1 clique:** Abre o Google Calendar já preenchido com título, endereço do condomínio/apartamento, horário de início e término (duração padrão de 4h), equipe de ajudantes escaladas e valor.
- **Exportação de Arquivo `.ICS`:** Compatível com iPhone (Apple Calendar), Android, Google Agenda e Outlook.
- Filtros por status: Confirmado, Agendado, Concluído e Cancelado.

### 3. 👥 Controle de Ajudantes / Diaristas & Pagamentos
- Cadastro das ajudantes com tipo de remuneração:
  - **Por Diária Fechada** (ex: R$ 90,00/dia)
  - **Por Hora Trabalhada** (ex: R$ 25,00/hora)
- **Chave PIX em destaque** com botão de **"Copiar PIX"** em 1 clique para colar no aplicativo do banco.
- Botão **"Pagar"** para liquidar a diária após o serviço.
- Botão **"Escala"** que gera mensagem formatada no WhatsApp da ajudante com data, horário, endereço do cliente, link no Google Maps e valor da diária dela.

### 4. 📱 Calculadora de Orçamentos & Propostas WhatsApp
- Baseada no **Catálogo Oficial da Limpeza Express SP**:
  - **Plano Semanal:** R$ 170,00 (2 dormitórios, 3 a 5 horas, 2 profissionais).
  - **Plano Quinzenal:** R$ 190,00 (2 dormitórios, 3 a 5 horas, 2 profissionais).
  - **Plano Mensal:** R$ 200,00 (2 dormitórios, 3 a 5 horas, 2 profissionais).
- **Acréscimos Automáticos:**
  - 3º dormitório: **+ R$ 30,00**
  - Apartamento sem manutenção há mais de 2 meses: **+ R$ 50,00**
- **Regra de Cancelamento:** Aviso de aviso prévio de 48h ou cobrança de taxa de 50%.
- **Lista dos 9 Serviços Inclusos:** Varrer/pano piso, móveis/eletrônicos, cozinha, banheiro, quarto, janelas, varanda, lixo e organização diária.
- **Botão "Enviar no WhatsApp":** Abre a conversa com o cliente já com todo o texto formatado para fechar a faxina.

### 5. 💰 Fluxo de Caixa & Lucro Líquido
- Extrato de todas as entradas (clientes) e saídas (ajudantes).
- Cálculo da **Margem Líquida Real** do negócio.
- Liquidação de valores recebidos e pagos com 1 clique.

### 6. 📱 Como Usar como Aplicativo no Celular da Esposa (PWA)
O sistema funciona direto no navegador e pode ser instalado como app sem precisar de lojas:
- **No iPhone (Safari):** Abra o link, clique no botão de **Compartilhar** e toque em **"Adicionar à Tela de Início"**.
- **No Android (Chrome):** Abra o link, toque nos **3 pontinhos** e escolha **"Instalar Aplicativo"** ou **"Adicionar à tela inicial"**.

---

## 🚀 Como Executar Localmente no Computador

1. Abra a pasta do projeto:
```bash
cd C:\Users\ACER\.gemini\antigravity-ide\scratch\limpeza-express-sp
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm run dev
```

4. Acesse no navegador:
`http://localhost:5173/`

---

## ☁️ Como Publicar no GitHub e na Vercel (100% Gratuito)

### Passo 1: Subir para o seu GitHub
1. Crie um novo repositório no [GitHub](https://github.com/new) chamado `limpeza-express-sp`.
2. No terminal da pasta, execute:
```bash
git init
git add .
git commit -m "Sistema Limpeza Express SP v1.0"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/limpeza-express-sp.git
git push -u origin main
```

### Passo 2: Publicar na Vercel
1. Acesse [vercel.com](https://vercel.com) e entre com sua conta do GitHub.
2. Clique em **"Add New Project"** e selecione o repositório `limpeza-express-sp`.
3. Clique em **"Deploy"**.
4. Em menos de 1 minuto seu link seguro `https://limpeza-express-sp.vercel.app` estará no ar!

---

## 🛠️ Tecnologias Utilizadas
- **React 19** com **Vite**
- **Vanilla CSS** com Design System elegante (Dark Mode e Light Mode)
- **Lucide Icons** para ícones modernos
- **Google Calendar URL Generator** & **iCal (.ICS)**
- **WhatsApp Direct API (`wa.me`)**
- **LocalStorage seguro com Backup/Restore JSON**
