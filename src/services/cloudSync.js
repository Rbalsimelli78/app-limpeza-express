import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch 
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Escuta em tempo real a coleção de Clientes
 */
export const listenClientes = (onUpdate, onError) => {
  try {
    const colRef = collection(db, 'clientes');
    return onSnapshot(colRef, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(docs, snapshot.empty);
    }, (err) => {
      console.warn('Erro ao escutar clientes na nuvem:', err.message);
      if (onError) onError(err);
    });
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
};

/**
 * Escuta em tempo real a coleção de Ajudantes
 */
export const listenAjudantes = (onUpdate, onError) => {
  try {
    const colRef = collection(db, 'ajudantes');
    return onSnapshot(colRef, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(docs, snapshot.empty);
    }, (err) => {
      console.warn('Erro ao escutar ajudantes na nuvem:', err.message);
      if (onError) onError(err);
    });
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
};

/**
 * Escuta em tempo real a coleção de Agendamentos
 */
export const listenAgendamentos = (onUpdate, onError) => {
  try {
    const colRef = collection(db, 'agendamentos');
    return onSnapshot(colRef, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(docs, snapshot.empty);
    }, (err) => {
      console.warn('Erro ao escutar agendamentos na nuvem:', err.message);
      if (onError) onError(err);
    });
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
};

/**
 * Escuta em tempo real a coleção de Planos
 */
export const listenPlanos = (onUpdate, onError) => {
  try {
    const colRef = collection(db, 'planos');
    return onSnapshot(colRef, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(docs, snapshot.empty);
    }, (err) => {
      console.warn('Erro ao escutar planos na nuvem:', err.message);
      if (onError) onError(err);
    });
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
};

/**
 * Escuta em tempo real a coleção de Usuários do Sistema
 */
export const listenUsuarios = (onUpdate, onError) => {
  try {
    const colRef = collection(db, 'usuarios');
    return onSnapshot(colRef, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(docs, snapshot.empty);
    }, (err) => {
      console.warn('Erro ao escutar usuarios na nuvem:', err.message);
      if (onError) onError(err);
    });
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
};

// ===============================================
// Gravações Individuais no Firestore
// ===============================================

export const salvarUsuarioNuvem = async (usuario) => {
  try {
    if (!usuario || !usuario.id) return;
    const ref = doc(db, 'usuarios', usuario.id);
    await setDoc(ref, usuario, { merge: true });
  } catch (e) {
    console.warn('Falha ao salvar usuário na nuvem:', e.message);
  }
};

export const excluirUsuarioNuvem = async (usuarioId) => {
  try {
    if (!usuarioId) return;
    const ref = doc(db, 'usuarios', usuarioId);
    await deleteDoc(ref);
  } catch (e) {
    console.warn('Falha ao excluir usuário na nuvem:', e.message);
  }
};

export const salvarClienteNuvem = async (cliente) => {
  try {
    if (!cliente || !cliente.id) return;
    const ref = doc(db, 'clientes', cliente.id);
    await setDoc(ref, cliente, { merge: true });
  } catch (e) {
    console.warn('Falha ao salvar cliente na nuvem:', e.message);
  }
};

export const excluirClienteNuvem = async (id) => {
  try {
    if (!id) return;
    const ref = doc(db, 'clientes', id);
    await deleteDoc(ref);
  } catch (e) {
    console.warn('Falha ao excluir cliente na nuvem:', e.message);
  }
};

export const salvarAjudanteNuvem = async (ajudante) => {
  try {
    if (!ajudante || !ajudante.id) return;
    const ref = doc(db, 'ajudantes', ajudante.id);
    await setDoc(ref, ajudante, { merge: true });
  } catch (e) {
    console.warn('Falha ao salvar ajudante na nuvem:', e.message);
  }
};

export const excluirAjudanteNuvem = async (id) => {
  try {
    if (!id) return;
    const ref = doc(db, 'ajudantes', id);
    await deleteDoc(ref);
  } catch (e) {
    console.warn('Falha ao excluir ajudante na nuvem:', e.message);
  }
};

export const salvarAgendamentoNuvem = async (agendamento) => {
  try {
    if (!agendamento || !agendamento.id) return;
    const ref = doc(db, 'agendamentos', agendamento.id);
    await setDoc(ref, agendamento, { merge: true });
  } catch (e) {
    console.warn('Falha ao salvar agendamento na nuvem:', e.message);
  }
};

export const excluirAgendamentoNuvem = async (id) => {
  try {
    if (!id) return;
    const ref = doc(db, 'agendamentos', id);
    await deleteDoc(ref);
  } catch (e) {
    console.warn('Falha ao excluir agendamento na nuvem:', e.message);
  }
};

export const salvarPlanoNuvem = async (plano) => {
  try {
    if (!plano || !plano.id) return;
    const ref = doc(db, 'planos', plano.id);
    await setDoc(ref, plano, { merge: true });
  } catch (e) {
    console.warn('Falha ao salvar plano na nuvem:', e.message);
  }
};

export const excluirPlanoNuvem = async (id) => {
  try {
    if (!id) return;
    const ref = doc(db, 'planos', id);
    await deleteDoc(ref);
  } catch (e) {
    console.warn('Falha ao excluir plano na nuvem:', e.message);
  }
};

/**
 * Faz upload em lote dos dados locais para a nuvem caso o banco esteja vazio
 */
export const subirBaseParaNuvem = async ({ clientes = [], ajudantes = [], agendamentos = [], planos = [] }) => {
  try {
    const batch = writeBatch(db);

    clientes.forEach(c => {
      if (c.id) batch.set(doc(db, 'clientes', c.id), c);
    });

    ajudantes.forEach(a => {
      if (a.id) batch.set(doc(db, 'ajudantes', a.id), a);
    });

    agendamentos.forEach(ag => {
      if (ag.id) batch.set(doc(db, 'agendamentos', ag.id), ag);
    });

    planos.forEach(p => {
      if (p.id) batch.set(doc(db, 'planos', p.id), p);
    });

    await batch.commit();
    return true;
  } catch (e) {
    console.warn('Erro ao subir base em lote para a nuvem:', e.message);
    return false;
  }
};

/**
 * Limpa todos os documentos da nuvem
 */
export const limparColecaoNuvem = async (nomeColecao) => {
  try {
    const snapshot = await getDocs(collection(db, nomeColecao));
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.delete(doc(db, nomeColecao, d.id));
    });
    await batch.commit();
  } catch (e) {
    console.warn(`Erro ao limpar coleção ${nomeColecao}:`, e.message);
  }
};
