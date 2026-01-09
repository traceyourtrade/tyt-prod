import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Hr,
  Preview,
} from "@react-email/components";
import * as React from "react";

interface SupportConfirmationEmailProps {
  name: string;
  subject: string;
  message: string;
}

export default function SupportConfirmationEmail({
  name,
  subject,
  message,
}: SupportConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>We received your support request - ProJournX</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={gradientBar} />
          <Section style={content}>
            <Img
              src="https://www.projournx.com/images/logo-dark.png"
              alt="ProJournX Logo"
              height="40"
              style={logo}
            />
            <Text style={heading}>Thank you for contacting us!</Text>
            <Text style={greeting}>Hi {name},</Text>
            <Text style={description}>
              We've received your support request and will get back to you as
              soon as possible, typically within 24 hours.
            </Text>
            <Section style={quoteBox}>
              <Text style={quoteLabel}>Your message:</Text>
              <Text style={quoteSubject}>
                <strong>Subject:</strong> {subject}
              </Text>
              <Text style={quoteMessage}>{message}</Text>
            </Section>
            <Text style={infoText}>
              If you have any additional information to share, simply reply to
              this email.
            </Text>
            <Hr style={divider} />
            <Text style={signature}>
              Best regards,
              <br />
              <strong>The ProJournX Team</strong>
            </Text>
          </Section>
        </Container>
        <Section style={footer}>
          <Text style={footerText}>
            Need help? Contact{" "}
            <a href="mailto:support@projournx.com" style={footerLink}>
              support@projournx.com
            </a>
          </Text>
          <Text style={copyright}>© 2026 ProJournX. All rights reserved.</Text>
        </Section>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#040404",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: "60px 20px",
};

const container: React.CSSProperties = {
  maxWidth: "440px",
  margin: "0 auto",
  backgroundColor: "#0c0c0c",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "24px",
  overflow: "hidden",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
};

const gradientBar: React.CSSProperties = {
  height: "4px",
  background: "linear-gradient(90deg, #3b82f6, #10b981, #3b82f6)",
  backgroundColor: "#3b82f6",
};

const content: React.CSSProperties = {
  padding: "40px 32px",
  textAlign: "left" as const,
};

const logo: React.CSSProperties = {
  display: "block",
  margin: "0 auto 32px auto",
};

const heading: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: 700,
  margin: "0 0 24px 0",
  letterSpacing: "-0.5px",
  textAlign: "center" as const,
};

const greeting: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "15px",
  margin: "0 0 16px 0",
};

const description: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "15px",
  lineHeight: 1.6,
  margin: "0 0 24px 0",
};

const quoteBox: React.CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.03)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "12px",
  padding: "20px",
  margin: "0 0 24px 0",
};

const quoteLabel: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  fontWeight: 600,
  margin: "0 0 12px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const quoteSubject: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "14px",
  margin: "0 0 12px 0",
};

const quoteMessage: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "14px",
  lineHeight: 1.6,
  margin: 0,
  whiteSpace: "pre-wrap" as const,
};

const infoText: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "14px",
  lineHeight: 1.6,
  margin: "0 0 24px 0",
};

const divider: React.CSSProperties = {
  borderColor: "rgba(255, 255, 255, 0.05)",
  margin: "24px 0",
};

const signature: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "14px",
  lineHeight: 1.6,
  margin: 0,
};

const footer: React.CSSProperties = {
  textAlign: "center" as const,
  marginTop: "24px",
};

const footerText: React.CSSProperties = {
  color: "#52525b",
  fontSize: "12px",
  margin: 0,
};

const footerLink: React.CSSProperties = {
  color: "#3b82f6",
  textDecoration: "none",
};

const copyright: React.CSSProperties = {
  color: "#3f3f46",
  fontSize: "11px",
  margin: "8px 0 0 0",
};
