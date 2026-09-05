import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Sparkles, Plus, Trash2, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { SERVICOS_CATALOGO_PADRAO } from '../data/initialData';

export const ModalPlano = ({ isOpen, onClose, planoEdicao = null }) => {
  const { addPlano, updatePlano, showToast } = useApp();

  const [nome, setNome] = useState('');
  const [valorBase, setValorBase] = useState(190);
  const [frequencia, setFrequencia] = useState('Quinzenal (a cada 15 dias)');
  const [dormitoriosBase, setDormitoriosBase] = useState(2);
  const [tempoEstimado, setTempoEstimado] = useState('3 a 5hs');
  const [profissionais, setProfissionais] = useState(2);
  const [acrescimoPorQuartoExtra, setAcrescimoPorQuartoExtra] = useState(30);
  const [taxaSemManutencao, setTaxaSemManutencao] = useState(50);
  const [destaque, setDestaque] = useState('');
  const [descricao, setDescricao] = useState('');
  const [avisoCancelamento, setAvisoCancelamento] = useState('No caso de cancelamento avisar com 48hs de antecedência ou será cobrado 50% da sua reserva!!!');
  const [servicos, setServicos] = useState([]);

  useEffect(() => {
    if (planoEdicao) {
      setNome(planoEdicao.nome || '');
      setValorBase(planoEdicao.valorBase || 190);
      setFrequencia(planoEdicao.frequencia || 'Quinzenal');
      setDormitoriosBase(planoEdicao.dormitoriosBase || 2);
      setTempoEstimado(planoEdicao.tempoEstimado || '3 a 5hs');
      setProfissionais(planoEdicao.profissionais || 2);
      setAcrescimoPorQuartoExtra(planoEdicao.acrescimoPorQuartoExtra ?? 30);
      setTaxaSemManutencao(planoEdicao.taxaSemManutencao ?? 50);
      setDestaque(planoEdicao.destaque || '');
      setDescricao(planoEdicao.descricao || '');
      setAvisoCancelamento(planoEdicao.avisoCancelamento || 'No caso de cancelamento avisar com 48hs de antecedência ou será cobrado 50% da sua reserva!!!');
      setServicos(planoEdicao.servicosOferecidos ? JSON.parse(JSON.stringify(planoEdicao.servicosOferecidos)) : SERVICOS_CATALOGO_PADRAO);
    } else {
      setNome('');
      setValorBase(190);
      setFrequencia('Quinzenal (a cada 15 dias)');
      setDormitoriosBase(2);
      setTempoEstimado('3 a 5hs');
      setProfissionais(2);
      setAcrescimoPorQuartoExtra(30);
      setTaxaSemManutencao(50);
      setDestaque('');
      setDescricao('Faxina completa 2 profissionais.');
      setAvisoCancelamento('No caso de cancelamento avisar com 48hs de antecedência ou será cobrado 50% da sua reserva!!!');
      setServicos(JSON.parse(JSON.stringify(SERVICOS_CATALOGO_PADRAO)));
    }
  }, [planoEdicao, isOpen]);

  const handleAddServico = () => {
    setServicos(prev => [
      ...prev,
      { id: Date.now(), item: '', detalhe: '' }
    ]);
  };

  const handleUpdateServico = (index, field, value) => {
    setServicos(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveServico = (index) => {
    setServicos(prev => prev.filter((_, i) => i !== index));
  };

  const handleCarregarServicosPadrao = () => {
    setServicos(JSON.parse(JSON.stringify(SERVICOS_CATALOGO_PADRAO)));
    showToast('Lista de 9 serviços padrão carregada!');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      showToast('O nome do plano é obrigatório.', 'danger');
      return;
    }

    const payload = {
      nome: nome.trim(),
      valorBase: Number(valorBase),
      frequencia,
      dormitoriosBase: Number(dormitoriosBase),
      tempoEstimado,
      profissionais: Number(profissionais),
      acrescimoPorQuartoExtra: Number(acrescimoPorQuartoExtra),
      taxaSemManutencao: Number(taxaSemManutencao),
      destaque,
      descricao,
      avisoCancelamento,
      servicosOferecidos: servicos.filter(s => s.item.trim() !== '')
    };

    if (planoEdicao) {
      updatePlano(planoEdicao.id, payload);
    } else {
      addPlano(payload);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Layers size={20} color="var(--primary-400)" />
            <h3 style={{ fontSize: '1.125rem' }}>
              {planoEdicao ? 'Editar Plano de Limpeza' : 'Novo Plano de Limpeza'}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Nome e Valor */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Nome do Plano *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Plano Quinzenal 2 dormitórios"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor Base (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-input" 
                  value={valorBase}
                  onChange={e => setValorBase(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Frequência e Destaque */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Frequência</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Quinzenal (a cada 15 dias)"
                  value={frequencia}
                  onChange={e => setFrequencia(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Etiqueta de Destaque</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Mais Popular, Mais Econômico..."
                  value={destaque}
                  onChange={e => setDestaque(e.target.value)}
                />
              </div>
            </div>

            {/* Tempo, Profissionais e Dormitórios Base */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Tempo Estimado</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: 3 a 5hs"
                  value={tempoEstimado}
                  onChange={e => setTempoEstimado(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nº de Profissionais</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={profissionais}
                  onChange={e => setProfissionais(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dorms Base</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={dormitoriosBase}
                  onChange={e => setDormitoriosBase(e.target.value)}
                />
              </div>
            </div>

            {/* Regras de Adicionais (+30 por quarto extra, +50 sem manutenção) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">+ Quarto Extra (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-input" 
                  placeholder="Ex: 30.00"
                  value={acrescimoPorQuartoExtra}
                  onChange={e => setAcrescimoPorQuartoExtra(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">+ Sem Manutenção (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-input" 
                  placeholder="Ex: 50.00"
                  value={taxaSemManutencao}
                  onChange={e => setTaxaSemManutencao(e.target.value)}
                />
              </div>
            </div>

            {/* Aviso de Cancelamento */}
            <div className="form-group">
              <label className="form-label">Aviso Importante / Cancelamento</label>
              <input 
                type="text" 
                className="form-input" 
                value={avisoCancelamento}
                onChange={e => setAvisoCancelamento(e.target.value)}
              />
            </div>

            {/* Seção: Serviços Oferecidos Neste Pacote */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <CheckCircle2 size={16} color="var(--primary-400)" />
                    <span>Serviços Oferecidos neste Pacote ({servicos.length} itens)</span>
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Estes itens serão listados na mensagem enviada ao cliente
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={handleCarregarServicosPadrao} 
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.725rem', padding: '0.25rem 0.5rem' }}
                  >
                    Usar 9 Padrão
                  </button>
                  <button 
                    type="button" 
                    onClick={handleAddServico} 
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.725rem', padding: '0.25rem 0.5rem' }}
                  >
                    <Plus size={14} /> + Item
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                {servicos.map((s, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      background: 'var(--bg-input)', 
                      padding: '0.625rem 0.75rem', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.375rem'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary-400)', width: '20px' }}>
                        {index + 1}.
                      </span>
                      <input 
                        type="text" 
                        placeholder="Nome do serviço (ex: Cozinha, Banheiro...)"
                        className="form-input" 
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        value={s.item}
                        onChange={e => handleUpdateServico(index, 'item', e.target.value)}
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveServico(index)}
                        className="btn btn-danger btn-icon btn-sm"
                        style={{ width: '28px', height: '28px', flexShrink: 0 }}
                        title="Remover este item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <textarea 
                      placeholder="Detalhes do que está incluso (ex: Lavagem do piso, limpeza de pia e bancadas...)"
                      className="form-textarea" 
                      rows="2"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                      value={s.detalhe}
                      onChange={e => handleUpdateServico(index, 'detalhe', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Salvar Plano
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
