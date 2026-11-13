# Firebase Push Notifications — Implementation Plan (Admin · Customer · Vendor)

Status: **implemented in code (phases 1–4)**, waiting for Firebase credentials. Sections 1–7 below are the original plan; this block records what was built and how to switch it on.

## Turning push on (needs the Firebase project)

Until these are set the app works exactly as before: notifications still appear in each module's bell/inbox, push is simply skipped.

1. Firebase console → Project settings → add a **Web app** → copy its config.
2. Cloud Messaging → **Web Push certificates** → generate a key pair → that public key is `VITE_FIREBASE_VAPID_KEY`.
3. Project settings → Service accounts → **Generate new private key** → set `FIREBASE_SERVICE_ACCOUNT` (the JSON, raw or base64) on the API service in Coolify. Never commit it.
4. Coolify env for the **web** service (build-time, then redeploy): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_VAPID_KEY` (+ `VITE_FIREBASE_DATABASE_URL` for chat as today).
5. Redeploy both services. Run `node backend/scripts/migrateFcmTokens.js --dry` then without `--dry` once, to copy any old saved tokens.
6. Check: Admin → Notifications shows **Push is on**; click **Turn on**, then **Send test to my devices**.

Mobile apps: after login the app calls `POST /api/notifications/devices` (or the alias `POST /api/v1/fcm-tokens/save`) with the user's JWT and `{ "token": "<fcm token>", "platform": "mobile" }`; on logout `DELETE /api/notifications/devices` with `{ "token" }`. Inside the app the website exposes `window.JaipurioApp.registerPush(jwt, role)` / `unregisterPush(role)` hooks for the wrapper to implement.

## What was built

- Backend: `DeviceToken` model (token unique per role, so a shared phone is re-assigned to whoever is signed in), `services/notify.js` + `services/notificationEvents.js` (all wording/links in one catalog), rewritten `firebaseAdmin.js` (service-account JSON/base64, dead-token cleanup, topics, per-platform options), new endpoints (devices, unread-count, preferences, admin test/stats/broadcast), secured chat push, 19 old triggers migrated + new ones (shipped / out for delivery / delivered, payment failed, refund, return updates, seller payout/earnings/review/low-stock, admin new order/seller/return/payout/affiliate/contact/consultation/review/payment issue).
- Web: build-time service worker from `VITE_FIREBASE_*`, role-aware `pushNotificationService`, soft permission card (customer after the first order and in Profile/Notifications, seller and admin on their dashboards), foreground toast, live unread badges in all three headers, logout cleanup for all three roles.
- Tests: `cd backend && npm test` (17 tests, no database or Firebase needed).

## Not done / left for later

- Order cancellation by customers does not exist in this codebase, so there is no "order cancelled" trigger (templates exist for when it is added).
- Stock is only changed by hand (orders do not decrement it), so the low-stock alert fires only when an admin lowers a seller's stock.
- Abandoned-cart reminders and a scheduled-campaign composer (phase 5) are not built; admin broadcasts and the opt-in "promotional" flag are.
- Android/iOS app side (FCM token + bridge) is for the app developer.

---

## 1. What exists today (and why push does not work yet)

### 1.1 Backend

| Piece | File | State |
|---|---|---|
| Firebase Admin SDK init | `backend/services/firebaseAdmin.js` | `firebase-admin` v14, builds the service account from `FIREBASE_*` env vars. **All `FIREBASE_*` values are empty in `backend/.env`**, so it never initialises and every push is skipped with a log line. `FIREBASE_SERVICE_ACCOUNT` is in `.env` but the code never reads it. |
| Send function | same file, `sendPushNotification()` | `sendEachForMulticast` with a plain `notification` block. **No click link, no icon, no Android/APNs options, no cleanup of dead tokens** (failed tokens stay in the DB forever). |
| Fan-out helper | `backend/utils/pushNotificationHelper.js` → `sendNotificationToUser(id, role, payload, type)` | Writes an in-app `Notification` row, then looks up `fcmTokens` on the User/Vendor (for `admin`: every User with `role:'admin'`) and pushes. Awaited inside request handlers, so a slow FCM call slows the API response. |
| Token storage | `userModel.fcmTokens`, `vendorModel.fcmTokens` (`[String]`, last 10 kept) | No platform, no last-seen date, no owner uniqueness. **The same browser token can sit on several accounts**, e.g. customer A logs out and B logs in on the same phone, so A keeps receiving B's order pushes. |
| Token endpoints | `POST /api/notifications/save-fcm-token`, `POST /api/notifications/remove-fcm-token` (`protect`) | Works for users, admins and vendors (role comes from the JWT). Ignores `platform`. |
| Inbox | `Notification` model + `GET /notifications/me`, mark read/all-read | Fine for users/vendors. **Admin-targeted rows are never shown:** `GET /admins/notifications` returns only rows with `targetRole != 'admin'` (it is the "sent broadcasts" list), and `/notifications/me` for an admin has no admin inbox page. |
| Admin broadcast | `POST /admins/notifications` | Creates an inbox row only; **no push is sent**. |
| Chat push | `POST /notifications/chat` | Any logged-in account can push **any title/body to any recipientId/role, including all admins**. Abuse risk. |

**Existing push triggers (19 calls):**

| Recipient | Event | Where |
|---|---|---|
| Customer | Order placed (COD) | `orderController.createOrder` |
| Customer | Order paid & placed | `orderController.completePaidOrder` (Razorpay + Cashfree) |
| Customer | Item status changed | `orderController.updateOrderItemStatus` |
| Customer | Return status changed | `orderController.adminUpdateReturn` |
| Customer | Order accepted by seller | `orderFlowController.acceptOrder` |
| Customer | Support ticket updated | `supportTicketController.updateTicket` |
| Customer | Reply to review | `adminController.replyReview` |
| Vendor | New order (COD + paid) | `orderController.createOrder`, `completePaidOrder` |
| Vendor | Return requested | `orderController.requestReturn`, `returnController.createReturn` (duplicate paths) |
| Vendor | Product status changed | `productController.updateProductStatus` |
| Vendor | Account approved / suspended / reactivated | `vendorController.approveVendor/blockVendor/unblockVendor` |
| Vendor | Payout cleared | `adminController.clearVendorPayout` |
| Admin | Product pending approval | `productController.createProduct`, `submitProduct` |
| Admin | New support ticket | `supportTicketController.createTicket` |
| Any | Chat message | `notificationController.sendChatNotification` |

Message texts use the Mongo `_id` (`Order #6ae5…`) instead of `orderNumber`, and carry no link.

