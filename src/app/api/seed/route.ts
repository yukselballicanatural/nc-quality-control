import { NextResponse } from 'next/server'

const USERS = [
  { email: 'kalite@naturalclinic.com',       password: 'NaturalQC2025!', full_name: 'Kalite Ekibi',  role: 'quality_team' },
  { email: 'takim.lideri@naturalclinic.com', password: 'NaturalQC2025!', full_name: 'Takım Lideri',  role: 'team_leader'  },
  { email: 'yonetici@naturalclinic.com',     password: 'NaturalQC2025!', full_name: 'Yönetici',      role: 'manager'      },
  { email: 'danisman@naturalclinic.com',     password: 'NaturalQC2025!', full_name: 'Test Danışman', role: 'consultant'   },
]

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!

  const headers = {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  }

  const results = []

  for (const user of USERS) {
    // 1. Auth user — raw fetch so we see the actual error
    const authRes = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.full_name, role: user.role },
      }),
    })

    const authBody = await authRes.json()

    if (!authRes.ok) {
      results.push({ email: user.email, status: 'auth_error', http: authRes.status, body: authBody })
      continue
    }

    const userId = authBody.id
    if (!userId) {
      results.push({ email: user.email, status: 'no_id', body: authBody })
      continue
    }

    // 2. Profile upsert
    const profRes = await fetch(`${url}/rest/v1/profiles`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({
        id: userId,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_active: true,
      }),
    })

    if (!profRes.ok) {
      const profBody = await profRes.text()
      results.push({ email: user.email, status: 'profile_error', http: profRes.status, body: profBody })
      continue
    }

    results.push({ email: user.email, status: 'created', id: userId })
  }

  return NextResponse.json({ results })
}
