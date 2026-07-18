// ===============================
// PocketURL v2.1
// ===============================

// NOTE: For a real deployment, don't ship an API key in client-side JS —
// proxy this request through your own backend so the key stays private.
const API_KEY = "your_api";

// ===============================
// DOM Elements
// ===============================

const longUrlInput = document.getElementById("longUrl");
const shortenBtn = document.getElementById("shortenBtn");
const shortUrlInput = document.getElementById("shortUrl");
const copyBtn = document.getElementById("copyBtn");
const errorMessage = document.getElementById("errorMessage");
const historyList = document.getElementById("historyList");
const emptyState = document.getElementById("emptyState");
const clearHistoryBtn = document.getElementById("clearHistory");
const themeToggle = document.getElementById("themeToggle");
const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");
const connectorOne = document.getElementById("connectorOne");
const connectorTwo = document.getElementById("connectorTwo");
const charCounter = document.getElementById("charCounter");
const successBadge = document.getElementById("successBadge");
const statsCard = document.getElementById("statsCard");
const charsSavedEl = document.getElementById("charsSaved");
const compressionEl = document.getElementById("compression");
const showQrBtn = document.getElementById("showQrBtn");
const qrCard = document.getElementById("qrCard");
const qrBody = document.getElementById("qrBody");
const downloadQrBtn = document.getElementById("downloadQrBtn");
const openBtn = document.getElementById("openBtn");
const searchHistory = document.getElementById("searchHistory");
const previewCard = document.getElementById("previewCard");
const siteIcon = document.getElementById("siteIcon");
const siteName = document.getElementById("siteName");
const siteDomain = document.getElementById("siteDomain");

// ===============================
// URL Validation
// ===============================

// auto-prepend https:// so "google.com" works instead of erroring
function normalizeURL(url) {
    url = url.trim();
    if (url !== "" && !/^https?:\/\//i.test(url)) {
        url = "https://" + url;
    }
    return url;
}

// friendlier display names for a few well-known sites
const siteNames = {
    "github.com": "GitHub",
    "youtube.com": "YouTube",
    "google.com": "Google",
    "amazon.in": "Amazon",
    "amazon.com": "Amazon",
    "linkedin.com": "LinkedIn",
    "openai.com": "OpenAI"
};

longUrlInput.addEventListener("input", () => {
    const url = normalizeURL(longUrlInput.value);

    try {
        const u = new URL(url);

        previewCard.style.display = "flex";
        siteDomain.textContent = u.hostname;
        siteName.textContent = siteNames[u.hostname] || u.hostname.replace("www.", "");
        siteIcon.src = `https://www.google.com/s2/favicons?sz=64&domain=${u.hostname}`;
    } catch {
        previewCard.style.display = "none";
    }
});

function isValidURL(url) {

    if (url.trim() === "") {
        errorMessage.textContent = "Please enter a URL.";
        return false;
    }

    try {
        new URL(url);
        errorMessage.textContent = "";
        return true;
    } catch {
        errorMessage.textContent = "Invalid URL.";
        return false;
    }
}

// ===============================
// Character Counter
// ===============================

longUrlInput.addEventListener("input", () => {
    const len = longUrlInput.value.length;
    charCounter.textContent = `${len} character${len === 1 ? "" : "s"}`;
});

// ===============================
// Toast
// ===============================

let toastTimer = null;

