"""
Airflow DAG: Household Management System - Daily ETL
Author: Buck (Data Engineering Agent)
Schedule: Daily at 2 AM UTC
Purpose: Extract, transform, load household analytics data
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.operators.bash import BashOperator
from airflow.utils.task_group import TaskGroup
from datetime import datetime, timedelta
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Default args for all tasks
default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'email': ['data@petforce.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=1),
}

# Initialize DAG
dag = DAG(
    'household_daily_etl',
    default_args=default_args,
    description='Daily ETL pipeline for household management analytics',
    schedule_interval='0 2 * * *',  # 2 AM UTC daily
    start_date=datetime(2026, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=['household', 'analytics', 'etl', 'daily'],
)

# ============================================================================
# TASK DEFINITIONS
# ============================================================================

def extract_households_task(**context):
    """Extract households from source database"""
    from data.pipelines.household_etl import HouseholdETL
    import os

    source_conn = os.getenv('SOURCE_DATABASE_URL')
    target_conn = os.getenv('TARGET_DATABASE_URL')

    etl = HouseholdETL(source_conn, target_conn)
    execution_date = context['execution_date']

    try:
        households = etl.extract_households(execution_date)
        logger.info(f"Extracted {len(households)} households")
        context['ti'].xcom_push(key='household_count', value=len(households))
    finally:
        etl.close()


def extract_users_task(**context):
    """Extract users from source database"""
    from data.pipelines.household_etl import HouseholdETL
    import os

    source_conn = os.getenv('SOURCE_DATABASE_URL')
    target_conn = os.getenv('TARGET_DATABASE_URL')

    etl = HouseholdETL(source_conn, target_conn)
    execution_date = context['execution_date']

    try:
        users = etl.extract_users(execution_date)
        logger.info(f"Extracted {len(users)} users")
        context['ti'].xcom_push(key='user_count', value=len(users))
    finally:
        etl.close()


def transform_load_task(**context):
    """Transform and load data to warehouse"""
    from data.pipelines.household_etl import HouseholdETL
    import os

    source_conn = os.getenv('SOURCE_DATABASE_URL')
    target_conn = os.getenv('TARGET_DATABASE_URL')

    etl = HouseholdETL(source_conn, target_conn)
    execution_date = context['execution_date']

    try:
        # Run full ETL
        etl.run_daily_etl(execution_date.date())
        logger.info("ETL completed successfully")
    finally:
        etl.close()


def send_datadog_metrics(**context):
    """Send ETL metrics to Datadog"""
    try:
        from datadog import api, initialize
        import os

        initialize(
            api_key=os.getenv('DATADOG_API_KEY'),
            app_key=os.getenv('DATADOG_APP_KEY')
        )

        # Get metrics from XCom
        ti = context['ti']
        household_count = ti.xcom_pull(key='household_count', task_ids='extract_households') or 0
        user_count = ti.xcom_pull(key='user_count', task_ids='extract_users') or 0

        # Send metrics
        api.Metric.send(
            metric='household.etl.households_processed',
            points=household_count,
            tags=['pipeline:daily_etl', 'env:production']
        )

        api.Metric.send(
            metric='household.etl.users_processed',
            points=user_count,
            tags=['pipeline:daily_etl', 'env:production']
        )

        logger.info(f"Sent metrics to Datadog: {household_count} households, {user_count} users")
    except ImportError:
        logger.warning("Datadog library not installed, skipping metrics")
    except Exception as e:
        logger.error(f"Failed to send Datadog metrics: {e}")


def send_slack_notification(**context):
    """Send Slack notification about ETL completion"""
    try:
        import requests
        import os

        webhook_url = os.getenv('SLACK_WEBHOOK_URL')
        if not webhook_url:
            logger.warning("SLACK_WEBHOOK_URL not set, skipping notification")
            return

        ti = context['ti']
        household_count = ti.xcom_pull(key='household_count', task_ids='extract_households') or 0
        user_count = ti.xcom_pull(key='user_count', task_ids='extract_users') or 0
        execution_date = context['execution_date']

        message = {
            "text": f"✅ Household ETL completed successfully",
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Household Daily ETL - Complete*\n"
                                f"Execution Date: {execution_date.strftime('%Y-%m-%d')}\n"
                                f"• Households processed: {household_count}\n"
                                f"• Users processed: {user_count}"
                    }
                }
            ]
        }

        response = requests.post(webhook_url, json=message)
        response.raise_for_status()
        logger.info("Slack notification sent")
    except Exception as e:
        logger.error(f"Failed to send Slack notification: {e}")


# ============================================================================
# TASK GROUPS
# ============================================================================

with TaskGroup('extract', tooltip='Extract data from source', dag=dag) as extract_group:
    extract_households = PythonOperator(
        task_id='extract_households',
        python_callable=extract_households_task,
        provide_context=True,
    )

    extract_users = PythonOperator(
        task_id='extract_users',
        python_callable=extract_users_task,
        provide_context=True,
    )

    # Extract tasks can run in parallel
    [extract_households, extract_users]


# Transform and load (depends on extract)
transform_load = PythonOperator(
    task_id='transform_load',
    python_callable=transform_load_task,
    provide_context=True,
    dag=dag,
)

# Run dbt models
run_dbt_staging = BashOperator(
    task_id='run_dbt_staging',
    bash_command='cd /opt/dbt && dbt run --models staging.*',
    dag=dag,
)

run_dbt_intermediate = BashOperator(
    task_id='run_dbt_intermediate',
    bash_command='cd /opt/dbt && dbt run --models intermediate.*',
    dag=dag,
)

run_dbt_marts = BashOperator(
    task_id='run_dbt_marts',
    bash_command='cd /opt/dbt && dbt run --models marts.household_metrics',
    dag=dag,
)

# Data quality checks
quality_checks = PostgresOperator(
    task_id='quality_checks',
    postgres_conn_id='warehouse',
    sql='data/quality/household_checks.sql',
    dag=dag,
)

# dbt tests
run_dbt_tests = BashOperator(
    task_id='run_dbt_tests',
    bash_command='cd /opt/dbt && dbt test --models marts.household_metrics',
    dag=dag,
)

# Refresh materialized views
refresh_views = PostgresOperator(
    task_id='refresh_materialized_views',
    postgres_conn_id='warehouse',
    sql='SELECT refresh_household_analytics();',
    dag=dag,
)

# Send metrics and notifications
send_metrics = PythonOperator(
    task_id='send_datadog_metrics',
    python_callable=send_datadog_metrics,
    provide_context=True,
    dag=dag,
)

send_notification = PythonOperator(
    task_id='send_slack_notification',
    python_callable=send_slack_notification,
    provide_context=True,
    trigger_rule='all_done',  # Run even if upstream tasks fail
    dag=dag,
)

# ============================================================================
# TASK DEPENDENCIES
# ============================================================================

# Define the pipeline flow
extract_group >> transform_load >> run_dbt_staging >> run_dbt_intermediate >> run_dbt_marts
run_dbt_marts >> quality_checks >> run_dbt_tests >> refresh_views
refresh_views >> send_metrics >> send_notification

# ============================================================================
# DAG DOCUMENTATION
# ============================================================================

dag.doc_md = """
# Household Management System - Daily ETL

