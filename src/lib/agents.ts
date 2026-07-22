import type { Database } from '@/types/supabase'

export type Agent = Database['public']['Tables']['agents']['Row']

export interface AgentOption {
  id: string
  fullName: string
  region: string | null
  teamLeaderName: string | null
}

function fullNameOf(agent: Pick<Agent, 'first_name' | 'last_name'>) {
  return [agent.first_name, agent.last_name].filter(Boolean).join(' ').trim()
}

/**
 * The agents table has no dedicated team-leader column — the team (and its
 * leader) is embedded in the free-text `role` field synced from the CRM,
 * e.g. "Arij  Team", "Ramadan Team - Morocco", "Team Leader - Selma".
 */
export function deriveTeamLeaderName(agent: Pick<Agent, 'role' | 'first_name' | 'last_name'>): string | null {
  const role = (agent.role ?? '').trim()
  if (!role) return null

  const asLeader = role.match(/^Team Leader\s*-\s*(.+)$/i)
  if (asLeader) return fullNameOf(agent) || asLeader[1].trim()

  const asMember = role.match(/^(.+?)\s+Team(?:\s*-\s*Morocco)?$/i)
  if (asMember) return asMember[1].trim()

  return null
}

export function isTeamLeaderRole(role: string | null): boolean {
  return /^Team Leader\s*-\s*/i.test((role ?? '').trim())
}

/**
 * A consultant ("danışman") is a member of a sales team. In the CRM-synced
 * free-text role this always contains "Team" (e.g. "Ghazal Team",
 * "Farah Team - Morocco", "SM- Mert Team"), while team leaders, regional
 * managers, sales masters, executives and back-office roles do not qualify.
 * Team leaders contain "Team Leader" and are excluded even though they match
 * "Team". Manually-added consultants also get a "<leader> Team" role, so they
 * are included too.
 */
export function isConsultantAgent(role: string | null): boolean {
  const r = (role ?? '').trim()
  if (!r) return false
  if (/team\s*leader/i.test(r)) return false
  return /team/i.test(r)
}

/**
 * Build the consultant dropdown options: only actual consultants, optionally
 * scoped to a region. `keepId` always keeps that one agent in the list (used
 * on the edit form so the already-selected consultant never disappears even
 * if they fall outside the current region/filter).
 */
export function buildConsultantOptions(
  rows: Array<Pick<Agent, 'id' | 'first_name' | 'last_name' | 'role' | 'region'>>,
  opts: { region?: string | null; keepId?: string | null } = {}
): AgentOption[] {
  const { region = null, keepId = null } = opts
  return rows
    .filter(
      a =>
        (keepId != null && a.id === keepId) ||
        (isConsultantAgent(a.role) && (!region || a.region === region))
    )
    .map(toAgentOption)
}

export function toAgentOption(
  agent: Pick<Agent, 'id' | 'first_name' | 'last_name' | 'role' | 'region'>
): AgentOption {
  return {
    id: agent.id,
    fullName: fullNameOf(agent) || agent.id,
    region: agent.region,
    teamLeaderName: deriveTeamLeaderName(agent),
  }
}
