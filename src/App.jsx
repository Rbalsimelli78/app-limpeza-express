import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';

import { DashboardView } from './views/DashboardView';
import { AgendaView } from './views/AgendaView';
import { ClientesView } from './views/ClientesView';
import { AjudantesView } from './views/AjudantesView';
import { OrcamentoView } from './views/OrcamentoView';
import { FinanceiroView } from './views/FinanceiroView';
import { ConfigView } from './views/ConfigView';
import { PlanosView } from './views/PlanosView';
import { LoginView } from './views/LoginView';

import { ModalAgendamento } from './components/ModalAgendamento';
import { ModalCliente } from './components/ModalCliente';
import { ModalAjudante } from './components/ModalAjudante';
import { ModalPlano } from './components/ModalPlano';
import { ErrorBoundary } from './components/ErrorBoundary';

const MainAppContent = () => {
  const { activeTab, setActiveTab, addCliente, isAuthenticated, planos, regras } = useApp();

  // Estados dos Modais
  const [modalAgendamentoOpen, setModalAgendamentoOpen] = useState(false);
  const [agendamentoEdicao, setAgendamentoEdicao] = useState(null);
  const [dadosIniciaisAgendamento, setDadosIniciaisAgendamento] = useState(null);

  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [clienteEdicao, setClienteEdicao] = useState(null);

  const [modalAjudanteOpen, setModalAjudanteOpen] = useState(false);
  const [ajudanteEdicao, setAjudanteEdicao] = useState(null);

  const [modalPlanoOpen, setModalPlanoOpen] = useState(false);
  const [planoEdicao, setPlanoEdicao] = useState(null);

  // Ações de Agendamento
  const handleNovoAgendamento = (dadosIniciais = null) => {
    setAgendamentoEdicao(null);
    setDadosIniciaisAgendamento(dadosIniciais);
    setModalAgendamentoOpen(true);
  };

  const handleEditarAgendamento = (ag) => {
    setDadosIniciaisAgendamento(null);
    setAgendamentoEdicao(ag);
    setModalAgendamentoOpen(true);
  };

  const handleAgendarParaCliente = (cliente) => {
    setAgendamentoEdicao(null);

    // Prioriza o valor fechado acordado com o cliente
    let valor = 190;
    if (cliente.valorFechado !== null && cliente.valorFechado !== undefined && Number(cliente.valorFechado) > 0) {
      valor = Number(cliente.valorFechado);
    } else {
      const pId = cliente.planoPadraoId || 'plano-quinzenal';
      const plano = planos.find(p => p.id === pId) || planos[0];
      valor = plano ? plano.valorBase : 190;
      const dorms = cliente.dormitorios || 2;
      if (dorms > 2 && pId !== 'plano-customizado' && pId !== 'plano-comercial-pj') {
        valor += (dorms - 2) * (regras?.acrescimoPorQuartoExtra || 30);
      }
    }

    setDadosIniciaisAgendamento({
      clienteId: cliente.id,
      planoId: cliente.planoPadraoId || 'plano-quinzenal',
      dormitorios: cliente.dormitorios || 2,
      semManutencao2Meses: false,
      valorCliente: valor
    });
    setModalAgendamentoOpen(true);
  };

  const handleAgendarComDadosOrcamento = (dados) => {
    // Se cliente tiver nome mas não estiver cadastrado, cadastra rápido
    let targetClienteId = '';
    if (dados.clienteNome) {
      const novoCli = addCliente({
        nome: dados.clienteNome,
        telefone: dados.telefone,
        endereco: dados.endereco,
        apartamento: '',
        bairro: 'São Paulo',
        dormitorios: dados.dormitorios,
        planoPadraoId: dados.planoId,
        observacoes: 'Cadastrado automaticamente via Calculadora de Propostas'
      });
      targetClienteId = novoCli.id;
    }

    setAgendamentoEdicao(null);
    setDadosIniciaisAgendamento({
      clienteId: targetClienteId,
      planoId: dados.planoId,
      dormitorios: dados.dormitorios,
      semManutencao2Meses: dados.semManutencao,
      valorCliente: dados.valorFinal
    });
    setModalAgendamentoOpen(true);
  };

  // Ações de Cliente
  const handleNovoCliente = () => {
    setClienteEdicao(null);
    setModalClienteOpen(true);
  };

  const handleEditarCliente = (cli) => {
    setClienteEdicao(cli);
    setModalClienteOpen(true);
  };

  // Ações de Ajudante
  const handleNovaAjudante = () => {
    setAjudanteEdicao(null);
    setModalAjudanteOpen(true);
  };

  const handleEditarAjudante = (aj) => {
    setAjudanteEdicao(aj);
    setModalAjudanteOpen(true);
  };

  // Ações de Planos
  const handleNovoPlano = () => {
    setPlanoEdicao(null);
    setModalPlanoOpen(true);
  };

  const handleEditarPlano = (plano) => {
    setPlanoEdicao(plano);
    setModalPlanoOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <>
        <Toast />
        <LoginView />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Barra de Notificações Toast */}
      <Toast />

      {/* Navegação Lateral Desktop */}
      <Sidebar />

      {/* Conteúdo Principal */}
      <div className="main-content">
        <Header onOpenNovoAgendamento={handleNovoAgendamento} />

        <main>
          <ErrorBoundary key={activeTab}>
            {activeTab === 'dashboard' && (
              <DashboardView 
                onNovoAgendamento={handleNovoAgendamento}
                onEditarAgendamento={handleEditarAgendamento}
              />
            )}

            {activeTab === 'agenda' && (
              <AgendaView 
                onNovoAgendamento={handleNovoAgendamento}
                onEditarAgendamento={handleEditarAgendamento}
              />
            )}

            {activeTab === 'clientes' && (
              <ClientesView 
                onNovoCliente={handleNovoCliente}
                onEditarCliente={handleEditarCliente}
                onAgendarParaCliente={handleAgendarParaCliente}
              />
            )}

            {activeTab === 'ajudantes' && (
              <AjudantesView 
                onNovaAjudante={handleNovaAjudante}
                onEditarAjudante={handleEditarAjudante}
              />
            )}

            {activeTab === 'planos' && (
              <PlanosView 
                onNovoPlano={handleNovoPlano}
                onEditarPlano={handleEditarPlano}
              />
            )}

            {activeTab === 'orcamento' && (
              <OrcamentoView 
                onAgendarComDados={handleAgendarComDadosOrcamento}
              />
            )}

            {activeTab === 'financeiro' && (
              <FinanceiroView />
            )}

            {activeTab === 'config' && (
              <ConfigView />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Barra de Navegação Inferior Mobile */}
      <BottomNav />

      {/* Modais Globais */}
      <ModalAgendamento 
        isOpen={modalAgendamentoOpen} 
        onClose={() => {
          setModalAgendamentoOpen(false);
          setAgendamentoEdicao(null);
          setDadosIniciaisAgendamento(null);
        }}
        agendamentoEdicao={agendamentoEdicao}
        dadosIniciais={dadosIniciaisAgendamento}
      />

      <ModalCliente 
        isOpen={modalClienteOpen} 
        onClose={() => setModalClienteOpen(false)}
        clienteEdicao={clienteEdicao}
      />

      <ModalAjudante 
        isOpen={modalAjudanteOpen} 
        onClose={() => setModalAjudanteOpen(false)}
        ajudanteEdicao={ajudanteEdicao}
      />

      <ModalPlano 
        isOpen={modalPlanoOpen} 
        onClose={() => setModalPlanoOpen(false)}
        planoEdicao={planoEdicao}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
