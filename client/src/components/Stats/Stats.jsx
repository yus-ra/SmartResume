const stats = [
  { val: "250K+", label: "Resumes Created" },
  { val: "94%", label: "ATS Pass Rate" },
  { val: "4.9★", label: "User Rating" },
  { val: "180+", label: "Countries" },
];
const Stats = () => {
  return (
    <section className="border-y border-[#E2E8F0] bg-white py-8 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map(({ val, label }) => (
          <div key={label}>
            <div className="font-extrabold text-2xl text-[#0F172A]">{val}</div>
            <div className="text-xs text-[#94A3B8] mt-0.5 font-medium">
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
