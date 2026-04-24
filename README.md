# ⚔️ Initiative Tracker

A self-hosted, browser-based initiative tracker for D&D 5e — built as a single HTML file with an optional Node.js WebSocket server for real-time multi-device sync.

![Dark mode screenshot](screenshots/Screenshot_Presentation%20Mode.jpg)

## Features

- **Initiative management** — add PCs, NPCs, monsters and layer effects, roll d20, auto-sort
- **Presentation mode** — full-screen carousel view designed for a TV or second screen
- **Real-time sync** — multiple devices stay in sync instantly via WebSocket
- **Roster** — save recurring characters as templates, load into combat with one click
- **Conditions** — full D&D 5e condition tracking with quick-edit panel
- **Combat timer** — track time per turn, per round, and total fight duration
- **Encounter name** — name your fights, synced across all devices
- **Death tracking** — mark characters as dead, greyed out but still visible
- **Duplicate** — quickly clone monsters (Goblin 1, Goblin 2...)
- **JSON export/import** — save and reload sessions including character images
- **Light/dark mode**
- **Self-hosted** — no external services, all data stays on your network

---

## Usage

### Standalone (no server)

Just open `index.html` in any browser. Everything works locally — roster is saved in `localStorage`, no installation required.

### With real-time sync (homelab / self-hosted)

Requires Docker. All devices on the same network will stay in sync automatically.

#### 1. Copy files to your server

```bash
# Create directories
ssh user@pi "mkdir -p /opt/homelab/data/initiative-tracker /opt/homelab/stacks/initiative-tracker"

# Copy app files
scp index.html user@pi:/opt/homelab/data/initiative-tracker/index.html
scp server/server.js user@pi:/opt/homelab/data/initiative-tracker/server.js
scp server/nginx.conf user@pi:/opt/homelab/data/initiative-tracker/nginx.conf
scp server/proxy.conf user@pi:/opt/homelab/data/initiative-tracker/proxy.conf
scp server/docker-compose.yml user@pi:/opt/homelab/stacks/initiative-tracker/docker-compose.yml
```

#### 2. Start

```bash
ssh user@pi
cd /opt/homelab/stacks/initiative-tracker
docker compose up -d
```

App is now available at `http://pi-ip:8088` for all devices on your network.

#### 3. Update the app

```bash
# Only the HTML needs to be copied — no restart required
scp index.html user@pi:/opt/homelab/data/initiative-tracker/index.html
```

Only restart needed when `server.js` changes:
```bash
docker compose restart initiative-sync
```

---

## Overlay Mode

The overlay mode shows a compact initiative strip designed to sit at the top of your screen while you work in other windows.

1. Open the app in your browser
2. Click **⧉** (top right) to enter overlay mode
3. Resize the browser window to ~120px height and position it at the top of your screen
4. On Windows: use [PowerToys](https://github.com/microsoft/PowerToys) → **Win+Ctrl+T** to pin it always on top
5. Click **✕** in the overlay to return to the normal view

---

## Tech

- Single `index.html` — no build step, no dependencies, no framework
- `server.js` — ~100 lines of Node.js, WebSocket only
- Images are cached server-side and only transmitted once per session (~1KB per turn after initial load)
- Sequence numbers prevent race conditions when multiple devices control the tracker simultaneously

---

## License

MIT — do whatever you want with it.
