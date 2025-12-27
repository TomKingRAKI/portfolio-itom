import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * Studio Section - "The Studio"
 * 
 * YouTube/Personal brand showcase with TV-style display
 * and playlist cards.
 */
const Studio = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        gsap.fromTo(
                            '.studio__tv',
                            { scale: 0.9, opacity: 0 },
                            { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' }
                        );
                        gsap.fromTo(
                            '.studio__playlist-item',
                            { x: 30, opacity: 0 },
                            { x: 0, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.3 }
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

    const playlists = [
        { id: 1, title: 'Web Dev Tutorials', videos: 12, color: '#FFE4E1' },
        { id: 2, title: 'Design Process', videos: 8, color: '#E1FFE4' },
        { id: 3, title: 'Behind the Code', videos: 5, color: '#E4E1FF' },
    ];

    return (
        <section id="studio" className="section section--studio" ref={sectionRef}>
            <div className="section__container">
                <header className="section__header">
                    <h2 className="section__title">
                        <span className="section__title-icon">▶</span>
                        The Studio
                    </h2>
                    <p className="section__subtitle">YouTube & creative content</p>

                    <svg className="section__underline" viewBox="0 0 200 10" preserveAspectRatio="none">
                        <path d="M0,5 Q50,0 100,5 T200,5" stroke="#39FF14" strokeWidth="2" fill="none" />
                    </svg>
                </header>

                <div className="studio__content">
                    {/* TV Display */}
                    <div className="studio__tv">
                        <div className="studio__tv-frame">
                            {/* Hand-drawn TV corners */}
                            <div className="studio__tv-corner studio__tv-corner--tl" />
                            <div className="studio__tv-corner studio__tv-corner--tr" />
                            <div className="studio__tv-corner studio__tv-corner--bl" />
                            <div className="studio__tv-corner studio__tv-corner--br" />

                            {/* Screen */}
                            <div className="studio__screen">
                                <div className="studio__play-button">▶</div>
                                <p className="studio__screen-text">Latest Video</p>
                            </div>

                            {/* TV Stand doodle */}
                            <div className="studio__tv-stand" />
                        </div>
                    </div>

                    {/* Playlists */}
                    <div className="studio__playlists">
                        <h3 className="studio__playlists-title">Playlists</h3>

                        {playlists.map((playlist) => (
                            <div
                                key={playlist.id}
                                className="studio__playlist-item"
                                style={{ '--playlist-color': playlist.color }}
                            >
                                <span className="studio__playlist-icon">♫</span>
                                <div className="studio__playlist-info">
                                    <span className="studio__playlist-name">{playlist.title}</span>
                                    <span className="studio__playlist-count">{playlist.videos} videos</span>
                                </div>
                            </div>
                        ))}

                        <a href="#" className="studio__channel-link">
                            Visit YouTube Channel →
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Studio;
