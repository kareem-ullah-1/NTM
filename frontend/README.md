# Noor Fabrics

Premium unstitched men's fabric storefront — Next.js App Router, TypeScript, Tailwind, shadcn/ui, Zustand, TanStack Query, Framer Motion, WhatsApp ordering.

This frontend is connected to a real backend API (see `../backend`) for products, checkout/orders, admin authentication, inventory management, the admin dashboard, contact form, and newsletter signup. It is **not** using mock data — see "What's real vs. client-only" below for the couple of things that intentionally remain client-side.

## Setup

```bash
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL should point at the backend, e.g. http://localhost:5000/api

npm install
npm run dev
```

Open http://localhost:3000. The backend must be running (migrated + seeded) for data to load — see `../backend/README.md` (or the root `README.md`) for backend setup.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API, e.g. `http://localhost:5000/api`. This is the only environment variable the frontend uses — no backend secrets are ever exposed via `NEXT_PUBLIC_*` variables. |

## Structure

- `app/` — routes: home, shop, shop/[slug], cart, checkout, about, contact, admin (login, overview, inventory, orders)
- `components/` — layout, home, shop, product, cart, forms, admin, shared, motion, ui (shadcn primitives)
- `lib/api/` — the API layer: a shared axios client (`client.ts`) that attaches the admin JWT, normalizes errors into `ApiRequestError`, and unwraps the backend's `{ success, message, data, meta }` envelope; one file per resource (`products.ts`, `orders.ts`, `inventory.ts`, `auth.ts`, `contact.ts`, `dashboard.ts`); and centralized React Query keys (`query-keys.ts`)
- `lib/products.ts` — static taxonomy (category/fabric/color option lists) used to populate filter and form dropdowns; this is UI configuration, not product data — actual products always come from the API
- `store/` — Zustand: cart, wishlist, filters, admin auth (JWT), UI (mobile nav/drawer), toast
- `types/` — shared TypeScript types (cart, etc.); API response types live in `lib/api/types.ts`

## What's real vs. client-only

Connected to the real backend API:
- Shop listing, search, filters, sorting, pagination
- Product detail page + related products
- Homepage featured products
- Checkout → creates a real order (server validates and re-prices every item — see backend README)
- Contact form and newsletter signup
- Admin login (real JWT-based auth against the `users` table — there is no hardcoded/demo login)
- Admin inventory (create/edit/delete products, with automatic UI refresh via React Query cache invalidation)
- Admin orders (list, filter, view, update status)
- Admin dashboard (real sales totals, order/product counts, low-stock counts, weekly sales chart)

Intentionally client-side only (not backend-connected, by design — this is normal e-commerce UX, not a gap):
- **Cart** and **wishlist** — held in Zustand + localStorage. Wishlist entries are just saved product IDs, cross-referenced against the real `/api/products` API when displayed.
- The "Customers" and "Settings" admin pages, and the customer-facing "Account" page, are explicit "coming soon" placeholders with no backend endpoints to wire up.

## Notes

- Brand name, WhatsApp number, and contact details live in `lib/site-config.ts`.
- The admin JWT is persisted via `zustand`'s `persist` middleware (`localStorage`), and attached as a `Bearer` token on every authenticated request. See the root `README.md` for the reasoning behind keeping bearer-token auth rather than moving to httpOnly cookies.
- Google Fonts (Playfair Display, Inter) are fetched at build time — an internet connection is required for `npm run build`.
