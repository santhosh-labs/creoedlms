import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StudentDashboard from '../views/StudentDashboard';
import StudentCourses from '../views/StudentCourses';
import StudentSessions from '../views/StudentSessions';
import StudentAssignments from '../views/StudentAssignments';
import StudentFees from '../views/StudentFees';
import StudentTickets from '../views/StudentTickets';
import TutorDashboard from '../views/TutorDashboard';
import TutorClasses from '../views/TutorClasses';
import TutorModules from '../views/TutorModules';
import TutorAssignments from '../views/TutorAssignments';
import TutorTickets from '../views/TutorTickets';
import TutorSessions from '../views/TutorSessions';
import AdminDashboard from '../views/AdminDashboard';
import SuperAdminDashboard from '../views/SuperAdminDashboard';
import SuperAdminStudents from '../views/SuperAdminStudents';
import SuperAdminCourses from '../views/SuperAdminCourses';
import SuperAdminFees from '../views/SuperAdminFees';
import SuperAdminAnnouncements from '../views/SuperAdminAnnouncements';
import MyAccount from '../views/MyAccount';
import Messages from '../views/Messages';
import Settings from '../views/Settings';
import BackupRestore from '../views/BackupRestore';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            navigate('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    if (!user) return null;

    const renderDashboardView = () => {
        if (location.pathname === '/account') return <Settings user={user} />;
        if (location.pathname === '/settings') return <Settings user={user} />;
        if (location.pathname === '/announcements') return <SuperAdminAnnouncements user={user} />;

        switch (user.role) {
            case 'Student':
                if (location.pathname === '/courses')     return <StudentCourses user={user} />;
                if (location.pathname === '/sessions')    return <StudentSessions user={user} />;
                if (location.pathname === '/assignments') return <StudentAssignments user={user} />;
                if (location.pathname === '/fees')        return <StudentFees user={user} />;
                if (location.pathname === '/tickets')     return <StudentTickets user={user} />;
                if (location.pathname === '/messages')    return <Messages user={user} />;
                return <StudentDashboard user={user} />;
            case 'Tutor':
                if (location.pathname === '/classes')     return <TutorClasses user={user} />;
                if (location.pathname === '/modules')     return <TutorModules user={user} />;
                if (location.pathname === '/assignments') return <TutorAssignments user={user} />;
                if (location.pathname === '/tickets')     return <TutorTickets user={user} />;
                if (location.pathname === '/sessions')    return <TutorSessions user={user} />;
                if (location.pathname === '/messages')    return <Messages user={user} />;
                return <TutorDashboard user={user} />;
            case 'Admin':
                if (location.pathname === '/students')    return <SuperAdminStudents user={user} />;
                if (location.pathname === '/courses')     return <SuperAdminCourses user={user} />;
                if (location.pathname === '/fees')        return <SuperAdminFees user={user} />;
                if (location.pathname === '/backup')     return <BackupRestore user={user} />;
                return <AdminDashboard user={user} />;
            case 'Super Admin':
                if (location.pathname === '/students')    return <SuperAdminStudents user={user} />;
                if (location.pathname === '/courses')     return <SuperAdminCourses user={user} />;
                if (location.pathname === '/fees')        return <SuperAdminFees user={user} />;
                if (location.pathname === '/backup')     return <BackupRestore user={user} />;
                return <SuperAdminDashboard user={user} />;
            default: return <StudentDashboard user={user} />;
        }
    };

    return (
        <div className="app-container">
            <Sidebar role={user.role} />
            <div className="main-content">
                <Topbar user={user} />
                {renderDashboardView()}
            </div>
        </div>
    );
}
