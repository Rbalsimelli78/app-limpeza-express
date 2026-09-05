import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  CLIENTES_INICIAIS, 
  AJUDANTES_INICIAIS, 
  AGENDAMENTOS_INICIAIS, 
  PLANOS_CATALOGO, 
  REGRAS_ADICIONAIS, 
  CHECKLIST_PADRAO 
} from '../data/initialData';
import {
  listenClientes,
  listenAjudantes,
  listenAgendamentos,
  listenPlanos,
  salvarClienteNuvem,
  excluirClienteNuvem,
  salvarAjudanteNuvem,
  excluirAjudanteNuvem,
  salvarAgendamentoNuvem,
  excluirAgendamentoNuvem,
  salvarPlanoNuvem,
  excluirPlanoNuvem,
  subirBaseParaNuvem,
  limparColecaoNuvem
} from '../services/cloudSync';

const AppContext = createContext();

const STORAGE_KEY = 'limpeza_express_sp_v1';
const THEME_KEY = 'limpeza_express_theme';
const AUTH_CREDS_KEY = 'limpeza_express_auth_creds';
const AUTH_SESSION_KEY = 'limpeza_express_session';
const AUTH_PERSISTENT_KEY = 'limpeza_express_persistent_session';

const CREDENCIAIS_PADRAO = {
  username: 'admin',
  password: '123456',
  name: 'Administradora'
};

