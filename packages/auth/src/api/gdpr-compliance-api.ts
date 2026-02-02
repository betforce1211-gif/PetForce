/**
 * GDPR Compliance API for Household Management
 * Implements data export and right to erasure (hard delete)
 */

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

/**
 * Export all household data for a user (GDPR Article 15 - Right to Access)
 */
interface HouseholdExportData {
  export_date: string;
  user_id: string;
  households_led: unknown[];
  memberships: unknown[];
  join_requests: unknown[];
  activity_history: unknown[];
  privacy_notice: string;
}

export async function exportUserHouseholdData(userId: string): Promise<{
  success: boolean;
  data?: HouseholdExportData;
  error?: string;
}> {
  const correlationId = logger.generateRequestId();

  try {
    logger.info('Exporting household data for user', { userId, correlationId });

    // Gather all user's household data
    const [households, memberships, joinRequests, events] = await Promise.all([
      // Households where user is leader
      supabase
        .from('households')
        .select('*')
        .eq('leader_id', userId),

      // User's household memberships
      supabase
        .from('household_members')
        .select('*, household:households(*)')
        .eq('user_id', userId),

      // User's join requests
      supabase
        .from('household_join_requests')
        .select('*, household:households(name)')
        .eq('user_id', userId),

      // User's household events
      supabase
        .from('household_events')
        .select('*')
        .eq('user_id', userId)
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      user_id: userId,
      households_led: households.data || [],
      memberships: memberships.data || [],
      join_requests: joinRequests.data || [],
      activity_history: events.data || [],
      privacy_notice: 'This data export includes all household-related information associated with your account.',
    };

    logger.info('Household data export complete', {
      userId,
      correlationId,
      recordCount: Object.values(exportData).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
    });

    return { success: true, data: exportData };
  } catch (error) {
    logger.error('Failed to export household data', { error, userId, correlationId });
    return { success: false, error: 'Failed to export data' };
  }
}

/**
 * Hard delete user's household data (GDPR Article 17 - Right to Erasure)
 * WARNING: This permanently deletes data and cannot be undone
 */
export async function deleteUserHouseholdData(
  userId: string,
  confirmationToken: string
): Promise<{ success: boolean; error?: string }> {
  const correlationId = logger.generateRequestId();

  try {
    logger.securityEvent('GDPR hard delete requested', { userId, correlationId });

    // Verify confirmation token (must be generated separately)
    const isValid = await verifyDeletionToken(userId, confirmationToken);
    if (!isValid) {
      logger.securityEvent('Invalid deletion token', { userId, correlationId });
      return { success: false, error: 'Invalid confirmation token' };
    }

    // Check if user is leader of any households
    const { data: ledHouseholds } = await supabase
      .from('households')
      .select('id, name')
      .eq('leader_id', userId);

    if (ledHouseholds && ledHouseholds.length > 0) {
      logger.securityEvent('Cannot delete - user is household leader', {
        userId,
        households: ledHouseholds.map(h => h.id),
        correlationId
      });
      return {
        success: false,
        error: 'Cannot delete data while you are a household leader. Transfer or delete households first.'
      };
    }

    // Begin hard delete (cascade will handle related records)
    const deletions = await Promise.all([
      // Delete memberships (soft deletes → hard deletes)
      supabase
        .from('household_members')
        .delete()
        .eq('user_id', userId),

      // Delete join requests
      supabase
        .from('household_join_requests')
        .delete()
        .eq('user_id', userId),

      // Anonymize events (keep for analytics but remove PII)
      supabase
        .from('household_events')
        .update({ user_id: null, metadata: { anonymized: true } })
        .eq('user_id', userId),
    ]);

    const errors = deletions.filter(d => d.error);
    if (errors.length > 0) {
      logger.error('Hard delete failed', { errors, userId, correlationId });
      return { success: false, error: 'Deletion failed. Please contact support.' };
    }

    logger.securityEvent('GDPR hard delete completed', { userId, correlationId });

    return { success: true };
  } catch (error) {
    logger.error('Hard delete error', { error, userId, correlationId });
    return { success: false, error: 'Deletion failed' };
  }
}

async function verifyDeletionToken(userId: string, token: string): Promise<boolean> {
  // In production: verify JWT token or database-stored confirmation token
  // For now: placeholder
  return token.length > 10;
}
