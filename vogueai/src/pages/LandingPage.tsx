
import { Zap, ArrowRight, Check, ChevronDown, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../router/RouterProvider";
import { useState } from "react";
import TiltCard from "../components/TiltCard";

export default function LandingPage() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { navigate } = useRouter();
  // State for FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleTryNow = () => {
    if (isAuthenticated) {
      navigate("/dashboard/studio");
    } else {
      openAuthModal("login");
    }
  };

   const faqs = [
    { q: "Is the virtual try-on free?", a: "Yes, our Starter plan is completely free and gives you 5 generations per day. For more, you can upgrade to our Pro plan." },
    { q: "What kind of photos work best?", a: "For the best results, use clear, front-facing photos with good lighting. Avoid loose clothing in the original photo if possible." },
    { q: "Is my data private?", a: "Absolutely. We delete all uploaded photos and generated images from our servers after 24 hours unless you choose to save them to your private gallery." },
    { q: "Can I use this for my e-commerce store?", a: "Yes! Our Studio plan offers API access and bulk processing specifically designed for e-commerce businesses." }
  ];
  return (
    <>
      <div className="z-10">
      <section className="relative z-30 min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT CONTENT */}
          <div className="space-y-8 text-center lg:text-left animate-fade-in slide-in-from-bottom-10 duration-700">
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
                onClick={handleTryNow}
                className="px-8 py-4 bg-white text-slate-950 rounded-full font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                Try it Now <ArrowRight size={20} />
              </button>
            </div>
          </div>

          {/* RIGHT SIDE PREVIEW */}
          {/* <div className="relative hidden lg:block animate-fade-in fade-in zoom-in duration-1000 delay-200">
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
          </div> */}

          {/* Hero Visual Section with Tilt Card */}
          <div className="relative hidden lg:block animate-in fade-in zoom-in duration-1000 delay-200 perspective-1000">
            {/* Floating background blobs */}
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-violet-600/30 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite]"></div>
            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-cyan-600/30 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite_reverse]"></div>

            <TiltCard>
              <div className="grid grid-cols-2 gap-4">
                <img src="https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=400&q=80" className="rounded-2xl h-64 w-full object-cover pointer-events-none" alt="Model" />
                <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=400&q=80" className="rounded-2xl h-64 w-full object-cover pointer-events-none" alt="Outfit" />
              </div>
              {/* Processing Badge overlay in center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/80 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex items-center gap-3 shadow-xl">
                 <div className="flex gap-1">
                    <div className="size-2 bg-violet-500 rounded-full animate-bounce"></div>
                    <div className="size-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="size-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
                 </div>
              </div>
            </TiltCard>
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
              {/* Pricing Section */}
      <section id="pricing" className="py-24 relative z-10 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Simple Pricing</h2>
            <p className="text-slate-400">Start for free, upgrade for professional power.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Tier */}
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all">
              <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
              <div className="text-4xl font-bold text-white mb-6">$0</div>
              <ul className="space-y-4 mb-8 text-slate-400">
                <li className="flex items-center gap-3"><Check size={18} className="text-violet-400"/> 5 Daily Generations</li>
              </ul>
              <button onClick={() => setAuthModalOpen(true)} className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-all">
                Get Started
              </button>
            </div>

            {/* Pro Tier */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-violet-900/20 to-slate-900/50 border border-violet-500/30 backdrop-blur-sm relative group transform md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full text-xs font-bold text-white shadow-lg">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pro Creator</h3>
              <div className="text-4xl font-bold text-white mb-6">$29<span className="text-lg text-slate-500 font-medium">/mo</span></div>
              <ul className="space-y-4 mb-8 text-slate-300">
                <li className="flex items-center gap-3"><Check size={18} className="text-cyan-400"/> Unlimited Generations</li>
                <li className="flex items-center gap-3"><Check size={18} className="text-cyan-400"/> Private Gallery</li>
              </ul>
              <button onClick={() => setAuthModalOpen(true)} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all hover:scale-105">
                Subscribe Now
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all">
              <h3 className="text-xl font-bold text-white mb-2">Studio</h3>
              <div className="text-4xl font-bold text-white mb-6">$99<span className="text-lg text-slate-500 font-medium">/mo</span></div>
              <ul className="space-y-4 mb-8 text-slate-400">
                <li className="flex items-center gap-3"><Check size={18} className="text-violet-400"/> API Access</li>
                <li className="flex items-center gap-3"><Check size={18} className="text-violet-400"/> Commercial License</li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-all">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* NEW: FAQ Section */}
      <section className="py-24 relative z-10 bg-slate-900/30 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400">Everything you need to know about VogueAI.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden transition-all">
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-6 text-left text-white hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold">{faq.q}</span>
                  <ChevronDown className={`transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-6 pt-0 text-slate-400 leading-relaxed">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-24 relative overflow-hidden z-10">
            <div className="absolute inset-0 bg-violet-900/10"></div>
            <div className="container mx-auto px-6 relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to revolutionize your wardrobe?</h2>
              <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">Join 50,000+ users experimenting with their style daily.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setAuthModalOpen(true)}
                  className="px-8 py-4 bg-white text-slate-950 rounded-full font-bold hover:scale-105 transition-transform"
                >
                  Get Started Free
                </button>
                <button className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-full font-bold hover:bg-white/10 transition-colors">
                  View Pricing
                </button>
              </div>
            </div>
          </section>

{/* Footer */}
      <footer className="bg-slate-950 border-t border-white/10 pt-20 pb-10 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="size-8 bg-gradient-to-tr from-violet-600 to-cyan-400 rounded-lg flex items-center justify-center">
                  <Sparkles className="text-white size-5" />
                </div>
                <span className="text-xl font-bold text-white">VogueAI</span>
              </div>
              <p className="text-slate-500 max-w-sm">
                Revolutionizing e-commerce fashion with generative AI. Experience the future of virtual try-ons today.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-violet-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">API Access</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Showcase</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-violet-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-600 text-sm">
            <p>© 2024 VogueAI Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
  

    </>
  );
}
