import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/ui/PageHeader';

const ADMIN_SECRET = ''; // Entered via form, not stored

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-4 text-xl font-bold text-gray-900">AuditIQ Admin</h1>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin secret"
            className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={() => {
              if (secret) setAuthenticated(true);
            }}
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="AuditIQ Admin" description="Platform administration" />
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-gray">
            Organisations
          </h2>
          {!orgs?.length ? (
            <p className="text-sm text-brand-gray">No organisations yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium text-brand-gray">Name</th>
                    <th className="px-4 py-2 text-left font-medium text-brand-gray">Slug</th>
                    <th className="px-4 py-2 text-left font-medium text-brand-gray">Plan</th>
                    <th className="px-4 py-2 text-left font-medium text-brand-gray">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orgs.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{org.name}</td>
                      <td className="px-4 py-2 text-brand-gray">{org.slug}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            org.plan === 'enterprise'
                              ? 'bg-brand-green-light text-brand-green'
                              : org.plan === 'professional'
                                ? 'bg-brand-blue-light text-brand-blue'
                                : 'bg-brand-gray-light text-brand-gray'
                          }`}
                        >
                          {org.plan}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-brand-gray">
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
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-brand-gray">{label}</p>
    </div>
  );
}
