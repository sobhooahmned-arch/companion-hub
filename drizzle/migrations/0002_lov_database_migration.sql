-- السماح للزوار والتطبيق بالوصول لجداول التطبيق (التطبيق يستخدم تسجيل دخول خاص بدون حسابات نظام)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.money_requests TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pay_settings TO anon, authenticated;

CREATE POLICY "anon full accounts" ON public.accounts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon full money_requests" ON public.money_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon full support_messages" ON public.support_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon full subscriptions" ON public.subscriptions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon full notifications" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon full pay_settings" ON public.pay_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);