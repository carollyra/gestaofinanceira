import { FileSpreadsheet, UploadCloud, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { cn } from '@/utils/cn';
import { MAX_CSV_BYTES } from '@/utils/import-selection';

interface FileDropzoneProps {
  file: File | null;
  onFile: (file: File | null) => void;
  error?: string;
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Drag and drop is a shortcut; the button (and the hidden native input behind
// it) is the accessible path and works everywhere, including phones
export function FileDropzone({ file, onFile, error }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const accept = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!/\.(csv|txt)$/i.test(candidate.name)) {
      setLocalError('Escolha um arquivo .csv');
      return;
    }
    if (candidate.size > MAX_CSV_BYTES) {
      setLocalError('O arquivo passa de 2 MB');
      return;
    }
    setLocalError(null);
    onFile(candidate);
  };

  const message = localError ?? error;

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${inputId}-label`} className="text-sm font-medium text-zinc-200">
        Arquivo do extrato
      </span>
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3">
          <FileSpreadsheet aria-hidden className="size-8 shrink-0 text-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-zinc-100">{file.name}</p>
            <p className="text-xs text-zinc-500">{formatSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onFile(null)}
            aria-label={`Remover ${file.name}`}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            accept(event.dataTransfer.files[0]);
          }}
          className={cn(
            'flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors',
            dragging ? 'border-emerald-400 bg-emerald-400/5' : 'border-zinc-700 bg-zinc-900/60',
          )}
        >
          <UploadCloud aria-hidden className="size-8 text-zinc-500" />
          <p className="text-sm text-zinc-300">Arraste o CSV aqui ou</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-describedby={`${inputId}-hint`}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            Escolher arquivo
          </button>
          <p id={`${inputId}-hint`} className="text-xs text-zinc-500">
            CSV exportado do seu banco, até 2 MB
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".csv,.txt,text/csv"
        aria-labelledby={`${inputId}-label`}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          accept(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      {message && <p className="text-sm text-red-400">{message}</p>}
    </div>
  );
}
