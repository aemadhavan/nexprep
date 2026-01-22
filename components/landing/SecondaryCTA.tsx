import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SecondaryCTA() {
    return (
        <section className="container mx-auto px-4 py-24 text-center">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Avatar Stack */}
                <div className="flex justify-center -space-x-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-12 w-12 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                            <div className="bg-slate-200 h-full w-full" />
                        </div>
                    ))}
                    <div className="h-12 w-12 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground z-10">
                        +2k
                    </div>
                </div>

                <h2 className="text-3xl md:text-5xl font-bold">
                    Ready to stop guessing and start passing?
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Join the community of engineers who are fast-tracking their AI careers.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/sign-up">
                        <Button size="lg" className="w-full sm:w-auto h-12 text-lg px-8">
                            Yes, Start My Free Prep
                        </Button>
                    </Link>
                </div>

                <p className="text-sm text-muted-foreground">
                    No credit card required. Free beta access includes all features.
                </p>
            </div>
        </section>
    );
}
