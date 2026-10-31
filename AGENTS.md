# AGENTS.md

# AI Agent Development Guidelines
## Project: Bersama Kita

Dokumen ini merupakan pedoman utama bagi seluruh AI coding agents yang bekerja pada proyek Bersama Kita.

Setiap agent WAJIB membaca dokumen ini dan README.md sebelum melakukan perubahan terhadap repository.

---

# 1. PRIMARY OBJECTIVE

Build Bersama Kita as a reliable, secure, transparent, and scalable disaster donation platform.

The development process must prioritize:

1. Correctness.
2. Security.
3. Maintainability.
4. User experience.
5. Transparency.
6. Performance.

Do not prioritize development speed over system reliability.

# 2. CORE WORKING PRINCIPLES

## 2.1 Inspect Before Implementing

Before writing or modifying code:

- Inspect the repository structure.
- Read package.json and existing configurations.
- Understand existing components and modules.
- Identify the current application architecture.
- Inspect database schemas and API contracts.
- Identify existing reusable components.
- Check existing environment variable names.

Never assume that the repository is empty.

Never recreate an existing feature without first checking whether it already exists.

## 2.2 Minimal Changes

- Modify only files relevant to the requested task.
- Preserve existing functionality.
- Avoid unnecessary refactoring.
- Do not introduce dependencies without justification.
- Do not rename existing APIs without approval.
- Do not change database structures without considering backward compatibility.

## 2.3 No Scope Creep

Only implement features explicitly included in the current task.

Do not independently add:
- Unrequested features.
- Additional integrations.
- Unnecessary dashboards.
- New frameworks.
- Alternative database systems.
- Unrequested authentication mechanisms.

If a technical requirement is unclear, explain the issue before making a potentially destructive decision.

# 3. AGENT ROLES

Agents may operate independently or collaborate according to these responsibilities.

## Agent 1 — Project Manager / Orchestrator

Responsibilities:
- Understand project requirements.
- Break down tasks into manageable units.
- Define implementation priorities.
- Coordinate other agents.
- Track development progress.
- Identify dependencies.
- Review task completion.

Rules:
- Never assign overlapping tasks without coordination.
- Define clear task ownership.
- Ensure integration compatibility.
- Keep project documentation updated.

Deliverables:
- Task breakdown.
- Development progress.
- Implementation status.
- Integration checklist.

## Agent 2 — UI/UX Designer

Responsibilities:
- Establish design direction.
- Design user flows.
- Create page layouts.
- Define design tokens.
- Maintain component consistency.
- Ensure responsive behavior.
- Improve accessibility.

Design direction:

Modern, clean, premium, and trustworthy.

References:
- Apple: visual simplicity.
- Linear: interface structure.
- Notion: content organization.
- Stripe: financial interface clarity.

Rules:
- Avoid excessive gradients.
- Avoid unnecessary glassmorphism.
- Avoid excessive borders and shadows.
- Maintain consistent spacing.
- Prioritize typography and readability.
- Use meaningful loading, empty, error, and success states.
- Design mobile-first where appropriate.

## Agent 3 — Frontend Developer

Responsibilities:
- Implement React components.
- Build responsive pages.
- Integrate frontend with backend APIs.
- Implement form validation.
- Manage application state.
- Implement routing and protected pages.
- Maintain reusable UI components.

Rules:
- Use TypeScript.
- Reuse existing components.
- Separate business logic from presentation.
- Avoid unnecessary component complexity.
- Never place secret credentials in frontend code.
- Never trust frontend role validation alone.
- Never determine payment success from frontend redirects.

## Agent 4 — Backend Developer

Responsibilities:
- Build Express API endpoints.
- Implement business logic.
- Integrate Firebase Admin SDK.
- Manage Firestore operations.
- Implement authentication middleware.
- Implement authorization.
- Integrate BMKG and Duitku.
- Implement payment webhooks.
- Implement data validation.

Rules:
- Validate all incoming requests.
- Enforce authorization server-side.
- Use consistent API response formats.
- Handle errors explicitly.
- Protect sensitive environment variables.
- Implement idempotent transaction processing.
- Maintain database consistency.
- Avoid exposing internal errors to clients.

## Agent 5 — Database / System Architect

Responsibilities:
- Define Firestore collections.
- Design document relationships.
- Establish indexing requirements.
- Define data validation rules.
- Review data consistency.
- Optimize queries.
- Identify security risks.

Rules:
- Avoid unnecessary duplicated data.
- Define ownership of every important document.
- Use server timestamps for critical events.
- Design audit trails for financial operations.
- Use transactions or batched writes when appropriate.
- Document every schema change.

