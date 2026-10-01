# Deploying Jaipurio on Coolify

The repo includes everything Coolify needs: `docker-compose.yml`, plus `backend/Dockerfile` and `frontend/Dockerfile`. There's nothing to install on the server.

## What runs

| Service | What it is | Public? |
|---|---|---|
| `jaipurio-web` | React storefront + admin, served by nginx. Forwards `/api`, `/uploads` and `/robots.txt` to the API. | **Yes**: the only service that gets a domain |
| `jaipurio-api` | Express backend (port 5000), connects to MongoDB Atlas | No, private network only |
| `jaipurio-redis` | Cache for the API (in-memory, no disk) | No, private network only |
| `jaipurio-minio` | S3-compatible object storage (persistent `minio-data` volume) | No, private network only |
| `jaipurio-imgproxy` | Image processor fetching from MinIO over the private network | No, private network only |

The site and the API share one domain, so there's no CORS setup and the frontend doesn't need to know the domain at build time.

## 1. Create the resource

1. In Coolify, open your project and go to **+ New → Public Repository**.
2. Repository: `https://github.com/Trishamishra08/jaipurio`, branch `main`.
3. Build Pack: **Docker Compose**.
4. Set Base Directory to `/` and Docker Compose Location to `/docker-compose.yml`.

## 2. Set the domain

Under the resource's services:
- Give **only `jaipurio-web`** a domain, e.g. `https://jaipurio.in,https://www.jaipurio.in`.
- Leave `jaipurio-api`, `jaipurio-redis`, `jaipurio-minio` and `jaipurio-imgproxy` without a domain.

Then point DNS at the server (at the domain's current DNS provider):

```
A   @     166.0.242.204
A   www   166.0.242.204
```

Coolify issues the SSL certificate automatically once DNS resolves.

## 3. Fill in the environment variables

Coolify lists every variable from `docker-compose.yml` in the **Environment Variables** tab. Copy the values from the current working setup. Any variable you leave empty uses the app's built-in default, or switches that feature off.

**Required:**

| Variable | Notes |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string. In Atlas **Network Access**, allow `166.0.242.204`. |
| `JWT_ACCESS_SECRET` | **Use the same value as today.** It also encrypts the payment-gateway keys saved in the admin panel. A new value logs everyone out and makes those saved keys unreadable. |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | MinIO credentials. imgproxy uses the same values to read objects through the internal S3 endpoint. |

**Check these before go-live:**

| Variable | Set to |
|---|---|
| `FRONTEND_URL` | `https://jaipurio.in` |
| `USE_DEFAULT_OTP` | `false`. With `true`, every login OTP is `989898` and no SMS is sent. |
| `SMS_INDIA_HUB_*`, `SMS_BRAND_NAME` | Needed for real OTP SMS when `USE_DEFAULT_OTP=false` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Live keys (`rzp_live_…`) when taking real payments |
| `CLOUDINARY_*` | Needed for image uploads |

The rest (SMTP, Stripe, PayPal, Paystack, Shiprocket, DTDC, Firebase, rate limits) are optional. Fill in the ones this store uses.

**Build-time variables for the frontend** (optional): `VITE_SITE_URL`, `VITE_RAZORPAY_KEY_ID`, `VITE_META_PIXEL_ID`, `VITE_FIREBASE_*`. Leave `VITE_SITE_URL` empty to use whatever domain the site is opened on. Changing any `VITE_*` value needs a redeploy.

Don't set `NODE_ENV`, `PORT`, `TRUST_PROXY`, `REDIS_ENABLED` or `REDIS_URL`. The compose file fixes them for this stack.

Create a bucket in MinIO before requesting images from imgproxy. Other services in this Compose stack can reach MinIO at `http://jaipurio-minio:9000` and imgproxy at `http://jaipurio-imgproxy:8080`; imgproxy accepts `s3://bucket-name/object-key` source URLs. Neither service publishes host ports.

## 4. Deploy and verify

Click **Deploy**. The first start runs database migrations, so the API can take 1–2 minutes to report healthy.

- `https://jaipurio.in/` loads the storefront.
- `https://jaipurio.in/api/health` should return `{"success":true, … "cache":{"enabled":true,"connected":true,"mode":"redis"}}`.
- Coolify shows the web, API and Redis services as **healthy**; MinIO and imgproxy should be running.

## 5. After go-live

- **Auto-deploy on push:** in the resource's **Webhooks** tab, copy the GitHub webhook URL and add it under the repo's GitHub **Settings → Webhooks**. Alternatively, connect the repo through Coolify's GitHub App.
- **Shiprocket:** set the status webhook to `https://jaipurio.in/api/shipping/webhook`.
- **Logs:** each service's **Logs** tab in Coolify. `jaipurio-api` prints `MongoDB Connected` and `Server running on port 5000` on a good start.