### 1.2 Frontend (one React app serving `/`, `/vendor/*`, `/admin/*`)

| Piece | File | State |
|---|---|---|
| Firebase web SDK | `frontend/src/firebase.js` | `firebase` v12 (modular), enabled only when `VITE_FIREBASE_*` are set. **They are not set**, so `messaging` is `null`. |
| Service worker | `frontend/public/firebase-messaging-sw.js` | Uses **v8 compat scripts (8.10.1)** with a **hard-coded empty config**, so background messages are never shown even after env vars are added. No `notificationclick` handler (clicking does nothing). |
| Push service | `frontend/src/services/pushNotificationService.js` | **VAPID key is hard-coded** and does not belong to a Jaipurio Firebase project (must be replaced). `initializePushNotifications()` and `setupForegroundNotificationHandler()` are **never called anywhere**. One shared `fcm_token_web` key for all three roles. |
| Customer | `Auth.jsx` | Calls `registerFCMToken(true)` right after OTP login, which shows the browser permission prompt with no context (browsers increasingly auto-block this). **Customer logout never removes the token.** |
| Vendor | `VendorLogin.jsx`, `VendorLayout.jsx` | Registers on login, removes on logout. Bell badge starts at a hard-coded `2`. |
| Admin | `AdminLogin.jsx` / `utils/adminAuth.js` | **Never registers a token**, so admins can never receive push. `logoutAdmin()` does not remove it. |
| Inboxes | `user/Notifications.jsx`, `vendor/VendorNotifications.jsx`, `admin/AdminNotifications.jsx` | Polling REST only; no live refresh when a push arrives. |
| Chat | `services/chatService.js` | Firebase Realtime Database + `/notifications/chat` push. |

### 1.3 Mobile apps

No Android/iOS project is in this repo. The storefront detects the app WebView (`utils/appContext.js`: `?source=app` / `JaipurioApp` UA). Native apps must register their **native** FCM token with the backend (WebView JS cannot get one), so the backend must accept `platform` and the web code must **not** also register a web token inside the app (duplicate pushes).

