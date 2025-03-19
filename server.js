const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

// Funzione per cercare su Wallapop
async function searchWallapop(query) {
    const url = `https://it.wallapop.com/app/search?keywords=${query}`;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const results = await page.evaluate(() => {
        const items = document.querySelectorAll(".ItemCardList__item");
        return Array.from(items).map(item => {
            const title = item.getAttribute("title") || "Sconosciuto";
            const price = item.querySelector(".ItemCard__price")?.innerText.trim() || "N/D";
            const link = item.getAttribute("href")?.startsWith("http") ? item.getAttribute("href") : `https://it.wallapop.com${item.getAttribute("href")}`;
            return { title, price, link };
        });
    });
    await browser.close();
    return results;
}

// Funzione per cercare su Vinted
async function searchVinted(query) {
    const url = `https://www.vinted.it/catalog?search_text=${query}`;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const results = await page.evaluate(() => {
        const items = document.querySelectorAll(".feed-grid__item");
        return Array.from(items).map(item => {
            const title = item.querySelector("h2")?.innerText.trim() || "Sconosciuto";
            const price = item.querySelector(".price")?.innerText.trim() || "N/D";
            const link = item.querySelector("a")?.href || "";
            return { title, price, link };
        });
    });
    await browser.close();
    return results;
}

// Endpoint API per la ricerca
app.get("/search", async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Missing query parameter 'q'" });

    try {
        const wallapopResults = await searchWallapop(query);
        const vintedResults = await searchVinted(query);
        res.json([...wallapopResults, ...vintedResults]);
    } catch (error) {
        res.status(500).json({ error: "Errore nel recupero dei dati" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