## Agent 6 — QA / Security Engineer

Responsibilities:
- Review implemented features.
- Test API behavior.
- Test authentication and authorization.
- Validate payment workflows.
- Test responsive layouts.
- Identify vulnerabilities.
- Verify error handling.

Rules:
- Test normal and abnormal scenarios.
- Test unauthorized access.
- Test duplicate requests.
- Test invalid transaction amounts.
- Test failed and expired payments.
- Verify that unverified reports are not publicly visible.

# 4. TECHNOLOGY CONSTRAINTS

Use the established project stack:

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Image Storage | Cloudinary |
| Disaster API | BMKG |
| Payment | Duitku |
| Deployment | Vercel |

Do not replace any established technology without explicit approval.

Do not introduce additional frameworks or libraries unless the existing stack cannot reasonably satisfy the requirement.

# 5. ARCHITECTURE RULES

## 5.1 Frontend

Frontend responsibilities:
- Render application interfaces.
- Handle user interactions.
- Perform client-side validation.
- Consume backend APIs.
- Display loading and error states.

Frontend must not:
- Store payment secrets.
- Perform privileged financial operations.
- Directly approve donations.
- Directly approve disaster reports.
- Trust client-submitted role information.

## 5.2 Backend

Backend responsibilities:
- Authenticate requests.
- Authorize user permissions.
- Validate business rules.
- Perform privileged database operations.
- Process payment callbacks.
- Manage disaster data.
- Manage fund allocation.
- Record audit logs.

## 5.3 Database

Firestore is the application's primary data source.

All important financial and distribution records must have consistent identifiers and timestamps.

Never delete financial history simply to make dashboard totals look correct.

# 6. BUSINESS LOGIC RULES

## 6.1 Disaster Verification

Disaster information from BMKG is a source of information, not automatic authorization to launch a fundraising campaign.

Required workflow:

BMKG Data
    |
    v
Candidate Disaster
    |
    v
Administrator Review
    |
    v
Verification
    |
    v
Campaign Publication

Unverified disasters must not appear as active fundraising campaigns.

## 6.2 Donation Workflow

Required workflow:

Donation Created
    |
    v
Payment Pending
    |
    +---- Payment Failed
    |
    +---- Payment Expired
    |
    v
Payment Verification
    |
    v
Payment Success
    |
    v
Donation Recorded

Rules:
- Only verified successful payments count toward fundraising totals.
- Pending payments must not increase collected funds.
- Duplicate payment notifications must not create duplicate donations.
- Payment amounts must be verified server-side.
- All transactions must have unique references.

## 6.3 Payment Integration

Payment provider: Duitku.

Rules:
- API credentials must remain server-side.
- Implement webhook signature verification according to provider documentation.
- Implement idempotency.
- Handle pending, success, failed, and expired states.
- Store payment references.
- Reconcile payment status with the provider when necessary.

A frontend redirect is not proof of payment success.

If payment credentials are unavailable:
- Use an isolated sandbox or mock provider.
- Clearly identify mock transactions.
- Never mix mock transactions with production financial records.
- Do not represent simulated payments as actual donations.

## 6.4 Fund Allocation

Required workflow:

Verified Donations
    |
    v
Available Funds
    |
    v
Administrator Approval
    |
    v
Partner Allocation
    |
    v
Distribution Process
    |
    v
Distribution Report
    |
    v
Administrator Verification
    |
    v
Public Report

Rules:
- Allocations cannot exceed available funds.
- Every allocation must reference a disaster.
- Every allocation must reference a partner.
- Every financial operation must have an audit trail.
- Distribution reports must have verification status.
- Unverified reports must not be displayed as completed distributions.

## 6.5 Tracking

Every important status change must produce a tracking event.

Minimum fields:

- eventId
- donationId or relevant financial reference
- disasterId
- eventType
- description
- status
- createdAt
- actorId where applicable

Do not fabricate historical tracking events.

# 7. ROLE-BASED ACCESS CONTROL

## Donor
Allowed:
- View public disasters.
- Create donations.
- View own donation history.
- View public distribution reports.
- Manage own profile.

Not allowed:
- Modify payment status.
- Approve campaigns.
- Manage other users' donations.
- Approve distributions.

## Administrator
Allowed:
- Manage disaster campaigns.
- Verify disaster information.
- Manage partners.
- Review donations.
- Approve fund allocations.
- Verify distribution reports.
- View audit logs.

Sensitive operations must be validated and recorded server-side.

## Partner
Allowed:
- View assigned allocations.
- View relevant distribution tasks.
- Submit distribution reports.
- Upload distribution documentation.
- View own report status.

