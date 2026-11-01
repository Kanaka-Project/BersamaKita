import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Plus,
  FileCheck2,
  Clock,
  MapPin,
  AlertCircle,
  Edit3,
  Loader2,
  Package,
  Image as ImageIcon,
  Heart,
  LogOut,
  ArrowLeft,
  ListTodo,
  Wallet,
  Send,
  BadgeCheck,
  Truck,
  Info,
  Menu,
  X,
} from 'lucide-react';
import {
  PartnerAllocation,
  DistributionReport,
  DistributionItem,
  Donation,
  Disaster,
} from '../../types';
import {
  confirmAllocationReceipt,
  updateAllocationStatus,
  saveDistributionReport,
  addAuditLog,
  addTrackingEvent,
  addDisasterTimelineEvent,
} from '../../services/firebase/firestore';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../../components/feedback/Toast';
import { ImageUploadField } from '../../components/ImageUploadField';
import { formatRupiah, formatDateIndo } from '../../lib/utils';
import { DistributionProgressCard } from '../distribution/DistributionProgressCard';

type MetricTone = 'emerald' | 'sky' | 'amber';

const METRIC_TONES: Record<MetricTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-600',
  sky: 'bg-sky-50 text-sky-600',
  amber: 'bg-amber-50 text-amber-600',
};

type PillTone = 'green' | 'blue' | 'amber' | 'slate';

const PILL_TONES: Record<PillTone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200/70',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200/70',
  slate: 'bg-slate-50 text-slate-600 ring-slate-200',
};

const Pill: React.FC<{
  tone: PillTone;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}> = ({ tone, icon: Icon, children }) => (
  <span
    className={`inline-flex self-start items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset ${PILL_TONES[tone]}`}
  >
    {Icon && <Icon className="w-3 h-3" />}
    {children}
  </span>
);

/** Hover/focus tooltip for compact status badges. */
const InfoTip: React.FC<{ id: string; text: string; children: React.ReactNode }> = ({
  id,
  text,
  children,
}) => (
  <span className="group relative inline-flex" tabIndex={0} aria-describedby={id}>
    {children}
    <span
      id={id}
      role="tooltip"
      className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 w-60 rounded-lg bg-slate-900 px-3 py-2 text-xs font-normal leading-relaxed text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100"
    >
      {text}
    </span>
  </span>
);

interface PartnerDashboardViewProps {
  allocations: PartnerAllocation[];
  reports: DistributionReport[];
  donations?: Donation[];
  disasters?: Disaster[];
  onDataChanged: () => void;
}

