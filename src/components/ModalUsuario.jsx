import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, ShieldCheck, Check } from 'lucide-react';

export const ModalUsuario = ({ isOpen, onClose, usuarioEdicao, onSalvar }) => {
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [cargo, setCargo] = useState('Administradora');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (usuarioEdicao) {
      setNome(usuarioEdicao.name || usuarioEdicao.nome || '');
      setUsername(usuarioEdicao.username || usuarioEdicao.email || '');
      setSenha('');
      setCargo(usuarioEdicao.cargo || 'Administradora');
    } else {
      setNome('');
      setUsername('');
      setSenha('');
      setCargo('Administradora');
    }
  }, [usuarioEdicao, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);

    const dados = {
      name: nome.trim(),
      username: username.trim().toLowerCase(),
      cargo: cargo
    };

    if (senha) {
      dados.password = senha;
    }

    const ok = await onSalvar(dados, usuarioEdicao?.id);
    setSalvando(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <User size={20} color="var(--primary-400)" />
            <h3 style={{ fontSize: '1.125rem' }}>
              {usuarioEdicao ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nome Completo *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: Cleusa Gabrielli ou Ricardo"
                value={nome} 
                onChange={e => setNome(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Usuário / E-mail de Login *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: cleusa.gabrielli@gmail.com"
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Este é o e-mail que a pessoa digitará na tela de login.
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                {usuarioEdicao ? 'Nova Senha (deixe vazio para não alterar)' : 'Senha de Acesso *'}
              </label>
              <input 
                type={mostrarSenha ? 'text' : 'password'} 
                className="form-input" 
                placeholder={usuarioEdicao ? 'Deixe em branco para manter a senha atual' : 'Mínimo de 3 caracteres'}
                value={senha} 
                onChange={e => setSenha(e.target.value)} 
                required={!usuarioEdicao}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                <input 
                  type="checkbox" 
                  checked={mostrarSenha} 
                  onChange={e => setMostrarSenha(e.target.checked)} 
                  style={{ accentColor: 'var(--primary-500)' }}
                />
                <span>Mostrar senha digitada</span>
              </label>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cargo / Nível de Acesso</label>
              <select 
                className="form-select"
                value={cargo}
                onChange={e => setCargo(e.target.value)}
              >
                <option value="Proprietária & Administradora">Proprietária & Administradora</option>
                <option value="Administrador(a)">Administrador(a)</option>
                <option value="Operacional">Operacional / Ajudante</option>
              </select>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.4'
            }}>
              <strong style={{ color: 'var(--primary-400)' }}>☁️ Sincronização em Nuvem:</strong> Assim que salvar, este usuário poderá entrar pelo celular, tablet ou computador imediatamente.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="btn btn-primary">
              <Check size={16} />
              <span>{salvando ? 'Salvando...' : 'Salvar Usuário'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
