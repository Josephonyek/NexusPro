import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDbt1wfOLhRls_JG2ysysfHvqRBL8LRpBI",
  authDomain: "nexuspro-cf948.firebaseapp.com",
  projectId: "nexuspro-cf948",
  storageBucket: "nexuspro-cf948.firebasestorage.app",
  messagingSenderId: "1064369883019",
  appId: "1:1064369883019:web:f10f1d6644cbaa4682518e",
  databaseURL: "https://nexuspro-cf948-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const rtdb = getDatabase(app);
