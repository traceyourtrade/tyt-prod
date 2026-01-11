import "../globals.css";

export const metadata = {
  title: "ProJournX - Trader Profile",
  description: "View trader performance and verified P&L",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className="bg-[#0a0a0a] text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
