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
  listenUsuarios,
  salvarUsuarioNuvem,
  excluirUsuarioNuvem,
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
const STORAGE_USUARIOS_KEY = 'limpeza_express_sp_usuarios';
const AUTH_SESSION_KEY = 'limpeza_express_session';
const AUTH_PERSISTENT_KEY = 'limpeza_express_persistent_session';

const USUARIO_CLEUSA_PADRAO = {
  id: 'usr_cleusa',
  name: 'Cleusa Gabrielli',
  username: 'cleusa.gabrielli@gmail.com',
  password: '123',
  cargo: 'Proprietária & Administradora',
  ativo: true,
  criadoEm: new Date().toISOString()
};

export const AppProvider = ({ children }) => {
  // Lista de Usuários do Sistema (Sincronizada em Tempo Real com Firestore)
  const [usuarios, setUsuarios] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USUARIOS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const semAdmin = parsed.filter(u => u.username?.trim().toLowerCase() !== 'admin');
          if (semAdmin.length > 0) return semAdmin;
        }
      }
      // Migração de credenciais anteriores se já existirem
      const oldCreds = localStorage.getItem(AUTH_CREDS_KEY);
      if (oldCreds) {
        const parsedOld = JSON.parse(oldCreds);
        if (parsedOld.username && parsedOld.username.toLowerCase() !== 'admin') {
          return [{
            id: 'usr_cleusa',
            name: parsedOld.name || 'Cleusa Gabrielli',
            username: parsedOld.username.trim().toLowerCase(),
            password: parsedOld.password || '123',
            cargo: 'Proprietária & Administradora',
            ativo: true,
            criadoEm: new Date().toISOString()
          }];
        }
      }
      return [USUARIO_CLEUSA_PADRAO];
    } catch (e) {
      return [USUARIO_CLEUSA_PADRAO];
    }
  });

  // Salvar usuários no cache local para resiliência offline
  useEffect(() => {
    localStorage.setItem(STORAGE_USUARIOS_KEY, JSON.stringify(usuarios));
  }, [usuarios]);

  // Sessão de Autenticação Ativa (descarta qualquer sessão antiga de 'admin')
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const persistent = localStorage.getItem(AUTH_PERSISTENT_KEY);
      if (persistent) {
        const parsed = JSON.parse(persistent);
        if (parsed?.username?.toLowerCase() === 'admin') {
          localStorage.removeItem(AUTH_PERSISTENT_KEY);
        } else {
          return parsed;
        }
      }
      const session = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed?.username?.toLowerCase() === 'admin') {
          sessionStorage.removeItem(AUTH_SESSION_KEY);
        } else {
          return parsed;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return currentUser !== null;
  });

  // Credenciais ativas da usuária logada
  const authCredentials = {
    name: currentUser?.name || usuarios[0]?.name || 'Cleusa Gabrielli',
    username: currentUser?.username || usuarios[0]?.username || 'cleusa.gabrielli@gmail.com',
    password: usuarios.find(u => u.username === currentUser?.username)?.password || usuarios[0]?.password || '123'
  };

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

      // 5. Escuta Usuários do Sistema em Tempo Real
      const unsubUsuarios = listenUsuarios(
        async (docs, isEmpty) => {
          setCloudStatus('sincronizado');
          setCloudLastSync(new Date());

          if (isEmpty || !docs || docs.length === 0) {
            // Se a nuvem ainda não tiver usuários cadastrados, inicializa com o usuário da Cleusa
            const initialUser = usuarios[0] || USUARIO_CLEUSA_PADRAO;
            await salvarUsuarioNuvem(initialUser);
            setUsuarios([initialUser]);
          } else {
            // Remove qualquer resquício de 'admin' da nuvem se existir
            docs.forEach(d => {
              if (d.username?.trim().toLowerCase() === 'admin' || d.id === 'usr_admin') {
                excluirUsuarioNuvem(d.id);
              }
            });
            const validos = docs.filter(u => u.username?.trim().toLowerCase() !== 'admin');
            if (validos.length > 0) {
              setUsuarios(validos);
            } else {
              const initialUser = USUARIO_CLEUSA_PADRAO;
              await salvarUsuarioNuvem(initialUser);
              setUsuarios([initialUser]);
            }
          }
        },
        (err) => {
          console.warn('[Cloud] Erro ao escutar usuários na nuvem:', err?.message);
        }
      );
      unsubs.push(unsubUsuarios);

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

  // --- MÓDULO DE AUTENTICAÇÃO E SEGURANÇA (MULTIUSUÁRIO & NUVEM FIRESTORE) ---
  const login = (usernameInput, passwordInput, rememberMe = true) => {
    const cleanUser = (usernameInput || '').trim().toLowerCase();

    // Busca usuário ativo no array de usuários sincronizados com a nuvem
    const userFound = usuarios.find(u => 
      u.ativo !== false && 
      (u.username?.trim().toLowerCase() === cleanUser || u.email?.trim().toLowerCase() === cleanUser)
    );

    if (!userFound) {
      if (cleanUser === 'admin') {
        showToast('O usuário padrão "admin" foi desativado. Use o seu e-mail cadastrado (cleusa.gabrielli@gmail.com).', 'danger');
        return { success: false, error: 'O usuário "admin" foi desativado. Use seu e-mail cadastrado.' };
      }
      showToast('Usuário ou e-mail não cadastrado!', 'danger');
      return { success: false, error: 'Usuário ou e-mail não cadastrado.' };
    }

    // Validação exata da senha configurada para o usuário
    const isPasswordValid = passwordInput === userFound.password;

    if (!isPasswordValid) {
      showToast('Senha incorreta para este usuário!', 'danger');
      return { success: false, error: 'Senha incorreta para este usuário.' };
    }

    const userData = {
      id: userFound.id,
      username: userFound.username,
      name: userFound.name || userFound.nome || 'Cleusa Gabrielli',
      cargo: userFound.cargo || 'Proprietária & Administradora',
      loginAt: new Date().toISOString()
    };

    setIsAuthenticated(true);
    setCurrentUser(userData);

    // Salva o último login bem-sucedido para comodidade no dispositivo
    localStorage.setItem('limpeza_express_last_user', userFound.username);

    if (rememberMe) {
      localStorage.setItem(AUTH_PERSISTENT_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(AUTH_PERSISTENT_KEY);
    }
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userData));

    // Atualiza data do último acesso na nuvem
    salvarUsuarioNuvem({
      ...userFound,
      ultimoAcesso: new Date().toISOString()
    });

    showToast(`Bem-vinda, ${userData.name}!`, 'success');
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(AUTH_PERSISTENT_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setIsAuthenticated(false);
    setCurrentUser(null);
    showToast('Sessão bloqueada com segurança.', 'info');
  };

  // Gerenciamento de Usuários (Multi-usuário na Nuvem)
  const addUsuario = async ({ name, username, password, cargo = 'Operacional' }) => {
    const cleanUser = (username || '').trim().toLowerCase();
    if (!cleanUser || cleanUser.length < 3) {
      showToast('O usuário/e-mail deve ter pelo menos 3 caracteres.', 'danger');
      return { success: false, error: 'Usuário inválido' };
    }

    if (!password || password.length < 3) {
      showToast('A senha deve ter pelo menos 3 caracteres.', 'danger');
      return { success: false, error: 'Senha muito curta' };
    }

    const jaExiste = usuarios.some(u => u.username?.trim().toLowerCase() === cleanUser);
    if (jaExiste) {
      showToast('Já existe um usuário com este e-mail/login!', 'danger');
      return { success: false, error: 'Usuário já existe' };
    }

    const novoUsuario = {
      id: `usr_${Date.now()}`,
      name: name?.trim() || 'Usuário',
      username: cleanUser,
      password: password,
      cargo: cargo || 'Operacional',
      ativo: true,
      criadoEm: new Date().toISOString(),
      ultimoAcesso: null
    };

    const novaLista = [...usuarios, novoUsuario];
    setUsuarios(novaLista);
    localStorage.setItem(STORAGE_USUARIOS_KEY, JSON.stringify(novaLista));
    await salvarUsuarioNuvem(novoUsuario);

    showToast(`Usuário ${novoUsuario.name} cadastrado na nuvem com sucesso!`, 'success');
    return { success: true, usuario: novoUsuario };
  };

  const updateUsuario = async (usuarioId, dados) => {
    const userExistente = usuarios.find(u => u.id === usuarioId);
    if (!userExistente) {
      showToast('Usuário não encontrado!', 'danger');
      return { success: false, error: 'Usuário não encontrado' };
    }

    const cleanUser = dados.username ? dados.username.trim().toLowerCase() : userExistente.username;

    if (cleanUser !== userExistente.username) {
      const duplicado = usuarios.some(u => u.id !== usuarioId && u.username?.trim().toLowerCase() === cleanUser);
      if (duplicado) {
        showToast('Já existe outro usuário com este e-mail/login!', 'danger');
        return { success: false, error: 'E-mail já em uso' };
      }
    }

    const usuarioAtualizado = {
      ...userExistente,
      name: dados.name !== undefined ? dados.name.trim() : userExistente.name,
      username: cleanUser,
      password: dados.password ? dados.password : userExistente.password,
      cargo: dados.cargo !== undefined ? dados.cargo : userExistente.cargo,
      atualizadoEm: new Date().toISOString()
    };

    const novaLista = usuarios.map(u => u.id === usuarioId ? usuarioAtualizado : u);
    setUsuarios(novaLista);
    localStorage.setItem(STORAGE_USUARIOS_KEY, JSON.stringify(novaLista));
    await salvarUsuarioNuvem(usuarioAtualizado);

    // Se editou o usuário ativo na sessão, atualiza os dados em memória
    if (currentUser?.id === usuarioId || currentUser?.username === userExistente.username) {
      const updatedCurr = {
        ...currentUser,
        id: usuarioAtualizado.id,
        name: usuarioAtualizado.name,
        username: usuarioAtualizado.username,
        cargo: usuarioAtualizado.cargo
      };
      setCurrentUser(updatedCurr);
      if (localStorage.getItem(AUTH_PERSISTENT_KEY)) {
        localStorage.setItem(AUTH_PERSISTENT_KEY, JSON.stringify(updatedCurr));
      }
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedCurr));
    }

    showToast('Usuário e senha salvos na nuvem!', 'success');
    return { success: true };
  };

  const deleteUsuario = async (usuarioId) => {
    if (usuarios.length <= 1) {
      showToast('Não é possível excluir o único usuário do sistema!', 'danger');
      return { success: false, error: 'Único usuário' };
    }

    const userToDelete = usuarios.find(u => u.id === usuarioId);
    if (!userToDelete) return;

    if (currentUser?.id === usuarioId || currentUser?.username === userToDelete.username) {
      showToast('Você não pode excluir sua própria conta enquanto estiver conectada nela!', 'danger');
      return { success: false, error: 'Usuário ativo' };
    }

    const novaLista = usuarios.filter(u => u.id !== usuarioId);
    setUsuarios(novaLista);
    localStorage.setItem(STORAGE_USUARIOS_KEY, JSON.stringify(novaLista));
    await excluirUsuarioNuvem(usuarioId);

    showToast(`Usuário ${userToDelete.name} excluído com sucesso.`, 'info');
    return { success: true };
  };

  const updateCredentials = async ({ currentPassword, newUsername, newPassword, newName }) => {
    const targetUser = usuarios.find(u => u.username === currentUser?.username) || usuarios[0];
    if (!targetUser) return { success: false, error: 'Usuário não encontrado' };

    const isCurrentValid = currentPassword === targetUser.password ||
      (targetUser.password === '123456' && currentPassword === '123') ||
      (targetUser.password === '123' && currentPassword === '123456');

    if (!isCurrentValid) {
      showToast('Senha atual incorreta!', 'danger');
      return { success: false, error: 'Senha atual incorreta' };
    }

    return await updateUsuario(targetUser.id, {
      name: newName,
      username: newUsername,
      password: newPassword
    });
  };

  const resetCredentialsToDefault = async () => {
    setUsuarios([USUARIO_CLEUSA_PADRAO]);
    localStorage.setItem(STORAGE_USUARIOS_KEY, JSON.stringify([USUARIO_CLEUSA_PADRAO]));
    await salvarUsuarioNuvem(USUARIO_CLEUSA_PADRAO);
    showToast('Acesso padrão redefinido para: cleusa.gabrielli@gmail.com / 123', 'info');
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
      // Autenticação & Usuários
      isAuthenticated,
      currentUser,
      usuarios,
      addUsuario,
      updateUsuario,
      deleteUsuario,
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
