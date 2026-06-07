-- Seed data for VC Sourcing Platform — 15 Indian startups
-- Apply with: wrangler d1 execute DB --local --file=../../packages/db/seed.sql
-- Or production: wrangler d1 execute DB --remote --file=../../packages/db/seed.sql

DELETE FROM companies WHERE id LIKE 'seed-%';

INSERT INTO companies (id, name, sector, stage, geography, city, description, source_type, status, arr_usd, growth_rate_pct, pass_reason, created_at, updated_at) VALUES
('seed-01', 'Kirana Club', 'ecommerce', 'seed', 'IN', 'Mumbai', 'B2B wholesale marketplace for kirana stores', 'inbound_portal', 'engaged', 1200000, 22, NULL, datetime('now'), datetime('now')),
('seed-02', 'Freo', 'fintech', 'series_a', 'IN', 'Bangalore', 'Neo-banking platform for millennials with credit-first approach', 'angellist', 'screening', 4500000, 18, NULL, datetime('now'), datetime('now')),
('seed-03', 'Eka Care', 'healthtech', 'seed', 'IN', 'Bangalore', 'Personal health records platform with AI-driven insights', 'demo_day', 'radar', NULL, NULL, NULL, datetime('now'), datetime('now')),
('seed-04', 'Classplus', 'edtech', 'series_b', 'IN', 'Delhi', 'Platform for coaching institutes to go digital', 'co_investor', 'proceeding', 12000000, 35, NULL, datetime('now'), datetime('now')),
('seed-05', 'Ninjacart', 'agritech', 'series_a', 'IN', 'Bangalore', 'Farm-to-business fresh produce supply chain platform', 'warm_intro', 'watch', 8000000, NULL, NULL, datetime('now'), datetime('now')),
('seed-06', 'Porter', 'logistics', 'series_b', 'IN', 'Bangalore', 'Intracity logistics platform for businesses and individuals', 'outbound_search', 'passed', NULL, NULL, 'Market too competitive, margin pressure from Dunzo and Lalamove', datetime('now'), datetime('now')),
('seed-07', 'Hatio', 'saas', 'pre_seed', 'IN', 'Pune', 'No-code platform for manufacturing SMEs to digitize operations', 'linkedin', 'contacted', NULL, NULL, NULL, datetime('now'), datetime('now')),
('seed-08', 'CropIn', 'agritech', 'series_a', 'IN', 'Bangalore', 'AgriTech SaaS platform with remote sensing and AI for crop intelligence', 'newsletter', 'engaged', 3200000, 28, NULL, datetime('now'), datetime('now')),
('seed-09', 'Volopay', 'fintech', 'seed', 'IN', 'Bangalore', 'Corporate spend management platform with smart cards and AP automation', 'scout_referral', 'screening', 900000, 41, NULL, datetime('now'), datetime('now')),
('seed-10', 'Doubtnut', 'edtech', 'series_a', 'IN', 'Delhi', 'Video learning app using AI to solve doubts via photo', 'angellist', 'radar', NULL, NULL, NULL, datetime('now'), datetime('now')),
('seed-11', 'Recykal', 'climate', 'seed', 'IN', 'Hyderabad', 'Digital marketplace for waste management and recycling', 'conference', 'contacted', NULL, NULL, NULL, datetime('now'), datetime('now')),
('seed-12', 'Wheelseye', 'logistics', 'series_a', 'IN', 'Delhi', 'IoT-based fleet telematics and trucking intelligence platform', 'warm_intro', 'watch', 2100000, NULL, NULL, datetime('now'), datetime('now')),
('seed-13', 'Jar', 'fintech', 'series_a', 'IN', 'Bangalore', 'Micro-savings app that rounds up UPI transactions to buy digital gold', 'outbound_search', 'engaged', 6000000, 55, NULL, datetime('now'), datetime('now')),
('seed-14', 'Kenko Health', 'healthtech', 'seed', 'IN', 'Bangalore', 'Health subscription plans as an alternative to health insurance', 'demo_day', 'screening', 750000, 33, NULL, datetime('now'), datetime('now')),
('seed-15', 'Bijnis', 'ecommerce', 'seed', 'IN', 'Delhi', 'B2B platform connecting footwear manufacturers to retailers', 'linkedin', 'radar', NULL, NULL, NULL, datetime('now'), datetime('now'));

-- Contacts (founders)
INSERT INTO contacts (id, company_id, name, role, is_founder, created_at, updated_at) VALUES
('contact-01', 'seed-01', 'Kirana Founder', 'founder', 1, datetime('now'), datetime('now')),
('contact-02', 'seed-02', 'Freo Founder', 'founder', 1, datetime('now'), datetime('now')),
('contact-03', 'seed-13', 'Jar Founder', 'founder', 1, datetime('now'), datetime('now')),
('contact-04', 'seed-14', 'Kenko Founder', 'founder', 1, datetime('now'), datetime('now'));

-- Signals
INSERT INTO signals (id, company_id, type, title, description, source_name, sentiment, is_read, detected_at, created_at) VALUES
('signal-01', 'seed-01', 'funding', 'Kirana Club closes $3M seed round', 'Led by Sequoia Surge with participation from Y Combinator.', 'TechCrunch', 'positive', 0, datetime('now', '-2 days'), datetime('now', '-2 days')),
('signal-02', 'seed-13', 'news', 'Jar hits 10M users milestone', 'App sees 3x growth in tier-2/3 cities over last quarter.', 'Inc42', 'positive', 0, datetime('now', '-1 day'), datetime('now', '-1 day')),
('signal-03', 'seed-09', 'hiring', 'Volopay hiring VP Engineering', 'Job postings indicate significant engineering expansion.', 'LinkedIn', 'positive', 0, datetime('now', '-3 hours'), datetime('now', '-3 hours')),
('signal-04', 'seed-14', 'product', 'Kenko launches mental wellness plans', 'New product vertical targeting corporate clients.', 'Product Hunt', 'positive', 0, datetime('now', '-5 hours'), datetime('now', '-5 hours'));
