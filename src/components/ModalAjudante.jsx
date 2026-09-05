import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, UserCheck, DollarSign, Phone, CreditCard } from 'lucide-react';

export const ModalAjudante = ({ isOpen, onClose, ajudanteEdicao = null }) => {
  const { addAjudante, updateAjudante, showToast } = useApp();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [tipoPix, setTipoPix] = useState('Telefone');
  const [tipoRemuneracao, setTipoRemuneracao] = useState('diaria');
  const [valorPadrao, setValorPadrao] = useState(90);
  const [especialidade, setEspecialidade] = useState('');
  const [status, setStatus] = useState('ativo');

  useEffect(() => {
    if (ajudanteEdicao) {
      setNome(ajudanteEdicao.nome || '');
      setTelefone(ajudanteEdicao.telefone || '');
      setChavePix(ajudanteEdicao.chavePix || '');
      setTipoPix(ajudanteEdicao.tipoPix || 'Telefone');
      setTipoRemuneracao(ajudanteEdicao.tipoRemuneracao || 'diaria');
      setValorPadrao(ajudanteEdicao.valorPadrao || 90);
      setEspecialidade(ajudanteEdicao.especialidade || '');
      setStatus(ajudanteEdicao.status || 'ativo');
    } else {
      setNome('');
      setTelefone('');
      setChavePix('');
      setTipoPix('Telefone');
      setTipoRemuneracao('diaria');
      setValorPadrao(90);
      setEspecialidade('');
      setStatus('ativo');
    }
  }, [ajudanteEdicao, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      showToast('O nome da ajudante é obrigatório.', 'danger');
      return;
    }

    const payload = {
      nome: nome.trim(),
      telefone: telefone.replace(/\D/g, ''),
      chavePix: chavePix.trim(),
      tipoPix,
      tipoRemuneracao,
      valorPadrao: Number(valorPadrao),
      especialidade: especialidade.trim(),
      status
    };

    if (ajudanteEdicao) {
      updateAjudante(ajudanteEdicao.id, payload);
    } else {
      addAjudante(payload);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <UserCheck size={20} color="var(--primary-400)" />
            <h3 style={{ fontSize: '1.125rem' }}>
              {ajudanteEdicao ? 'Editar Colaboradora' : 'Nova Colaboradora / Ajudante'}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nome da Colaboradora *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: Maria das Dores Silva"
                value={nome} 
                onChange={e => setNome(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp (com DDD) *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: 11 98111-2233"
                value={telefone} 
                onChange={e => setTelefone(e.target.value)} 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Tipo de PIX</label>
                <select 
                  className="form-select" 
                  value={tipoPix} 
                  onChange={e => setTipoPix(e.target.value)}
                >
                  <option value="Telefone">Telefone</option>
                  <option value="CPF">CPF</option>
                  <option value="E-mail">E-mail</option>
                  <option value="Aleatória">Chave Aleatória</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Chave PIX para Pagamento *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Informe a chave PIX exata"
                  value={chavePix} 
                  onChange={e => setChavePix(e.target.value)} 
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Como é Paga?</label>
                <select 
                  className="form-select" 
                  value={tipoRemuneracao} 
                  onChange={e => setTipoRemuneracao(e.target.value)}
                >
                  <option value="diaria">Por Diária Fechada</option>
                  <option value="hora">Por Hora Trabalhada</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Valor Padrão ({tipoRemuneracao === 'diaria' ? 'R$/Diária' : 'R$/Hora'}) *
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  value={valorPadrao} 
                  onChange={e => setValorPadrao(e.target.value)} 
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Especialidades ou Habilidades</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: Cozinha e banheiros pesados, vidros, armários..."
                value={especialidade} 
                onChange={e => setEspecialidade(e.target.value)} 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select 
                className="form-select" 
                value={status} 
                onChange={e => setStatus(e.target.value)}
              >
                <option value="ativo">Ativa (Disponível para escalas)</option>
                <option value="inativo">Inativa / Em Pausa</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Salvar Colaboradora
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
