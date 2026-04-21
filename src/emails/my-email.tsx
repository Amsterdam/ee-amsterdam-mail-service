import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Img,
  Link,
  Markdown,
  Preview,
  Section,
  Text,
} from 'react-email';
import * as React from 'react';

interface EmailProps {
  title: string;
  previewText: string;
  bodyText: string;
  imageSrc: string;
}

export default function Email(props: EmailProps) {
  return (
    <Html>
      <Head>
        <title>{props.title}</title>
      </Head>
      <Body>
        <Preview>{props.previewText}</Preview>
        <Container>
          {/* Header */}
          <Section>
            <Img
              src={props.imageSrc}
              width="115"
              height="40"
              alt="Gemeente Amsterdam Logo"
            />
          </Section>
          {/* Body */}
          <Section>
            <Heading>{props.title}</Heading>
            <Markdown>{props.bodyText}</Markdown>
          </Section>
          <Hr />
          {/* Disclaimer */}
          <Section>
            <Text>Disclaimer teksten zijn altijd superleuk om te lezen!</Text>
          </Section>
          {/* Footer */}
          <Text>
            <Link href="https://amsterdam.nl/">Amsterdam.nl</Link>
          </Text>
          <Text>
            <Link href="tel:14020">14020</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

Email.PreviewProps = {
  title: 'My Email Title',
  previewText: 'A nice preview text for mail clients',
  bodyText: 'A quick brown fox jumps over the lazy dog.',
  imageSrc: process.env.APP_BASE_URL
    ? `${process.env.APP_BASE_URL}/amsterdam-logo.png`
    : '/amsterdam-logo.png',
};
