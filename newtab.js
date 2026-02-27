// newtab.js — Fully Optimized IndexedDB Approach

const img = document.getElementById("animeImage");
const bg = document.getElementById("bg");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("search");

const DB_NAME = "anime_image_db";
const STORE = "images";
const QUEUE_TARGET = 15;
// 1. Apply image visually
function applyImage(src) {
  img.src = src;
  bg.style.backgroundImage = `url(${src})`;
}

// 2. Fetch directly from IndexedDB (Bypasses the 5MB limit entirely)
function getNextImageFromDB() {
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.close();
        return resolve(null);
      }

      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const cursorReq = store.openCursor();

      cursorReq.onsuccess = () => {
        const cur = cursorReq.result;
        if (cur) {
          const blob = cur.value.blob;
          cur.delete(); // Delete it instantly so the next tab gets a fresh image
          db.close();
          resolve(blob);
        } else {
          db.close();
          resolve(null); // The queue is completely empty
        }
      };
      cursorReq.onerror = () => {
        db.close();
        resolve(null);
      };
    };
    req.onerror = () => resolve(null);
  });
}

// 3. Main Execution
async function init() {
  // Grab the image directly from the local database
  const blob = await getNextImageFromDB();

  if (blob) {
    // FAST PATH: Instantly display the image using a local object URL (~10ms)
    applyImage(URL.createObjectURL(blob));
  } else {
    // SLOW PATH FALLBACK: If you rapidly opened 15 tabs and drained the queue,
    // show your fallback image instantly so you never stare at a blank screen.
    applyImage("offline/fallback.jpg");

    // Attempt a live fetch to replace the fallback gracefully
    fetch("https://api.nekosia.cat/api/v1/images/catgirl")
      .then((res) => res.json())
      .then((json) => {
        const url = json?.image?.original?.url || json?.image?.compressed?.url;
        if (url) applyImage(url);
      })
      .catch(() => {});
  }

  // Tell the background script to download more images to replace what we just took
  chrome.runtime.sendMessage({ type: "REFILL_QUEUE" });
}

init();

// --- Standard Search Form Event ---
if (searchForm && searchInput) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (q)
      window.location.href =
        "https://www.google.com/search?q=" + encodeURIComponent(q);
  });
}
