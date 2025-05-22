importScripts("https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB_RC4G9L7NcjGcUead2b0u07x69aE2n04",
  authDomain: "esp-api-10fa5.firebaseapp.com",
  databaseURL: "https://esp-api-10fa5-default-rtdb.firebaseio.com",
  projectId: "esp-api-10fa5",
  storageBucket: "esp-api-10fa5.firebasestorage.app",
  messagingSenderId: "874200975849",
  appId: "1:874200975849:web:02fbdbe467bdbbcb6e2378",
  measurementId: "G-HST7YJ39FP"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});