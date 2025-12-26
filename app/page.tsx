import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Brain, TrendingUp, Zap, Award, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <Badge className="mb-4">AI-Powered Exam Preparation</Badge>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Master Your AI Certifications
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Prepare for Microsoft, AWS, and Google Cloud AI certifications with intelligent flashcards powered by spaced repetition.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/sign-up">
            <Button size="lg">Get Started Free</Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline">Sign In</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why NexPrep?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Brain className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Spaced Repetition</CardTitle>
              <CardDescription>
                Intelligent algorithm optimizes your learning schedule based on the SuperMemo SM-2 method
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Comprehensive Content</CardTitle>
              <CardDescription>
                Aligned with official exam skills and objectives from Microsoft, AWS, and Google Cloud
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>
                Detailed analytics show your mastery level and identify weak areas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                Quickly find flashcards by domain, category, skill, or keyword search
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Award className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Structured Learning</CardTitle>
              <CardDescription>
                Organized by exam domains, categories, and skills for systematic preparation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Multiple Certifications</CardTitle>
              <CardDescription>
                Support for Microsoft, AWS, and Google Cloud AI certification exams
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Available Exams */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Available Certifications</h2>
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
