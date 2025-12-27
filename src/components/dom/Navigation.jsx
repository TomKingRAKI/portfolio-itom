import { useState, useEffect } from 'react';

/**
 * Navigation Component - Notebook Tabs Style
 * 
 * Side tabs that look like they're sticking out of a sketchbook.
 * Each tab represents a section with hand-drawn icons.
 */
const Navigation = ({ activeSection, onNavigate }) => {
    const [isVisible, setIsVisible] = useState(false);

    // Show navigation after a delay (after preloader)
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 3500);
        return () => clearTimeout(timer);
    }, []);

    const sections = [
        { id: 'hero', label: 'Home', icon: '⌂', shortcut: 'H' },
        { id: 'gallery', label: 'The Gallery', icon: '◈', shortcut: 'G' },
        { id: 'studio', label: 'The Studio', icon: '▶', shortcut: 'S' },
        { id: 'diary', label: 'Dev Diary', icon: '✎', shortcut: 'D' },
        { id: 'connect', label: "Let's Connect", icon: '✉', shortcut: 'C' },
    ];

    const handleClick = (sectionId) => {
        onNavigate(sectionId);

        // Smooth scroll to section
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className={`nav ${isVisible ? 'nav--visible' : ''}`}>
            <ul className="nav__list">
                {sections.map((section, index) => (
                    <li
                        key={section.id}
                        className={`nav__item ${activeSection === section.id ? 'nav__item--active' : ''}`}
                        style={{ transitionDelay: `${index * 0.1}s` }}
                    >
                        <button
                            className="nav__tab"
                            onClick={() => handleClick(section.id)}
                            aria-label={section.label}
                        >
                            <span className="nav__icon">{section.icon}</span>
                            <span className="nav__label">{section.label}</span>
                            <span className="nav__shortcut">{section.shortcut}</span>
                        </button>
                    </li>
                ))}
            </ul>

            {/* Decorative sketch line */}
            <div className="nav__sketch-line" />
        </nav>
    );
};

export default Navigation;
