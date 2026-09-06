import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, User, MapPin, Phone, Home, Building } from 'lucide-react';

export const ModalCliente = ({ isOpen, onClose, clienteEdicao = null }) => {
  const { planos, addCliente, updateCliente, showToast } = useApp();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [condominio, setCondominio] = useState('');
  const [torre, setTorre] = useState('');
  const [endereco, setEndereco] = useState('');
  const [apartamento, setApartamento] = useState('');
  const [bairro, setBairro] = useState('');
  const [dormitorios, setDormitorios] = useState(2);
  const [metragem, setMetragem] = useState('80 a 100m²');
  const [planoPadraoId, setPlanoPadraoId] = useState('plano-quinzenal');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState('ativo');

  useEffect(() => {
    if (clienteEdicao) {
      setNome(clienteEdicao.nome || '');
      setTelefone(clienteEdicao.telefone || '');
      setCondominio(clienteEdicao.condominio || '');
      setTorre(clienteEdicao.torre || '');
      setEndereco(clienteEdicao.endereco || '');
      setApartamento(clienteEdicao.apartamento || '');
      setBairro(clienteEdicao.bairro || '');
      setDormitorios(clienteEdicao.dormitorios || 2);
      setMetragem(clienteEdicao.metragem || '80 a 100m²');
      setPlanoPadraoId(clienteEdicao.planoPadraoId || 'plano-quinzenal');
      setObservacoes(clienteEdicao.observacoes || '');
      setStatus(clienteEdicao.status || 'ativo');
    } else {
      setNome('');
      setTelefone('');
      setCondominio('');
      setTorre('');
      setEndereco('');
      setApartamento('');
      setBairro('');
      setDormitorios(2);
      setMetragem('80 a 100m²');
      setPlanoPadraoId('plano-quinzenal');
      setObservacoes('');
      setStatus('ativo');
    }
  }, [clienteEdicao, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      showToast('O nome do cliente é obrigatório.', 'danger');
      return;
    }

    const payload = {
      nome: nome.trim(),
      telefone: telefone.replace(/\D/g, ''),
      condominio: condominio.trim(),
      torre: torre.trim(),
      endereco: endereco.trim(),
      apartamento: apartamento.trim(),
      bairro: bairro.trim(),
      cidade: 'São Paulo - SP',
      dormitorios: Number(dormitorios),
      metragem,
      planoPadraoId,
      status: status || 'ativo',
      observacoes
    };

    if (clienteEdicao) {
      updateCliente(clienteEdicao.id, payload);
    } else {
      addCliente(payload);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <User size={20} color="var(--primary-400)" />
            <h3 style={{ fontSize: '1.125rem' }}>
              {clienteEdicao ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nome Completo *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: Mariana Albuquerque"
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
                placeholder="Ex: 11 98765-4321"
                value={telefone} 
                onChange={e => setTelefone(e.target.value)} 
                required 
              />
            </div>

            {/* Condomínio e Torre */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building size={14} color="var(--primary-400)" />
                  <span>Nome do Condomínio</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Condomínio Bragantino, Spazio..."
                  value={condominio} 
                  onChange={e => setCondominio(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Torre / Bloco</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Torre 5, Bloco B"
                  value={torre} 
                  onChange={e => setTorre(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Endereço (Rua/Av e Número)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Rua Luziano Ribas, 113"
                  value={endereco} 
                  onChange={e => setEndereco(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Apto / Unidade</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Apto 1204"
                  value={apartamento} 
                  onChange={e => setApartamento(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Bairro (São Paulo)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Jardins, Moema, Morumbi..."
                  value={bairro} 
                  onChange={e => setBairro(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dormitórios</label>
                <select 
                  className="form-select" 
                  value={dormitorios} 
                  onChange={e => setDormitorios(Number(e.target.value))}
                >
                  <option value={1}>1 Quarto</option>
                  <option value={2}>2 Quartos (Padrão Catálogo)</option>
                  <option value={3}>3 Quartos (+R$ 30)</option>
                  <option value={4}>4 Quartos</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Plano Preferido</label>
                <select 
                  className="form-select" 
                  value={planoPadraoId} 
                  onChange={e => setPlanoPadraoId(e.target.value)}
                >
                  {planos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Metragem Estimada</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: 80 a 100m²"
                  value={metragem} 
                  onChange={e => setMetragem(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Status do Cliente</label>
              <select 
                className="form-select"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="ativo">Ativo (Atendimentos Regulares)</option>
                <option value="inativo">Inativo / Pausado (Sem Faxinas Ativas)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Observações e Portaria</label>
              <textarea 
                className="form-textarea" 
                rows="2" 
                placeholder="Ex: Tem cachorro pequeno, portaria pede documento, chave com zelador..."
                value={observacoes} 
                onChange={e => setObservacoes(e.target.value)} 
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Salvar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
