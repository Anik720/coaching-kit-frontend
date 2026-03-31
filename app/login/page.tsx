'use client';

import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { loginSchema, LoginFormValues } from '@/utils/validation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/api/auth';
import { ApiError } from '@/types/auth';
import PublicRoute from '@/components/auth/PublicRoute';
import AuthLayout from '@/components/Layouts/AuthLayout';
import styles from './Login.module.css';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const initialValues: LoginFormValues = {
    email: '',
    password: '',
    rememberMe: false,
  };

  const handleSubmit = async (
    values: LoginFormValues,
    { setSubmitting, setErrors }: FormikHelpers<LoginFormValues>
  ) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login({
        email: values.email,
        password: values.password,
      });

      login(response.user, response.accessToken);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      const apiError = error as ApiError;
      if (error.response?.status === 401) {
        setErrors({
          email: ' ',
          password: 'Invalid email or password',
        });
        toast.error('Invalid email or password');
      } else {
        toast.error(apiError.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <PublicRoute>
      <AuthLayout
        title="Welcome Back"
        subtitle="Enter your credentials to access your account"
      >
        <Formik
          initialValues={initialValues}
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className={styles.authForm}>
              {/* Email */}
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>
                  Email Address
                </label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  placeholder="admin@fahimacademy.com"
                  className={`${styles.formInput} ${errors.email && touched.email ? styles.error : ''}`}
                />
                <ErrorMessage name="email" component="div" className={styles.errorMessage} />
              </div>

              {/* Password */}
              <div className={styles.formGroup}>
                <div className={styles.passwordLabelContainer}>
                  <label htmlFor="password" className={styles.formLabel}>
                    Password
                  </label>
                  <Link href="/forgot-password" className={styles.forgotPassword}>
                    Forgot password?
                  </Link>
                </div>
                <div className={styles.passwordWrapper}>
                  <Field
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    className={`${styles.formInput} ${errors.password && touched.password ? styles.error : ''}`}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                <ErrorMessage name="password" component="div" className={styles.errorMessage} />
              </div>

              {/* Remember me */}
              <div className={styles.formCheck}>
                <Field
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  className={styles.checkbox}
                />
                <label htmlFor="rememberMe" className={styles.checkboxLabel}>
                  Remember me
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className={styles.btnPrimary}
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>

              {/* Divider */}
              <div className={styles.divider}>
                <span className={styles.dividerText}>Or continue with</span>
              </div>

              {/* Google */}
              <button type="button" className={styles.btnGoogle}>
                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>

              {/* Sign up link */}
              <div className={styles.authLink}>
                <p>
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className={styles.link}>
                    Sign up
                  </Link>
                </p>
              </div>
            </Form>
          )}
        </Formik>
      </AuthLayout>
    </PublicRoute>
  );
}
