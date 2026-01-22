import { ArrowRight } from "lucide-react";

export function Transformation() {
    return (
        <section className="container mx-auto px-4 py-24 bg-muted/30">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Your Journey to <span className="text-primary">Certified</span></h2>
                <p className="text-xl text-muted-foreground">From unsure to unstoppable in 4 steps.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto relative">
                {/* Connector Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-border -z-10" />

                <div className="relative pt-8 md:pt-0">
                    <div className="md:absolute md:top-7 left-1/2 md:-translate-x-1/2 bg-background border rounded-full h-10 w-10 flex items-center justify-center font-bold shadow-sm z-10 mx-auto md:mx-0 mb-4 md:mb-0">1</div>
                    <div className="text-center pt-4 md:pt-24">
                        <h3 className="text-xl font-bold mb-2">Assessment</h3>
                        <p className="text-muted-foreground text-sm">Take a diagnostic test to identify your current knowledge gaps.</p>
                    </div>
                </div>

                <div className="relative pt-8 md:pt-0">
                    <div className="md:absolute md:top-7 left-1/2 md:-translate-x-1/2 bg-background border rounded-full h-10 w-10 flex items-center justify-center font-bold shadow-sm z-10 mx-auto md:mx-0 mb-4 md:mb-0">2</div>
                    <div className="text-center pt-4 md:pt-24">
                        <h3 className="text-xl font-bold mb-2">Targeted Study</h3>
                        <p className="text-muted-foreground text-sm">Focus only on what you don't know with adaptive micro-lessons.</p>
                    </div>
                </div>

                <div className="relative pt-8 md:pt-0">
                    <div className="md:absolute md:top-7 left-1/2 md:-translate-x-1/2 bg-background border rounded-full h-10 w-10 flex items-center justify-center font-bold shadow-sm z-10 mx-auto md:mx-0 mb-4 md:mb-0">3</div>
                    <div className="text-center pt-4 md:pt-24">
                        <h3 className="text-xl font-bold mb-2">Simulated Exams</h3>
                        <p className="text-muted-foreground text-sm">Build stamina and confidence with realistic practice tests.</p>
                    </div>
                </div>

                <div className="relative pt-8 md:pt-0">
                    <div className="md:absolute md:top-7 left-1/2 md:-translate-x-1/2 bg-primary text-primary-foreground border-primary rounded-full h-10 w-10 flex items-center justify-center font-bold shadow-sm z-10 mx-auto md:mx-0 mb-4 md:mb-0">
                        <ArrowRight className="h-5 w-5" />
                    </div>
                    <div className="text-center pt-4 md:pt-24">
                        <h3 className="text-xl font-bold mb-2">Get Certified</h3>
                        <p className="text-muted-foreground text-sm">Walk into the exam room with confidence and pass.</p>
                    </div>
                </div>

            </div>
        </section>
    );
}
