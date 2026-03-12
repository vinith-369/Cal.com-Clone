import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./Layout.css";

/** SVG icons matching Cal.com's sidebar style. */
const icons = {
    link: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    calendar: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    clock: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    menu: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    ),
    close: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
};

const navItems = [
    { to: "/event-types", label: "Event types", icon: icons.link },
    { to: "/bookings", label: "Bookings", icon: icons.calendar },
    { to: "/availability", label: "Availability", icon: icons.clock },
];

const mobileMoreIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
    </svg>
);

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="layout-container">
            {/* Sidebar (Desktop) */}
            <aside className="sidebar">
                <div className="sidebar__brand">
                    <div className="sidebar__logo">C</div>
                    <span className="sidebar__brand-text">Cal.com</span>
                </div>

                <nav className="sidebar__nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
                            }
                            id={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                        >
                            <span className="sidebar__icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar__footer">
                    <div className="sidebar__user">
                        <div className="sidebar__avatar">V</div>
                        <div className="sidebar__user-info">
                            <span className="sidebar__user-name">vinith</span>
                            <span className="sidebar__user-email">vinithlankireddy@gmail.com</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="main-layout">
                {/* Mobile Header (minimal) */}
                <header className="mobile-header">
                    <div className="mobile-logo">C</div>
                    <span className="mobile-title">Cal.com</span>
                    <div className="mobile-avatar">V</div>
                </header>

                <div className="main-layout__content">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `mobile-nav__link ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="mobile-nav__icon">{item.icon}</span>
                        <span className="mobile-nav__label">{item.label}</span>
                    </NavLink>
                ))}
                <button className="mobile-nav__link">
                    <span className="mobile-nav__icon">{mobileMoreIcon}</span>
                    <span className="mobile-nav__label">More</span>
                </button>
            </nav>
        </div>
    );
}
