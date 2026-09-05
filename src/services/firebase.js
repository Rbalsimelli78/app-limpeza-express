import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAUV2fRFQJSDUuOwb_7RqYcUwv6fnwPf0g",
  authDomain: "limpeza-express-sp.firebaseapp.com",
  projectId: "limpeza-express-sp",
  storageBucket: "limpeza-express-sp.firebasestorage.app",
  messagingSenderId: "205008236441",
  appId: "1:205008236441:web:cab06379a3fecbc362ed08",
  measurementId: "G-N9GHYXJK4R"
};

// Inicialização do Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
