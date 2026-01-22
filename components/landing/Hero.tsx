import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
    return (
        <section className="container mx-auto px-4 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="flex flex-col items-start space-y-6">
                    <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                        #1 AI Certification Platform
                    </Badge>

                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
                        Master Your <span className="text-primary">AI Certifications</span>
                    </h1>

                    <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                        Streamline your prep for Microsoft, AWS, and Google Cloud AI certifications. Intelligent microlearning ensures you're exam-ready in less time.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Link href="/sign-up" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full h-12 text-base px-8">
                                Start Free Practice Test
                            </Button>
                        </Link>
                        <Link href="#features" className="w-full sm:w-auto">
                            <Button size="lg" variant="outline" className="w-full h-12 text-base px-8">
                                View Features
                            </Button>
                        </Link>
                    </div>

                    <div className="pt-8 w-full">
                        <p className="text-sm text-muted-foreground mb-4 font-medium uppercase tracking-wider">Trusted by engineers from</p>
                        <div className="flex items-center gap-8 text-muted-foreground/60 grayscale opacity-70">
                            <div className="flex items-center gap-2 font-bold text-lg">Microsoft</div>
                            <div className="flex items-center gap-2 font-bold text-lg">AWS</div>
                            <div className="flex items-center gap-2 font-bold text-lg">Google</div>
                        </div>
                    </div>
                </div>

                <div className="relative lg:h-[600px] w-full flex items-center justify-center">
                    <div className="relative w-full aspect-square max-w-[500px] lg:max-w-none">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl opacity-30" />
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-background/50 backdrop-blur-sm p-4">
                            <Image
                                src="/nexprep-dashboard.png"
                                alt="NexPrep Dashboard"
                                width={800}
                                height={600}
                                className="rounded-lg shadow-inner"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
