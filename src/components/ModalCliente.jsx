import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, User, MapPin, Phone, Home, Building, FileText, DollarSign, Briefcase } from 'lucide-react';

export const ModalCliente = ({ isOpen, onClose, clienteEdicao = null }) => {
  const { planos, addCliente, updateCliente, showToast } = useApp();

  const [tipoCliente, setTipoCliente] = useState('PF'); // 'PF' ou 'PJ'
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
  const [valorFechado, setValorFechado] = useState('');
  const [emiteNF, setEmiteNF] = useState(false);
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [emailFaturamento, setEmailFaturamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState('ativo');

  useEffect(() => {
    if (clienteEdicao) {
      setTipoCliente(clienteEdicao.tipoCliente || (clienteEdicao.cnpj || clienteEdicao.emiteNF ? 'PJ' : 'PF'));
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
      setValorFechado(clienteEdicao.valorFechado !== undefined && clienteEdicao.valorFechado !== null ? clienteEdicao.valorFechado : '');
      setEmiteNF(Boolean(clienteEdicao.emiteNF));
      setRazaoSocial(clienteEdicao.razaoSocial || '');
      setCnpj(clienteEdicao.cnpj || '');
      setInscricaoEstadual(clienteEdicao.inscricaoEstadual || '');
      setEmailFaturamento(clienteEdicao.emailFaturamento || '');
      setObservacoes(clienteEdicao.observacoes || '');
      setStatus(clienteEdicao.status || 'ativo');
    } else {
      setTipoCliente('PF');
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
      setValorFechado('');
      setEmiteNF(false);
      setRazaoSocial('');
      setCnpj('');
      setInscricaoEstadual('');
      setEmailFaturamento('');
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
      tipoCliente,
      valorFechado: valorFechado !== '' && !isNaN(Number(valorFechado)) ? Number(valorFechado) : null,
      emiteNF: Boolean(emiteNF),
      razaoSocial: razaoSocial.trim(),
      cnpj: cnpj.trim(),
      inscricaoEstadual: inscricaoEstadual.trim(),
      emailFaturamento: emailFaturamento.trim(),
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
            {/* Tipo de Cliente: Residencial (PF) ou Escritório / PJ */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Briefcase size={15} color="var(--primary-400)" />
                <span>Tipo de Cliente & Perfil</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setTipoCliente('PF');
                    if (planoPadraoId === 'plano-comercial-pj') {
                      setPlanoPadraoId('plano-quinzenal');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: tipoCliente === 'PF' ? '2px solid var(--primary-500)' : '1px solid var(--border-color)',
                    background: tipoCliente === 'PF' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-input)',
                    color: tipoCliente === 'PF' ? 'var(--primary-400)' : 'var(--text-secondary)',
                    fontWeight: tipoCliente === 'PF' ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Home size={18} />
                  <span>Residencial (PF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTipoCliente('PJ');
                    setPlanoPadraoId('plano-comercial-pj');
                    setEmiteNF(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: tipoCliente === 'PJ' ? '2px solid var(--primary-500)' : '1px solid var(--border-color)',
                    background: tipoCliente === 'PJ' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-input)',
                    color: tipoCliente === 'PJ' ? 'var(--primary-400)' : 'var(--text-secondary)',
                    fontWeight: tipoCliente === 'PJ' ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Building size={18} />
                  <span>Escritório / PJ (Comercial)</span>
                </button>
              </div>
            </div>

            {/* Se for PJ ou se tiver NF marcada */}
            <div style={{
              background: tipoCliente === 'PJ' || emiteNF ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-input)',
              border: tipoCliente === 'PJ' || emiteNF ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={emiteNF}
                    onChange={e => setEmiteNF(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-500)' }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FileText size={16} color="var(--primary-400)" />
                    Emitir Nota Fiscal (NF) para este cliente
                  </span>
                </label>
                {emiteNF && (
                  <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                    Emissão de NF
                  </span>
                )}
              </div>

              {emiteNF && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px dashed rgba(99, 102, 241, 0.25)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">CNPJ</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: 00.000.000/0001-00"
                        value={cnpj}
                        onChange={e => setCnpj(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Razão Social</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Alpha Consultoria & Negócios LTDA"
                        value={razaoSocial}
                        onChange={e => setRazaoSocial(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">E-mail para envio da NF (Faturamento)</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Ex: financeiro@empresa.com.br"
                        value={emailFaturamento}
                        onChange={e => setEmailFaturamento(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Inscrição Estadual (IE)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Isento ou 110.123.456.789"
                        value={inscricaoEstadual}
                        onChange={e => setInscricaoEstadual(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                {tipoCliente === 'PJ' ? 'Nome do Escritório / Contato Responsável *' : 'Nome Completo do Cliente *'}
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={tipoCliente === 'PJ' ? 'Ex: Escritório Advocacia Santos (Dr. Marcos)' : 'Ex: Mariana Albuquerque'}
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
                  <span>{tipoCliente === 'PJ' ? 'Edifício Comercial / Condomínio' : 'Nome do Condomínio'}</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={tipoCliente === 'PJ' ? 'Ex: Edifício Faria Lima Corporate' : 'Ex: Condomínio Bragantino, Spazio...'}
                  value={condominio} 
                  onChange={e => setCondominio(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">{tipoCliente === 'PJ' ? 'Torre / Bloco' : 'Torre / Bloco'}</label>
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
                <label className="form-label">{tipoCliente === 'PJ' ? 'Conjunto / Sala' : 'Apto / Unidade'}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={tipoCliente === 'PJ' ? 'Ex: Sala 42 / Conjunto B' : 'Ex: Apto 1204'}
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
                <label className="form-label">
                  {tipoCliente === 'PJ' ? 'Salas / Ambientes' : 'Dormitórios'}
                </label>
                <select 
                  className="form-select" 
                  value={dormitorios} 
                  onChange={e => setDormitorios(Number(e.target.value))}
                >
                  <option value={1}>{tipoCliente === 'PJ' ? '1 Sala / Recepção' : '1 Quarto'}</option>
                  <option value={2}>{tipoCliente === 'PJ' ? '2 Salas (Padrão)' : '2 Quartos (Padrão Catálogo)'}</option>
                  <option value={3}>{tipoCliente === 'PJ' ? '3 Salas (+R$ 30)' : '3 Quartos (+R$ 30)'}</option>
                  <option value={4}>{tipoCliente === 'PJ' ? '4 Salas ou mais' : '4 Quartos'}</option>
                </select>
              </div>
            </div>

            {/* Plano de Limpeza e Valor Fechado Combinado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Plano de Limpeza</label>
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
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <DollarSign size={14} color="var(--primary-400)" />
                  <span>Valor Fechado / Combinado (R$)</span>
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-input" 
                  placeholder="Ex: 250.00 (Fixo)"
                  value={valorFechado} 
                  onChange={e => setValorFechado(e.target.value)} 
                  style={{ 
                    borderColor: valorFechado ? 'var(--primary-500)' : 'var(--border-color)',
                    background: valorFechado ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-input)'
                  }}
                />
              </div>
            </div>

            {valorFechado && (
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'var(--primary-400)', 
                marginTop: '-0.35rem', 
                marginBottom: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(16, 185, 129, 0.08)',
                padding: '0.4rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <DollarSign size={14} />
                <span>
                  <strong>Valor Acordado:</strong> R$ {Number(valorFechado).toFixed(2).replace('.', ',')} por faxina (será puxado direto no agendamento).
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Observações e Recepção / Portaria</label>
              <textarea 
                className="form-textarea" 
                rows="2" 
                placeholder={tipoCliente === 'PJ' ? 'Ex: Ligar no ramal 12, crachá na recepção do prédio, limpar salas de reunião...' : 'Ex: Tem cachorro pequeno, portaria pede documento, chave com zelador...'}
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
