if (window.__browserStorageExplorerLoaded) {
  chrome.runtime.onMessage.removeListener(window.__browserStorageExplorerListener);
}

window.__browserStorageExplorerLoaded = true;

function byteSize(value) {
  return new Blob([String(value ?? "")]).size;
}

function readStorage(storage, type) {
  const items = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    const value = storage.getItem(key);

    items.push({
      key,
      value,
      type,
      size: byteSize(key) + byteSize(value)
    });
  }

  return items;
}

async function estimateStorage() {
  if (!navigator.storage?.estimate) {
    return null;
  }

  const estimate = await navigator.storage.estimate();
  return {
    usage: estimate.usage ?? 0,
    quota: estimate.quota ?? 0
  };
}

window.__browserStorageExplorerListener = (message, _sender, sendResponse) => {
  if (message?.type !== "READ_WEB_STORAGE") {
    return false;
  }

  Promise.resolve()
    .then(async () => {
      sendResponse({
        ok: true,
        origin: location.origin,
        storageEstimate: await estimateStorage(),
        items: [
          ...readStorage(window.localStorage, "localStorage"),
          ...readStorage(window.sessionStorage, "sessionStorage")
        ]
      });
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error.message || "Unable to read page storage."
      });
    });

  return true;
};

chrome.runtime.onMessage.addListener(window.__browserStorageExplorerListener);
