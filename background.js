// background.js — Concurrent Downloads & Fully Random Support

const API_BASE = "https://api.nekosia.cat/api/v1/images/";
const DB_NAME = "anime_image_db";
const STORE = "images";

const QUEUE_TARGET = 15;
const CONCURRENT_FETCHES = 2;

// Expanded safe & broad categories
const ALL_CATEGORIES = [
  "cute",
  "catgirl",
  "foxgirl",
  "maid",
  "vtuber",
  "uniform",
  "swimsuit",
  "wolfgirl",
  "bunnygirl",
  "thigh-high-socks",
];

let isFilling = false;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbAdd(db, record) {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add(record).onsuccess = () => resolve();
  });
}

function idbCount(db) {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    tx.objectStore(STORE).count().onsuccess = (e) => resolve(e.target.result);
  });
}

function clearDB() {
  return new Promise(async (resolve) => {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear().onsuccess = () => {
      db.close();
      resolve();
    };
  });
}

// --- THE FIX: Fully Random Override ---
async function getActiveCategories() {
  try {
    const res = await chrome.storage.local.get([
      "allowedCategories",
      "fullyRandom",
    ]);

    // If Fully Random is checked, ignore specific selections and use ALL of them
    if (res.fullyRandom) {
      return ALL_CATEGORIES;
    }

    if (res && res.allowedCategories && res.allowedCategories.length > 0) {
      return res.allowedCategories.filter((c) => ALL_CATEGORIES.includes(c));
    }
  } catch (e) {
    console.warn("Storage read failed", e);
  }
  return ALL_CATEGORIES;
}

async function fetchImageBlob(category) {
  const metaRes = await fetch(API_BASE + category, { cache: "no-store" });
  if (!metaRes.ok) throw new Error("API Offline or Broken Category");

  const meta = await metaRes.json();
  const imgUrl = meta?.image?.original?.url || meta?.image?.compressed?.url;
  if (!imgUrl) throw new Error("API returned no image URL");

  const imgRes = await fetch(imgUrl, { cache: "no-store" });
  if (!imgRes.ok) throw new Error("Image server offline");

  return await imgRes.blob();
}

async function fillQueue() {
  if (isFilling) return;
  isFilling = true;

  try {
    const db = await openDB();
    let allowedCats = await getActiveCategories();

    // Failsafe
    if (allowedCats.length === 0) allowedCats = ALL_CATEGORIES;

    while (true) {
      let count = await idbCount(db);
      let needed = QUEUE_TARGET - count;

      if (needed <= 0) break;

      let batchSize = Math.min(needed, CONCURRENT_FETCHES);
      let promises = [];

      for (let i = 0; i < batchSize; i++) {
        promises.push(
          (async () => {
            const randomCat =
              allowedCats[Math.floor(Math.random() * allowedCats.length)];
            try {
              const blob = await fetchImageBlob(randomCat);
              await idbAdd(db, { category: randomCat, ts: Date.now(), blob });
            } catch (err) {
              console.warn(
                `Skipping broken image (${randomCat}):`,
                err.message,
              );
            }
          })(),
        );
      }

      await Promise.all(promises);
    }
    db.close();
  } finally {
    isFilling = false;
  }
}

// Triggers
chrome.runtime.onInstalled.addListener(() => {
  clearDB().then(fillQueue);
});
chrome.runtime.onStartup.addListener(fillQueue);

// Listeners
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "CATEGORY_CHANGED") {
    clearDB().then(fillQueue);
  } else if (msg.type === "REFILL_QUEUE") {
    fillQueue();
  }
});
