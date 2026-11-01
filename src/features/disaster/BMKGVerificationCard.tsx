import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Ban,
  RotateCcw,
  Save,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Disaster, DisasterStatus, Partner } from '../../types';
import {
  updateDisasterStatus,
  updateDisasterPartner,
  addAuditLog,
} from '../../services/firebase/firestore';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../../components/feedback/Toast';
import { formatRelativeTime, formatShortDateIndo } from '../../lib/utils';

interface BMKGVerificationCardProps {
  disasters: Disaster[];
  partners: Partner[];
  onRefreshBMKG: () => Promise<void>;
  onStatusUpdated: () => void;
}

const PUBLIC_STATUSES = ['admin_approved', 'auto_approved', 'published', 'archived'];

type FilterId = 'all' | 'pending' | 'approved';
type StatusTone = 'pending' | 'approved' | 'closed' | 'rejected';

const STATUS_TONE_CLASSES: Record<StatusTone, { badge: string; dot: string }> = {
  pending: { badge: 'bg-amber-50 text-amber-700 ring-amber-200/70', dot: 'bg-amber-400' },
  approved: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70', dot: 'bg-emerald-500' },
  closed: { badge: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  rejected: { badge: 'bg-rose-50 text-rose-700 ring-rose-200/70', dot: 'bg-rose-500' },
};

const getStatusMeta = (status: DisasterStatus): { label: string; tone: StatusTone } => {
  switch (status) {
    case 'pending_verification':
      return { label: 'Pending Verification', tone: 'pending' };
    case 'admin_approved':
      return { label: 'Admin Approved', tone: 'approved' };
    case 'auto_approved':
      return { label: 'Auto Approved (24h)', tone: 'approved' };
    case 'published':
      return { label: 'Published', tone: 'approved' };
    case 'archived':
      return { label: 'Ditutup', tone: 'closed' };
    case 'rejected':
      return { label: 'Ditolak', tone: 'rejected' };
    default:
      return { label: status, tone: 'closed' };
  }
};

interface PartnerSelectProps {
  id: string;
  value: string;
  options: Partner[];
  placeholder: string;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (value: string) => void;
}

const PartnerSelect: React.FC<PartnerSelectProps> = ({
  id,
  value,
  options,
  placeholder,
  disabled,
  invalid,
  onChange,
}) => (
  <div className="relative">
    <select
      id={id}
      value={value}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${id}-error` : undefined}
      onChange={(e) => onChange(e.target.value)}
      className={`h-9 w-full appearance-none rounded-lg border bg-white pl-3 pr-9 text-[13px] text-slate-900 transition-colors cursor-pointer focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
        invalid
          ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/15'
          : 'border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:ring-slate-900/10'
      }`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      aria-hidden="true"
    />
  </div>
);

export const BMKGVerificationCard: React.FC<BMKGVerificationCardProps> = ({
  disasters,
  partners,
  onRefreshBMKG,
  onStatusUpdated,
}) => {
  const { staffSession } = useAuth();
  const { showToast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterId>('all');
  const [selectedPartners, setSelectedPartners] = useState<Record<string, string>>({});
  const [partnerErrors, setPartnerErrors] = useState<Record<string, boolean>>({});

  const selectPartner = (disasterId: string, partnerId: string) => {
    setSelectedPartners((prev) => ({ ...prev, [disasterId]: partnerId }));
    setPartnerErrors((prev) => ({ ...prev, [disasterId]: false }));
  };

  const requestApprove = (disaster: Disaster) => {
    if (!selectedPartners[disaster.id]) {
      setPartnerErrors((prev) => ({ ...prev, [disaster.id]: true }));
      return;
    }
    handleApprove(disaster);
  };

  const filtered = disasters.filter((d) => {
    if (filter === 'pending') return d.status === 'pending_verification';
    if (filter === 'approved') return PUBLIC_STATUSES.includes(d.status);
    return true;
  });

  const handleApprove = async (disaster: Disaster) => {
    const partnerId = selectedPartners[disaster.id];
    if (!partnerId) {
      showToast('Wajib memilih Mitra Lapangan sebelum approve!', 'error');
      return;
    }
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;

    setProcessingId(disaster.id);
    try {
      await updateDisasterStatus(
        disaster.id, 
        'admin_approved', 
        'manual', 
        'Disetujui manual oleh Admin Operasional',
        partner.id,
        partner.name
      );
      await addAuditLog({
        id: `audit-${Date.now()}`,
        actorId: staffSession?.email || 'admin',
        actorRole: 'admin',
        actorEmail: staffSession?.email || '',
        action: 'BMKG_MANUAL_APPROVE',
        entityType: 'disaster',
        entityId: disaster.id,
        before: { status: disaster.status },
        after: { status: 'admin_approved', verificationMethod: 'manual', partnerId: partner.id, partnerName: partner.name },
        timestamp: new Date().toISOString(),
      });
      showToast('Bencana disetujui (Admin Approved)! Kini tampil di Dashboard User.', 'success');
      onStatusUpdated();
    } catch (err: any) {
      showToast('Gagal memverifikasi: ' + err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (disaster: Disaster) => {
    setProcessingId(disaster.id);
    try {
      await updateDisasterStatus(disaster.id, 'rejected', 'manual', 'Ditolak oleh Admin');
      await addAuditLog({
        id: `audit-${Date.now()}`,
        actorId: staffSession?.email || 'admin',
        actorRole: 'admin',
        actorEmail: staffSession?.email || '',
        action: 'BMKG_REJECT',
        entityType: 'disaster',
        entityId: disaster.id,
        before: { status: disaster.status },
        after: { status: 'rejected' },
        timestamp: new Date().toISOString(),
      });
      showToast('Data bencana ditolak (Rejected) — tidak akan tampil ke user', 'warning');
      onStatusUpdated();
    } catch (err: any) {
      showToast('Gagal menolak: ' + err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };



  const handleUpdatePartner = async (disaster: Disaster) => {
    const partnerId = selectedPartners[disaster.id] ?? disaster.partnerId;
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) {
      showToast('Mitra Lapangan tidak ditemukan!', 'error');
      return;
    }
    if (partnerId === disaster.partnerId) {
      showToast('Tidak ada perubahan mitra', 'info');
      return;
    }

    setProcessingId(disaster.id);
    try {
      await updateDisasterPartner(disaster.id, partner.id, partner.name);
      await addAuditLog({
        id: `audit-${Date.now()}`,
        actorId: staffSession?.email || 'admin',
        actorRole: 'admin',
        actorEmail: staffSession?.email || '',
        action: 'DISASTER_PARTNER_UPDATED',
        entityType: 'disaster',
        entityId: disaster.id,
        before: { partnerId: disaster.partnerId, partnerName: disaster.partnerName },
        after: { partnerId: partner.id, partnerName: partner.name },
        timestamp: new Date().toISOString(),
      });
      showToast(`Mitra penanggung jawab diubah ke ${partner.name}`, 'success');
      onStatusUpdated();
    } catch (err: any) {
      showToast('Gagal mengubah mitra: ' + err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCloseFundraising = async (disaster: Disaster) => {
    const confirmed = window.confirm(
      `Tutup penggalangan dana untuk "${disaster.title}"? Bencana tidak lagi tampil ke user, namun riwayat donasi tetap tersimpan dan bisa dibuka kembali.`
    );
    if (!confirmed) return;

    setProcessingId(disaster.id);
    try {
      await updateDisasterStatus(
        disaster.id,
        'archived',
        'manual',
        'Penggalangan dihentikan oleh Admin',
        disaster.partnerId,
        disaster.partnerName
      );
      await addAuditLog({
        id: `audit-${Date.now()}`,
        actorId: staffSession?.email || 'admin',
        actorRole: 'admin',
        actorEmail: staffSession?.email || '',
        action: 'DISASTER_FUNDRAISING_CLOSED',
        entityType: 'disaster',
        entityId: disaster.id,
        before: { status: disaster.status },
        after: { status: 'archived' },
        timestamp: new Date().toISOString(),
      });
      showToast('Penggalangan ditutup — bencana tidak lagi tampil ke user', 'success');
      onStatusUpdated();
    } catch (err: any) {
      showToast('Gagal menutup penggalangan: ' + err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReopenFundraising = async (disaster: Disaster) => {
    const partnerId = selectedPartners[disaster.id] ?? disaster.partnerId;
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) {
      showToast('Wajib memilih Mitra Lapangan sebelum membuka kembali!', 'error');
      return;
    }

    setProcessingId(disaster.id);
    try {
      await updateDisasterStatus(
        disaster.id,
        'admin_approved',
        'manual',
        'Penggalangan dibuka kembali oleh Admin',
        partner.id,
        partner.name
      );
      await addAuditLog({
        id: `audit-${Date.now()}`,
        actorId: staffSession?.email || 'admin',
        actorRole: 'admin',
        actorEmail: staffSession?.email || '',
        action: 'DISASTER_FUNDRAISING_REOPENED',
        entityType: 'disaster',
        entityId: disaster.id,
        before: { status: disaster.status },
        after: { status: 'admin_approved', partnerId: partner.id, partnerName: partner.name },
        timestamp: new Date().toISOString(),
      });
      showToast('Penggalangan dibuka kembali — tampil di Dashboard User', 'success');
      onStatusUpdated();
    } catch (err: any) {
      showToast('Gagal membuka kembali: ' + err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshBMKG();
      showToast('Data BMKG berhasil disinkronisasi ke antrean admin', 'success');
    } catch (err: any) {
      showToast('Gagal menyinkronkan BMKG: ' + err.message, 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const statusCounts = {
    all: disasters.length,
    pending: disasters.filter((d) => d.status === 'pending_verification').length,
    approved: disasters.filter((d) => PUBLIC_STATUSES.includes(d.status)).length,
  };

  const filterTabs: { id: FilterId; label: string; count: number }[] = [
    { id: 'all', label: 'Semua', count: statusCounts.all },
    { id: 'pending', label: 'Menunggu', count: statusCounts.pending },
    { id: 'approved', label: 'Terverifikasi', count: statusCounts.approved },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pusat Verifikasi</h1>
          <p className="mt-1.5 text-sm text-slate-500 max-w-2xl leading-relaxed">
            Data gempa BMKG masuk dengan status{' '}
            <span className="font-medium text-slate-700">Pending Verification</span>. Data baru tampil di Dashboard
            User setelah disetujui Admin dengan penunjukan Mitra Lapangan.
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          aria-busy={refreshing}
          className="shrink-0 self-start inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-[13px] font-medium text-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Menarik data…' : 'Tarik Data BMKG'}</span>
        </button>
      </header>

      {/* Filter: iOS-style segmented control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filter status bencana"
          className="inline-flex max-w-full overflow-x-auto p-1 rounded-lg bg-slate-100"
        >
          {filterTabs.map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md text-[13px] whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 ${
                  isActive
                    ? 'bg-white text-slate-900 font-semibold shadow-sm ring-1 ring-black/5'
                    : 'text-slate-500 font-medium hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs tabular-nums ${isActive ? 'text-slate-500' : 'text-slate-400'}`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-400" aria-live="polite">
          Menampilkan {filtered.length} dari {disasters.length} data
        </p>
      </div>

      {/* Disasters list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 px-6 py-16 text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            {filter === 'pending'
              ? 'Tidak ada data yang menunggu verifikasi'
              : filter === 'approved'
              ? 'Belum ada bencana terverifikasi'
              : 'Belum ada data bencana'}
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Klik &quot;Tarik Data BMKG&quot; untuk mengambil data gempa terkini langsung dari BMKG ke antrean admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 min-[1760px]:grid-cols-3 gap-4">
          {filtered.map((disaster) => {
            const isPending = disaster.status === 'pending_verification';
            const isArchived = disaster.status === 'archived';
            const isApproved = PUBLIC_STATUSES.includes(disaster.status);
            const isProcessing = processingId === disaster.id;
            const statusMeta = getStatusMeta(disaster.status);
            const assignedPartner = partners.find((p) => p.id === disaster.partnerId);
            const activePartners = partners.filter((p) => p.status === 'active');
            const partnerOptions = partners.filter(
              (p) => p.status === 'active' || p.id === disaster.partnerId
            );
            const pendingPartnerValue = selectedPartners[disaster.id] || '';
            const editPartnerValue = selectedPartners[disaster.id] ?? disaster.partnerId ?? '';
            const canSavePartner =
              isApproved &&
              editPartnerValue &&
              editPartnerValue !== disaster.partnerId;

            const createdAt = disaster.createdAt ? new Date(disaster.createdAt).getTime() : Date.now();
            const ageHours = (Date.now() - createdAt) / (1000 * 60 * 60);
            const remainingHours = Math.max(0, 24 - ageHours);

            return (
              <article
                key={disaster.id}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300"
              >
                {/* Information area */}
                <div className="flex-1 p-5">
                  {/* Badges row: magnitude + status */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center h-6 px-2 shrink-0 whitespace-nowrap rounded-md bg-slate-900 text-white text-xs font-semibold tabular-nums">
                        {disaster.magnitude} SR
                      </span>
                      <span className="text-xs text-slate-500 truncate">Kedalaman {disaster.depth}</span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-semibold shrink-0 ring-1 ring-inset ${STATUS_TONE_CLASSES[statusMeta.tone].badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_TONE_CLASSES[statusMeta.tone].dot}`} />
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-4 text-[15px] font-semibold text-slate-900 leading-snug">
                    {disaster.title}
                  </h3>

                  {/* Location & time */}
                  <dl className="mt-3 space-y-1.5 text-[13px]">
                    <div
                      className="flex items-start gap-2 text-slate-600"
                      title={`Koordinat: ${disaster.coordinates?.latitude}, ${disaster.coordinates?.longitude}`}
                    >
                      <dt className="sr-only">Lokasi</dt>
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.75" aria-hidden="true" />
                      <dd className="leading-snug">{disaster.location}</dd>
                    </div>
                    <div
                      className="flex items-center gap-2 text-slate-500"
                      title={`Waktu kejadian: ${disaster.eventTime}`}
                    >
                      <dt className="sr-only">Waktu kejadian</dt>
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <dd>
                        {formatRelativeTime(disaster.eventTime)}
                        <span className="text-slate-300"> · </span>
                        {formatShortDateIndo(disaster.eventTime)}
                      </dd>
                    </div>
                  </dl>

                  {/* Publication status */}
                  <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_TONE_CLASSES[statusMeta.tone].dot}`}
                      aria-hidden="true"
                    />
                    {isPending ? (
                      remainingHours > 0 ? (
                        <span>
                          Auto-approve dalam{' '}
                          <span className="font-medium text-slate-700">{remainingHours.toFixed(1)} jam</span>
                        </span>
                      ) : (
                        <span className="font-medium text-slate-700">Siap auto-approve</span>
                      )
                    ) : isArchived ? (
                      <span>Penggalangan ditutup — tidak tampil di Dashboard User</span>
                    ) : isApproved ? (
                      <span>
                        Tampil di <span className="font-medium text-slate-700">Dashboard User</span>
                      </span>
                    ) : (
                      <span>Ditolak — tidak tampil di Dashboard User</span>
                    )}
                  </p>

                  {disaster.notes && (
                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">Catatan: {disaster.notes}</p>
                  )}
                </div>

                {/* Action area: pending verification */}
                {isPending && (
                  <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4">
                    <div>
                      <label
                        htmlFor={`partner-${disaster.id}`}
                        className="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        Mitra Lapangan <span className="font-normal text-slate-400">(wajib dipilih)</span>
                      </label>
                      <PartnerSelect
                        id={`partner-${disaster.id}`}
                        value={pendingPartnerValue}
                        options={activePartners}
                        placeholder="Pilih mitra lapangan"
                        disabled={isProcessing}
                        invalid={Boolean(partnerErrors[disaster.id])}
                        onChange={(value) => selectPartner(disaster.id, value)}
                      />
                      {partnerErrors[disaster.id] && (
                        <p id={`partner-${disaster.id}-error`} role="alert" className="mt-1.5 text-xs text-rose-600">
                          Pilih mitra lapangan terlebih dahulu sebelum menyetujui.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => requestApprove(disaster)}
                        disabled={isProcessing}
                        className="flex-1 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-1"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Approve Manual</span>
                      </button>

                      <button
                        onClick={() => handleReject(disaster)}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center h-9 px-3.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30"
                      >
                        Tolak
                      </button>
                    </div>


                  </div>
                )}

                {/* Action area: approved / closed */}
                {isApproved && (
                  <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                      {assignedPartner ? (
                        <div className="flex items-center gap-2.5 min-w-0">
                          {assignedPartner.logo ? (
                            <img
                              src={assignedPartner.logo}
                              alt={assignedPartner.name}
                              className="w-8 h-8 rounded-full object-cover bg-white border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white text-slate-700 flex items-center justify-center text-xs font-semibold shrink-0 border border-slate-200">
                              {assignedPartner.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900 truncate">
                              {assignedPartner.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {assignedPartner.organization || assignedPartner.location || 'Mitra Lapangan'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Belum ada mitra — pilih mitra lalu simpan.</span>
                        </div>
                      )}

                      {isArchived ? (
                        <button
                          onClick={() => handleReopenFundraising(disaster)}
                          disabled={isProcessing}
                          className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Buka Kembali</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCloseFundraising(disaster)}
                          disabled={isProcessing}
                          className="shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Tutup Penggalangan</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={`partner-${disaster.id}`}
                        className="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        Ubah mitra lapangan
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <PartnerSelect
                            id={`partner-${disaster.id}`}
                            value={editPartnerValue}
                            options={partnerOptions}
                            placeholder="Pilih mitra lapangan"
                            disabled={isProcessing}
                            onChange={(value) => selectPartner(disaster.id, value)}
                          />
                        </div>
                        <button
                          onClick={() => handleUpdatePartner(disaster)}
                          disabled={isProcessing || !canSavePartner}
                          title={canSavePartner ? undefined : 'Pilih mitra lain untuk menyimpan perubahan'}
                          className="shrink-0 inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-1"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          <span>Simpan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
