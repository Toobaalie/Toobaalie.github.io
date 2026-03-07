# BerryBabes Store

Modern scrunchie store with static frontend pages and an Express API backend.

## Clean Project Structure

```text
.
|-- public/
|   |-- assets/
|   |   |-- css/
|   |   |   `-- style.css
|   |   `-- js/
|   |       |-- script.js
|   |       |-- cart.js
|   |       |-- cart-page.js
|   |       |-- checkout.js
|   |       |-- product.js
|   |       |-- products-data.js
|   |       `-- admin.js
|   |-- images/
|   |-- index.html
|   |-- cart.html
|   |-- checkout.html
|   |-- product.html
|   |-- admin.html
|   |-- privacy-policy.html
|   |-- returns-exchange.html
|   |-- shipping-policy.html
|   |-- terms-of-service.html
|   |-- robots.txt
|   |-- sitemap.xml
|   `-- CNAME
|-- data/
|   |-- orders.json
|   |-- subscribers.json
|   `-- customer-reviews.json
|-- server.js
|-- package.json
`-- railway.json
```

## Local Run

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Environment Variables

Create `.env` (or set these in Railway variables):

```env
PORT=3000
HOST=0.0.0.0
CANONICAL_HOST=berrybabes.me

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

## Deploy On Railway (Live Auto Update)

1. Push this repo to GitHub.
2. In Railway, click `New Project` > `Deploy from GitHub Repo`.
3. Select this repository.
4. In Railway service settings, add required environment variables.
5. Add your custom domain (`berrybabes.me`) in Railway networking.
6. Every new push to the connected branch will auto-deploy and update the live site.

`railway.json` is included and uses `npm start` for production startup.

## Important Note About `data/*.json`

Railway filesystem is ephemeral on redeploy/restart. JSON files in `data/` can reset.
For production persistence, move orders/subscribers/reviews to a database (for example PostgreSQL on Railway).