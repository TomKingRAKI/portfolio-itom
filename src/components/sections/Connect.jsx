import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

/**
 * Connect Section - "Let's Connect"
 * 
 * Contact & about section with postcard-style form
 * and social links.
 */
const Connect = () => {
    const sectionRef = useRef(null);
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        gsap.fromTo(
                            '.connect__card',
                            { y: 50, opacity: 0, rotation: -3 },
                            { y: 0, opacity: 1, rotation: 0, duration: 0.8, ease: 'back.out(1.4)' }
                        );
                        gsap.fromTo(
                            '.connect__social-item',
                            { scale: 0, opacity: 0 },
                            { scale: 1, opacity: 1, duration: 0.4, stagger: 0.1, delay: 0.4 }
                        );
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        // Add form submission logic here
    };

    const socials = [
        { id: 'github', icon: '◉', label: 'GitHub', url: '#' },
        { id: 'linkedin', icon: '◐', label: 'LinkedIn', url: '#' },
        { id: 'twitter', icon: '◑', label: 'Twitter', url: '#' },
        { id: 'youtube', icon: '▶', label: 'YouTube', url: '#' },
    ];

    return (
        <section id="connect" className="section section--connect" ref={sectionRef}>
            <div className="section__container">
                <header className="section__header">
                    <h2 className="section__title">
                        <span className="section__title-icon">✉</span>
                        Let's Connect
                    </h2>
                    <p className="section__subtitle">Drop me a line or say hello</p>

                    <svg className="section__underline" viewBox="0 0 200 10" preserveAspectRatio="none">
                        <path d="M0,5 Q50,0 100,5 T200,5" stroke="#39FF14" strokeWidth="2" fill="none" />
                    </svg>
                </header>

                <div className="connect__content">
                    {/* Postcard form */}
                    <div className="connect__card">
                        {/* Stamp decoration */}
                        <div className="connect__stamp">
                            <span>✈</span>
                        </div>

                        {/* Postmark */}
                        <div className="connect__postmark">ITOM</div>

                        <form className="connect__form" onSubmit={handleSubmit}>
                            <div className="connect__field">
                                <label className="connect__label">Your Name</label>
                                <input
                                    type="text"
                                    className="connect__input"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="connect__field">
                                <label className="connect__label">Email</label>
                                <input
                                    type="email"
                                    className="connect__input"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="connect__field">
                                <label className="connect__label">Message</label>
                                <textarea
                                    className="connect__textarea"
                                    placeholder="Write your message here..."
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="connect__submit">
                                Send Message ✈
                            </button>
                        </form>
                    </div>

                    {/* Social links */}
                    <div className="connect__socials">
                        <h3 className="connect__socials-title">Find me elsewhere</h3>

                        <div className="connect__social-grid">
                            {socials.map((social) => (
                                <a
                                    key={social.id}
                                    href={social.url}
                                    className="connect__social-item"
                                    aria-label={social.label}
                                >
                                    <span className="connect__social-icon">{social.icon}</span>
                                    <span className="connect__social-label">{social.label}</span>
                                </a>
                            ))}
                        </div>

                        {/* Email direct */}
                        <a href="mailto:hello@itom.dev" className="connect__email">
                            hello@itom.dev
                        </a>
                    </div>
                </div>

                {/* Footer note */}
                <footer className="connect__footer">
                    <p className="connect__copyright">
                        © 2024 ITOM · Crafted with ♥ and lots of ☕
                    </p>
                </footer>
            </div>
        </section>
    );
};

export default Connect;
