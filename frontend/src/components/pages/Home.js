import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ShieldCheck,
  Users,
  BarChart3,
  MapPin,
  PhoneCall,
  ChevronRight,
  Heart,
  Headphones,
  Lock,
  Truck
} from 'lucide-react';
import { ToastContext } from '../../context/ToastContext';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

function StatItem({ icon, val, label, delay = 0 }) {
  const [count, setCount] = useState(0);

  // Parse the target value and the suffix (e.g. "12", "K+")
  const targetMatch = val.match(/^(\d+)(.*)$/);
  const targetNum = targetMatch ? parseInt(targetMatch[1], 10) : 0;
  const suffix = targetMatch ? targetMatch[2] : "";

  useEffect(() => {
    // Treat '24/7' statically to avoid weird counting
    if (val === '24/7') return;

    let start = 0;
    const duration = 2000; // ms
    const incrementTime = 30; // ms
    const totalSteps = duration / incrementTime;
    const increment = targetNum / totalSteps;

    let timer;
    const runAnimation = () => {
      timer = setInterval(() => {
        start += increment;
        if (start >= targetNum) {
          clearInterval(timer);
          setCount(targetNum);
        } else {
          setCount(Math.ceil(start));
        }
      }, incrementTime);
    };

    // Add slight delay so it doesn't animate instantly before render
    setTimeout(runAnimation, delay);

    return () => clearInterval(timer);
  }, [val, targetNum, delay]);

  const displayVal = val === '24/7' ? val : `${count}${suffix}`;

  return (
    <div className="group flex flex-col items-center justify-center p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm dark:shadow-none backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-slate-50 dark:hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] cursor-default">
      <div className="mb-2 bg-slate-100 dark:bg-white/10 p-2 rounded-full transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">{icon}</div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1 transition-colors">{displayVal}</p>
      <p className="text-xs text-slate-500 dark:text-gray-400 text-center transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">{label}</p>
    </div>
  );
}

function TimelineStep({ time, unit, title, desc, icon, color }) {
  const iconBgMap = {
    pink: 'bg-pink-100 dark:bg-pink-500/20',
    purple: 'bg-purple-100 dark:bg-purple-500/20',
    cyan: 'bg-cyan-100 dark:bg-cyan-500/20',
    white: 'bg-slate-200 dark:bg-white/20'
  };

  return (
    <div className="flex flex-col items-start p-4 bg-gradient-to-br from-white to-slate-50 dark:from-white/10 dark:to-transparent border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm dark:shadow-none transition-colors">
      <div className={`mb-3 p-2 rounded-full ${iconBgMap[color]} transition-colors`}>
        {icon}
      </div>
      <p className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-baseline gap-1 transition-colors">
        {time} <span className="text-xs text-slate-500 dark:text-gray-400 font-normal transition-colors">{unit}</span>
      </p>
      <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1 transition-colors">{title}</p>
      <p className="text-xs text-slate-500 dark:text-gray-400 transition-colors">{desc}</p>
    </div>
  );
}

function FeatureRow({ icon, title, desc }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="bg-slate-100 dark:bg-white/10 p-3 rounded-xl flex-shrink-0 transition-colors group-hover:bg-slate-200 dark:group-hover:bg-white/20">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-slate-900 dark:text-white text-sm transition-colors">{title}</p>
        <p className="text-xs text-slate-500 dark:text-gray-400 transition-colors">{desc}</p>
      </div>
    </div>
  );
}

