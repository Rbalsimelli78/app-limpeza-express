import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calculator, 
  Copy, 
  MessageCircle, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  Calendar, 
  Home, 
  Clock, 
  Users 
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { buildOrcamentoText, getWhatsAppUrl } from '../utils/whatsapp';

export const OrcamentoView = ({ onAgendarComDados }) => {
  const { planos, regras, checklist, clientes, showToast } = useApp();

  const [clienteNome, setClienteNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [planoId, setPlanoId] = useState('plano-quinzenal');
  const [dormitorios, setDormitorios] = useState(2);
  const [semManutencao, setSemManutencao] = useState(false);

  // Selecionar de cliente existente
  const handleSelectClienteExistente = (cId) => {
    const cli = clientes.find(c => c.id === cId);
    if (cli) {
      setClienteNome(cli.nome);
      setTelefone(cli.telefone);
      setEndereco(`${cli.endereco}, ${cli.apartamento} - ${cli.bairro}`);
      if (cli.dormitorios) setDormitorios(cli.dormitorios);
      if (cli.planoPadraoId) setPlanoId(cli.planoPadraoId);
    }
  };

  const planoAtual = planos.find(p => p.id === planoId) || planos[0];

  // Cálculo
  let valorFinal = planoAtual.valorBase;
  if (dormitorios > 2) {
    valorFinal += (dormitorios - 2) * regras.acrescimoPorQuartoExtra;
  }
  if (semManutencao) {
    valorFinal += regras.taxaSemManutencao2Meses;
  }

  const textoWhatsapp = buildOrcamentoText({
    clienteNome,
    plano: planoAtual,
    dormitorios,
    semManutencao,
    valorFinal,
    endereco
  });

  const copiarTexto = () => {
    navigator.clipboard.writeText(textoWhatsapp);
    showToast('Proposta copiada para a área de transferência!');
  };

  const waUrl = getWhatsAppUrl(telefone, textoWhatsapp);

  const handleAgendar = () => {
    onAgendarComDados({
      clienteNome,
      telefone,
      endereco,
      planoId,
      dormitorios,
      semManutencao,
      valorFinal
    });
  };

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Calculator size={24} color="var(--primary-400)" />
          <span>Calculadora de Propostas WhatsApp</span>
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Gere orçamentos instantâneos com as regras e catálogo oficial da Limpeza Express SP
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Painel de Configuração da Proposta */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--primary-400)" />
            <span>Dados da Limpeza</span>
          </h3>

          {/* Selecionar Cliente Existente */}
          {clientes.length > 0 && (
            <div className="form-group">
              <label className="form-label">Preencher com Cliente Cadastrado (Opcional)</label>
              <select 
                className="form-select"
                onChange={e => handleSelectClienteExistente(e.target.value)}
                defaultValue=""
              >
                <option value="">Novo Cliente / Lead do WhatsApp...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.bairro})</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nome do Cliente</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: Mariana Albuquerque"
              value={clienteNome}
              onChange={e => setClienteNome(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp do Cliente (com DDD)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: 11 98765-4321"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Endereço / Condomínio</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: Rua Oscar Freire, 1420 - Apto 82 Jardins"
              value={endereco}
              onChange={e => setEndereco(e.target.value)}
            />
          </div>

          {/* Escolha do Plano */}
          <div className="form-group">
            <label className="form-label">Plano de Limpeza *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {planos.map(p => {
                const isSelected = p.id === planoId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanoId(p.id)}
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-input)',
                      border: isSelected ? '2px solid var(--primary-500)' : '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: isSelected ? 'var(--primary-400)' : 'var(--text-secondary)', fontWeight: '600' }}>
                      {p.nome.replace('Plano ', '')}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.25rem' }}>
                      R$ {p.valorBase}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      2 profissionais
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dormitórios */}
          <div className="form-group">
            <label className="form-label">Quantidade de Dormitórios</label>
            <select 
              className="form-select"
              value={dormitorios}
              onChange={e => setDormitorios(Number(e.target.value))}
            >
              <option value={1}>1 Dormitório</option>
              <option value={2}>2 Dormitórios (Base do Catálogo)</option>
              <option value={3}>3 Dormitórios (+R$ 30,00)</option>
              <option value={4}>4 Dormitórios (+R$ 60,00)</option>
            </select>
          </div>

          {/* Adicional Sem Manutenção */}
          <div style={{ 
            background: 'rgba(245, 158, 11, 0.08)', 
            border: '1px solid rgba(245, 158, 11, 0.25)', 
            padding: '0.75rem 1rem', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <input 
              type="checkbox" 
              id="semManutOrc" 
              checked={semManutencao} 
              onChange={e => setSemManutencao(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
            />
            <label htmlFor="semManutOrc" style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <strong>Apartamento sem faxina há mais de 2 meses?</strong> (+R$ 50,00 adicional)
            </label>
          </div>

          {/* Resumo do Valor Total */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                Valor Total da Faxina
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary-400)' }}>
                {planoAtual.tempoEstimado} • 2 profissionais
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-400)', fontFamily: 'var(--font-display)' }}>
              {formatCurrency(valorFinal)}
            </div>
          </div>
        </div>

        {/* Pré-Visualização da Proposta para o WhatsApp */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={18} color="#25d366" />
              <span>Mensagem Pronta para o WhatsApp</span>
            </h3>
            <button onClick={copiarTexto} className="btn btn-secondary btn-sm">
              <Copy size={14} />
              <span>Copiar</span>
            </button>
          </div>

          <div style={{ 
            background: 'var(--bg-input)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)', 
            fontSize: '0.825rem', 
            lineHeight: '1.5',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            flex: 1,
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            marginBottom: '1rem'
          }}>
            {textoWhatsapp}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a 
              href={waUrl} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-whatsapp" 
              style={{ flex: 1 }}
            >
              <MessageCircle size={18} />
              <span>Enviar no WhatsApp</span>
            </a>

            <button 
              onClick={handleAgendar}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              <Calendar size={18} />
              <span>Agendar Faxina</span>
            </button>
          </div>
        </div>
      </div>

      {/* Checklist dos 9 Serviços Inclusos do Catálogo */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={20} color="var(--primary-400)" />
          <span>Serviços Oferecidos neste Pacote (Catálogo Limpeza Express SP)</span>
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Todos os 9 itens inclusos em qualquer plano (Semanal, Quinzenal ou Mensal):
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {checklist.map(item => (
            <div 
              key={item.id} 
              style={{ 
                background: 'var(--bg-input)', 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}
            >
              <strong style={{ fontSize: '0.9rem', color: 'var(--primary-400)', display: 'block', marginBottom: '0.25rem' }}>
                {item.id}. {item.item}
              </strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {item.detalhe}
              </p>
            </div>
          ))}
        </div>

        {/* Avisos Oficiais */}
        <div style={{ 
          marginTop: '1.25rem', 
          padding: '1rem', 
          background: 'rgba(244, 63, 94, 0.06)', 
          border: '1px solid rgba(244, 63, 94, 0.25)', 
          borderRadius: 'var(--radius-md)',
          fontSize: '0.825rem',
          color: 'var(--text-secondary)'
        }}>
          <strong style={{ color: '#fb7185', display: 'block', marginBottom: '0.25rem' }}>
            ⚠️ Avisos Importantes do Catálogo:
          </strong>
          <div>• Limpeza de apartamento sem manutenção há mais de 2 meses: taxa adicional de R$ 50,00.</div>
          <div>• Cancelamento: avisar com 48hs de antecedência ou será cobrado 50% da reserva!</div>
        </div>
      </div>
    </div>
  );
};
