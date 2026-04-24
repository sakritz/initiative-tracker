// server.js – Initiative Tracker WebSocket Sync Server
// v2: sequence numbers prevent race conditions; assets cached separately from live state.

const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3001;

// ── State ──────────────────────────────────────────────────────────────────
// liveState  = lightweight entries WITHOUT images (~1-5 KB), broadcast every change
// assetCache = images keyed by entry id, sent once per new image (can be MBs)

let liveState  = null;
let assetCache = {};
let serverSeq  = 0;   // server-authoritative sequence number

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, clients: wss.clients.size, seq: serverSeq }));
    return;
  }
  res.writeHead(404); res.end();
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log(`[+] Client connected (total: ${wss.clients.size})`);

  // Send full live state + all cached assets to newly connected client
  if (liveState !== null) {
    ws.send(JSON.stringify({ type: 'state', payload: liveState }));
    for (const [id, asset] of Object.entries(assetCache)) {
      ws.send(JSON.stringify({ type: 'asset', id, image: asset.image }));
    }
  }

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'state') {
      const incoming = msg.payload;
      const newSeq = serverSeq++;
      const stripped = {
        ...incoming,
        seq: newSeq,
        clientId: incoming.clientId,
        entries: (incoming.entries || []).map(({ image, ...rest }) => rest),
      };

      // Extract any images bundled in entries (legacy / reconnect case)
      for (const e of (incoming.entries || [])) {
        if (e.image && e.image !== (assetCache[String(e.id)] || {}).image) {
          assetCache[String(e.id)] = { image: e.image };
          console.log(`[asset] Cached image for entry ${e.id} (via state)`);
        }
      }
      // Prune removed entries
      const activeIds = new Set((incoming.entries || []).map(e => String(e.id)));
      for (const id of Object.keys(assetCache)) {
        if (!activeIds.has(id)) { delete assetCache[id]; }
      }

      liveState = stripped;
      broadcast(ws, JSON.stringify({ type: 'state', payload: liveState }));
    }

    // Dedicated asset message – fast path, no state broadcast needed
    if (msg.type === 'asset') {
      if (msg.id && msg.image) {
        assetCache[String(msg.id)] = { image: msg.image };
        console.log(`[asset] Cached image for entry ${msg.id} (dedicated)`);
        // Forward to all other clients
        broadcast(ws, JSON.stringify({ type: 'asset', id: msg.id, image: msg.image }));
      }
    }
  });

  ws.on('close', (code, reason) => console.log(`[-] Client disconnected (total: ${wss.clients.size}) code=${code} reason=${reason||'none'}`));
  ws.on('error', (err) => console.error('[!] WS error:', err.message));
});

function broadcast(sender, data) {
  wss.clients.forEach(c => { if (c !== sender && c.readyState === 1) c.send(data); });
}
function broadcastAll(data) {
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(data); });
}

server.listen(PORT, () => console.log(`Initiative Tracker sync server v2 on port ${PORT}`));
