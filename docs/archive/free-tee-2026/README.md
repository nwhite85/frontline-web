# Free Tee / Vest — 2026 joining perk (closed)

Founding members got a free Frontline tee or vest when they joined. Orders were
taken through the `/free-tee` page between **10 March and 4 June 2026**.

The campaign is finished. This directory is the record of it — `orders.csv` is a
snapshot of the `merch_orders` table taken on 12 August 2026.

## Totals — 61 orders

| Item | Count |
|---|---|
| T-Shirt | 47 |
| Vest | 14 |

| Fit | Count |
|---|---|
| Ladies' | 33 |
| Men's | 28 |

| Size | XS | S | M | L | XL | XXL | 3XL |
|---|---|---|---|---|---|---|---|
| Count | 1 | 9 | 23 | 16 | 8 | 2 | 2 |

No member ordered twice.

## Notes

- One row reads `tshirt - JC005 Blue` rather than plain `tshirt` — a manual entry
  naming the garment code. Counted under T-Shirt above.
- The `merch_orders` table still exists in Supabase; nothing has been deleted.
- The page itself lives at `src/app/free-tee/page.tsx`, with `/founder-merch`
  and `/merch` alongside it. The order API is `src/app/api/merch-order/route.ts`.
