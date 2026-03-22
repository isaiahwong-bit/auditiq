import { PageHeader } from '../../components/ui/PageHeader';
import { useOrg } from '../../hooks/use-org';

export default function OrgDashboard() {
  const { org } = useOrg();

  return (
    <div>
      <PageHeader
        title={org?.name ?? 'Dashboard'}
        description="Organisation overview"
      />
      <div className="p-6 md:p-8">
        <p className="text-sm text-brand-gray">Organisation dashboard content will go here.</p>
      </div>
    </div>
  );
}
