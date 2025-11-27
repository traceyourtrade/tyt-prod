import type { Metadata } from "next";
import "./globals.css";
import "@/lib/fontawesome";
import { GoogleOAuthProvider } from "@react-oauth/google";

export const metadata: Metadata = {

    title: "Trace Your Trade | India's #1 Automated Trading Journal",
    description:
        "Trace Your Trade is India's only #1 automated trading journal. Automate trade syncing, track performance, backtest strategies, review trades, and join a strong community of active traders. Turn market moves into money-making insights with automation.",
    icons: {
        icon: "/favicon.png",
    },
    keywords: [
        "trading journal India",
        "automated trading journal",
        "trade analytics",
        "backtesting platform",
        "forex trading journal",
        "stock trading journal",
        "crypto trading journal",
        "performance tracking for traders",
        "trading community India",
        "Trace Your Trade"
    ],
    authors: [{ name: "TraceYourTrade Team", url: "https://traceyourtrade.com" }],
    openGraph: {
        title: "Trace Your Trade | India's #1 Automated Trading Journal",
        description:
            "Automated trade journaling, backtesting, analytics, and performance tracking for traders. Join India's fastest growing trading community.",
        url: "https://traceyourtrade.com",
        siteName: "Trace Your Trade",
        locale: "en_IN",
        type: "website",
        images: [
            {
                url: "https://traceyourtrade.com/images/og-image.png",
                width: 1200,
                height: 630,
                alt: "Trace Your Trade - Automated Trading Journal",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Trace Your Trade | India's #1 Automated Trading Journal",
        description:
            "Turn market moves into money-making insights with automation! Trade journaling, backtesting, analytics, and community — all in one platform.",
        creator: "@traceyourtrade", // replace with actual Twitter handle if you have one
        images: ["https://traceyourtrade.com/images/og-image.png"],
    },
    category: "Finance",
    alternates: {
        canonical: "https://traceyourtrade.com",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID||""}>   
                {children}
                </GoogleOAuthProvider>
            </body>
        </html>
    );
}
