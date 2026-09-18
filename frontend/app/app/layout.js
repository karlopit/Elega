import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackendStatus } from "@/components/BackendStatus"; // TEMP: Remove before production
import { StoreToast } from "@/components/StoreToast";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"]
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export const metadata = {
  title: "Elega",
  description: "A refined online clothing storefront."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} font-body antialiased`}>
        <StoreProvider>
          <Header />
          {children}
          <Footer />
          <StoreToast />
        </StoreProvider>
        <BackendStatus /> {/* TEMP: Remove before production */}
      </body>
    </html>
  );
}
