import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBhMhLq71rcwUx6bblOryX0XdOIXjcbPwE",
  authDomain: "voca-bcaf0.firebaseapp.com",
  projectId: "voca-bcaf0",
  storageBucket: "voca-bcaf0.firebasestorage.app",
  messagingSenderId: "436977653380",
  appId: "1:436977653380:web:ee074206bcf768bfc114d1",
  measurementId: "G-9XJH2FHJZN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simple sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  try {
    console.log("Connecting to Firestore database...");
    const snap = await getDocs(collection(db, "words"));
    const words = [];
    snap.forEach(doc => {
      const data = doc.data();
      // Only process words that have empty examples or have no real example (e.g. "No example sentence provided." or placeholder text)
      const hasNoExample = !data.example || 
                          data.example.trim() === "" || 
                          data.example.toLowerCase().includes("no example") ||
                          data.example.toLowerCase().includes("가상해석");
      if (hasNoExample) {
        words.push({ id: doc.id, ...data });
      }
    });

    console.log(`Found ${words.length} words with missing examples. Starting enrichment...`);

    let successCount = 0;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const cleanWord = w.word.trim();
      console.log(`[${i + 1}/${words.length}] Fetching for: "${cleanWord}" (Category: "${w.category}", Day: "${w.day}")...`);

      try {
        // Fetch example sentence from sentencedict.com
        const pageRes = await fetch(`https://sentencedict.com/${encodeURIComponent(cleanWord.toLowerCase())}.html`);
        if (!pageRes.ok) {
          console.log(`  -> Sentencedict returned status: ${pageRes.status}`);
          await sleep(1000);
          continue;
        }
        
        const html = await pageRes.text();
        const match = html.match(/<div id="all">[\s\S]*?<div>1 (.*?)<\/div>/);
        if (!match) {
          console.log('  -> No sentence found in sentencedict page.');
          await sleep(1000);
          continue;
        }

        let sentence = match[1].replace(/<[^>]+>/g, '').trim(); // Remove HTML tags
        
        // Translate to Korean
        const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(sentence)}`);
        let translation = "";
        if (transRes.ok) {
          const transData = await transRes.json();
          translation = transData[0][0][0];
        }

        // Format example as "English sentence [Korean translation]"
        const enrichedExample = translation ? `${sentence} [${translation}]` : sentence;

        // Update Firestore
        const docRef = doc(db, "words", w.id);
        await updateDoc(docRef, { example: enrichedExample });

        console.log(`  -> Enriched: "${enrichedExample}"`);
        successCount++;

      } catch (err) {
        console.error(`  -> Error processing word "${cleanWord}":`, err.message);
      }

      // Rest to avoid rate-limiting
      await sleep(1000);
    }

    console.log(`Enrichment complete! Successfully updated ${successCount} words with example sentences.`);
    process.exit(0);
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
}

run();
