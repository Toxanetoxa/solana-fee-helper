const box = document.createElement('div');
box.style.position = 'fixed';
box.style.zIndex = '999999';
box.style.right = '10px';
box.style.bottom = '10px';
box.style.padding = '8px 10px';
box.style.background = '#111';
box.style.color = '#fff';
box.style.borderRadius = '6px';
box.style.font = '12px/1.4 system-ui,sans-serif';
box.textContent = 'Solana Helper: loading…';
document.documentElement.appendChild(box);

async function update() {
    const { reco } = await chrome.storage.local.get('reco');
    if (!reco) return;
    box.textContent = `Fee: ${reco.priorityFeeLamports} | Success: ${Math.round(reco.successScore*100)}%`;
}
setInterval(update, 1500);
update();
