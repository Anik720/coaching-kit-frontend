import { RegisterRequest } from '@/types/auth';
import * as Yup from 'yup';

export const loginSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  rememberMe: Yup.boolean(),
});

export type LoginFormValues = Yup.InferType<typeof loginSchema>;

export const registerSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match') // Fixed: removed null
    .required('Confirm password is required'),
  adName: Yup.string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters'),
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters'),
  designation: Yup.string()
    .required('Designation is required'),
  address: Yup.string()
    .required('Address is required'),
  salary: Yup.number()
    .min(0, 'Salary must be positive')
    .required('Salary is required'),
  joiningDate: Yup.string()
    .required('Joining date is required'),
  // Optional fields from the response
  addressName: Yup.string()
    .optional(),
  addressDescription: Yup.string()
    .optional(),
  itemOfName: Yup.string()
    .optional(),
  currentAddress: Yup.string()
    .optional(),
  responseContentNumber: Yup.string()
    .optional(),
  intervalAddress: Yup.string()
    .optional(),
  reminderAddress: Yup.string()
    .optional(),
  messageNumber: Yup.string()
    .optional(),
  numberingLevel: Yup.string()
    .optional(),
  material: Yup.string()
    .optional(),
  hostName: Yup.string()
    .optional(),
  notifyName: Yup.string()
    .optional(),
  role: Yup.string()
    .oneOf(['staff'], 'Only staff role can be assigned during registration')
    .default('staff'),
});

export type RegisterFormValues = Yup.InferType<typeof registerSchema>;