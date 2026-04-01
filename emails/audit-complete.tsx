import { Html, Head, Body, Container, Text, Heading, Link, Hr, Section } from '@react-email/components';

interface Props {
  siteName: string;
  auditType: string;
  overallScore: number | null;
  findingCount: number;
  completedDate: string;
  reportUrl: string;
}

export default function AuditComplete({
  siteName = 'Example Site',
  auditType = 'internal',
  overallScore = 85,
  findingCount = 3,
  completedDate = '22 Mar 2026',
  reportUrl = '#',
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: '-apple-system, sans-serif', padding: '20px', backgroundColor: '#f5f5f5' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '8px', padding: '32px' }}>
          <Heading style={{ color: '#1D9E75', fontSize: '24px', marginBottom: '8px' }}>
            Audit Complete
          </Heading>
          <Text style={{ color: '#888780', fontSize: '14px', marginTop: 0 }}>
            {siteName} &middot; {auditType} audit
          </Text>
          <Hr style={{ borderColor: '#E1F5EE', margin: '24px 0' }} />
          <Section>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#888780' }}>Score</td>
                <td style={{ padding: '8px 0', fontSize: '14px', fontWeight: 'bold', textAlign: 'right' }}>
                  {overallScore !== null ? `${overallScore}%` : 'N/A'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#888780' }}>Findings</td>
                <td style={{ padding: '8px 0', fontSize: '14px', fontWeight: 'bold', textAlign: 'right' }}>{findingCount}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#888780' }}>Completed</td>
                <td style={{ padding: '8px 0', fontSize: '14px', textAlign: 'right' }}>{completedDate}</td>
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
            View Report
          </Link>
          <Text style={{ color: '#888780', fontSize: '12px', marginTop: '24px' }}>
            AuditArmour &middot; Food Safety Compliance Platform
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
