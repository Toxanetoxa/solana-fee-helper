"use strict";
const API = 'http://localhost:8787/api/reco-fee?txType=transfer&risk=balanced';
async function tick() {
    try {
        const res = await fetch(API);
        const data = await res.json();
        await chrome.storage.local.set({ reco: data });
    }
    catch (e) {
        console.warn('tick error', e);
    }
}
setInterval(tick, 10000);
tick();
