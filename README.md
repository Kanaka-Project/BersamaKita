# Bersama Kita

**Transparent Disaster Crowdfunding Platform for Indonesia**

Bersama Kita adalah platform crowdfunding bencana alam yang dirancang untuk membantu masyarakat Indonesia menyalurkan bantuan secara transparan, terverifikasi, dan dapat dipertanggungjawabkan.

Platform ini mengintegrasikan data bencana dari BMKG, proses verifikasi manual oleh Admin, penugasan Mitra Lapangan, penggalangan dana publik melalui QRIS, serta pelaporan penyaluran dana yang dapat dipantau oleh masyarakat.

> **Core Principle**
>
> Data bencana dari BMKG tidak pernah langsung dipublikasikan. Setiap bencana wajib melewati verifikasi dan persetujuan eksplisit Admin serta penetapan Mitra Lapangan sebelum dapat ditampilkan kepada publik.

---

## 1. Key Features

| Feature | Description |
|---|---|
| Disaster Management | Integrasi data gempa BMKG dengan verifikasi manual Admin. |
| Manual Approval | Bencana hanya dapat dipublikasikan setelah Admin melakukan APPROVE dan menetapkan Mitra Lapangan. |
| QRIS Donation | Pembayaran donasi menggunakan Duitku Direct API. |
| Transparent Transactions | Riwayat dana masuk dan agregasi donasi berdasarkan bencana. |
| Partner Management | Pengelolaan akun dan penugasan Mitra Lapangan oleh Admin. |
| Fund Distribution | Pencatatan distribusi, pencairan, dan laporan penyaluran dana. |
| Evidence Documentation | Dokumentasi penyaluran berupa foto melalui Cloudinary. |
| Indonesia Map | Peta SVG interaktif untuk visualisasi katalog bencana dan posko. |
| Audit Logging | Pencatatan aktivitas operasional untuk mendukung akuntabilitas. |

## 2. System Workflow

### Disaster Verification

1. Sistem mengambil data gempa dari BMKG.
2. Data masuk sebagai kandidat bencana.
3. Admin melakukan pemeriksaan dan verifikasi.
4. Admin menetapkan Mitra Lapangan.
5. Admin memberikan persetujuan eksplisit.
6. Bencana berubah menjadi `admin_approved` dan dapat dipublikasikan sesuai business rules.

**Status utama:**

`pending_verification` → `admin_approved`

Tidak diperbolehkan:
- Auto-approve.
- Auto-publish.
- Publikasi tanpa persetujuan Admin.
- Publikasi tanpa penetapan Mitra Lapangan.
- Menampilkan placeholder bencana yang belum diverifikasi.

Detail: `docs/DISASTER.md`

### Donation Workflow

1. Pengguna memilih bencana aktif.
2. Pengguna memasukkan nominal donasi.
3. Sistem menghitung biaya administrasi.
4. Backend membuat transaksi melalui Duitku Direct API.
5. Pengguna melakukan pembayaran melalui QRIS.
6. Duitku mengirimkan callback ke backend.
7. Backend memvalidasi signature HMAC-SHA256.
8. Status pembayaran diperbarui secara idempoten.
9. Transaksi masuk ke sistem transparansi.

**Biaya administrasi platform:** 0,17%, dengan perhitungan terpusat di `src/lib/fees.ts`.

### Fund Distribution

1. Admin mengelola proses penyaluran.
2. Mitra Lapangan melaksanakan distribusi bantuan.
3. Bukti penyaluran diunggah melalui Cloudinary.
4. Laporan distribusi dicatat dalam Firestore.
5. Informasi penyaluran dapat diakses publik sesuai aturan transparansi.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Build Tool | Vite 8 |
| Programming Language | TypeScript |
| Styling | TailwindCSS v4 |
| Routing | React Router 7 |
| Backend | Node.js 22, Express |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Server SDK | Firebase Admin SDK |
| Payment Gateway | Duitku Direct API (QRIS) |
| Disaster Data | BMKG Open Data |
| Image Hosting | Cloudinary |
| Deployment | Vercel |
| Version Control | Git & GitHub |

---

## 4. Project Architecture

Bersama Kita menggunakan pendekatan **Feature-Driven Architecture** untuk memisahkan domain bisnis, komponen UI, layanan eksternal, dan infrastruktur backend.

### Frontend Structure

```text
src/
├── components/
│   └── Shared UI components
├── config/
│   └── Firebase configuration
├── features/
│   ├── auth/
│   ├── admin/
│   ├── partner/
│   ├── disaster/
│   ├── donation/
│   ├── distribution/
│   ├── finance/
│   ├── operations/
│   └── public/
├── lib/
│   ├── fees.ts
│   ├── firestore-errors.ts
│   └── utils.ts
├── services/
│   ├── firebase/
│   ├── bmkg.ts
│   ├── duitku.ts
│   └── cloudinary.ts
├── types/
├── App.tsx
└── main.tsx
```

