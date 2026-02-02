"""
Household Management System - ETL Pipeline
Extracts data from application database, transforms, loads to warehouse

Author: Buck (Data Engineering Agent)
Purpose: Daily ETL for household analytics
"""

import psycopg2
from psycopg2.extras import execute_batch
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class HouseholdETL:
    """ETL pipeline for household analytics data"""

    def __init__(self, source_conn_string: str, target_conn_string: str):
        """
        Initialize ETL pipeline

        Args:
            source_conn_string: Connection string for source (application) database
            target_conn_string: Connection string for target (warehouse) database
        """
        self.source_conn = psycopg2.connect(source_conn_string)
        self.target_conn = psycopg2.connect(target_conn_string)
        logger.info("ETL pipeline initialized")

    def close(self):
        """Close database connections"""
        if self.source_conn:
            self.source_conn.close()
        if self.target_conn:
            self.target_conn.close()
        logger.info("Database connections closed")

    # ========================================================================
    # EXTRACT METHODS
    # ========================================================================

    def extract_households(self, from_date: datetime) -> List[Dict[str, Any]]:
        """
        Extract households from source database

        Args:
            from_date: Extract households updated since this date

        Returns:
            List of household dictionaries
        """
        query = """
            SELECT
                id,
                name,
                description,
                invite_code,
                leader_id,
                created_at,
                updated_at
            FROM households
            WHERE updated_at >= %s OR created_at >= %s
            ORDER BY created_at
        """

        with self.source_conn.cursor() as cursor:
            cursor.execute(query, (from_date, from_date))
            columns = [desc[0] for desc in cursor.description]
            households = [dict(zip(columns, row)) for row in cursor.fetchall()]

        logger.info(f"Extracted {len(households)} households")
        return households

    def extract_users(self, from_date: datetime) -> List[Dict[str, Any]]:
        """Extract users from source database"""
        query = """
            SELECT
                id,
                email,
                created_at,
                last_sign_in_at
            FROM auth.users
            WHERE created_at >= %s OR last_sign_in_at >= %s
            ORDER BY created_at
        """

        with self.source_conn.cursor() as cursor:
            cursor.execute(query, (from_date, from_date))
            columns = [desc[0] for desc in cursor.description]
            users = [dict(zip(columns, row)) for row in cursor.fetchall()]

        logger.info(f"Extracted {len(users)} users")
        return users

    def extract_household_events(self, from_date: datetime) -> List[Dict[str, Any]]:
        """
        Extract household events from application logs

        Note: This assumes events are logged to a table. Adjust based on actual implementation.
        """
        query = """
            SELECT
                event_type,
                household_id,
                user_id,
                event_timestamp,
                metadata
            FROM household_events
            WHERE event_timestamp >= %s
            ORDER BY event_timestamp
        """

        with self.source_conn.cursor() as cursor:
            try:
                cursor.execute(query, (from_date,))
                columns = [desc[0] for desc in cursor.description]
                events = [dict(zip(columns, row)) for row in cursor.fetchall()]
                logger.info(f"Extracted {len(events)} events")
                return events
            except psycopg2.Error as e:
                logger.warning(f"household_events table not found: {e}")
                return []

    def extract_join_requests(self, from_date: datetime) -> List[Dict[str, Any]]:
        """Extract join requests"""
        query = """
            SELECT
                id,
                household_id,
                user_id,
                status,
                requested_at,
                responded_at,
                responded_by
            FROM household_join_requests
            WHERE requested_at >= %s OR responded_at >= %s
            ORDER BY requested_at
        """

        with self.source_conn.cursor() as cursor:
            cursor.execute(query, (from_date, from_date))
            columns = [desc[0] for desc in cursor.description]
            requests = [dict(zip(columns, row)) for row in cursor.fetchall()]

        logger.info(f"Extracted {len(requests)} join requests")
        return requests

    def extract_members(self, from_date: datetime) -> List[Dict[str, Any]]:
        """Extract household members"""
        query = """
            SELECT
                household_id,
                user_id,
                role,
                joined_at,
                status,
                is_temporary
            FROM household_members
            WHERE joined_at >= %s
            ORDER BY joined_at
        """

        with self.source_conn.cursor() as cursor:
            cursor.execute(query, (from_date,))
            columns = [desc[0] for desc in cursor.description]
            members = [dict(zip(columns, row)) for row in cursor.fetchall()]

        logger.info(f"Extracted {len(members)} members")
        return members

    # ========================================================================
    # TRANSFORM METHODS
    # ========================================================================

    def transform_households(self, households: List[Dict]) -> List[Dict]:
        """Transform household data for warehouse"""
        transformed = []

        for h in households:
            transformed.append({
                'household_id': h['id'],
                'household_name': h['name'],
                'household_description': h.get('description'),
                'invite_code_format': self._extract_code_format(h.get('invite_code', '')),
                'leader_id': h['leader_id'],
                'created_at': h['created_at'],
                'updated_at': h.get('updated_at'),
                'scd_start_date': datetime.now().date(),
                'is_current': True
            })

        logger.info(f"Transformed {len(transformed)} households")
        return transformed

    def transform_users(self, users: List[Dict]) -> List[Dict]:
        """Transform user data for warehouse"""
        transformed = []

        for u in users:
            transformed.append({
                'user_id': u['id'],
                'user_email': u['email'],
                'created_at': u['created_at'],
                'last_active_at': u.get('last_sign_in_at')
            })

        logger.info(f"Transformed {len(transformed)} users")
        return transformed

    def _extract_code_format(self, invite_code: str) -> str:
        """Extract format pattern from invite code"""
        if not invite_code:
            return 'UNKNOWN'

        parts = invite_code.split('-')
        if len(parts) == 3:
            return f"{parts[0]}-WORD-WORD"
        elif len(parts) == 2:
            return "PREFIX-WORD"
        else:
            return "CUSTOM"

    # ========================================================================
    # LOAD METHODS
    # ========================================================================

    def load_households(self, households: List[Dict]):
        """
        Load households to dimension table (SCD Type 2)

        This implements Slowly Changing Dimension Type 2:
        - New records get a new row
        - Old records are closed (is_current = false, scd_end_date set)
        """
        with self.target_conn.cursor() as cursor:
            for h in households:
                # Check if household exists and is current
                cursor.execute(
                    """SELECT household_key, household_name, leader_id
                       FROM dim_household
                       WHERE household_id = %s AND is_current = true""",
                    (h['household_id'],)
                )
                existing = cursor.fetchone()

                # Check if data has changed (trigger new SCD version)
                if existing:
                    existing_key, existing_name, existing_leader = existing
                    data_changed = (
                        h['household_name'] != existing_name or
                        h['leader_id'] != existing_leader
                    )

                    if data_changed:
                        # Close old record
                        cursor.execute(
                            """UPDATE dim_household
                               SET is_current = false, scd_end_date = %s
                               WHERE household_key = %s""",
                            (datetime.now().date(), existing_key)
                        )
                        logger.info(f"Closed old household record (key={existing_key})")

                        # Insert new record
                        cursor.execute(
                            """INSERT INTO dim_household
                               (household_id, household_name, household_description,
                                invite_code_format, leader_id, created_at, updated_at,
                                scd_start_date, is_current)
                               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                            (h['household_id'], h['household_name'], h['household_description'],
                             h['invite_code_format'], h['leader_id'], h['created_at'],
                             h['updated_at'], h['scd_start_date'], h['is_current'])
                        )
                        logger.info(f"Inserted new household version (id={h['household_id']})")
                else:
                    # Insert new household
                    cursor.execute(
                        """INSERT INTO dim_household
                           (household_id, household_name, household_description,
                            invite_code_format, leader_id, created_at, updated_at,
                            scd_start_date, is_current)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                        (h['household_id'], h['household_name'], h['household_description'],
                         h['invite_code_format'], h['leader_id'], h['created_at'],
                         h['updated_at'], h['scd_start_date'], h['is_current'])
                    )
                    logger.info(f"Inserted new household (id={h['household_id']})")

        self.target_conn.commit()
        logger.info(f"Loaded {len(households)} households to warehouse")

    def load_users(self, users: List[Dict]):
        """Load users to dimension table (SCD Type 1 - overwrite)"""
        with self.target_conn.cursor() as cursor:
            for u in users:
                cursor.execute(
                    """INSERT INTO dim_user
                       (user_id, user_email, created_at, last_active_at)
                       VALUES (%s, %s, %s, %s)
                       ON CONFLICT (user_id) DO UPDATE SET
                       user_email = EXCLUDED.user_email,
                       last_active_at = EXCLUDED.last_active_at""",
                    (u['user_id'], u['user_email'], u['created_at'], u['last_active_at'])
                )

        self.target_conn.commit()
        logger.info(f"Loaded {len(users)} users to warehouse")

    def load_events(self, events: List[Dict]):
        """Load events to fact table"""
        if not events:
            logger.info("No events to load")
            return

        with self.target_conn.cursor() as cursor:
            for e in events:
                # Get foreign keys
                household_key = self._get_household_key(e['household_id'])
                user_key = self._get_user_key(e['user_id'])
                date_key = self._get_date_key(e['event_timestamp'].date())

                cursor.execute(
                    """INSERT INTO fact_household_events
                       (event_type, household_key, user_key, date_key,
                        event_timestamp, event_metadata)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (e['event_type'], household_key, user_key, date_key,
                     e['event_timestamp'], e.get('metadata'))
                )

        self.target_conn.commit()
        logger.info(f"Loaded {len(events)} events to warehouse")

    def load_join_requests(self, requests: List[Dict]):
        """Load join requests to fact table"""
        with self.target_conn.cursor() as cursor:
            for r in requests:
                household_key = self._get_household_key(r['household_id'])
                requester_key = self._get_user_key(r['user_id'])
                responder_key = self._get_user_key(r['responded_by']) if r.get('responded_by') else None
                requested_date_key = self._get_date_key(r['requested_at'].date())
                responded_date_key = self._get_date_key(r['responded_at'].date()) if r.get('responded_at') else None

                # Calculate time to respond
                time_to_respond_hours = None
                if r.get('responded_at'):
                    delta = r['responded_at'] - r['requested_at']
                    time_to_respond_hours = delta.total_seconds() / 3600

                cursor.execute(
                    """INSERT INTO fact_join_requests
                       (household_key, requester_key, responder_key,
                        requested_date_key, responded_date_key,
                        requested_at, responded_at, status, time_to_respond_hours)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                       ON CONFLICT DO NOTHING""",
                    (household_key, requester_key, responder_key,
                     requested_date_key, responded_date_key,
                     r['requested_at'], r.get('responded_at'),
                     r['status'], time_to_respond_hours)
                )

        self.target_conn.commit()
        logger.info(f"Loaded {len(requests)} join requests to warehouse")

    # ========================================================================
    # AGGREGATION METHODS
    # ========================================================================

    def aggregate_daily_metrics(self, target_date: datetime.date):
        """
        Aggregate household metrics for a specific date

        This pre-computes common metrics for fast dashboard queries
        """
        with self.target_conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO agg_household_metrics_daily
                (household_key, date_key, active_member_count, join_requests_submitted,
                 join_requests_approved, join_requests_rejected, total_events)
                SELECT
                    h.household_key,
                    d.date_id,
                    COUNT(DISTINCT ma.user_key) FILTER (WHERE ma.is_active = TRUE) AS active_member_count,
                    COUNT(jr.request_id) FILTER (WHERE jr.status = 'pending') AS join_requests_submitted,
                    COUNT(jr.request_id) FILTER (WHERE jr.status = 'approved' AND DATE(jr.responded_at) = %s) AS join_requests_approved,
                    COUNT(jr.request_id) FILTER (WHERE jr.status = 'rejected' AND DATE(jr.responded_at) = %s) AS join_requests_rejected,
                    COUNT(e.event_id) AS total_events
                FROM dim_household h
                CROSS JOIN dim_date d
                LEFT JOIN fact_member_activity ma ON h.household_key = ma.household_key AND ma.date_key = d.date_id
                LEFT JOIN fact_join_requests jr ON h.household_key = jr.household_key
                LEFT JOIN fact_household_events e ON h.household_key = e.household_key AND e.date_key = d.date_id
                WHERE d.date = %s AND h.is_current = TRUE
                GROUP BY h.household_key, d.date_id
                ON CONFLICT (household_key, date_key) DO UPDATE SET
                    active_member_count = EXCLUDED.active_member_count,
                    join_requests_submitted = EXCLUDED.join_requests_submitted,
                    join_requests_approved = EXCLUDED.join_requests_approved,
                    join_requests_rejected = EXCLUDED.join_requests_rejected,
                    total_events = EXCLUDED.total_events
                """,
                (target_date, target_date, target_date)
            )

        self.target_conn.commit()
        logger.info(f"Aggregated daily metrics for {target_date}")

    # ========================================================================
    # HELPER METHODS
    # ========================================================================

    def _get_household_key(self, household_id: str) -> Optional[int]:
        """Get household surrogate key from warehouse"""
        with self.target_conn.cursor() as cursor:
            cursor.execute(
                "SELECT household_key FROM dim_household WHERE household_id = %s AND is_current = TRUE",
                (household_id,)
            )
            result = cursor.fetchone()
            return result[0] if result else None

    def _get_user_key(self, user_id: str) -> Optional[int]:
        """Get user surrogate key from warehouse"""
        if not user_id:
            return None

        with self.target_conn.cursor() as cursor:
            cursor.execute(
                "SELECT user_key FROM dim_user WHERE user_id = %s",
                (user_id,)
            )
            result = cursor.fetchone()
            return result[0] if result else None

    def _get_date_key(self, date: datetime.date) -> int:
        """Get date surrogate key from warehouse"""
        return int(date.strftime('%Y%m%d'))

    # ========================================================================
    # MAIN ETL ORCHESTRATION
    # ========================================================================

    def run_daily_etl(self, target_date: Optional[datetime.date] = None):
        """
        Run full daily ETL process

        Args:
            target_date: Date to process (defaults to yesterday)
        """
        if target_date is None:
            target_date = datetime.now().date() - timedelta(days=1)

        from_datetime = datetime.combine(target_date, datetime.min.time())

        logger.info(f"Starting ETL for {target_date}")

        try:
            # Extract
            logger.info("=== EXTRACT PHASE ===")
            households = self.extract_households(from_datetime)
            users = self.extract_users(from_datetime)
            events = self.extract_household_events(from_datetime)
            join_requests = self.extract_join_requests(from_datetime)

            # Transform
            logger.info("=== TRANSFORM PHASE ===")
            households_transformed = self.transform_households(households)
            users_transformed = self.transform_users(users)

            # Load
            logger.info("=== LOAD PHASE ===")
            self.load_users(users_transformed)  # Load users first (foreign key dependency)
            self.load_households(households_transformed)
            self.load_events(events)
            self.load_join_requests(join_requests)

            # Aggregate
            logger.info("=== AGGREGATE PHASE ===")
            self.aggregate_daily_metrics(target_date)

            # Refresh materialized views
            logger.info("=== REFRESH VIEWS ===")
            with self.target_conn.cursor() as cursor:
                cursor.execute("SELECT refresh_household_analytics()")
            self.target_conn.commit()

            logger.info(f"ETL completed successfully for {target_date}")

        except Exception as e:
            logger.error(f"ETL failed: {e}", exc_info=True)
            self.target_conn.rollback()
            raise


def main():
    """Main entry point for ETL script"""
    import os

    # Get connection strings from environment
    source_conn = os.getenv('SOURCE_DATABASE_URL')
    target_conn = os.getenv('TARGET_DATABASE_URL')

    if not source_conn or not target_conn:
        logger.error("DATABASE_URL environment variables not set")
        sys.exit(1)

    etl = HouseholdETL(source_conn, target_conn)

    try:
        etl.run_daily_etl()
    finally:
        etl.close()


if __name__ == '__main__':
    main()
