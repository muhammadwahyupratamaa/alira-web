import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AppLayout } from '../dashboard/app-layout';
import { createAccount } from './account.api';
import { getAccountErrorMessage } from './account-error';
import { AccountForm } from './account-form';
import type { AccountFormValues } from './account.schemas';

export function CreateAccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: createAccount,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      await navigate('/accounts', {
        replace: true,
        state: { success: 'Account berhasil ditambahkan.' },
      });
    },
    onError: (error) => {
      setServerError(getAccountErrorMessage(error));
    },
  });
  async function submit(values: AccountFormValues) {
    setServerError(null);
    await mutation.mutateAsync(values).catch(() => undefined);
  }

  return (
    <AppLayout>
      <main className="dashboard-content account-form-page">
        <Link className="back-link" to="/accounts">
          ← Kembali ke Account
        </Link>
        <section
          className="account-form-card"
          aria-labelledby="create-account-title"
        >
          <p className="section-kicker">Account baru</p>
          <h1 id="create-account-title">Tambah account</h1>
          <p>Catat tempat uangmu tersimpan dan saldo awal yang akurat.</p>
          <AccountForm
            isSubmitting={mutation.isPending}
            serverError={serverError}
            onSubmit={submit}
          />
        </section>
      </main>
    </AppLayout>
  );
}
