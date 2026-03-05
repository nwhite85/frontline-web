/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type WorkoutSetHistory = Tables['workout_set_history']['Row'] & {
  exercises?: Tables['exercises']['Row']
}
type ClientProgram = Tables['client_programs']['Row'] & {
  programs?: Tables['programs']['Row']
}
type ClassSchedule = Tables['class_schedules']['Row'] & {
  class?: Tables['classes']['Row']
}
type Appointment = Tables['appointments']['Row'] & {
  client?: Tables['user_profiles']['Row']
  appointment_template?: Tables['appointment_templates']['Row']
}

export interface ClientProgressSummary {
  client_id: string
  client_name: string
  total_workouts: number
  last_workout_date: string | null
  average_rpe: number
  total_weight_lifted: number
  personal_bests_count: number
  recent_pbs: Array<{
    exercise_name: string
    weight?: number
    reps?: number
    time_minutes?: number
    time_seconds?: number
    distance?: number
    date: string
  }>
  program_progress: {
    program_name: string
    current_week: number
    total_weeks: number
    percentage: number
  } | null
}

export interface ActivityLog {
  id: string
  client_id: string
  trainer_id: string
  event_type: string
  created_at: string
  client_name?: string
  metadata: {
    workout_name?: string
    exercise_name?: string
    rpe?: number
    duration_ms?: number
    total_weight_lifted?: number
  }
}

export interface AtRiskMember {
  client_id: string
  client_name: string
  last_activity_date: string
  days_inactive: number
}

export interface TodayScheduleItem {
  id: string
  type: 'appointment' | 'class' | 'event'
  title: string
  time: string
  client_name?: string
  status?: string
  duration?: number
  start_time?: string
  end_time?: string
}

