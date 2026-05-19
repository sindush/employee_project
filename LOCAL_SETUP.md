# Local employee CRUD practice setup

## Run locally (two terminals)

**Terminal 1 — JSON API (port 8001):**
```bash
npm run api
```

**Terminal 2 — Angular (default port 4200, uses proxy):**
```bash
npm start
```

Or both: `npm run dev` (after `npm install`).

## Verify API before Angular

| Action | URL (direct on json-server) |
|--------|----------------------------|
| List   | http://localhost:8001/employees |
| One    | http://localhost:8001/employees/1 |

Angular should call **relative** URLs only:

- `GET /api/employees` → proxied → `http://localhost:8001/employees`

## Common 404 causes

1. **json-server not running** on port 8001.
2. **Wrong URL** — use `/api/employees`, not `http://localhost:8001/api/employees` (unless interviewer removed `pathRewrite`).
3. **Wrong resource name** — key in `db.json` must be `employees` (matches URL path).
4. **Proxy not loaded** — restart `ng serve` after changing `proxy.conf.json`; check `angular.json` has `"proxyConfig": "proxy.conf.json"`.
5. **Calling port 8001 from browser without proxy** — can work but needs CORS; prefer `/api/...` through Angular dev server.
