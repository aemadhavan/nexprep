export function ProblemAgitate() {
    return (
        <section className="container mx-auto px-4 py-24">
            <div className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                    Why is passing AI certifications <span className="text-destructive">so hard?</span>
                </h2>
                <p className="text-xl text-muted-foreground">
                    Most study materials are outdated, boring, or simply ineffective.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-4">😰</div>
                    <h3 className="text-xl font-bold mb-3">Exam Anxiety</h3>
                    <p className="text-muted-foreground">
                        The fear of failing and wasting $200+ on an exam fee keeps you stuck in tutorial hell, never feeling "ready enough."
                    </p>
                </div>

                <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-4">⏳</div>
                    <h3 className="text-xl font-bold mb-3">No Time to Study</h3>
                    <p className="text-muted-foreground">
                        You have a full-time job. You can't spend 2 hours a day watching 50-hour video courses that put you to sleep.
                    </p>
                </div>

                <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-4">📚</div>
                    <h3 className="text-xl font-bold mb-3">Information Overload</h3>
                    <p className="text-muted-foreground">
                        Thousands of PDF pages and whitepapers. What actually matters for the exam? It's impossible to know what to focus on.
                    </p>
                </div>
            </div>

            <div className="mt-16 text-center">
                <p className="text-2xl font-serif italic text-muted-foreground">
                    "There has to be a smarter way to prepare..."
                </p>
            </div>
        </section>
    );
}
