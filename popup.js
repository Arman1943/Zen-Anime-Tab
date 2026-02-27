// popup.js — Fully Random Override & Broad Categories

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

const container = document.getElementById("options");
const fullyRandomCheckbox = document.getElementById("fullyRandom");

// --- Random Toggle Logic ---
fullyRandomCheckbox.addEventListener("change", (e) => {
  const isRandom = e.target.checked;
  const checkboxes = document.querySelectorAll(
    '#options input[type="checkbox"]',
  );

  checkboxes.forEach((box) => {
    box.disabled = isRandom;
    box.parentElement.classList.toggle("disabled", isRandom);
  });

  // If we just turned OFF random and nothing is checked, safely check the first one
  if (!isRandom) {
    const hasChecked = Array.from(checkboxes).some((b) => b.checked);
    if (!hasChecked) checkboxes[0].checked = true;
  }

  saveOptions();
});

// --- Button Logic ---
document.getElementById("selectAll").addEventListener("click", () => {
  if (fullyRandomCheckbox.checked) return; // Prevent clicking if random is on
  toggleAll(true);
});

document.getElementById("deselectAll").addEventListener("click", () => {
  if (fullyRandomCheckbox.checked) return;
  toggleAll(false);
});

function toggleAll(checkStatus) {
  const checkboxes = document.querySelectorAll(
    '#options input[type="checkbox"]',
  );
  checkboxes.forEach((box) => (box.checked = checkStatus));
  saveOptions();
}

// --- Standard Logic ---
function restoreOptions() {
  chrome.storage.local.get(
    { allowedCategories: ALL_CATEGORIES, fullyRandom: false },
    (items) => {
      fullyRandomCheckbox.checked = items.fullyRandom;

      const validSaved = items.allowedCategories.filter((c) =>
        ALL_CATEGORIES.includes(c),
      );
      const finalSelection =
        validSaved.length > 0 ? validSaved : ALL_CATEGORIES;

      renderCheckboxes(finalSelection, items.fullyRandom);
    },
  );
}

function formatName(str) {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function renderCheckboxes(activeList, isRandom) {
  container.innerHTML = "";

  ALL_CATEGORIES.forEach((cat) => {
    const div = document.createElement("div");
    div.className = `option ${isRandom ? "disabled" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = cat;
    checkbox.value = cat;
    checkbox.disabled = isRandom;

    if (activeList.includes(cat)) {
      checkbox.checked = true;
    }

    const label = document.createElement("label");
    label.htmlFor = cat;
    label.innerText = formatName(cat);

    checkbox.addEventListener("change", saveOptions);

    div.appendChild(checkbox);
    div.appendChild(label);
    container.appendChild(div);
  });
}

function saveOptions() {
  const isRandom = fullyRandomCheckbox.checked;
  let selected = [];

  if (!isRandom) {
    const checkedBoxes = document.querySelectorAll(
      '#options input[type="checkbox"]:checked',
    );
    selected = Array.from(checkedBoxes).map((box) => box.value);

    if (selected.length === 0) {
      alert("You must keep at least one category active!");
      const firstBox = document.querySelector(
        '#options input[type="checkbox"]',
      );
      if (firstBox) firstBox.checked = true;
      saveOptions();
      return;
    }
  }

  chrome.storage.local.set(
    {
      allowedCategories: selected,
      fullyRandom: isRandom,
    },
    () => {
      chrome.runtime.sendMessage({ type: "CATEGORY_CHANGED" });
    },
  );
}

restoreOptions();
