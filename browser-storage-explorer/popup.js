const state = {
  items: [],
  activeFilter: "all",
  search: ""
};

const elements = {
  siteLabel: document.querySelector("#siteLabel"),
  refreshBtn: document.querySelector("#refreshBtn"),
  totalCount: document.querySelector("#totalCount"),
  totalSize: document.querySelector("#totalSize"),
  quotaSize: document.querySelector("#quotaSize"),
  searchInput: document.querySelector("#searchInput"),
  tabs: document.querySelectorAll(".tab"),
  status: document.querySelector("#status"),
  itemsTable: document.querySelector("#itemsTable")
};

function byteSize(value) {
  return new Blob([String(value ?? "")]).size;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setStatus(message) {
  elements.status.hidden = !message;
  elements.status.textContent = message || "";
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function readPageStorage(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });

  return chrome.tabs.sendMessage(tabId, { type: "READ_WEB_STORAGE" });
}

async function readCookies(url) {
  const cookies = await chrome.cookies.getAll({ url });

  return cookies.map((cookie) => ({
    key: cookie.name,
    value: cookie.value,
    type: "cookie",
    size: byteSize(cookie.name) + byteSize(cookie.value),
    domain: cookie.domain,
    path: cookie.path
  }));
}

function filterItems() {
  const query = state.search.trim().toLowerCase();

  return state.items.filter((item) => {
    const matchesFilter = state.activeFilter === "all" || item.type === state.activeFilter;
    const matchesSearch = !query || [item.key, item.value, item.type].some((field) => {
      return String(field ?? "").toLowerCase().includes(query);
    });

    return matchesFilter && matchesSearch;
  });
}

function render() {
  const filteredItems = filterItems();
  const totalSize = state.items.reduce((sum, item) => sum + item.size, 0);

  elements.totalCount.textContent = String(state.items.length);
  elements.totalSize.textContent = formatBytes(totalSize);

  if (!filteredItems.length) {
    elements.itemsTable.innerHTML = `<tr><td class="empty" colspan="4">No matching storage entries</td></tr>`;
    return;
  }

  elements.itemsTable.innerHTML = filteredItems.map((item) => {
    return `
      <tr>
        <td title="${escapeHtml(item.key)}">${escapeHtml(item.key)}</td>
        <td title="${escapeHtml(item.value)}">${escapeHtml(item.value)}</td>
        <td><span class="pill ${item.type}">${escapeHtml(item.type)}</span></td>
        <td>${formatBytes(item.size)}</td>
      </tr>
    `;
  }).join("");
}

function renderQuota(estimate) {
  if (!estimate?.quota) {
    elements.quotaSize.textContent = "N/A";
    return;
  }

  const percent = estimate.quota ? Math.round((estimate.usage / estimate.quota) * 1000) / 10 : 0;
  elements.quotaSize.textContent = `${percent}%`;
}

async function loadStorage() {
  setStatus("");
  elements.itemsTable.innerHTML = `<tr><td class="empty" colspan="4">Loading storage data...</td></tr>`;

  try {
    const tab = await getActiveTab();

    if (!tab?.id || !tab.url || !/^https?:\/\//.test(tab.url)) {
      throw new Error("Open an http or https website, then refresh the extension.");
    }

    elements.siteLabel.textContent = new URL(tab.url).origin;

    const [pageStorage, cookies] = await Promise.all([
      readPageStorage(tab.id),
      readCookies(tab.url)
    ]);

    if (!pageStorage?.ok) {
      throw new Error(pageStorage?.error || "Unable to read web storage for this page.");
    }

    state.items = [...pageStorage.items, ...cookies].sort((a, b) => {
      return a.type.localeCompare(b.type) || a.key.localeCompare(b.key);
    });

    renderQuota(pageStorage.storageEstimate);
    render();
  } catch (error) {
    state.items = [];
    renderQuota(null);
    render();
    setStatus(error.message || "Unable to load storage data.");
  }
}

elements.refreshBtn.addEventListener("click", loadStorage);

elements.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  render();
});

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    elements.tabs.forEach((item) => item.classList.remove("is-active"));
    tab.classList.add("is-active");
    state.activeFilter = tab.dataset.filter;
    render();
  });
});

loadStorage();
