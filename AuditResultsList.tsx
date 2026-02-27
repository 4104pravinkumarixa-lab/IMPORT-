
import React from 'react';
import { AuditResult } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

interface AuditResultsListProps {
  results: AuditResult[];
  isAuditing: boolean;
}

export const AuditResultsList: React.FC<AuditResultsListProps> = ({ results, isAuditing }) => {
  return (
    <div className="divide-y divide-gray-800">
      {results.map((result, idx) => (
        <div key={idx} className="p-6 hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-50 text-lg">
                {result.partyName}
              </h3>
              <p className="text-sm text-gray-500">
                Invoice No: <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded text-gray-200">{result.invoiceNo}</span>
                <span className="mx-2 text-gray-700">|</span>
                Matched Document: <span className="italic text-gray-400">{result.documentMatched}</span>
              </p>
            </div>
            <div className="px-3 py-1 bg-gray-900 border border-gray-800 rounded-full text-xs font-semibold shadow-sm text-gray-400">
              {result.fields.length} Fields Audited
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-800 border-b border-gray-700 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Excel Field Name</th>
                  <th className="px-4 py-3">Excel Value</th>
                  <th className="px-4 py-3">PDF Value</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-900">
                {result.fields.map((field, fIdx) => (
                  <tr key={fIdx}>
                    <td className="px-4 py-3 font-medium text-gray-50">{field.fieldName}</td>
                    <td className="px-4 py-3 text-gray-300 font-mono text-xs">{field.excelValue || '-'}</td>
                    <td className="px-4 py-3 text-gray-300 font-mono text-xs">{field.pdfValue || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <StatusBadge status={field.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {result.summary && (
            <div className="mt-4 p-3 bg-indigo-950/40 border border-indigo-900/50 rounded-lg text-xs text-indigo-200 leading-relaxed">
              <strong>AI Analysis:</strong> {result.summary}
            </div>
          )}
        </div>
      ))}
      {isAuditing && (
        <div className="p-12 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
          <p className="font-medium">Comparing documents with Excel data...</p>
          <p className="text-xs">Processing batch using Gemini AI</p>
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Match':
      return (
        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" /> Match
        </span>
      );
    case 'Match (Rounded)':
      return (
        <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
          <AlertTriangle className="w-3.5 h-3.5" /> Match (Rounded)
        </span>
      );
    case 'Mismatch':
      return (
        <span className="inline-flex items-center gap-1 text-red-400 font-bold">
          <XCircle className="w-3.5 h-3.5" /> Mismatch
        </span>
      );
    case 'Missing':
      return (
        <span className="inline-flex items-center gap-1 text-gray-500 font-bold">
          <HelpCircle className="w-3.5 h-3.5" /> Missing
        </span>
      );
    default:
      return <span className="text-gray-500">{status}</span>;
  }
};
