CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text NOT NULL UNIQUE,
  shipment_id uuid NOT NULL UNIQUE REFERENCES public.shipments(id) ON DELETE CASCADE,
  tracking_number text NOT NULL,
  invoice_date timestamp with time zone NOT NULL DEFAULT now(),
  currency text NOT NULL DEFAULT 'USD',
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  balance_due numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'UNPAID',
  pdf_path text,
  status text NOT NULL DEFAULT 'DRAFT',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;
GRANT SELECT ON public.invoices TO anon;
GRANT ALL ON public.invoices TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invoices" ON public.invoices
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create invoices" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update invoices" ON public.invoices
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can view invoice by tracking number" ON public.invoices
  FOR SELECT TO anon USING (true);

CREATE INDEX idx_invoices_tracking_number ON public.invoices(tracking_number);

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.invoice_email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  tracking_number text NOT NULL,
  recipient_email text NOT NULL,
  recipient_type text NOT NULL,
  sent_at timestamp with time zone,
  status text NOT NULL DEFAULT 'PENDING',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.invoice_email_logs TO authenticated;
GRANT ALL ON public.invoice_email_logs TO service_role;

ALTER TABLE public.invoice_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invoice email logs" ON public.invoice_email_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_invoice_email_logs_invoice_id ON public.invoice_email_logs(invoice_id);