### Backend Structure

```text
server/
├── app.ts
└── routes/
    ├── bmkg.ts
    ├── payments.ts
    ├── transparency.ts
    ├── admin.ts
    └── images.ts

api/
└── index.ts
```

### Backend Responsibilities

| Module | Responsibility |
|---|---|
| `bmkg.ts` | BMKG data proxy |
| `payments.ts` | Payment creation, callback, status verification, expiration |
| `transparency.ts` | Public donation transparency |
| `admin.ts` | Administrative operations and partner creation |
| `images.ts` | Cloudinary signed upload |
| `api/index.ts` | Vercel serverless entry point |

---

## 5. Installation & Local Development

### Prerequisites

- Node.js 22.x
- npm
- Firebase project
- Duitku account
- Cloudinary account

### Installation

```bash
git clone <REPOSITORY_URL>
cd bersama-kita

npm install

cp .env.example .env
```

Configure environment variables before starting the application.

```bash
npm run dev
```

Application will be available at:

`http://localhost:3005`

### Available Scripts

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start Express and Vite development server |
| `npm run build` | Build frontend production assets |
| `npm run start` | Start production-like local server |
| `npm run lint` | Run TypeScript type checking |

---

## 6. Environment Variables

Create a `.env` file based on `.env.example`.

| Variable | Environment | Description |
|---|---|---|
| `VITE_FIREBASE_*` | Frontend | Firebase client configuration |
| `VITE_APP_URL` | Frontend | Application base URL |
| `PORT` | Backend | Express server port |
| `APP_URL` | Backend | Application URL for payment callbacks |
| `DUITKU_MERCHANT_CODE` | Backend | Duitku merchant credentials |
| `DUITKU_API_KEY` | Backend | Duitku API authentication |
| `DUITKU_ENVIRONMENT` | Backend | `sandbox` or `production` |
| `ADMIN_SECRET_KEY` | Backend | Administrative transaction reset protection |
| `CRON_SECRET` | Backend | Cron endpoint authentication |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Backend | Firebase Admin SDK credentials |
| `CLOUDINARY_CLOUD_NAME` | Backend | Cloudinary cloud identifier |
| `CLOUDINARY_API_KEY` | Backend | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Backend | Cloudinary API secret |

**Security Rules:**

- Never expose backend credentials to frontend code.
- Never use the `VITE_` prefix for private credentials.
- Never commit `.env` files to GitHub.
- Validate authentication and authorization on the backend.
- Keep Firebase security rules restrictive.
- Verify Duitku callback signatures before updating payment status.

---

## 7. Deployment

Bersama Kita uses Vercel for deployment.

### Deployment Configuration

- Frontend: Vite production build (`dist/`).
- Backend: Vercel Serverless Function (`api/index.ts`).
- Runtime: Node.js 22.
- API routing: `/api/:path*`.
- Scheduled task: Duitku transaction expiration sweep.

The scheduled endpoint is:

`GET /api/payments/duitku/expire-sweep`

Configured through Vercel Cron at 17:00 UTC.

### Deploy

```bash
npm run build
npx vercel deploy --prod
```

Ensure all required environment variables have been configured in the Vercel project.

---

## 8. Security & Business Rules

The following principles are mandatory and must not be bypassed during development.

**Authentication & Authorization**
- Firebase Authentication handles user authentication.
- Backend operations requiring privileges must validate Firebase ID tokens.
- Admin-only operations must verify the Admin role on the server.
- Partner accounts can only be created through authorized Admin operations.

**Payment Security**
- Duitku API credentials must remain server-side.
- Payment callbacks must validate HMAC-SHA256 signatures.
- Payment processing must be idempotent.
- Client-side payment status must never be treated as authoritative.

**Database Security**
- Firestore security rules must remain restrictive.
- Public transparency must use explicitly authorized backend endpoints.
- Never weaken database rules merely to resolve frontend permission errors.

**Disaster Verification**
- BMKG data is a reference for verification, not an automatic publication command.
- Admin approval is mandatory.
- Mitra Lapangan assignment is mandatory.
- No automatic publication is permitted.

---

## 9. Documentation

Detailed technical documentation is maintained in the `docs/` directory.

| Document | Description |
|---|---|
| `ARCHITECTURE.md` | System architecture and workflow |
| `API.md` | Backend API specifications |
| `AUTH.md` | Authentication and authorization |
| `DISASTER.md` | BMKG verification and disaster approval |
| `DATABASE.md` | Firestore schema and security rules |
| `PAYMENT.md` | Duitku QRIS integration and fee calculation |
| `PARTNER.md` | Mitra Lapangan management |
| `CONTRACT.md` | Technical contracts and architectural constraints |
| `TROUBLESHOOTING.md` | Known issues and troubleshooting |
| `TASKS.md` | Development tasks and recommendations |
| `NOW.md` | Current project status snapshot |
| `CHANGELOG.md` | Project change history |

