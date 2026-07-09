# Browser Storage Explorer

A Chrome/Edge browser extension for exploring client-side storage on the active website.

## Features

- Displays `localStorage`, `sessionStorage`, and cookies in one organized table.
- Shows each entry's key, value, storage type, and approximate byte size.
- Includes search across keys, values, and storage type.
- Includes filter tabs for all storage, local storage, session storage, and cookies.
- Uses page Web Storage APIs for `localStorage` and `sessionStorage`.
- Uses the Chrome Cookies API for cookies.
- Uses `navigator.storage.estimate()` to show approximate quota usage when available.

## Source Files

```text
manifest.json   Extension manifest
background.js   Extension install setup
content.js      Reads page localStorage/sessionStorage and Storage API quota estimates
popup.html      Popup interface
popup.css       Popup styling
popup.js        Popup logic, search, filters, cookies, and rendering
```

## How To Load The Extension

1. Open Chrome or Edge.
2. Go to `chrome://extensions` or `edge://extensions`.
3. Turn on Developer mode.
4. Click `Load unpacked`.
5. Select this folder:

```text
browser-storage-explorer
```

6. Open any `http` or `https` website.
7. Click the extension icon to inspect storage for that site.

## Notes

- Browser extension pages cannot inspect restricted pages such as `chrome://extensions`.
- Cookies are read for the active tab URL using the extension `cookies` permission.
- Values are read only in this version; the extension does not edit or delete website storage.
- Approximate size is calculated from the key and value text byte lengths.
