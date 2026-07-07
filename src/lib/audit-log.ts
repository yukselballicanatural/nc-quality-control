type AuditActor = {
  id?: string | null
  email?: string | null
}

type AuditLogInput = {
  actor?: AuditActor | null
  action: string
  entityType: string
  entityId?: string | null
  metadata?: Record<string, unknown>
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

function auditHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    Prefer: 'return=minimal',
  }
}

export async function writeAuditLog(input: AuditLogInput) {
  if (!SUPABASE_URL || !SERVICE_KEY) return

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: auditHeaders(),
      body: JSON.stringify({
        actor_id: input.actor?.id ?? null,
        actor_email: input.actor?.email ?? null,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        metadata: input.metadata ?? {},
      }),
      cache: 'no-store',
    })
  } catch (error) {
    console.warn('Audit log write failed:', error)
  }
}
