import { PageHeader } from '../../components/ui/PageHeader';
import { useOrg } from '../../hooks/use-org';

export default function OrgDashboard() {
  const { org } = useOrg();

  return (
    <div className="bg-transparent">
      <PageHeader
        title={org?.name ?? 'Dashboard'}
        description="Organisation overview"
      />
      <div className="p-6 md:p-8">
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl p-6 shadow-sm border border-white/20 dark:bg-white/5 dark:border-white/10">
          <p className="text-sm text-gray-500 dark:text-gray-400">Organisation dashboard content will go here.</p>
        </div>
      </div>
    </div>
  );
}
