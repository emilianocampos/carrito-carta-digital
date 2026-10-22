'use client';

import React, { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { SalesReportModal } from './SalesReportModal';

interface DashboardExportButtonProps {
  tenantId: string;
  tenantSlug: string;
}

export function DashboardExportButton({ tenantId, tenantSlug }: DashboardExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wide shadow-sm shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        title="Ver métricas de recaudación y descargar Excel o PDF"
      >
        <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
        <span>Reportes & Excel</span>
      </button>

      <SalesReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        tenantId={tenantId}
        tenantSlug={tenantSlug}
      />
    </>
  );
}
