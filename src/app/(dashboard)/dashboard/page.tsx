'use client'

import { useEffect } from 'react'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { useDashboardData } from './components/useDashboardData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Trophy, Users, Calendar, CheckCircle,
  Clock, BookOpen, Activity, AlertTriangle,
  UserPlus, TrendingUp,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

function StatCard({ name, stat, icon: Icon, loading, accent = false }: {
  name: string
  stat: string | number
  icon: React.ElementType
  loading: boolean
  accent?: boolean
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? 'text-emerald-600 dark:text-emerald-400' : 'bg-accent text-primary'}`}
            style={accent ? { backgroundColor: 'rgba(34, 197, 94, 0.12)' } : undefined}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{name}</p>
            {loading ? (
              <Skeleton className="h-5 w-10 mt-1" />
            ) : (
              <p className="text-xl font-semibold text-foreground leading-tight">{stat}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TodaySchedule({ todaySchedule, loadingToday }: { todaySchedule: ReturnType<typeof useDashboardData>['todaySchedule'], loadingToday: boolean }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          Today
        </CardTitle>
        <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMM d')}</p>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ScrollArea className="h-64">
          {loadingToday ? (
            <div className="flex flex-col gap-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : todaySchedule.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nothing scheduled today"
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              {todaySchedule.map((item) => (
                <div key={item.id} className="flex items-start gap-2 rounded-md p-2 hover:bg-muted/50 transition-colors">
                  <span className="text-xs font-mono text-muted-foreground mt-0.5 w-10 shrink-0">{item.time}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                    {item.status && (
                      <Badge variant="outline" className="bg-card text-xs h-4 px-1.5 mt-0.5">{item.status}</Badge>
                    )}
                  </div>
                  {item.type === 'appointment' && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                  {item.type === 'class' && (
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function ClientProgressCard({ clientsProgress, loadingStats }: { clientsProgress: ReturnType<typeof useDashboardData>['clientsProgress'], loadingStats: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          Client Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ScrollArea className="h-56">
          {loadingStats ? (
            <div className="flex flex-col gap-2">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : clientsProgress.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No clients yet"
              description="Add clients to track their progress here."
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              {clientsProgress.map((client) => (
                <Link key={client.client_id} href={`/dashboard/clients/${client.client_id}`}>
                  <div className="flex items-center gap-2.5 rounded-md p-2 hover:bg-muted/50 transition-colors cursor-pointer">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="text-xs bg-accent text-primary font-medium">
                        {client.client_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{client.client_name}</p>
                      {client.program_progress ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${client.program_progress.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            W{client.program_progress.current_week}/{client.program_progress.total_weeks}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No active program</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{client.total_workouts} workouts</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function RecentActivityCard({ activityLogs, loadingActivity }: { activityLogs: ReturnType<typeof useDashboardData>['activityLogs'], loadingActivity: boolean }) {
  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'workout_completed': return 'Completed a workout'
      case 'personal_best_achieved': return 'Set a personal best'
      case 'class_completed': return 'Attended a class'
      case 'class_booked': return 'Booked a class'
      default: return eventType.replace(/_/g, ' ')
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ScrollArea className="h-56">
          {loadingActivity ? (
            <div className="flex flex-col gap-2">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : activityLogs.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No recent activity"
              description="Client activity will appear here."
            />
          ) : (
            <div className="flex flex-col gap-1">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 rounded-md p-2 hover:bg-muted/50 transition-colors">
                  <Avatar className="h-6 w-6 mt-0.5 shrink-0">
                    <AvatarFallback className="text-[10px] bg-accent text-primary font-medium">
                      {(log.client_name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground">
                      <span className="font-medium">{log.client_name}</span>
                      {' '}<span className="text-muted-foreground">{getEventLabel(log.event_type)}</span>
                    </p>
                    {log.metadata?.workout_name && (
                      <p className="text-xs text-muted-foreground truncate">{log.metadata.workout_name}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function NewLeadsCard({ newLeads, loadingLeads }: { newLeads: ReturnType<typeof useDashboardData>['newLeads'], loadingLeads: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
          New Clients (7 days)
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {loadingLeads ? (
          <div className="flex flex-col gap-2">
            {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : newLeads.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No new clients this week</p>
        ) : (
          <div className="flex flex-col gap-1">
            {newLeads.map((lead) => {
              const profile = lead.user_profiles as { name?: string; email?: string } | null
              const name = profile?.name || profile?.email || 'Unknown'
              return (
                <div key={lead.client_id} className="flex items-center gap-2.5 rounded-md p-2 hover:bg-muted/50 transition-colors">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-xs bg-accent text-primary font-medium">
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-card text-xs h-5 px-1.5">New</Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AtRiskCard({ atRiskMembers, loadingAtRisk }: { atRiskMembers: ReturnType<typeof useDashboardData>['atRiskMembers'], loadingAtRisk: boolean }) {
  const getRiskBadgeVariant = (days: number) => {
    if (days >= 30) return 'destructive'
    if (days >= 14) return 'secondary'
    return 'outline'
  }

  return (
    <Card>
      <CardHeader className="pb-2 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
          At-Risk Members
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {loadingAtRisk ? (
          <div className="flex flex-col gap-2">
            {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : atRiskMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">All clients active ✓</p>
        ) : (
          <div className="flex flex-col gap-1">
            {atRiskMembers.map((member) => (
              <Link key={member.client_id} href={`/dashboard/clients/${member.client_id}`}>
                <div className="flex items-center gap-2.5 rounded-md p-2 hover:bg-muted/50 transition-colors cursor-pointer">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-xs bg-accent text-primary font-medium">
                      {member.client_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{member.client_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.days_inactive}d inactive
                    </p>
                  </div>
                  <Badge variant={getRiskBadgeVariant(member.days_inactive)} className="text-xs h-5 px-1.5">
                    {member.days_inactive >= 30 ? 'Inactive' : member.days_inactive >= 14 ? 'Disengaged' : 'At Risk'}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useSimpleAuth()
  const { setActions } = usePageActions()

  const {
    stats, bottomStats, loadingStats, error,
    clientsProgress, activityLogs, loadingActivity,
    atRiskMembers, loadingAtRisk,
    todaySchedule, loadingToday,
    newLeads, loadingLeads,
  } = useDashboardData(user)

  useEffect(() => {
    setActions(null)
    return () => setActions(null)
  }, [setActions])

  const STAT_ICONS = {
    TrophyIcon: Trophy,
    UsersIcon: Users,
    CalendarIcon: Calendar,
    CheckIcon: CheckCircle,
    ClockIcon: Clock,
    GroupIcon: Users,
  } as const

  return (
    <div className="flex flex-col gap-6 p-6">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</div>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((item) => (
          <StatCard
            key={item.name}
            name={item.name}
            stat={item.stat}
            icon={STAT_ICONS[item.icon as keyof typeof STAT_ICONS] ?? Trophy}
            loading={loadingStats}
          />
        ))}
      </div>

      {/* Main layout: today + right content */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
        <TodaySchedule todaySchedule={todaySchedule} loadingToday={loadingToday} />

        <div className="flex flex-col gap-4">
          {/* Client progress + activity */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ClientProgressCard clientsProgress={clientsProgress} loadingStats={loadingStats} />
            <RecentActivityCard activityLogs={activityLogs} loadingActivity={loadingActivity} />
          </div>

          {/* Bottom stats row */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {bottomStats.map((item) => (
              <StatCard
                key={item.name}
                name={item.name}
                stat={item.stat}
                icon={STAT_ICONS[item.icon as keyof typeof STAT_ICONS] ?? Trophy}
                loading={loadingStats}
                accent
              />
            ))}
          </div>

          {/* New leads + at-risk */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <NewLeadsCard newLeads={newLeads} loadingLeads={loadingLeads} />
            <AtRiskCard atRiskMembers={atRiskMembers} loadingAtRisk={loadingAtRisk} />
          </div>
        </div>
      </div>
    </div>
  )
}
