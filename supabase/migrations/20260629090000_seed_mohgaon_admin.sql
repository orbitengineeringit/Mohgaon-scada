-- ============================================================
-- Mohgaon SCADA - Admin User Role Seed
-- NOTE: Auth user is created via Supabase Admin API (not SQL)
-- This migration only ensures the admin role is assigned
-- Admin user: adminmohgaon@mohgaon.scada / Admin@mohgaon56978
-- ============================================================

-- Assign admin role to the admin user (idempotent)
-- The user must already exist in auth.users (created via Admin API)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE email = 'adminmohgaon@mohgaon.scada'
ON CONFLICT DO NOTHING;
