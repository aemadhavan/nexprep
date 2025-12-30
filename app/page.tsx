import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Brain, TrendingUp, Award } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Master Your AI Certifications
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Streamline your prep for Microsoft, AWS, and Google Cloud AI certifications. Our intelligent microlearning and adaptive practice tests ensure you're exam-ready in less time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto">Start Your Free Practice Test</Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">Sign In</Button>
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-4">Prepare for certifications from:</p>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-muted rounded"></div>
                  <span className="font-semibold">Microsoft</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-muted rounded"></div>
                  <span className="font-semibold">AWS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-muted rounded"></div>
                  <span className="font-semibold">Google Cloud</span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-slate-900 p-6">
              <Image
                src="/nexprep-dashboard.png"
                alt="NexPrep Dashboard Preview"
                width={800}
                height={600}
                className="rounded-lg"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why NexPrep?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="border-none shadow-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Adaptive Intelligence</CardTitle>
              <CardDescription className="text-base">
                Smart algorithms that focus on your weak spots so you learn faster.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Comprehensive Library</CardTitle>
              <CardDescription className="text-base">
                Access thousands of practice questions and micro-lessons for Microsoft, AWS, and Google Cloud AI exams.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Progress Tracking</CardTitle>
              <CardDescription className="text-base">
                Detailed analytics show your mastery level and identify weak areas.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Structured Learning</CardTitle>
              <CardDescription className="text-base">
                Organized by exam domains, categories, and skills for systematic preparation.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Testimonial */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Join Early Adopters</h2>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg md:text-xl text-muted-foreground mb-4">
            NexPrep's microlearning approach helped me master difficult AI concepts in half the time. The practice tests are spot on!
          </p>
          <p className="font-semibold">- Sarah K., Cloud Engineer</p>
        </div>
      </section>

      {/* Certification Roadmap */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Certification Roadmap</h2>
        <div className="flex justify-center gap-4 mb-8">
          <Badge variant="outline" className="px-4 py-2">Microsoft</Badge>
          <Badge variant="outline" className="px-4 py-2">AWS</Badge>
          <Badge variant="outline" className="px-4 py-2">Google</Badge>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Badge variant="outline" className="w-fit">Microsoft</Badge>
              <CardTitle className="mt-2">AB-900</CardTitle>
              <CardDescription>
                Copilot & Agent Administration Fundamentals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge>Phase 1</Badge>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <Badge variant="outline" className="w-fit">Microsoft</Badge>
              <CardTitle className="mt-2">AB-731</CardTitle>
              <CardDescription>
                AI Transformation Leader
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Coming Soon</Badge>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <Badge variant="outline" className="w-fit">AWS</Badge>
              <CardTitle className="mt-2">AIF-C01</CardTitle>
              <CardDescription>
                AWS Certified AI Practitioner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Coming Soon</Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Ace Your Exam?</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join professionals worldwide who trust NexPrep for their certification preparation.
        </p>
        <Link href="/sign-up">
          <Button size="lg">Start Studying Today</Button>
        </Link>
      </section>
    </div>
  );
}
