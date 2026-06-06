-- Example seed data for development
-- Run this ONLY in your local development environment

-- Insert sample jobs (requires service role or bypassing RLS)
insert into public.jobs (external_id, job_hash, title, company, location, url, source, posted_at)
values
  ('linkedin_001', 'atlas_fe_blr', 'Frontend Engineer', 'Atlassian', 'Bangalore', 'https://example.com/1', 'linkedin', now() - interval '2 days'),
  ('linkedin_002', 'stripe_se_blr', 'Software Engineer', 'Stripe', 'Bangalore', 'https://example.com/2', 'linkedin', now() - interval '3 days'),
  ('indeed_001', 'swy_fse_rem', 'Full Stack Engineer', 'Swiggy', 'Remote', 'https://example.com/3', 'indeed', now() - interval '1 day'),
  ('naukri_001', 'raz_sre_hyd', 'Senior React Engineer', 'Razorpay', 'Hyderabad', 'https://example.com/4', 'naukri', now() - interval '4 days'),
  ('linkedin_003', 'goog_swe_blr', 'Software Engineer II', 'Google', 'Bangalore', 'https://example.com/5', 'linkedin', now() - interval '5 days')
on conflict (external_id) do nothing;
