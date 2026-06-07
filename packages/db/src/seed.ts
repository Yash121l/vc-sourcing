import { db, companies, contacts, signals } from './index'

const SEED_COMPANIES = [
  { name: 'Kirana Club', sector: 'ecommerce' as const, stage: 'seed' as const, geography: 'IN', city: 'Mumbai', description: 'B2B wholesale marketplace for kirana stores', source_type: 'inbound_portal' as const, status: 'engaged' as const, arr_usd: 1200000, growth_rate_pct: 22 },
  { name: 'Freo', sector: 'fintech' as const, stage: 'series_a' as const, geography: 'IN', city: 'Bangalore', description: 'Neo-banking platform for millennials with credit-first approach', source_type: 'angellist' as const, status: 'screening' as const, arr_usd: 4500000, growth_rate_pct: 18 },
  { name: 'Eka Care', sector: 'healthtech' as const, stage: 'seed' as const, geography: 'IN', city: 'Bangalore', description: 'Personal health records platform with AI-driven insights', source_type: 'demo_day' as const, status: 'radar' as const },
  { name: 'Classplus', sector: 'edtech' as const, stage: 'series_b' as const, geography: 'IN', city: 'Delhi', description: 'Platform for coaching institutes to go digital', source_type: 'co_investor' as const, status: 'proceeding' as const, arr_usd: 12000000, growth_rate_pct: 35 },
  { name: 'Ninjacart', sector: 'agritech' as const, stage: 'series_a' as const, geography: 'IN', city: 'Bangalore', description: 'Farm-to-business fresh produce supply chain platform', source_type: 'warm_intro' as const, status: 'watch' as const, arr_usd: 8000000 },
  { name: 'Porter', sector: 'logistics' as const, stage: 'series_b' as const, geography: 'IN', city: 'Bangalore', description: 'Intracity logistics platform for businesses and individuals', source_type: 'outbound_search' as const, status: 'passed' as const, pass_reason: 'Market too competitive, margin pressure from Dunzo and Lalamove' },
  { name: 'Hatio', sector: 'saas' as const, stage: 'pre_seed' as const, geography: 'IN', city: 'Pune', description: 'No-code platform for manufacturing SMEs to digitize operations', source_type: 'linkedin' as const, status: 'contacted' as const },
  { name: 'CropIn', sector: 'agritech' as const, stage: 'series_a' as const, geography: 'IN', city: 'Bangalore', description: 'AgriTech SaaS platform with remote sensing and AI for crop intelligence', source_type: 'newsletter' as const, status: 'engaged' as const, arr_usd: 3200000, growth_rate_pct: 28 },
  { name: 'Volopay', sector: 'fintech' as const, stage: 'seed' as const, geography: 'IN', city: 'Bangalore', description: 'Corporate spend management platform with smart cards and AP automation', source_type: 'scout_referral' as const, status: 'screening' as const, arr_usd: 900000, growth_rate_pct: 41 },
  { name: 'Doubtnut', sector: 'edtech' as const, stage: 'series_a' as const, geography: 'IN', city: 'Delhi', description: 'Video learning app using AI to solve doubts via photo', source_type: 'angellist' as const, status: 'radar' as const },
  { name: 'Recykal', sector: 'climate' as const, stage: 'seed' as const, geography: 'IN', city: 'Hyderabad', description: 'Digital marketplace for waste management and recycling', source_type: 'conference' as const, status: 'contacted' as const },
  { name: 'Wheelseye', sector: 'logistics' as const, stage: 'series_a' as const, geography: 'IN', city: 'Delhi', description: 'IoT-based fleet telematics and trucking intelligence platform', source_type: 'warm_intro' as const, status: 'watch' as const, arr_usd: 2100000 },
  { name: 'Jar', sector: 'fintech' as const, stage: 'series_a' as const, geography: 'IN', city: 'Bangalore', description: 'Micro-savings app that rounds up UPI transactions to buy digital gold', source_type: 'outbound_search' as const, status: 'engaged' as const, arr_usd: 6000000, growth_rate_pct: 55 },
  { name: 'Kenko Health', sector: 'healthtech' as const, stage: 'seed' as const, geography: 'IN', city: 'Bangalore', description: 'Health subscription plans as an alternative to health insurance', source_type: 'demo_day' as const, status: 'screening' as const, arr_usd: 750000, growth_rate_pct: 33 },
  { name: 'Bijnis', sector: 'ecommerce' as const, stage: 'seed' as const, geography: 'IN', city: 'Delhi', description: 'B2B platform connecting footwear manufacturers to retailers', source_type: 'linkedin' as const, status: 'radar' as const },
]

async function seed() {
  console.log('Seeding database...')

  for (const company of SEED_COMPANIES) {
    const [inserted] = await db.insert(companies).values(company).returning()
    if (!inserted) continue

    await db.insert(contacts).values({
      company_id: inserted.id,
      name: `${company.name.split(' ')[0]} Founder`,
      role: 'founder',
      is_founder: true,
      background: 'IIT/IIM graduate with 8 years of relevant industry experience',
    })

    if (company.status === 'engaged' || company.status === 'screening') {
      await db.insert(signals).values({
        company_id: inserted.id,
        type: 'news',
        title: `${company.name} raises funding round`,
        description: `${company.name} closes a new funding round to accelerate growth.`,
        source_name: 'YourStory',
        sentiment: 'positive',
      })
    }
  }

  console.log(`Seeded ${SEED_COMPANIES.length} companies`)
  process.exit(0)
}

seed().catch((e) => { console.error(e); process.exit(1) })
