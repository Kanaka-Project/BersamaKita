import React, { useState } from 'react';
import { ScrollText, Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { AuditLog } from '../../types';
import { formatDateIndo } from '../../lib/utils';
import { auth } from '../../config/firebase';

interface AuditLogsViewProps {
  logs: AuditLog[];
  onReset?: () => Promise<void>;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs, onReset }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleReset = async () => {
    setIsResetting(true);
    setResetResult(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Sesi admin tidak ditemukan. Silakan login ulang.');

      const res = await fetch('/api/admin/audit-logs', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mereset audit log.');
      }

      setResetResult({ success: true, message: data.message });
      setShowConfirm(false);
      if (onReset) await onReset();
    } catch (err: any) {
      setResetResult({ success: false, message: err.message });
      setShowConfirm(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 w-full">
        <div className="w-full sm:w-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B3322] uppercase tracking-wider mb-1">
            <ScrollText className="w-4 h-4 text-emerald-600" />
            <span>Audit &amp; Kepatuhan Sistem</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 w-full">Catatan Audit Log Operasional</h2>
          <p className="text-xs text-slate-500 mt-0.5 w-full">
            Semua aktivitas sensitif (verifikasi BMKG, transaksi donasi, pencairan dana, perubahan laporan mitra) tercatat secara permanen.
          </p>
        </div>

        {/* Reset Button */}
        <button
          id="btn-reset-audit-logs"
          onClick={() => { setResetResult(null); setShowConfirm(true); }}
          disabled={isResetting || logs.length === 0}
          className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Reset Audit Log
        </button>
      </div>

      {/* Result Banner */}
      {resetResult && (
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-xs font-medium border ${
            resetResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <span className="flex-1">{resetResult.message}</span>
          <button
            onClick={() => setResetResult(null)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Log Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Belum ada catatan audit log tersimpan.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Waktu</th>
                  <th className="py-3 px-6">Aktor &amp; Peran</th>
                  <th className="py-3 px-6">Aksi (Action)</th>
                  <th className="py-3 px-6">Entitas Terkait</th>
                  <th className="py-3 px-6">Perubahan State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 text-slate-500 whitespace-nowrap text-[11px] min-w-30">
                      {formatDateIndo(log.timestamp)}
                    </td>
                    <td className="py-3.5 px-6 font-sans min-w-40">
                      <div className="font-semibold text-slate-800 text-xs break-all">
                        {log.actorEmail || log.actorId}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        [{log.actorRole}]
                      </span>
                    </td>
                    <td className="py-3.5 px-6 min-w-40">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 text-[11px] min-w-50 break-all">
                      {log.entityType}: {log.entityId}
                    </td>
                    <td className="py-3.5 px-6 text-[10px] text-slate-500 min-w-62.5 max-w-sm wrap-break-word font-sans">
                      {log.after ? JSON.stringify(log.after) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title-audit-reset"
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 id="dialog-title-audit-reset" className="text-base font-bold text-slate-900">
                Reset Semua Audit Log?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tindakan ini akan <strong className="text-rose-600">menghapus permanen</strong> seluruh{' '}
                <strong>{logs.length}</strong> catatan audit log dari Firestore.
                <br /><br />
                Proses ini tidak dapat dibatalkan. Pastikan kamu sudah mengekspor atau mendokumentasikan log yang diperlukan sebelum melanjutkan.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                id="btn-cancel-reset-audit"
                onClick={() => setShowConfirm(false)}
                disabled={isResetting}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                id="btn-confirm-reset-audit"
                onClick={handleReset}
                disabled={isResetting}
                className="flex-1 h-10 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Ya, Reset Sekarang'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
