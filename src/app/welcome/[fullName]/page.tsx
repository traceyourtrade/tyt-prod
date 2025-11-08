"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";

import { Poppins } from "next/font/google";
const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export default function HelloTextPage() {
    const router = useRouter();
    const params = useParams();

    // Decode the name from URL
    const name = decodeURIComponent(params.fullName as string);

    useEffect(() => {
        // Initialize AOS animations
        AOS.init({ offset: 200, duration: 1000, once: true });

        // Redirect to home after 3 seconds
        const timer = setTimeout(() => {
            router.push("/");
        }, 3000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen w-full bg-black text-white overflow-hidden ${poppins.className}`}>
            {/* Logo */}
            <Image
                src="/images/logoDark.png"
                width={100}
                height={100}
                alt="Logo"
                data-aos="fade-up"
                data-aos-duration="1000"
                className="w-24 md:w-28 h-auto relative -top-24"
            />

            {/* Greeting */}
            <h1
                data-aos="fade-up"
                data-aos-duration="2000"
                className="text-[41px] font-semibold relative -top-20 font-[SF Pro Display]"
            >
                Hello, {name}
            </h1>

            {/* Subtext */}
            <h2
                data-aos="fade-up"
                data-aos-duration="2500"
                className="text-[31px] text-gray-500 relative -top-22 font-[SF Pro Display]"
            >
                How are you doing today?
            </h2>
        </div>
    );
}
