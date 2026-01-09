import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface EmailLayoutProps {
  children: React.ReactNode;
  preview?: string;
}

export default function EmailLayout({ children, preview }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      {preview && <span style={{ display: "none" }}>{preview}</span>}
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
            {children}
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
