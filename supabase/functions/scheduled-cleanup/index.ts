// Scheduled Cleanup Edge Function
// Purpose: Automated cleanup of expired sessions, tokens, and old data
// Schedule: Runs via pg_cron or external scheduler (GitHub Actions, cron-job.org)
// Owner: Infrastructure (Isabel) + Data Engineering (Buck)
// Created: 2026-01-25

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanupResult {
  task: string
  deleted_count?: number
  affected_count?: number
  execution_time_ms: number
}

interface CleanupResponse {
  success: boolean
  job_type: 'daily' | 'weekly' | 'monthly'
  started_at: string
  completed_at: string
  total_execution_time_ms: number
  results: CleanupResult[]
  total_records_affected: number
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify this is an authorized request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get job type from query parameter (default: daily)
    const url = new URL(req.url)
    const jobType = (url.searchParams.get('type') ?? 'daily') as 'daily' | 'weekly' | 'monthly'

    console.log(`Starting ${jobType} cleanup job...`)

    const startedAt = new Date()
    let results: CleanupResult[] = []
    let totalRecordsAffected = 0
    let error: string | undefined

    try {
      // Run appropriate cleanup based on job type
      let { data, error: queryError } = await (() => {
        switch (jobType) {
          case 'daily':
            return supabaseClient.rpc('run_daily_cleanup')
          case 'weekly':
            return supabaseClient.rpc('run_weekly_cleanup')
          case 'monthly':
            return supabaseClient.rpc('run_monthly_cleanup')
          default:
            throw new Error(`Invalid job type: ${jobType}`)
        }
      })()

      if (queryError) {
        throw queryError
      }

      results = data || []

      // Calculate total records affected
      totalRecordsAffected = results.reduce((sum, result) => {
        return sum + (result.deleted_count || result.affected_count || 0)
      }, 0)

      // Log successful cleanup to audit log
      const totalExecutionTime = new Date().getTime() - startedAt.getTime()

      await supabaseClient.rpc('log_cleanup_job', {
        p_job_name: `run_${jobType}_cleanup`,
        p_job_type: jobType,
        p_status: 'completed',
        p_records_affected: totalRecordsAffected,
        p_execution_time_ms: totalExecutionTime,
        p_error_message: null
      })

      console.log(`${jobType} cleanup completed:`, {
        total_records_affected: totalRecordsAffected,
        execution_time_ms: totalExecutionTime,
        tasks: results.length
      })

    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error'
      console.error(`${jobType} cleanup failed:`, error)

      // Log failed cleanup to audit log
      await supabaseClient.rpc('log_cleanup_job', {
        p_job_name: `run_${jobType}_cleanup`,
        p_job_type: jobType,
        p_status: 'failed',
        p_records_affected: 0,
        p_execution_time_ms: new Date().getTime() - startedAt.getTime(),
        p_error_message: error
      })
    }

    const completedAt = new Date()
    const totalExecutionTime = completedAt.getTime() - startedAt.getTime()

    const response: CleanupResponse = {
      success: !error,
      job_type: jobType,
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
      total_execution_time_ms: totalExecutionTime,
      results,
      total_records_affected: totalRecordsAffected,
      ...(error && { error })
    }

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: error ? 500 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (err) {
    console.error('Cleanup function error:', err)

    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
