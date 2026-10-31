import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IntroLoader from "@/components/IntroLoader";
import { AuthProvider } from "@/context/AuthContext";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <IntroLoader />
      <Header />
      {children}
      <Footer />
    </AuthProvider>
  );
}
