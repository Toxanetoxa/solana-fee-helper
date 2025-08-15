"use strict";
async function read() {
    const { reco } = await chrome.storage.local.get('reco');
    const el = document.getElementById('out');
    el.textContent = reco
        ? `fee: ${reco.priorityFeeLamports} | success: ${Math.round(reco.successScore * 100)}%`
        : 'no data';
}
setInterval(read, 1500);
read();
