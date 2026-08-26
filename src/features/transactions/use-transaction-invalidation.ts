import { useQueryClient } from '@tanstack/react-query';
export function useTransactionInvalidation() {
  const client = useQueryClient();
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['transactions'] }),
      client.invalidateQueries({ queryKey: ['accounts'] }),
      client.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  };
}
