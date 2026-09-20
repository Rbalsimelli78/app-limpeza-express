import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  FileSpreadsheet, 
  Printer, 
  Lock, 
  Unlock, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Info, 
  ShoppingBag, 
  Wrench, 
  Building2, 
  Layers, 
  Edit, 
  Trash2,
  Users,
  UserCheck,
  ShieldCheck,
  Percent,
  Sparkles,
  Filter
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ModalDespesa } from '../components/ModalDespesa';
import { exportFechamentoMesXlsx, exportComparativoPeriodoXlsx } from '../utils/exportExcel';
import { imprimirFechamentoMes, imprimirComparativoPeriodo } from '../utils/printStatement';

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const FechamentoView = () => {
  const { 
    agendamentos, 
    clientes, 
    ajudantes, 
    planos, 
    despesas, 
    mesesFechados, 
    fecharMes, 
    reabrirMes, 
    deleteDespesa, 
    showToast 
  } = useApp();

  // Estados de Navegação e Filtros
  const [dataCompetencia, setDataCompetencia] = useState(() => {
    const hoje = new Date();
    return { ano: hoje.getFullYear(), mes: hoje.getMonth() };
  });

  const [modoAba, setModoAba] = useState('fechamento'); // 'fechamento' | 'comparativo'
  const [modoVisao, setModoVisao] = useState('projecao'); // 'concluidos' (Apenas Realizado) | 'projecao' (Todos com Projeções)
  
  // Filtro de Período Flexível (pode analisar de qualquer Mês/Ano até qualquer Mês/Ano)
  const [mesInicioFiltro, setMesInicioFiltro] = useState(() => {
    const hoje = new Date();
    return { ano: hoje.getFullYear(), mes: 0 }; // Janeiro do ano atual
  });
  const [mesFimFiltro, setMesFimFiltro] = useState(() => {
    const hoje = new Date();
    return { ano: hoje.getFullYear(), mes: 11 }; // Dezembro do ano atual
  });

  // Controle de Drilldowns expansíveis por id
  const [clientesExpandidos, setClientesExpandidos] = useState({});
  const [ajudantesExpandidas, setAjudantesExpandidas] = useState({});

  // Controle do Modal de Despesas
  const [modalDespesaOpen, setModalDespesaOpen] = useState(false);
  const [despesaParaEditar, setDespesaParaEditar] = useState(null);

  // String de competência no formato YYYY-MM
  const mesAnoStr = useMemo(() => {
    const m = String(dataCompetencia.mes + 1).padStart(2, '0');
    return `${dataCompetencia.ano}-${m}`;
  }, [dataCompetencia]);

  const mesExtenso = useMemo(() => {
    return `${MESES_NOMES[dataCompetencia.mes]} de ${dataCompetencia.ano}`;
  }, [dataCompetencia]);

  // Status de fechamento do mês
  const statusMesFechado = mesesFechados[mesAnoStr];
  const isMesFechado = !!statusMesFechado?.fechado;

  // Navegação entre meses
  const irMesAnterior = () => {
    setDataCompetencia(prev => {
      if (prev.mes === 0) return { ano: prev.ano - 1, mes: 11 };
      return { ano: prev.ano, mes: prev.mes - 1 };
    });
  };

  const irProximoMes = () => {
    setDataCompetencia(prev => {
      if (prev.mes === 11) return { ano: prev.ano + 1, mes: 0 };
      return { ano: prev.ano, mes: prev.mes + 1 };
    });
  };

  const irMesAtual = () => {
    const hoje = new Date();
    setDataCompetencia({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  };

  // Alternadores de Drilldown
  const toggleCliente = (id) => {
    setClientesExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAjudante = (id) => {
    setAjudantesExpandidas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // =========================================================================
  // PROCESSAMENTO DE DADOS DO MÊS SELECIONADO
  // =========================================================================

  // 1. Filtra agendamentos do mês de acordo com o modo (Realizado vs Projeção)
  const agendamentosDoMes = useMemo(() => {
    return agendamentos.filter(ag => {
      if (!ag.dataHoraInicio) return false;
      if (ag.statusServico === 'cancelado') return false;

      const d = new Date(ag.dataHoraInicio);
      const bateAno = d.getFullYear() === dataCompetencia.ano;
      const bateMes = d.getMonth() === dataCompetencia.mes;
      if (!bateAno || !bateMes) return false;

      // Se modo for "Apenas Realizado", só inclui concluídos
      if (modoVisao === 'concluidos') {
        return ag.statusServico === 'concluido';
      }

      return true;
    });
  }, [agendamentos, dataCompetencia, modoVisao]);

  // 2. Consolidação de Receitas por Cliente e Condomínio (com lista individual de limpezas)
  const clientesDetalhados = useMemo(() => {
    const map = {};

    agendamentosDoMes.forEach(ag => {
      const cli = clientes.find(c => c.id === ag.clienteId);
      const cliId = ag.clienteId || 'sem_cliente';
      const cliNome = cli?.nome || 'Cliente Diversos';
      const condominio = cli?.condominio || cli?.bairro || 'São Paulo';
      const plano = planos.find(p => p.id === ag.planoId);

      if (!map[cliId]) {
        map[cliId] = {
          clienteId: cliId,
          nome: cliNome,
          condominio,
          bairro: cli?.bairro || '',
          qtdLimpezas: 0,
          valorTotal: 0,
          valorPago: 0,
          valorPendente: 0,
          limpezas: []
        };
      }

      const val = Number(ag.valorCliente || 0);
      map[cliId].qtdLimpezas += 1;
      map[cliId].valorTotal += val;
      if (ag.statusClientePagamento === 'pago') {
        map[cliId].valorPago += val;
      } else {
        map[cliId].valorPendente += val;
      }

      map[cliId].limpezas.push({
        id: ag.id,
        dataHoraInicio: ag.dataHoraInicio,
        planoNome: plano?.nome || 'Limpeza Residencial',
        dormitorios: ag.dormitorios || 2,
        valorCliente: val,
        statusServico: ag.statusServico,
        statusPagamento: ag.statusClientePagamento,
        ajudantesNomes: (ag.ajudantesEscaladas || []).map(ae => {
          const aj = ajudantes.find(a => a.id === ae.ajudanteId);
          return aj?.nome || 'Ajudante';
        }).join(', ')
      });
    });

    // Ordena limpezas de cada cliente por data
    Object.values(map).forEach(c => {
      c.limpezas.sort((a, b) => new Date(a.dataHoraInicio) - new Date(b.dataHoraInicio));
    });

    // Ordena clientes por maior faturamento
    return Object.values(map).sort((a, b) => b.valorTotal - a.valorTotal);
  }, [agendamentosDoMes, clientes, ajudantes, planos]);

  // 3. Consolidação de Despesas Diretas com Diárias por Ajudante (com lista de atendimentos)
  const ajudantesDetalhadas = useMemo(() => {
    const map = {};

    agendamentosDoMes.forEach(ag => {
      const cli = clientes.find(c => c.id === ag.clienteId);
      const predio = cli?.condominio || cli?.bairro || 'São Paulo';

      (ag.ajudantesEscaladas || []).forEach(ae => {
        const aj = ajudantes.find(a => a.id === ae.ajudanteId);
        const ajId = ae.ajudanteId || 'sem_ajudante';
        const ajNome = aj?.nome || 'Ajudante';
        const valorDiaria = Number(ae.valorAPagar || 0);

        if (!map[ajId]) {
          map[ajId] = {
            ajudanteId: ajId,
            nome: ajNome,
            prediosSet: new Set(),
            qtdLimpezas: 0,
            totalDiarias: 0,
            diariasPagas: 0,
            diariasPendentes: 0,
            atendimentos: []
          };
        }

        map[ajId].qtdLimpezas += 1;
        map[ajId].totalDiarias += valorDiaria;
        map[ajId].prediosSet.add(predio);

        if (ae.statusPagamento === 'pago') {
          map[ajId].diariasPagas += valorDiaria;
        } else {
          map[ajId].diariasPendentes += valorDiaria;
        }

        map[ajId].atendimentos.push({
          agendamentoId: ag.id,
          dataHora: ag.dataHoraInicio,
          clienteNome: cli?.nome || 'Cliente',
          condominio: predio,
          valorDiaria,
          statusServico: ag.statusServico,
          statusPagamento: ae.statusPagamento
        });
      });
    });

    // Converte Set de prédios em string legível e ordena atendimentos
    return Object.values(map).map(a => {
      a.predios = Array.from(a.prediosSet).join(', ');
      a.atendimentos.sort((x, y) => new Date(x.dataHora) - new Date(y.dataHora));
      return a;
    }).sort((a, b) => b.totalDiarias - a.totalDiarias);
  }, [agendamentosDoMes, clientes, ajudantes]);

  // 4. Despesas do Mês (Insumos, Equipamentos, Impostos, Fixas)
  const despesasDoMes = useMemo(() => {
    return despesas.filter(d => {
      if (d.mesReferencia) return d.mesReferencia === mesAnoStr;
      if (d.data) return d.data.startsWith(mesAnoStr);
      return false;
    });
  }, [despesas, mesAnoStr]);

  // Separação em grupos para a DRE
  const impostosDetalhados = useMemo(() => {
    return despesasDoMes.filter(d => d.tipoMacro === 'imposto');
  }, [despesasDoMes]);

  const insumosDetalhados = useMemo(() => {
    return despesasDoMes.filter(d => d.tipoMacro === 'insumo');
  }, [despesasDoMes]);

  const investimentosDetalhados = useMemo(() => {
    return despesasDoMes.filter(d => d.tipoMacro === 'investimento');
  }, [despesasDoMes]);

  const outrasDespesasDetalhadas = useMemo(() => {
    return despesasDoMes.filter(d => d.tipoMacro === 'fixa' || d.tipoMacro === 'outro');
  }, [despesasDoMes]);

  // 5. CÁLCULO COMPLETO DA DRE GERENCIAL DO MÊS
  const dre = useMemo(() => {
    // 1. Receita Bruta
    const receitaBruta = clientesDetalhados.reduce((acc, c) => acc + c.valorTotal, 0);
    const totalLimpezas = clientesDetalhados.reduce((acc, c) => acc + c.qtdLimpezas, 0);

    // 2. Deduções / Impostos
    const totalImpostos = impostosDetalhados.reduce((acc, d) => acc + Number(d.valor || 0), 0);

    // 3. Receita Líquida
    const receitaLiquida = Math.max(0, receitaBruta - totalImpostos);

    // 4. Custos Diretos com Colaboradoras (Diárias)
    const custoAjudantes = ajudantesDetalhadas.reduce((acc, a) => acc + a.totalDiarias, 0);
    const totalLimpezasEquipe = ajudantesDetalhadas.reduce((acc, a) => acc + a.qtdLimpezas, 0);

    // 5. Margem de Contribuição
    const margemContribuicao = receitaBruta - custoAjudantes - totalImpostos;
    const margemContribuicaoPct = receitaBruta > 0 ? (margemContribuicao / receitaBruta) * 100 : 0;

    // 6. Gastos Operacionais e Insumos
    const totalInsumos = insumosDetalhados.reduce((acc, d) => acc + Number(d.valor || 0), 0);

    // 7. Investimentos em Equipamentos
    const totalInvestimentos = investimentosDetalhados.reduce((acc, d) => acc + Number(d.valor || 0), 0);

    // 8. Despesas Fixas e Outras
    const totalOutras = outrasDespesasDetalhadas.reduce((acc, d) => acc + Number(d.valor || 0), 0);

    const totalGastosOperacionais = totalInsumos + totalInvestimentos + totalOutras;

    // 9. Lucro Líquido Real (Sobra de Caixa)
    const lucroLiquido = margemContribuicao - totalGastosOperacionais;
    const margemLiquidaPct = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

    return {
      receitaBruta,
      totalLimpezas,
      totalImpostos,
      receitaLiquida,
      custoAjudantes,
      totalLimpezasEquipe,
      margemContribuicao,
      margemContribuicaoPct,
      totalInsumos,
      totalInvestimentos,
      totalOutras,
      totalGastosOperacionais,
      lucroLiquido,
      margemLiquidaPct
    };
  }, [clientesDetalhados, ajudantesDetalhadas, impostosDetalhados, insumosDetalhados, investimentosDetalhados, outrasDespesasDetalhadas]);

  // Ações de Trava de Mês
  const handleToggleTrava = () => {
    if (isMesFechado) {
      if (window.confirm(`Deseja reabrir o mês de ${mesExtenso} para novos lançamentos e edições?`)) {
        reabrirMes(mesAnoStr);
      }
    } else {
      if (window.confirm(`Deseja fechar e auditar o mês de ${mesExtenso}? Os lançamentos existentes serão protegidos contra edições acidentais.`)) {
        fecharMes(mesAnoStr);
      }
    }
  };

  // Ações de Exportação
  const handleExportarExcel = () => {
    exportFechamentoMesXlsx({
      mesAno: mesAnoStr,
      mesNome: mesExtenso,
      modoDescricao: modoVisao === 'concluidos' ? 'Apenas Realizado (Concluídos)' : 'Mês Completo (com Projeções)',
      dre,
      clientesDetalhados,
      ajudantesDetalhadas,
      impostosDetalhados,
      despesasDetalhadas: [...insumosDetalhados, ...investimentosDetalhados, ...outrasDespesasDetalhadas]
    });
  };

  const handleImprimir = () => {
    imprimirFechamentoMes({
      mesAno: mesAnoStr,
      mesNome: mesExtenso,
      modoDescricao: modoVisao === 'concluidos' ? 'Apenas Realizado (Concluídos)' : 'Mês Completo (com Projeções)',
      isFechado: isMesFechado,
      fechadoInfo: statusMesFechado,
      dre,
      clientesDetalhados,
      ajudantesDetalhadas,
      impostosDetalhados,
      despesasDetalhadas: [...insumosDetalhados, ...investimentosDetalhados, ...outrasDespesasDetalhadas]
    });
  };

  // =========================================================================
  // DADOS PARA O COMPARATIVO POR PERÍODO (ANUAL OU INTERVALO PERSONALIZADO)
  // =========================================================================
  const dadosComparativoPeriodo = useMemo(() => {
    let startTotal = mesInicioFiltro.ano * 12 + mesInicioFiltro.mes;
    let endTotal = mesFimFiltro.ano * 12 + mesFimFiltro.mes;

    // Normaliza caso início seja posterior ao fim
    if (startTotal > endTotal) {
      const tmp = startTotal;
      startTotal = endTotal;
      endTotal = tmp;
    }

    const meses = [];
    const anoInicial = Math.floor(startTotal / 12);
    const anoFinal = Math.floor(endTotal / 12);
    const cruzaAnos = anoInicial !== anoFinal;

    for (let t = startTotal; t <= endTotal; t++) {
      const ano = Math.floor(t / 12);
      const m = t % 12;
      const mesStr = `${ano}-${String(m + 1).padStart(2, '0')}`;
      
      // Nome curto com ano caso cruze múltiplos anos (ex: Nov/26, Mar/27)
      const nomeCurto = cruzaAnos 
        ? `${MESES_NOMES[m].substring(0, 3)}/${String(ano).slice(2)}`
        : MESES_NOMES[m].substring(0, 3);
      
      const nomeCompleto = `${MESES_NOMES[m]} de ${ano}`;

      // Agendamentos deste mês
      const ags = agendamentos.filter(ag => {
        if (!ag.dataHoraInicio || ag.statusServico === 'cancelado') return false;
        const d = new Date(ag.dataHoraInicio);
        return d.getFullYear() === ano && d.getMonth() === m;
      });

      const recBruta = ags.reduce((sum, ag) => sum + Number(ag.valorCliente || 0), 0);
      const totalLimpezas = ags.length;

      // Diárias da equipe
      let custoAj = 0;
      ags.forEach(ag => {
        (ag.ajudantesEscaladas || []).forEach(ae => {
          custoAj += Number(ae.valorAPagar || 0);
        });
      });

      // Despesas do mês
      const desps = despesas.filter(d => {
        if (d.mesReferencia) return d.mesReferencia === mesStr;
        if (d.data) return d.data.startsWith(mesStr);
        return false;
      });

      const impostos = desps.filter(d => d.tipoMacro === 'imposto').reduce((sum, d) => sum + Number(d.valor || 0), 0);
      const insumos = desps.filter(d => d.tipoMacro === 'insumo').reduce((sum, d) => sum + Number(d.valor || 0), 0);
      const invest = desps.filter(d => d.tipoMacro === 'investimento').reduce((sum, d) => sum + Number(d.valor || 0), 0);
      const outras = desps.filter(d => d.tipoMacro === 'fixa' || d.tipoMacro === 'outro').reduce((sum, d) => sum + Number(d.valor || 0), 0);

      const margemCont = recBruta - custoAj - impostos;
      const margemContPct = recBruta > 0 ? (margemCont / recBruta) * 100 : 0;
      const gastosTotal = insumos + invest + outras;
      const totalDespesasMes = custoAj + impostos + gastosTotal;
      const lucro = margemCont - gastosTotal;
      const lucroPct = recBruta > 0 ? (lucro / recBruta) * 100 : 0;

      meses.push({
        ano,
        mesIndex: m,
        nomeCurto,
        nomeCompleto,
        mesAno: mesStr,
        totalLimpezas,
        recBruta,
        custoAj,
        impostos,
        margemCont,
        margemContPct,
        insumos,
        invest,
        outras,
        gastosTotal,
        totalDespesasMes,
        lucro,
        lucroPct,
        isFechado: !!mesesFechados[mesStr]?.fechado
      });
    }

    const totalAnoRecBruta = meses.reduce((sum, m) => sum + m.recBruta, 0);
    const totalAnoCustoAj = meses.reduce((sum, m) => sum + m.custoAj, 0);
    const totalAnoImpostos = meses.reduce((sum, m) => sum + m.impostos, 0);
    const totalInsumos = meses.reduce((sum, m) => sum + m.insumos, 0);
    const totalInvest = meses.reduce((sum, m) => sum + m.invest, 0);
    const totalOutras = meses.reduce((sum, m) => sum + m.outras, 0);
    const totalAnoMargemCont = totalAnoRecBruta - totalAnoCustoAj - totalAnoImpostos;
    const totalAnoGastos = totalInsumos + totalInvest + totalOutras;
    const totalGeralDespesas = totalAnoCustoAj + totalAnoImpostos + totalAnoGastos;
    const totalAnoLucro = totalAnoMargemCont - totalAnoGastos;
    const totalAnoLimpezas = meses.reduce((sum, m) => sum + m.totalLimpezas, 0);

    // Descrição do período
    const mesIniIdx = startTotal % 12;
    const anoIniVal = Math.floor(startTotal / 12);
    const mesFimIdx = endTotal % 12;
    const anoFimVal = Math.floor(endTotal / 12);

    let periodoDesc = '';
    if (anoIniVal === anoFimVal) {
      if (mesIniIdx === 0 && mesFimIdx === 11) {
        periodoDesc = `Janeiro a Dezembro de ${anoIniVal}`;
      } else if (mesIniIdx === mesFimIdx) {
        periodoDesc = `${MESES_NOMES[mesIniIdx]} de ${anoIniVal}`;
      } else {
        periodoDesc = `${MESES_NOMES[mesIniIdx]} a ${MESES_NOMES[mesFimIdx]} de ${anoIniVal}`;
      }
    } else {
      periodoDesc = `${MESES_NOMES[mesIniIdx]}/${anoIniVal} a ${MESES_NOMES[mesFimIdx]}/${anoFimVal}`;
    }

    return {
      meses,
      periodoDesc,
      totais: {
        totalAnoRecBruta,
        totalAnoCustoAj,
        totalAnoImpostos,
        totalInsumos,
        totalInvest,
        totalOutras,
        totalAnoMargemCont,
        totalAnoMargemContPct: totalAnoRecBruta > 0 ? (totalAnoMargemCont / totalAnoRecBruta) * 100 : 0,
        totalAnoGastos,
        totalGeralDespesas,
        totalAnoLucro,
        totalAnoLucroPct: totalAnoRecBruta > 0 ? (totalAnoLucro / totalAnoRecBruta) * 100 : 0,
        totalAnoLimpezas
      }
    };
  }, [mesInicioFiltro, mesFimFiltro, agendamentos, despesas, mesesFechados]);

  // Ações de Exportação do Comparativo por Período
  const handleExportarExcelComparativo = () => {
    exportComparativoPeriodoXlsx({
      periodoDesc: dadosComparativoPeriodo.periodoDesc,
      meses: dadosComparativoPeriodo.meses,
      totais: dadosComparativoPeriodo.totais
    });
  };

  const handleImprimirComparativo = () => {
    imprimirComparativoPeriodo({
      periodoDesc: dadosComparativoPeriodo.periodoDesc,
      meses: dadosComparativoPeriodo.meses,
      totais: dadosComparativoPeriodo.totais
    });
  };

  // Funções de Presets de Período
  const aplicarPresetAno = (ano) => {
    setMesInicioFiltro({ ano, mes: 0 });
    setMesFimFiltro({ ano, mes: 11 });
  };

  const aplicarPresetUltimos6 = () => {
    const h = new Date();
    const fim = { ano: h.getFullYear(), mes: h.getMonth() };
    let aIni = h.getFullYear();
    let mIni = h.getMonth() - 5;
    if (mIni < 0) {
      aIni -= 1;
      mIni += 12;
    }
    setMesInicioFiltro({ ano: aIni, mes: mIni });
    setMesFimFiltro(fim);
  };

  const aplicarPresetUltimos12 = () => {
    const h = new Date();
    const fim = { ano: h.getFullYear(), mes: h.getMonth() };
    let aIni = h.getFullYear();
    let mIni = h.getMonth() - 11;
    if (mIni < 0) {
      aIni -= 1;
      mIni += 12;
    }
    setMesInicioFiltro({ ano: aIni, mes: mIni });
    setMesFimFiltro(fim);
  };

  const aplicarPresetNov26Mar27 = () => {
    setMesInicioFiltro({ ano: 2026, mes: 10 }); // Nov 2026
    setMesFimFiltro({ ano: 2027, mes: 2 });  // Mar 2027
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* 1. SELETOR DE ABA PRINCIPAL (FECHAMENTO MENSAL vs COMPARATIVO ANUAL) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setModoAba('fechamento')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: modoAba === 'fechamento' ? 'var(--primary-500)' : 'transparent',
              color: modoAba === 'fechamento' ? '#fff' : 'var(--text-secondary)',
              fontWeight: modoAba === 'fechamento' ? '700' : '500',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s'
            }}
          >
            <Calendar size={16} />
            <span>Fechamento do Mês (DRE)</span>
          </button>

          <button
            onClick={() => setModoAba('comparativo')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: modoAba === 'comparativo' ? 'var(--primary-500)' : 'transparent',
              color: modoAba === 'comparativo' ? '#fff' : 'var(--text-secondary)',
              fontWeight: modoAba === 'comparativo' ? '700' : '500',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s'
            }}
          >
            <BarChart3 size={16} />
            <span>Comparativo por Período & Anual</span>
          </button>
        </div>

        {/* Botões Globais de Ação (contextuais de acordo com a aba selecionada) */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setDespesaParaEditar(null);
              setModalDespesaOpen(true);
            }}
            disabled={isMesFechado}
            className="btn btn-primary"
            style={{ gap: '0.4rem', fontSize: '0.85rem' }}
            title={isMesFechado ? 'Mês fechado para alterações' : 'Lançar compra de produtos, máquinas ou impostos'}
          >
            <Plus size={16} />
            <span>+ Lançar Compra / Despesa</span>
          </button>

          <button
            onClick={modoAba === 'fechamento' ? handleExportarExcel : handleExportarExcelComparativo}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.4rem' }}
            title={modoAba === 'fechamento' ? "Baixar planilha Excel (.xlsx) com a DRE do mês formatada" : "Baixar planilha Excel (.xlsx) com o Comparativo Financeiro por Período"}
          >
            <FileSpreadsheet size={15} color="#10b981" />
            <span>{modoAba === 'fechamento' ? 'Excel Fechamento (.xlsx)' : 'Excel Comparativo (.xlsx)'}</span>
          </button>

          <button
            onClick={modoAba === 'fechamento' ? handleImprimir : handleImprimirComparativo}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.4rem' }}
            title={modoAba === 'fechamento' ? "Imprimir extrato de fechamento do mês em formato A4 / PDF" : "Imprimir relatório comparativo por período em formato A4 / PDF"}
          >
            <Printer size={15} color="#60a5fa" />
            <span>{modoAba === 'fechamento' ? 'Imprimir / PDF' : 'Imprimir Comparativo (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ABA 1: FECHAMENTO DO MÊS INDIVIDUAL */}
      {/* ===================================================================== */}
      {modoAba === 'fechamento' && (
        <>
          {/* BARRA SUPERIOR DE CONTROLE (SELETOR DE MODO REALIZADO VS PROJEÇÃO & NAVEGADOR DE MÊS) */}
          <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              
              {/* Seletor Visual Explícito: REALIZADO vs PROJEÇÃO */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Modo de Análise:
                </span>
                <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setModoVisao('concluidos')}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: modoVisao === 'concluidos' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                      color: modoVisao === 'concluidos' ? '#34d399' : 'var(--text-muted)',
                      fontWeight: modoVisao === 'concluidos' ? '700' : '500',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.2s',
                      boxShadow: modoVisao === 'concluidos' ? '0 0 10px rgba(16, 185, 129, 0.2)' : 'none'
                    }}
                    title="Considera estritamente o que já foi executado/concluído até a data de hoje"
                  >
                    <CheckCircle size={14} />
                    <span>✓ Apenas Realizado (Concluídos)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModoVisao('projecao')}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: modoVisao === 'projecao' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                      color: modoVisao === 'projecao' ? '#60a5fa' : 'var(--text-muted)',
                      fontWeight: modoVisao === 'projecao' ? '700' : '500',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.2s',
                      boxShadow: modoVisao === 'projecao' ? '0 0 10px rgba(59, 130, 246, 0.2)' : 'none'
                    }}
                    title="Considera todas as limpezas programadas até o último dia do mês para projetar o fechamento"
                  >
                    <Clock size={14} />
                    <span>📅 Mês Todo (Com Projeções)</span>
                  </button>
                </div>
              </div>

              {/* Navegação de Mês & Botão de Trava de Segurança */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-card)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <button 
                    onClick={irMesAnterior}
                    className="btn-icon" 
                    style={{ padding: '0.4rem' }}
                    title="Mês Anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <span style={{ fontSize: '0.95rem', fontWeight: '700', padding: '0 0.75rem', color: 'var(--text-primary)', minWidth: '150px', textAlign: 'center' }}>
                    {mesExtenso}
                  </span>

                  <button 
                    onClick={irProximoMes}
                    className="btn-icon" 
                    style={{ padding: '0.4rem' }}
                    title="Próximo Mês"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <button
                  onClick={irMesAtual}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                  title="Voltar para o mês corrente"
                >
                  Mês Atual
                </button>

                {/* Botão de Fechar / Reabrir Mês */}
                <button
                  onClick={handleToggleTrava}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: isMesFechado ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                    background: isMesFechado ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                    color: isMesFechado ? 'var(--primary-400)' : '#fbbf24',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                  title={isMesFechado ? 'Clique para reabrir este mês e permitir novas despesas' : 'Clique para fechar este mês e travar contra edições acidentais'}
                >
                  {isMesFechado ? <Lock size={15} /> : <Unlock size={15} />}
                  <span>{isMesFechado ? 'Mês Fechado & Auditado' : 'Fechar Mês'}</span>
                </button>
              </div>
            </div>

            {/* Banner de Mês Fechado */}
            {isMesFechado && (
              <div style={{
                marginTop: '0.85rem',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: 'var(--primary-400)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={16} />
                  <span>
                    Este mês foi <strong>fechado e protegido</strong> por <strong>{statusMesFechado.fechadoPor || 'Administradora'}</strong> em {new Date(statusMesFechado.fechadoEm).toLocaleDateString('pt-BR')}. Edições acidentais estão bloqueadas.
                  </span>
                </span>
                <button
                  onClick={handleToggleTrava}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-300)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: '600'
                  }}
                >
                  Reabrir para ajustes
                </button>
              </div>
            )}
          </div>

          {/* 2. CARDS DE KPIS MACRO EXECUTIVOS (VISÃO RÁPIDA DE DECISÃO) */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
            gap: '0.85rem', 
            marginBottom: '1.25rem' 
          }}>
            {/* Card 1: Faturamento Bruto */}
            <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid var(--primary-500)' }}>
              <span className="kpi-label" style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
                Faturamento Bruto
              </span>
              <div style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--primary-400)', margin: '0.2rem 0' }}>
                {formatCurrency(dre.receitaBruta)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {dre.totalLimpezas} limpezas ({modoVisao === 'concluidos' ? 'realizadas' : 'no mês'})
              </span>
            </div>

            {/* Card 2: Custos de Diárias */}
            <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid #f87171' }}>
              <span className="kpi-label" style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
                Diárias da Equipe
              </span>
              <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#f87171', margin: '0.2rem 0' }}>
                {formatCurrency(dre.custoAjudantes)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Consome <strong>{dre.receitaBruta > 0 ? ((dre.custoAjudantes / dre.receitaBruta) * 100).toFixed(1) : 0}%</strong> da receita
              </span>
            </div>

            {/* Card 3: Margem de Contribuição (KPI ESTRELA) */}
            <div className="glass-card" style={{ 
              padding: '1rem', 
              borderLeft: '4px solid #f59e0b',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(16, 185, 129, 0.08))' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-label" style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: '#fbbf24', fontWeight: '700' }}>
                  Margem de Contribuição
                </span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 6px', 
                  borderRadius: '10px', 
                  background: dre.margemContribuicaoPct >= 30 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: dre.margemContribuicaoPct >= 30 ? 'var(--primary-400)' : '#f87171',
                  fontWeight: '700'
                }}>
                  {dre.margemContribuicaoPct.toFixed(1)}%
                </span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#fbbf24', margin: '0.2rem 0' }}>
                {formatCurrency(dre.margemContribuicao)}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Sobra pós diárias e impostos (-{formatCurrency(dre.totalImpostos)})
              </span>
            </div>

            {/* Card 4: Gastos Operacionais & Insumos */}
            <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid #a855f7' }}>
              <span className="kpi-label" style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
                Insumos & Compras
              </span>
              <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#c084fc', margin: '0.2rem 0' }}>
                {formatCurrency(dre.totalGastosOperacionais)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Produtos: {formatCurrency(dre.totalInsumos)} {dre.totalInvestimentos > 0 ? `• Máquinas: ${formatCurrency(dre.totalInvestimentos)}` : ''}
              </span>
            </div>

            {/* Card 5: Lucro Líquido Real (Sobra no Bolso) */}
            <div className="glass-card" style={{ 
              padding: '1rem', 
              borderLeft: '4px solid #3b82f6',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-label" style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: '#60a5fa', fontWeight: '700' }}>
                  Lucro Líquido Real
                </span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 6px', 
                  borderRadius: '10px', 
                  background: dre.lucroLiquido >= 0 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: dre.lucroLiquido >= 0 ? '#60a5fa' : '#f87171',
                  fontWeight: '700'
                }}>
                  {dre.margemLiquidaPct.toFixed(1)}% líquido
                </span>
              </div>
              <div style={{ fontSize: '1.55rem', fontWeight: '800', color: dre.lucroLiquido >= 0 ? '#60a5fa' : '#f87171', margin: '0.2rem 0' }}>
                {formatCurrency(dre.lucroLiquido)}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {dre.lucroLiquido >= 0 ? '💰 Sobra limpa no bolso no mês' : '⚠️ Déficit no fechamento'}
              </span>
            </div>
          </div>

          {/* 3. ESTRUTURA CASCATA DA DRE GERENCIAL (O ESQUELETO CLÁSSICO) */}
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--primary-400)" />
              <span>Demonstrativo do Resultado do Exercício (DRE Gerencial Passo a Passo)</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
              {/* Linha 1: Receita Bruta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                <span><strong>(+) 1. Receita Bruta Total</strong> (Faturamento dos Serviços de Limpeza)</span>
                <span style={{ fontWeight: '700', color: 'var(--primary-400)' }}>
                  {formatCurrency(dre.receitaBruta)} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(100%)</span>
                </span>
              </div>

              {/* Linha 2: Deduções e Impostos */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', color: '#f87171' }}>
                <span><strong>(-) 2. Deduções da Receita Bruta</strong> (Simples Nacional, DAS MEI e Taxas)</span>
                <span style={{ fontWeight: '600' }}>
                  - {formatCurrency(dre.totalImpostos)} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({dre.receitaBruta > 0 ? ((dre.totalImpostos / dre.receitaBruta) * 100).toFixed(1) : 0}%)</span>
                </span>
              </div>

              {/* Linha 3: Receita Líquida */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontWeight: '600' }}>
                <span><strong>(=) 3. Receita Líquida dos Serviços</strong></span>
                <span>{formatCurrency(dre.receitaLiquida)}</span>
              </div>

              {/* Linha 4: Custos Variáveis (Diárias) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', color: '#f87171' }}>
                <span><strong>(-) 4. Custos Variáveis dos Serviços</strong> (Diárias Pagas às Ajudantes/Colaboradoras)</span>
                <span style={{ fontWeight: '600' }}>
                  - {formatCurrency(dre.custoAjudantes)} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({dre.receitaBruta > 0 ? ((dre.custoAjudantes / dre.receitaBruta) * 100).toFixed(1) : 0}%)</span>
                </span>
              </div>

              {/* Linha 5: Margem de Contribuição (DESTAQUE) */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '0.75rem 1rem', 
                background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15), rgba(16, 185, 129, 0.15))', 
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)', 
                fontWeight: '800',
                color: '#fbbf24',
                fontSize: '0.95rem'
              }}>
                <span>(=) 5. MARGEM DE CONTRIBUIÇÃO (O que sobra dos serviços para pagar insumos e lucrar)</span>
                <span>{formatCurrency(dre.margemContribuicao)} ({dre.margemContribuicaoPct.toFixed(1)}%)</span>
              </div>

              {/* Linha 6: Insumos e Produtos */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', color: '#c084fc' }}>
                <span><strong>(-) 6. Gastos com Insumos & Produtos de Limpeza</strong> (Álcool, panos, vassouras, sacos)</span>
                <span style={{ fontWeight: '600' }}>
                  - {formatCurrency(dre.totalInsumos)} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({dre.receitaBruta > 0 ? ((dre.totalInsumos / dre.receitaBruta) * 100).toFixed(1) : 0}%)</span>
                </span>
              </div>

              {/* Linha 7: Investimentos em Equipamentos */}
              {dre.totalInvestimentos > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', color: '#60a5fa' }}>
                  <span><strong>(-) 7. Investimentos em Ativos & Equipamentos</strong> (Aspirador novo, extratora, escada)</span>
                  <span style={{ fontWeight: '600' }}>
                    - {formatCurrency(dre.totalInvestimentos)} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({dre.receitaBruta > 0 ? ((dre.totalInvestimentos / dre.receitaBruta) * 100).toFixed(1) : 0}%)</span>
                  </span>
                </div>
              )}

              {/* Linha 8: Outras Despesas */}
              {dre.totalOutras > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>
                  <span><strong>(-) 8. Despesas Operacionais / Administrativas</strong> (Transporte, internet, marketing)</span>
                  <span style={{ fontWeight: '600' }}>- {formatCurrency(dre.totalOutras)}</span>
                </div>
              )}

              {/* Linha 9: Resultado Líquido Final (LUCRO REAL) */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '0.85rem 1rem', 
                background: dre.lucroLiquido >= 0 ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2))' : 'rgba(239, 68, 68, 0.2)', 
                border: dre.lucroLiquido >= 0 ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 'var(--radius-md)', 
                fontWeight: '800',
                color: dre.lucroLiquido >= 0 ? '#60a5fa' : '#f87171',
                fontSize: '1.05rem',
                marginTop: '0.35rem'
              }}>
                <span>(=) 9. RESULTADO LÍQUIDO DO MÊS (LUCRO REAL / SOBRA DE CAIXA)</span>
                <span>{formatCurrency(dre.lucroLiquido)} ({dre.margemLiquidaPct.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* TABELA 1: RECEITAS POR CLIENTE E PRÉDIO (COM DRILLDOWN) */}
          {/* ================================================================= */}
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--primary-400)" />
                  <span>Receitas por Cliente e Condomínio/Prédio</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Clique no botão <strong>+</strong> para abrir a lista detalhada das limpezas de cada cliente
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Total: <strong>{dre.totalLimpezas} limpezas</strong> • <strong>{formatCurrency(dre.receitaBruta)}</strong>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.65rem 0.5rem', width: '40px' }}></th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Nome do Cliente</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Prédio / Condomínio</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>Qtd de Limpezas</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Ticket Médio</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Valor Total</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesDetalhados.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhum faturamento registrado para o mês de {mesExtenso} ({modoVisao === 'concluidos' ? 'com status Concluído' : 'agendado'}).
                      </td>
                    </tr>
                  ) : (
                    clientesDetalhados.map((c) => {
                      const isExp = !!clientesExpandidos[c.clienteId];
                      const ticketMedio = c.qtdLimpezas > 0 ? c.valorTotal / c.qtdLimpezas : 0;
                      const isTotalmentePago = c.valorPendente === 0 && c.valorTotal > 0;

                      return (
                        <React.Fragment key={c.clienteId}>
                          <tr 
                            style={{ 
                              borderBottom: '1px solid var(--border-color)',
                              background: isExp ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                              cursor: 'pointer',
                              transition: 'background 0.15s'
                            }}
                            onClick={() => toggleCliente(c.clienteId)}
                          >
                            <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                              <button
                                type="button"
                                style={{
                                  background: isExp ? 'var(--primary-500)' : 'var(--bg-input)',
                                  border: '1px solid var(--border-color)',
                                  color: isExp ? '#fff' : 'var(--text-primary)',
                                  borderRadius: '4px',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                              {c.nome}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)' }}>
                              {c.condominio}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: '700' }}>
                              {c.qtdLimpezas}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                              {formatCurrency(ticketMedio)}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: '700', color: 'var(--primary-400)' }}>
                              {formatCurrency(c.valorTotal)}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontWeight: '700',
                                background: isTotalmentePago ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: isTotalmentePago ? 'var(--primary-400)' : '#fbbf24'
                              }}>
                                {isTotalmentePago ? '100% Pago' : `Pendente: ${formatCurrency(c.valorPendente)}`}
                              </span>
                            </td>
                          </tr>

                          {/* SUBTABELA EXPANSÍVEL (DRILLDOWN DAS LIMPEZAS DO CLIENTE) */}
                          {isExp && (
                            <tr style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                              <td colSpan={7} style={{ padding: '0.75rem 1rem 1rem 3rem' }}>
                                <div style={{ borderLeft: '3px solid var(--primary-500)', paddingLeft: '0.75rem' }}>
                                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary-400)', fontWeight: '700', display: 'block', marginBottom: '0.45rem' }}>
                                    Detalhamento das Limpezas de {c.nome} em {mesExtenso}:
                                  </span>

                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                    <thead>
                                      <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                        <th style={{ padding: '4px 6px', textAlign: 'left' }}>Dia / Data</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'left' }}>Plano Contratado</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'left' }}>Equipe Escalada</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'right' }}>Valor</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'center' }}>Status Serviço</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'center' }}>Status Pagamento</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {c.limpezas.map((limp, idx) => {
                                        const dObj = new Date(limp.dataHoraInicio);
                                        const diaStr = dObj.getDate();
                                        const dataFormatada = dObj.toLocaleDateString('pt-BR');
                                        const horaStr = dObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                                        return (
                                          <tr key={limp.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                            <td style={{ padding: '6px' }}>
                                              <strong>Dia {diaStr}</strong> ({dataFormatada} às {horaStr})
                                            </td>
                                            <td style={{ padding: '6px', color: 'var(--text-secondary)' }}>
                                              {limp.planoNome} ({limp.dormitorios} dorms)
                                            </td>
                                            <td style={{ padding: '6px', color: 'var(--text-muted)' }}>
                                              {limp.ajudantesNomes || 'Sem equipe'}
                                            </td>
                                            <td style={{ padding: '6px', textAlign: 'right', fontWeight: '700', color: 'var(--primary-400)' }}>
                                              {formatCurrency(limp.valorCliente)}
                                            </td>
                                            <td style={{ padding: '6px', textAlign: 'center' }}>
                                              <span style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: limp.statusServico === 'concluido' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                color: limp.statusServico === 'concluido' ? 'var(--primary-400)' : '#60a5fa'
                                              }}>
                                                {limp.statusServico === 'concluido' ? 'Concluído' : 'Agendado'}
                                              </span>
                                            </td>
                                            <td style={{ padding: '6px', textAlign: 'center' }}>
                                              <span style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: limp.statusPagamento === 'pago' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                color: limp.statusPagamento === 'pago' ? 'var(--primary-400)' : '#fbbf24'
                                              }}>
                                                {limp.statusPagamento === 'pago' ? 'Pago' : 'Pendente'}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ 
                    borderTop: '2px solid var(--border-color)', 
                    background: 'rgba(245, 158, 11, 0.12)', 
                    fontWeight: '800' 
                  }}>
                    <td></td>
                    <td style={{ padding: '0.75rem', textTransform: 'uppercase' }}>TOTAL DE RECEITAS</td>
                    <td></td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{dre.totalLimpezas}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {dre.totalLimpezas > 0 ? formatCurrency(dre.receitaBruta / dre.totalLimpezas) : 'R$ 0,00'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--primary-400)', fontSize: '0.95rem' }}>
                      {formatCurrency(dre.receitaBruta)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ================================================================= */}
          {/* TABELA 2: CUSTOS COM DIÁRIAS (AJUDANTES) COM DRILLDOWN */}
          {/* ================================================================= */}
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck size={18} color="#f87171" />
                  <span>Despesas Diretas com a Equipe (Diárias das Ajudantes)</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Clique no botão <strong>+</strong> para abrir a relação de cada diária realizada pela colaboradora
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Total em Diárias: <strong style={{ color: '#f87171' }}>{formatCurrency(dre.custoAjudantes)}</strong> ({dre.receitaBruta > 0 ? ((dre.custoAjudantes / dre.receitaBruta) * 100).toFixed(1) : 0}% da receita)
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.65rem 0.5rem', width: '40px' }}></th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Nome da Ajudante</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Prédios / Condomínios Atendidos</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>Qtd de Limpezas</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Valor Total Diárias</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>% da Receita</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ajudantesDetalhadas.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhuma diária de colaboradora registrada para este mês.
                      </td>
                    </tr>
                  ) : (
                    ajudantesDetalhadas.map((a) => {
                      const isExp = !!ajudantesExpandidas[a.ajudanteId];
                      const pctReceita = dre.receitaBruta > 0 ? ((a.totalDiarias / dre.receitaBruta) * 100).toFixed(1) : '0,0';
                      const isTotalPago = a.diariasPendentes === 0 && a.totalDiarias > 0;

                      return (
                        <React.Fragment key={a.ajudanteId}>
                          <tr 
                            style={{ 
                              borderBottom: '1px solid var(--border-color)',
                              background: isExp ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                              cursor: 'pointer',
                              transition: 'background 0.15s'
                            }}
                            onClick={() => toggleAjudante(a.ajudanteId)}
                          >
                            <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                              <button
                                type="button"
                                style={{
                                  background: isExp ? '#f87171' : 'var(--bg-input)',
                                  border: '1px solid var(--border-color)',
                                  color: isExp ? '#fff' : 'var(--text-primary)',
                                  borderRadius: '4px',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                              {a.nome}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)' }}>
                              {a.predios}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: '700' }}>
                              {a.qtdLimpezas}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: '700', color: '#f87171' }}>
                              {formatCurrency(a.totalDiarias)}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                              {pctReceita}%
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontWeight: '700',
                                background: isTotalPago ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: isTotalPago ? 'var(--primary-400)' : '#fbbf24'
                              }}>
                                {isTotalPago ? '100% Pago' : `A Pagar: ${formatCurrency(a.diariasPendentes)}`}
                              </span>
                            </td>
                          </tr>

                          {/* SUBTABELA EXPANSÍVEL (DRILLDOWN DAS DIÁRIAS DA AJUDANTE) */}
                          {isExp && (
                            <tr style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                              <td colSpan={7} style={{ padding: '0.75rem 1rem 1rem 3rem' }}>
                                <div style={{ borderLeft: '3px solid #f87171', paddingLeft: '0.75rem' }}>
                                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#f87171', fontWeight: '700', display: 'block', marginBottom: '0.45rem' }}>
                                    Diárias Trabalhadas por {a.nome} em {mesExtenso}:
                                  </span>

                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                    <thead>
                                      <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                        <th style={{ padding: '4px 6px', textAlign: 'left' }}>Dia / Data</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'left' }}>Cliente Atendido</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'left' }}>Local / Condomínio</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'right' }}>Valor Diária</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'center' }}>Status Limpeza</th>
                                        <th style={{ padding: '4px 6px', textAlign: 'center' }}>Status Diária</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {a.atendimentos.map((at, idx) => {
                                        const dObj = new Date(at.dataHora);
                                        const diaStr = dObj.getDate();
                                        const dataFormatada = dObj.toLocaleDateString('pt-BR');

                                        return (
                                          <tr key={at.agendamentoId || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                            <td style={{ padding: '6px' }}>
                                              <strong>Dia {diaStr}</strong> ({dataFormatada})
                                            </td>
                                            <td style={{ padding: '6px', color: 'var(--text-primary)', fontWeight: '600' }}>
                                              {at.clienteNome}
                                            </td>
                                            <td style={{ padding: '6px', color: 'var(--text-secondary)' }}>
                                              {at.condominio}
                                            </td>
                                            <td style={{ padding: '6px', textAlign: 'right', fontWeight: '700', color: '#f87171' }}>
                                              {formatCurrency(at.valorDiaria)}
                                            </td>
                                            <td style={{ padding: '6px', textAlign: 'center' }}>
                                              <span style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: at.statusServico === 'concluido' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                color: at.statusServico === 'concluido' ? 'var(--primary-400)' : '#60a5fa'
                                              }}>
                                                {at.statusServico === 'concluido' ? 'Concluída' : 'Agendada'}
                                              </span>
                                            </td>
                                            <td style={{ padding: '6px', textAlign: 'center' }}>
                                              <span style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: at.statusPagamento === 'pago' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                color: at.statusPagamento === 'pago' ? 'var(--primary-400)' : '#fbbf24'
                                              }}>
                                                {at.statusPagamento === 'pago' ? 'Pago' : 'A Pagar'}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ 
                    borderTop: '2px solid var(--border-color)', 
                    background: 'rgba(239, 68, 68, 0.12)', 
                    fontWeight: '800' 
                  }}>
                    <td></td>
                    <td style={{ padding: '0.75rem', textTransform: 'uppercase' }}>TOTAL DE DIÁRIAS PAGAS / A PAGAR</td>
                    <td></td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{dre.totalLimpezasEquipe}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#f87171', fontSize: '0.95rem' }}>
                      {formatCurrency(dre.custoAjudantes)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {dre.receitaBruta > 0 ? ((dre.custoAjudantes / dre.receitaBruta) * 100).toFixed(1) : 0}%
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ================================================================= */}
          {/* TABELA 3 & 4 EM GRID: IMPOSTOS E GASTOS OPERACIONAIS / INSUMOS */}
          {/* ================================================================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            
            {/* Bloco de Impostos e Deduções */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={17} color="#fbbf24" />
                  <span>Impostos & Taxas (Deduções)</span>
                </h3>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fbbf24' }}>
                  {formatCurrency(dre.totalImpostos)}
                </span>
              </div>

              {impostosDetalhados.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Nenhum imposto ou taxa lançado para este mês.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {impostosDetalhados.map((imp) => (
                    <div 
                      key={imp.id}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.825rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{imp.descricao}</div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {imp.data ? formatDate(imp.data) : mesAnoStr} • {imp.formaPagamento}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: '700', color: '#f87171' }}>
                          {formatCurrency(imp.valor)}
                        </span>
                        {!isMesFechado && (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              onClick={() => {
                                setDespesaParaEditar(imp);
                                setModalDespesaOpen(true);
                              }}
                              className="btn-icon"
                              style={{ padding: '3px' }}
                              title="Editar"
                            >
                              <Edit size={13} color="var(--text-muted)" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Excluir ${imp.descricao}?`)) {
                                  deleteDespesa(imp.id);
                                }
                              }}
                              className="btn-icon"
                              style={{ padding: '3px' }}
                              title="Excluir"
                            >
                              <Trash2 size={13} color="#f87171" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bloco de Insumos, Produtos de Limpeza e Investimentos */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingBag size={17} color="#c084fc" />
                  <span>Produtos, Insumos & Máquinas</span>
                </h3>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#c084fc' }}>
                  {formatCurrency(dre.totalGastosOperacionais)}
                </span>
              </div>

              {[...insumosDetalhados, ...investimentosDetalhados, ...outrasDespesasDetalhadas].length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Nenhuma compra de insumo ou equipamento registrada no mês.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
                  {[...insumosDetalhados, ...investimentosDetalhados, ...outrasDespesasDetalhadas].map((g) => {
                    const isInvest = g.tipoMacro === 'investimento';
                    return (
                      <div 
                        key={g.id}
                        style={{
                          padding: '0.65rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isInvest ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          border: isInvest ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border-color)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.825rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{g.descricao}</span>
                            {isInvest && (
                              <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: '700' }}>
                                Máquina / Ativo
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {g.data ? formatDate(g.data) : mesAnoStr} • {g.categoria} • {g.formaPagamento}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: '700', color: isInvest ? '#60a5fa' : '#f87171' }}>
                            {formatCurrency(g.valor)}
                          </span>
                          {!isMesFechado && (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button
                                onClick={() => {
                                  setDespesaParaEditar(g);
                                  setModalDespesaOpen(true);
                                }}
                                className="btn-icon"
                                style={{ padding: '3px' }}
                                title="Editar"
                              >
                                <Edit size={13} color="var(--text-muted)" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Excluir ${g.descricao}?`)) {
                                    deleteDespesa(g.id);
                                  }
                                }}
                                className="btn-icon"
                                style={{ padding: '3px' }}
                                title="Excluir"
                              >
                                <Trash2 size={13} color="#f87171" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 5. PAINEL DE INTELIGÊNCIA & TOMADA DE DECISÃO */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--primary-400)" />
              <span>Diagnóstico & Tomada de Decisão Estratégica (Para a Administradora)</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
              {/* Insight 1: Margem de Contribuição */}
              <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary-500)' }}>
                <strong style={{ color: 'var(--primary-400)', display: 'block', marginBottom: '0.25rem' }}>
                  🎯 Margem de Contribuição ({dre.margemContribuicaoPct.toFixed(1)}%)
                </strong>
                <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  {dre.margemContribuicaoPct >= 35 ? (
                    'Excelente margem! Seu faturamento tem folga segura para pagar todos os insumos, investir em máquinas e gerar lucro limpo expressivo.'
                  ) : dre.margemContribuicaoPct >= 28 ? (
                    'Margem equilibrada dentro do padrão saudável de empresas de serviços de limpeza (meta recomendada: entre 30% e 40%).'
                  ) : (
                    'Atenção à margem: o custo das diárias e impostos está consumindo mais de 72% da receita. Considere reajuste em clientes antigos ou pacotes de 3 dormitórios.'
                  )}
                </p>
              </div>

              {/* Insight 2: Investimento em Equipamentos */}
              <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #3b82f6' }}>
                <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '0.25rem' }}>
                  🛠️ Bens Duráveis & Máquinas ({formatCurrency(dre.totalInvestimentos)})
                </strong>
                <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  {dre.totalInvestimentos > 0 ? (
                    'Equipamentos novos (como aspirador ou extratora) aumentam a velocidade e qualidade da equipe. Trate-os como ativos que se pagam nos meses seguintes!'
                  ) : (
                    'Nenhum investimento pesado em máquinas neste mês. Mantenha uma reserva mensal para quando precisar repor aspiradores ou equipamentos.'
                  )}
                </p>
              </div>

              {/* Insight 3: Concentração de Clientes por Prédio */}
              <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #a855f7' }}>
                <strong style={{ color: '#c084fc', display: 'block', marginBottom: '0.25rem' }}>
                  🏢 Otimização de Rotas e Prédios
                </strong>
                <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  Atender vários clientes no mesmo condomínio reduz custo de deslocamento das ajudantes e permite negociar escalas duplas muito mais produtivas.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* ABA 2: COMPARATIVO POR PERÍODO & EVOLUÇÃO DAS DESPESAS */}
      {/* ===================================================================== */}
      {modoAba === 'comparativo' && (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          {/* Cabeçalho da Aba Comparativo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={20} color="var(--primary-400)" />
                <span>Evolução Financeira & Comparativo por Período</span>
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Período selecionado: <strong style={{ color: 'var(--primary-400)' }}>{dadosComparativoPeriodo.periodoDesc}</strong> ({dadosComparativoPeriodo.meses.length} {dadosComparativoPeriodo.meses.length === 1 ? 'mês' : 'meses'})
              </span>
            </div>

            {/* Ações Rápidas de Exportação na Aba Comparativo */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleExportarExcelComparativo}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.4rem', border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.08)' }}
                title="Baixar planilha Excel (.xlsx) com as tabelas do comparativo formatadas"
              >
                <FileSpreadsheet size={15} color="#10b981" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                onClick={handleImprimirComparativo}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.4rem', border: '1px solid #38bdf8', background: 'rgba(56, 189, 248, 0.08)' }}
                title="Imprimir relatório comparativo por período em formato A4 ou salvar em PDF"
              >
                <Printer size={15} color="#38bdf8" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

          {/* Barra de Seleção de Período Flexível (Atalhos + Dropdowns De/Até) */}
          <div style={{ 
            background: 'var(--bg-input)', 
            padding: '0.85rem 1rem', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '1.5rem', 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: '0.75rem',
            border: '1px solid var(--border-color)'
          }}>
            {/* Atalhos Rápidos */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginRight: '0.2rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Filter size={13} color="var(--primary-400)" />
                Atalhos:
              </span>
              <button 
                onClick={() => aplicarPresetAno(2026)} 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                Ano 2026
              </button>
              <button 
                onClick={() => aplicarPresetAno(2027)} 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                Ano 2027
              </button>
              <button 
                onClick={aplicarPresetNov26Mar27} 
                className="btn btn-secondary btn-sm" 
                style={{ 
                  padding: '0.25rem 0.6rem', 
                  fontSize: '0.75rem', 
                  borderColor: 'var(--primary-500)', 
                  color: 'var(--primary-400)',
                  background: 'rgba(16, 185, 129, 0.1)'
                }}
                title="Exemplo: De Novembro/2026 até Março/2027"
              >
                Nov/26 a Mar/27
              </button>
              <button 
                onClick={aplicarPresetUltimos6} 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                Últimos 6M
              </button>
              <button 
                onClick={aplicarPresetUltimos12} 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                Últimos 12M
              </button>
            </div>

            {/* Seletores Personalizados De -> Até */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* De */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>De:</span>
                <select 
                  value={mesInicioFiltro.mes} 
                  onChange={e => setMesInicioFiltro(prev => ({ ...prev, mes: Number(e.target.value) }))}
                  style={{ 
                    padding: '0.3rem 0.5rem', 
                    fontSize: '0.78rem', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-sm)' 
                  }}
                >
                  {MESES_NOMES.map((nome, idx) => (
                    <option key={idx} value={idx}>{nome}</option>
                  ))}
                </select>
                <select 
                  value={mesInicioFiltro.ano} 
                  onChange={e => setMesInicioFiltro(prev => ({ ...prev, ano: Number(e.target.value) }))}
                  style={{ 
                    padding: '0.3rem 0.5rem', 
                    fontSize: '0.78rem', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-sm)' 
                  }}
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Até */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Até:</span>
                <select 
                  value={mesFimFiltro.mes} 
                  onChange={e => setMesFimFiltro(prev => ({ ...prev, mes: Number(e.target.value) }))}
                  style={{ 
                    padding: '0.3rem 0.5rem', 
                    fontSize: '0.78rem', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-sm)' 
                  }}
                >
                  {MESES_NOMES.map((nome, idx) => (
                    <option key={idx} value={idx}>{nome}</option>
                  ))}
                </select>
                <select 
                  value={mesFimFiltro.ano} 
                  onChange={e => setMesFimFiltro(prev => ({ ...prev, ano: Number(e.target.value) }))}
                  style={{ 
                    padding: '0.3rem 0.5rem', 
                    fontSize: '0.78rem', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-sm)' 
                  }}
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Totais do Período em Destaque (5 KPIs) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', borderTop: '3px solid var(--primary-500)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Faturamento do Período</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-400)' }}>
                {formatCurrency(dadosComparativoPeriodo.totais.totalAnoRecBruta)}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{dadosComparativoPeriodo.totais.totalAnoLimpezas} limpezas realizadas</span>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', borderTop: '3px solid #ef4444)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Diárias das Ajudantes</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f87171' }}>
                {formatCurrency(dadosComparativoPeriodo.totais.totalAnoCustoAj)}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {dadosComparativoPeriodo.totais.totalAnoRecBruta > 0 ? ((dadosComparativoPeriodo.totais.totalAnoCustoAj / dadosComparativoPeriodo.totais.totalAnoRecBruta) * 100).toFixed(1) : 0}% da receita
              </span>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', borderTop: '3px solid #fbbf24' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Margem Contribuição</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fbbf24' }}>
                {formatCurrency(dadosComparativoPeriodo.totais.totalAnoMargemCont)}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Média: {dadosComparativoPeriodo.totais.totalAnoMargemContPct.toFixed(1)}%</span>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', borderTop: '3px solid #c084fc' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total de Despesas</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#c084fc' }}>
                {formatCurrency(dadosComparativoPeriodo.totais.totalGeralDespesas)}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Equipe, insumos e impostos</span>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', borderTop: '3px solid #3b82f6' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lucro Líquido Acumulado</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#60a5fa' }}>
                {formatCurrency(dadosComparativoPeriodo.totais.totalAnoLucro)}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Margem Líquida: {dadosComparativoPeriodo.totais.totalAnoLucroPct.toFixed(1)}%</span>
            </div>
          </div>

          {/* Tabela Matricial do Período */}
          <div style={{ overflowX: 'auto', marginBottom: '1.75rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-input)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.65rem', textAlign: 'left', minWidth: '170px' }}>Métrica / Conta</th>
                  {dadosComparativoPeriodo.meses.map(m => (
                    <th key={m.mesAno} style={{ padding: '0.65rem 0.45rem', textAlign: 'right', minWidth: '85px' }}>
                      {m.nomeCurto}
                      {m.isFechado && <span title="Mês Fechado" style={{ marginLeft: '3px' }}>🔒</span>}
                    </th>
                  ))}
                  <th style={{ padding: '0.65rem 0.65rem', textAlign: 'right', background: 'rgba(16, 185, 129, 0.15)', minWidth: '105px' }}>
                    TOTAL PERÍODO
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Linha 1: Limpezas */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.55rem', fontWeight: '600' }}>Qtd de Limpezas</td>
                  {dadosComparativoPeriodo.meses.map(m => (
                    <td key={m.mesAno} style={{ padding: '0.55rem 0.45rem', textAlign: 'right' }}>
                      {m.totalLimpezas}
                    </td>
                  ))}
                  <td style={{ padding: '0.55rem', textAlign: 'right', fontWeight: '800', color: 'var(--primary-400)' }}>
                    {dadosComparativoPeriodo.totais.totalAnoLimpezas}
                  </td>
                </tr>

                {/* Linha 2: Receita Bruta */}
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(16, 185, 129, 0.04)' }}>
                  <td style={{ padding: '0.55rem', fontWeight: '700', color: 'var(--primary-400)' }}>(+) Receita Bruta</td>
                  {dadosComparativoPeriodo.meses.map(m => (
                    <td key={m.mesAno} style={{ padding: '0.55rem 0.45rem', textAlign: 'right', fontWeight: '600' }}>
                      {m.recBruta > 0 ? formatCurrency(m.recBruta) : '-'}
                    </td>
                  ))}
                  <td style={{ padding: '0.55rem', textAlign: 'right', fontWeight: '800', color: 'var(--primary-400)' }}>
                    {formatCurrency(dadosComparativoPeriodo.totais.totalAnoRecBruta)}
                  </td>
                </tr>

                {/* Linha 3: Diárias */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.55rem', color: '#f87171' }}>(-) Diárias da Equipe</td>
                  {dadosComparativoPeriodo.meses.map(m => (
                    <td key={m.mesAno} style={{ padding: '0.55rem 0.45rem', textAlign: 'right', color: '#f87171' }}>
                      {m.custoAj > 0 ? formatCurrency(m.custoAj) : '-'}
                    </td>
                  ))}
                  <td style={{ padding: '0.55rem', textAlign: 'right', fontWeight: '700', color: '#f87171' }}>
                    {formatCurrency(dadosComparativoPeriodo.totais.totalAnoCustoAj)}
                  </td>
                </tr>

                {/* Linha 4: Impostos */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.55rem', color: '#fbbf24' }}>(-) Impostos & Taxas</td>
                  {dadosComparativoPeriodo.meses.map(m => (
                    <td key={m.mesAno} style={{ padding: '0.55rem 0.45rem', textAlign: 'right', color: '#fbbf24' }}>
                      {m.impostos > 0 ? formatCurrency(m.impostos) : '-'}
                    </td>
                  ))}
                  <td style={{ padding: '0.55rem', textAlign: 'right', color: '#fbbf24', fontWeight: '700' }}>
                    {formatCurrency(dadosComparativoPeriodo.totais.totalAnoImpostos)}
                  </td>
                </tr>

                {/* Linha 5: Margem Contribuição */}
                <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'rgba(245, 158, 11, 0.08)', fontWeight: '700' }}>
                  <td style={{ padding: '0.65rem 0.55rem', color: '#fbbf24' }}>(=) Margem Contribuição</td>
                  {dadosComparativoPeriodo.meses.map(m => (
                    <td key={m.mesAno} style={{ padding: '0.65rem 0.45rem', textAlign: 'right', color: '#fbbf24' }}>
                      {m.margemCont !== 0 ? formatCurrency(m.margemCont) : '-'}
                    </td>
                  ))}
                  <td style={{ padding: '0.65rem', textAlign: 'right', color: '#fbbf24', fontWeight: '800' }}>
                    {formatCurrency(dadosComparativoPeriodo.totais.totalAnoMargemCont)}
                  </td>
                </tr>

                {/* Linha 6: % Margem */}
                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <td style={{ padding: '0.45rem 0.55rem' }}>% Margem Contribuição</td>
                  {dadosComparativoPeriodo.meses.map(m => (
                    <td key={m.mesAno} style={{ padding: '0.45rem 0.45rem', textAlign: 'right' }}>
                      {m.recBruta > 0 ? `${m.margemContPct.toFixed(1)}%` : '-'}
                    </td>
                  ))}
                  <td style={{ padding: '0.45rem', textAlign: 'right', fontWeight: '700' }}>
                    {dadosComparativoPeriodo.totais.totalAnoMargemContPct.toFixed(1)}%
                  </td>
                </tr>

                {/* Linha 7: Insumos Operacionais */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.55rem', color: '#c084fc' }}>(-) Insumos & Produtos</td>
                  {dadosComparativoPeriodo.meses.map(m => (
                    <td key={m.mesAno} style={{ padding: '0.55rem 0.45rem', textAlign: 'right', color: '#c084fc' }}>
                      {m.insumos > 0 ? formatCurrency(m.insumos) : '-'}
                    </td>
                  ))}
                  <td style={{ padding: '0.55rem', textAlign: 'right', color: '#c084fc', fontWeight: '700' }}>
                    {formatCurrency(dadosComparativoPeriodo.totais.totalInsumos)}
                  </td>
                </tr>

                {/* Linha 8: Investimentos / Máquinas */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.55rem', color: '#60a5fa' }}>(-) Investimentos / Máquinas</td>
                  {dadosComparativoPeriodo.meses.map(m => (
                    <td key={m.mesAno} style={{ padding: '0.55rem 0.45rem', textAlign: 'right', color: '#60a5fa' }}>
                      {m.invest > 0 ? formatCurrency(m.invest) : '-'}
                    </td>
                  ))}
                  <td style={{ padding: '0.55rem', textAlign: 'right', color: '#60a5fa', fontWeight: '700' }}>
                    {formatCurrency(dadosComparativoPeriodo.totais.totalInvest)}
                  </td>
                </tr>

                {/* Linha 9: Outros Custos Fixos & Gerais */}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.55rem', color: '#94a3b8' }}>(-) Custos Fixos & Gerais</td>
                  {dadosComparativoPeriodo.meses.map(m => (
                    <td key={m.mesAno} style={{ padding: '0.55rem 0.45rem', textAlign: 'right', color: '#94a3b8' }}>
                      {m.outras > 0 ? formatCurrency(m.outras) : '-'}
                    </td>
                  ))}
                  <td style={{ padding: '0.55rem', textAlign: 'right', color: '#94a3b8', fontWeight: '700' }}>
                    {formatCurrency(dadosComparativoPeriodo.totais.totalOutras)}
                  </td>
                </tr>

                {/* Linha 10: Lucro Líquido Real */}
                <tr style={{ background: 'rgba(59, 130, 246, 0.12)', fontWeight: '800', fontSize: '0.85rem' }}>
                  <td style={{ padding: '0.75rem 0.55rem', color: '#60a5fa' }}>(=) Lucro Líquido Real</td>
                  {dadosComparativoPeriodo.meses.map(m => (
                    <td key={m.mesAno} style={{ padding: '0.75rem 0.45rem', textAlign: 'right', color: m.lucro >= 0 ? '#60a5fa' : '#f87171' }}>
                      {m.lucro !== 0 ? formatCurrency(m.lucro) : '-'}
                    </td>
                  ))}
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#60a5fa', fontWeight: '900' }}>
                    {formatCurrency(dadosComparativoPeriodo.totais.totalAnoLucro)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ================================================================= */}
          {/* GRÁFICO 1: EVOLUÇÃO DA RENTABILIDADE (RECEITA BRUTA vs LUCRO REAL) */}
          {/* ================================================================= */}
          <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} color="var(--primary-400)" />
                <span>1. Gráfico de Rentabilidade Mês a Mês ({dadosComparativoPeriodo.periodoDesc}):</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '10px', height: '10px', background: 'var(--primary-500)', borderRadius: '2px' }} />
                  <span>Receita Bruta</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px' }} />
                  <span>Lucro Líquido Real</span>
                </span>
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${dadosComparativoPeriodo.meses.length}, minmax(45px, 1fr))`, 
              gap: '0.5rem', 
              height: '140px', 
              alignItems: 'flex-end', 
              paddingTop: '10px',
              overflowX: 'auto'
            }}>
              {dadosComparativoPeriodo.meses.map(m => {
                const maxVal = Math.max(...dadosComparativoPeriodo.meses.map(x => x.recBruta), 1000);
                const alturaRec = Math.max(8, (m.recBruta / maxVal) * 110);
                const alturaLucro = Math.max(4, (Math.max(0, m.lucro) / maxVal) * 110);

                return (
                  <div key={m.mesAno} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', width: '100%', justifyContent: 'center' }}>
                      {/* Barra Receita */}
                      <div 
                        style={{ 
                          width: '45%', 
                          height: `${alturaRec}px`, 
                          background: 'var(--primary-500)', 
                          borderRadius: '3px 3px 0 0',
                          opacity: m.recBruta > 0 ? 0.9 : 0.25
                        }} 
                        title={`${m.nomeCompleto}: Receita ${formatCurrency(m.recBruta)}`}
                      />
                      {/* Barra Lucro */}
                      <div 
                        style={{ 
                          width: '45%', 
                          height: `${alturaLucro}px`, 
                          background: '#3b82f6', 
                          borderRadius: '3px 3px 0 0',
                          opacity: m.lucro > 0 ? 0.9 : 0.25
                        }} 
                        title={`${m.nomeCompleto}: Lucro Líquido ${formatCurrency(m.lucro)}`}
                      />
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px', whiteSpace: 'nowrap' }}>
                      {m.nomeCurto}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================================================================= */}
          {/* GRÁFICO 2: EVOLUÇÃO DETALHADA DAS DESPESAS (SOLICITADO PELO USUÁRIO) */}
          {/* ================================================================= */}
          <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowDownRight size={16} color="#f87171" />
                  <span>2. Gráfico de Evolução das Despesas por Mês ({dadosComparativoPeriodo.periodoDesc}):</span>
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                  Acompanhe a distribuição para onde foi o dinheiro da empresa mês a mês: Diárias, Insumos, Máquinas e Impostos
                </span>
              </div>

              {/* Total de Despesas no Período */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total de Despesas: </span>
                <strong style={{ fontSize: '0.95rem', color: '#f87171' }}>{formatCurrency(dadosComparativoPeriodo.totais.totalGeralDespesas)}</strong>
              </div>
            </div>

            {/* Barras Empilhadas de Despesas por Mês */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${dadosComparativoPeriodo.meses.length}, minmax(45px, 1fr))`, 
              gap: '0.5rem', 
              height: '160px', 
              alignItems: 'flex-end', 
              paddingTop: '20px',
              overflowX: 'auto'
            }}>
              {dadosComparativoPeriodo.meses.map(m => {
                const maxDesp = Math.max(...dadosComparativoPeriodo.meses.map(x => x.totalDespesasMes), 500);
                const alturaTotal = Math.max(10, (m.totalDespesasMes / maxDesp) * 120);

                // Proporções relativas dentro da barra de despesas
                const pAj = m.totalDespesasMes > 0 ? (m.custoAj / m.totalDespesasMes) : 0;
                const pImp = m.totalDespesasMes > 0 ? (m.impostos / m.totalDespesasMes) : 0;
                const pIns = m.totalDespesasMes > 0 ? (m.insumos / m.totalDespesasMes) : 0;
                const pInv = m.totalDespesasMes > 0 ? (m.invest / m.totalDespesasMes) : 0;
                const pOut = m.totalDespesasMes > 0 ? (m.outras / m.totalDespesasMes) : 0;

                return (
                  <div key={m.mesAno} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    {/* Valor Total da Despesa no topo da barra */}
                    {m.totalDespesasMes > 0 && (
                      <span style={{ fontSize: '0.62rem', fontWeight: '700', color: '#f87171', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                        {formatCurrency(m.totalDespesasMes)}
                      </span>
                    )}

                    {/* Coluna Empilhada */}
                    <div 
                      style={{ 
                        width: '38px', 
                        height: `${alturaTotal}px`, 
                        borderRadius: '4px 4px 0 0', 
                        overflow: 'hidden', 
                        display: 'flex', 
                        flexDirection: 'column-reverse',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                      title={`${m.nomeCompleto}:
• Diárias Equipe: ${formatCurrency(m.custoAj)}
• Impostos & Taxas: ${formatCurrency(m.impostos)}
• Insumos & Produtos: ${formatCurrency(m.insumos)}
• Máquinas / Investimentos: ${formatCurrency(m.invest)}
• Outros Fixos: ${formatCurrency(m.outras)}
TOTAL: ${formatCurrency(m.totalDespesasMes)}`}
                    >
                      {/* Segmento 1: Diárias Equipe (Vermelho) */}
                      {pAj > 0 && (
                        <div style={{ height: `${pAj * 100}%`, background: '#ef4444', width: '100%' }} />
                      )}
                      {/* Segmento 2: Impostos (Amarelo) */}
                      {pImp > 0 && (
                        <div style={{ height: `${pImp * 100}%`, background: '#f59e0b', width: '100%' }} />
                      )}
                      {/* Segmento 3: Insumos (Roxo) */}
                      {pIns > 0 && (
                        <div style={{ height: `${pIns * 100}%`, background: '#a855f7', width: '100%' }} />
                      )}
                      {/* Segmento 4: Investimentos/Máquinas (Azul) */}
                      {pInv > 0 && (
                        <div style={{ height: `${pInv * 100}%`, background: '#3b82f6', width: '100%' }} />
                      )}
                      {/* Segmento 5: Outros (Cinza) */}
                      {pOut > 0 && (
                        <div style={{ height: `${pOut * 100}%`, background: '#64748b', width: '100%' }} />
                      )}
                    </div>

                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px', whiteSpace: 'nowrap' }}>
                      {m.nomeCurto}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legenda Explicativa com Valores e Percentuais */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '1.25rem', 
              marginTop: '1.25rem', 
              fontSize: '0.75rem', 
              flexWrap: 'wrap',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '0.85rem'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '3px' }} />
                <span>
                  <strong>Diárias das Ajudantes:</strong> {formatCurrency(dadosComparativoPeriodo.totais.totalAnoCustoAj)} 
                  <span style={{ color: 'var(--text-muted)', marginLeft: '3px' }}>
                    ({dadosComparativoPeriodo.totais.totalGeralDespesas > 0 ? ((dadosComparativoPeriodo.totais.totalAnoCustoAj / dadosComparativoPeriodo.totais.totalGeralDespesas) * 100).toFixed(1) : 0}%)
                  </span>
                </span>
              </span>

              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '3px' }} />
                <span>
                  <strong>Impostos & Taxas:</strong> {formatCurrency(dadosComparativoPeriodo.totais.totalAnoImpostos)}
                  <span style={{ color: 'var(--text-muted)', marginLeft: '3px' }}>
                    ({dadosComparativoPeriodo.totais.totalGeralDespesas > 0 ? ((dadosComparativoPeriodo.totais.totalAnoImpostos / dadosComparativoPeriodo.totais.totalGeralDespesas) * 100).toFixed(1) : 0}%)
                  </span>
                </span>
              </span>

              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '12px', height: '12px', background: '#a855f7', borderRadius: '3px' }} />
                <span>
                  <strong>Insumos & Produtos:</strong> {formatCurrency(dadosComparativoPeriodo.totais.totalInsumos)}
                  <span style={{ color: 'var(--text-muted)', marginLeft: '3px' }}>
                    ({dadosComparativoPeriodo.totais.totalGeralDespesas > 0 ? ((dadosComparativoPeriodo.totais.totalInsumos / dadosComparativoPeriodo.totais.totalGeralDespesas) * 100).toFixed(1) : 0}%)
                  </span>
                </span>
              </span>

              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '3px' }} />
                <span>
                  <strong>Investimentos / Máquinas:</strong> {formatCurrency(dadosComparativoPeriodo.totais.totalInvest)}
                  <span style={{ color: 'var(--text-muted)', marginLeft: '3px' }}>
                    ({dadosComparativoPeriodo.totais.totalGeralDespesas > 0 ? ((dadosComparativoPeriodo.totais.totalInvest / dadosComparativoPeriodo.totais.totalGeralDespesas) * 100).toFixed(1) : 0}%)
                  </span>
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Lançar/Editar Despesa */}
      <ModalDespesa
        isOpen={modalDespesaOpen}
        onClose={() => {
          setModalDespesaOpen(false);
          setDespesaParaEditar(null);
        }}
        despesaEdicao={despesaParaEditar}
        mesPreSelecionado={mesAnoStr}
      />
    </div>
  );
};
