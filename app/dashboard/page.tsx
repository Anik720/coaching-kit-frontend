'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Users, BookOpen, DollarSign, BarChart3 } from 'lucide-react';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const activities = [
    { name: 'John Smith', action: 'paid monthly fee', time: '10 min ago', type: 'payment', icon: DollarSign },
    { name: 'Sarah Johnson', action: 'enrolled in Math Class', time: '1 hour ago', type: 'enrollment', icon: BookOpen },
    { name: 'Michael Chen', action: 'updated profile information', time: '2 hours ago', type: 'update', icon: Users },
    { name: 'Emma Wilson', action: 'completed assignment', time: '3 hours ago', type: 'assignment', icon: BarChart3 },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerText}>
              <h1>Welcome back, {user?.adName || 'User'}! 👋</h1>
              <p>Here&apos;s what&apos;s happening with your academy today.</p>
            </div>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statCardContent}>
              <div className={styles.statInfo}>
                <p>Total Students</p>
                <p className={styles.statNumber}>1,248</p>
                <p className={`${styles.statChange} ${styles.positive}`}>
                  <span>↑ 12%</span> from last month
                </p>
              </div>
              <div className={`${styles.statIcon} ${styles.blue}`}>
                <Users className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardContent}>
              <div className={styles.statInfo}>
                <p>Active Classes</p>
                <p className={styles.statNumber}>24</p>
                <p className={`${styles.statChange} ${styles.positive}`}>↑ 3 new this week</p>
              </div>
              <div className={`${styles.statIcon} ${styles.emerald}`}>
                <BookOpen className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardContent}>
              <div className={styles.statInfo}>
                <p>Monthly Revenue</p>
                <p className={styles.statNumber}>$12,580</p>
                <p className={`${styles.statChange} ${styles.positive}`}>
                  <span>↑ 8%</span> from last month
                </p>
              </div>
              <div className={`${styles.statIcon} ${styles.purple}`}>
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardContent}>
              <div className={styles.statInfo}>
                <p>Attendance Today</p>
                <p className={styles.statNumber}>89%</p>
                <p className={`${styles.statChange} ${styles.negative}`}>
                  <span>↓ 2%</span> from yesterday
                </p>
              </div>
              <div className={`${styles.statIcon} ${styles.orange}`}>
                <BarChart3 className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.contentGrid}>
          {/* Recent Activity */}
          <div className={styles.activitySection}>
            <h2>Recent Activity</h2>
            <div className={styles.activityList}>
              {activities.map((activity, index) => (
                <div key={index} className={styles.activityItem}>
                  <div className={`${styles.activityIcon} ${styles[activity.type]}`}>
                    <activity.icon className="w-6 h-6" />
                  </div>
                  <div className={styles.activityDetails}>
                    <p className={styles.activityName}>{activity.name}</p>
                    <p className={styles.activityAction}>{activity.action}</p>
                  </div>
                  <span className={styles.activityTime}>{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Info Card */}
          <div className={styles.userInfoCard}>
            <div className={styles.userInfoOverlay}></div>
            <div className={styles.userInfoContent}>
              <h2>Your Account</h2>
              <div className={styles.userDetails}>
                <p>
                  <span>Role:</span> {user?.role?.replace('_', ' ').toUpperCase() || 'STAFF'}
                </p>
                <p>
                  <span>Designation:</span> {user?.designation || 'Not specified'}
                </p>
                <p>
                  <span>Joined:</span> {new Date(user?.joiningDate || '').toLocaleDateString() || 'N/A'}
                </p>
              </div>
              <div className={styles.userFooter}>
                <div className={styles.userAvatar}>FA</div>
                <p className={styles.academyName}>Fahim Academy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}