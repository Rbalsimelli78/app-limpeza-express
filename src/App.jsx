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

import { ModalAgendamento } from './components/ModalAgendamento';
import { ModalCliente } from './components/ModalCliente';
import { ModalAjudante } from './components/ModalAjudante';

const MainAppContent = () => {
  const { activeTab, setActiveTab, addCliente } = useApp();

  // Estados dos Modais
  const [modalAgendamentoOpen, setModalAgendamentoOpen] = useState(false);
  const [agendamentoEdicao, setAgendamentoEdicao] = useState(null);

  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [clienteEdicao, setClienteEdicao] = useState(null);

  const [modalAjudanteOpen, setModalAjudanteOpen] = useState(false);
  const [ajudanteEdicao, setAjudanteEdicao] = useState(null);

  // Ações de Agendamento
  const handleNovoAgendamento = () => {
    setAgendamentoEdicao(null);
    setModalAgendamentoOpen(true);
  };

  const handleEditarAgendamento = (ag) => {
    setAgendamentoEdicao(ag);
    setModalAgendamentoOpen(true);
  };

  const handleAgendarParaCliente = (cliente) => {
    setAgendamentoEdicao({
      clienteId: cliente.id,
      planoId: cliente.planoPadraoId || 'plano-quinzenal',
      dormitorios: cliente.dormitorios || 2,
      semManutencao2Meses: false,
      valorCliente: 190
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

    setAgendamentoEdicao({
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
        </main>
      </div>

      {/* Barra de Navegação Inferior Mobile */}
      <BottomNav />

      {/* Modais Globais */}
      <ModalAgendamento 
        isOpen={modalAgendamentoOpen} 
        onClose={() => setModalAgendamentoOpen(false)}
        agendamentoEdicao={agendamentoEdicao}
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
