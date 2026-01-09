import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Preview,
} from "@react-email/components";
import * as React from "react";

interface PasswordResetEmailProps {
  resetUrl: string;
}

export default function PasswordResetEmail({
  resetUrl,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password - ProJournX</Preview>
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
            <Text style={heading}>Reset Your Password</Text>
            <Text style={description}>
              You requested to reset your password. Click the button below to
              set a new password. This link will expire in 1 hour.
            </Text>
            <Button href={resetUrl} style={button}>
              Reset Password
            </Button>
            <Section style={divider} />
            <Text style={footerNote}>
              Didn't request this? No worries, you can safely ignore this email.
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
  textAlign: "center" as const,
};

const logo: React.CSSProperties = {
  display: "block",
  margin: "0 auto 32px auto",
};

const heading: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: 700,
  margin: "0 0 16px 0",
  letterSpacing: "-0.5px",
};

const description: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "15px",
  lineHeight: 1.6,
  margin: "0 0 32px 0",
};

const button: React.CSSProperties = {
  display: "inline-block",
  width: "100%",
  maxWidth: "280px",
  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  padding: "16px 0",
  borderRadius: "14px",
  fontWeight: 600,
  textDecoration: "none",
  fontSize: "16px",
  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
  textAlign: "center" as const,
};

const divider: React.CSSProperties = {
  marginTop: "40px",
  paddingTop: "24px",
  borderTop: "1px solid rgba(255, 255, 255, 0.05)",
};

const footerNote: React.CSSProperties = {
  color: "#52525b",
  fontSize: "13px",
  lineHeight: 1.5,
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
