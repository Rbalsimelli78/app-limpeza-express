import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  DollarSign, 
  Calendar, 
  Tag, 
  CreditCard, 
  FileText, 
  Sparkles, 
  Wrench, 
  Building2, 
  Layers,
  ShoppingBag
} from 'lucide-react';

const TIPOS_MACRO = [
  { id: 'insumo', label: 'Insumos & Produtos', icon: ShoppingBag, desc: 'Álcool, panos, vassouras, sacos de lixo' },
  { id: 'investimento', label: 'Máquinas & Equipamentos', icon: Wrench, desc: 'Aspirador novo, extratora, escadas' },
  { id: 'imposto', label: 'Impostos & Taxas', icon: Building2, desc: 'Simples Nacional, DAS MEI, taxas bancárias' },
  { id: 'fixa', label: 'Operacional / Fixo', icon: Layers, desc: 'Transporte, combustível, internet, software' },
  { id: 'outro', label: 'Outras Despesas', icon: Tag, desc: 'Gastos diversos ou imprevistos' }
];

const SUGESTOES_POR_TIPO = {
  insumo: [
    'Álcool 70% e Desinfetante',
    'Panos de Microfibra Profissionais',
    'Vassouras de Piaçava e Rodos',
    'Sacos de Lixo Reforçados',
    'Detergente Neutro e Limpa-Vidros',
    'Luvas Descartáveis e Esponjas'
  ],
  investimento: [
    'Aspirador de Pó Novo',
    'Extratora de Estofados',
    'Escada de Alumínio Dobrável',
    'Extensão Elétrica Profissional',
    'Carrinho Funcional de Limpeza',
    'Manutenção / Conserto de Máquina'
  ],
  imposto: [
    'Simples Nacional (Guia DAS)',
    'Taxas Bancárias e Maquininha',
    'DAS MEI',
    'Taxa de Emissão de Nota Fiscal'
  ],
  fixa: [
    'Combustível e Estacionamento',
    'Vale Transporte / Uber das Equipes',
    'Internet e Telefonia',
    'Marketing e Panfletagem',
    'Ferramentas e Softwares de Gestão'
  ],
  outro: [
    'Lanche / Alimentação das Colaboradoras',
    'Conserto de Emergência',
    'Despesa Administrativa Diversa'
  ]
};