function LoggedInHome() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  const heading1Ref = useRef(null);
  const heading2Ref = useRef(null);
  const heroH1Ref = useRef(null);
  const statsRef = useRef(null);

  // Scroll-triggered character animation
  useEffect(() => {
    let isMounted = true;
    const targets = [
      { ref: heroH1Ref, from: 'left', effect: 'slide', delay: 60 },
      { ref: heading1Ref, from: 'center', effect: 'pop', delay: 70 },
      { ref: heading2Ref, from: 'left', effect: 'pop', delay: 55 },
      { ref: statsRef, from: 'right', effect: 'slide', delay: 80 },
    ];

    const observers = [];
    const cleanups = [];
    // Save original innerHTML so we can restore on unmount
    const originals = targets.map(({ ref }) => ({
      ref, html: ref.current ? ref.current.innerHTML : ''
    }));

    import('https://esm.sh/animejs').then(({ createTimeline, stagger, splitText }) => {
      if (!isMounted) return;
      targets.forEach(({ ref, from, effect, delay }) => {
        if (!ref.current || !isMounted) return;
        try {
          const { chars } = splitText(ref.current, { chars: { wrap: 'clip' } });
          if (!chars) return;
          chars.forEach(c => {
            c.style.display = 'inline-block';
            c.style.opacity = '0';
            if (effect === 'slide') c.style.transform = 'translateY(18px)';
            if (effect === 'pop') c.style.transform = 'scale(0.3)';
            if (effect === 'flip') c.style.transform = 'rotateY(90deg)';
          });

          let played = false;
          const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !played && isMounted) {
              played = true;
              let props = {};
              if (effect === 'slide') props = { opacity: [0, 1], translateY: [18, 0], duration: 650, ease: 'outExpo' };
              if (effect === 'pop') props = { opacity: [0, 1], scale: [0.3, 1], duration: 700, ease: 'outBack(1.5)' };
              if (effect === 'flip') props = { opacity: [0, 1], rotateY: [90, 0], duration: 700, ease: 'outElastic(1,.5)' };
              const tl = createTimeline().add(chars, props, stagger(delay, { from }));
              cleanups.push(() => tl.pause());
            }
          }, { threshold: 0.3 });
          if (ref.current) obs.observe(ref.current);
          observers.push(obs);
        } catch (_) { /* ignore animation errors */ }
      });
    }).catch(() => { /* CDN unavailable — skip animations */ });

    return () => {
      isMounted = false;
      observers.forEach(o => o.disconnect());
      cleanups.forEach(fn => fn());
      // Restore original HTML so the next mount starts clean
      originals.forEach(({ ref, html }) => {
        if (ref.current) ref.current.innerHTML = html;
      });
    };
  }, []);


  const startSession = () => {
    addToast('🛡️ Emergency monitoring started', 'success');
    navigate('/dashboard');
  };

  const openDashboard = () => {
    navigate('/history');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f1a] text-slate-900 dark:text-white relative overflow-hidden font-sans pb-20 transition-colors duration-300">
      {/* Background glows */}
      <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-cyan-400/20 dark:bg-cyan-500/10 blur-[120px] pointer-events-none transition-colors" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-pink-400/20 dark:bg-pink-500/10 blur-[120px] pointer-events-none transition-colors" />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 space-y-16">

        {/* HERO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-700 dark:text-cyan-400 tracking-wider mb-6 border border-cyan-200 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10 px-4 py-1.5 rounded-full uppercase transition-colors">
              <ShieldCheck size={16} /> Safety First, Always Prepared
            </div>
            <h1 ref={heroH1Ref} className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6 text-slate-900 dark:text-white transition-colors">
              Your Safety, Our Priority.
            </h1>
            <p className="text-slate-600 dark:text-gray-400 text-lg mb-8 max-w-md transition-colors">
              Instant protection & expert help when every second matters.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={startSession}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-pink-500 text-white font-semibold hover:scale-105 shadow-lg shadow-blue-500/20 transition-all text-sm sm:text-base"
              >
                Start Safety Session <ChevronRight size={18} />
              </button>
              <button
                onClick={openDashboard}
                className="px-8 py-3.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors font-medium text-slate-700 dark:text-white shadow-sm dark:shadow-none text-sm sm:text-base"
              >
                View Incident Dashboard
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 text-sm text-slate-600 dark:text-gray-400 transition-colors">
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-blue-500" /> 24/7 Monitoring</span>
              <span className="flex items-center gap-2"><AlertTriangle size={16} className="text-pink-500" /> Instant Alerts</span>
              <span className="flex items-center gap-2"><Users size={16} className="text-cyan-500" /> Trusted Network</span>
            </div>
          </motion.div>


          {/* Floating Shield */}

          <div className="absolute top-20 right-32 hidden lg:block">

            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(236,72,153,0.6)] animate-pulse">

              <ShieldCheck size={30} />

            </div>

          </div>

          {/* Right Image/Graphic area */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="relative h-[350px] lg:h-[500px] w-full mt-12 lg:mt-0"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-100/50 to-pink-100/50 dark:from-cyan-900/30 dark:to-pink-900/40 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl flex items-center justify-center bg-slate-100 dark:bg-[#0d1323] transition-colors">
              <img
                src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80"
                alt="Safety Network"
                className="w-full h-full object-cover mix-blend-overlay opacity-50 dark:opacity-80 transition-opacity"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.classList.add('bg-gradient-to-br', 'from-slate-200', 'to-slate-100', 'dark:from-[#1a1f35]', 'dark:to-[#0b0f1a]');
                }}
              />
            </div>

            {/* Live Protection Active Badge */}
            <div className="absolute right-4 -bottom-6 lg:right-4 lg:bottom-12 bg-white/95 dark:bg-[#121826]/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-xl dark:shadow-2xl hidden md:block z-10 max-w-[280px] transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span className="font-semibold text-slate-800 dark:text-white whitespace-nowrap transition-colors">Live Protection <span className="text-green-500 dark:text-green-400">Active</span></span>
              </div>
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-4 transition-colors">Your contacts are online</p>
              <div className="flex -space-x-3 text-white">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-gray-600 border-2 border-white dark:border-[#121826] overflow-hidden transition-colors"><img src="https://i.pravatar.cc/100?img=1" alt="contact" className="w-full h-full object-cover" /></div>
                <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-gray-500 border-2 border-white dark:border-[#121826] overflow-hidden transition-colors"><img src="https://i.pravatar.cc/100?img=2" alt="contact" className="w-full h-full object-cover" /></div>
                <div className="w-8 h-8 rounded-full bg-slate-400 dark:bg-gray-400 border-2 border-white dark:border-[#121826] overflow-hidden transition-colors"><img src="https://i.pravatar.cc/100?img=3" alt="contact" className="w-full h-full object-cover" /></div>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 border-2 border-white dark:border-[#121826] flex items-center justify-center text-xs font-bold text-slate-600 dark:text-white transition-colors">+5</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats Strip */}
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-white/60 dark:bg-[#121826]/60 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm dark:shadow-none transition-colors">
          <StatItem icon={<ShieldCheck size={24} className="text-cyan-600 dark:text-cyan-400" />} val="12K+" label="Emergencies Handled" delay={0} />
          <StatItem icon={<Heart size={24} className="text-pink-600 dark:text-pink-500" />} val="98%" label="Response Success" delay={200} />
          <StatItem icon={<Users size={24} className="text-blue-600 dark:text-blue-400" />} val="50K+" label="Trusted Users" delay={400} />
          <StatItem icon={<Headphones size={24} className="text-slate-500 dark:text-gray-300" />} val="24/7" label="Live Support" delay={600} />
        </div>

        {/* Lower Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-end">

          {/* Left/Center part: Timeline */}
          <div className="lg:col-span-2 space-y-10">
            <div className="text-center md:text-left">
              <h2 ref={heading1Ref} className="text-3xl font-bold mb-2 text-slate-900 dark:text-white transition-colors">How We Keep You <span className="text-cyan-600 dark:text-cyan-400">Safe</span></h2>
              <p className="text-slate-500 dark:text-gray-400 transition-colors">Smart. Fast. Reliable.</p>
            </div>

            <div>
              <h3 ref={heading2Ref} className="text-sm font-semibold text-slate-400 dark:text-gray-400 tracking-widest uppercase mb-6 flex items-center gap-4 transition-colors">
                Emergency Response Timeline <div className="h-px bg-slate-200 dark:bg-white/10 flex-1 transition-colors" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 relative">
                <TimelineStep time="00" unit="Min" title="Alert Triggered" desc="Emergency detected" icon={<Lock className="text-pink-500" size={20} />} color="pink" />
                <TimelineStep time="02" unit="Min" title="Verification Call" desc="Quick confirmation" icon={<PhoneCall className="text-purple-500 dark:text-purple-400" size={20} />} color="purple" />
                <TimelineStep time="05" unit="Min" title="Contacts Notified" desc="Your circle is alerted" icon={<Users className="text-cyan-600 dark:text-cyan-400" size={20} />} color="cyan" />
                <TimelineStep time="10" unit="Min" title="Help On Way" desc="Authorities & support" icon={<Truck className="text-slate-600 dark:text-white" size={20} />} color="white" />
              </div>
            </div>
          </div>

          {/* Right part: Feature stack + SOS button */}
          <div className="space-y-8 flex flex-col items-center lg:items-end">
            <div className="bg-white/80 dark:bg-[#121826]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 space-y-6 w-full lg:max-w-sm cursor-pointer shadow-sm dark:shadow-none transition-colors">
              <FeatureRow icon={<ShieldCheck className="text-cyan-600 dark:text-cyan-400" />} title="Secure & Private" desc="Your data is protected" />
              <FeatureRow icon={<BarChart3 className="text-pink-600 dark:text-pink-500" />} title="Smart Analytics" desc="Insights & reports" />
              <FeatureRow icon={<MapPin className="text-blue-600 dark:text-blue-400" />} title="Location Tracking" desc="Real-time updates" />
              <FeatureRow icon={<AlertTriangle className="text-red-500" />} title="Emergency SOS" desc="One tap for help" />
            </div>

            {/* <div className="relative pr-4 pb-4 mt-8">
              <button
                onClick={startSession}
                className="relative z-10 w-24 h-24 rounded-full bg-red-600 border border-red-400 flex items-center justify-center font-bold text-xl text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:shadow-[0_0_50px_rgba(220,38,38,0.8)] transition-all transform hover:scale-105"
              >
                SOS
              </button>
              <div className="absolute inset-0 rounded-full border border-red-500/50 scale-125 animate-ping pointer-events-none" />
              <div className="absolute inset-0 rounded-full border border-red-500/30 scale-[1.35] animate-pulse pointer-events-none" />
            </div> */}
          </div>

        </div>
      </div>
    </div>
  );
}

function GuestHome() {
  const guestH1Ref = useRef(null);
  const guestH2Ref = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const targets = [
      { ref: guestH1Ref, from: 'left', effect: 'flip', delay: 45 },
      { ref: guestH2Ref, from: 'center', effect: 'pop', delay: 55 },
    ];
    const observers = [];
    const cleanups = [];
    // Save original innerHTML so we can restore on unmount
    const originals = targets.map(({ ref }) => ({
      ref, html: ref.current ? ref.current.innerHTML : ''
    }));
    import('https://esm.sh/animejs').then(({ createTimeline, stagger, splitText }) => {
      if (!isMounted) return;
      targets.forEach(({ ref, from, effect, delay }) => {
        if (!ref.current || !isMounted) return;
        try {
          const { chars } = splitText(ref.current, { chars: { wrap: 'clip' } });
          if (!chars) return;
          chars.forEach(c => {
            c.style.display = 'inline-block';
            c.style.opacity = '0';
            if (effect === 'flip') c.style.transform = 'rotateY(90deg)';
            if (effect === 'pop') c.style.transform = 'scale(0.3)';
          });
          let played = false;
          const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !played && isMounted) {
              played = true;
              let props = {};
              if (effect === 'flip') props = { opacity: [0, 1], rotateY: [90, 0], duration: 750, ease: 'outElastic(1, .5)' };
              if (effect === 'pop') props = { opacity: [0, 1], scale: [0.3, 1], duration: 700, ease: 'outBack(1.5)' };
              const tl = createTimeline().add(chars, props, stagger(delay, { from }));
              cleanups.push(() => tl.pause());
            }
          }, { threshold: 0.3 });
          if (ref.current) obs.observe(ref.current);
          observers.push(obs);
        } catch (_) { /* ignore animation errors */ }
      });
    }).catch(() => { /* CDN unavailable — skip animations */ });
    return () => {
      isMounted = false;
      observers.forEach(o => o.disconnect());
      cleanups.forEach(fn => fn());
      // Restore original HTML so the next mount starts clean
      originals.forEach(({ ref, html }) => {
        if (ref.current) ref.current.innerHTML = html;
      });
    };
  }, []);

  const guestFeatures = [
    { icon: ShieldCheck, title: 'One-Tap SOS', desc: 'A single tap instantly alerts all emergency contacts with your real-time location.', color: '#06b6d4' },
    { icon: MapPin, title: 'Live Route Sharing', desc: 'Share a live-updating map link so contacts can follow your journey in real time.', color: '#8b5cf6' },
    { icon: AlertTriangle, title: 'Smart Escalation', desc: 'If no contact responds within 60 s, the system auto-escalates to secondary contacts.', color: '#f59e0b' },
    { icon: Lock, title: 'End-to-End Encryption', desc: 'All location data and messages are encrypted and never stored beyond the session.', color: '#22c55e' },
    { icon: PhoneCall, title: 'Multi-Channel Alerts', desc: 'Push, SMS, and call-based fallback ensure your contacts are reached everywhere.', color: '#ec4899' },
    { icon: Heart, title: 'Offline-Ready', desc: 'Critical contacts and location caching work even before internet is restored.', color: '#f97316' },
  ];

  const testimonials = [
    { name: 'Sneha Reddy', location: 'Hyderabad', quote: 'SafeHer gave me the confidence to travel late at night. My family gets real-time updates and I feel protected 24/7.', avatar: 'https://randomuser.me/api/portraits/women/32.jpg', color: '#06b6d4' },
    { name: 'Meera Joshi', location: 'Mumbai', quote: 'The one-tap SOS saved me during a scary situation. Within minutes, my brother and two friends were on their way.', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', color: '#8b5cf6' },
    { name: 'Kavya Nair', location: 'Bengaluru', quote: 'I love how simple it is. No complicated setup — just add your contacts and you\'re protected. Every woman needs this.', avatar: 'https://randomuser.me/api/portraits/women/65.jpg', color: '#ec4899' },
  ];

  return (
    <div className="guest-home">
      {/* ── Hero ── */}
      <section className="guest-hero">
        <div className="guest-orb guest-orb--cyan" />
        <div className="guest-orb guest-orb--violet" />
        <div className="guest-orb guest-orb--rose" />

        <motion.div
          className="guest-hero-inner"
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} className="guest-hero-badge">
            <ShieldCheck size={14} /> Women Safety Platform
          </motion.div>

          <h1 ref={guestH1Ref} className="guest-hero-title">
            Your Safety,<br />
            <span className="guest-hero-accent">Our Priority.</span>
          </h1>

          <motion.p variants={fadeUp} className="guest-hero-sub">
            The fastest, most reliable platform to send emergency alerts to your trusted contacts — because every woman deserves to feel safe, everywhere, always.
          </motion.p>

          <motion.div variants={fadeUp} className="guest-hero-actions">
            <Link to="/register" className="guest-btn-primary">
              Get Started Free <ChevronRight size={16} />
            </Link>
            <Link to="/about" className="guest-btn-ghost">
              Learn More
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="guest-trust">
            <span><ShieldCheck size={14} className="guest-trust-icon guest-trust-icon--cyan" /> 24/7 Monitoring</span>
            <span><AlertTriangle size={14} className="guest-trust-icon guest-trust-icon--pink" /> Instant Alerts</span>
            <span><Users size={14} className="guest-trust-icon guest-trust-icon--blue" /> Trusted Network</span>
          </motion.div>
        </motion.div>

        <motion.div
          className="guest-hero-shield"
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ShieldCheck size={72} strokeWidth={1.2} />
        </motion.div>
      </section>

      {/* ── Stats Strip ── */}
      <motion.section
        className="guest-stats"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <StatItem icon={<Users size={24} className="text-cyan-500" />} val="50K+" label="Women Protected" delay={0} />
        <StatItem icon={<AlertTriangle size={24} className="text-pink-500" />} val="12K+" label="SOS Alerts Sent" delay={200} />
        <StatItem icon={<MapPin size={24} className="text-blue-500" />} val="120+" label="Cities Covered" delay={400} />
        <StatItem icon={<Heart size={24} className="text-rose-500" />} val="4.9" label="App Rating ★" delay={600} />
      </motion.section>

      {/* ── Features ── */}
      <section className="guest-features-section">
        <motion.div
          className="guest-section-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <span className="guest-section-badge">✨ Core Features</span>
          <h2 ref={guestH2Ref}>Everything You Need to Stay Safe</h2>
          <p>Purpose-built tools that work together to ensure help reaches you fast.</p>
        </motion.div>

        <motion.div
          className="guest-features-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {guestFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              className="guest-feature-card"
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <div className="guest-feature-icon" style={{ color: f.color, background: f.color + '18' }}>
                <f.icon size={22} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <div className="guest-feature-bar" style={{ background: f.color }} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How It Works ── */}
      <section className="guest-timeline-section">
        <motion.div
          className="guest-section-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <span className="guest-section-badge">⚡ How It Works</span>
          <h2>From Alert to Help in Minutes</h2>
          <p>Smart. Fast. Reliable.</p>
        </motion.div>

        <motion.div
          className="guest-timeline-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {[
            { time: '00', unit: 'Sec', title: 'SOS Triggered', desc: 'One tap sends your live location to all contacts.', icon: <Lock className="text-pink-500" size={22} />, color: 'pink', i: 0 },
            { time: '30', unit: 'Sec', title: 'Verification Call', desc: 'Automated call confirms the emergency is real.', icon: <PhoneCall className="text-purple-500" size={22} />, color: 'purple', i: 1 },
            { time: '02', unit: 'Min', title: 'Contacts Notified', desc: 'All trusted contacts receive push + SMS alerts.', icon: <Users className="text-cyan-500" size={22} />, color: 'cyan', i: 2 },
            { time: '05', unit: 'Min', title: 'Help On the Way', desc: 'Authorities dispatched if no acknowledgement.', icon: <Truck className="text-slate-600 dark:text-white" size={22} />, color: 'white', i: 3 },
          ].map((s) => (
            <motion.div key={s.title} variants={fadeUp} custom={s.i}>
              <TimelineStep {...s} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Testimonials ── */}
      <section className="guest-testimonials-section">
        <motion.div
          className="guest-section-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <span className="guest-section-badge">💬 What Users Say</span>
          <h2>Stories That Inspire Us</h2>
          <p>Real experiences from women across India.</p>
        </motion.div>

        <motion.div
          className="guest-testimonials-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="guest-testimonial-card"
              variants={fadeUp}
              custom={i}
              style={{ borderColor: t.color + '44' }}
            >
              <p className="guest-testimonial-quote">"{t.quote}"</p>
              <div className="guest-testimonial-author">
                <img src={t.avatar} alt={t.name} className="guest-testimonial-avatar" />
                <div>
                  <h4>{t.name}</h4>
                  <span>{t.location}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <motion.section
        className="guest-cta"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
      >
        <div className="guest-cta-orb" />
        <ShieldCheck size={40} className="guest-cta-icon" />
        <h2>Join 50,000+ Women Who Feel Safer</h2>
        <p>Create your free account and set up your emergency contacts in under 2 minutes.</p>
        <Link to="/register" className="guest-btn-primary guest-btn-primary--large">
          Start for Free <ChevronRight size={18} />
        </Link>
      </motion.section>
    </div>
  );
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('safeher_logged_in'));

  // Stay in sync when auth changes in this tab (SPA logout via navigate)
  useEffect(() => {
    const sync = () => setIsLoggedIn(!!localStorage.getItem('safeher_logged_in'));
    window.addEventListener('storage', sync);
    sync(); // check immediately on mount
    return () => window.removeEventListener('storage', sync);
  }, []);

  return isLoggedIn ? <LoggedInHome /> : <GuestHome />;
}

