import { Html, Head, Body, Container, Text, Heading } from '@react-email/components';

interface Props {
  // TODO: define props
}

export default function CapaAssigned(_props: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <Container>
          <Heading>CAPA Assigned</Heading>
          <Text>TODO: implement template</Text>
        </Container>
      </Body>
    </Html>
  );
}
