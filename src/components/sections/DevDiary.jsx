import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * DevDiary Section - "Dev Diary"
 * 
 * Blog section styled as notebook pages with handwritten entries.
 */
const DevDiary = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        gsap.fromTo(
                            '.diary__entry',
                            { y: 40, opacity: 0, rotation: () => gsap.utils.random(-2, 2) },
                            { y: 0, opacity: 1, rotation: 0, duration: 0.6, stagger: 0.12 }
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

    const entries = [
        {
            id: 1,
            date: '2024.12.20',
            title: 'Building Awwwards-Level Animations',
            excerpt: 'Deep dive into GSAP and Framer Motion...',
            category: 'Tutorial',
        },
        {
            id: 2,
            date: '2024.12.15',
            title: 'My React Three Fiber Journey',
            excerpt: 'From zero to hero with 3D in React...',
            category: 'Story',
        },
        {
            id: 3,
            date: '2024.12.10',
            title: 'Design System from Scratch',
            excerpt: 'Creating consistent UI components...',
            category: 'Guide',
        },
    ];

    return (
        <section id="diary" className="section section--diary" ref={sectionRef}>
            <div className="section__container">
                <header className="section__header">
                    <h2 className="section__title">
                        <span className="section__title-icon">✎</span>
                        Dev Diary
                    </h2>
                    <p className="section__subtitle">Notes, thoughts & tutorials</p>

                    <svg className="section__underline" viewBox="0 0 200 10" preserveAspectRatio="none">
                        <path d="M0,5 Q50,0 100,5 T200,5" stroke="#39FF14" strokeWidth="2" fill="none" />
                    </svg>
                </header>

                {/* Notebook spine decoration */}
                <div className="diary__spine">
                    <div className="diary__ring" />
                    <div className="diary__ring" />
                    <div className="diary__ring" />
                    <div className="diary__ring" />
                    <div className="diary__ring" />
                </div>

                <div className="diary__entries">
                    {entries.map((entry) => (
                        <article key={entry.id} className="diary__entry">
                            {/* Paper texture lines */}
                            <div className="diary__lines" />

                            {/* Entry content */}
                            <div className="diary__content">
                                <div className="diary__meta">
                                    <time className="diary__date">{entry.date}</time>
                                    <span className="diary__category">{entry.category}</span>
                                </div>

                                <h3 className="diary__title">{entry.title}</h3>
                                <p className="diary__excerpt">{entry.excerpt}</p>

                                <a href="#" className="diary__read-more">Read more →</a>
                            </div>

                            {/* Corner fold */}
                            <div className="diary__fold" />
                        </article>
                    ))}
                </div>

                <a href="#" className="diary__view-all">
                    Open full diary →
                </a>
            </div>
        </section>
    );
};

export default DevDiary;
