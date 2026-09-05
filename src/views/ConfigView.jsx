import React, { useState } from 'react';
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
  Trash2
} from 'lucide-react';

export const ConfigView = () => {
  const { 
    exportBackup, 
    importBackup, 
    resetDemo, 
    limparTodosOsDados, 
    limparApenasAgendamentos, 
    showToast 
  } = useApp();
  const [copiadoSql, setCopiadoSql] = useState(false);

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
    </div>
  );
};
