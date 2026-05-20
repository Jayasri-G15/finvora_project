# Finvora AI — n8n Gmail Sync Setup

This directory contains the n8n workflow that automatically fetches financial emails from Gmail,
extracts structured data using GPT-4o, and sends it to the Finvora backend.

---

## How It Works

```
Gmail (INBOX, every 5 min)
    │
    ▼
Is Financial Email? ──NO──► Skip (log & ignore)
    │ YES
    ▼
OpenAI GPT-4o — extract_financial_data() function call
    │
    ▼
Build Finvora Payload (Code node)
    │
    ▼
POST /api/v1/webhooks/n8n/email → Finvora Backend
    │
    ▼
Backend creates: EmailMessage + Invoice/Transaction (if confidence ≥ 0.70)
```

---

## Quick Setup (n8n Cloud or local)

### Step 1 — Import the Workflow

1. Open n8n (`https://app.n8n.io` or `http://localhost:5678`)
2. Click **Workflows** → **Import from File**
3. Select `n8n/finvora-gmail-sync.json`
4. The workflow appears with all 5 nodes connected

### Step 2 — Add Credentials

#### Gmail OAuth2
1. In n8n → **Credentials** → **Add Credential** → **Gmail OAuth2 API**
2. Enter your Google OAuth Client ID and Client Secret
   - Create at: https://console.cloud.google.com/apis/credentials
   - Authorized redirect URI: `https://app.n8n.io/rest/oauth2-credential/callback` (or your n8n URL)
   - Enable **Gmail API** in Google Cloud Console
3. Click **Connect my account** → authorize with your Gmail account
4. Name it: `Gmail OAuth2 — Finvora`

#### OpenAI API
1. **Credentials** → **Add Credential** → **OpenAI API**
2. Enter your OpenAI API key (`sk-proj-...`)
3. Name it: `OpenAI API — Finvora`

### Step 3 — Set Environment Variables in n8n

Go to **Settings** → **Variables** (n8n Cloud) or set in your `.env` / docker-compose:

| Variable | Value | Description |
|----------|-------|-------------|
| `FINVORA_BACKEND_URL` | `https://your-api.up.railway.app` | Your Railway backend URL (no trailing slash) |
| `FINVORA_WEBHOOK_SECRET` | `your-n8n-webhook-secret` | Must match `N8N_WEBHOOK_SECRET` in backend `.env` |
| `FINVORA_USER_EMAIL` | `your@gmail.com` | The Gmail address connected to n8n |

> **Local development:** Use `http://host.docker.internal:8000` (Docker) or `http://localhost:8000` (local n8n)

### Step 4 — Connect Credentials to Nodes

After importing, open each node and connect the credentials:
- **Gmail Trigger** → select `Gmail OAuth2 — Finvora`
- **OpenAI — Extract Financial Data** → select `OpenAI API — Finvora`

### Step 5 — Test the Workflow

1. Click **Execute Workflow** manually
2. Send yourself a test invoice email (forward a real invoice to your Gmail)
3. Check n8n execution logs — you should see data flowing through all nodes
4. Check Finvora `/emails` page — the email should appear

### Step 6 — Activate

Toggle **Active** switch at the top of the workflow editor.
n8n will now poll Gmail every 5 minutes automatically.

---

## Historical Sync (Process Past Emails)

The Finvora backend has a trigger endpoint for processing historical emails:

### Set up a second n8n workflow (Webhook trigger):
1. Create new workflow in n8n
2. Add **Webhook** node (trigger type) — copy the webhook URL
3. Set that URL as `N8N_TRIGGER_WEBHOOK` in your backend `.env`
4. Add Gmail batch fetch + loop nodes to process emails from `days_back` parameter

### Or trigger manually from Finvora Settings:
1. Open Finvora → **Settings** → **Gmail Integration** tab
2. Set "Days back" (e.g. 30)
3. Click **Sync Now** — this calls `POST /api/v1/gmail/trigger-sync`

---

## Email Keywords That Trigger Extraction

The IF node filters emails whose subject contains (case-insensitive):
```
invoice | payment | bill | receipt | GST | vendor | reimbursement |
IOU | overdue | due | payable | receivable | tax | debit | credit note |
purchase order | PO  | quotation | estimate | statement
```

To add more keywords, edit the **Is Financial Email?** node's regex pattern.

---

## What Gets Created in Finvora

| Email Type | Confidence | Result |
|-----------|-----------|--------|
| INVOICE / VENDOR_BILL | ≥ 0.70 | EmailMessage + Invoice (DRAFT) + Vendor (auto-created) |
| PAYMENT | any | EmailMessage + Transaction (DEBIT, PENDING) |
| Any type | < 0.70 | EmailMessage only (marked `needs_review = true`) |
| UNKNOWN | any | EmailMessage only |

---

## Troubleshooting

**"user_not_found" response from backend**
→ Make sure `FINVORA_USER_EMAIL` matches the email registered in Finvora

**"organization_not_found" response**
→ The user exists but hasn't completed onboarding. Go to `/onboard` in the app.

**403 from backend**
→ `FINVORA_WEBHOOK_SECRET` doesn't match `N8N_WEBHOOK_SECRET` in backend `.env`

**OpenAI extraction returning UNKNOWN**
→ Email body is too short or non-financial. The filter node should have caught it — check the regex.

**"duplicate" response**
→ Normal! The email was already processed. n8n retrying is fine — backend is idempotent.

---

## Generating the Webhook Secret

```bash
python -c "import secrets; print(secrets.token_hex(24))"
```

Set the same value in:
- `backend/.env` → `N8N_WEBHOOK_SECRET=<value>`
- n8n environment variables → `FINVORA_WEBHOOK_SECRET=<value>`
