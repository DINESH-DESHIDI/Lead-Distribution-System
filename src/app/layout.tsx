import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Prowider Mini Lead Distribution System",
  description: "A highly concurrent, transaction-safe, real-time lead generation and round-robin allocation engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background text-foreground flex flex-col">
        <ToastProvider>
          <Navbar />
          <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-border/20 py-6 text-center text-xs text-muted-foreground bg-neutral-950/50">
            <div className="flex flex-col gap-1 md:flex-row items-center justify-between max-w-7xl mx-auto px-4 md:px-8">
              <span>&copy; {new Date().getFullYear()} Prowider Mini Lead Distribution. All rights reserved.</span>
              <span className="font-semibold text-white/50">Production Grade Engine</span>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