Not allowed:
- Access unrelated partner allocations.
- Change payment status.
- Approve own reports.
- Modify administrator permissions.

# 8. UI/UX IMPLEMENTATION RULES

Every page must follow the established design system.

Required states:

1. Loading state.
2. Skeleton state where appropriate.
3. Empty state.
4. Error state.
5. Success state.
6. Disabled state.
7. Validation state.

Responsive requirements:
- Mobile.
- Tablet.
- Desktop.

Interaction requirements:
- Buttons must have clear actions.
- Forms must provide validation feedback.
- Destructive actions require confirmation.
- Important operations must provide clear status feedback.
- Navigation must remain consistent.
- Financial information must be easy to understand.

Do not create decorative UI elements that have no functional purpose.

# 9. CODING STANDARDS

- Use readable and descriptive variable names.
- Prefer small, reusable components.
- Use explicit TypeScript interfaces and types.
- Avoid unnecessary any types.
- Keep API logic separate from UI components.
- Centralize reusable utilities.
- Follow existing project conventions.
- Handle asynchronous operations properly.
- Avoid duplicated business logic.
- Avoid hardcoded credentials.
- Remove debug logs before production.

Do not suppress TypeScript errors simply to make the build pass.

# 10. ERROR HANDLING

Every API and major user operation must account for:

- Invalid input.
- Unauthorized access.
- Missing resources.
- Network failure.
- External API failure.
- Database failure.
- Payment failure.
- Duplicate requests.
- Unexpected server errors.

Return appropriate HTTP status codes and consistent response structures.

Never expose stack traces, credentials, or sensitive internal information to users.

# 11. TESTING REQUIREMENTS

Before marking a feature complete, verify:

### Functional
- Expected workflow works.
- Data is persisted correctly.
- Status transitions are valid.
- Existing features remain functional.

### Security
- Unauthorized requests are rejected.
- Role restrictions work.
- Secrets are not exposed.
- Payment callbacks are verified.

### Data Integrity
- No duplicate financial records.
- Donation totals are accurate.
- Allocation totals are accurate.
- Tracking events are consistent.

### UI/UX
- Responsive layout works.
- Forms validate correctly.
- Loading and empty states work.
- Errors are communicated clearly.

### Build
- TypeScript checks pass.
- Production build succeeds.
- No critical console errors.s

# 12. GIT WORKFLOW

Follow the repository's existing Git conventions.

Recommended workflow:

1. Inspect current branch and working tree.
2. Understand the task.
3. Create or use the assigned branch.
4. Implement the feature.
5. Run relevant tests.
6. Review changed files.
7. Commit using descriptive messages.
8. Push only when authorized.

Never:
- Force push without explicit authorization.
- Overwrite other contributors' changes.
- Commit secrets or environment files.
- Delete unrelated branches.
- Rewrite Git history without approval.

# 13. DOCUMENTATION RULES

The following documents should be maintained as the project evolves:

| Document | Purpose |
|---|---|
| README.md | Main project documentation |
| AGENTS.md | AI agent development guidelines |
| PRD.md | Product requirements |
| ARCHITECTURE.md | System architecture |
| DATABASE.md | Firestore schema |
| API.md | API endpoint documentation |
| DESIGN_SYSTEM.md | UI/UX standards |
| PAYMENT.md | Payment integration |
| TASKS.md | Development task tracking |
| CHANGELOG.md | Change history |

Update relevant documentation whenever a significant architectural or business logic change occurs.

# 14. TASK EXECUTION PROTOCOL

For every development task, follow this sequence:

### Step 1 — Understand
- Read the task.
- Inspect relevant files.
- Identify dependencies.
- Understand existing implementation.

### Step 2 — Plan
- Define the implementation approach.
- List files that may change.
- Identify possible risks.
- Define acceptance criteria.

### Step 3 — Implement
- Make the smallest appropriate changes.
- Follow existing architecture.
- Avoid unrelated modifications.

### Step 4 — Validate
- Run relevant tests.
- Check TypeScript.
- Check application build.
- Review security implications.

### Step 5 — Report
Provide a concise summary:

- What was implemented.
- Files created or modified.
- Technical decisions.
- Tests performed.
- Known limitations.
- Remaining tasks.

Do not claim a feature is complete if it has not been tested.

# 15. FINAL DIRECTIVE

The AI agent must behave as a responsible member of the development team.

Prioritize system integrity over implementation speed.

Do not invent requirements, modify unrelated modules, or make irreversible architectural decisions without justification.

When uncertain, inspect first, explain the uncertainty, and choose the safest minimal implementation.

**Build a platform that deserves the public's trust.**

**Bersama Kita — Transparency is not an additional feature. It is the foundation.**