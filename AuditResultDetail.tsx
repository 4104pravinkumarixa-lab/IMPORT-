
import React from 'react';
import { AuditResult } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface AuditResultDetailProps {
  result: AuditResult;
}

export const AuditResultDetail: React.FC<AuditResultDetailProps> = ({ result }) => {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-50 text-2xl tracking-tight">
            {result.partyName}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <p className="text-sm text-gray-400">
              Invoice/BE No: <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded text-gray-200 font-semibold">{result.invoiceNo}</span>
            </p>
            <p className="text-sm text-gray-400">
              Matched Doc: <span className="italic font-medium text-indigo-400">{result.documentMatched}</span>
            </p>
          </div>
        </div>
        <div className="px-4 py-1.5 bg-indigo-900/40 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border border-indigo-800/50">
          {result.fields.length} Checkpoints
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800 shadow-sm bg-gray-900">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 border-b border-gray-700 text-gray-400 font-bold uppercase text-[10px] tracking-[0.1em]">
            <tr>
              <th className="px-5 py-4 w-1/4">Excel Field Name</th>
              <th className="px-5 py-4 w-1/4">Excel Value</th>
              <th className="px-5 py-4 w-1/4">PDF Value</th>
              <th className="px-5 py-4 w-1/4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {result.fields.map((field, fIdx) => (
              <tr key={fIdx} className="hover:bg-gray-800/50 transition-colors group">
                <td className="px-5 py-4 font-semibold text-gray-50">{field.fieldName}</td>
                <td className="px-5 py-4 text-gray-300 font-mono text-xs">{field.excelValue || '-'}</td>
                <td className="px-5 py-4 text-gray-300 font-mono text-xs">{field.pdfValue || '-'}</td>
                <td className="px-5 py-4 text-right">
                  <StatusBadge status={field.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {result.summary && (
        <div className="mt-8 mb-6">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">AI Contextual Analysis</h4>
          <div className="p-5 bg-indigo-950/40 border border-indigo-900/50 rounded-2xl text-sm text-indigo-200 leading-relaxed shadow-inner">
            {result.summary}
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Match':
      return (
        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/30 px-2.5 py-1 rounded-lg text-xs">
          <CheckCircle2 className="w-3.5 h-3.5" /> Match
        </span>
      );
    case 'Match (Rounded)':
      return (
        <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold bg-amber-950/30 px-2.5 py-1 rounded-lg text-xs">
          <AlertTriangle className="w-3.5 h-3.5" /> Match (Rounded)
        </span>
      );
    case 'Mismatch':
      return (
        <span className="inline-flex items-center gap-1.5 text-red-400 font-bold bg-red-950/30 px-2.5 py-1 rounded-lg text-xs">
          <XCircle className="w-3.5 h-3.5" /> Mismatch
        </span>
      );
    case 'Missing':
      return (
        <span className="inline-flex items-center gap-1.5 text-gray-500 font-bold bg-gray-800 px-2.5 py-1 rounded-lg text-xs">
          <HelpCircle className="w-3.5 h-3.5" /> Missing
        </span>
      );
    default:
      return <span className="text-xs font-medium text-gray-500">{status}</span>;
  }
};
