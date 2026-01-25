# Project Context

## Purpose

PetForce is a comprehensive pet care platform built on a foundational philosophy: **pets are part of the family, so let's take care of them as simply as we can.**

Every decision, feature, and design choice should embody this principle:
- **Family-First**: Treat pets with the same care, attention, and love as family members
- **Simplicity Above All**: Remove complexity, make pet care effortless and intuitive
- **Never Miss Anything**: Build systems that ensure pet health and happiness are never compromised

## Product Philosophy

### Core Principle
> "Pets are part of the family, so let's take care of them as simply as we can. We should think about this with every action we take."

This means:
1. **Simplicity in Every Interaction**: If a feature adds complexity to a pet owner's life, we've failed
2. **Family-Centric Design**: Features should strengthen the bond between pets and their families
3. **Reliability Over Features**: One reliable feature is better than ten flaky ones
4. **Proactive Care**: Anticipate pet needs before problems arise
5. **Accessible to All**: Pet care solutions should be affordable and accessible to every family

### Decision Framework

When evaluating any feature, design, or technical decision, ask:
1. **Does this make pet care simpler?** If it adds steps or complexity, reconsider
2. **Would I trust this for my own family member?** Quality and reliability are non-negotiable
3. **Can every pet owner use this?** Accessibility matters
4. **Does this prevent problems before they happen?** Proactive > reactive

## Tech Stack

*[To be defined as features are built]*

## Project Conventions

### Code Style

All code should reflect our product philosophy:
- **Clear over clever**: Readable code is maintainable code
- **Simple over complex**: Choose the straightforward solution
- **Safe by default**: Especially for pet health and safety features

### Architecture Patterns

*[To be defined based on chosen technologies]*

### Testing Strategy

**Quality is non-negotiable** when pets' wellbeing is at stake:
- Comprehensive test coverage for all pet-related features
- Security testing for data handling
- Performance testing to ensure reliability
- Refer to Tucker (QA) and Samantha (Security) checklists

### Git Workflow

Follow the Feature Development Process (FDP):
- All features progress through: Requirements → Design → Implementation → Review → Deployment → Monitoring
- All quality checklists must be completed and attached to release notes
- See `process/FEATURE-DEVELOPMENT-PROCESS.md` for details

## Domain Context

### Pet Care Industry
- Pet owners view their pets as family members, not property
- Pet care decisions are emotional and trust-based
- Simplicity and reliability build trust
- Pet health and safety are paramount concerns
- Pet owners value preventive care over reactive care

### User Personas
*[To be developed by Peter (Product Management)]*

### Terminology
- **Pet Parent**: Preferred term for pet owners (reflects family relationship)
- **Pet Family**: The household unit including pets
- **Care Routine**: Daily activities for pet wellbeing
- **Health Event**: Any significant health-related occurrence

## Important Constraints

### Non-Negotiable Quality Standards
1. **Pet Safety**: No feature ships if it could harm pets
2. **Data Privacy**: Pet health data is sensitive family information
3. **Reliability**: Features must work consistently; uptime is critical
4. **Simplicity**: If a feature requires extensive documentation, it needs redesign

### Feature Development Process
- All features must complete FDP with quality checklists
- Stage gates enforce quality standards
- Blocking checklists: Requirements, Testing, Security, Deployment
- See `process/FEATURE-DEVELOPMENT-PROCESS.md`

## External Dependencies

*[To be documented as integrations are added]*

## Team Structure

PetForce operates with 14 specialized agents working together:

**Product & Design**:
- Peter (Product Management) - Requirements and prioritization
- Dexter (UX Design) - User interface and experience
- Casey (Customer Success) - Customer health and retention

**Engineering**:
- Engrid (Software Engineering) - Core implementation
- Axel (API Design) - API architecture
- Maya (Mobile) - Mobile applications

**Data & Analytics**:
- Buck (Data Engineering) - Data pipelines
- Ana (Analytics) - Dashboards and insights

**Infrastructure & Operations**:
- Isabel (Infrastructure) - Cloud infrastructure
- Chuck (CI/CD) - Deployment automation
- Larry (Logging/Observability) - Monitoring and alerts

**Quality & Documentation**:
- Tucker (QA/Testing) - Testing and quality assurance
- Samantha (Security) - Security reviews
- Thomas (Documentation) - Technical documentation

All agents follow the Feature Development Process and complete quality checklists for their domains.