### 1.4 Deployment

`docker-compose.yml` already passes `VITE_FIREBASE_*` build args and `FIREBASE_*` runtime env (Coolify). Missing: `VITE_FIREBASE_VAPID_KEY`, and a way to get the Firebase config into the service worker.

---

## 2. Target architecture

```
 Event in a controller ──► notify({ to, event, data })            (backend/services/notify.js)
                              │
                              ├─ 1. render template (title/body/link) from the event catalog
                              ├─ 2. write Notification (inbox)  ── shown in bell + inbox pages
                              ├─ 3. resolve recipients → DeviceToken rows (role-aware, prefs-aware)
                              └─ 4. enqueue FCM send (non-blocking)
                                       │
                               firebase-admin sendEachForMulticast / topic send
                                       │
                   ┌───────────────────┼─────────────────────────┐
              Web (SW + foreground)  Android customer app   Android seller app
              /, /vendor, /admin     com.jaipurio.user      com.jaipurio.seller
                   │
              click → opens `link` (deep link into the right module)
```

### 2.1 Data model

**New `DeviceToken` collection** (`backend/models/deviceTokenModel.js`) replaces `fcmTokens` arrays:

| Field | Notes |
|---|---|
| `token` | FCM registration token |
| `role` | `user` / `vendor` / `admin` |
| `ownerModel`, `owner` | `User` or `Vendor`, ObjectId |
| `platform` | `web` / `android` / `ios` |
| `app` | `web`, `customer-app`, `seller-app` |
| `userAgent`, `lastSeenAt`, `failureCount` | housekeeping |

- **Unique index on `{ token, role }`**: saving a token re-assigns it to the account now signed in for that role, which fixes cross-account leakage. The same browser can still be an admin and a customer at the same time (different roles).
- Index `{ owner, role }` for fan-out. Clean up rows with `lastSeenAt` > 60 days, and delete immediately on FCM `registration-token-not-registered` / `invalid-registration-token`.
- One-off migration script `scripts/migrateFcmTokens.js` copies existing `fcmTokens` arrays into `DeviceToken`; keep the arrays read-only for one release, then drop them.

**`Notification` model changes**

- Add `event` (catalog key, e.g. `order.shipped`), `category` (`order`, `payment`, `return`, `product`, `payout`, `account`, `support`, `review`, `chat`, `promotion`, `system`), `link` (relative URL), `data` (Mixed).
- Extend `relatedModel` enum: `ReturnRequest`, `Payout`, `Affiliate`, `AffiliatePayout`, `Contact`, `Consultation`.
- Admin rows: `targetRole:'admin'`, `targetId:null` (shared inbox) or a specific admin id; read state via `readBy` as today.
- Index `{ targetRole: 1, targetId: 1, createdAt: -1 }`.

**Notification preferences** on User and Vendor (`notificationPrefs`):

- Transactional categories (`order`, `payment`, `return`, `account`, `payout`, `support`) are always on.
- `promotion` is opt-in, default off for customers (marketing consent).
- Admin can mute categories they don't handle.

### 2.2 Backend services

1. **`services/firebaseAdmin.js` (rewrite)**
   - Init from `FIREBASE_SERVICE_ACCOUNT` (base64 or JSON) **or** the split `FIREBASE_*` vars.
   - Expose `isPushEnabled()`, `sendToTokens(tokens, message)`, `sendToTopic(topic, message)`, `subscribe(tokens, topic)`, `unsubscribe(...)`.
   - Build messages with:
     - `notification` (title, body, image)
     - `data` (all strings: `link`, `event`, `notificationId`, `relatedId`)
     - `webpush.fcmOptions.link` (absolute URL from `SITE_URL`) and `webpush.notification` (icon `/jaipurio_logo.png`, badge, `tag` = collapse key)
     - `android.notification.channelId` (`orders`, `payouts`, `promotions`, `chat`), `android.priority:'high'` for transactional
     - `apns.payload.aps.sound`
   - Chunk to 500 tokens; return per-token results.
