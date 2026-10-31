-- Per-colour stock: each entry in products.colors JSONB gains a numeric "stock" field.
-- Idempotent: only colours missing stock (or with null stock) are updated.
-- Distribution: product.stock is split across colours (remainder on the first colour)
-- so total inventory is preserved. Products with no colours keep products.stock as-is.

UPDATE products
SET colors = sub.new_colors,
    updated_at = now()
FROM (
  SELECT
    p.id,
    CASE
      WHEN jsonb_typeof(p.colors) IS DISTINCT FROM 'array'
        OR jsonb_array_length(p.colors) = 0
      THEN COALESCE(p.colors, '[]'::jsonb)
      ELSE (
        SELECT jsonb_agg(
          CASE
            WHEN elem ? 'stock' AND (elem->>'stock') ~ '^[0-9]+$'
            THEN elem
            ELSE jsonb_set(
              elem,
              '{stock}',
              to_jsonb(
                (p.stock / jsonb_array_length(p.colors))
                + CASE WHEN ord.ordinality = 1 THEN (p.stock % jsonb_array_length(p.colors)) ELSE 0 END
              )
            )
          END
          ORDER BY ord.ordinality
        )
        FROM jsonb_array_elements(p.colors) WITH ORDINALITY AS ord(elem, ordinality)
      )
    END AS new_colors
  FROM products p
) AS sub
WHERE products.id = sub.id
  AND products.colors IS DISTINCT FROM sub.new_colors;

-- Sync products.stock to the sum of colour stocks when colours exist
UPDATE products
SET stock = COALESCE((
  SELECT SUM(COALESCE((c->>'stock')::int, 0))
  FROM jsonb_array_elements(colors) AS c
), stock),
updated_at = now()
WHERE jsonb_typeof(colors) = 'array'
  AND jsonb_array_length(colors) > 0;
