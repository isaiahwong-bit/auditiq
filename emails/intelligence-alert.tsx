import { Html, Head, Body, Container, Text, Heading } from '@react-email/components';

interface Props {
  // TODO: define props
}

export default function IntelligenceAlert(_props: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <Container>
          <Heading>Intelligence Alert</Heading>
          <Text>TODO: implement template</Text>
        </Container>
      </Body>
    </Html>
  );
}
