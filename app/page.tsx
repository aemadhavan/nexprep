import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Success } from "@/components/landing/Success";
import { ProblemAgitate } from "@/components/landing/ProblemAgitate";
import { ValueStack } from "@/components/landing/ValueStack";
import { SocialProof } from "@/components/landing/SocialProof";
import { Transformation } from "@/components/landing/Transformation";
import { SecondaryCTA } from "@/components/landing/SecondaryCTA";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Hero />
        <Success />
        <ProblemAgitate />
        <ValueStack />
        <SocialProof />
        <Transformation />
        <SecondaryCTA />
      </main>

      <Footer />
    </div>
  );
}