export const PartnerDashboardView: React.FC<PartnerDashboardViewProps> = ({
  allocations,
  reports,
  donations = [],
  disasters = [],
  onDataChanged,
}) => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { staffSession, isPartnerAuthenticated, logoutStaff } = useAuth();
  const { showToast } = useToast();

  // ROUTE PROTECTION: Akses /partner WAJIB melalui autentikasi partner di /partner/auth
  if (!isPartnerAuthenticated) {
    return <Navigate to="/partner/auth" replace />;
  }

  const currentPath = routerLocation.pathname;
  let activeTab: 'all' | 'tasks' | 'distribution' | 'reports' = 'all';
  if (currentPath.includes('/distribution')) {
    activeTab = 'distribution';
  } else if (currentPath.includes('/reports')) {
    activeTab = 'reports';
  } else if (currentPath.includes('/tasks')) {
    activeTab = 'tasks';
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);

  const openMobileMenu = () => {
    setMobileMenuOpen(true);
    requestAnimationFrame(() => setDrawerVisible(true));
  };

  const closeMobileMenu = () => {
    setDrawerVisible(false);
    setTimeout(() => setMobileMenuOpen(false), 300);
  };

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [selectedAllocation, setSelectedAllocation] = useState<PartnerAllocation | null>(null);
  const [editingReport, setEditingReport] = useState<DistributionReport | null>(null);

  // Form states for distribution report
  const [location, setLocation] = useState<string>('');
  const [distributionDate, setDistributionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<DistributionItem[]>([
    { name: 'Paket Sembako & Beras', quantity: 100, unit: 'paket' },
  ]);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoPublicId, setPhotoPublicId] = useState<string>('');
  const [photoUploading, setPhotoUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filter donations that are paid
  const paidDonations = donations.filter((d) => d.status === 'paid');
  const totalDonationsPaid = paidDonations.reduce((sum, d) => sum + d.amount, 0);

  // Partner's total allocated funds
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  const totalReceived = allocations
    .filter((a) => a.status === 'funds_received' || a.status === 'in_distribution' || a.status === 'completed')
    .reduce((sum, a) => sum + a.amount, 0);

  const handleConfirmReceived = async (alloc: PartnerAllocation) => {
    setConfirmingId(alloc.id);
    try {
      await confirmAllocationReceipt(alloc.id);
      await addAuditLog({
        id: `audit-${Date.now()}`,
        actorId: staffSession?.email || 'partner',
        actorRole: 'partner',
        actorEmail: staffSession?.email || '',
        action: 'PARTNER_FUNDS_CONFIRMED',
        entityType: 'partnerAllocation',
        entityId: alloc.id,
        before: { status: alloc.status },
        after: { status: 'funds_received', receivedAt: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      });

      // Synchronize tracking event for each source donation (nota privat donatur)
      if (alloc.sourceDonationIds && alloc.sourceDonationIds.length > 0) {
        for (const donId of alloc.sourceDonationIds) {
          await addTrackingEvent({
            id: `trk-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            donationId: donId,
            type: 'funds_received_by_partner',
            title: 'Mitra Lapangan Mengonfirmasi Penerimaan Dana',
            description: `Mitra ${alloc.partnerName} telah mengonfirmasi bahwa dana bantuan ${formatRupiah(alloc.amount)} telah diterima dan proses pengadaan logistik dimulai.`,
            visibleToUser: true,
            createdBy: staffSession?.email || 'partner',
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Timeline KOLEKTIF per bencana — satu timeline utk semua donatur disaster ini
      if (alloc.disasterId && !alloc.disasterId.startsWith('__')) {
        await addDisasterTimelineEvent({
          id: `tl-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          disasterId: alloc.disasterId,
          disasterTitle: alloc.disasterTitle,
          type: 'funds_received_by_partner',
          title: 'Dana Diterima Mitra Lapangan',
          description: `Mitra ${alloc.partnerName} telah menerima dana Rp${alloc.amount.toLocaleString('id-ID')} dan mulai menyiapkan pengadaan logistik untuk bencana "${alloc.disasterTitle || 'Tanggap Darurat'}".`,
          amount: alloc.amount,
          actorRole: 'partner',
          actorName: staffSession?.name || staffSession?.email,
          createdAt: new Date().toISOString(),
        });
      }

      showToast(`Dana alokasi ${formatRupiah(alloc.amount)} berhasil dikonfirmasi diterima`, 'success');
      onDataChanged();
    } catch (err: any) {
      showToast('Gagal konfirmasi: ' + err.message, 'error');
    } finally {
      setConfirmingId(null);
    }
  };

  const openCreateReport = (alloc: PartnerAllocation) => {
    setSelectedAllocation(alloc);
    setEditingReport(null);
    setLocation(staffSession?.name ? `Posko ${staffSession.name}` : 'Posko Bencana Lapangan');
    setNotes('');
    setItems([{ name: 'Paket Beras & Logistik', quantity: 150, unit: 'paket' }]);
    setPhotoUrl('');
    setPhotoPublicId('');
    setShowReportModal(true);
  };

  const openEditReport = (rep: DistributionReport) => {
    setEditingReport(rep);
    setSelectedAllocation(allocations.find((a) => a.id === rep.allocationId) || null);
    setLocation(rep.location);
    setDistributionDate(rep.distributionDate);
    setNotes(rep.notes);
    setItems(rep.items || [{ name: 'Logistik', quantity: 10, unit: 'paket' }]);
    setPhotoUrl(rep.photoUrls?.[0] || '');
    setPhotoPublicId(rep.photoPublicIds?.[0] || '');
    setShowReportModal(true);
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { name: '', quantity: 1, unit: 'paket' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof DistributionItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmitReport = async (isDraft: boolean) => {
    if (!location) {
      showToast('Harap isi lokasi pelaksanaan distribusi', 'warning');
      return;
    }

    if (photoUploading) {
      showToast('Tunggu sampai gambar selesai diunggah', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const reportId = editingReport?.id || `rep-${Date.now()}`;
      const status = isDraft ? 'draft' : 'submitted';

      const validItems = items.filter((it) => it.name.trim().length > 0);

      const reportData: DistributionReport = {
        id: reportId,
        partnerId: selectedAllocation?.partnerId || staffSession?.email || 'partner',
        partnerName: selectedAllocation?.partnerName || staffSession?.name || 'Mitra Lapangan',
        allocationId: selectedAllocation?.id || 'alloc-general',
        disbursementId: selectedAllocation?.disbursementId,
        status: status,
        location,
        distributionDate,
        items: validItems,
        notes,
        photoUrls: photoUrl ? [photoUrl] : [],
        photoPublicIds: photoUrl ? [photoPublicId || ''] : [],
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdAt: editingReport?.createdAt || new Date().toISOString(),
      };

      await saveDistributionReport(reportData);

      // If report submitted, advance allocation status to in_distribution or completed
      if (selectedAllocation && !isDraft) {
        await updateAllocationStatus(selectedAllocation.id, 'completed');
      }

      // Synchronize donor tracking events for this distribution
      if (selectedAllocation?.sourceDonationIds && selectedAllocation.sourceDonationIds.length > 0 && !isDraft) {
        for (const donId of selectedAllocation.sourceDonationIds) {
          await addTrackingEvent({
            id: `trk-rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            donationId: donId,
            type: 'distribution_completed',
            title: 'Bantuan Telah Disalurkan ke Warga Terdampak',
            description: `Mitra ${selectedAllocation.partnerName} telah menyalurkan bantuan logistik di ${location}. Dokumentasi foto dan serah terima bantuan telah diverifikasi.`,
            visibleToUser: true,
            createdBy: staffSession?.email || 'partner',
            timestamp: new Date().toISOString(),
          });
        }
      }

      await addAuditLog({
        id: `audit-${Date.now()}`,
        actorId: staffSession?.email || 'partner',
        actorRole: 'partner',
        actorEmail: staffSession?.email || '',
        action: editingReport ? 'PARTNER_REPORT_EDITED' : 'PARTNER_REPORT_SUBMITTED',
        entityType: 'distributionReport',
        entityId: reportId,
        after: { status, location, itemsCount: validItems.length },
        timestamp: new Date().toISOString(),
      });

      showToast(
        isDraft ? 'Draft laporan berhasil disimpan' : 'Laporan distribusi berhasil dikirim!',
        'success'
      );
      setShowReportModal(false);
      onDataChanged();
    } catch (err: any) {
      showToast('Gagal menyimpan laporan: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { id: typeof activeTab; label: string; path: string; count?: number }[] = [
    { id: 'all', label: 'Ringkasan Mitra', path: '/partner' },
    { id: 'tasks', label: 'Alokasi & Tugas', path: '/partner/tasks', count: allocations.length },
    { id: 'distribution', label: 'Penyaluran Lapangan', path: '/partner/distribution' },
    { id: 'reports', label: 'Laporan Distribusi', path: '/partner/reports', count: reports.length },
  ];

  const metrics: {
    label: string;
    value: string;
    hint: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: MetricTone;
  }[] = [
    {
      label: 'Total Donasi Masuk',
      value: formatRupiah(totalDonationsPaid),
      hint: `${paidDonations.length} donasi terverifikasi`,
      icon: Wallet,
      tone: 'emerald',
    },
    {
      label: 'Total Dana Dialokasikan',
      value: formatRupiah(totalAllocated),
      hint: `${allocations.length} alokasi penugasan`,
      icon: Send,
      tone: 'sky',
    },
    {
      label: 'Dana Dikonfirmasi',
      value: formatRupiah(totalReceived),
      hint: 'Kas posko, siap/telah dibelanjakan',
      icon: BadgeCheck,
      tone: 'emerald',
    },
    {
      label: 'Laporan Distribusi',
      value: String(reports.length),
      hint: 'Foto & berita acara terdokumentasi',
      icon: FileCheck2,
      tone: 'amber',
    },
  ];

  return (
    <div className="font-admin min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col antialiased selection:bg-slate-900 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 h-14 bg-white/90 backdrop-blur border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/assets/images/logo.svg" alt="Logo Bersama Kita" className="w-7 h-7 shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm text-slate-900 tracking-tight truncate">Bersama Kita</span>
            <span className="hidden sm:inline text-slate-300">/</span>
            <span className="hidden sm:inline text-sm text-slate-500 truncate">Portal Mitra Lapangan</span>
            <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
              Mitra
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <span className="hidden lg:block text-xs text-slate-500 mr-2">
            {staffSession?.email || ''}
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lihat Tampilan Donatur</span>
            <span className="sm:hidden">Donatur</span>
          </button>

          <button
            onClick={() => {
              logoutStaff();
              navigate('/partner/auth');
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30"
            title="Keluar / Logout Mitra"
            aria-label="Keluar dari akun mitra"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Hamburger – mobile only */}
          <button
            onClick={openMobileMenu}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Hamburger Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${drawerVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div
            className={`relative z-10 w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
              drawerVisible ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200/80 shrink-0">
              <span className="font-semibold text-sm text-slate-900">Menu Portal Mitra</span>
              <button
                onClick={closeMobileMenu}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Tutup menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Drawer Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Navigasi portal mitra">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { navigate(tab.path); closeMobileMenu(); }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between gap-2 h-10 px-3 rounded-lg text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`shrink-0 min-w-[22px] h-[18px] px-1.5 inline-flex items-center justify-center rounded-md text-[11px] font-medium tabular-nums ${
                          isActive
                            ? 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            {/* Drawer Footer */}
            <div className="shrink-0 border-t border-slate-200/80 px-4 py-3">
              <span className="text-xs text-slate-400 truncate block">{staffSession?.email || ''}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 flex flex-col gap-10">
        {/* Page heading + tabs */}
        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium text-slate-500">Dashboard Mitra Operasional &amp; Distribusi</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {staffSession?.name || 'Mitra Tanggap Bencana'}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 max-w-2xl leading-relaxed">
              Kelola penerimaan dana alokasi bantuan dan laporkan hasil penyaluran langsung dari lapangan.
            </p>
          </div>

          {/* Underline tabs */}
          <nav
            aria-label="Navigasi portal mitra"
            className="-mx-4 sm:mx-0 px-4 sm:px-0 border-b border-slate-200/80 overflow-x-auto"
          >
            <div className="flex gap-7 min-w-max">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => navigate(tab.path)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative inline-flex items-center gap-2 h-11 text-[13px] whitespace-nowrap cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:text-slate-900 ${
                      isActive
                        ? 'text-slate-900 font-semibold'
                        : 'text-slate-500 font-medium hover:text-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[11px] font-medium tabular-nums transition-colors duration-200 ${
                          isActive
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full origin-left transition-transform duration-300 ${
                        isActive
                          ? 'bg-slate-900 scale-x-100'
                          : 'bg-slate-300 scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Metrics */}
        <section aria-label="Ringkasan metrik" className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="rounded-xl border border-slate-200/80 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[13px] font-medium text-slate-500 leading-snug">{metric.label}</span>
                  <span
                    className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${METRIC_TONES[metric.tone]}`}
                    aria-hidden="true"
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900 tabular-nums break-words">
                  {metric.value}
                </div>
                <p className="mt-1 text-xs text-slate-400 leading-snug">{metric.hint}</p>
              </div>
            );
          })}
        </section>

        {/* Donasi Masuk dari Donatur yang Siap Didistribusikan */}
        {(activeTab === 'all' || activeTab === 'distribution') && paidDonations.length > 0 && (
          <section className="rounded-xl border border-slate-200/80 bg-white" aria-labelledby="donations-heading">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="donations-heading" className="text-base font-semibold text-slate-900">
                  Donasi Masuk Siap Didistribusikan
                </h2>
                <p className="mt-1 text-[13px] text-slate-500 max-w-2xl leading-relaxed">
                  Dana kontribusi donatur yang telah terverifikasi. Mitra dapat langsung memulai penyiapan logistik dan penyaluran lapangan.
                </p>
              </div>
              <Pill tone="slate">{paidDonations.length} Donasi Terkumpul</Pill>
            </div>

            <ul className="divide-y divide-slate-100">
              {paidDonations.map((don) => {
                const alreadyAllocated = allocations.some((a) => a.sourceDonationIds?.includes(don.id));
                return (
                  <li
                    key={don.id}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 transition-colors hover:bg-slate-50/60"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span className="text-lg font-bold tracking-tight text-slate-900 tabular-nums">
                          {formatRupiah(don.amount)}
                        </span>
                        <Pill tone="green" icon={CheckCircle2}>
                          Terverifikasi
                        </Pill>
                      </div>

                      <p className="text-[13px] text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span className="font-medium text-slate-700">
                          {don.isAnonymous ? 'Hamba Allah' : don.donorName}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span>{formatDateIndo(don.createdAt)}</span>
                      </p>

                      <p className="text-[13px] text-slate-500 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 mt-[3px] shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="min-w-0">
                          Target: <span className="text-slate-700">{don.disasterTitle || 'Tanggap Darurat'}</span>
                        </span>
                      </p>

                      {don.message && (
                        <p className="max-w-xl pt-0.5 text-xs italic text-slate-500 leading-relaxed line-clamp-2">
                          &ldquo;{don.message}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      {alreadyAllocated ? (
                        <Pill tone="blue" icon={Truck}>
                          Dalam Penyaluran
                        </Pill>
                      ) : (
                        <InfoTip
                          id={`tip-${don.id}`}
                          text="Pencairan dikelola kolektif Admin. Pantau penugasan pada bagian Tugas Penyaluran di bawah."
                        >
                          <Pill tone="slate" icon={Info}>
                            Dikelola Admin
                          </Pill>
                        </InfoTip>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Allocations Assigned to this Partner */}
        {(activeTab === 'all' || activeTab === 'tasks' || activeTab === 'distribution') && (
          <section className="space-y-5" aria-labelledby="tasks-heading">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="tasks-heading" className="text-lg font-semibold tracking-tight text-slate-900">
                  Tugas Penyaluran &amp; Checklist Progres Lapangan
                </h2>
                <p className="mt-1 text-[13px] text-slate-500 max-w-2xl leading-relaxed">
                  Perbarui setiap tahapan aktual secara real-time (dikemas, dalam perjalanan, tiba di posko, diserahkan ke warga). Donatur dan admin akan memantau progres Anda secara langsung.
                </p>
              </div>
              <Pill tone="slate">{allocations.length} Tugas Alokasi</Pill>
            </div>

            {allocations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
                <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Belum Ada Alokasi Dana Aktif</h3>
                <p className="mt-1.5 text-[13px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Saat admin melakukan pencairan dana donasi dan menugaskannya kepada organisasi Anda, rinciannya akan tampil di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {allocations.map((alloc) => (
                  <DistributionProgressCard
                    key={alloc.id}
                    allocation={alloc}
                    mode="partner"
                    actorEmail={staffSession?.email}
                    actorName={staffSession?.name}
                    onUpdated={onDataChanged}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Distribution Reports List */}
        {(activeTab === 'all' || activeTab === 'reports' || activeTab === 'distribution') && (
          <section className="rounded-xl border border-slate-200/80 bg-white" aria-labelledby="reports-heading">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 id="reports-heading" className="text-base font-semibold text-slate-900">
                Laporan Penyaluran yang Telah Dibuat
              </h2>
              <p className="mt-1 text-[13px] text-slate-500 max-w-2xl leading-relaxed">
                Laporan berstatus &apos;Submitted&apos; langsung tampil pada pelacakan donatur untuk transparansi publik.
              </p>
            </div>

            {reports.length === 0 ? (
              <div className="px-6 py-12 text-center text-[13px] text-slate-400">
                Belum ada laporan distribusi yang diunggah.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {reports.map((rep) => (
                  <li
                    key={rep.id}
                    className="px-6 py-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors hover:bg-slate-50/60"
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          <span>{rep.location}</span>
                        </span>
                        <Pill tone={rep.status === 'submitted' || rep.status === 'published' ? 'green' : 'amber'}>
                          {rep.status === 'draft' ? 'Draft' : 'Submitted (Publik)'}
                        </Pill>
                      </div>

                      <p className="text-[13px] text-slate-600 leading-relaxed">{rep.notes}</p>

                      {rep.items && rep.items.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {rep.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium"
                            >
                              {it.name}: {it.quantity} {it.unit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => openEditReport(rep)}
                      className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[13px] font-medium text-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit Laporan</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

      {/* Modal Buat / Edit Laporan Distribusi */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 text-slate-900 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingReport ? 'Edit Laporan Distribusi' : 'Buat Laporan Distribusi Lapangan'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Catat hasil aktual bantuan yang disalurkan ke korban bencana. Item dan foto dicatat sesuai kondisi riil.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lokasi Distribusi</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Misal: Posko Pengungsian Desa Sukamaju, Cianjur"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0C8F63]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Pelaksanaan</label>
                <input
                  type="date"
                  value={distributionDate}
                  onChange={(e) => setDistributionDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0C8F63] bg-white"
                  required
                />
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Item Bantuan yang Disalurkan</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[11px] font-bold text-[#1B3322] hover:underline"
                  >
                    + Tambah Item
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        placeholder="Nama Item (misal: Beras)"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                        className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center"
                      />
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        placeholder="Satuan (kg/paket)"
                        className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600 px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Penyaluran</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Catatan pelaksanaan penyaluran, kondisi warga, dll..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0C8F63]"
                />
              </div>

              <div>
                <ImageUploadField
                  label="Foto Dokumentasi Penyerahan (Opsional)"
                  value={photoUrl}
                  publicId={photoPublicId}
                  folder="bersamakita/reports"
                  hint="Unggah foto langsung dari perangkat (JPG/PNG/WEBP, maks 5 MB)."
                  onUploadingChange={setPhotoUploading}
                  onChange={(url, publicId) => {
                    setPhotoUrl(url);
                    setPhotoPublicId(publicId || '');
                  }}
                />
              </div>

              {/* Actions: Save Draft vs Submit */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  disabled={submitting || photoUploading}
                  onClick={() => handleSubmitReport(true)}
                  className="flex-1 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs disabled:opacity-60"
                >
                  Simpan Draft
                </button>
                <button
                  type="button"
                  disabled={submitting || photoUploading}
                  onClick={() => handleSubmitReport(false)}
                  className="flex-1 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Kirim Laporan (Publik)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
