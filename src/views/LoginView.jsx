import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  HelpCircle, 
  RotateCcw,
  Sun,
  Moon
} from 'lucide-react';

export const LoginView = () => {
  const { login, resetCredentialsToDefault, theme, toggleTheme } = useApp();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Por favor, informe seu usuário ou e-mail.');
      return;
    }

    if (!password) {
      setErrorMsg('Por favor, digite sua senha de acesso.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = login(username, password, rememberMe);
      if (!result.success) {
        setErrorMsg('Usuário ou senha incorretos. Tente novamente.');
      }
      setLoading(false);
    }, 200);
  };

  const handleResetPassword = () => {
    if (confirm('Deseja redefinir a senha para o padrão de fábrica? (Usuário: admin | Senha: 123456)')) {
      resetCredentialsToDefault();
      setUsername('admin');
      setPassword('123456');
      setShowRecoveryModal(false);
      setErrorMsg('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1.25rem',
      background: 'radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.15), transparent 60%), var(--bg-body)',
      position: 'relative'
    }}>
      {/* Botão de Tema no Topo */}
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
        <button 
          onClick={toggleTheme} 
          className="btn btn-secondary btn-icon"
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Cartão de Login */}
        <div className="glass-card" style={{
          padding: '2.5rem 2.25rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          {/* Logo e Cabeçalho */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '22px',
              margin: '0 auto 1rem',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
              border: '2px solid rgba(16, 185, 129, 0.4)'
            }}>
              <img 
                src="/logo.jpg" 
                alt="Limpeza Express SP" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
              Limpeza Express
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--primary-400)', fontWeight: '600' }}>
              São Paulo • SP • Gestão Operacional
            </p>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '0.35rem 0.85rem',
              borderRadius: '100px',
              marginTop: '0.85rem',
              fontSize: '0.8rem',
              color: 'var(--primary-400)'
            }}>
              <ShieldCheck size={16} />
              <span>Painel Administrativo Restrito</span>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {errorMsg && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
            {/* Campo Usuário */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.95rem', 
                fontWeight: '600', 
                marginBottom: '0.5rem', 
                color: 'var(--text-secondary)' 
              }}>
                Usuário ou E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '1.1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <User size={22} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: admin"
                  className="input form-input"
                  style={{ 
                    height: '56px', 
                    paddingLeft: '3.4rem', 
                    paddingRight: '1.1rem', 
                    fontSize: '1.05rem',
                    borderRadius: '12px',
                    width: '100%' 
                  }}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: '600', 
                  color: 'var(--text-secondary)' 
                }}>
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.825rem',
                    color: 'var(--primary-400)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Esqueceu a senha?
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '1.1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <Lock size={22} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="input form-input"
                  style={{ 
                    height: '56px', 
                    paddingLeft: '3.4rem', 
                    paddingRight: '3.4rem', 
                    fontSize: '1.05rem',
                    borderRadius: '12px',
                    width: '100%' 
                  }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.35rem'
                  }}
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            {/* Lembrar neste aparelho */}
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--primary-500)', width: '18px', height: '18px' }}
              />
              <span>Manter conectado neste celular/computador</span>
            </label>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                height: '56px',
                fontSize: '1.05rem',
                fontWeight: '700',
                borderRadius: '12px',
                marginTop: '0.5rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <span>{loading ? 'Validando...' : 'Entrar no Sistema'}</span>
              <ArrowRight size={20} />
            </button>
          </form>

          {/* Dica de Acesso Inicial */}
          <div style={{
            marginTop: '1.75rem',
            padding: '0.875rem',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            fontSize: '0.775rem',
            lineHeight: '1.5',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '700', color: 'var(--accent-gold)', marginBottom: '0.25rem' }}>
              <Sparkles size={14} />
              <span>Acesso Inicial Recomendado:</span>
            </div>
            <div>
              Usuário: <code style={{ color: 'var(--primary-400)', fontWeight: 'bold' }}>admin</code> &nbsp;|&nbsp; 
              Senha: <code style={{ color: 'var(--primary-400)', fontWeight: 'bold' }}>123456</code>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              💡 Você pode alterar o usuário e a senha a qualquer momento no menu <strong>Configurações</strong>.
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          © Limpeza Express SP • Sistema Seguro de Gestão
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      {showRecoveryModal && (
        <div className="modal-backdrop" onClick={() => setShowRecoveryModal(false)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '400px' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <HelpCircle size={22} color="var(--primary-400)" />
              <h3 style={{ fontSize: '1.15rem' }}>Recuperação de Acesso</h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              Caso você ou sua esposa tenham esquecido a senha personalizada, é possível restaurar o acesso com a senha padrão de fábrica.
            </p>

            <div style={{ 
              background: 'var(--bg-input)', 
              padding: '0.875rem', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '0.8rem',
              marginBottom: '1.25rem'
            }}>
              <div><strong>Usuário padrão:</strong> admin</div>
              <div><strong>Senha padrão:</strong> 123456</div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowRecoveryModal(false)}
                className="btn btn-secondary btn-sm"
              >
                Voltar
              </button>
              <button 
                type="button" 
                onClick={handleResetPassword}
                className="btn btn-primary btn-sm"
              >
                <RotateCcw size={16} />
                <span>Restaurar para Padrão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
