'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/Sidebar/Sidebar';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className={styles.dashboardContainer}>
        <Sidebar />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}