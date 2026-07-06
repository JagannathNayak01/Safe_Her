import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShieldCheck, Bell, MapPin, Users, Zap, Lock, Heart, Star, ArrowRight, PhoneCall, Globe, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ─── Animated counter ─── */
function AnimatedCounter({ target, suffix = '' }) {
  const ref = useRef(null);
  const numRef = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !numRef.current) return;
    let rafId;
    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      if (!numRef.current) return; // guard against unmount
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      numRef.current.textContent = Math.floor(ease * target) + suffix;
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [inView, target, suffix]);

  return <span ref={ref}><span ref={numRef}>0{suffix}</span></span>;
}

/* ─── Data ─── */
const stats = [
  { icon: Users,    label: 'Women Protected',   value: 50000, suffix: '+' },
  { icon: Bell,     label: 'SOS Alerts Sent',   value: 12000, suffix: '+' },
  { icon: MapPin,   label: 'Cities Covered',    value: 120,   suffix: '+' },
  { icon: Star,     label: 'App Rating',        value: 4,     suffix: '.9★' },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'One-Tap SOS',
    desc: 'A single tap instantly alerts all emergency contacts with your real-time location and starts a 60-second escalation countdown.',
    color: '#06b6d4',
  },
  {
    icon: MapPin,
    title: 'Live Route Sharing',
    desc: 'Share a live-updating map link with trusted contacts so they can follow your journey in real time.',
    color: '#8b5cf6',
  },
  {
    icon: Bell,
    title: 'Smart Escalation',
    desc: 'If no contact acknowledges within 60 s, the system automatically escalates to secondary contacts and emergency services.',
    color: '#f59e0b',
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    desc: 'All location data and messages are encrypted in transit and never stored beyond the active session.',
    color: '#22c55e',
  },
  {
    icon: PhoneCall,
    title: 'Multi-Channel Alerts',
    desc: 'Push notifications, SMS, and call-based fallback ensure your contacts are reached even in low-signal areas.',
    color: '#ec4899',
  },
  {
    icon: Globe,
    title: 'Offline-Ready',
    desc: 'Critical contacts and location caching work even before an internet connection is restored.',
    color: '#f97316',
  },
];

const team = [
  {
    name: 'Aarav Sharma',
    role: 'Founder & CEO',
    initials: 'AS',
    color: '#06b6d4',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Aarav founded SafeHer after witnessing critical gaps in emergency response tools available to women across India.',
    responsibilities: ['Product vision & strategy', 'Investor relations', 'Team leadership', 'Partnership development'],
  },
  {
    name: 'Priya Mehta',
    role: 'Head of Safety Design',
    initials: 'PM',
    color: '#8b5cf6',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'Priya brings 8+ years of UX research focused on crisis communication, accessible design, and safety-first workflows.',
    responsibilities: ['User experience design', 'Safety workflow UX', 'Accessibility standards', 'Design system'],
  },
  {
    name: 'Rohan Gupta',
    role: 'Lead Engineer',
    initials: 'RG',
    color: '#f59e0b',
    photo: 'https://randomuser.me/api/portraits/men/67.jpg',
    bio: 'Rohan architects the real-time alert infrastructure with a relentless focus on reliability, speed, and zero downtime.',
    responsibilities: ['Backend architecture', 'Real-time alert systems', 'API design & security', 'DevOps & deployment'],
  },
  {
    name: 'Ananya Singh',
    role: 'Community & Outreach',
    initials: 'AS',
    color: '#ec4899',
    photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    bio: 'Ananya leads NGO partnerships and government collaborations to bring SafeHer to underserved communities nationwide.',
    responsibilities: ['NGO & govt partnerships', 'Community growth', 'Social awareness campaigns', 'User feedback programs'],
  },
];

const timeline = [
  { year: '2022', event: 'SafeHer founded after a community safety survey revealed critical gaps in emergency response.' },
  { year: '2023', event: 'Launched beta with SOS + live location. Reached 5,000 users in 3 months.' },
  { year: '2024', event: 'Multi-channel escalation, offline caching, and 120 city rollout.' },
  { year: '2025', event: 'International expansion and AI-powered threat detection in progress.' },
];

