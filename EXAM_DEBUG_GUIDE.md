# Exam debugging guide — API, proxy, json-server (no extra tabs)

Use this when you only have:

- The **exam code editor / terminal**
- The **app preview** (WebContainer / StackBlitz-style URL)
- **Browser DevTools → Network** (no second tab, no Postman)

Goal: find the root cause **one layer at a time**, using **terminal logs** + **Network tab**.

---

## Part A — How your stack fits together

```
Browser (preview URL, port 4200)
    → GET /api/employees
Angular dev server (ng serve) + proxy.conf.json
    → forwards to http://localhost:8001/employees
json-server (reads db.json)
    → returns JSON
```

| Layer | Who runs it | What you check |
|-------|-------------|----------------|
| 1. json-server | Terminal: `npm run api` | Terminal output + db.json |
| 2. Proxy | `proxy.conf.json` + `angular.json` | Terminal proxy logs + Network URL on **4200** host |
| 3. Angular service | `employeeservice.ts` | URL must be `/api/...` |
| 4. Component | `home.ts`, etc. | `subscribe`, `console.log` |

---

## Part B — Turn on terminal logs (Angular + proxy)

### B1. Proxy logs (already in your project)

`proxy.conf.json` has:

```json
"logLevel": "debug"
```

**Where to look:** Terminal where **`ng serve` / `npm start`** runs (not the json-server terminal).

**What you should see** when the app calls the API:

```text
[HPM] GET /api/employees -> http://localhost:8001
```

| Terminal shows | Meaning |
|----------------|---------|
| `[HPM] GET /api/employees -> ...` | Request hit the proxy |
| Nothing when you load employees | Request never matched `/api` (wrong URL in service) |
| `ECONNREFUSED` / `Error proxying` | json-server not running on 8001 |

**After changing `proxy.conf.json`:** stop and restart `ng serve`.

---

### B2. Angular / component logs (exam-safe)

Add temporary logs in the component (remove before submit if rules say so).

**Home — `loadEmployees()`:**

```typescript
loadEmployees(): void {
  console.log('[Home] loadEmployees called');
  this.loading = true;
  this.error = '';
  this.employeeService.getAllEmployees().subscribe({
    next: (data) => {
      console.log('[Home] API success, count:', data?.length, data);
      this.employees = data;
      this.loading = false;
    },
    error: (err) => {
      console.error('[Home] API error', err.status, err.statusText, err);
      this.error = err.message ?? 'Request failed';
      this.loading = false;
    },
  });
}
```

**Where to read logs in exam environments:**

1. **Browser DevTools → Console** (same preview window → F12 or right-click → Inspect).
2. Some platforms show **terminal** output from the dev server when `console.log` is forwarded (less common).

Use **both** Console and Network; Network proves the HTTP call, Console proves your code ran.

---

### B3. One-line log in the service (optional)

`employeeservice.ts`:

```typescript
getAllEmployees(): Observable<Employee[]> {
  console.log('[Service] GET', this.baseUrl);
  return this.http.get<Employee[]>(this.baseUrl);
}
```

If Console shows `[Service] GET /api/employees` but Network shows nothing → unlikely; usually both appear.

If Console shows service log but **no Network entry** → request blocked before send (rare).

---

## Part C — Debugging steps (one by one, exam mode)

Do **not** skip steps. Stop at the first failure and fix that layer only.

---

### Step 1 — Is json-server running?

**Terminal (api / json-server):**

Look for:

```text
Resources
http://localhost:8001/employees
```

**If missing or terminal shows error:**

- Run: `npm run api` or `json-server --watch db.json --port 8001`
- Fix port conflict if “address already in use”

**Pass:** Terminal lists `http://localhost:8001/employees`  
**Fail:** Fix server before touching Angular.

---

### Step 2 — Is `db.json` valid?

Open `db.json` in the editor.

**Required shape:**

```json
{
  "employees": [
    {
      "id": 1,
      "name": "...",
      "phone": "...",
      "address": "...",
      "department": "...",
      "role": "..."
    }
  ]
}
```

| Check | Why |
|-------|-----|
| Root key is `"employees"` (plural) | URL is `/employees` |
| Valid JSON (no trailing commas) | json-server won’t start |
| Each item has `id` for GET/PUT/DELETE by id | Edit/delete 404 without id |

**Pass:** File saves with no JSON errors; server terminal still shows `/employees`  
**Fail:** Fix JSON → restart json-server.

---

### Step 3 — Test API **without** opening a new tab (Network trick)

You may not have a second tab. Use **address bar of the same preview** or **Network**:

**Option A — Same preview, change path**

If preview is:

`https://....--4200--....webcontainer.io`

Manually change URL to (same host, only path):