This DAG runs daily at 2 AM UTC to extract, transform, and load household analytics data.

## Pipeline Stages

1. **Extract**: Pull data from application database
   - Households
   - Users
   - Join requests
   - Member activity

2. **Transform & Load**: Process and load to warehouse
   - Apply SCD Type 2 logic for households
   - Calculate metrics and aggregations
   - Load fact and dimension tables

3. **dbt Models**: Transform data using dbt
   - Staging models (raw data cleaning)
   - Intermediate models (business logic)
   - Mart models (dashboard-ready)

4. **Quality Checks**: Validate data integrity
   - Referential integrity
   - Business logic validation
   - Completeness checks

5. **Refresh Views**: Update materialized views
   - Current household state
   - User household summary

6. **Monitoring**: Send metrics and notifications
   - Datadog metrics
   - Slack notifications

## Monitoring

- Check Airflow UI for task status
- Review Datadog dashboard for ETL metrics
- Check Slack for completion notifications

## Troubleshooting

If the DAG fails:
1. Check Airflow logs for specific task
2. Verify database connectivity
3. Check data quality report
4. Review Sentry for application errors
5. Consult runbook: docs/data/etl-troubleshooting.md

## SLA

- Pipeline should complete within 1 hour
- Data should be available by 3 AM UTC
- Critical failures trigger PagerDuty alerts
"""
