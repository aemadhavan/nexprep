import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function SocialProof() {
    return (
        <section className="container mx-auto px-4 py-24">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Don't just take our word for it</h2>
                <div className="flex justify-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    ))}
                </div>
                <p className="text-xl text-muted-foreground">Join thousands of certified engineers.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <Card className="border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>
                        <p className="text-muted-foreground mb-6">
                            "I failed the AWS AI Practitioner exam twice before finding NexPrep. The adaptive questions helped me focus exactly on what I didn't know. Passed with an 850!"
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-200" />
                            <div>
                                <div className="font-bold">Sarah Jenkins</div>
                                <div className="text-sm text-muted-foreground">Cloud Architect</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>
                        <p className="text-muted-foreground mb-6">
                            "The micro-learning modules are a lifesaver. I could study on my commute and during lunch breaks. The explanation depth is unmatched."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-200" />
                            <div>
                                <div className="font-bold">Marcus Chen</div>
                                <div className="text-sm text-muted-foreground">Data Scientist</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>
                        <p className="text-muted-foreground mb-6">
                            "Simple, effective, and to the point. No fluff. Just the concepts you need to pass the Microsoft AI-900. Highly recommended."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-200" />
                            <div>
                                <div className="font-bold">Elena Rodriguez</div>
                                <div className="text-sm text-muted-foreground">Software Engineer</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
