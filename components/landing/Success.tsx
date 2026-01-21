import { CheckCircle2 } from "lucide-react";

export function Success() {
    return (
        <section className="bg-muted/30 py-12 border-y">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 bg-background p-6 rounded-xl shadow-sm border">
                        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Exam Readiness Guaranteed</h3>
                            <p className="text-sm text-muted-foreground">98% pass rate for active users</p>
                        </div>
                    </div>

                    <div className="h-px w-full md:w-px md:h-12 bg-border" />

                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span>Real Exam Questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span>Deep Explanations</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span>Performance Analytics</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span>Mobile Friendly</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