export const AppProvider = ({ children }) => {
  // Credenciais de Acesso (Salvas em localStorage)
  const [authCredentials, setAuthCredentials] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_CREDS_KEY);
      return saved ? JSON.parse(saved) : CREDENCIAIS_PADRAO;
    } catch (e) {
      return CREDENCIAIS_PADRAO;
    }
  });

  // Sessão de Autenticação Ativa
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const persistent = localStorage.getItem(AUTH_PERSISTENT_KEY);
      if (persistent) return JSON.parse(persistent);
      const session = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (session) return JSON.parse(session);
      return null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return currentUser !== null;
  });

  // Salvar credenciais no localStorage sempre que alteradas
  useEffect(() => {
    localStorage.setItem(AUTH_CREDS_KEY, JSON.stringify(authCredentials));
  }, [authCredentials]);

  // Tema (Dark / Light)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'dark';
  });

  // Aba Ativa
  const [activeTab, setActiveTab] = useState('dashboard');

  // Notificações Toast
  const [toasts, setToasts] = useState([]);

  // Status da Nuvem Firebase ('conectando' | 'sincronizado' | 'offline')
  const [cloudStatus, setCloudStatus] = useState('conectando');
  const [cloudLastSync, setCloudLastSync] = useState(null);
  const initialUploadDoneRef = React.useRef(false);

  // Estado dos Dados
  const [clientes, setClientes] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_clientes`);
      return saved ? JSON.parse(saved) : CLIENTES_INICIAIS;
    } catch (e) {
      return CLIENTES_INICIAIS;
    }
  });

  const [ajudantes, setAjudantes] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_ajudantes`);
      return saved ? JSON.parse(saved) : AJUDANTES_INICIAIS;
    } catch (e) {
      return AJUDANTES_INICIAIS;
    }
  });

  const [agendamentos, setAgendamentos] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_agendamentos`);
      return saved ? JSON.parse(saved) : AGENDAMENTOS_INICIAIS;
    } catch (e) {
      return AGENDAMENTOS_INICIAIS;
    }
  });

  const [planos, setPlanos] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_planos`);
      return saved ? JSON.parse(saved) : PLANOS_CATALOGO;
    } catch (e) {
      return PLANOS_CATALOGO;
    }
  });

  // Persistência automática no localStorage (cache offline)
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_planos`, JSON.stringify(planos));
  }, [planos]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_clientes`, JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ajudantes`, JSON.stringify(ajudantes));
  }, [ajudantes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_agendamentos`, JSON.stringify(agendamentos));
  }, [agendamentos]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Função para Toast
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // =========================================================================
  // SINCRONIZAÇÃO EM TEMPO REAL COM GOOGLE FIREBASE CLOUD FIRESTORE
  // =========================================================================
  useEffect(() => {
    const unsubs = [];

    try {
      // 1. Escuta Clientes em Tempo Real (reflete adições, edições e exclusões)
      const unsubCli = listenClientes(
        (docs) => {
          setCloudStatus('sincronizado');
          setCloudLastSync(new Date());
          setClientes(docs);
        },
        (err) => {
          console.warn('[Cloud] Firestore offline ou ainda não iniciado:', err?.message);
          setCloudStatus('offline');
        }
      );
      unsubs.push(unsubCli);

      // 2. Escuta Ajudantes em Tempo Real
      const unsubAjud = listenAjudantes(
        (docs) => {
          setCloudStatus('sincronizado');
          setCloudLastSync(new Date());
          setAjudantes(docs);
        },
        (err) => setCloudStatus('offline')
      );
      unsubs.push(unsubAjud);

      // 3. Escuta Agendamentos em Tempo Real
      const unsubAgend = listenAgendamentos(
        (docs) => {
          setCloudStatus('sincronizado');
          setCloudLastSync(new Date());
          setAgendamentos(docs);
        },
        (err) => setCloudStatus('offline')
      );
      unsubs.push(unsubAgend);

      // 4. Escuta Planos em Tempo Real
      const unsubPlanos = listenPlanos(
        (docs) => {
          setCloudStatus('sincronizado');
          setCloudLastSync(new Date());
          if (docs && docs.length > 0) {
            setPlanos(docs);
          }
        },
        (err) => setCloudStatus('offline')
      );
      unsubs.push(unsubPlanos);

    } catch (e) {
      console.warn('[Cloud] Erro ao iniciar sincronização:', e);
      setCloudStatus('offline');
    }

    return () => {
      unsubs.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, []);

  // Forçar Sincronização Completa com a Nuvem
  const forcarSincronizacaoNuvem = async () => {
    showToast('Sincronizando dados com a nuvem...', 'info');
    const ok = await subirBaseParaNuvem({ clientes, ajudantes, agendamentos, planos });
    if (ok) {
      setCloudStatus('sincronizado');
      setCloudLastSync(new Date());
      showToast('☁️ Nuvem 100% atualizada em tempo real!', 'success');
    } else {
      setCloudStatus('offline');
      showToast('Não foi possível conectar ao Firebase. Verifique sua conexão.', 'danger');
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Funções de Clientes com Sincronização em Nuvem
  const addCliente = (clienteData) => {
    const novo = {
      ...clienteData,
      id: `cli-${Date.now()}`,
      criadoEm: new Date().toISOString().split('T')[0]
    };
    setClientes(prev => [novo, ...prev]);
    salvarClienteNuvem(novo);
    showToast(`Cliente ${novo.nome} cadastrado com sucesso!`);
    return novo;
  };

  const updateCliente = (id, clienteData) => {
    let atualizado = null;
    setClientes(prev => prev.map(c => {
      if (c.id === id) {
        atualizado = { ...c, ...clienteData };
        return atualizado;
      }
      return c;
    }));
    if (atualizado) salvarClienteNuvem(atualizado);
    showToast('Dados do cliente atualizados!');
  };

  const deleteCliente = (id) => {
    setClientes(prev => prev.filter(c => c.id !== id));
    excluirClienteNuvem(id);
    showToast('Cliente removido.');
  };

  // Funções de Ajudantes com Sincronização em Nuvem
  const addAjudante = (ajudanteData) => {
    const nova = {
      ...ajudanteData,
      id: `ajud-${Date.now()}`
    };
    setAjudantes(prev => [...prev, nova]);
    salvarAjudanteNuvem(nova);
    showToast(`Ajudante ${nova.nome} cadastrada!`);
    return nova;
  };

  const updateAjudante = (id, ajudanteData) => {
    let atualizada = null;
    setAjudantes(prev => prev.map(a => {
      if (a.id === id) {
        atualizada = { ...a, ...ajudanteData };
        return atualizada;
      }
      return a;
    }));
    if (atualizada) salvarAjudanteNuvem(atualizada);
    showToast('Dados da colaboradora atualizados!');
  };

  const deleteAjudante = (id) => {
    setAjudantes(prev => prev.filter(a => a.id !== id));
    excluirAjudanteNuvem(id);
    showToast('Colaboradora removida.');
  };

  // Funções de Planos de Limpeza com Sincronização em Nuvem
  const addPlano = (planoData) => {
    const novo = {
      ...planoData,
      id: `plano-${Date.now()}`
    };
    setPlanos(prev => [...prev, novo]);
    salvarPlanoNuvem(novo);
    showToast(`Plano "${novo.nome}" cadastrado com sucesso!`);
    return novo;
  };

  const updatePlano = (id, planoData) => {
    let atualizado = null;
    setPlanos(prev => prev.map(p => {
      if (p.id === id) {
        atualizado = { ...p, ...planoData };
        return atualizado;
      }
      return p;
    }));
    if (atualizado) salvarPlanoNuvem(atualizado);
    showToast('Plano de limpeza atualizado!');
  };

  const deletePlano = (id) => {
    setPlanos(prev => prev.filter(p => p.id !== id));
    excluirPlanoNuvem(id);
    showToast('Plano de limpeza excluído.');
  };

  const resetPlanosPadrao = () => {
    setPlanos(PLANOS_CATALOGO);
    localStorage.setItem(`${STORAGE_KEY}_planos`, JSON.stringify(PLANOS_CATALOGO));
    PLANOS_CATALOGO.forEach(p => salvarPlanoNuvem(p));
    showToast('Planos restaurados para o catálogo oficial Limpeza Express SP!');
  };

  // Funções de Agendamentos com Sincronização em Nuvem
  const addAgendamento = (agendamentoData) => {
    const novo = {
      ...agendamentoData,
      id: `agend-${Date.now()}`
    };
    setAgendamentos(prev => [novo, ...prev]);
    salvarAgendamentoNuvem(novo);
    showToast('Faxina agendada com sucesso!');
    return novo;
  };

  const updateAgendamento = (id, agendamentoData) => {
    let atualizado = null;
    setAgendamentos(prev => prev.map(a => {
      if (a.id === id) {
        atualizado = { ...a, ...agendamentoData };
        return atualizado;
      }
      return a;
    }));
    if (atualizado) salvarAgendamentoNuvem(atualizado);
    showToast('Agendamento atualizado!');
  };

  const deleteAgendamento = (id) => {
    setAgendamentos(prev => prev.filter(a => a.id !== id));
    excluirAgendamentoNuvem(id);
    showToast('Agendamento excluído.');
  };

  // Atalhos Rápidos de Status com Gravação na Nuvem
  const setStatusServico = (id, statusServico) => {
    let atualizado = null;
    setAgendamentos(prev => prev.map(a => {
      if (a.id === id) {
        atualizado = { ...a, statusServico };
        return atualizado;
      }
      return a;
    }));
    if (atualizado) salvarAgendamentoNuvem(atualizado);
    showToast(`Status alterado para "${statusServico}"!`);
  };

  const setStatusPagamentoCliente = (id, statusClientePagamento) => {
    let atualizado = null;
    setAgendamentos(prev => prev.map(a => {
      if (a.id === id) {
        atualizado = { ...a, statusClientePagamento };
        return atualizado;
      }
      return a;
    }));
    if (atualizado) salvarAgendamentoNuvem(atualizado);
    showToast(`Pagamento do cliente marcado como "${statusClientePagamento}"!`);
  };

  const setStatusPagamentoAjudante = (agendamentoId, ajudanteId, statusPagamento) => {
    let atualizado = null;
    setAgendamentos(prev => prev.map(ag => {
      if (ag.id !== agendamentoId) return ag;
      const novasEscaladas = (ag.ajudantesEscaladas || []).map(ae => {
        if (ae.ajudanteId === ajudanteId) {
          return { ...ae, statusPagamento };
        }
        return ae;
      });
      atualizado = { ...ag, ajudantesEscaladas: novasEscaladas };
      return atualizado;
    }));
    if (atualizado) salvarAgendamentoNuvem(atualizado);
    showToast('Pagamento da ajudante atualizado!');
  };

  // Cálculos Financeiros Dinâmicos
  const getFinanceiroGeral = () => {
    let totalRecebido = 0;
    let totalAReceber = 0;
    let totalPagoAjudantes = 0;
    let totalAPagarAjudantes = 0;

    agendamentos.forEach(ag => {
      const valCliente = Number(ag.valorCliente || 0);
      if (ag.statusClientePagamento === 'pago') {
        totalRecebido += valCliente;
      } else if (ag.statusClientePagamento === 'pendente') {
        totalAReceber += valCliente;
      }

      (ag.ajudantesEscaladas || []).forEach(ae => {
        const valAj = Number(ae.valorAPagar || 0);
        if (ae.statusPagamento === 'pago') {
          totalPagoAjudantes += valAj;
        } else {
          totalAPagarAjudantes += valAj;
        }
      });
    });

    const lucroRealizado = totalRecebido - totalPagoAjudantes;
    const lucroProjetado = (totalRecebido + totalAReceber) - (totalPagoAjudantes + totalAPagarAjudantes);

    return {
      totalRecebido,
      totalAReceber,
      totalPagoAjudantes,
      totalAPagarAjudantes,
      lucroRealizado,
      lucroProjetado
    };
  };

  // Exportar Backup JSON
  const exportBackup = () => {
    const backupData = {
      clientes,
      ajudantes,
      agendamentos,
      exportadoEm: new Date().toISOString(),
      versao: '1.0'
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `limpeza_express_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup exportado com sucesso!');
  };

  // Importar Backup JSON
  const importBackup = (jsonData) => {
    try {
      if (jsonData.clientes) setClientes(jsonData.clientes);
      if (jsonData.ajudantes) setAjudantes(jsonData.ajudantes);
      if (jsonData.agendamentos) setAgendamentos(jsonData.agendamentos);
      if (jsonData.planos) setPlanos(jsonData.planos);
      showToast('Backup restaurado com sucesso!');
    } catch (e) {
      showToast('Erro ao ler arquivo de backup.', 'danger');
    }
  };

  // Limpar Todos os Dados (Para Iniciar do Zero em Produção)
  const limparTodosOsDados = async () => {
    setClientes([]);
    setAjudantes([]);
    setAgendamentos([]);
    localStorage.setItem(`${STORAGE_KEY}_clientes`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_ajudantes`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_agendamentos`, JSON.stringify([]));
    await Promise.all([
      limparColecaoNuvem('clientes'),
      limparColecaoNuvem('ajudantes'),
      limparColecaoNuvem('agendamentos')
    ]);
    showToast('Base 100% limpa no celular, micro e na nuvem!', 'info');
  };

  // Limpar apenas as faxinas e histórico de caixa
  const limparApenasAgendamentos = async () => {
    setAgendamentos([]);
    localStorage.setItem(`${STORAGE_KEY}_agendamentos`, JSON.stringify([]));
    await limparColecaoNuvem('agendamentos');
    showToast('Agenda e financeiro zerados no micro e na nuvem!', 'info');
  };

  // --- MÓDULO DE AUTENTICAÇÃO E SEGURANÇA ---
  const login = (username, password, rememberMe = true) => {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanCredUser = (authCredentials.username || '').trim().toLowerCase();

    // Validação de usuário e senha
    const isUserValid = cleanUser === cleanCredUser;
    // Aceita a senha cadastrada ou "123" se a senha for "123456" para comodidade inicial
    const isPasswordValid = password === authCredentials.password || 
      (authCredentials.password === '123456' && password === '123');

    if (isUserValid && isPasswordValid) {
      const userData = {
        username: authCredentials.username,
        name: authCredentials.name || 'Administradora',
        loginAt: new Date().toISOString()
      };

      setIsAuthenticated(true);
      setCurrentUser(userData);

      if (rememberMe) {
        localStorage.setItem(AUTH_PERSISTENT_KEY, JSON.stringify(userData));
      } else {
        localStorage.removeItem(AUTH_PERSISTENT_KEY);
      }
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userData));

      showToast(`Bem-vinda, ${userData.name}!`, 'success');
      return { success: true };
    } else {
      showToast('Usuário ou senha incorretos!', 'danger');
      return { success: false, error: 'Usuário ou senha incorretos' };
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_PERSISTENT_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setIsAuthenticated(false);
    setCurrentUser(null);
    showToast('Sessão bloqueada com segurança.', 'info');
  };

  const updateCredentials = ({ currentPassword, newUsername, newPassword, newName }) => {
    // Validação da senha atual
    const isCurrentValid = currentPassword === authCredentials.password || 
      (authCredentials.password === '123456' && currentPassword === '123');

    if (!isCurrentValid) {
      showToast('Senha atual incorreta!', 'danger');
      return { success: false, error: 'Senha atual incorreta' };
    }

    if (!newUsername || newUsername.trim().length < 3) {
      showToast('O usuário deve ter pelo menos 3 caracteres.', 'danger');
      return { success: false, error: 'Usuário inválido' };
    }

    if (newPassword && newPassword.length < 4) {
      showToast('A nova senha deve ter pelo menos 4 caracteres.', 'danger');
      return { success: false, error: 'Senha curta' };
    }

    const updatedCreds = {
      username: newUsername.trim(),
      password: newPassword ? newPassword : authCredentials.password,
      name: newName && newName.trim() ? newName.trim() : (authCredentials.name || 'Administradora')
    };

    setAuthCredentials(updatedCreds);
    localStorage.setItem(AUTH_CREDS_KEY, JSON.stringify(updatedCreds));

    // Atualiza dados da sessão ativa
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        username: updatedCreds.username,
        name: updatedCreds.name
      };
      setCurrentUser(updatedUser);
      if (localStorage.getItem(AUTH_PERSISTENT_KEY)) {
        localStorage.setItem(AUTH_PERSISTENT_KEY, JSON.stringify(updatedUser));
      }
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedUser));
    }

    showToast('Credenciais atualizadas com sucesso!', 'success');
    return { success: true };
  };

  const resetCredentialsToDefault = () => {
    setAuthCredentials(CREDENCIAIS_PADRAO);
    localStorage.setItem(AUTH_CREDS_KEY, JSON.stringify(CREDENCIAIS_PADRAO));
    showToast('Credenciais redefinidas para o padrão: admin / 123456', 'info');
  };

  // Resetar para dados de demonstração
  const resetDemo = () => {
    setClientes(CLIENTES_INICIAIS);
    setAjudantes(AJUDANTES_INICIAIS);
    setAgendamentos(AGENDAMENTOS_INICIAIS);
    setPlanos(PLANOS_CATALOGO);
    subirBaseParaNuvem({
      clientes: CLIENTES_INICIAIS,
      ajudantes: AJUDANTES_INICIAIS,
      agendamentos: AGENDAMENTOS_INICIAIS,
      planos: PLANOS_CATALOGO
    });
    showToast('Dados de demonstração recarregados na nuvem!');
  };

  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,
      activeTab,
      setActiveTab,
      toasts,
      showToast,
      // Sincronização em Nuvem Firebase
      cloudStatus,
      cloudLastSync,
      forcarSincronizacaoNuvem,
      // Autenticação
      isAuthenticated,
      currentUser,
      authCredentials,
      login,
      logout,
      updateCredentials,
      resetCredentialsToDefault,
      // Dados
      clientes,
      ajudantes,
      agendamentos,
      planos,
      checklist: CHECKLIST_PADRAO,
      regras: REGRAS_ADICIONAIS,
      addCliente,
      updateCliente,
      deleteCliente,
      addAjudante,
      updateAjudante,
      deleteAjudante,
      addPlano,
      updatePlano,
      deletePlano,
      resetPlanosPadrao,
      addAgendamento,
      updateAgendamento,
      deleteAgendamento,
      setStatusServico,
      setStatusPagamentoCliente,
      setStatusPagamentoAjudante,
      getFinanceiroGeral,
      exportBackup,
      importBackup,
      resetDemo,
      limparTodosOsDados,
      limparApenasAgendamentos
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