export const useDashboardData = (user: any) => {
  const [stats, setStats] = useState<Array<{ name: string; stat: string | number; icon: string }>>([])
  const [bottomStats, setBottomStats] = useState<Array<{ name: string; stat: string | number; icon: string }>>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientsProgress, setClientsProgress] = useState<ClientProgressSummary[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [atRiskMembers, setAtRiskMembers] = useState<AtRiskMember[]>([])
  const [loadingAtRisk, setLoadingAtRisk] = useState(true)
  const [todaySchedule, setTodaySchedule] = useState<TodayScheduleItem[]>([])
  const [loadingToday, setLoadingToday] = useState(true)
  const [newLeads, setNewLeads] = useState<Record<string, any>[]>([])
  const [loadingLeads, setLoadingLeads] = useState(true)

  const fetchStatsAndProgress = async () => {
    if (!user) return;

    setLoadingStats(true);
    setError(null);
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Query 1: Get active clients count
      const { count: clientCount } = await supabase
        .from('trainer_client')
        .select('*', { count: 'exact', head: true })
        .eq('trainer_id', user.id)
        .is('archived_at', null);

      // Queries 2-8: Stats counts (already parallel — leave as-is)
      const [recentCheckIns, personalBests, appointmentsThisWeek, completedWorkouts, classesThisWeek, completedClasses] = await Promise.all([
        supabase.from('activity_log').select('*', { count: 'exact', head: true })
          .eq('trainer_id', user.id).eq('event_type', 'workout_completed').gte('created_at', weekAgo.toISOString()),
        supabase.from('activity_log').select('*', { count: 'exact', head: true })
          .eq('trainer_id', user.id).eq('event_type', 'personal_best_achieved').gte('created_at', weekAgo.toISOString()),
        supabase.from('appointments').select('*', { count: 'exact', head: true })
          .eq('trainer_id', user.id).gte('appointment_date', new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toISOString().split('T')[0]),
        supabase.from('activity_log').select('*', { count: 'exact', head: true })
          .eq('trainer_id', user.id).eq('event_type', 'workout_completed').gte('created_at', new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toISOString()),
        supabase.from('class_schedules').select('*', { count: 'exact', head: true })
          .eq('trainer_id', user.id).gte('scheduled_date', new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toISOString().split('T')[0]),
        supabase.from('activity_log').select('*', { count: 'exact', head: true })
          .eq('trainer_id', user.id).eq('event_type', 'class_completed').gte('created_at', new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toISOString())
      ]);

      setStats([
        { name: 'Personal Bests', stat: personalBests.count || 0, icon: 'TrophyIcon' },
        { name: 'Total Clients', stat: clientCount || 0, icon: 'UsersIcon' },
        { name: 'Appointments This Week', stat: appointmentsThisWeek.count || 0, icon: 'CalendarIcon' },
        { name: 'Completed Workouts', stat: completedWorkouts.count || 0, icon: 'CheckIcon' }
      ]);

      setBottomStats([
        { name: 'Recent Check-ins', stat: recentCheckIns.count || 0, icon: 'ClockIcon' },
        { name: 'Total Members', stat: clientCount || 0, icon: 'UsersIcon' },
        { name: 'Classes This Week', stat: classesThisWeek.count || 0, icon: 'GroupIcon' },
        { name: 'Completed Classes', stat: completedClasses.count || 0, icon: 'CheckIcon' }
      ]);

      // Query 9: Get clients for progress section
      const { data: trainerClientsRaw } = await supabase
        .from('trainer_client')
        .select('client_id')
        .eq('trainer_id', user.id)
        .is('archived_at', null);
      const trainerClients = trainerClientsRaw as Array<{ client_id: string }> | null;

      if (trainerClients && trainerClients.length > 0) {
        const clientIds = trainerClients.slice(0, 5).map(tc => tc.client_id);

        // Batch all per-client queries — 6 queries instead of 25
        const [
          profilesResult,
          workoutLogsResult,
          pbCountsResult,
          recentPBsResult,
          weightDataResult,
          activeProgramsResult,
        ] = await Promise.all([
          // Query 10: All user profiles in one shot
          supabase
            .from('user_profiles')
            .select('id, name, email')
            .in('id', clientIds),

          // Query 11: All workout_completed logs for these clients
          supabase
            .from('activity_log')
            .select('*')
            .eq('trainer_id', user.id)
            .in('client_id', clientIds)
            .eq('event_type', 'workout_completed')
            .order('created_at', { ascending: false })
            .limit(100),

          // Query 12: All PB rows (count client-side)
          supabase
            .from('workout_set_history')
            .select('client_id')
            .in('client_id', clientIds)
            .eq('is_personal_best', true),

          // Query 13: Recent PBs with exercise info (take top 3 per client client-side)
          supabase
            .from('workout_set_history')
            .select('client_id, weight, reps, time_minutes, time_seconds, distance, created_at, exercises (name)')
            .in('client_id', clientIds)
            .eq('is_personal_best', true)
            .order('created_at', { ascending: false })
            .limit(50),

          // Query 14: All weight data for total weight calculation
          supabase
            .from('workout_set_history')
            .select('client_id, weight, reps')
            .in('client_id', clientIds)
            .not('weight', 'is', null)
            .not('reps', 'is', null),

          // Query 15: Active programs for all clients
          supabase
            .from('client_programs')
            .select('client_id, id, status, start_date, assigned_at, created_at, programs (title, duration_weeks)')
            .in('client_id', clientIds)
            .eq('status', 'active'),
        ]);

        // Group results by client_id client-side
        const profileMap = new Map(
          (profilesResult.data || []).map(p => [p.id, p])
        );

        const workoutLogsByClient = new Map<string, any[]>();
        for (const log of (workoutLogsResult.data || [])) {
          const arr = workoutLogsByClient.get(log.client_id) || [];
          if (arr.length < 10) arr.push(log);
          workoutLogsByClient.set(log.client_id, arr);
        }

        const pbCountByClient = new Map<string, number>();
        for (const row of (pbCountsResult.data || [])) {
          pbCountByClient.set(row.client_id, (pbCountByClient.get(row.client_id) || 0) + 1);
        }

        const recentPBsByClient = new Map<string, any[]>();
        for (const pb of (recentPBsResult.data || [])) {
          const arr = recentPBsByClient.get(pb.client_id) || [];
          if (arr.length < 3) arr.push(pb);
          recentPBsByClient.set(pb.client_id, arr);
        }

        const weightDataByClient = new Map<string, any[]>();
        for (const row of (weightDataResult.data || [])) {
          const arr = weightDataByClient.get(row.client_id) || [];
          arr.push(row);
          weightDataByClient.set(row.client_id, arr);
        }

        const activeProgramByClient = new Map<string, any>();
        for (const prog of (activeProgramsResult.data || [])) {
          if (!activeProgramByClient.has(prog.client_id)) {
            activeProgramByClient.set(prog.client_id, prog);
          }
        }

        // Build progress summaries client-side (no more per-client queries)
        const progressSummaries: ClientProgressSummary[] = clientIds.map(clientId => {
          const profile = profileMap.get(clientId);
          const clientName = profile?.name || profile?.email || 'Unknown Client';
          const workoutLogs = workoutLogsByClient.get(clientId) || [];
          const pbCount = pbCountByClient.get(clientId) || 0;
          const recentPBsRaw = recentPBsByClient.get(clientId) || [];
          const weightData = weightDataByClient.get(clientId) || [];
          const activeProgram = activeProgramByClient.get(clientId) || null;

          const recent_pbs = recentPBsRaw.map(pb => ({
            exercise_name: (pb as WorkoutSetHistory).exercises?.name || 'Unknown Exercise',
            weight: pb.weight,
            reps: pb.reps,
            time_minutes: pb.time_minutes,
            time_seconds: pb.time_seconds,
            distance: pb.distance,
            date: pb.created_at
          }));

          const totalWeightLifted = weightData.reduce((total, set) =>
            total + (set.weight * set.reps), 0);

          const workoutRpes = workoutLogs.map(log => log.metadata?.rpe).filter(rpe => rpe != null);
          const averageRpe = workoutRpes.length > 0
            ? workoutRpes.reduce((sum, rpe) => sum + rpe, 0) / workoutRpes.length
            : 0;

          let programProgress = null;
          if (activeProgram?.programs) {
            const program = (activeProgram as ClientProgram).programs;
            const startDate = new Date(activeProgram.start_date || activeProgram.assigned_at || activeProgram.created_at);
            const now = new Date();
            const weeksPassed = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
            const currentWeek = Math.max(1, Math.min(weeksPassed + 1, program.duration_weeks || 1));

            programProgress = {
              program_name: program.title,
              current_week: currentWeek,
              total_weeks: program.duration_weeks || 1,
              percentage: Math.round((currentWeek / (program.duration_weeks || 1)) * 100)
            };
          }

          return {
            client_id: clientId,
            client_name: clientName,
            total_workouts: workoutLogs.length,
            last_workout_date: workoutLogs[0]?.created_at || null,
            average_rpe: Math.round(averageRpe * 10) / 10,
            total_weight_lifted: Math.round(totalWeightLifted),
            personal_bests_count: pbCount,
            recent_pbs,
            program_progress: programProgress
          };
        });

        setClientsProgress(progressSummaries);
      }

    } catch (error: unknown) {
      logger.error('Error fetching stats:', error);
      setError(getErrorMessage(error) || 'Something went wrong loading dashboard data');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchActivityLogs = async () => {
    if (!user) return;

    setLoadingActivity(true);
    try {
      const { data: logs, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      if (logs && logs.length > 0) {
        const clientIds = [...new Set(logs.map(log => log.client_id))];
        const { data: clientProfiles } = await supabase
          .from('user_profiles')
          .select('id, name, email')
          .in('id', clientIds);
        
        const logsWithClientNames = logs.map(log => ({
          ...log,
          client_name: clientProfiles?.find(profile => profile.id === log.client_id)?.name || 
                      clientProfiles?.find(profile => profile.id === log.client_id)?.email || 
                      'Unknown Client'
        }));
        
        setActivityLogs(logsWithClientNames);
      } else {
        setActivityLogs(logs || []);
      }
    } catch (error: unknown) {
      logger.error('Error fetching activity logs:', error);
      setError(getErrorMessage(error) || 'Something went wrong loading activity');
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchAtRiskMembers = async () => {
    if (!user) return;

    setLoadingAtRisk(true);
    try {
      // Query 1: Get all active clients
      const { data: clients } = await supabase
        .from('trainer_client')
        .select('client_id')
        .eq('trainer_id', user.id)
        .is('archived_at', null);

      if (!clients || clients.length === 0) return;

      const clientIds = clients.map(c => c.client_id);

      // Queries 2 & 3 in parallel: batch profiles + batch activity (instead of 2×N queries)
      const [profilesResult, activityResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, name, email')
          .in('id', clientIds),

        supabase
          .from('activity_log')
          .select('client_id, created_at')
          .eq('trainer_id', user.id)
          .in('client_id', clientIds)
          .order('created_at', { ascending: false })
          .limit(500),
      ]);

      // Group activity by client_id to find each client's most recent activity
      const lastActivityByClient = new Map<string, string>();
      for (const row of (activityResult.data || [])) {
        if (!lastActivityByClient.has(row.client_id)) {
          lastActivityByClient.set(row.client_id, row.created_at);
        }
      }

      const profileMap = new Map(
        (profilesResult.data || []).map(p => [p.id, p])
      );

      const atRiskData: AtRiskMember[] = [];
      const now = new Date();

      for (const clientId of clientIds) {
        const lastActivityDate = lastActivityByClient.get(clientId);
        if (lastActivityDate) {
          const daysInactive = Math.ceil(
            (now.getTime() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysInactive >= 7) {
            const profile = profileMap.get(clientId);
            atRiskData.push({
              client_id: clientId,
              client_name: profile?.name || profile?.email || 'Unknown Client',
              last_activity_date: lastActivityDate,
              days_inactive: daysInactive
            });
          }
        }
      }

      atRiskData.sort((a, b) => b.days_inactive - a.days_inactive);
      setAtRiskMembers(atRiskData.slice(0, 5));

    } catch (error: unknown) {
      logger.error('Error fetching at-risk members:', error);
      setError(getErrorMessage(error) || 'Something went wrong loading at-risk members');
    } finally {
      setLoadingAtRisk(false);
    }
  };

  const fetchTodaySchedule = async () => {
    if (!user) return;

    setLoadingToday(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const scheduleItems: TodayScheduleItem[] = [];

      const { data: appointments } = await supabase
        .from('appointments')
        .select(`id, start_time, end_time, status, client:user_profiles!appointments_client_id_fkey(name, email), appointment_template:appointment_templates(name)`)
        .eq('trainer_id', user.id)
        .eq('appointment_date', today)
        .order('start_time');

      if (appointments) {
        appointments.forEach(apt => {
          const appointment = apt as Appointment;
          const clientName = appointment.client?.name || appointment.client?.email || 'Unknown Client';
          const title = appointment.appointment_template?.name || 'Appointment';
          
          scheduleItems.push({
            id: `apt-${apt.id}`,
            type: 'appointment',
            title: `${title} - ${clientName}`,
            time: apt.start_time.substring(0, 5),
            client_name: clientName,
            status: apt.status,
            start_time: apt.start_time,
            end_time: apt.end_time
          });
        });
      }

      const { data: classes } = await supabase
        .from('class_schedules')
        .select(`id, start_time, end_time, current_bookings, max_capacity, class:classes(name)`)
        .eq('trainer_id', user.id)
        .eq('scheduled_date', today)
        .order('start_time');

      if (classes) {
        classes.forEach(cls => {
          const className = (cls as ClassSchedule).class?.name || 'Class';
          
          scheduleItems.push({
            id: `cls-${cls.id}`,
            type: 'class',
            title: className,
            time: cls.start_time.substring(0, 5),
            status: `${cls.current_bookings}/${cls.max_capacity} booked`,
            start_time: cls.start_time,
            end_time: cls.end_time
          });
        });
      }

      scheduleItems.sort((a, b) => a.time.localeCompare(b.time));
      setTodaySchedule(scheduleItems);

    } catch (error: unknown) {
      logger.error('Error fetching today schedule:', error);
      setError(getErrorMessage(error) || 'Something went wrong loading today\'s schedule');
    } finally {
      setLoadingToday(false);
    }
  };

  const fetchNewLeads = async () => {
    if (!user) return;
    
    setLoadingLeads(true);
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: leads } = await supabase
        .from('trainer_client')
        .select(`client_id, created_at, user_profiles!trainer_client_client_id_fkey(name, email)`)
        .eq('trainer_id', user.id)
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false });
      
      setNewLeads(leads || []);
    } catch (error: unknown) {
      logger.error('Error fetching new leads:', error);
      setError(getErrorMessage(error) || 'Something went wrong loading leads');
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStatsAndProgress();
      fetchActivityLogs();
      fetchAtRiskMembers();
      fetchTodaySchedule();
      fetchNewLeads();
    }
  }, [user])

  return {
    stats,
    bottomStats,
    loadingStats,
    error,
    clientsProgress,
    activityLogs,
    loadingActivity,
    atRiskMembers,
    loadingAtRisk,
    todaySchedule,
    loadingToday,
    newLeads,
    loadingLeads
  }
}
