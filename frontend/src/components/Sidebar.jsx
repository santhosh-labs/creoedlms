import { useState, useEffect } from 'react';
import { BookOpen, Calendar, MessageSquare, MessageCircle, CreditCard, LayoutDashboard, Users, FileText, LogOut, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ role }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const toggleSidebar = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem('sidebar_collapsed', next.toString());
    };

    const getNavLinks = () => {
        switch (role) {
            case 'Student':
                return [
                    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="nav-item-icon" /> },
                    { name: 'My Learning', path: '/courses', icon: <BookOpen className="nav-item-icon" /> },
                    { name: 'Coursework', path: '/assignments', icon: <FileText className="nav-item-icon" /> },
                    { name: 'Notice Board', path: '/announcements', icon: <MessageSquare className="nav-item-icon" /> },
                    { name: 'Support Tickets', path: '/tickets', icon: <MessageSquare className="nav-item-icon" /> },
                    { name: 'Inbox', path: '/messages', icon: <MessageCircle className="nav-item-icon" /> },
                    { name: 'Payments', path: '/fees', icon: <CreditCard className="nav-item-icon" /> },
                ];
            case 'Tutor':
                return [
                    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="nav-item-icon" /> },
                    { name: 'Classroom', path: '/classes', icon: <Users className="nav-item-icon" /> },
                    { name: 'Curriculum', path: '/modules', icon: <BookOpen className="nav-item-icon" /> },
                    { name: 'Coursework', path: '/assignments', icon: <FileText className="nav-item-icon" /> },
                    { name: 'Support Tickets', path: '/tickets', icon: <MessageSquare className="nav-item-icon" /> },
                    { name: 'Inbox', path: '/messages', icon: <MessageCircle className="nav-item-icon" /> },
                    { name: 'Notice Board', path: '/announcements', icon: <MessageSquare className="nav-item-icon" /> },
                ];
            case 'Admin':
            case 'Super Admin':
                return [
                    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="nav-item-icon" /> },
                    { name: 'User Management', path: '/students', icon: <Users className="nav-item-icon" /> },
                    { name: 'Program Management', path: '/courses', icon: <BookOpen className="nav-item-icon" /> },
                    { name: 'Financials', path: '/fees', icon: <CreditCard className="nav-item-icon" /> },
                    { name: 'Notice Board', path: '/announcements', icon: <MessageSquare className="nav-item-icon" /> },
                    { name: 'Backup & Restore', path: '/backup', icon: <Shield className="nav-item-icon" /> },
                ];
            default:
                return [];
        }
    };

    const links = getNavLinks();

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="logo-container">
                <img
                    className="logo-dark"
                    src="/CREO.ED (7).png"
                    alt="Creoed"
                    style={{ height: collapsed ? '32px' : '38px', width: 'auto', objectFit: 'contain', transition: 'height 0.2s', display: 'block' }}
                />
                <img
                    className="logo-light"
                    src="/CREO.ED (9).png"
                    alt="Creoed"
                    style={{ height: collapsed ? '32px' : '38px', width: 'auto', objectFit: 'contain', transition: 'height 0.2s', display: 'block' }}
                />
            </div>
            <nav className="nav-menu" style={{ flex: 1, marginTop: '12px', overflowY: 'auto' }}>
                {links.map((link, idx) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <button
                            key={idx}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => navigate(link.path)}
                            title={collapsed ? link.name : ''}
                        >
                            {link.icon}
                            <span style={{ fontSize: '14px' }}>{link.name}</span>
                        </button>
                    )
                })}
            </nav>
            <div className="nav-menu" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: 'auto' }}>
                <button className="nav-item" onClick={toggleSidebar} style={{ color: 'var(--text-muted)' }} title="Toggle Sidebar">
                    {collapsed ? <ChevronRight className="nav-item-icon" /> : <ChevronLeft className="nav-item-icon" />}
                    <span>Collapse</span>
                </button>
                <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--danger)' }} title="Logout">
                    <LogOut className="nav-item-icon" />
                    <span style={{ fontSize: '14px' }}>Logout</span>
                </button>
            </div>
        </aside>
    );
}
