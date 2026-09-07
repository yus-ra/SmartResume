const FeatureCard = ({ icon, title, desc, accent }) => {
  return (
    <div className="group bg-white rounded-2xl p-7 border border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: accent + "18" }}
      >
        {icon}
      </div>
      <h3 className="font-bold text-[#0F172A] text-lg mb-2">{title}</h3>
      <p className="text-[#475569] text-sm leading-relaxed">{desc}</p>
      <div
        className="mt-4 h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-full"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
};

const features = [
  {
    icon: "📝",
    title: "Resume Builder",
    desc: "Create polished, professional resumes within minutes using our intuitive drag-and-drop editor and expert templates.",
    accent: "#2563EB",
  },
  {
    icon: "🤖",
    title: "AI Analysis",
    desc: "Receive a real-time ATS score and personalized recommendations to maximize your chances with applicant tracking systems.",
    accent: "#14B8A6",
  },
  {
    icon: "🌐",
    title: "Portfolio Builder",
    desc: "Create your online professional portfolio to showcase projects, skills, and achievements beyond the resume.",
    accent: "#F59E0B",
  },
  {
    icon: "📄",
    title: "PDF Export",
    desc: "Download pixel-perfect, recruiter-ready PDFs that look great in every inbox and applicant tracking system.",
    accent: "#22C55E",
  },
  {
    icon: "🎨",
    title: "50+ Templates",
    desc: "Choose from a curated library of modern, minimalist, and creative templates designed by professional designers.",
    accent: "#EF4444",
  },
  {
    icon: "🔗",
    title: "Shareable Link",
    desc: "Get a unique public link to your resume and portfolio to share directly with hiring managers and recruiters.",
    accent: "#8B5CF6",
  },
];

const Features = () => {
  return (
    <div id="features" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-block text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            Features
          </div>
          <h2 className="font-extrabold text-[#0F172A] text-3xl md:text-4xl mb-3">
            Everything You Need to Land the Job
          </h2>
          <p className="text-[#475569] text-base max-w-lg mx-auto">
            From building to optimizing — SmartResume gives you the full
            toolkit.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.slice(0, 3).map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {features.slice(3).map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
