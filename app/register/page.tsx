'use client';

import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { registerSchema, RegisterFormValues } from '@/utils/validation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/api/auth';
import { ApiError } from '@/types/auth';
import PublicRoute from '@/components/auth/PublicRoute';
import AuthLayout from '@/components/Layouts/AuthLayout';
import styles from './Register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const initialValues: RegisterFormValues = {
    email: '',
    password: '',
    confirmPassword: '',
    adName: '',
    username: '',
    designation: '',
    address: '',
    salary: 0,
    joiningDate: new Date().toISOString().split('T')[0],
    role: 'staff',
  };

  const handleSubmit = async (
    values: RegisterFormValues,
    { setSubmitting, setErrors }: FormikHelpers<RegisterFormValues>
  ) => {
    setIsLoading(true);
    try {
      const response = await authAPI.register({
        email: values.email,
        password: values.password,
        adName: values.adName,
        username: values.username,
        designation: values.designation,
        address: values.address,
        salary: values.salary,
        joiningDate: values.joiningDate,
        role: 'staff',
      });
      
      login(response.user, response.accessToken);
      toast.success('Registration successful!');
      router.push('/dashboard');
    } catch (error: any) {
      const apiError = error as ApiError;
      if (error.response?.status === 409) {
        setErrors({ email: 'Email already exists' });
        toast.error('Email already exists');
      } else if (error.response?.status === 403) {
        toast.error('Invalid role assignment');
      } else if (error.response?.status === 400) {
        const messages = error.response.data.message;
        if (Array.isArray(messages)) {
          messages.forEach((msg: string) => {
            toast.error(msg);
          });
        } else if (typeof messages === 'string') {
          toast.error(messages);
        }
      } else {
        toast.error(apiError.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <PublicRoute>
      <AuthLayout
        title="Create Account"
        subtitle="Sign up to get started with Fahim Academy"
      >
        <Formik
          initialValues={initialValues}
          validationSchema={registerSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className={styles.authForm}>
              {/* Email - Full Width */}
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>Email *</label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  placeholder="example.educationpro@gmail.com"
                  className={`${styles.formInput} ${errors.email && touched.email ? styles.error : ''}`}
                />
                <ErrorMessage name="email" component="div" className={styles.errorMessage} />
              </div>

              {/* Password & Confirm Password - Two Columns */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.formLabel}>Password *</label>
                  <Field
                    type="password"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    className={`${styles.formInput} ${errors.password && touched.password ? styles.error : ''}`}
                  />
                  <ErrorMessage name="password" component="div" className={styles.errorMessage} />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword" className={styles.formLabel}>Confirm Password *</label>
                  <Field
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="••••••••"
                    className={`${styles.formInput} ${errors.confirmPassword && touched.confirmPassword ? styles.error : ''}`}
                  />
                  <ErrorMessage name="confirmPassword" component="div" className={styles.errorMessage} />
                </div>
              </div>

              {/* Full Name & Username - Two Columns */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="adName" className={styles.formLabel}>Full Name *</label>
                  <Field
                    type="text"
                    id="adName"
                    name="adName"
                    placeholder="John Doe"
                    className={`${styles.formInput} ${errors.adName && touched.adName ? styles.error : ''}`}
                  />
                  <ErrorMessage name="adName" component="div" className={styles.errorMessage} />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="username" className={styles.formLabel}>Username *</label>
                  <Field
                    type="text"
                    id="username"
                    name="username"
                    placeholder="johndoe"
                    className={`${styles.formInput} ${errors.username && touched.username ? styles.error : ''}`}
                  />
                  <ErrorMessage name="username" component="div" className={styles.errorMessage} />
                </div>
              </div>

              {/* Designation - Full Width */}
              <div className={styles.formGroup}>
                <label htmlFor="designation" className={styles.formLabel}>Designation *</label>
                <Field
                  type="text"
                  id="designation"
                  name="designation"
                  placeholder="Software Developer"
                  className={`${styles.formInput} ${errors.designation && touched.designation ? styles.error : ''}`}
                />
                <ErrorMessage name="designation" component="div" className={styles.errorMessage} />
              </div>

              {/* Address - Full Width */}
              <div className={styles.formGroup}>
                <label htmlFor="address" className={styles.formLabel}>Address *</label>
                <Field
                  as="textarea"
                  id="address"
                  name="address"
                  placeholder="123 Main Street"
                  className={`${styles.formInput} ${errors.address && touched.address ? styles.error : ''}`}
                  rows={2}
                />
                <ErrorMessage name="address" component="div" className={styles.errorMessage} />
              </div>

              {/* Salary & Joining Date - Two Columns */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="salary" className={styles.formLabel}>Salary *</label>
                  <Field
                    type="number"
                    id="salary"
                    name="salary"
                    placeholder="50000"
                    className={`${styles.formInput} ${errors.salary && touched.salary ? styles.error : ''}`}
                  />
                  <ErrorMessage name="salary" component="div" className={styles.errorMessage} />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="joiningDate" className={styles.formLabel}>Joining Date *</label>
                  <Field
                    type="date"
                    id="joiningDate"
                    name="joiningDate"
                    className={`${styles.formInput} ${errors.joiningDate && touched.joiningDate ? styles.error : ''}`}
                  />
                  <ErrorMessage name="joiningDate" component="div" className={styles.errorMessage} />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={isLoading || isSubmitting}
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>

              {/* Sign In Link */}
              <div className={styles.authLink}>
                <p>
                  Already have an account?{' '}
                  <Link href="/login" className={styles.link}>
                    Sign In
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