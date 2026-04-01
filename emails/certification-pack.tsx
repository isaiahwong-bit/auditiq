import { Html, Head, Body, Container, Text, Heading, Link, Hr, Section } from '@react-email/components';

interface Props {
  siteName: string;
  organisationName: string;
  frameworkNames: string[];
  coveredCount: number;
  totalClauses: number;
  gapCount: number;
  plansCount: number;
  avgPassRate: number | null;
  reportUrl: string;
}

export default function CertificationPack({
  siteName = 'Example Site',
  organisationName = 'Example Org',
  frameworkNames = ['HACCP', 'BRCGS'],
  coveredCount = 30,
  totalClauses = 45,
  gapCount = 5,
  plansCount = 10,
  avgPassRate = 92.5,
  reportUrl = '#',
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: '-apple-system, sans-serif', padding: '20px', backgroundColor: '#f5f5f5' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '8px', padding: '32px' }}>
          <Heading style={{ color: '#1D9E75', fontSize: '24px', marginBottom: '8px' }}>
            Certification Evidence Package
          </Heading>
          <Text style={{ color: '#888780', fontSize: '14px', marginTop: 0 }}>
            {organisationName} &middot; {siteName}
          </Text>
          <Hr style={{ borderColor: '#E1F5EE', margin: '24px 0' }} />
          <Section>
            <Text style={{ fontSize: '14px', color: '#888780', marginBottom: '4px' }}>
              Active frameworks: <strong style={{ color: '#1a1a1a' }}>{frameworkNames.join(', ')}</strong>
            </Text>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#888780' }}>Clauses covered</td>
                <td style={{ padding: '8px 0', fontSize: '14px', fontWeight: 'bold', textAlign: 'right', color: '#1D9E75' }}>
                  {coveredCount} / {totalClauses}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#888780' }}>Plans in place</td>
                <td style={{ padding: '8px 0', fontSize: '14px', fontWeight: 'bold', textAlign: 'right', color: '#BA7517' }}>{plansCount}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#888780' }}>Unaddressed gaps</td>
                <td style={{ padding: '8px 0', fontSize: '14px', fontWeight: 'bold', textAlign: 'right', color: '#E24B4A' }}>{gapCount}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#888780' }}>Pre-op pass rate (30d)</td>
                <td style={{ padding: '8px 0', fontSize: '14px', fontWeight: 'bold', textAlign: 'right' }}>
                  {avgPassRate !== null ? `${avgPassRate.toFixed(1)}%` : 'N/A'}
                </td>
              </tr>
            </table>
          </Section>
          <Hr style={{ borderColor: '#e5e5e5', margin: '24px 0' }} />
          <Link
            href={reportUrl}
            style={{
              display: 'inline-block', backgroundColor: '#1D9E75', color: '#fff',
              padding: '12px 24px', borderRadius: '6px', fontSize: '14px',
              fontWeight: '600', textDecoration: 'none',
            }}
          >
            View Evidence Package
          </Link>
          <Text style={{ color: '#888780', fontSize: '12px', marginTop: '24px' }}>
            AuditArmour &middot; Food Safety Compliance Platform
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
