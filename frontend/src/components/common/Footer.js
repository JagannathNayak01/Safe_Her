import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Instagram, MapPin, Heart, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const taglineRef = useRef(null);
  const copyrightRef = useRef(null);
  const canvasRef = useRef(null);
  const logoRef = useRef(null);
  const socialRef = useRef(null);

  useEffect(() => {
    const targets = [
      { ref: taglineRef, effect: 'wave' },
      { ref: copyrightRef, effect: 'rotate' },
      { ref: logoRef, effect: 'shine' },
    ];

    const observers = [];
    const cleanups = [];

    import('https://esm.sh/animejs').then(({ createTimeline, animate, stagger, splitText }) => {
      targets.forEach(({ ref, effect }) => {
        if (!ref.current) return;

        if (effect === 'shine') {
          // Logo sweep shimmer — no splitText needed
          const tl = createTimeline({ loop: true, loopDelay: 3000 })
            .add(ref.current, {
              backgroundPositionX: ['200%', '-200%'],
              duration: 1200,
              ease: 'inOut(2)',
            });
          cleanups.push(() => tl.pause());
          return;
        }

        const { chars } = splitText(ref.current, { chars: { wrap: 'clip' } });

        chars.forEach(c => {
          c.style.display = 'inline-block';
          c.style.opacity = '0';
          if (effect === 'wave') c.style.transform = 'translateY(20px)';
          if (effect === 'rotate') c.style.transform = 'rotateX(90deg)';
        });

        let played = false;
        const obs = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting && !played) {
            played = true;
            if (effect === 'wave') {
              const tl = createTimeline().add(chars, {
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 600,
                ease: 'outElastic(1, .6)',
              }, stagger(40, { from: 'left' }));
              cleanups.push(() => tl.pause());
            }
            if (effect === 'rotate') {
              const tl = createTimeline().add(chars, {
                opacity: [0, 1],
                rotateX: [90, 0],
                duration: 500,
                ease: 'outExpo',
              }, stagger(30, { from: 'center' }));
              cleanups.push(() => tl.pause());
            }
          }
        }, { threshold: 0.3 });

        obs.observe(ref.current);
        observers.push(obs);
      });

      // Staggered entrance for social buttons
      if (socialRef.current) {
        const btns = Array.from(socialRef.current.querySelectorAll('.footer-social-btn'));
        btns.forEach(b => { b.style.opacity = '0'; b.style.transform = 'scale(0.4) translateY(12px)'; });
        const tl = createTimeline()
          .add(btns, {
            opacity: [0, 1],
            scale: [0.4, 1],
            translateY: [12, 0],
            duration: 500,
            ease: 'outBack(1.8)',
          }, stagger(80, { from: 'left' }));
        cleanups.push(() => tl.pause());
      }
    });

    return () => {
      observers.forEach(o => o.disconnect());
      cleanups.forEach(fn => fn());
    };
  }, []);

  // Floating particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 40;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      a: Math.random(),
    }));

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6,182,212,${p.a * 0.4})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <footer className="footer-rich">
      {/* Floating Particle Canvas */}
      <canvas ref={canvasRef} className="footer-canvas" aria-hidden="true" />

      {/* Top Glow Bar */}
      <div className="footer-glow-bar" />

      <div className="footer-inner">

        {/* Brand Column */}
        <div className="footer-brand">
          <div className="footer-logo">
            <ShieldCheck size={22} className="footer-logo-icon" />
            <span ref={logoRef} className="footer-logo-text footer-logo-shimmer">SafeHer</span>
          </div>
          <p ref={taglineRef} className="footer-tagline">
            Your safety is our mission — always on, always protecting.
          </p>
          <div ref={socialRef} className="footer-social">
            <a href="mailto:support@safeher.app" className="footer-social-btn" aria-label="Email">
              <Mail size={16} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-social-btn footer-social-insta" aria-label="Instagram">
              <Instagram size={16} />
            </a>
            <a href="#" className="footer-social-btn" aria-label="Location">
              <MapPin size={16} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-links-col">
          <h4 className="footer-col-title">Product</h4>
          <ul className="footer-link-list">
            <li><Link to="/dashboard" className="footer-link"><ArrowUpRight size={12} /> Dashboard</Link></li>
            <li><Link to="/contacts" className="footer-link"><ArrowUpRight size={12} /> Emergency Contacts</Link></li>
            <li><Link to="/history" className="footer-link"><ArrowUpRight size={12} /> Incident History</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div className="footer-links-col">
          <h4 className="footer-col-title">Company</h4>
          <ul className="footer-link-list">
            <li><a href="#" className="footer-link"><ArrowUpRight size={12} /> About Us</a></li>
            <li><a href="#" className="footer-link"><ArrowUpRight size={12} /> Privacy Policy</a></li>
            <li><a href="#" className="footer-link"><ArrowUpRight size={12} /> Terms of Service</a></li>
          </ul>
        </div>

        {/* Status */}
        <div className="footer-status-col">
          <h4 className="footer-col-title">System Status</h4>
          <div className="footer-status-item">
            <span className="footer-status-dot green" />
            <span>All systems operational</span>
          </div>
          <div className="footer-status-item">
            <span className="footer-status-dot green" />
            <span>API response: 42ms</span>
          </div>
          <div className="footer-status-item">
            <span className="footer-status-dot green" />
            <span>Alert network: Online</span>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p ref={copyrightRef} className="footer-copy">
          © 2026 SafeHer · Made with love for safety
        </p>
        <p className="footer-heart">
          Built with <Heart size={12} className="footer-heart-icon" /> by the SafeHer team
        </p>

        {/* Animated Social Icons — bottom right */}
        <div className="social-icons-wrapper">
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon" style={{ '--color': '#e1306c' }} aria-label="Instagram">
            <i className="fa-brands fa-instagram" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-icon" style={{ '--color': '#0077b5' }} aria-label="LinkedIn">
            <i className="fa-brands fa-linkedin-in" />
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="social-icon" style={{ '--color': '#333' }} aria-label="GitHub">
            <i className="fa-brands fa-github" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-icon" style={{ '--color': '#1da1f2' }} aria-label="Twitter / X">
            <i className="fa-brands fa-x-twitter" />
          </a>
        </div>
      </div>
    </footer>
  );
}