`https://....--4200--....webcontainer.io/api/employees`

This tests **Angular host + proxy** in one navigation.

| Result | Next step |
|--------|-----------|
| JSON array | Proxy + server OK → go to Step 6 (component) |
| 404 HTML | Step 4 (proxy) |
| 502 / failed | Step 1 (server down) or proxy target wrong |

**Option B — Network tab only**

1. Run the app (home page).
2. Open DevTools → **Network**.
3. Reload preview or click action that loads employees.
4. Find request named `employees` or path `/api/employees`.

If **no request appears** → component not calling API (Step 6).  
If **request appears** → read Step 5.

---

### Step 4 — Proxy configuration

**Files:**

| File | Check |
|------|--------|
| `proxy.conf.json` | `"/api"` → `"target": "http://localhost:8001"` |
| `proxy.conf.json` | `pathRewrite`: `"^/api": ""` strips prefix |
| `angular.json` → `serve` → `options` | `"proxyConfig": "proxy.conf.json"` |

**Expected rewrite:**

| Browser requests (4200 host) | json-server receives |
|------------------------------|----------------------|
| `/api/employees` | `http://localhost:8001/employees` |
| `/api/employees/1` | `http://localhost:8001/employees/1` |

**Terminal (ng serve):** Look for `[HPM]` lines (see Part B1).

**Common exam mistakes:**

| Mistake | Symptom |
|---------|---------|
| Service uses `/employees` without `/api` | 404 from Angular dev server, no `[HPM]` log |
| Service uses full `https://...--8001--...` URL | CORS error in Console; two different hosts |
| Service uses `http://localhost:8001/...` | Status 0 or failed in container browser |
| Changed proxy but didn’t restart `ng serve` | Old behavior |

**If interviewer did NOT use pathRewrite:** server expects `/api/employees` — remove `pathRewrite` block or ask.

**Pass:** `/api/employees` on 4200 host returns JSON; `[HPM]` in terminal  
**Fail:** Fix proxy or target port → restart `ng serve`.

---

### Step 5 — Read the Network request (most important in exams)

Click the failed request in Network tab.

| Field | Good | Bad / action |
|-------|------|----------------|
| **Request URL** | `...4200.../api/employees` | Wrong path → fix `baseUrl` in service |
| **Status** | `200` | `404` → path/proxy/db key; `502` → server down; `0` → network/CORS/blocked |
| **Response** | JSON `[{...}]` | HTML page → hit wrong server (no proxy) |
| **Type** | `xhr` or `fetch` | — |

**Status code cheat sheet:**

| Code | Likely cause |
|------|----------------|
| 200 | OK — bug may be in `subscribe` (not assigning `employees`) |
| 404 | Wrong URL, wrong `db.json` key, or pathRewrite mismatch |
| 502 / 504 | json-server not running; wrong `target` |
| 0 | CORS, wrong host, mixed content, or blocked request |
| 500 | Invalid body on POST/PUT |

**Console tab (same DevTools):**

| Message | Cause |
|---------|--------|
| `CORS policy` | Calling 8001 host directly from 4200 app |
| `Http failure response for ... 404` | URL or proxy |
| `Http failure ... 0 Unknown Error` | Server unreachable or CORS |

---

### Step 6 — Is the component calling the API?

**Check `home.ts` (or equivalent):**

```typescript
ngOnInit(): void {
  this.loadEmployees();  // must be called
}
```

**Console:**

- See `[Home] loadEmployees called` but no Network request → service not injected or method returns early.
- No log at all → `ngOnInit` not running or wrong component on route `''`.

**Check route:** `app.routes.ts` — `path: ''` → `Home` component.

---

### Step 7 — Is `HttpClient` provided?

**`app.config.ts` must have:**

```typescript
import { provideHttpClient } from '@angular/common/http';

providers: [
  provideHttpClient(),
  // ...
]
```

**Symptom if missing:** runtime error in Console: `No provider for HttpClient`.

---

### Step 8 — Service URL

**`employeeservice.ts`:**

```typescript
private readonly baseUrl = '/api/employees';
```

| URL | Use when |
|-----|----------|
| `/api/employees` | Proxy strips `/api` → `/employees` (your setup) |
| `/api/employees` | No pathRewrite → server must expose `/api/employees` |

Never hard-code `localhost` or full `webcontainer.io` URL unless interviewer requires it.

---

### Step 9 — Subscribe / error handling

Even with 200, UI stays empty if you don’t assign data:

```typescript
next: (data) => {
  this.employees = data;  // required
  this.loading = false;
}
```

**Console:** `[Home] API success, count: 2` but UI empty → template issue (`*ngFor`, wrong variable name).

---

### Step 10 — CRUD-specific checks