---

## 10. AI Use Declaration

AI-assisted development tools were used throughout the development of Bersama Kita to support technical planning, architectural design, implementation, interface development, debugging, and documentation.

AI tools served as development assistants. Project direction, technical decisions, integration, testing, and final implementation remain subject to human review and responsibility.

### AI Tools & Models

| Tool | AI Model | Primary Responsibility |
|---|---|---|
| OpenCode | GPT-6 Astra | System architecture, technical planning, architectural analysis, and engineering guidance |
| OpenCode | GPT-5.6 Luna | Architecture exploration, technical review, and implementation support |
| Zed | Claude Sonnet 5.5 | UI/UX development, frontend implementation, component design, and interface refinement |

### AI-Assisted Development Scope

AI assistance was used in the following areas:

1. **System Architecture**
   - Architecture planning and technical structure.
   - Feature decomposition and module organization.
   - Backend and frontend integration planning.
   - Database structure and API design assistance.

2. **Frontend & UI/UX**
   - Interface layout and component development.
   - Responsive design implementation.
   - User experience refinement.
   - Frontend code assistance.

3. **Backend Development**
   - API implementation assistance.
   - Firebase and external service integration.
   - Payment workflow implementation assistance.
   - Error analysis and debugging.

4. **Documentation**
   - Technical documentation preparation.
   - README and development guideline drafting.
   - Architecture and workflow documentation.

### Human Responsibility & Verification

AI-generated suggestions and code are not automatically accepted as final implementations.

The development team is responsible for:

- Reviewing and validating AI-generated code.
- Verifying business logic and system behavior.
- Testing application functionality.
- Reviewing security-sensitive implementations.
- Ensuring third-party integrations work as intended.
- Making final architectural and technical decisions.

AI tools do not independently operate the platform, approve disasters, authorize payments, or determine fund distribution.

---

## 11. Third-Party Services Declaration

Bersama Kita integrates several third-party services and external data providers to support its functionality.

| Service | Purpose | Integration |
|---|---|---|
| BMKG Open Data | Earthquake information and disaster reference data | Backend data proxy |
| Firebase | Authentication and database infrastructure | Client SDK and Admin SDK |
| Duitku | QRIS payment processing | Direct API and payment callbacks |
| Cloudinary | Image hosting and evidence documentation | Signed image uploads |
| Vercel | Application hosting and serverless deployment | Frontend and backend deployment |
| npm Packages | Third-party software dependencies | Application runtime and development |

### External Service Responsibilities

**BMKG Open Data**

Used as an external source of earthquake information. BMKG data is treated as reference information and requires independent administrative verification before publication.

**Firebase**

Provides authentication and database infrastructure. Data access is governed by Firebase Authentication, backend authorization, and Firestore security rules.

**Duitku**

Provides payment gateway infrastructure for QRIS transactions. Payment processing depends on Duitku API availability and callback verification.

**Cloudinary**

Provides external image hosting for disaster documentation and distribution evidence.

**Vercel**

Provides hosting, serverless execution, and scheduled task infrastructure.

### Third-Party Disclaimer

- Bersama Kita is an independently developed platform.
- Integration with third-party services does not imply official endorsement or partnership unless explicitly established.
- BMKG, Firebase, Duitku, Cloudinary, and Vercel remain independent service providers.
- Their respective names, trademarks, APIs, and services belong to their respective owners.
- Third-party service availability, API limitations, pricing, and applicable terms are subject to the respective providers.

---

## 12. Limitations & Future Development

Potential development improvements include:

- Expanded disaster data coverage beyond earthquakes.
- More comprehensive disaster verification workflows.
- Improved partner activity monitoring.
- Enhanced financial reporting and reconciliation.
- More detailed public fund utilization reports.
- Improved system observability and error monitoring.
- Performance and scalability optimization.
- Automated integration testing.

These improvements are development considerations and do not necessarily represent currently implemented features.

---

## 13. Project Status

Bersama Kita is an actively developed project.

The implementation status of individual features, known limitations, and outstanding development tasks are documented in:

- `docs/NOW.md`
- `docs/TASKS.md`
- `docs/CHANGELOG.md`

Refer to these documents for the latest project status.

---

## 14. License & Acknowledgements

Bersama Kita acknowledges the external infrastructure, open data providers, development tools, and software dependencies that support the project.

All third-party trademarks and intellectual property remain the property of their respective owners.

**License:** Not yet specified.

---

**Bersama Kita**

*Bersama membantu, bersama menjaga transparansi.*