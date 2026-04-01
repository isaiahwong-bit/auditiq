import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../hooks/use-auth';
import { useOrg } from '../../hooks/use-org';
import {
  useSubscriptionStatus,
  useCreateCheckout,
  useCreatePortalSession,
} from '../../hooks/use-billing';

const planDetails: Record<string, { name: string; price: string; features: string[] }> = {
  starter: {
    name: 'Starter',
    price: '$1,800/mo',
    features: ['1 site', '20 audits/mo', '5 areas max', 'Basic pre-op checks'],
  },
  professional: {
    name: 'Professional',
    price: '$2,800/mo',
    features: [
      '1 site', 'Unlimited audits', 'Document ingestion + AI',
      'Framework mapping', 'Predictive alerts', 'Certification packages',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: '$4,500/mo',
    features: [
      'Up to 5 sites', 'Everything in Professional',
      'Multi-site dashboard', 'Cross-site benchmarking', 'API access',
    ],
  },
};

export default function OrgSettings() {
  const { profile } = useAuth();
  const { org } = useOrg();
  const { data: billing, isLoading, isError } = useSubscriptionStatus();
  const createCheckout = useCreateCheckout();
  const createPortal = useCreatePortalSession();

  const currentPlan = billing?.plan ?? 'starter';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'qa_manager';

  const handleUpgrade = async (plan: string) => {
    try {
      const result = await createCheckout.mutateAsync({
        plan,
        success_url: `${window.location.origin}${window.location.pathname}?billing=success`,
        cancel_url: `${window.location.origin}${window.location.pathname}?billing=cancel`,
      });
      window.location.href = result.checkout_url;
    } catch {
      // Stripe not configured in demo
    }
  };

  const handleManageBilling = async () => {
    try {
      const result = await createPortal.mutateAsync(window.location.href);
      window.location.href = result.portal_url;
    } catch {
      // Stripe not configured in demo
    }
  };

  return (
    <div className="bg-transparent">
      <PageHeader title="Organisation Settings" description="Manage billing, users, and preferences" />
      <div className="p-6 md:p-8">
        {/* Organisation Info */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Organisation
          </h2>
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl p-5 shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                  {org?.name ?? 'Organisation'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Slug</dt>
                <dd className="mt-0.5 font-mono text-sm text-gray-600 dark:text-gray-300">
                  {org?.slug ?? '\u2014'}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Billing Section */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Billing & Plan
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              <div className="h-20 animate-pulse rounded-2xl bg-gray-100/50 dark:bg-white/5" />
              <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100/50 dark:bg-white/5" />
                ))}
              </div>
            </div>
          ) : isError ? (
            <div className="rounded-2xl bg-amber-50/50 backdrop-blur-xl p-5 border border-amber-200/50 dark:bg-amber-500/10 dark:border-amber-500/20">
              <p className="text-sm text-brand-amber">
                Unable to load billing information. Connect to the API to manage your subscription.
              </p>
            </div>
          ) : (
            <>
              {/* Current plan */}
              <div className="mb-6 rounded-2xl bg-white/70 backdrop-blur-xl p-5 shadow-sm border border-emerald-200/50 dark:bg-white/5 dark:border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Current plan: <strong>{planDetails[currentPlan]?.name ?? currentPlan}</strong>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {billing?.status === 'active' ? 'Active' : billing?.status ?? 'No subscription'}
                      {billing?.current_period_end &&
                        ` \u00b7 Renews ${new Date(billing.current_period_end).toLocaleDateString('en-AU')}`}
                    </p>
                    {billing?.limits && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {billing.limits.site_limit} site(s),{' '}
                        {billing.limits.audit_limit === null ? 'unlimited' : billing.limits.audit_limit} audits/mo
                      </p>
                    )}
                  </div>
                  {isAdmin && billing?.status === 'active' && (
                    <button
                      onClick={handleManageBilling}
                      disabled={createPortal.isPending}
                      className="rounded-xl border border-gray-200 bg-white/50 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50/50 disabled:opacity-50 transition-colors dark:border-gray-700 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                    >
                      Manage Billing
                    </button>
                  )}
                </div>
              </div>

              {/* Plan cards */}
              {isAdmin && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {Object.entries(planDetails).map(([key, plan]) => {
                    const isCurrent = key === currentPlan;
                    return (
                      <div
                        key={key}
                        className={`rounded-2xl p-5 shadow-sm border backdrop-blur-xl ${
                          isCurrent
                            ? 'bg-white/70 border-emerald-200/50 dark:bg-white/5 dark:border-emerald-500/20'
                            : 'bg-white/70 border-white/20 dark:bg-white/5 dark:border-white/10'
                        }`}
                      >
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                        <p className="mb-3 text-lg font-bold text-gray-900 dark:text-white">{plan.price}</p>
                        <ul className="mb-4 space-y-1.5">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                              <svg className="h-3 w-3 shrink-0 text-brand-green" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {f}
                            </li>
                          ))}
                        </ul>
                        {isCurrent ? (
                          <span className="block rounded-xl bg-emerald-50/80 px-4 py-2 text-center text-xs font-medium text-brand-green dark:bg-emerald-500/10">
                            Current Plan
                          </span>
                        ) : (
                          <button
                            onClick={() => handleUpgrade(key)}
                            disabled={createCheckout.isPending}
                            className="w-full rounded-xl bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                          >
                            Upgrade
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        {/* Team section placeholder */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Team Members
          </h2>
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl p-6 text-center shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Team management will be available here. Invite QA managers, auditors, and operators.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
