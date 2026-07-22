-- 003: Order line items
-- Fixes multi-item order data loss: previously only items[0].product_id was
-- recorded per order. Run AFTER 001 and 002 in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Buyers can see line items on their own orders
CREATE POLICY "Buyers can view their own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.buyer_id = auth.uid()
    )
  );

-- Sellers can see line items for their own orders
CREATE POLICY "Sellers can view order items for their sales"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.seller_id = auth.uid()
    )
  );

-- Buyers can add line items only to their own orders
CREATE POLICY "Buyers can create items on their own orders"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.buyer_id = auth.uid()
    )
  );

GRANT SELECT, INSERT ON public.order_items TO authenticated;

-- Atomic stock decrement for checkout. The products UPDATE RLS policy only
-- allows sellers to update their own products, so buyers cannot decrement
-- stock directly. This SECURITY DEFINER function performs the decrement in a
-- single atomic UPDATE and refuses to oversell (quantity >= p_quantity).
CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.products
  SET quantity = quantity - p_quantity
  WHERE id = p_product_id
    AND quantity >= p_quantity;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.decrement_product_stock(UUID, INTEGER) TO authenticated;
