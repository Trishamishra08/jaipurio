# Vendor Product — Fields & Flow

**Updated:** 31 Aug 2026

---

## What vendor CAN add (Add / Edit Product)

| Field | Required | Notes |
|--------|----------|--------|
| Title | Yes | Product name |
| SKU | Yes | Unique per listing |
| Category | Yes | From platform taxonomy |
| Price (₹) | Yes | Selling price |
| Stock quantity | Yes | Updates inventory |
| Product images | Yes | **Choose from device** → uploaded via `POST /api/upload` |
| Description | No | Craft / product story |
| Sale price | No | Optional discount display |
| Cost per item | No | Vendor-only, never shown to customer |
| Tags | No | Comma separated |
| Weight / dimensions | No | For shipping quotes |

Store name is read from vendor profile (`GET /api/vendors/profile`), not typed manually.

---

## What vendor CANNOT set (admin / system only)

| Field | Who sets it |
|--------|-------------|
| Lifecycle Published / Featured badge | Admin approval |
| Cross-selling / Related SKUs | Admin |
| Product FAQs (global FAQ CMS) | Admin |
| SEO title & description | Admin |
| Global attributes & product options | Admin |
| Min / max order quantity | Admin |
| Icon image (separate thumbnail) | Admin |
| Barcode, warehouse overrides | Admin |

After vendor submits → lifecycle **Pending Approval** → admin reviews in admin panel → **Published** or **Rejected**.

---

## API flow (vendor add product)

```
1. GET  /api/vendors/profile          → store name (Bearer vendor_token)
2. POST /api/upload                   → multipart documents[] → Cloudinary URLs
3. POST /api/products                 → create product + inventory
       Body: title, sku, category, price, stock, content, images[], featuredImage, ...
       Auth: Bearer vendor_token + role vendor
4. Admin: PUT /api/products/:id/status → Published / Rejected
```

---

## Required validation (backend)

`productController.createProduct` enforces: **Title, SKU, Category, Price.**

Frontend also requires **stock** and **at least one image** before submit.
