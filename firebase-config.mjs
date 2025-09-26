import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyC9_PR6HlQtjkzmTwH4DID4TOfsaXScArI",
  authDomain: "zawixchannels.firebaseapp.com",
  projectId: "zawixchannels",
  storageBucket: "zawixchannels.firebasestorage.app",
  messagingSenderId: "174593884643",
  appId: "1:174593884643:web:e9ec7fa3d8fd414f1260d6",
  measurementId: "G-D8ERDSB44D"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class ChannelsFirestore {
  constructor() {
    this.docRef = doc(db, 'channels', 'data');
  }

  async getChannelsData() {
    try {
      const docSnap = await getDoc(this.docRef);
      if (docSnap.exists()) {
        return docSnap.data().channelsData;
      } else {
        const defaultData = {
          1: [{
            "name": "Canal+ Sport 1",
            "url1": "https://sportio.cc/ssic/22",
            "url2": "https://strumyk.net/embed/22333",
            "url3": "https://thedaddy.top/embed/stream-48.php",
            "country": "PL",
            "language": "Polski",
            "quality": "ULTRA HD"
          }]
        };
        await this.saveChannelsData(defaultData);
        return defaultData;
      }
    } catch (error) {
      console.error('Błąd pobierania danych z Firestore:', error);
      throw error;
    }
  }

  async saveChannelsData(channelsData) {
    try {
      await setDoc(this.docRef, { channelsData }, { merge: true });
      return true;
    } catch (error) {
      console.error('Błąd zapisywania danych do Firestore:', error);
      throw error;
    }
  }
}

window.channelsFirestore = new ChannelsFirestore();