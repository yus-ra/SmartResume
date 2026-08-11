const testimonials = [
    { name: "Sarah Chen", role: "Software Engineer at Google", avatar: "SC", text: "SmartResume helped me improve my ATS score from 61% to 94%. I landed three interviews within a week of updating my resume.", color: "#2563EB" },
    { name: "Marcus Johnson", role: "Product Manager at Stripe", avatar: "MJ", text: "The AI analysis caught keyword gaps I never would have noticed. My interview callback rate doubled after applying the suggestions.", color: "#14B8A6" },
    { name: "Priya Patel", role: "UX Designer at Figma", avatar: "PP", text: "The portfolio builder is stunning. Hiring managers mention it in every interview. Best investment I made in my job search.", color: "#F59E0B" },
]
const Testimonials = () => {
    return (
        <div id="testimonials" className="py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="font-extrabold text-[#0F172A] text-2xl md:text-3xl">
                        Trusted by 250,000+ Job Seekers
                    </h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {testimonials.map(({ name, role, avatar, text, color }) => (
                        <div key={name} className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-1 mb-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i} className="text-[#F59E0B] text-sm">★</span>
                                ))}
                            </div>
                            <p className="text-[#475569] text-sm leading-relaxed mb-5">&ldquo;{text}&rdquo;</p>
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                    style={{ backgroundColor: color }}
                                >
                                    {avatar}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-[#0F172A]">{name}</div>
                                    <div className="text-xs text-[#94A3B8]">{role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Testimonials