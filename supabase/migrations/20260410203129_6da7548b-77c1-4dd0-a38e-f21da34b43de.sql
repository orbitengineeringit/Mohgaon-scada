
-- Fix 1: Restrict tag_config SELECT to admin/operator only (protects email addresses)
DROP POLICY IF EXISTS "Authenticated read on tag_config" ON public.tag_config;
CREATE POLICY "Role read tag_config" ON public.tag_config
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- Fix 2: Prevent admins from assigning roles to themselves (self-escalation protection)
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles for others" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND user_id != auth.uid()
  );
