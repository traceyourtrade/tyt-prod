import "../globals.css";

export const metadata = {
  title: "Trading Journal - Shared Trade",
  description: "View shared trade details and provide feedback",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
