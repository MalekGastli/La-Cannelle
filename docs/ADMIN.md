# Admin system

Modelled on the owner's other CRMs: **BDX CRM** (roles grant, a per-person override decides, resolved on the server)
and **Exam Lab** (invite-only access, nobody signs up on their own).

## How it works

- **Sign-in:** `/login` takes an email and password. The API checks them and issues a JWT, which the Next.js app keeps in an
  httpOnly `admin_token` cookie and attaches to every `/api` call. There is no shared or hardcoded login any more.
- **Owner:** the account created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (role `ADMIN`) holds every permission and cannot be edited.
- **Staff:** invited people (role `STAFF`) get their rights from a **Role** (Manager, Kitchen, Viewer, or your own).
- **Permissions:** `resource.action`, for the resources orders, customers, menus, products, services, accessories, reports,
  system and team, and the actions view, create, edit, delete. Enforced in `backend/src/middleware/auth.ts` on every request;
  the admin UI only mirrors the answer (hidden menu entries and buttons, a read-only notice).
- **Per-person overrides:** *Allow* adds a right on top of the role, *Deny* removes it even if the role grants it.
- **Invites:** Team > Invite creates a one-time link (valid 7 days, only a hash is stored). The person opens `/invite/<token>`,
  sets a name and a password of at least 10 characters, and signs in. Revoking an invite or deactivating a member takes effect
  immediately, because permissions are re-read from the database on every request.
- **Activity:** sign-ins and every change to the team are written to the audit log (Team > Activity).

## Public vs. protected API

Public: menus, products, services, accessories and system status (read only), creating an order, the contact form.
Everything else needs a team member with the matching permission; customers can read only their own orders.

## First deploy

`backend/scripts/vercel-build.sh` runs the migration, creates the owner (if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set) and
the three system roles. `JWT_SECRET` must be identical on the frontend and API projects.

## Dishes & menus (`/menu_management`)

- **Dishes tab:** search and filter, attention chips (no photo, hidden, low margin, not translated), inline price edit, visibility switch, duplicate, bulk actions (show/hide, price ±%, category, add to menu, delete).
- **Dish editor:** photo upload (resized in the browser), price with margin and a suggested price from cost, EU allergen chips, menu membership, optional EN/FR/TR translations (they override the built-in dictionary in the shop).
- **Menus tab:** courses per guest (0 = course not offered), price suggestion from the chosen dishes, availability dates, services, duplicate, active switch. Warns when a course has fewer dishes than portions per guest.
- The previous editor is still available at `/menu_management/classic` (e.g. to restore the default menus).
- API additions: `PATCH /api/products/bulk`, `DELETE /api/products` (ids in body), `POST /api/products/:id/duplicate`, `POST /api/menus/:id/duplicate`; `products.translations` (JSON) column.
