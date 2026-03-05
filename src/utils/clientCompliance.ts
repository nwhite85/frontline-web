/**
 * Client Compliance / At-Risk Detection Utility
 *
 * Risk levels based on days since last activity:
 *   active:      0-7 days
 *   at-risk:     7-14 days
 *   disengaged:  14-30 days
 *   inactive:    30+ days
 *
 * "Activity" includes: workout completed, class booked/attended,
 * challenge participated, chat message sent, app login.
 */

export type RiskLevel = 'active' | 'at-risk' | 'disengaged' | 'inactive';

export interface RiskInfo {
  level: RiskLevel;
  daysSince: number;
  label: string;
  /** DS token CSS variable */
  color: string;
  /** DS token CSS variable for background/opaque */
  bgColor: string;
}

export interface ComplianceStats {
  active: number;
  atRisk: number;
  disengaged: number;
  inactive: number;
  total: number;
}

export interface ClientWithActivity {
  id: string;
  name?: string;
  last_activity_date?: string | null;
  [key: string]: unknown;
}

/**
 * Calculate the risk level for a single client based on their last activity date.
 * If no date is provided the client is treated as inactive.
 */
export function getClientRiskLevel(lastActivityDate: string | null | undefined): RiskInfo {
  if (!lastActivityDate) {
    return {
      level: 'inactive',
      daysSince: Infinity,
      label: 'Inactive',
      color: 'var(--dsd-color-crimson)',
      bgColor: 'var(--dsd-color-crimson-opaque)',
    };
  }

  const now = new Date();
  const last = new Date(lastActivityDate);
  const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSince < 7) {
    return { level: 'active', daysSince, label: 'Active', color: 'var(--dsd-color-emerald)', bgColor: 'var(--dsd-color-emerald-opaque)' };
  }
  if (daysSince < 14) {
    return { level: 'at-risk', daysSince, label: 'At Risk', color: 'var(--dsd-color-amber)', bgColor: 'var(--dsd-color-amber-opaque)' };
  }
  if (daysSince < 30) {
    return { level: 'disengaged', daysSince, label: 'Disengaged', color: 'var(--dsd-color-coral)', bgColor: 'var(--dsd-color-coral-opaque)' };
  }

  return { level: 'inactive', daysSince, label: 'Inactive', color: 'var(--dsd-color-crimson)', bgColor: 'var(--dsd-color-crimson-opaque)' };
}

/**
 * Aggregate compliance stats across a list of clients.
 */
export function getComplianceStats(clients: ClientWithActivity[]): ComplianceStats {
  const stats: ComplianceStats = { active: 0, atRisk: 0, disengaged: 0, inactive: 0, total: clients.length };

  for (const client of clients) {
    const { level } = getClientRiskLevel(client.last_activity_date ?? null);
    switch (level) {
      case 'active': stats.active++; break;
      case 'at-risk': stats.atRisk++; break;
      case 'disengaged': stats.disengaged++; break;
      case 'inactive': stats.inactive++; break;
    }
  }

  return stats;
}
