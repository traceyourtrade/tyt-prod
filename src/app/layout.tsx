import type { Metadata } from "next";
import "./globals.css";
import "@/lib/fontawesome";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { Inter } from "next/font/google";

const inter = Inter({
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    variable: "--font-inter",
})

export const metadata: Metadata = {
    title: "ProJournX | Professional Trading Journal",
    description:
        "ProJournX is your professional trading journal. Track performance, backtest strategies, review trades, and improve your trading with powerful analytics and insights.",
    icons: {
        icon: "/favicon.png",
    },
    keywords: [
        "trading journal",
        "professional trading journal",
        "trade analytics",
        "backtesting platform",
        "forex trading journal",
        "stock trading journal",
        "crypto trading journal",
        "performance tracking for traders",
        "ProJournX"
    ],
    authors: [{ name: "ProJournX Team" }],
    openGraph: {
        title: "ProJournX | Professional Trading Journal",
        description:
            "Professional trade journaling, backtesting, analytics, and performance tracking for traders.",
        siteName: "ProJournX",
        locale: "en_IN",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "ProJournX | Professional Trading Journal",
        description:
            "Professional trade journaling, backtesting, analytics, and insights — all in one platform.",
    },
    category: "Finance",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.variable}`}>
            <body>
                <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID || ""}>
                    {children}
                </GoogleOAuthProvider>
            </body>
        </html>
    );
}
