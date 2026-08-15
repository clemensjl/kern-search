"use client";
import { SessionProvider } from "next-auth/react";
import PrefsProvider from "@/components/Prefs";
import Pwa from "@/components/Pwa";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PrefsProvider>
        {children}
        {/* Service-Worker-Registrierung und Installationshinweis. Rendert nichts,
            solange der Hinweis nicht faellig ist. */}
        <Pwa />
      </PrefsProvider>
    </SessionProvider>
  );
}
