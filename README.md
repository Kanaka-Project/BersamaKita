# AGENTS.md

## Project: Bersama Kita

Panduan kerja seluruh AI coding agents dalam pengembangan proyek.

### 1. General Rules

- Baca README.md sebelum bekerja.
- Inspect repository sebelum mengubah kode.
- Pahami struktur dan teknologi yang sudah digunakan.
- Jangan mengubah file yang tidak relevan.
- Hindari dependency tambahan tanpa alasan.
- Jangan membuat fitur di luar instruksi.
- Jangan menghapus atau mengganti implementasi tanpa justifikasi.

### 2. Agent Responsibilities

| Agent | Responsibility |
|---|---|
| Project Manager | Planning, task management, coordination |
| UI/UX Designer | Design system, layout, user experience |
| Frontend Developer | React, components, responsive UI |
| Backend Developer | API, business logic, integrations |
| Database Engineer | Firestore schema and data integrity |
| QA Engineer | Testing, debugging, security |

### 3. Development Standards

- Use TypeScript.
- Write modular and reusable components.
- Follow existing project architecture.
- Maintain consistent naming conventions.
- Separate frontend and backend responsibilities.
- Handle loading, error, empty, and success states.
- Maintain responsive layouts.
- Keep code readable and maintainable.

### 4. Technology Constraints

Use the established stack:

- React + Vite
- TypeScript
- Tailwind CSS
- Node.js + Express
- Firebase Firestore
- Firebase Authentication
- Cloudinary
- BMKG API
- Duitku
- Vercel

Do not replace technologies without approval.

### 5. Security Rules

- Never expose API credentials.
- Validate all backend requests.
- Implement server-side role authorization.
- Verify payment webhooks.
- Prevent duplicate transactions.
- Never trust frontend payment status.
- Maintain financial audit logs.
- Restrict access according to user roles.

### 6. Business Logic

**Disaster:** BMKG data must be reviewed before campaign publication.

**Donation:** Only verified successful payments count toward fundraising totals.

**Distribution:** Every allocation and distribution must have a valid record and verification status.

**Transparency:** Never fabricate donation transactions or distribution reports.

### 7. UI/UX Guidelines

Design direction:
- Modern and minimal.
- Clean, premium, and trustworthy.
- Consistent typography and spacing.
- Mobile responsive.
- Minimal unnecessary borders and gradients.
- Clear navigation and interaction feedback.
- Skeleton loading and meaningful empty states.

### 8. Workflow

Every task must follow:

1. Inspect existing code.
2. Understand requirements.
3. Create implementation plan.
4. Identify affected files.
5. Implement changes.
6. Run relevant tests.
7. Review changes.
8. Report results.

### 9. Git Rules

- Follow existing branch conventions.
- Use descriptive commit messages.
- Never force push without authorization.
- Never commit credentials.
- Do not overwrite other contributors' work.

### 10. Final Instructions

Prioritize minimal changes, system reliability, security, and maintainability.

Do not assume. Inspect first.

Do not claim completion without testing.

Do not modify unrelated features.

**Build Bersama Kita with transparency and reliability as its foundation.**