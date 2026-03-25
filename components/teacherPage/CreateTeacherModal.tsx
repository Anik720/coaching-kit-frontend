import { useState, useEffect } from "react";
import styles from './CreateTeacherModal.module.css';
import {
  AssignType,
  BloodGroup,
  CreateTeacherDto,
  Designation,
  Gender,
  Religion,
  TeacherStatus
} from "@/api/teacherApi/types/teacher.types";

interface CreateTeacherModalProps {
  onClose: () => void;
  onCreate: (teacherData: CreateTeacherDto) => Promise<void>;
  loading: boolean;
  inline?: boolean;
}

// Maps NestJS class-validator message prefixes to field names
const FIELD_ALIASES: Record<string, string> = {
  fullname: 'fullName',
  fathername: 'fatherName',
  mothername: 'motherName',
  email: 'email',
  secondaryemail: 'secondaryEmail',
  systememail: 'systemEmail',
  contactnumber: 'contactNumber',
  emergencycontactnumber: 'emergencyContactNumber',
  whatsappnumber: 'whatsappNumber',
  nationalid: 'nationalId',
  dateofbirth: 'dateOfBirth',
  joiningdate: 'joiningDate',
  password: 'password',
  presentaddress: 'presentAddress',
  permanentaddress: 'permanentAddress',
  bloodgroup: 'bloodGroup',
  designation: 'designation',
  assigntype: 'assignType',
  salary: 'salary',
  status: 'status',
};

function parseApiErrors(raw: string | string[]): { fieldErrors: Record<string, string>; general: string } {
  const messages = Array.isArray(raw) ? raw : [raw];
  const fieldErrors: Record<string, string> = {};
  const unmatched: string[] = [];

  for (const msg of messages) {
    const firstWord = msg.split(' ')[0].toLowerCase();
    const fieldName = FIELD_ALIASES[firstWord];
    if (fieldName) {
      // Keep first (most important) error per field
      if (!fieldErrors[fieldName]) {
        // Capitalise and humanise the message
        fieldErrors[fieldName] = msg.charAt(0).toUpperCase() + msg.slice(1);
      }
    } else {
      unmatched.push(msg);
    }
  }

  return {
    fieldErrors,
    general: unmatched.join('. '),
  };
}

