import Link from "next/link";
import { Zap, Brain, Target, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ValueStack() {
    return (
        <section id="features" className="container mx-auto px-4 py-24 bg-muted/20 scroll-mt-20">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to <span className="text-primary">pass on the first try</span></h2>
                <p className="text-xl text-muted-foreground">We've stripped away the fluff and focused on what actually works.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                <div className="space-y-8">
                    <div className="flex gap-4 items-start">
                        <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                            <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Micro-Learning Modules</h3>
                            <p className="text-muted-foreground">Bite-sized lessons that fit into your busy schedule. Learn a concept in 5 minutes, not 50.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
                            <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Adaptive AI Practice</h3>
                            <p className="text-muted-foreground">Our algorithm identifies your weak spots and serves questions to turn them into strengths.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
                            <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Exam-Simulated Mode</h3>
                            <p className="text-muted-foreground">Practice under real exam conditions with timed tests and official question formats.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                            <RefreshCw className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Lifetime Updates</h3>
                            <p className="text-muted-foreground">Exams change. We update our content immediately so you're never studying outdated material.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border rounded-2xl p-8 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <Badge className="bg-primary text-primary-foreground">Best Value</Badge>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">NexPrep Premium</h3>
                    <div className="text-5xl font-bold mb-6">$0<span className="text-xl text-muted-foreground font-normal">/mo</span></div>
                    <p className="text-muted-foreground mb-8">Currently in free beta access for early adopters.</p>

                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            <span>Unlimited Practice Tests</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            <span>All Cloud Platforms (AWS, Azure, GCP)</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            <span>Detailed Explanations</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            <span>Performance Analytics</span>
                        </li>
                    </ul>

                    <Link href="/sign-up" className="w-full">
                        <button className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:opacity-90 transition-opacity">
                            Start Free Now
                        </button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
