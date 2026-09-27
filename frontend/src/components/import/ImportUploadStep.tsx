import { useState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import type { Account, ColumnMapping } from '@/types/api';

import { FileDropzone } from './FileDropzone';

export interface UploadValues {
  file: File;
  accountId: string;
  invertSign: boolean;
  mapping?: ColumnMapping;
}

interface ImportUploadStepProps {
  accounts: Account[];
  error: string | null;
  // Suggested column names, shown when the server could not detect the columns
  mappingCandidates: string[] | null;
  submitting: boolean;
  onSubmit: (values: UploadValues) => void;
}

export function ImportUploadStep({
  accounts,
  error,
  mappingCandidates,
  submitting,
  onSubmit,
}: ImportUploadStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [invertSign, setInvertSign] = useState(false);
  const [mapping, setMapping] = useState<ColumnMapping>({ date: '', description: '', amount: '' });
  const [fileError, setFileError] = useState<string>();

  const needsMapping = mappingCandidates !== null;
  const mappingComplete = !needsMapping || (mapping.date && mapping.description && mapping.amount);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return setFileError('Escolha um arquivo');
    onSubmit({ file, accountId, invertSign, mapping: needsMapping ? mapping : undefined });
  };

  return (
    <form onSubmit={submit} noValidate className="flex max-w-xl flex-col gap-5">
      {error && <Alert>{error}</Alert>}

      <Select
        label="Importar para a conta"
        value={accountId}
        onChange={(event) => setAccountId(event.target.value)}
      >
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </Select>

      <FileDropzone
        file={file}
        onFile={(next) => {
          setFile(next);
          setFileError(undefined);
        }}
        error={fileError}
      />

      <label className="flex items-start gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={invertSign}
          onChange={(event) => setInvertSign(event.target.checked)}
          className="mt-0.5 size-4 accent-emerald-500"
        />
        <span>
          É fatura de cartão de crédito
          <span className="block text-xs text-zinc-500">
            Faturas costumam listar compras com valor positivo
          </span>
        </span>
      </label>

      {needsMapping && (
        <fieldset className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <legend className="px-1 text-sm font-medium text-zinc-200">
            Indique as colunas do arquivo
          </legend>
          <p className="text-xs text-zinc-500">
            Digite o nome da coluna exatamente como aparece no cabeçalho do CSV.
          </p>
          <datalist id="csv-columns">
            {mappingCandidates.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {(
            [
              ['date', 'Coluna da data'],
              ['description', 'Coluna da descrição'],
              ['amount', 'Coluna do valor'],
            ] as const
          ).map(([key, label]) => (
            <TextField
              key={key}
              label={label}
              list="csv-columns"
              autoComplete="off"
              value={mapping[key] ?? ''}
              onChange={(event) =>
                setMapping((current) => ({ ...current, [key]: event.target.value }))
              }
            />
          ))}
        </fieldset>
      )}

      <Button
        type="submit"
        loading={submitting}
        disabled={!accountId || !mappingComplete}
        className="self-start"
      >
        Analisar arquivo
      </Button>
    </form>
  );
}
