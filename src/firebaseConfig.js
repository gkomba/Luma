// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB_RC4G9L7NcjGcUead2b0u07x69aE2n04",
  authDomain: "esp-api-10fa5.firebaseapp.com",
  databaseURL: "https://esp-api-10fa5-default-rtdb.firebaseio.com",
  projectId: "esp-api-10fa5",
  storageBucket: "esp-api-10fa5.firebasestorage.app",
  messagingSenderId: "874200975849",
  appId: "1:874200975849:web:02fbdbe467bdbbcb6e2378",
  measurementId: "G-HST7YJ39FP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

export { db };