// Validates a single field value regardless of touched state
function validateValue(name: string, value: any): string {
  switch (name) {
    case 'fullName':
      if (!value?.trim()) return 'Full name is required';
      if (value.trim().length < 2) return 'Must be at least 2 characters';
      if (value.trim().length > 100) return 'Must be less than 100 characters';
      break;
    case 'fatherName':
      if (!value?.trim()) return "Father's name is required";
      if (value.trim().length < 2) return 'Must be at least 2 characters';
      break;
    case 'motherName':
      if (!value?.trim()) return "Mother's name is required";
      if (value.trim().length < 2) return 'Must be at least 2 characters';
      break;
    case 'email':
      if (!value?.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
      break;
    case 'systemEmail':
      if (!value?.trim()) return 'System email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
      break;
    case 'contactNumber':
      if (!value?.trim()) return 'Contact number is required';
      if (!/^01[3-9]\d{8}$/.test(value)) return 'Must be 11 digits starting with 01';
      break;
    case 'emergencyContactNumber':
      if (!value?.trim()) return 'Emergency contact is required';
      if (!/^01[3-9]\d{8}$/.test(value)) return 'Must be 11 digits starting with 01';
      break;
    case 'whatsappNumber':
      if (!value?.trim()) return 'WhatsApp number is required';
      if (!/^01[3-9]\d{8}$/.test(value)) return 'Must be 11 digits starting with 01';
      break;
    case 'nationalId':
      if (!value?.trim()) return 'National ID is required';
      if (!/^\d{10,17}$/.test(value)) return 'Must be 10–17 digits';
      break;
    case 'dateOfBirth':
      if (!value) return 'Date of birth is required';
      if (new Date(value) > new Date()) return 'Cannot be in the future';
      if (new Date(value).getFullYear() < 1900) return 'Invalid date';
      break;
    case 'joiningDate':
      if (!value) return 'Joining date is required';
      break;
    case 'password':
      if (!value?.trim()) return 'Password is required';
      if (value.length < 6) return 'Must be at least 6 characters';
      break;
    case 'presentAddress':
      if (!value?.trim()) return 'Present address is required';
      if (value.trim().length < 5) return 'Must be at least 5 characters';
      break;
    case 'permanentAddress':
      if (!value?.trim()) return 'Permanent address is required';
      if (value.trim().length < 5) return 'Must be at least 5 characters';
      break;
    case 'secondaryEmail':
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
      break;
  }
  return '';
}

export default function CreateTeacherModal({ onClose, onCreate, loading, inline = false }: CreateTeacherModalProps) {
  const [formData, setFormData] = useState<CreateTeacherDto>({
    fullName: '',
    fatherName: '',
    motherName: '',
    religion: Religion.ISLAM,
    gender: Gender.MALE,
    dateOfBirth: '',
    contactNumber: '',
    emergencyContactNumber: '',
    presentAddress: '',
    permanentAddress: '',
    whatsappNumber: '',
    email: '',
    secondaryEmail: '',
    nationalId: '',
    bloodGroup: BloodGroup.A_POSITIVE,
    profilePicture: '',
    systemEmail: '',
    password: 'Teacher@123',
    designation: Designation.SUBJECT_TEACHER,
    assignType: AssignType.MONTHLY_BASIS,
    monthlyTotalClass: 0,
    salary: 0,
    joiningDate: new Date().toISOString().split('T')[0],
    status: TeacherStatus.ACTIVE,
    remarks: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const REQUIRED_FIELDS = [
    'fullName', 'fatherName', 'motherName', 'email', 'systemEmail',
    'contactNumber', 'emergencyContactNumber', 'whatsappNumber',
    'nationalId', 'dateOfBirth', 'joiningDate', 'password',
    'presentAddress', 'permanentAddress',
  ];

  // Re-validate a touched field on every change
  const handleChange = <K extends keyof CreateTeacherDto>(field: K, value: CreateTeacherDto[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: validateValue(field as string, value) }));
    }
    setApiError('');
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateValue(field, (formData as any)[field]) }));
  };

  // Validate all required fields synchronously (bypasses touched state)
  const runFullValidation = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    REQUIRED_FIELDS.forEach(key => {
      const err = validateValue(key, (formData as any)[key]);
      if (err) newErrors[key] = err;
    });
    if (formData.secondaryEmail) {
      const err = validateValue('secondaryEmail', formData.secondaryEmail);
      if (err) newErrors.secondaryEmail = err;
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    // Mark all required fields as touched so errors become visible
    const allTouched: Record<string, boolean> = {};
    REQUIRED_FIELDS.forEach(k => { allTouched[k] = true; });
    setTouched(prev => ({ ...prev, ...allTouched }));

    const validationErrors = runFullValidation();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // Scroll to the first error field
      const firstKey = Object.keys(validationErrors)[0];
      document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      await onCreate(formData);
    } catch (err: any) {
      // err is the raw rejected value from rejectWithValue (array or string)
      const raw: string | string[] = err?.message ?? err;
      const { fieldErrors, general } = parseApiErrors(raw);

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...fieldErrors }));
        // Mark those fields as touched so errors show
        const touchedFields: Record<string, boolean> = {};
        Object.keys(fieldErrors).forEach(k => { touchedFields[k] = true; });
        setTouched(prev => ({ ...prev, ...touchedFields }));

        // Scroll to first API error field
        const firstKey = Object.keys(fieldErrors)[0];
        document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      if (general) setApiError(general);
      if (!general && Object.keys(fieldErrors).length === 0) {
        setApiError(typeof raw === 'string' ? raw : 'Failed to create teacher. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-suggest system email from full name
  useEffect(() => {
    if (formData.fullName.trim() && !formData.systemEmail.trim()) {
      const name = formData.fullName.toLowerCase().split(' ')[0];
      setFormData(prev => ({ ...prev, systemEmail: `${name}.teacher@academy.edu` }));
    }
  }, [formData.fullName]);

  const formatEnumForDisplay = (value: string): string =>
    value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  const isLoading = loading || submitting;

  return (
    <div className={inline ? styles.inlinePage : styles.modalOverlay} onClick={inline ? undefined : onClose}>
      <div className={inline ? styles.inlineCard : styles.modal} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className={styles.modalForm}>

          {/* Header */}
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Create New Teacher Profile</h2>
            <button
              onClick={onClose}
              className={styles.modalClose}
              disabled={isLoading}
              type="button"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {isLoading && (
            <div className={styles.modalLoading}>
              <div className={styles.spinnerLarge}></div>
            </div>
          )}

          <div className={styles.modalBody}>

            {/* API-level general error banner */}
            {apiError && (
              <div className={styles.apiErrorBanner}>
                <span className={styles.apiErrorIcon}>⚠</span>
                <span>{apiError}</span>
              </div>
            )}

            {/* Basic Information */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Basic Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="fullName">
                    Full Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    placeholder="Enter full name"
                    className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                    autoFocus
                    disabled={isLoading}
                    maxLength={100}
                  />
                  {errors.fullName && <span className={styles.errorMessage}>{errors.fullName}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="fatherName">
                    Father's Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="fatherName"
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => handleChange('fatherName', e.target.value)}
                    onBlur={() => handleBlur('fatherName')}
                    placeholder="Enter father's name"
                    className={`${styles.input} ${errors.fatherName ? styles.inputError : ''}`}
                    disabled={isLoading}
                    maxLength={50}
                  />
                  {errors.fatherName && <span className={styles.errorMessage}>{errors.fatherName}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="motherName">
                    Mother's Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="motherName"
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => handleChange('motherName', e.target.value)}
                    onBlur={() => handleBlur('motherName')}
                    placeholder="Enter mother's name"
                    className={`${styles.input} ${errors.motherName ? styles.inputError : ''}`}
                    disabled={isLoading}
                    maxLength={50}
                  />
                  {errors.motherName && <span className={styles.errorMessage}>{errors.motherName}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="dateOfBirth">
                    Date of Birth <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    onBlur={() => handleBlur('dateOfBirth')}
                    className={`${styles.input} ${errors.dateOfBirth ? styles.inputError : ''}`}
                    disabled={isLoading}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.dateOfBirth && <span className={styles.errorMessage}>{errors.dateOfBirth}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="gender">
                    Gender <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value as Gender)}
                    className={styles.input}
                    disabled={isLoading}
                  >
                    {(Object.values(Gender) as Gender[]).map(g => (
                      <option key={g} value={g}>{formatEnumForDisplay(g)}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="religion">
                    Religion <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="religion"
                    value={formData.religion}
                    onChange={(e) => handleChange('religion', e.target.value as Religion)}
                    className={styles.input}
                    disabled={isLoading}
                  >
                    {(Object.values(Religion) as Religion[]).map(r => (
                      <option key={r} value={r}>{formatEnumForDisplay(r)}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="bloodGroup">
                    Blood Group <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={(e) => handleChange('bloodGroup', e.target.value as BloodGroup)}
                    className={styles.input}
                    disabled={isLoading}
                  >
                    {(Object.values(BloodGroup) as BloodGroup[]).map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Contact Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="contactNumber">
                    Contact Number <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => handleChange('contactNumber', e.target.value)}
                    onBlur={() => handleBlur('contactNumber')}
                    placeholder="01XXXXXXXXX"
                    className={`${styles.input} ${errors.contactNumber ? styles.inputError : ''}`}
                    disabled={isLoading}
                    maxLength={11}
                  />
                  {errors.contactNumber && <span className={styles.errorMessage}>{errors.contactNumber}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="emergencyContactNumber">
                    Emergency Contact <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="emergencyContactNumber"
                    type="tel"
                    value={formData.emergencyContactNumber}
                    onChange={(e) => handleChange('emergencyContactNumber', e.target.value)}
                    onBlur={() => handleBlur('emergencyContactNumber')}
                    placeholder="01XXXXXXXXX"
                    className={`${styles.input} ${errors.emergencyContactNumber ? styles.inputError : ''}`}
                    disabled={isLoading}
                    maxLength={11}
                  />
                  {errors.emergencyContactNumber && <span className={styles.errorMessage}>{errors.emergencyContactNumber}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="whatsappNumber">
                    WhatsApp Number <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="whatsappNumber"
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                    onBlur={() => handleBlur('whatsappNumber')}
                    placeholder="01XXXXXXXXX"
                    className={`${styles.input} ${errors.whatsappNumber ? styles.inputError : ''}`}
                    disabled={isLoading}
                    maxLength={11}
                  />
                  {errors.whatsappNumber && <span className={styles.errorMessage}>{errors.whatsappNumber}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="nationalId">
                    National ID / Birth Reg. No <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="nationalId"
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => handleChange('nationalId', e.target.value)}
                    onBlur={() => handleBlur('nationalId')}
                    placeholder="10–17 digits"
                    className={`${styles.input} ${errors.nationalId ? styles.inputError : ''}`}
                    disabled={isLoading}
                    maxLength={17}
                  />
                  {errors.nationalId && <span className={styles.errorMessage}>{errors.nationalId}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="email">
                    Personal Email <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="personal@example.com"
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    disabled={isLoading}
                  />
                  {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="secondaryEmail">
                    Secondary Email
                  </label>
                  <input
                    id="secondaryEmail"
                    type="email"
                    value={formData.secondaryEmail || ''}
                    onChange={(e) => handleChange('secondaryEmail', e.target.value)}
                    onBlur={() => handleBlur('secondaryEmail')}
                    placeholder="secondary@example.com (optional)"
                    className={`${styles.input} ${errors.secondaryEmail ? styles.inputError : ''}`}
                    disabled={isLoading}
                  />
                  {errors.secondaryEmail && <span className={styles.errorMessage}>{errors.secondaryEmail}</span>}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Address Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formFieldFull}>
                  <label className={styles.label} htmlFor="presentAddress">
                    Present Address <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="presentAddress"
                    value={formData.presentAddress}
                    onChange={(e) => handleChange('presentAddress', e.target.value)}
                    onBlur={() => handleBlur('presentAddress')}
                    placeholder="Enter complete present address"
                    className={`${styles.textarea} ${errors.presentAddress ? styles.inputError : ''}`}
                    disabled={isLoading}
                    rows={3}
                    maxLength={500}
                  />
                  {errors.presentAddress && <span className={styles.errorMessage}>{errors.presentAddress}</span>}
                </div>

                <div className={styles.formFieldFull}>
                  <label className={styles.label} htmlFor="permanentAddress">
                    Permanent Address <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="permanentAddress"
                    value={formData.permanentAddress}
                    onChange={(e) => handleChange('permanentAddress', e.target.value)}
                    onBlur={() => handleBlur('permanentAddress')}
                    placeholder="Enter complete permanent address"
                    className={`${styles.textarea} ${errors.permanentAddress ? styles.inputError : ''}`}
                    disabled={isLoading}
                    rows={3}
                    maxLength={500}
                  />
                  {errors.permanentAddress && <span className={styles.errorMessage}>{errors.permanentAddress}</span>}
                </div>
              </div>
            </div>

            {/* System Access */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>System Access</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="systemEmail">
                    System Email <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="systemEmail"
                    type="email"
                    value={formData.systemEmail}
                    onChange={(e) => handleChange('systemEmail', e.target.value)}
                    onBlur={() => handleBlur('systemEmail')}
                    placeholder="teacher@academy.edu"
                    className={`${styles.input} ${errors.systemEmail ? styles.inputError : ''}`}
                    disabled={isLoading}
                  />
                  {errors.systemEmail && <span className={styles.errorMessage}>{errors.systemEmail}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="password">
                    Password <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="password"
                    type="text"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                    disabled={isLoading}
                  />
                  {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
                  <span className={styles.helpText}>Default: Teacher@123 — can be changed later</span>
                </div>
              </div>
            </div>

            {/* Job Information */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Job Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="designation">
                    Designation <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => handleChange('designation', e.target.value as Designation)}
                    className={styles.input}
                    disabled={isLoading}
                  >
                    {(Object.values(Designation) as Designation[]).map(d => (
                      <option key={d} value={d}>{formatEnumForDisplay(d)}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="assignType">
                    Assign Type <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="assignType"
                    value={formData.assignType}
                    onChange={(e) => handleChange('assignType', e.target.value as AssignType)}
                    className={styles.input}
                    disabled={isLoading}
                  >
                    {(Object.values(AssignType) as AssignType[]).map(a => (
                      <option key={a} value={a}>{formatEnumForDisplay(a)}</option>
                    ))}
                  </select>
                </div>

                {(formData.assignType === AssignType.MONTHLY_BASIS || formData.assignType === AssignType.BOTH) && (
                  <>
                    <div className={styles.formField}>
                      <label className={styles.label} htmlFor="monthlyTotalClass">
                        Monthly Total Class
                      </label>
                      <input
                        id="monthlyTotalClass"
                        type="number"
                        value={formData.monthlyTotalClass || 0}
                        onChange={(e) => handleChange('monthlyTotalClass', parseInt(e.target.value) || 0)}
                        className={styles.input}
                        disabled={isLoading}
                        min="0"
                      />
                    </div>

                    <div className={styles.formField}>
                      <label className={styles.label} htmlFor="salary">
                        Salary (৳)
                      </label>
                      <input
                        id="salary"
                        type="number"
                        value={formData.salary || 0}
                        onChange={(e) => handleChange('salary', parseInt(e.target.value) || 0)}
                        className={styles.input}
                        disabled={isLoading}
                        min="0"
                        step="100"
                      />
                    </div>
                  </>
                )}

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="joiningDate">
                    Joining Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => handleChange('joiningDate', e.target.value)}
                    onBlur={() => handleBlur('joiningDate')}
                    className={`${styles.input} ${errors.joiningDate ? styles.inputError : ''}`}
                    disabled={isLoading}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.joiningDate && <span className={styles.errorMessage}>{errors.joiningDate}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value as TeacherStatus)}
                    className={styles.input}
                    disabled={isLoading}
                  >
                    {(Object.values(TeacherStatus) as TeacherStatus[]).map(s => (
                      <option key={s} value={s}>{formatEnumForDisplay(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Additional Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formFieldFull}>
                  <label className={styles.label} htmlFor="remarks">
                    Remarks
                  </label>
                  <textarea
                    id="remarks"
                    value={formData.remarks || ''}
                    onChange={(e) => handleChange('remarks', e.target.value)}
                    placeholder="Any additional notes or remarks..."
                    className={styles.textarea}
                    disabled={isLoading}
                    rows={2}
                    maxLength={500}
                  />
                </div>

                <div className={styles.formFieldFull}>
                  <label className={styles.label} htmlFor="profilePicture">
                    Profile Picture (Optional)
                  </label>
                  <div className={styles.fileUpload}>
                    <input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            handleChange('profilePicture', reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      disabled={isLoading}
                      className={styles.fileInput}
                    />
                    <button
                      type="button"
                      className={styles.fileButton}
                      onClick={() => document.getElementById('profilePicture')?.click()}
                      disabled={isLoading}
                    >
                      Choose File
                    </button>
                    <span className={styles.fileName}>
                      {formData.profilePicture ? 'File selected' : 'No file chosen'}
                    </span>
                  </div>
                  {formData.profilePicture && (
                    <div className={styles.imagePreview}>
                      <img src={formData.profilePicture} alt="Profile preview" className={styles.previewImage} />
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnSecondary}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinnerSmall}></span>
                  Creating...
                </>
              ) : (
                'Create Teacher'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
