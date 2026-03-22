import { Html, Head, Body, Container, Text, Heading } from '@react-email/components';

interface Props {
  // TODO: define props
}

export default function CapaOverdue(_props: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <Container>
          <Heading>CAPA Overdue</Heading>
          <Text>TODO: implement template</Text>
        </Container>
      </Body>
    </Html>
  );
}
