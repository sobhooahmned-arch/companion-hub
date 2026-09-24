CREATE TABLE public.admin_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_devices TO anon, authenticated;
GRANT ALL ON public.admin_devices TO service_role;
ALTER TABLE public.admin_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon full admin_devices" ON public.admin_devices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);