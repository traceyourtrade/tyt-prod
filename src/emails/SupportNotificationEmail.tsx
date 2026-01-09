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

interface SupportNotificationEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
}

export default function SupportNotificationEmail({
  name,
  email,
  subject,
  message,
  timestamp,
}: SupportNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New Support Request from {name}</Preview>
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
            <Text style={heading}>New Support Request</Text>
            <Section style={detailsBox}>
              <Text style={detailRow}>
                <span style={detailLabel}>From:</span>
                <span style={detailValue}>{name}</span>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>Email:</span>
                <span style={detailValue}>{email}</span>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>Subject:</span>
                <span style={detailValue}>{subject}</span>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>Received:</span>
                <span style={detailValue}>{timestamp}</span>
              </Text>
            </Section>
            <Section style={quoteBox}>
              <Text style={quoteLabel}>Message:</Text>
              <Text style={quoteMessage}>{message}</Text>
            </Section>
            <Hr style={divider} />
            <Text style={footerNote}>
              Reply directly to this email to respond to the user at {email}
            </Text>
          </Section>
        </Container>
        <Section style={footer}>
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
  maxWidth: "500px",
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

const detailsBox: React.CSSProperties = {
  backgroundColor: "rgba(59, 130, 246, 0.08)",
  border: "1px solid rgba(59, 130, 246, 0.2)",
  borderRadius: "12px",
  padding: "20px",
  margin: "0 0 24px 0",
};

const detailRow: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "14px",
  margin: "0 0 8px 0",
  lineHeight: 1.5,
};

const detailLabel: React.CSSProperties = {
  color: "#71717a",
  fontWeight: 600,
  marginRight: "8px",
};

const detailValue: React.CSSProperties = {
  color: "#ffffff",
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

const quoteMessage: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "14px",
  lineHeight: 1.6,
  margin: 0,
  whiteSpace: "pre-wrap" as const,
};

const divider: React.CSSProperties = {
  borderColor: "rgba(255, 255, 255, 0.05)",
  margin: "24px 0",
};

const footerNote: React.CSSProperties = {
  color: "#52525b",
  fontSize: "13px",
  lineHeight: 1.5,
  margin: 0,
  textAlign: "center" as const,
};

const footer: React.CSSProperties = {
  textAlign: "center" as const,
  marginTop: "24px",
};

const copyright: React.CSSProperties = {
  color: "#3f3f46",
  fontSize: "11px",
  margin: 0,
};