function showToast(message) {

    toastText.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// ===============================
// Success bounce badge
// ===============================

let successTimer = null;

function showSuccessBadge() {
    successBadge.classList.remove("show");
    void successBadge.offsetWidth; // restart animation
    successBadge.classList.add("show");

    clearTimeout(successTimer);
    successTimer = setTimeout(() => successBadge.classList.remove("show"), 2200);
}

// ===============================
// Connector pulse (signature motion)
// ===============================

function pulseConnector(connector, delay = 0) {
    setTimeout(() => {
        connector.classList.add("active");
        setTimeout(() => connector.classList.remove("active"), 1000);
    }, delay);
}

// ===============================
// Relative Time
// ===============================

function relativeTime(ts) {
    const diffMs = Date.now() - ts;
    const mins = Math.floor(diffMs / 60000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
}

// ===============================
// Local Storage
// ===============================

function getHistory() {

    const raw = JSON.parse(localStorage.getItem("history")) || [];

    // Backward-compatible with the old string-array format
    return raw.map(item =>
        typeof item === "string"
            ? { short: item, long: "", ts: Date.now() }
            : item
    );
}

function saveHistory(history) {
    localStorage.setItem("history", JSON.stringify(history));
}

function renderHistory() {

    const history = getHistory();

    historyList.innerHTML = "";

    if (history.length === 0) {
        historyList.appendChild(emptyState);
        return;
    }

    const query = searchHistory.value.toLowerCase().trim();

    const filtered = history.filter(item =>
        item.short.toLowerCase().includes(query) ||
        item.long.toLowerCase().includes(query)
    );

    filtered.forEach((item, index) => {

        const li = document.createElement("li");
        li.style.animationDelay = `${index * 45}ms`;

        li.innerHTML = `
            <div class="history-info">
                <span class="history-short">${item.short}</span>
                ${item.long ? `<span class="history-long">${item.long}</span>` : ""}
                <span class="history-time">${relativeTime(item.ts)}</span>
            </div>
            <div class="history-actions">
                <button class="history-copy" title="Copy" aria-label="Copy link">
                    <i class="fa-regular fa-copy"></i>
                </button>
                <button class="history-delete" title="Delete" aria-label="Delete link">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;

        // clicking the row opens the short link in a new tab
        li.addEventListener("click", () => window.open(item.short, "_blank"));

        li.querySelector(".history-copy").addEventListener("click", async (e) => {
            e.stopPropagation();
            await navigator.clipboard.writeText(item.short);

            const btn = e.currentTarget;
            btn.classList.add("copied");
            setTimeout(() => btn.classList.remove("copied"), 1500);

            showToast("Copied to clipboard!");
        });

        li.querySelector(".history-delete").addEventListener("click", (e) => {
            e.stopPropagation();
            const updated = getHistory().filter(h => h.short !== item.short);
            saveHistory(updated);
            renderHistory();
        });

        historyList.appendChild(li);

    });

}

renderHistory();

searchHistory.addEventListener("input", renderHistory);

// ===============================
// URL Statistics
// ===============================

function updateStats(longUrl, shortUrl) {
    const charsSaved = Math.max(longUrl.length - shortUrl.length, 0);
    const compression = longUrl.length
        ? Math.round((charsSaved / longUrl.length) * 100)
        : 0;

    charsSavedEl.textContent = charsSaved;
    compressionEl.textContent = `${compression}%`;
    statsCard.classList.add("show");
}

// ===============================
// QR Code
// ===============================

function resetQr() {
    qrCard.classList.remove("show");
    qrBody.innerHTML = "";
    showQrBtn.querySelector(".btn-label").innerHTML =
        '<i class="fa-solid fa-qrcode"></i> Show QR';
}

showQrBtn.addEventListener("click", () => {
    const isOpen = qrCard.classList.toggle("show");
    const label = showQrBtn.querySelector(".btn-label");

    if (isOpen) {
        label.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Hide QR';
        qrBody.innerHTML = "";
        new QRCode(qrBody, {
            text: shortUrlInput.value,
            width: 180,
            height: 180,
            colorDark: "#12141C",
            colorLight: "#ffffff"
        });
    } else {
        label.innerHTML = '<i class="fa-solid fa-qrcode"></i> Show QR';
    }
});

downloadQrBtn.addEventListener("click", () => {
    const rendered = qrBody.querySelector("canvas") || qrBody.querySelector("img");
    if (!rendered) return;

    const link = document.createElement("a");
    link.download = "pocketurl-qr.png";
    link.href = rendered.tagName === "CANVAS" ? rendered.toDataURL("image/png") : rendered.src;
    link.click();
});

// ===============================
// Shorten URL
// ===============================

async function shortenURL() {

    const longUrl = normalizeURL(longUrlInput.value);

    if (!isValidURL(longUrl))
        return;

    longUrlInput.value = longUrl; // reflect the auto-corrected URL

    shortenBtn.classList.add("loading");
    shortenBtn.disabled = true;

    const originalLabel = shortenBtn.querySelector(".btn-label").innerHTML;
    shortenBtn.querySelector(".btn-label").innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Shortening...';

    pulseConnector(connectorOne, 0);

    try {

        const response = await fetch("https://api.tinyurl.com/create", {

            method: "POST",

            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                url: longUrl
            })

        });

        const data = await response.json();

        if (!response.ok) {
            let msg = data.errors?.[0]?.message || "";

            if (response.status === 401) msg = "🔒 Invalid API Key";
            else if (response.status === 429) msg = "⚠ Rate limit exceeded";
            else if (response.status >= 500) msg = "🌐 Server unavailable";
            else if (!navigator.onLine) msg = "📡 No Internet Connection";
            else if (msg === "") msg = "Something went wrong";

            throw new Error(msg);
        }

        const shortURL = data.data.tiny_url;

        shortUrlInput.value = shortURL;

        resetQr();
        showQrBtn.hidden = false;
        openBtn.hidden = false;

        updateStats(longUrl, shortURL);
        showSuccessBadge();

        pulseConnector(connectorTwo, 250);

        const history = getHistory();

        // if this short URL already exists, drop the old entry first
        const existing = history.findIndex(item => item.short === shortURL);
        if (existing !== -1) history.splice(existing, 1);

        history.unshift({ short: shortURL, long: longUrl, ts: Date.now() });

        if (history.length > 10)
            history.pop();

        saveHistory(history);

        renderHistory();

        showToast("URL shortened successfully!");

    }

    catch (err) {
        errorMessage.textContent = err.message;
    }

    finally {
        shortenBtn.classList.remove("loading");
        shortenBtn.disabled = false;
        shortenBtn.querySelector(".btn-label").innerHTML = originalLabel;
    }

}

// ===============================
// Copy Button
// ===============================

copyBtn.addEventListener("click", async () => {

    if (shortUrlInput.value === "")
        return;

    await navigator.clipboard.writeText(shortUrlInput.value);

    const label = copyBtn.querySelector(".btn-label");
    const originalLabel = label.innerHTML;

    copyBtn.classList.add("copied");
    label.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';

    setTimeout(() => {
        copyBtn.classList.remove("copied");
        label.innerHTML = originalLabel;
    }, 1500);

    showToast("Copied to clipboard!");

});

// ===============================
// Clear History
// ===============================

clearHistoryBtn.addEventListener("click", () => {

    localStorage.removeItem("history");

    renderHistory();

    showToast("History cleared");

});

// ===============================
// Dark Mode
// ===============================

const currentTheme = localStorage.getItem("theme");

if (currentTheme === "dark") {
    document.body.classList.add("dark");
}

themeToggle.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    localStorage.setItem(
        "theme",
        document.body.classList.contains("dark") ? "dark" : "light"
    );

});

// ===============================
// Event Listeners
// ===============================

openBtn.addEventListener("click", () => {
    if (shortUrlInput.value)
        window.open(shortUrlInput.value, "_blank");
});

shortenBtn.addEventListener("click", shortenURL);

longUrlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter")
        shortenURL();
});
