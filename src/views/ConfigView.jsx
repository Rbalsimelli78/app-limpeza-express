import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  Database, 
  Smartphone, 
  Globe, 
  Copy, 
  Check,
  ShieldCheck,
  Building,
  Trash2,
  Lock,
  KeyRound,
  User,
  Eye,
  EyeOff,
  Cloud,
  CloudOff,
  RefreshCw,
  ExternalLink,
  LogOut,
  Users,
  Plus,
  Edit2,
  UserPlus
} from 'lucide-react';
import { ModalUsuario } from '../components/ModalUsuario';

export const ConfigView = () => {
  const { 
    exportBackup, 
    importBackup, 
    resetDemo, 
    limparTodosOsDados, 
    limparApenasAgendamentos, 
    showToast,
    authCredentials,
    currentUser,
    usuarios = [],
    addUsuario,
    updateUsuario,
    deleteUsuario,
    updateCredentials,
    resetCredentialsToDefault,
    logout,
    cloudStatus,
    cloudLastSync,
    forcarSincronizacaoNuvem
  } = useApp();

  const [copiadoSql, setCopiadoSql] = useState(false);

  // Estados do Modal de Usuário
  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState(null);

  // Estados do formulário de troca de senha da usuária conectada
  const [formNome, setFormNome] = useState(currentUser?.name || authCredentials?.name || 'Cleusa Gabrielli');
  const [formUser, setFormUser] = useState(currentUser?.username || authCredentials?.username || 'cleusa.gabrielli@gmail.com');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaNovaSenha, setConfirmaNovaSenha] = useState('');
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [salvandoCreds, setSalvandoCreds] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormNome(currentUser.name || '');
      setFormUser(currentUser.username || '');
    }
  }, [currentUser]);

  const handleNovoUsuario = () => {
    setUsuarioEmEdicao(null);
    setModalUsuarioOpen(true);
  };

  const handleEditarUsuario = (user) => {
    setUsuarioEmEdicao(user);
    setModalUsuarioOpen(true);
  };

  const handleSalvarUsuarioModal = async (dados, id) => {
    if (id) {
      const res = await updateUsuario(id, dados);
      return res.success;
    } else {
      const res = await addUsuario(dados);
      return res.success;
    }
  };

  const handleSalvarCredenciais = async (e) => {
    e.preventDefault();

    if (!senhaAtual) {
      showToast('Por favor, informe sua senha atual para confirmar a alteração.', 'danger');
      return;
    }

    if (novaSenha && novaSenha !== confirmaNovaSenha) {
      showToast('A nova senha e a confirmação estão diferentes!', 'danger');
      return;
    }

    setSalvandoCreds(true);
    const res = await updateCredentials({
      currentPassword: senhaAtual,
      newUsername: formUser,
      newPassword: novaSenha,
      newName: formNome
    });

    if (res.success) {
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmaNovaSenha('');
    }
    setSalvandoCreds(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        importBackup(json);
      } catch (err) {
        showToast('Arquivo inválido!', 'danger');
      }
    };
    reader.readAsText(file);
  };

  const sqlSchema = `-- SCRIPT SUPABASE POSTGRESQL: Limpeza Express SP
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  endereco TEXT,
  apartamento TEXT,
  bairro TEXT,
  dormitorios INT DEFAULT 2,
  metragem TEXT DEFAULT '80 a 100m²',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ajudantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  chave_pix TEXT NOT NULL,
  tipo_pix TEXT DEFAULT 'Telefone',
  tipo_remuneracao TEXT DEFAULT 'diaria',
  valor_padrao NUMERIC(10,2) DEFAULT 90.00,
  especialidade TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  plano_id TEXT NOT NULL,
  data_hora_inicio TIMESTAMPTZ NOT NULL,
  data_hora_fim TIMESTAMPTZ,
  dormitorios INT DEFAULT 2,
  sem_manutencao_2meses BOOLEAN DEFAULT FALSE,
  valor_cliente NUMERIC(10,2) NOT NULL,
  status_cliente_pagamento TEXT DEFAULT 'pendente',
  status_servico TEXT DEFAULT 'confirmado',
  google_event_id TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);`;

  const copiarSql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiadoSql(true);
    showToast('Script SQL copiado com sucesso!');
    setTimeout(() => setCopiadoSql(false), 2500);
  };

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Settings size={24} color="var(--primary-400)" />
          <span>Configurações & Backup do Sistema</span>
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Gerenciamento de dados, instalação no celular da sua esposa e nuvem
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Sincronização em Nuvem Google Firebase */}
        <div className="glass-card" style={{ 
          borderLeft: cloudStatus === 'sincronizado' ? '4px solid #10b981' : '4px solid #f59e0b',
          gridColumn: '1 / -1'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cloud size={22} color={cloudStatus === 'sincronizado' ? '#10b981' : '#f59e0b'} />
              <span>Sincronização em Tempo Real (Google Firebase Cloud Firestore)</span>
            </h3>
            <span style={{ 
              fontSize: '0.75rem', 
              background: cloudStatus === 'sincronizado' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
              color: cloudStatus === 'sincronizado' ? '#10b981' : '#f59e0b', 
              padding: '0.25rem 0.65rem', 
              borderRadius: '100px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: cloudStatus === 'sincronizado' ? '#10b981' : '#f59e0b',
                boxShadow: cloudStatus === 'sincronizado' ? '0 0 6px #10b981' : 'none'
              }} />
              {cloudStatus === 'sincronizado' ? 'Nuvem Conectada & Sincronizada' : cloudStatus === 'conectando' ? 'Conectando à Nuvem...' : 'Aguardando Ativação do Firestore'}
            </span>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
            Com a nuvem ativada, <strong>tudo o que você cadastrar ou alterar no computador aparece instantaneamente no celular da sua esposa</strong> e vice-versa, sem precisar exportar arquivos!
          </p>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: '0.85rem',
            marginBottom: '1rem' 
          }}>
            <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Projeto Firebase</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary-400)', marginTop: '0.2rem' }}>
                limpeza-express-sp
              </div>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Modo de Funcionamento</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                Tempo Real com Cache Offline
              </div>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Última Sincronização</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {cloudLastSync ? cloudLastSync.toLocaleTimeString() : 'Em andamento'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              onClick={forcarSincronizacaoNuvem} 
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={15} />
              <span>Forçar Sincronização Completa</span>
            </button>

            <a 
              href="https://console.firebase.google.com/project/limpeza-express-sp/firestore" 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
            >
              <ExternalLink size={15} />
              <span>Abrir Firestore no Firebase Console</span>
            </a>
          </div>

          {cloudStatus !== 'sincronizado' && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem 1rem', 
              background: 'rgba(245, 158, 11, 0.1)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              <strong style={{ color: '#f59e0b' }}>⚠️ Atenção - 1 Passo Restante no Firebase Console:</strong>
              <p style={{ marginTop: '0.35rem' }}>
                Se você acabou de registrar o app no Firebase, clique no link acima <strong>"Abrir Firestore no Firebase Console"</strong>, clique em <strong>"Criar banco de dados"</strong>, marque a opção <strong>"Iniciar no modo de teste"</strong> e clique em <strong>"Ativar"</strong>. Assim que fizer isso, o status mudará para <span style={{ color: '#10b981', fontWeight: '600' }}>Nuvem Conectada</span> automaticamente!
              </p>
            </div>
          )}
        </div>

        {/* Gestão de Usuários & Acessos à Nuvem */}
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#10b981" />
                <span>Usuários com Acesso ao Sistema</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Controle quem pode acessar o sistema no celular ou computador. Sincronizado na Nuvem em tempo real.
              </p>
            </div>

            <button 
              type="button" 
              onClick={handleNovoUsuario} 
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <UserPlus size={15} />
              <span>Novo Usuário</span>
            </button>
          </div>

          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.775rem',
            color: 'var(--text-secondary)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShieldCheck size={18} color="#fb7185" style={{ flexShrink: 0 }} />
            <span>
              <strong>Usuário "admin" desativado:</strong> O login antigo de teste não entra mais. Somente as pessoas cadastradas na lista abaixo conseguem acessar o aplicativo.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {usuarios.map(u => {
              const isLogado = currentUser?.username === u.username || currentUser?.id === u.id;

              return (
                <div 
                  key={u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--primary-400)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>
                      {(u.name || u.nome || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <strong style={{ fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                          {u.name || u.nome}
                        </strong>
                        {isLogado && (
                          <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                            Sua Conta Atual
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary-400)', fontWeight: '500' }}>
                        {u.username || u.email}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {u.cargo || 'Administradora'} • Sincronizado na Nuvem
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => handleEditarUsuario(u)}
                      className="btn btn-secondary btn-sm"
                      title="Editar usuário e senha"
                      style={{ padding: '0.35rem 0.65rem' }}
                    >
                      <Edit2 size={14} />
                      <span>Editar</span>
                    </button>

                    {usuarios.length > 1 && !isLogado && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja realmente remover o acesso de ${u.name}?`)) {
                            deleteUsuario(u.id);
                          }
                        }}
                        className="btn btn-danger btn-sm"
                        title="Excluir usuário"
                        style={{ padding: '0.35rem 0.65rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alterar Minha Senha / Minhas Credenciais */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--primary-400)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={20} color="var(--primary-400)" />
                <span>Alterar Minha Senha ({formUser})</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Atualize seus dados e senha de acesso pessoal. Sincroniza em todos os seus aparelhos.
              </p>
            </div>
            <span style={{ 
              fontSize: '0.725rem', 
              background: 'rgba(16, 185, 129, 0.15)', 
              color: 'var(--primary-400)', 
              padding: '0.2rem 0.5rem', 
              borderRadius: '100px',
              fontWeight: '600'
            }}>
              Sessão Conectada
            </span>
          </div>

          <form onSubmit={handleSalvarCredenciais} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Meu Nome de Exibição
              </label>
              <input
                type="text"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: Cleusa Gabrielli"
                className="input"
                style={{ width: '100%', fontSize: '0.85rem' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Meu E-mail / Usuário de Login
              </label>
              <input
                type="text"
                value={formUser}
                onChange={(e) => setFormUser(e.target.value)}
                placeholder="Ex: cleusa.gabrielli@gmail.com"
                className="input"
                style={{ width: '100%', fontSize: '0.85rem' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Nova Senha (Opcional)
                </label>
                <input
                  type={mostrarSenhas ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Nova senha"
                  className="input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Confirmar Nova
                </label>
                <input
                  type={mostrarSenhas ? 'text' : 'password'}
                  value={confirmaNovaSenha}
                  onChange={(e) => setConfirmaNovaSenha(e.target.value)}
                  placeholder="Repita a senha"
                  className="input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: '600', marginBottom: '0.25rem' }}>
                Senha Atual (Obrigatória para Salvar)
              </label>
              <input
                type={mostrarSenhas ? 'text' : 'password'}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
                className="input"
                style={{ width: '100%', fontSize: '0.85rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <input 
                  type="checkbox" 
                  checked={mostrarSenhas} 
                  onChange={(e) => setMostrarSenhas(e.target.checked)} 
                  style={{ accentColor: 'var(--primary-500)' }}
                />
                <span>Mostrar senhas</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={salvandoCreds} 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '0.25rem' }}
            >
              <KeyRound size={16} />
              <span>{salvandoCreds ? 'Salvando...' : 'Salvar Alterações na Nuvem'}</span>
            </button>

            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja sair e bloquear o aplicativo agora?')) {
                    logout();
                  }
                }}
                className="btn btn-danger"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '700' }}
              >
                <LogOut size={16} />
                <span>Sair da Conta (Bloquear Aplicativo)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Como instalar no Celular */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Smartphone size={20} color="var(--primary-400)" />
            <span>Como Usar como Aplicativo no Celular</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
            Sua esposa não precisa baixar nada em lojas de app. O sistema é um <strong>PWA (Progressive Web App)</strong>:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
            <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--primary-400)' }}>📱 No iPhone (Safari):</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Abra o site no navegador Safari, clique no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima) e escolha <strong>"Adicionar à Tela de Início"</strong>.
              </p>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--accent-cyan)' }}>🤖 No Android (Chrome):</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Abra o site no Google Chrome, clique nos <strong>3 pontinhos</strong> no canto superior e selecione <strong>"Instalar Aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Backup e Segurança dos Dados */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <ShieldCheck size={20} color="var(--accent-gold)" />
            <span>Segurança & Backup dos Dados</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
            Seus clientes, escalas e controle financeiro ficam salvos com segurança. Você pode baixar uma cópia para o seu computador a qualquer momento.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button onClick={exportBackup} className="btn btn-primary" style={{ width: '100%' }}>
              <Download size={18} />
              <span>Fazer Backup Agora (.JSON)</span>
            </button>

            <label className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer' }}>
              <Upload size={18} />
              <span>Restaurar Backup do Arquivo</span>
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Card de Limpeza para Uso Real da Esposa */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Trash2 size={20} color="var(--accent-rose)" />
            <span>Limpar Dados de Exemplo (Uso Real)</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
            Pronto para colocar sua esposa no controle? Use os botões abaixo para limpar os dados fictícios e iniciar com a base 100% limpa:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button 
              onClick={() => {
                if (confirm('Atenção: Deseja apagar todos os clientes, ajudantes e faxinas de teste para começar do zero?')) {
                  limparTodosOsDados();
                }
              }} 
              className="btn btn-danger" 
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
            >
              <Trash2 size={16} />
              <span>Limpar Base Completa (Zerar Tudo para Produção)</span>
            </button>

            <button 
              onClick={() => {
                if (confirm('Deseja apagar apenas as faxinas e histórico financeiro de teste? (Seus clientes e ajudantes cadastrados serão mantidos)')) {
                  limparApenasAgendamentos();
                }
              }} 
              className="btn btn-secondary" 
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
            >
              <RotateCcw size={16} />
              <span>Limpar Apenas Faxinas de Teste (Manter Clientes/Ajudantes)</span>
            </button>

            <button 
              onClick={() => {
                if (confirm('Deseja recarregar os dados de exemplo da demonstração?')) {
                  resetDemo();
                }
              }} 
              className="btn btn-secondary btn-sm" 
              style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-muted)' }}
            >
              <RotateCcw size={14} />
              <span>Recarregar Dados de Demonstração</span>
            </button>
          </div>
        </div>
      </div>

      {/* Script do Supabase para Nuvem */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={20} color="var(--primary-400)" />
              <span>Script SQL para Banco de Dados na Nuvem (Supabase Grátis)</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Quando você quiser sincronizar em nuvem multi-dispositivo, basta colar este código no SQL Editor do Supabase gratuito:
            </p>
          </div>

          <button onClick={copiarSql} className="btn btn-secondary btn-sm">
            {copiadoSql ? <Check size={16} color="var(--primary-400)" /> : <Copy size={16} />}
            <span>{copiadoSql ? 'Copiado!' : 'Copiar Script SQL'}</span>
          </button>
        </div>

        <pre style={{ 
          background: 'var(--bg-input)', 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)', 
          fontSize: '0.8rem', 
          overflowX: 'auto',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)'
        }}>
          {sqlSchema}
        </pre>
      </div>

      {/* Modal de Criação / Edição de Usuário */}
      <ModalUsuario 
        isOpen={modalUsuarioOpen}
        onClose={() => setModalUsuarioOpen(false)}
        usuarioEdicao={usuarioEmEdicao}
        onSalvar={handleSalvarUsuarioModal}
      />
    </div>
  );
};

