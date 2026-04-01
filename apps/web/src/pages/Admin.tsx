import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/ui/PageHeader';

interface PlatformStats {
  organisations: number;
  sites: number;
  users: number;
  audits: number;
  open_capas: number;
}

interface AdminOrg {
  id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
}

export default function Admin() {
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const headers = { 'x-admin-secret': secret };

  const { data: stats } = useQuery<PlatformStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats', { headers });
      if (!res.ok) throw new Error('Unauthorized');
      const json = await res.json();
      return json.data;
    },
    enabled: authenticated,
  });

  const { data: orgs } = useQuery<AdminOrg[]>({
    queryKey: ['admin', 'organisations'],
    queryFn: async () => {
      const res = await fetch('/api/admin/organisations', { headers });
      if (!res.ok) throw new Error('Unauthorized');
      const json = await res.json();
      return json.data;
    },
    enabled: authenticated,
  });

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="w-full max-w-sm rounded-2xl bg-white/70 backdrop-blur-xl p-8 shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
          <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">AuditArmour Admin</h1>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin secret"
            className="mb-4 w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-white/5 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-700"
          />
          <button
            onClick={() => {
              if (secret) setAuthenticated(true);
            }}
            className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <PageHeader title="AuditArmour Admin" description="Platform administration" />
      <div className="p-6 md:p-8">
        {/* Platform stats */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard label="Organisations" value={stats.organisations} />
            <StatCard label="Sites" value={stats.sites} />
            <StatCard label="Users" value={stats.users} />
            <StatCard label="Audits" value={stats.audits} />
            <StatCard label="Open CAPAs" value={stats.open_capas} />
          </div>
        )}

        {/* Organisation list */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Organisations
          </h2>
          {!orgs?.length ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No organisations yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white/70 backdrop-blur-xl shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100/50 dark:border-white/5">
                    <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Slug</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Plan</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/50 dark:divide-white/5">
                  {orgs.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{org.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{org.slug}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            org.plan === 'enterprise'
                              ? 'bg-emerald-50/80 text-brand-green dark:bg-emerald-500/10 dark:text-emerald-400'
                              : org.plan === 'professional'
                                ? 'bg-blue-50/80 text-brand-blue dark:bg-blue-500/10 dark:text-blue-400'
                                : 'bg-gray-100/80 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                          }`}
                        >
                          {org.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                        {new Date(org.created_at).toLocaleDateString('en-AU')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-xl p-4 text-center shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
