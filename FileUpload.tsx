
import React from 'react';
import { Upload, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  id: string;
  accept: string;
  multiple?: boolean;
  onChange: (files: FileList) => void;
  label: string;
  description: string;
  isLoaded: boolean;
  isLoading?: boolean;
  message?: { type: 'success' | 'error' | 'info', text: string } | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ id, accept, multiple, onChange, label, description, isLoaded, isLoading, message }) => {
  return (
    <div className="relative group">
      <input
        type="file"
        id={id}
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => e.target.files && onChange(e.target.files)}
        disabled={isLoading}
      />
      <label
        htmlFor={id}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all ${
          isLoading ? 'cursor-not-allowed border-indigo-500/50 bg-indigo-950/20' :
          isLoaded 
            ? 'cursor-pointer border-emerald-700 bg-emerald-950/20' 
            : 'cursor-pointer border-gray-800 bg-gray-900 hover:bg-gray-800 hover:border-indigo-600'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-10 h-10 text-indigo-500 mb-2 animate-spin" />
        ) : isLoaded ? (
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
        ) : (
          <Upload className="w-10 h-10 text-gray-500 mb-2 group-hover:text-indigo-500" />
        )}
        <span className={`font-semibold ${isLoading ? 'text-indigo-400' : isLoaded ? 'text-emerald-400' : 'text-gray-50'}`}>{label}</span>
        <span className="text-xs text-gray-500 mt-1">{description}</span>
      </label>
      {message && (
        <div className={`mt-3 text-xs flex items-center gap-1.5 ${
          message.type === 'error' ? 'text-red-400' : 
          message.type === 'success' ? 'text-emerald-400' : 'text-indigo-400'
        }`}>
          {message.type === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
          {message.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
          {message.text}
        </div>
      )}
    </div>
  );
};