2. **`services/notify.js` (new)**: single entry point used by every controller.
   - `notify({ event, to, data, actor })`
   - `to` is one of: `{ userId }`, `{ vendorId }`, `{ admins: true, permission }`, `{ topic }`.
   - Looks up the template in `services/notificationEvents.js`, writes the inbox row, resolves tokens (respecting prefs), then sends via a **non-blocking queue** (`setImmediate` now; BullMQ on the existing Redis later if volume grows). Never throws into the caller.
   - Dead-token cleanup and a structured log line per send (`event`, recipients, success/failure counts).
3. **`services/notificationEvents.js` (new)**: the event catalog (section 3) as data: `{ key, category, recipients, title(data), body(data), link(data), type }`. All copy lives in one place; it uses `orderNumber`, never `_id`.
4. **Admin recipients by permission**: admins whose Role has `all` or the event's permission (`manage_orders`, `manage_vendors`, `manage_products`, `manage_support`, `manage_payouts`) receive it, so a support-only admin isn't spammed with payouts.
5. **Replace `utils/pushNotificationHelper.js`**: keep `sendNotificationToUser` as a thin wrapper over `notify()` during migration, then convert the 19 call sites to `notify({ event: ... })`.

### 2.3 API

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /api/notifications/devices` | `protect` | Body `{ token, platform, app }`. Upsert DeviceToken for `req.user` + role. Rate-limited. |
| `DELETE /api/notifications/devices` | `protect` | Body `{ token }`. Remove for this role (logout). |
| `POST /api/notifications/save-fcm-token` | `protect` | **Keep** as alias of the above (used by current web code and the app spec). |
| `POST /api/v1/fcm-tokens/save` | `protect` | Optional alias matching the format already shared with the app developer (`{ token, platform:'mobile' }`). |
| `GET /api/notifications/me?page=&category=` | `protect` | Paginated inbox. Admins included: returns admin rows when role is admin. |
| `GET /api/notifications/unread-count` | `protect` | For bell badges in all three modules. |
| `PATCH /api/notifications/:id/read`, `/mark-all-read` | `protect` | Existing. |
| `GET/PUT /api/notifications/preferences` | `protect` | Read/update `notificationPrefs`. |
| `POST /api/admins/notifications/broadcast` | admin + `manage_notifications` | Audience: all customers, all vendors, one user/vendor, or topic. Writes inbox rows and sends push via topic. Replaces the push-less `createNotification`. |
| `POST /api/admins/notifications/test` | admin | Sends a test push to the calling admin's own devices. |
| `POST /api/notifications/chat` | `protect` | **Lock down:** recipient must be a participant of the conversation (admin↔user, admin↔vendor, user↔vendor for an order they share); body length limit; rate limit; title fixed server-side ("New message from …"). |

**Topics** (server-side `subscribeToTopic` on token save): `customers-all`, `vendors-all`, `customers-promotions` (only when the opt-in is on). These are used for broadcasts, so the server doesn't loop over thousands of tokens.

### 2.4 Web client (all three modules)

1. **Config & service worker**
   - Add `VITE_FIREBASE_VAPID_KEY`; remove the hard-coded key.
   - Generate the SW at build time: a small Vite plugin writes `dist/firebase-messaging-sw.js` from a template, injecting the public `VITE_FIREBASE_*` config. Use `firebase-app-compat`/`firebase-messaging-compat` **v12** scripts (same major as the app).
   - SW handles `onBackgroundMessage` (only for data-only messages; notification messages are shown by FCM automatically) and **`notificationclick`**: focus an open tab on the same module or `clients.openWindow(data.link)`.
   - Keep the existing `nginx.conf` rule `Cache-Control: no-cache` for the SW.
2. **`services/pushNotificationService.js` (rewrite)**
   - `enablePush(role)`: checks support, permission and `isInApp()` (skip, since native handles it), gets the token, then `POST /notifications/devices` using the **role's own auth token** (not the URL-based interceptor guess).
   - Remembers per role: `fcm_token:<role>`.
   - `disablePush(role)` on logout: delete the device row, and `deleteToken()` only if no other role in this browser still uses it.
   - `onTokenRefresh`: re-register on every app start for signed-in roles (tokens rotate) and update `lastSeenAt`.
   - `listenForeground(handler)`: show an in-app toast (not a second OS notification) and dispatch `jaipurio:notification` so bells and inboxes refresh live.
3. **Soft permission prompt** (component `PushPermissionPrompt.jsx`): never ask at login.
   - **Customer:** after the first order is placed ("Get updates when your order ships?"), plus a toggle in Profile → Notifications.
   - **Vendor:** banner on the dashboard until enabled ("Get notified of new orders instantly").
   - **Admin:** banner on the dashboard plus a "Send test notification" button.
   - When permission is `denied`, show how to re-enable in browser settings.
4. **Wire-up per module**
   - **Customer:** call `enablePush('user')` from the prompt. Add logout cleanup in `Profile.jsx` and `ProfileSidebar` logout. Add a bell with unread count in `Navbar.jsx` (exists as an icon), and make `Notifications.jsx` items clickable via `link`.
   - **Vendor:** move registration from `VendorLogin.finishLogin` to the dashboard prompt (keep silent re-register when permission is already `granted`). Fix the hard-coded `unreadCount = 2`. Refresh the badge live on `jaipurio:notification`.
   - **Admin:** register in `EcommerceLayout` mount when permission is granted, otherwise show the banner. `logoutAdmin()` removes the token. Turn `AdminNotifications.jsx` into two tabs: **Inbox** (admin-targeted) and **Broadcast** (composer + history with push). Use `/unread-count` in the header badge (`pendingCounts.unreadNotifications`).
5. **iOS Safari:** web push works only for a site **added to the Home Screen** (iOS 16.4+). Show the prompt only when `navigator.standalone` or on supported browsers. The native app covers iOS customers properly.

### 2.5 Native apps (customer `com.jaipurio.user`, seller `com.jaipurio.seller`)

The app developer needs:

1. `google-services.json` from the same Firebase project (one Android app entry per package).
2. **After login inside the WebView**, the app gets the native FCM token and calls `POST /api/notifications/devices` with the user's JWT and `{ token, platform:'android', app:'customer-app' | 'seller-app' }`.
   - JS bridge: the web app calls `window.JaipurioApp?.registerPush(authToken, role)` after login.
   - Or the app reads the JWT from WebView localStorage.
3. Calls `DELETE /api/notifications/devices` on logout (bridge `window.JaipurioApp?.unregisterPush()`).
4. Creates Android channels `orders`, `payouts`, `promotions`, `chat`. On tap, opens `data.link` inside the WebView.
5. Web code skips web-push registration when `isInApp()` is true.

---

## 3. Event catalog (what each module receives)

Legend: **E** = already triggered (needs migrating to `notify` + link + orderNumber), **N** = new trigger to add.

### 3.1 Customer

| Key | Message | Trigger (file → function) | Link | |
|---|---|---|---|---|
| `order.placed` | Order #{n} placed, ₹{total} (COD) | `orderController.createOrder` | `/orders` | E |
| `order.paid` | Payment received, order #{n} confirmed | `orderController.completePaidOrder` | `/orders` | E |
| `payment.failed` | Payment for order #{n} didn't go through, retry | Cashfree/Razorpay verify failure paths in `orderController` | `/checkout` | N |
| `order.accepted` | Seller is preparing order #{n} | `orderFlowController.acceptOrder` | `/orders` | E |
| `order.shipped` | Order #{n} shipped, AWB {awb} | `orderFlowController.updateShipmentTrack`, `shipping.controller.shiprocketWebhook` | `/orders` | N |
| `order.out_for_delivery` | Arriving today | `shiprocketWebhook` | `/orders` | N |
| `order.delivered` | Delivered, rate your purchase | `orderFlowController.completeOrder`, `shiprocketWebhook` | `/reviews` | N |
| `order.cancelled` | Order #{n} cancelled (+ refund note) | `orderFlowController.updateOrderTrack` (Cancelled) | `/orders` | N |
| `order.item_status` | Item "{name}" now {status} | `orderController.updateOrderItemStatus` | `/orders` | E |
| `return.updated` | Return/replacement for #{n}: {status} | `orderController.adminUpdateReturn`, `returnController.advanceReturn/rejectReturn` | `/orders` | E+N |
| `refund.processed` | Refund of ₹{amt} processed | refund step in return flow | `/orders` | N |
| `support.updated` | Ticket #{n}: {status} | `supportTicketController.updateTicket` | `/profile` | E |
| `review.replied` | Jaipurio replied to your review | `adminController.replyReview` | `/reviews` | E |
| `chat.message` | New message from Jaipurio support | `notificationController.sendChatNotification` (secured) | chat | E |
| `affiliate.approved` / `rejected` | Affiliate application {status} | `affiliateController` admin status update | `/affiliate` | N |
| `affiliate.commission` | You earned ₹{amt} commission | `affiliateController` earning creation on order | `/affiliate` | N |
| `affiliate.payout_paid` | Payout of ₹{amt} sent | `affiliateController.advanceAffiliatePayout` | `/affiliate` | N |
| `cart.abandoned` (opt-in) | Your bag is waiting | daily job over `IncompleteOrder` | `/checkout/:token` | N (phase 5) |
| `promotion.*` (opt-in) | Admin campaigns | broadcast → topic `customers-promotions` | campaign link | N |

### 3.2 Vendor

| Key | Message | Trigger | Link | |
|---|---|---|---|---|
| `vendor.approved` / `suspended` / `reactivated` | Account status | `vendorController.approveVendor/blockVendor/unblockVendor` | `/vendor` | E |
| `vendor.rejected` | Application not approved (+ reason) | vendor rejection handler | `/vendor/login` | N |
| `vendor.order_new` | New order #{n}, ₹{amt} | `createOrder`, `completePaidOrder` | `/vendor/orders` | E |
| `vendor.order_cancelled` | Order #{n} cancelled | `updateOrderTrack` (Cancelled) | `/vendor/orders` | N |
| `vendor.return_requested` | Return {rma} needs review | `requestReturn`, `returnController.createReturn` (**dedupe**) | `/vendor/returns` | E |
| `vendor.product_status` | "{product}" is now {status} | `productController.updateProductStatus` | `/vendor/products` | E |
| `vendor.stock_low` / `stock_out` | "{product}" has {qty} left / out of stock | inventory update + order stock decrement (threshold), daily digest | `/vendor/inventory` | N |
| `vendor.payout_updated` | Payout {n}: {approved/paid/rejected} | `payoutController.advancePayout/updatePayout`, `adminController.clearVendorPayout` | `/vendor/payouts` | E+N |
| `vendor.earnings_released` | ₹{amt} now available | `orderFlowController.releaseEarnings` | `/vendor/earnings` | N |
| `vendor.review_new` | New {rating}★ review on "{product}" | `reviewController.createReview` | `/vendor/reviews` | N |
| `vendor.shipment_issue` | Shipment {awb} {RTO/failed} | `shiprocketWebhook` | `/vendor/shipments` | N |
| `chat.message` | New message from admin/customer | chat endpoint | `/vendor/support` | E |
| `announcement.vendors` | Admin announcement | broadcast → topic `vendors-all` | link | N |

### 3.3 Admin (recipients filtered by role permission)

| Key | Message | Trigger | Permission | Link | |
|---|---|---|---|---|---|
| `admin.order_new` | New order #{n}, ₹{amt}, {COD/Paid} | `createOrder`, `completePaidOrder` | `manage_orders` | `/admin/ecommerce/orders/edit/:id` | N |
| `admin.payment_mismatch` | Payment verify failed / amount mismatch | verify paths | `manage_orders` | orders | N |
| `admin.vendor_registered` | New seller "{store}" awaiting approval | `vendorController.registerVendor` | `manage_vendors` | `/admin/vendors/pending` | N |
| `admin.product_pending` | "{product}" submitted for approval | `productController.createProduct/submitProduct` | `manage_products` | products edit | E |
| `admin.return_requested` | Return {rma} on #{n} | `requestReturn`, `createReturn` | `manage_orders` | `/admin/returns` | N |
| `admin.payout_requested` | {vendor} requested ₹{amt} | `payoutController.requestPayout` | `manage_payouts` | withdrawals | N |
| `admin.affiliate_applied` / `affiliate_payout_requested` | Affiliate activity | `affiliateController.applyAffiliate/requestAffiliatePayout` | `manage_users` | `/admin/affiliates` | N |
| `admin.ticket_new` | New ticket #{n} | `supportTicketController.createTicket` | `manage_support` | `/admin/support` | E |
| `admin.chat_message` | Message from {customer/vendor} | chat endpoint | `manage_support` | `/admin/support` | E |
| `admin.contact_new` | Contact form from {name} | `contactController.submitContact` | `manage_support` | `/admin/contacts/edit/:id` | N |
| `admin.consultation_new` | Consultation request | `consultationController.createConsultation` | `manage_support` | consultations | N |
| `admin.review_new` | New review to moderate | `reviewController.createReview` | `manage_products` | `/admin/ecommerce/reviews` | N |
| `admin.stock_digest` | {n} products low / out of stock | daily job | `manage_products` | inventory | N |
| `admin.system_alert` | Shiprocket/Cashfree webhook errors | webhook error paths | `all` | — | N |

---

## 4. Implementation phases

### Phase 0: Firebase project & secrets (½ day, needs project owner)

1. Create (or reuse) the **Jaipurio** Firebase project. Add a Web app; copy the config into `VITE_FIREBASE_*`.
2. Cloud Messaging → Web Push certificates → generate a key pair, then set `VITE_FIREBASE_VAPID_KEY`.
3. Service account → generate a private key, store it as `FIREBASE_SERVICE_ACCOUNT` (base64 JSON) in Coolify, never in git.
4. Add Android apps `com.jaipurio.user` / `com.jaipurio.seller` (confirm the package names), and hand `google-services.json` to the app developer.
5. Add the new vars to `docker-compose.yml` (build arg `VITE_FIREBASE_VAPID_KEY`) and to a `backend/.env.example`.

**Done when:** backend logs `FCM: Firebase Admin initialized`, and the browser console shows Firebase enabled.

### Phase 1: Backend foundation (2 days)

- `DeviceToken` model and migration script; `Notification` model fields and indexes; `notificationPrefs`.
- Rewrite `firebaseAdmin.js` (service-account JSON support, message builder, chunking, dead-token cleanup, topics).
- `notify.js` + `notificationEvents.js` catalog; `sendNotificationToUser` becomes a wrapper.
- New endpoints: devices, unread-count, preferences, admin broadcast and test. Admin inbox via `/notifications/me`.
- Secure `/notifications/chat`; rate limits on device registration.
- Feature flag `PUSH_ENABLED` (default true when Firebase is configured).

**Done when:** unit tests for `notify()` pass with a mocked messaging client (templates, recipient resolution, prefs, dead-token deletion), and `POST /admins/notifications/test` delivers to a real browser.

### Phase 2: Web client for all modules (2–3 days)

- Build-time SW generation; v12 compat SW with `notificationclick`.
- Rewrite `pushNotificationService.js` (role-aware, `isInApp` skip, token refresh, foreground toast + event).
- `PushPermissionPrompt` and the per-module wiring (customer after the first order and in Profile; vendor dashboard; admin layout + test button).
- Logout cleanup in all three modules.
- Bell badges via `/unread-count` with live refresh; clickable inbox items; admin Inbox/Broadcast tabs; remove the vendor `unreadCount = 2` placeholder.

**Done when:** the matrix in section 5 passes for web.

### Phase 3: Migrate existing triggers (1 day)

- Convert the 19 call sites to `notify({ event })` with `orderNumber` + links.
- Dedupe the vendor return push (two code paths).
- Move all sends off the request path (non-blocking).

### Phase 4: New transactional events (2–3 days)

- Customer: shipped / out for delivery / delivered / cancelled / payment failed / refund / return advance-reject / affiliate events.
- Vendor: order cancelled, low/out of stock, payout status, earnings released, new review, shipment issue, rejection.
- Admin: new order, vendor registered, return, payout request, affiliate, contact, consultation, review, stock digest, system alerts.
- Shiprocket webhook status → event mapping table.

### Phase 5: Campaigns & engagement (1–2 days, optional)

- Admin broadcast composer (audience, title, body, image, link, schedule) using topics.
- Customer promotion opt-in toggle (subscribe/unsubscribe topic).
- Abandoned-cart reminder job (once per cart, opt-in only), back-in-stock / price-drop for wishlist (later).
- Simple delivery stats per broadcast (sent / failed from the FCM response).

### Phase 6: Native app integration (with the app developer, 1–2 days on our side)

- JS bridge calls after login/logout; `isInApp` skip confirmed.
- Deep links from `data.link` open the right WebView page.
- Verify Android channels and tap behaviour for both apps.

**Total: about 10–13 working days** for phases 0–4 plus 6; phase 5 is optional.

---

## 5. Test plan

**Automated:** Jest tests for `notify()`, template rendering (no `_id` in texts), recipient resolution per role/permission, prefs filtering, token upsert re-assignment (`{token, role}` unique), dead-token cleanup, chat endpoint authorisation.

**Manual matrix**

| # | Scenario | Expected |
|---|---|---|
| 1 | Customer enables push, places COD order | "Order placed" OS notification; click opens `/orders` |
| 2 | Vendor dashboard open in background tab, customer orders | Vendor gets "New order"; bell count increases without refresh |
| 3 | Admin enabled push, customer orders | Admin "New order" with link to that order |
| 4 | Admin ships order / Shiprocket webhook "Delivered" | Customer gets shipped / delivered |
| 5 | Customer A logs out, customer B logs in on same browser, B orders | Only B notified; A gets nothing |
| 6 | Same browser signed in as admin and customer | Each role's pushes still arrive; logout of one doesn't break the other |
| 7 | Permission denied | No errors; settings hint shown; inbox still updates |
| 8 | Token expired / app uninstalled | Send marks failure; DeviceToken row deleted |
| 9 | Foreground tab | Toast + badge refresh, no duplicate OS notification |
| 10 | Inside Android app WebView | No web token registered; native push arrives once |
| 11 | Support-only admin role | Gets tickets/contacts, not payouts |
| 12 | Customer with promotions off | Not in promotion broadcasts; still gets order pushes |
| 13 | Chat endpoint abuse (push to random user/admin) | 403 |
| 14 | Browsers | Chrome desktop/Android, Edge, Firefox; Safari macOS; iOS only as installed PWA |

---

## 6. Risks & decisions needed

1. **Firebase project ownership:** who creates and owns the Jaipurio Firebase project (the Realtime Database chat uses the same project)?
2. **App package names:** confirm `com.jaipurio.user` / `com.jaipurio.seller` (only Exnshop names were shared so far), and whether an iOS app is planned.
3. **Marketing pushes:** which promotions are wanted, and the default opt-in (recommend off, opt-in prompt after the first order).
4. **Admin permissions:** add a `manage_notifications` permission for broadcasts, and confirm the permission keys per event.
5. **Volume:** `setImmediate` is enough now; switch to a Redis-backed queue (BullMQ) if broadcasts exceed a few thousand tokens or retries are needed.
6. **Privacy:** push bodies show on lock screens, so keep amounts/order numbers but no addresses or phone numbers.
7. **Security:** never accept push title/body from clients except the secured chat flow; rotate the service-account key if it is ever exposed (see the repo-compromise note: keep it only in Coolify env).

---

## 7. File checklist

**Backend (new):** `models/deviceTokenModel.js`, `services/notify.js`, `services/notificationEvents.js`, `scripts/migrateFcmTokens.js`, tests under `backend/tests/notify.test.js`.

**Backend (changed):** `services/firebaseAdmin.js`, `utils/pushNotificationHelper.js`, `models/notificationModel.js`, `models/userModel.js`, `models/vendorModel.js`, `controllers/notificationController.js`, `routes/notificationRoutes.js`, `routes/adminRoutes.js`, `middlewares/rateLimiter.js`, plus trigger edits in `orderController`, `orderFlowController`, `shipping.controller`, `returnController`, `payoutController`, `affiliateController`, `vendorController`, `productController`, `reviewController`, `contactController`, `consultationController`, `supportTicketController`, `adminController`.

**Frontend (new):** `components/shared/PushPermissionPrompt.jsx`, `utils/useUnreadCount.js`, SW template `frontend/sw/firebase-messaging-sw.template.js` + Vite plugin in `vite.config.js`.

**Frontend (changed):** `firebase.js`, `services/pushNotificationService.js`, `public/firebase-messaging-sw.js` (removed; generated at build), `components/user/{Auth,Checkout,Profile,ProfileSidebar,Navbar,Notifications}.jsx`, `components/vendor/{VendorLogin,VendorLayout,VendorNotifications}.jsx`, `components/admin/{AdminNotifications}.jsx`, `components/admin/ecommerce/EcommerceLayout.jsx`, `utils/adminAuth.js`, `utils/api.js` (explicit role token option).

**Infra:** `docker-compose.yml` (VAPID build arg), `backend/.env.example`, Coolify env.