| Action | Method | Network should show | db.json |
|--------|--------|---------------------|---------|
| List | GET `/api/employees` | 200 + array | — |
| View one | GET `/api/employees/1` | 200 + object | id exists |
| Create | POST `/api/employees` | 201/200 | new id appended |
| Update | PUT `/api/employees/1` | 200 | object updated |
| Delete | DELETE `/api/employees/1` | 200/204 | row removed |

**POST body:** must not send `id` (json-server generates it) unless you set it manually.

---

## Part D — json-server + db.json setup (step by step)

### D1. Create `db.json` (project root)

```json
{
  "employees": []
}
```

The **property name** `employees` becomes the URL path: `/employees`.

---

### D2. Install json-server (if not already)

```bash
npm install json-server --save-dev
```

---

### D3. Add npm script (`package.json`)

```json
"scripts": {
  "api": "json-server --watch db.json --port 8001"
}
```

`--watch` reloads when you edit `db.json`.

---

### D4. Start the API (Terminal 1)

```bash
npm run api
```

**Confirm in terminal:**

```text
\{ resources \}
http://localhost:8001/employees
```

In WebContainer exams, public URL may look like:

`https://project--8001--xxxx.local-credentialless.webcontainer.io`

That is the **same server** exposed externally; inside the container proxy still uses `localhost:8001`.

---

### D5. REST endpoints (automatic)

json-server creates these from `db.json`:

| Operation | HTTP | URL (on port 8001) |
|-----------|------|---------------------|
| List all | GET | `/employees` |
| Get one | GET | `/employees/:id` |
| Create | POST | `/employees` |
| Replace | PUT | `/employees/:id` |
| Delete | DELETE | `/employees/:id` |

No controller code required — only `db.json` + running json-server.

---

### D6. Sample data (optional)

```json
{
  "employees": [
    {
      "id": 1,
      "name": "Alice",
      "phone": "555-0101",
      "address": "123 Main St",
      "department": "Engineering",
      "role": "Developer"
    }
  ]
}
```

---

### D7. Proxy for Angular (`proxy.conf.json`)

```json
{
  "/api": {
    "target": "http://localhost:8001",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/api": ""
    },
    "logLevel": "debug"
  }
}
```

Wire in `angular.json` under `projects → architect → serve → options`:

```json
"proxyConfig": "proxy.conf.json"
```

---

### D8. Start Angular (Terminal 2)

```bash
npm start
```

Or both:

```bash
npm run dev
```

(if `concurrently` is configured)

---

### D9. Verify in exam (no extra tab)

1. Terminal 1: json-server shows `/employees`.
2. Terminal 2: `ng serve` running; `[HPM]` on API call.
3. Preview: open app → Network → see `GET .../api/employees` → **200** + JSON.
4. Console: your `[Home] API success` log.

---

## Part E — Quick reference card (print mentally)

```
1. json-server terminal → /employees listed?
2. db.json → "employees" key + valid JSON?
3. ng serve terminal → [HPM] on request?
4. Network → URL ends with /api/employees on 4200 host?
5. Network → status 200?
6. Console → subscribe next runs?
7. Template → employees array bound?
```

First step that fails = layer to fix.

---

## Part F — Container / exam URL notes

Preview host example:

- App: `https://project--4200--HASH.local-credentialless.webcontainer.io`
- API (internal): `http://localhost:8001` (proxy target)
- API (public, if shown): `https://project--8001--HASH.local-credentialless.webcontainer.io`

**Do in exam:**

- Call **`/api/employees`** on the **4200** preview host from Angular.
- Use Network + Console on that same preview.
- Use **terminals** for json-server + `[HPM]` logs.

**Avoid unless told:**

- Hard-coding the long `--8001--` URL in `HttpClient` (CORS between 4200 and 8001 hosts).

**Sanity check without new tab:**

Navigate preview to: `...4200.../api/employees`  
→ JSON means proxy + server OK.

---

## Part G — Remove debug logs before submit

Remove or comment:

- `console.log` / `console.error` you added
- Extra `logLevel: "debug"` if instructions say minimal config (optional)

Keep `proxy.conf.json` and working service URLs.

---

## Files checklist (this project)

| File | Role |
|------|------|
| `db.json` | Data store |
| `package.json` | `"api"` script |
| `proxy.conf.json` | Dev proxy `/api` → 8001 |
| `angular.json` | `proxyConfig` |
| `src/app/app.config.ts` | `provideHttpClient()` |
| `src/app/employeeservice.ts` | `/api/employees` |
| `src/app/home/home.ts` | `ngOnInit` → `loadEmployees()` |

---

*Good luck in the exam — fix one layer at a time: server → proxy → service → component → template.*
