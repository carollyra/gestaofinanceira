import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router';

import { ImportResult } from '@/components/import/ImportResult';
import { ImportReviewStep } from '@/components/import/ImportReviewStep';
import { ImportStepper } from '@/components/import/ImportStepper';
import { ImportUploadStep, type UploadValues } from '@/components/import/ImportUploadStep';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/skeletons';
import { Alert } from '@/components/ui/Alert';
import { useConfirmImport, useImportPreview } from '@/hooks/useImport';
import { useAccounts, useCategories } from '@/hooks/useLookups';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/services/api';
import type { ImportPreview } from '@/types/api';
import { sniffHeaderCandidates } from '@/utils/csv-sniff';
import {
  buildConfirmRows,
  type CategoryOverrides,
  defaultSelection,
  shouldSkipDuplicates,
} from '@/utils/import-selection';
import { spring } from '@/utils/motion';

type Step = 'upload' | 'review' | 'done';

const STEP_INDEX = { upload: 0, review: 1, done: 2 } as const;

export function ImportPage() {
  const accounts = useAccounts();
  const categories = useCategories();
  const previewMutation = useImportPreview();
  const confirmMutation = useConfirmImport();
  const toast = useToast();

  const [step, setStep] = useState<Step>('upload');
  const [uploadKey, setUploadKey] = useState(0);
  const [upload, setUpload] = useState<UploadValues | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [overrides, setOverrides] = useState<CategoryOverrides>({});
  const [error, setError] = useState<string | null>(null);
  const [mappingCandidates, setMappingCandidates] = useState<string[] | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  const activeAccounts = (accounts.data ?? []).filter((a) => !a.archived);

  const analyze = async (values: UploadValues) => {
    setError(null);
    try {
      const data = await previewMutation.mutateAsync(values);
      setUpload(values);
      setPreview(data);
      setSelected(defaultSelection(data.rows));
      setOverrides({});
      setMappingCandidates(null);
      setStep('review');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Não foi possível analisar o arquivo.';
      setError(message);
      // Columns not recognized: offer the manual mapping, with names seen in the file
      if (err instanceof ApiError && err.status === 400 && /colunas/i.test(message)) {
        setMappingCandidates(await sniffHeaderCandidates(values.file));
      }
    }
  };

  const confirm = async () => {
    if (!preview || !upload) return;
    try {
      const response = await confirmMutation.mutateAsync({
        accountId: upload.accountId,
        rows: buildConfirmRows(preview.rows, selected, overrides),
        skipDuplicates: shouldSkipDuplicates(preview.rows, selected),
        // Kept on each transaction so its detail can show where it came from
        fileName: upload.file.name,
      });
      setResult(response);
      setStep('done');
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : 'Não foi possível importar. Nada foi gravado.',
        'error',
      );
    }
  };

  const restart = () => {
    setStep('upload');
    setPreview(null);
    setResult(null);
    setError(null);
    setMappingCandidates(null);
    setUploadKey((key) => key + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Importar extrato" subtitle="Traga as transações de um CSV do seu banco" />
      <ImportStepper current={STEP_INDEX[step]} />

      {accounts.isPending || categories.isPending ? (
        <Skeleton className="h-72 max-w-xl rounded-2xl" />
      ) : activeAccounts.length === 0 ? (
        <Alert>
          Cadastre uma conta antes de importar.{' '}
          <Link to="/contas" className="underline">
            Ir para contas
          </Link>
        </Alert>
      ) : (
        // Each step enters from the right, following the flow forward
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={spring}
          >
            {step === 'upload' && (
              <ImportUploadStep
                key={uploadKey}
                accounts={activeAccounts}
                error={error}
                mappingCandidates={mappingCandidates}
                submitting={previewMutation.isPending}
                onSubmit={(values) => void analyze(values)}
              />
            )}
            {step === 'review' && preview && (
              <ImportReviewStep
                preview={preview}
                categories={categories.data ?? []}
                selected={selected}
                overrides={overrides}
                submitting={confirmMutation.isPending}
                onToggle={(rowNumber, checked) =>
                  setSelected((current) => {
                    const next = new Set(current);
                    if (checked) next.add(rowNumber);
                    else next.delete(rowNumber);
                    return next;
                  })
                }
                onToggleMany={(rowNumbers, checked) =>
                  setSelected((current) => {
                    const next = new Set(current);
                    rowNumbers.forEach((n) => (checked ? next.add(n) : next.delete(n)));
                    return next;
                  })
                }
                onCategory={(rowNumbers, categoryId) =>
                  setOverrides((current) => ({
                    ...current,
                    ...Object.fromEntries(rowNumbers.map((n) => [n, categoryId])),
                  }))
                }
                onBack={() => setStep('upload')}
                onConfirm={() => void confirm()}
              />
            )}
            {step === 'done' && result && upload && (
              <ImportResult
                created={result.created}
                skipped={result.skipped}
                accountId={upload.accountId}
                onRestart={restart}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
