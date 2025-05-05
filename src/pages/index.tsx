"use client";

import { Geist, Geist_Mono } from "next/font/google";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 👇 Carga dinámica de RoutingMap SOLO en cliente
const RoutingMap = dynamic(() => import("@/components/RoutingMap"), {
  ssr: false,
});

export default function Home() {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}
    >
      <RoutingMap
        start={[4.676979, -74.062062]} 
        end={[4.609288, -74.09927]} 
        vehicleLocation={[4.651721, -74.078671]} 
        isRouting={true}
      />
    </div>
  );
}
