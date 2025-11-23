
import { Zap, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { setAuthModalOpen } = useAuth();

  return (
    <>
      <div className="z-10">
      <section className="relative z-30 min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT CONTENT */}
          <div className="space-y-8 text-center lg:text-left animate-in slide-in-from-bottom-10 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium uppercase">
              <Zap size={12} /> AI Powered Fashion v2.0
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              Wear any look <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 animate-gradient-x">
                Instantly.
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Upload your photo. Pick any outfit from the internet. Our
              generative AI weaves the fabric onto you realistically in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-8 py-4 bg-white text-slate-950 rounded-full font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                Try it Now <ArrowRight size={20} />
              </button>
            </div>
          </div>

          {/* RIGHT SIDE PREVIEW */}
          <div className="relative hidden lg:block animate-in fade-in zoom-in duration-1000 delay-200">
            <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl rotate-3 hover:rotate-0 transition-all">
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=400&q=80"
                  className="rounded-2xl h-64 w-full object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=400&q=80"
                  className="rounded-2xl h-64 w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* Features */}
      <section id="features" className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "Generate results in under 5 seconds.",
              },
              {
                icon: Zap,
                title: "Privacy First",
                desc: "Your photos are deleted immediately.",
              },
              {
                icon: Zap,
                title: "Mobile Friendly",
                desc: "Works perfectly on phones too.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-violet-500/30 hover:bg-slate-900/80 transition-all backdrop-blur-sm"
              >
                <div className="size-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-violet-600 transition-colors">
                  <f.icon className="size-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
                <p className="text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
