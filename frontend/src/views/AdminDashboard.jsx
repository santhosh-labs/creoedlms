import { useEffect, useState } from 'react';
import { Users, UserPlus, CreditCard, DollarSign, AlertCircle, BookOpen } from 'lucide-react';
import api from '../api';

export default function AdminDashboard({ user }) {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [feeSummary, setFeeSummary] = useState({ totalCollected: 0, totalPending: 0, totalStudents: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [studentRes, courseRes, feeRes] = await Promise.all([
                    api.get('/users/students'),
                    api.get('/courses'),
                    api.get('/fees/summary'),
                ]);
                setStudents(studentRes.data);
                setCourses(courseRes.data);
                setFeeSummary(feeRes.data);
            } catch (err) {
                console.error('Failed to load dashboard data', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const stats = [
        { title: 'Total Students Enrolled', value: students.length || '0', icon: <Users />, color: 'blue' },
        { title: 'Active Courses', value: courses.length || '0', icon: <BookOpen />, color: 'green' },
        { title: 'Total Revenue Collected', value: `₹${Number(feeSummary.totalCollected).toLocaleString()}`, icon: <DollarSign />, color: 'yellow' },
        { title: 'Pending Fees', value: `₹${Number(feeSummary.totalPending).toLocaleString()}`, icon: <CreditCard />, color: 'red' },
    ];

    return (
        <div className="content-wrapper">
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                    <AlertCircle size={20} />
                    <div>
                        <strong>Backend Connection Failed</strong>
                        <p style={{ fontSize: '13px', marginTop: '4px' }}>The frontend cannot reach the Microsoft SQL Server backend API.</p>
                    </div>
                </div>
            )}

            <div className="dashboard-grid">
                {stats.map((stat, i) => (
                    <div key={i} className="stats-card">
                        <div className="stats-info">
                            <h3>{stat.title}</h3>
                            <p>{stat.value}</p>
                        </div>
                        <div className={`stats-icon-wrapper ${stat.color}`}>
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </div>

            <div className="section-card">
                <div className="section-header">
                    <h2 className="section-title">Recent Student Registrations</h2>
                    <a href="/students" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ Register Student</a>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Registration ID</th>
                                <th>Student Name</th>
                                <th>Course Enrolled</th>
                                <th>Class/Batch Assigned</th>
                                <th>Payment Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No students registered yet.</td></tr>
                            ) : (
                                students.slice(0, 10).map((stu) => (
                                    <tr key={stu.ID}>
                                        <td><strong>{stu.StudentCode || `#STU-${10000 + stu.ID}`}</strong></td>
                                        <td>{stu.Name}</td>
                                        <td>{stu.CourseName || '-'}</td>
                                        <td>{stu.BatchName || '-'}</td>
                                        <td>
                                            <span className={`status-badge ${stu.PaymentStatus === 'Paid' ? 'status-paid' : stu.PaymentStatus === 'Partial' ? 'status-partial' : 'status-failed'}`}>
                                                {stu.PaymentStatus || 'Pending'}
                                            </span>
                                        </td>
                                        <td><a href="/students" className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px', textDecoration: 'none' }}>View All</a></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