/* ─── Main component ─── */
export default function About() {
  const navigate = useNavigate();
  const [isLoggedIn] = useState(() => !!localStorage.getItem('safeher_logged_in'));

  return (
    <div className="about-page">

      {/* ── Hero ── */}
      <section className="about-hero">
        {/* animated gradient orbs */}
        <div className="about-orb about-orb--cyan" />
        <div className="about-orb about-orb--violet" />
        <div className="about-orb about-orb--rose" />

        <motion.div
          className="about-hero-inner"
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} custom={0} className="about-hero-badge">
            <ShieldCheck size={14} />
            Women Safety Platform
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="about-hero-title">
            Built for Safety.<br />
            <span className="about-hero-accent">Designed for Her.</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="about-hero-sub">
            SafeHer is a real-time emergency response platform that puts protection at your fingertips —
            because every woman deserves to feel safe, everywhere, always.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="about-hero-actions">
            {isLoggedIn ? (
              <button className="about-btn-primary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button className="about-btn-primary" onClick={() => navigate('/register')}>
                  Get Started <ArrowRight size={16} />
                </button>
                <button className="about-btn-ghost" onClick={() => navigate('/login')}>
                  Sign In
                </button>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* floating shield */}
        <motion.div
          className="about-hero-shield"
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ShieldCheck size={72} strokeWidth={1.2} />
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <motion.section
        className="about-stats"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {stats.map((s, i) => (
          <motion.div key={s.label} className="about-stat-card" variants={scaleIn} custom={i}>
            <div className="about-stat-icon" style={{ background: s.color + '22', color: s.color }}>
              <s.icon size={22} />
            </div>
            <p className="about-stat-value">
              <AnimatedCounter target={s.value} suffix={s.suffix} />
            </p>
            <p className="about-stat-label">{s.label}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* ── Mission & Vision ── */}
      <section className="about-split">
        <motion.div
          className="about-split-card about-split-card--mission"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeLeft}
        >
          <div className="about-split-icon">
            <Heart size={28} />
          </div>
          <h2>Our Mission</h2>
          <p>
            To make every woman's journey safer by combining real-time technology with a compassionate community —
            so that help is never more than a tap away, regardless of where you are.
          </p>
        </motion.div>

        <motion.div
          className="about-split-card about-split-card--vision"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeRight}
        >
          <div className="about-split-icon">
            <Zap size={28} />
          </div>
          <h2>Our Vision</h2>
          <p>
            A world where no woman has to think twice about her safety. SafeHer envisions becoming the global
            standard for personal safety infrastructure — transparent, private, and universally accessible.
          </p>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="about-features-section">
        <motion.div
          className="about-section-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <span className="about-section-badge"><Award size={13} /> Core Features</span>
          <h2>Everything You Need to Stay Safe</h2>
          <p>Purpose-built tools that work together to ensure help reaches you fast.</p>
        </motion.div>

        <motion.div
          className="about-features-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {features.map((f, i) => (
            <motion.div key={f.title} className="about-feature-card" variants={fadeUp} custom={i}>
              <div className="about-feature-icon" style={{ color: f.color, background: f.color + '18' }}>
                <f.icon size={22} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <div className="about-feature-bar" style={{ background: f.color }} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Timeline ── */}
      <section className="about-timeline-section">
        <motion.div
          className="about-section-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <span className="about-section-badge">Our Journey</span>
          <h2>How We Got Here</h2>
        </motion.div>

        <div className="about-timeline">
          {timeline.map((t, i) => (
            <motion.div
              key={t.year}
              className="about-timeline-item"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <div className="about-timeline-dot" />
              <div className="about-timeline-content">
                <span className="about-timeline-year">{t.year}</span>
                <p>{t.event}</p>
              </div>
            </motion.div>
          ))}
          <div className="about-timeline-line" />
        </div>
      </section>

      {/* ── Team ── */}
      <section className="about-team-section">
        <motion.div
          className="about-section-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <span className="about-section-badge"><Users size={13} /> The Team</span>
          <h2>The People Behind SafeHer</h2>
          <p>A passionate team united by one goal — making every woman safer.</p>
        </motion.div>

        <motion.div
          className="about-team-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {team.map((m, i) => (
            <motion.div
              key={m.name}
              className="about-flip-card"
              variants={fadeUp}
              custom={i}
            >
              <div className="about-flip-inner">

                {/* ── FRONT ── */}
                <div className="about-flip-front">
                  <div className="about-team-top-bar" style={{ background: `linear-gradient(90deg, ${m.color}, ${m.color}66)` }} />
                  <div className="about-team-photo-wrap" style={{ borderColor: m.color + '88' }}>
                    <img
                      src={m.photo}
                      alt={m.name}
                      className="about-team-photo"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div
                      className="about-team-avatar"
                      style={{ display: 'none', background: `linear-gradient(135deg, ${m.color}, ${m.color}99)` }}
                    >
                      {m.initials}
                    </div>
                  </div>
                  <h3 className="about-flip-name">{m.name}</h3>
                  <p className="about-flip-role" style={{ color: m.color }}>{m.role}</p>
                  <p className="about-flip-bio">{m.bio}</p>
                </div>

                {/* ── BACK ── */}
                <div
                  className="about-flip-back"
                  style={{
                    background: `linear-gradient(145deg, ${m.color}22, ${m.color}08)`,
                    borderColor: m.color + '44',
                  }}
                >
                  <div className="about-flip-back-icon" style={{ background: m.color + '22', color: m.color }}>
                    {m.initials}
                  </div>
                  <h3 className="about-flip-name">{m.name}</h3>
                  <p className="about-flip-role" style={{ color: m.color }}>{m.role}</p>
                  <ul className="about-flip-list" style={{ '--accent': m.color }}>
                    {m.responsibilities.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>

              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <motion.section
        className="about-cta"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
      >
        <div className="about-cta-orb" />
        <ShieldCheck size={40} className="about-cta-icon" />
        <h2>Join 50,000+ Women Who Feel Safer</h2>
        <p>Create your free account and set up your emergency contacts in under 2 minutes.</p>
        {isLoggedIn ? (
          <button className="about-btn-primary about-btn-primary--large" onClick={() => navigate('/dashboard')}>
            Go to Dashboard <ArrowRight size={18} />
          </button>
        ) : (
          <button className="about-btn-primary about-btn-primary--large" onClick={() => navigate('/register')}>
            Start for Free <ArrowRight size={18} />
          </button>
        )}
      </motion.section>

    </div>
  );
}
