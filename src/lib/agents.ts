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
