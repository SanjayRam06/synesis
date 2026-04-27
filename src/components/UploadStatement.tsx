import React, { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadStatementProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export default function UploadStatement({ onUpload, isUploading }: UploadStatementProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const allowedTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel'];
      const isCSV = droppedFile.name.toLowerCase().endsWith('.csv');
      if (droppedFile.type === 'application/pdf' || isCSV) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a PDF or CSV file.');
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) return;
    try {
      await onUpload(file);
      setFile(null);
    } catch (err) {
      setError('Upload failed. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Upload Statement</h2>
        <p className="text-slate-500 mt-1">Import your bank statements (PDF or CSV) to analyze your spending.</p>
      </header>

      <div className="bg-white rounded-[2rem] border border-slate-200 p-10 shadow-sm">
        {!file ? (
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all ${
              dragActive 
                ? 'border-accent bg-accent/5' 
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-accent">
              <Upload size={32} />
            </div>
            <p className="text-lg font-semibold text-slate-800 mb-2">
              Drag and drop your statement (PDF or CSV)
            </p>
            <p className="text-sm text-slate-500 mb-8">
              Supports standard bank formats and CSV exports.
            </p>
            
            <label className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium cursor-pointer hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
              Select File
              <input type="file" className="hidden" accept=".pdf,.csv" onChange={handleChange} />
            </label>
            
            {error && (
              <div className="mt-6 flex items-center gap-2 text-danger text-sm font-medium">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-slate-100 rounded-2xl p-8 bg-slate-50/50"
          >
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-accent">
                <FileText size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-slate-800 truncate">{file.name}</p>
                <p className="text-sm text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {file.name.toLowerCase().endsWith('.csv') ? 'CSV Data' : 'PDF Document'}
                </p>
              </div>
              <button 
                onClick={() => setFile(null)} 
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleUploadSubmit}
                disabled={isUploading}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                  isUploading 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-accent text-white hover:shadow-xl hover:shadow-accent/20 active:scale-[0.98]'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing Statement with Gemini...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Confirm and Import
                  </>
                )}
              </button>
              
              {!isUploading && (
                <p className="text-center text-xs text-slate-400 font-medium">
                  By importing, you agree to our data processing terms.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Helpful Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 flex gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-1">Privacy First</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Statements are processed securely. We don't store your PDFs, only the transactions.
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 flex gap-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-1">AI Categorization</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Gemini automatically tags your transactions into categories for better insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
