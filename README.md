# 🌸 Anime New Tab (Zero-Latency Edition)

A beautifully aesthetic, high-performance Chrome extension that replaces your default new tab page with high-quality anime artwork. 

Unlike standard image-fetching extensions that leave you staring at a blank screen while the image downloads, this extension features a custom **Zero-Latency Preloading Engine**. It silently queues images in the background using IndexedDB, guaranteeing a 0ms render time the moment you open a new tab.

## ✨ Features

* **⚡ 0ms Load Times:** Uses IndexedDB and background caching to ensure your image is fully rendered the exact millisecond your new tab opens.
* **🎨 Customizable Categories:** Choose exactly what you want to see via the extension popup (Catgirls, Maids, Uniforms, Foxgirls, etc.).
* **🎲 Fully Random Mode:** Don't want to choose? Toggle the "Fully Random" feature to cycle through everything.
* **🔍 Built-in Search:** A sleek, centered Google search bar so you don't lose the functionality of your standard new tab.
* **🛡️ Crash-Proof & Offline Fallback:** Bypasses Chrome's 5MB local storage limit by utilizing raw Blob data, and includes a seamless offline fallback if your internet drops.
* **💨 Concurrent Downloading:** The background worker pulls multiple images simultaneously to ensure your image buffer never runs dry, even if you spam open 20 tabs at once.

## 🚀 Installation (Developer Mode)

Since this extension is not currently on the Chrome Web Store, you can install it manually in a few seconds:

1. Download or clone this repository to your local machine.
2. Open Google Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right corner).
4. Click **Load unpacked** in the top left corner.
5. Select the folder containing these extension files.
6. Open a new tab and enjoy!

## 🛠️ How the Preloading Engine Works

To achieve true zero-latency rendering, this extension completely bypasses standard `fetch()` calls on the new tab page:
1. The `background.js` worker runs silently, maintaining a constant buffer of 15 high-res image Blobs inside Chrome's IndexedDB.
2. When you open a new tab, `newtab.js` pulls the next available Blob from the local database and creates an instant local Object URL.
3. The image is deleted from the queue, and the background worker is pinged to simultaneously download replacement images to refill the buffer.

## 🤝 Credits & API

* **Image API:** Powered by the awesome [Nekosia API](https://nekosia.cat/). All image generation and tagging credits go to their community and platform.
* **Icons/Assets:** *(Add any credits here if you use specific icon packs, or delete this bullet if not)*

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
