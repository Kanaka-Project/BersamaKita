import React from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Activity,
  CreditCard,
  Send,
  Building2,
  ScrollText,
  Sliders,
  LogOut,
  ArrowLeft,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { BMKGVerificationCard } from '../disaster/BMKGVerificationCard';
import { AdminTransactionsView } from '../finance/AdminTransactionsView';
import { DisbursementManager } from '../finance/DisbursementManager';
import { AdminFinalReportPanel } from '../distribution/AdminFinalReportPanel';
import { AdminPartnersView } from '../partner/AdminPartnersView';
import { PublicReportsView } from '../distribution/PublicReportsView';
import { AuditLogsView } from '../operations/AuditLogsView';
import { DuitkuSettingsView } from '../finance/DuitkuSettingsView';
import {
  Disaster,
  Donation,
  Disbursement,
  Partner,
  PartnerAllocation,
  DistributionReport,
  AuditLog,
} from '../../types';

interface AdminPortalViewProps {
  disasters: Disaster[];
  donations: Donation[];
  disbursements: Disbursement[];
  partners: Partner[];
  allocations: PartnerAllocation[];
  reports: DistributionReport[];
  auditLogs: AuditLog[];
  onRefreshBMKG: () => Promise<void>;
  onDataChanged: () => Promise<void>;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  disasters,
  donations,
  disbursements,
  partners,
  allocations,
  reports,
  auditLogs,
  onRefreshBMKG,
  onDataChanged,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { staffSession, isAdminAuthenticated, logoutStaff } = useAuth();

  // ROUTE PROTECTION: Akses /admin WAJIB melalui autentikasi admin di /admin/auth
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/auth" replace />;
  }

  const handleAdminLogout = () => {
    logoutStaff();
    navigate('/admin/auth');
  };

  const navTabs: {
    id: string;
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    attention?: boolean;
  }[] = [
    { id: 'bmkg-verification', path: '/admin/verification', label: 'Verifikasi BMKG', icon: Activity, count: disasters.filter(d => d.status === 'pending_verification').length, attention: true },
    { id: 'disbursements', path: '/admin/disbursements', label: 'Pencairan Dana (Disbursement)', icon: Send },
    { id: 'transactions', path: '/admin/donations', label: 'Semua Transaksi Masuk', icon: CreditCard, count: donations.length },
    { id: 'partners', path: '/admin/partners', label: 'Mitra Lapangan', icon: Building2, count: partners.length },
    { id: 'distribution-monitoring', path: '/admin/distribution', label: 'Laporan Penyaluran', icon: FileCheck2, count: reports.length },
    { id: 'audit-logs', path: '/admin/audit', label: 'Audit Log & Transparansi', icon: ScrollText },
    { id: 'settings', path: '/admin/settings', label: 'Pengaturan Gateway Duitku', icon: Sliders },
  ];

  const formatCount = (count: number) => (count > 99 ? '99+' : String(count));

  // Determine active tab from URL path
  const currentPath = location.pathname;
  let activeTab = 'bmkg-verification';
  if (currentPath.includes('/donations')) activeTab = 'transactions';
  else if (currentPath.includes('/disbursements')) activeTab = 'disbursements';
  else if (currentPath.includes('/partners')) activeTab = 'partners';
  else if (currentPath.includes('/distribution') || currentPath.includes('/reports')) activeTab = 'distribution-monitoring';
  else if (currentPath.includes('/audit')) activeTab = 'audit-logs';
  else if (currentPath.includes('/settings')) activeTab = 'settings';
  else if (currentPath.includes('/verification')) activeTab = 'bmkg-verification';

  return (
    <div className="font-admin min-h-screen bg-white text-slate-900 flex flex-col antialiased selection:bg-slate-900 selection:text-white">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 py-3 bg-white/90 backdrop-blur border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/assets/images/logo.svg" alt="Logo Bersama Kita" className="w-7 h-7 shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm text-slate-900 tracking-tight truncate">
              Bersama Kita
            </span>
            <span className="hidden sm:inline text-slate-300">/</span>
            <span className="hidden sm:inline text-sm text-slate-500 truncate">Panel Operasional</span>
            <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
              Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <span className="hidden lg:block text-xs text-slate-500 mr-2">
            {staffSession?.email || 'bersamakita.my.id@protonmail.com'}
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
            onClick={handleAdminLogout}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30"
            title="Keluar / Logout Admin"
            aria-label="Keluar dari akun admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Workspace with Sidebar & Content */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto">
        {/* Admin Navigation Sidebar */}
        <aside className="hidden md:flex md:flex-col w-64 lg:w-72 shrink-0 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-slate-200/80 px-3 py-5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 px-3 pb-2">
            Menu Operasional
          </div>
          <nav className="space-y-0.5" aria-label="Menu operasional admin">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasCount = tab.count !== undefined && tab.count > 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  aria-current={isActive ? 'page' : undefined}
                  title={tab.label}
                  className={`w-full flex items-center justify-between gap-2 h-9 px-3 rounded-lg text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </span>
                  {hasCount && (
                    <span
                      className={`shrink-0 min-w-[22px] h-[18px] px-1.5 inline-flex items-center justify-center rounded-md text-[11px] font-medium tabular-nums ${
                        tab.attention
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70'
                          : isActive
                          ? 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {formatCount(tab.count as number)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Admin Main Content Workspace */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 lg:py-8">
          {/* Mobile underline tabs scroller */}
          <nav
            className="md:hidden -mx-2 px-2 py-3 flex overflow-x-auto whitespace-nowrap scrollbar-hide border-b border-slate-200/80 mb-6"
            aria-label="Menu operasional admin"
          >
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-1.5 py-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    isActive
                      ? 'border-slate-900 text-slate-900 font-semibold'
                      : 'border-transparent text-slate-500 font-medium hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="text-[11px] tabular-nums text-slate-400">{formatCount(tab.count)}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {activeTab === 'bmkg-verification' && (
            <BMKGVerificationCard
              disasters={disasters}
              partners={partners}
              onRefreshBMKG={onRefreshBMKG}
              onStatusUpdated={onDataChanged}
            />
          )}

          {activeTab === 'disbursements' && (
            <div className="space-y-5">
              <DisbursementManager
                disbursements={disbursements}
                disasters={disasters}
                partners={partners}
                onDataChanged={onDataChanged}
              />
              <AdminFinalReportPanel
                disasters={disasters}
                onClosed={onDataChanged}
              />
            </div>
          )}

          {activeTab === 'transactions' && (
            <AdminTransactionsView
              donations={donations}
              disasters={disasters}
              partners={partners}
              onDataChanged={onDataChanged}
            />
          )}

          {activeTab === 'partners' && (
            <AdminPartnersView
              partners={partners}
              allocations={allocations}
              onDataChanged={onDataChanged}
            />
          )}

          {activeTab === 'distribution-monitoring' && (
            <PublicReportsView
              reports={reports}
              allocations={allocations}
              onDataChanged={onDataChanged}
              progressMode="admin"
            />
          )}

          {activeTab === 'audit-logs' && (
            <AuditLogsView logs={auditLogs} onReset={onDataChanged} />
          )}


          {activeTab === 'settings' && (
            <DuitkuSettingsView onDataChanged={onDataChanged} />
          )}
        </main>
      </div>
    </div>
  );
};
