
import React, { useState } from 'react';
import { ShieldCheck, FileSpreadsheet, FileText, Play, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { ExcelRow, AuditResult, FileData } from './types';
import { FileUpload } from './components/FileUpload';
import { AuditResultDetail } from './components/AuditResultDetail';
import { runAudit } from './services/geminiService';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [documents, setDocuments] = useState<FileData[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [results, setResults] = useState<AuditResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);

  const [excelLoading, setExcelLoading] = useState(false);
  const [excelMessage, setExcelMessage] = useState<{type: 'success'|'error'|'info', text: string} | null>(null);

  const [docLoading, setDocLoading] = useState(false);
  const [docMessage, setDocMessage] = useState<{type: 'success'|'error'|'info', text: string} | null>(null);

  const handleExcelUpload = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    setExcelLoading(true);
    setExcelMessage({ type: 'info', text: 'Parsing file...' });
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setExcelData(results.data as ExcelRow[]);
          setExcelMessage({ type: 'success', text: `Successfully loaded ${results.data.length} rows.` });
          setExcelLoading(false);
        },
        error: (err) => {
          setExcelMessage({ type: 'error', text: `Error parsing CSV: ${err.message}` });
          setExcelLoading(false);
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          setExcelData(json as ExcelRow[]);
          setExcelMessage({ type: 'success', text: `Successfully loaded ${json.length} rows.` });
        } catch (err: any) {
          setExcelMessage({ type: 'error', text: `Error parsing Excel file: ${err.message}` });
        } finally {
          setExcelLoading(false);
        }
      };
      reader.onerror = () => {
        setExcelMessage({ type: 'error', text: "Failed to read Excel file." });
        setExcelLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setExcelMessage({ type: 'error', text: "Unsupported file format. Please upload CSV or Excel (.xlsx, .xls)." });
      setExcelLoading(false);
    }
  };

  const handleDocUpload = async (files: FileList) => {
    setDocLoading(true);
    setDocMessage({ type: 'info', text: `Processing ${files.length} file(s)...` });
    try {
      const newDocs: FileData[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await fileToBase64(file);
        newDocs.push({
          name: file.name,
          type: file.type,
          base64
        });
      }
      setDocuments(prev => {
        const updated = [...prev, ...newDocs];
        setDocMessage({ type: 'success', text: `Successfully loaded ${updated.length} document(s).` });
        return updated;
      });
    } catch (err: any) {
      setDocMessage({ type: 'error', text: `Error processing documents: ${err.message}` });
    } finally {
      setDocLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const startAudit = async () => {
    if (excelData.length === 0 || documents.length === 0) {
      setError("Please upload both the summary sheet and at least one document.");
      return;
    }

    setIsAuditing(true);
    setError(null);
    setResults([]);
    setSelectedResultIndex(-1);

    try {
      await runAudit(excelData, documents, (currentResult) => {
         setResults(prev => {
           const newResults = [...prev, currentResult];
           if (newResults.length === 1) setSelectedResultIndex(0);
           return newResults;
         });
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during the audit.");
    } finally {
      setIsAuditing(false);
    }
  };

  const activeResult = selectedResultIndex >= 0 ? results[selectedResultIndex] : null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-50">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight text-gray-50">AuditPro <span className="text-gray-500 font-normal">| Document Auditor</span></h1>
          </div>
          <button
            onClick={startAudit}
            disabled={isAuditing || excelData.length === 0 || documents.length === 0}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
              isAuditing || excelData.length === 0 || documents.length === 0
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-900/50 active:scale-95'
            }`}
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Auditing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Audit
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-950 border border-red-700 text-red-400 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Uploads */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h2 className="font-semibold text-gray-50">1. Summary Sheet</h2>
              </div>
              <FileUpload
                id="excel-upload"
                accept=".csv,.xlsx,.xls"
                onChange={handleExcelUpload}
                label={excelData.length > 0 ? `${excelData.length} Rows Loaded` : "Upload CSV / Excel"}
                description="Upload the master list of transactions."
                isLoaded={excelData.length > 0}
                isLoading={excelLoading}
                message={excelMessage}
              />
            </div>

            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-50">2. Source Documents</h2>
              </div>
              <FileUpload
                id="doc-upload"
                accept=".pdf,image/*"
                multiple
                onChange={handleDocUpload}
                label={documents.length > 0 ? `${documents.length} Files Ready` : "Upload Invoices/BEs"}
                description="Upload PDF or Images of documents."
                isLoaded={documents.length > 0}
                isLoading={docLoading}
                message={docMessage}
              />
              {documents.length > 0 && (
                 <div className="mt-4 max-h-48 overflow-y-auto space-y-1">
                   {documents.slice(0, 10).map((doc, idx) => (
                     <div key={idx} className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded truncate">
                        {doc.name}
                     </div>
                   ))}
                   {documents.length > 10 && <div className="text-xs text-gray-500 text-center italic">+{documents.length - 10} more...</div>}
                 </div>
              )}
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-8">
            {/* Audit Results List */}
            {results.length > 0 && (
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-sm mb-6">
                <h2 className="font-semibold text-gray-50 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Audit Results
                </h2>
                <div className="max-h-[500px] overflow-y-auto pr-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedResultIndex(index)}
                      className={`flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer transition-colors\n                        ${selectedResultIndex === index ? 'bg-indigo-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-200'}`}
                    >
                      <span className="font-medium">Row {result.rowNumber}: {result.status === 'Pass' ? 'Passed' : 'Failed'}</span>
                      {result.status === 'Pass' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Result Detail */}
            {activeResult && (
              <AuditResultDetail result={activeResult} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          Made by Pravin
        </div>
      </footer>
    </div>
  );
};

export default App;
