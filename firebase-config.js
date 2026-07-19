// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Your verified Nexus Pro structural credentials parameter map
const firebaseConfig = {
    apiKey: "AIzaSyDbt1wfOLhRls_JG2ysysfHvqRBL8LRpBI",
    authDomain: "nexuspro-cf948.firebaseapp.com",
    projectId: "nexuspro-cf948",
    storageBucket: "nexuspro-cf948.firebasestorage.app",
    messagingSenderId: "1064369883019",
    appId: "1:1064369883019:web:f10f1d6644cbaa4682518e",
    databaseURL: "https://nexuspro-cf948-default-rtdb.firebaseio.com" // Tied directly to your project ID parameters
};

// Initialize Core Application Node
const app = initializeApp(firebaseConfig);

// Export instances to run your Authentication and Realtime DB systems natively
export const auth = getAuth(app);
export const database = getDatabase(app);