export const ModalDespesa = ({ isOpen, onClose, despesaEdicao = null, mesPreSelecionado = '' }) => {
  const { addDespesa, updateDespesa, deleteDespesa, mesesFechados, showToast } = useApp();

  const [tipoMacro, setTipoMacro] = useState('insumo');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [observacoes, setObservacoes] = useState('');

  // Sincroniza formulário ao abrir ou alterar despesa para edição
  useEffect(() => {
    if (!isOpen) return;

    if (despesaEdicao) {
      setTipoMacro(despesaEdicao.tipoMacro || 'insumo');
      setDescricao(despesaEdicao.descricao || '');
      setValor(despesaEdicao.valor ? String(despesaEdicao.valor) : '');
      setData(despesaEdicao.data || new Date().toISOString().slice(0, 10));
      setFormaPagamento(despesaEdicao.formaPagamento || 'PIX');
      setObservacoes(despesaEdicao.observacoes || '');
    } else {
      setTipoMacro('insumo');
      setDescricao('');
      setValor('');
      // Se tiver mês pré-selecionado (YYYY-MM), monta data no mês, senão usa hoje
      if (mesPreSelecionado && /^\d{4}-\d{2}$/.test(mesPreSelecionado)) {
        const hojeIso = new Date().toISOString().slice(0, 10);
        if (hojeIso.startsWith(mesPreSelecionado)) {
          setData(hojeIso);
        } else {
          setData(`${mesPreSelecionado}-05`);
        }
      } else {
        setData(new Date().toISOString().slice(0, 10));
      }
      setFormaPagamento('PIX');
      setObservacoes('');
    }
  }, [isOpen, despesaEdicao, mesPreSelecionado]);

  if (!isOpen) return null;

  const mesAlvo = data ? data.slice(0, 7) : (mesPreSelecionado || new Date().toISOString().slice(0, 7));
  const isMesFechado = mesesFechados[mesAlvo]?.fechado;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!descricao.trim()) {
      showToast('Por favor, informe a descrição do item ou despesa.', 'warning');
      return;
    }

    const valorNum = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      showToast('Por favor, informe um valor válido maior que zero.', 'warning');
      return;
    }

    if (!data) {
      showToast('Por favor, selecione a data do lançamento.', 'warning');
      return;
    }

    if (isMesFechado) {
      showToast(`⚠️ O mês ${mesAlvo} está fechado para auditoria! Reabra o mês para lançar alterações.`, 'warning');
      return;
    }

    const payload = {
      tipoMacro,
      categoria: TIPOS_MACRO.find(t => t.id === tipoMacro)?.label || 'Produtos de Limpeza',
      descricao: descricao.trim(),
      valor: valorNum,
      data,
      mesReferencia: data.slice(0, 7),
      formaPagamento,
      observacoes: observacoes.trim()
    };

    if (despesaEdicao) {
      updateDespesa(despesaEdicao.id, payload);
    } else {
      addDespesa(payload);
    }

    onClose();
  };

  const handleExcluir = () => {
    if (!despesaEdicao) return;
    if (window.confirm(`Deseja realmente excluir a despesa "${despesaEdicao.descricao}"?`)) {
      deleteDespesa(despesaEdicao.id);
      onClose();
    }
  };

  const sugestoes = SUGESTOES_POR_TIPO[tipoMacro] || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-card animate-scale-in" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '620px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '10px', 
              background: tipoMacro === 'investimento' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: tipoMacro === 'investimento' ? '#60a5fa' : 'var(--primary-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '700' }}>
                {despesaEdicao ? 'Editar Lançamento de Despesa' : 'Novo Lançamento Financeiro'}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Controle de insumos, equipamentos, impostos e custos operacionais
              </span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="btn-icon" 
            style={{ color: 'var(--text-muted)' }}
            aria-label="Fechar Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Alerta de Mês Fechado */}
        {isMesFechado && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            color: '#f87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>🔒</span>
            <span>
              <strong>Atenção:</strong> O mês de competência <strong>{mesAlvo}</strong> está fechado. Para adicionar ou modificar despesas neste mês, reabra-o na tela de Fechamento.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* 1. Seleção do Tipo Macro */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Categoria do Gasto / Natureza Financeira *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
              {TIPOS_MACRO.map((t) => {
                const Icon = t.icon;
                const isSelected = tipoMacro === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTipoMacro(t.id)}
                    style={{
                      background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-input)',
                      border: isSelected ? '1px solid var(--primary-500)' : '1px solid var(--border-color)',
                      color: isSelected ? 'var(--primary-400)' : 'var(--text-secondary)',
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    <Icon size={18} />
                    <span style={{ fontSize: '0.78rem', fontWeight: isSelected ? '700' : '500' }}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Descrição com Atalhos Rápidos */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Descrição do Item ou Despesa *
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Selecione um atalho ou digite livremente
              </span>
            </div>

            <input
              type="text"
              className="form-input"
              placeholder="Ex: Álcool 70%, Panos de Microfibra, Aspirador Electrolux novo..."
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              required
              autoFocus
              style={{ fontSize: '0.95rem' }}
            />

            {/* Chips de Sugestão Rápida */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
              {sugestoes.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setDescricao(sug)}
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '20px',
                    background: descricao === sug ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.05)',
                    color: descricao === sug ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Valor e Data (Grid 2 Colunas) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label">Valor Total (R$) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-400)', fontWeight: 'bold' }}>
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}
                  placeholder="0,00"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Data da Compra / Pagamento *</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="date"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={data}
                  onChange={e => setData(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* 4. Forma de Pagamento */}
          <div>
            <label className="form-label">Forma de Pagamento</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto / Débito em Conta'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormaPagamento(f)}
                  style={{
                    flex: '1 1 auto',
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    background: formaPagamento === f ? 'var(--primary-500)' : 'var(--bg-input)',
                    color: formaPagamento === f ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    fontWeight: formaPagamento === f ? '700' : '400',
                    textAlign: 'center'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Observações / Fornecedor / Loja */}
          <div>
            <label className="form-label">Observações / Loja / Fornecedor (Opcional)</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Ex: Comprado no Atacadão, nota fiscal guardada na pasta física..."
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Ações do Rodapé */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', gap: '0.75rem', flexWrap: 'wrap' }}>
            {despesaEdicao ? (
              <button
                type="button"
                onClick={handleExcluir}
                disabled={isMesFechado}
                className="btn btn-danger btn-sm"
              >
                Excluir Despesa
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isMesFechado}
                className="btn btn-primary"
                style={{ minWidth: '150px' }}
              >
                {despesaEdicao ? 'Salvar Alterações' : 'Lançar Despesa'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
