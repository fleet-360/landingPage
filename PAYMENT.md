# Payment pages

Two pages, both `noindex`:

| URL | File | What it does |
| --- | --- | --- |
| `/pay` (`/payment`, `/תשלום`) | `payment.html` | Customer-facing. Collects the details, creates a Grow payment process and redirects to the secure checkout page. |
| `/pay-link` (`/create-payment-link`) | `payment-link.html` | Internal. Password protected. Generates the encrypted link to send to a customer. |

## Backend

No backend was added. Both pages call the endpoint that already exists on
`cars-server`:

```
POST https://api.fleet360.co.il/grow/proAlgorithm/createPaymentLink
{ fullName, email, phone, sum, description, paymentNumber, businessTaxId }
-> { success: true, paymentUrl: { url, authCode, ... } }
```

After a successful payment the Grow webhook (`/grow/payment/notifyProAlgorithm`)
issues the Caspit tax invoice and emails it to the customer. The amount entered
on the page is the **total including VAT** - the invoice derives the pre-VAT
figure from it.

The API only accepts browser requests from origins in the server's CORS
allowlist. `pro-algo.com` and `www.pro-algo.com` are already there; any new
domain for this site has to be added in `cars-server/middlewares/cors.js`.

## Configuration

Set these in **Vercel → Project Settings → Environment Variables**, and in a
local `.env` for development (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `PAY_ADMIN_USER` | Username for `/pay-link` |
| `PAY_ADMIN_PASSWORD` | Password for `/pay-link` |
| `PAY_LINK_SECRET` | Key used to encrypt the link parameters |
| `PAY_ALLOW_PLAIN_PARAMS` | `1` to also accept readable params on `/pay` (default `0`) |

`scripts/build-pay-config.js` turns them into `js/pay-config.js` at build time.
It runs as the Vercel build command (see `vercel.json`); run it by hand for
local work:

```bash
node scripts/build-pay-config.js
```

`js/pay-config.js` and `.env` are gitignored - this repository is public.

If the variables are missing the build still succeeds: `/pay-link` shows a
"not configured" message and `/pay` keeps working as a plain amount-entry page.

## How a link is built

`/pay-link` packs the parameters into a JSON payload, encrypts it with
AES-GCM (key = PBKDF2 of `PAY_LINK_SECRET`) and puts the result in a single
query parameter:

```
https://www.pro-algo.com/pay?d=VHmuqMEAscG7qy10Qz3dj1jKVuQ0T85o...
```

The payload carries the amount, the description, optional customer details, the
number of installments, the page language, whether the amount is editable, and
an optional expiry timestamp. `payment.html` decrypts it on load; a token that
was edited, truncated, produced with another secret, or has expired is refused
with a message instead of the form.

Changing `PAY_LINK_SECRET` invalidates every link already sent out. Changing the
admin password or redeploying only invalidates open `/pay-link` sessions.

### Scope of the protection

Everything runs in the browser, so:

- The **admin password** never ships - only a PBKDF2-SHA256 hash (210k
  iterations). Use a long passphrase: a short one can be brute-forced offline by
  anyone who reads `js/pay-config.js`.
- The **link secret** does ship, because the customer's browser has to decrypt
  the link. Someone who reads the JavaScript can forge a link. This stops a
  recipient from editing the amount in the URL; it is not a defence against a
  determined attacker.

Moving both checks server-side means adding two Vercel functions
(`api/login`, `api/decode`) and keeping the secrets out of the bundle entirely.
