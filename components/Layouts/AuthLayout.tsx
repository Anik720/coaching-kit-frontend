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
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      {/* Animated Background Elements */}
      <div className={styles.backgroundDecoration}>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
      </div>
      
      <div className={styles.authContainer}>
        <div className={styles.authCard}>

          {/* Content */}
          <div className={styles.authContent}>
            <div className={styles.formHeader}>
              <h2>{title}</h2>
              <p className={styles.subtitle}>{subtitle}</p>
            </div>
            
            {children}
          </div>

          {/* Footer */}
          <div className={styles.authFooter}>
            <p className={styles.copyright}>
              © 2024 All rights reserved educationpro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;