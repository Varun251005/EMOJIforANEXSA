import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBWPLAuom2bwTG7u9VuugFJTTUAOMqfmP0',
  authDomain: 'emojiexplanation.firebaseapp.com',
  projectId: 'emojiexplanation',
  storageBucket: 'emojiexplanation.firebasestorage.app',
  messagingSenderId: '34755600808',
  appId: '1:34755600808:web:6eec578114537c674a3d9d',
  measurementId: 'G-HZBHGEX1YF',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

let analyticsInstance = null

const initAnalytics = async () => {
  if (analyticsInstance) {
    return analyticsInstance
  }

  const supported = await isSupported()
  if (supported) {
    analyticsInstance = getAnalytics(app)
  }

  return analyticsInstance
}

export { app, db, initAnalytics }
