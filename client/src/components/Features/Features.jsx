import React from 'react'

const Features = () => {
    return (
        <div id="features" className="py-20 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-14">
                    <div className="inline-block text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">Features</div>
                    <h2 className="font-extrabold text-[#0F172A] text-3xl md:text-4xl mb-3">Everything You Need to Land the Job</h2>
                    <p className="text-[#475569] text-base max-w-lg mx-auto">From building to optimizing — SmartResume gives you the full toolkit.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    <FeatureCard icon="📝" title="Resume Builder" desc="Create polished, professional resumes within minutes using our intuitive drag-and-drop editor and expert templates." accent="#2563EB" />
                    <FeatureCard icon="🤖" title="AI Analysis" desc="Receive a real-time ATS score and personalized recommendations to maximize your chances with applicant tracking systems." accent="#14B8A6" />
                    <FeatureCard icon="🌐" title="Portfolio Builder" desc="Create your online professional portfolio to showcase projects, skills, and achievements beyond the resume." accent="#F59E0B" />
                </div>
                <div className="grid md:grid-cols-3 gap-6 mt-6">
                    <FeatureCard icon="📄" title="PDF Export" desc="Download pixel-perfect, recruiter-ready PDFs that look great in every inbox and applicant tracking system." accent="#22C55E" />
                    <FeatureCard icon="🎨" title="50+ Templates" desc="Choose from a curated library of modern, minimalist, and creative templates designed by professional designers." accent="#EF4444" />
                    <FeatureCard icon="🔗" title="Shareable Link" desc="Get a unique public link to your resume and portfolio to share directly with hiring managers and recruiters." accent="#8B5CF6" />
                </div>
            </div>
        </div>
    )
}

export default Features
