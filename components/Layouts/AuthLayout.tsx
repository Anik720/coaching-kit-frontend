import React, { ReactNode } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className={styles.authWrapper}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* ── Left Brand Panel ── */}
      <div className={styles.brandPanel}>
        <div className={styles.brandBg}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.orb3} />
          <div className={styles.orb4} />
          <div className={styles.gridOverlay} />
          <div className={styles.particles}>
            <div className={`${styles.particle} ${styles.p1}`} />
            <div className={`${styles.particle} ${styles.p2}`} />
            <div className={`${styles.particle} ${styles.p3}`} />
            <div className={`${styles.particle} ${styles.p4}`} />
            <div className={`${styles.particle} ${styles.p5}`} />
            <div className={`${styles.particle} ${styles.p6}`} />
            <div className={`${styles.particle} ${styles.p7}`} />
            <div className={`${styles.particle} ${styles.p8}`} />
            <div className={`${styles.particle} ${styles.p9}`} />
            <div className={`${styles.particle} ${styles.p10}`} />
            <div className={`${styles.particle} ${styles.p11}`} />
            <div className={`${styles.particle} ${styles.p12}`} />
          </div>
        </div>

        <div className={styles.brandContent}>
          {/* Logo */}
          <div className={styles.brandLogo}>
            <div className={styles.logoMark}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="rgba(255,255,255,0.15)" />
                <rect width="36" height="36" rx="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <path d="M10 18l5.5 5.5 10.5-11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className={styles.logoText}>CoachKit</span>
          </div>

          {/* Hero */}
          <div className={styles.heroText}>
            <h1>
              Elevate Your
              <br />
              <em className={styles.heroHighlight}>Coaching Journey</em>
            </h1>
            <p>The complete platform for professional coaches — manage clients, track growth, and scale your practice with ease.</p>
          </div>

          {/* Features */}
          <ul className={styles.featureList}>
            <li>
              <span className={styles.featureDot} />
              Advanced Analytics &amp; Reporting
            </li>
            <li>
              <span className={styles.featureDot} />
              Client Management System
            </li>
            <li>
              <span className={styles.featureDot} />
              Financial Tracking &amp; Invoicing
            </li>
            <li>
              <span className={styles.featureDot} />
              Session Scheduling &amp; Notes
            </li>
          </ul>

          {/* Stats */}
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statNum}>500+</span>
              <span className={styles.statLabel}>Coaches</span>
            </div>
            <div className={styles.statSep} />
            <div className={styles.stat}>
              <span className={styles.statNum}>10K+</span>
              <span className={styles.statLabel}>Sessions</span>
            </div>
            <div className={styles.statSep} />
            <div className={styles.stat}>
              <span className={styles.statNum}>98%</span>
              <span className={styles.statLabel}>Satisfaction</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className={styles.formPanel}>
        <div className={styles.formScroll}>
          <div className={styles.formBox}>
            <div className={styles.formHead}>
              <div className={styles.welcomeBadge}>
                <span className={styles.badgeDot} />
                Welcome back
              </div>
              <h2 className={styles.formTitle}>{title}</h2>
              <p className={styles.formSubtitle}>{subtitle}</p>
            </div>
            {children}
          </div>
          <p className={styles.copyright}>© 2024 CoachKit · All rights reserved</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
