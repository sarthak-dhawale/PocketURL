// ===============================
// PocketURL v2.0
// ===============================

// NOTE: For a real deployment, don't ship an API key in client-side JS —
// proxy this request through your own backend so the key stays private.
const API_KEY = "MEbX3GcgxmMK9w333gU9fO4qfgOojLpckwSj2RlTRn13XLapCiEkrXhEd5F1";

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

// ===============================
// URL Validation
// ===============================

function isValidURL(url) {

    if (url.trim() === "") {
        errorMessage.textContent = "Please enter a URL.";
        return false;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        errorMessage.textContent = "URL must start with http:// or https://";
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
// Connector pulse (signature motion)
// ===============================

function pulseConnector(connector, delay = 0) {
    setTimeout(() => {
        connector.classList.add("active");
        setTimeout(() => connector.classList.remove("active"), 1000);
    }, delay);
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

    history.forEach((item, index) => {

        const li = document.createElement("li");
        li.style.animationDelay = `${index * 45}ms`;

        li.innerHTML = `
            <div class="history-info">
                <span class="history-short">${item.short}</span>
                ${item.long ? `<span class="history-long">${item.long}</span>` : ""}
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

        li.querySelector(".history-copy").addEventListener("click", async () => {
            await navigator.clipboard.writeText(item.short);
            showToast("Copied to clipboard!");
        });

        li.querySelector(".history-delete").addEventListener("click", () => {
            const updated = getHistory().filter(h => h.short !== item.short);
            saveHistory(updated);
            renderHistory();
        });

        historyList.appendChild(li);

    });

}

renderHistory();

// ===============================
// Shorten URL
// ===============================

async function shortenURL() {

    const longUrl = longUrlInput.value.trim();

    if (!isValidURL(longUrl))
        return;

    shortenBtn.classList.add("loading");
    shortenBtn.disabled = true;

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
            throw new Error(data.errors?.[0]?.message || "Something went wrong");
        }

        const shortURL = data.data.tiny_url;

        shortUrlInput.value = shortURL;

        pulseConnector(connectorTwo, 250);

        const history = getHistory();

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
    }

}

// ===============================
// Copy Button
// ===============================

copyBtn.addEventListener("click", async () => {

    if (shortUrlInput.value === "")
        return;

    await navigator.clipboard.writeText(shortUrlInput.value);

    copyBtn.classList.add("copied");
    setTimeout(() => copyBtn.classList.remove("copied"), 1200);

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

shortenBtn.addEventListener("click", shortenURL);

longUrlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter")
        shortenURL();
});