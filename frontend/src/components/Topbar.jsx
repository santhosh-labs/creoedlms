import { Bell, HelpCircle, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import api from '../api';

export default function Topbar({ user }) {
    const location = useLocation();
    const navigate = useNavigate();

    const [announcements, setAnnouncements] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [showAnnouncements, setShowAnnouncements] = useState(false);
    const [showTickets, setShowTickets] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Refs for click-outside detection
    const ticketsRef = useRef(null);
    const announcementsRef = useRef(null);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [annRes, ticketRes] = await Promise.all([
                    api.get('/announcements'),
                    api.get('/tickets')
                ]);
                setAnnouncements(annRes.data.slice(0, 5));
                setTickets(ticketRes.data.slice(0, 5));
            } catch (err) {
                console.error("Failed to fetch topbar data", err);
            }
        };
        fetchData();
    }, []);

    // Close all dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ticketsRef.current && !ticketsRef.current.contains(e.target)) setShowTickets(false);
            if (announcementsRef.current && !announcementsRef.current.contains(e.target)) setShowAnnouncements(false);
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Format page title from route
    const getPageTitle = () => {
        switch (location.pathname) {
            case '/': return 'Dashboard';
            case '/courses': return 'Courses & Modules';
            case '/students': return 'Student Management';
            case '/fees': return 'Fee Tracking';
            case '/announcements': return 'Announcements';
            case '/assignments': return 'Assignments';
            case '/sessions': return 'Live Sessions';
            case '/tickets': return 'Doubt Tickets';
            case '/messages': return 'Messages';
            case '/account': return 'My Account';
            case '/settings': return 'Settings';
            case '/classes': return 'My Classes';
            case '/modules': return 'Modules';
            default: return 'Creoed LMS';
        }
    };

    const getUserCode = () => {
        if (user?.studentCode) return user.studentCode;
        if (user?.role === 'Tutor') return `TUTOR`;
        if (user?.role === 'Admin') return `ADMIN`;
        if (user?.role === 'Super Admin') return `SUPER ADMIN`;
        return user?.role || 'USER';
    };

    const roleColor = () => {
        switch (user?.role) {
            case 'Super Admin': return '#9c27b0';
            case 'Admin': return '#1976d2';
            case 'Tutor': return '#e67e22';
            default: return 'var(--primary)';
        }
    };

    return (
        <div className="topbar">
            <div>
                <h1 className="page-title">{getPageTitle()}</h1>
            </div>

            <div className="topbar-right" style={{ position: 'relative' }}>

                {/* Help/Tickets Dropdown */}
                <div style={{ position: 'relative' }} ref={ticketsRef}>
                    <button className="icon-button" onClick={() => { setShowTickets(prev => !prev); setShowAnnouncements(false); setShowUserMenu(false); }}>
                        <HelpCircle size={22} />
                        {tickets.length > 0 && <span className="notification-dot"></span>}
                    </button>
                    {showTickets && (
                        <div className="topbar-dropdown">
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <HelpCircle size={16} style={{ color: 'var(--primary)' }} />
                                    Recent Tickets
                                </h4>
                            </div>
                            <div style={{ padding: '8px 0', maxHeight: '300px', overflowY: 'auto' }}>
                                {tickets.length === 0 ? (
                                    <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <p style={{ fontSize: '13px', margin: 0 }}>No open tickets</p>
                                    </div>
                                ) : (
                                    tickets.map(t => (
                                        <div key={t.ID} className="dropdown-item" onClick={() => { setShowTickets(false); navigate('/tickets'); }}>
                                            <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>{t.Subject}</strong>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>From: {t.StudentName}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="dropdown-footer" onClick={() => { setShowTickets(false); navigate('/tickets'); }}>
                                View All Support
                            </div>
                        </div>
                    )}
                </div>

                {/* Announcements/Notifications Dropdown */}
                <div style={{ position: 'relative' }} ref={announcementsRef}>
                    <button className="icon-button" onClick={() => { setShowAnnouncements(prev => !prev); setShowTickets(false); setShowUserMenu(false); }}>
                        <Bell size={22} />
                        {announcements.length > 0 && <span className="notification-dot"></span>}
                    </button>
                    {showAnnouncements && (
                        <div className="topbar-dropdown">
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Bell size={16} style={{ color: 'var(--primary)' }} />
                                    Announcements
                                </h4>
                            </div>
                            <div style={{ padding: '8px 0', maxHeight: '300px', overflowY: 'auto' }}>
                                {announcements.length === 0 ? (
                                    <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <p style={{ fontSize: '13px', margin: 0 }}>No new notifications</p>
                                    </div>
                                ) : (
                                    announcements.map(a => (
                                        <div key={a.ID} className="dropdown-item" onClick={() => { setShowAnnouncements(false); navigate('/announcements'); }}>
                                            <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>{a.Title}</strong>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{a.AuthorName} • {new Date(a.CreatedAt).toLocaleDateString()}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="dropdown-footer" onClick={() => { setShowAnnouncements(false); navigate('/announcements'); }}>
                                View All Announcements
                            </div>
                        </div>
                    )}
                </div>

                {/* Avatar / User Menu Dropdown */}
                <div style={{ position: 'relative', marginLeft: '8px' }} ref={userMenuRef}>
                    <button
                        onClick={() => { setShowUserMenu(prev => !prev); setShowTickets(false); setShowAnnouncements(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '8px', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                        <div className="avatar" title={user?.name}>
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginRight: '2px' }} />
                    </button>

                    {showUserMenu && (
                        <div className="topbar-dropdown" style={{ right: 0, left: 'auto', minWidth: '260px', width: '280px' }}>
                            {/* User Identity Header */}
                            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '20px', flexShrink: 0, boxShadow: '0 4px 10px rgba(26, 174, 100, 0.2)' }}>
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</div>
                                    <div style={{ marginTop: '8px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, background: roleColor(), color: '#fff', padding: '3px 10px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                                            {getUserCode()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div style={{ padding: '12px 0' }}>
                                <button className="dropdown-item" style={{ width: 'calc(100% - 24px)', textAlign: 'left', background: 'none', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 500 }}
                                    onClick={() => { setShowUserMenu(false); navigate('/account'); }}>
                                    <User size={18} style={{ color: 'var(--primary)' }} />
                                    My Account
                                </button>
                                <button className="dropdown-item" style={{ width: 'calc(100% - 24px)', textAlign: 'left', background: 'none', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 500 }}
                                    onClick={() => { setShowUserMenu(false); navigate('/settings'); }}>
                                    <Settings size={18} style={{ color: 'var(--secondary)' }} />
                                    Settings
                                </button>
                            </div>

                            {/* Logout */}
                            <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0', background: 'var(--bg)' }}>
                                <button className="dropdown-item" style={{ width: 'calc(100% - 24px)', textAlign: 'left', background: 'none', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--danger)', fontSize: '14px', fontWeight: 500 }}
                                    onClick={handleLogout}>
                                    <LogOut size={18} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
