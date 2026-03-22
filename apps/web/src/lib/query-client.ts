import { QueryClient } from '@tanstack/react-query';

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: DEMO_MODE ? false : 1,
    },
  },
});
