# Capability: Data Engineering

## ADDED Requirements

### Requirement: Design and Build Data Pipelines
The system SHALL design idempotent data pipelines with incremental processing and proper error handling.

#### Scenario: Design new data pipeline
- **GIVEN** a requirement to process data from source to destination
- **WHEN** designing the pipeline
- **THEN** the pipeline SHALL be idempotent (safe to re-run)
- **AND** the pipeline SHALL implement incremental processing where possible
- **AND** the pipeline SHALL follow staging pattern (raw → staging → mart)
- **AND** the pipeline SHALL have defined schedule and SLA

#### Scenario: Handle pipeline failures
- **GIVEN** a data pipeline encountering an error
- **WHEN** the error occurs
- **THEN** the pipeline SHALL log detailed error information
- **AND** the pipeline SHALL alert appropriate stakeholders
- **AND** the pipeline SHALL be recoverable without data loss
- **AND** the pipeline SHALL document recovery procedures

### Requirement: Create Data Quality Tests
The system SHALL implement data quality tests for every data model to ensure accuracy and completeness.

#### Scenario: Add data quality tests to model
- **GIVEN** a new data model or table
- **WHEN** creating the model
- **THEN** tests SHALL verify row count expectations
- **AND** tests SHALL check for null values in required columns
- **AND** tests SHALL validate foreign key relationships
- **AND** tests SHALL check for duplicate records where inappropriate
- **AND** tests SHALL run automatically on every pipeline execution

#### Scenario: Alert on data quality failure
- **GIVEN** a data quality test failure
- **WHEN** the failure is detected
- **THEN** the pipeline SHALL stop processing downstream dependencies
- **AND** the pipeline SHALL alert data team immediately
- **AND** the alert SHALL include specific test that failed and sample records
- **AND** the failure SHALL be tracked in monitoring dashboard

### Requirement: Design Optimized Data Models
The system SHALL design data models following dimensional modeling principles with appropriate partitioning and indexing.

#### Scenario: Create data mart
- **GIVEN** business requirements for analytics
- **WHEN** designing the data mart
- **THEN** the mart SHALL define clear grain (one row represents what?)
- **AND** the mart SHALL use consistent naming conventions
- **AND** the mart SHALL document all column descriptions and business logic
- **AND** the mart SHALL be optimized for analytics queries from analytics capability
- **AND** the mart SHALL use appropriate partitioning for large tables

#### Scenario: Optimize query performance
- **GIVEN** slow-running queries on a data model
- **WHEN** optimizing the model
- **THEN** appropriate indexes SHALL be created
- **AND** materialized views SHALL be considered for complex aggregations
- **AND** clustering keys SHALL be evaluated for query patterns
- **AND** query performance SHALL be measured before and after

### Requirement: Document Data Lineage and Definitions
The system SHALL document data lineage, column definitions, and business logic for all data models.

#### Scenario: Document new data model
- **GIVEN** a new data model created
- **WHEN** documenting the model
- **THEN** each column SHALL have a clear business definition
- **AND** source tables and transformations SHALL be documented
- **AND** data freshness SLA SHALL be documented
- **AND** model ownership SHALL be assigned

#### Scenario: Track data lineage
- **GIVEN** any data mart or report
- **WHEN** tracing data sources
- **THEN** lineage SHALL show all upstream source tables
- **AND** lineage SHALL document all transformations applied
- **AND** lineage SHALL identify dependencies between models
- **AND** lineage SHALL be queryable for impact analysis

### Requirement: Monitor Pipeline Health and Freshness
The system SHALL monitor data pipeline execution, freshness, and row counts.

#### Scenario: Monitor pipeline freshness
- **GIVEN** a data pipeline with defined freshness SLA
- **WHEN** pipeline execution completes
- **THEN** freshness SHALL be tracked (time since last successful run)
- **AND** alerts SHALL trigger if freshness SLA is breached
- **AND** freshness metrics SHALL be visible in dashboard
- **AND** freshness trends SHALL be tracked over time

#### Scenario: Track row count anomalies
- **GIVEN** historical row count data for a table
- **WHEN** new pipeline execution completes
- **THEN** row count SHALL be compared to historical patterns
- **AND** significant anomalies SHALL trigger alerts
- **AND** row count trends SHALL be visualized
- **AND** zero or negative growth SHALL be investigated

### Requirement: Collaborate with Analytics and Infrastructure
The system SHALL design data models optimized for analytics use cases and work with infrastructure on warehouse configuration.

#### Scenario: Design mart for analytics dashboard
- **GIVEN** analytics requesting new dashboard
- **WHEN** designing supporting data mart
- **THEN** the mart SHALL be optimized for dashboard query patterns
- **AND** the mart SHALL provide pre-aggregated data where appropriate
- **AND** the mart SHALL support required filters and dimensions
- **AND** schema changes SHALL be coordinated with analytics

#### Scenario: Request warehouse resources from infrastructure
- **GIVEN** pipeline requiring compute or storage resources
- **WHEN** requesting infrastructure support
- **THEN** requirements SHALL specify compute size needed
- **AND** requirements SHALL specify storage and retention needs
- **AND** requirements SHALL justify resource requests with data volumes
- **AND** cost implications SHALL be considered
