# Capability: Product Management

## ADDED Requirements

### Requirement: Multi-Source Requirements Intake
The system SHALL accept and process product requirements from multiple sources including sales, customers, support, developers, customer success, and internal stakeholders.

#### Scenario: Process customer success insights from Casey
- **GIVEN** Casey has identified a customer insight (feature request, product gap, or improvement)
- **WHEN** Casey submits the insight via `peter intake customer-success "<insight>"`
- **THEN** Peter SHALL log the request with a unique ID (CS-XXX format)
- **AND** Peter SHALL capture: insight description, affected customers (count and ARR), customer health context (Green/Yellow/Red distribution), supporting data (ticket count, usage patterns), and Casey's priority recommendation
- **AND** Peter SHALL acknowledge receipt within 48 hours
- **AND** Peter SHALL provide decision timeline

#### Scenario: Incorporate customer health in prioritization
- **GIVEN** Peter is using RICE framework to prioritize a feature
- **WHEN** the feature affects customers tracked by Casey
- **THEN** Peter SHALL request customer impact data from Casey
- **AND** Peter SHALL incorporate Casey's data into RICE scores:
  - **Reach**: Customer count from Casey's analysis
  - **Impact**: Customer health urgency (Red customers = 3, Yellow = 2, Green = 1)
  - **Confidence**: Casey's confidence level based on data quality (high data = 100%, medium = 80%, low = 50%)
- **AND** the final RICE score SHALL reflect customer success inputs

#### Scenario: Weekly customer success sync
- **GIVEN** the end of each week
- **WHEN** Peter conducts weekly planning
- **THEN** Peter SHALL receive Casey's weekly customer health report before the meeting
- **AND** the report SHALL include: top customer issues, feature requests with context, churn risks, and recommended priorities
- **AND** Peter SHALL consider these inputs in sprint/iteration planning
- **AND** Peter SHALL communicate decisions back to Casey for customer follow-up

## ADDED Requirements

### Requirement: Customer Success Review in Prioritization Framework
The system SHALL incorporate customer success metrics and signals into the prioritization framework to balance new features with customer retention.

#### Scenario: Prioritize customer retention vs new features
- **GIVEN** Peter has features in the backlog serving both new customer acquisition and existing customer retention
- **WHEN** Peter prioritizes using RICE
- **THEN** Peter SHALL consider customer health signals from Casey
- **AND** features addressing Red (at-risk) customers SHALL receive priority multiplier (1.5x)
- **AND** features addressing Yellow (at-risk) customers SHALL receive priority multiplier (1.2x)
- **AND** the prioritization SHALL balance growth with retention

#### Scenario: Escalate urgent customer retention issue
- **GIVEN** Casey has identified a critical churn risk (Red health score customer with high ARR)
- **WHEN** Casey escalates with "urgent" flag
- **THEN** Peter SHALL review within 24 hours
- **AND** Peter SHALL assess whether this requires immediate product action (hotfix, workaround, or escalation to engineering)
- **AND** Peter SHALL coordinate with Casey on customer communication regarding response plan

#### Scenario: Track customer-driven feature outcomes
- **GIVEN** a feature was prioritized based on Casey's customer insights
- **WHEN** the feature is shipped
- **THEN** Peter SHALL work with Casey to measure outcomes: affected customer adoption rate, customer health score changes, support ticket reduction, and satisfaction improvement (NPS/CSAT)
- **AND** these outcomes SHALL inform future prioritization decisions
- **AND** Peter SHALL close the loop by communicating results to Casey
