import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * Gallery Section - "The Gallery"
 * 
 * Portfolio projects displayed as pinned photos/cards
 * with tape, pins, and handwritten notes.
 */
const Gallery = () => {
    const sectionRef = useRef(null);
    const cardsRef = useRef([]);

    // Animate cards on scroll into view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        gsap.fromTo(
                            cardsRef.current,
                            { y: 60, opacity: 0, rotation: () => gsap.utils.random(-5, 5) },
                            {
                                y: 0,
                                opacity: 1,
                                duration: 0.8,
                                stagger: 0.15,
                                ease: 'power3.out'
                            }
                        );
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const projects = [
        {
            id: 1,
            title: 'Project One',
            category: 'Web Design',
            color: '#f0e6d3',
            rotation: -3,
        },
        {
            id: 2,
            title: 'Project Two',
            category: 'Development',
            color: '#e6f0e6',
            rotation: 2,
        },
        {
            id: 3,
            title: 'Project Three',
            category: 'Branding',
            color: '#e6e6f0',
            rotation: -1,
        },
        {
            id: 4,
            title: 'Project Four',
            category: 'UI/UX',
            color: '#f0e6e6',
            rotation: 4,
        },
    ];

    return (
        <section id="gallery" className="section section--gallery" ref={sectionRef}>
            <div className="section__container">
                {/* Section header */}
                <header className="section__header">
                    <h2 className="section__title">
                        <span className="section__title-icon">◈</span>
                        The Gallery
                    </h2>
                    <p className="section__subtitle">Selected works & experiments</p>

                    {/* Decorative underline */}
                    <svg className="section__underline" viewBox="0 0 200 10" preserveAspectRatio="none">
                        <path d="M0,5 Q50,0 100,5 T200,5" stroke="#39FF14" strokeWidth="2" fill="none" />
                    </svg>
                </header>

                {/* Projects grid */}
                <div className="gallery__grid">
                    {projects.map((project, index) => (
                        <article
                            key={project.id}
                            className="gallery__card"
                            ref={el => cardsRef.current[index] = el}
                            style={{
                                '--rotation': `${project.rotation}deg`,
                                '--bg-color': project.color
                            }}
                        >
                            {/* Pin decoration */}
                            <div className="gallery__pin" />

                            {/* Project image placeholder */}
                            <div className="gallery__image">
                                <span className="gallery__image-placeholder">✎</span>
                            </div>

                            {/* Project info */}
                            <div className="gallery__info">
                                <span className="gallery__category">{project.category}</span>
                                <h3 className="gallery__title">{project.title}</h3>
                            </div>

                            {/* Tape decoration */}
                            <div className="gallery__tape" />
                        </article>
                    ))}
                </div>

                {/* View all link */}
                <a href="#" className="gallery__view-all">
                    View all projects →
                </a>
            </div>
        </section>
    );
};

export default Gallery;
