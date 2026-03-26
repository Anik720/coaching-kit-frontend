"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useEmployee } from "@/hooks/useEmployee";
import { toastManager } from "@/utils/toastConfig";
import styles from "./Employee.module.css";
import Link from "next/link";

const RELIGIONS = [
  { value: "islam", label: "Islam" },
  { value: "hinduism", label: "Hinduism" },
  { value: "christianity", label: "Christianity" },
  { value: "buddhism", label: "Buddhism" },
  { value: "other", label: "Other" },
];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const DESIGNATIONS = [
  { value: "manager", label: "Manager" },
  { value: "accountant", label: "Accountant" },
  { value: "receptionist", label: "Receptionist" },
  { value: "office_assistant", label: "Office Assistant" },
  { value: "security_guard", label: "Security Guard" },
  { value: "peon", label: "Peon" },
  { value: "librarian", label: "Librarian" },
  { value: "it_staff", label: "IT Staff" },
  { value: "admin_staff", label: "Admin Staff" },
  { value: "cleaner", label: "Cleaner" },
  { value: "driver", label: "Driver" },
  { value: "cook", label: "Cook" },
  { value: "other", label: "Other" },
];

interface FormState {
  // Basic Info
  fullName: string;
  fatherName: string;
  motherName: string;
  religion: string;
  gender: string;
  dateOfBirth: string;
  contactNumber: string;
  emergencyContactNumber: string;
  presentAddress: string;
  permanentAddress: string;
  whatsappNumber: string;
  email: string;
  secondaryEmail: string;
  nationalId: string;
  bloodGroup: string;
  // System Access
  systemEmail: string;
  password: string;
  confirmPassword: string;
  // Job Info
  designation: string;
  salary: string;
  joiningDate: string;
}

const initialForm: FormState = {
  fullName: "", fatherName: "", motherName: "",
  religion: "islam", gender: "", dateOfBirth: "",
  contactNumber: "", emergencyContactNumber: "",
  presentAddress: "", permanentAddress: "",
  whatsappNumber: "", email: "", secondaryEmail: "",
  nationalId: "", bloodGroup: "",
  systemEmail: "", password: "", confirmPassword: "",
  designation: "", salary: "", joiningDate: "",
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function AddStaffPage() {
  const router = useRouter();
  const { loading, dispatch, create } = useEmployee();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof FormState) => (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toastManager.showError("Profile picture must be under 5 MB");
      return;
    }
    setProfileFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.contactNumber) newErrors.contactNumber = "Contact number is required";
    else if (!/^01[3-9]\d{8}$/.test(form.contactNumber))
      newErrors.contactNumber = "Invalid Bangladeshi number (e.g. 01XXXXXXXXX)";

    if (form.emergencyContactNumber && !/^01[3-9]\d{8}$/.test(form.emergencyContactNumber))
      newErrors.emergencyContactNumber = "Invalid Bangladeshi number";

    if (form.whatsappNumber && !/^01[3-9]\d{8}$/.test(form.whatsappNumber))
      newErrors.whatsappNumber = "Invalid Bangladeshi number";

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Invalid email format";

    if (form.secondaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.secondaryEmail))
      newErrors.secondaryEmail = "Invalid email format";

    if (form.nationalId && !/^\d{10,17}$/.test(form.nationalId))
      newErrors.nationalId = "National ID must be 10-17 digits";

    if (!form.systemEmail.trim()) newErrors.systemEmail = "System email is required";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (!form.confirmPassword) newErrors.confirmPassword = "Please confirm password";
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (!form.designation) newErrors.designation = "Designation is required";

    if (form.salary && isNaN(Number(form.salary))) newErrors.salary = "Salary must be a number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toastManager.showError("Please fix the form errors");
      return;
    }

    setSubmitting(true);
    const tid = toastManager.showLoading("Creating staff profile...");

    try {
      const formData = new FormData();

      // Append text fields
      const textFields: (keyof FormState)[] = [
        "fullName", "fatherName", "motherName", "religion", "gender", "dateOfBirth",
        "contactNumber", "emergencyContactNumber", "presentAddress", "permanentAddress",
        "whatsappNumber", "email", "secondaryEmail", "nationalId", "bloodGroup",
        "systemEmail", "password", "designation", "salary", "joiningDate",
      ];

      textFields.forEach((key) => {
        const val = form[key];
        if (val && val.trim()) {
          formData.append(key, val.trim());
        }
      });

      // Append profile picture
      if (profileFile) {
        formData.append("profilePicture", profileFile);
      }

      const result = await create(formData);
      // @ts-ignore
      if (result?.type?.endsWith('/rejected')) {
        // @ts-ignore
        throw new Error(result.payload || "Failed to create staff");
      }

      toastManager.safeUpdateToast(tid, "Staff profile created successfully!", "success");
      router.push("/dashboard/employee/list");
    } catch (err: any) {
      toastManager.safeUpdateToast(tid, err.message || "Failed to create staff", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setErrors({});
    setProfileFile(null);
    setProfilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Add New Staff Profile</h1>
          <p>Create a new employee account with system access</p>
        </div>
        <Link href="/dashboard/employee/list" className={styles.btnSecondary}>
          📋 Show Staff List
        </Link>
      </div>

      {/* Basic Information */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>👤 Basic Information</h2>
        <div className={styles.formGrid}>
          {/* Full Name */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>* Full Name</label>
            <input
              type="text"
              className={`${styles.formInput} ${errors.fullName ? styles.error : ""}`}
              value={form.fullName}
              onChange={handleChange("fullName")}
              placeholder="Enter full name"
            />
            {errors.fullName && <p className={styles.fieldError}>{errors.fullName}</p>}
          </div>

          {/* Father's Name */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Father's Name</label>
            <input type="text" className={styles.formInput} value={form.fatherName} onChange={handleChange("fatherName")} placeholder="Father's name" />
          </div>

          {/* Mother's Name */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Mother's Name</label>
            <input type="text" className={styles.formInput} value={form.motherName} onChange={handleChange("motherName")} placeholder="Mother's name" />
          </div>

          {/* Religion */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>* Religion</label>
            <select className={styles.formSelect} value={form.religion} onChange={handleChange("religion")}>
              {RELIGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Gender */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Gender</label>
            <select className={styles.formSelect} value={form.gender} onChange={handleChange("gender")}>
              <option value="">Select Gender</option>
              {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          {/* Date of Birth */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Date Of Birth</label>
            <input type="date" className={styles.formInput} value={form.dateOfBirth} onChange={handleChange("dateOfBirth")} />
          </div>

          {/* Contact Number */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>* Contact Number</label>
            <input
              type="text"
              className={`${styles.formInput} ${errors.contactNumber ? styles.error : ""}`}
              value={form.contactNumber}
              onChange={handleChange("contactNumber")}
              placeholder="01XXXXXXXXX"
              maxLength={11}
            />
            {errors.contactNumber && <p className={styles.fieldError}>{errors.contactNumber}</p>}
          </div>

          {/* Emergency Contact */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Emergency Contact Number</label>
            <input
              type="text"
              className={`${styles.formInput} ${errors.emergencyContactNumber ? styles.error : ""}`}
              value={form.emergencyContactNumber}
              onChange={handleChange("emergencyContactNumber")}
              placeholder="01XXXXXXXXX"
              maxLength={11}
            />
            {errors.emergencyContactNumber && <p className={styles.fieldError}>{errors.emergencyContactNumber}</p>}
          </div>

          {/* Present Address */}
          <div className={styles.formFieldFull}>
            <label className={styles.formLabel}>Present Address</label>
            <textarea className={styles.formTextarea} value={form.presentAddress} onChange={handleChange("presentAddress")} placeholder="Present address" rows={3} />
          </div>

          {/* Permanent Address */}
          <div className={styles.formFieldFull}>
            <label className={styles.formLabel}>Permanent Address</label>
            <textarea className={styles.formTextarea} value={form.permanentAddress} onChange={handleChange("permanentAddress")} placeholder="Permanent address" rows={3} />
          </div>

          {/* WhatsApp */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>WhatsApp Number</label>
            <input
              type="text"
              className={`${styles.formInput} ${errors.whatsappNumber ? styles.error : ""}`}
              value={form.whatsappNumber}
              onChange={handleChange("whatsappNumber")}
              placeholder="01XXXXXXXXX"
              maxLength={11}
            />
            {errors.whatsappNumber && <p className={styles.fieldError}>{errors.whatsappNumber}</p>}
          </div>

          {/* Secondary Email */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Secondary Email</label>
            <input
              type="email"
              className={`${styles.formInput} ${errors.secondaryEmail ? styles.error : ""}`}
              value={form.secondaryEmail}
              onChange={handleChange("secondaryEmail")}
              placeholder="secondary@email.com"
            />
            {errors.secondaryEmail && <p className={styles.fieldError}>{errors.secondaryEmail}</p>}
          </div>

          {/* National ID */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>National ID / Birth Reg. No.</label>
            <input
              type="text"
              className={`${styles.formInput} ${errors.nationalId ? styles.error : ""}`}
              value={form.nationalId}
              onChange={handleChange("nationalId")}
              placeholder="10-17 digit NID or Birth Reg No"
            />
            {errors.nationalId && <p className={styles.fieldError}>{errors.nationalId}</p>}
          </div>

          {/* Blood Group */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Blood Group</label>
            <select className={styles.formSelect} value={form.bloodGroup} onChange={handleChange("bloodGroup")}>
              <option value="">Select Blood Group</option>
              {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>

          {/* Profile Picture */}
          <div className={styles.formFieldFull}>
            <label className={styles.formLabel}>Profile Picture</label>
            <div className={styles.profilePictureSection}>
              <div className={styles.profilePreview}>
                {profilePreview ? (
                  <img src={profilePreview} alt="Preview" className={styles.profilePreviewImg} />
                ) : (
                  <span className={styles.profilePlaceholder}>👤</span>
                )}
              </div>
              <div className={styles.fileInputWrapper}>
                <label className={styles.fileInputLabel} htmlFor="profilePictureInput">
                  📎 Choose File
                  {profileFile ? ` — ${profileFile.name}` : " — No file chosen"}
                </label>
                <input
                  id="profilePictureInput"
                  type="file"
                  ref={fileInputRef}
                  className={styles.fileInput}
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                />
                <span className={styles.fileHint}>JPG, PNG, GIF, WEBP — max 5 MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Access */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>🔐 System Access</h2>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>* Email Address</label>
            <input
              type="text"
              className={`${styles.formInput} ${errors.systemEmail ? styles.error : ""}`}
              value={form.systemEmail}
              onChange={handleChange("systemEmail")}
              placeholder="System login email or username"
            />
            {errors.systemEmail && <p className={styles.fieldError}>{errors.systemEmail}</p>}
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>* Password</label>
            <input
              type="password"
              className={`${styles.formInput} ${errors.password ? styles.error : ""}`}
              value={form.password}
              onChange={handleChange("password")}
              placeholder="Min 6 characters"
            />
            {errors.password && <p className={styles.fieldError}>{errors.password}</p>}
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>* Confirm Password</label>
            <input
              type="password"
              className={`${styles.formInput} ${errors.confirmPassword ? styles.error : ""}`}
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              placeholder="Repeat password"
            />
            {errors.confirmPassword && <p className={styles.fieldError}>{errors.confirmPassword}</p>}
          </div>
        </div>
      </div>

      {/* Job Information */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>💼 Job Information</h2>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>* Designation</label>
            <select
              className={`${styles.formSelect} ${errors.designation ? styles.error : ""}`}
              value={form.designation}
              onChange={handleChange("designation")}
            >
              <option value="">Select Designation</option>
              {DESIGNATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            {errors.designation && <p className={styles.fieldError}>{errors.designation}</p>}
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Salary</label>
            <input
              type="number"
              className={`${styles.formInput} ${errors.salary ? styles.error : ""}`}
              value={form.salary}
              onChange={handleChange("salary")}
              placeholder="Monthly salary"
              min="0"
            />
            {errors.salary && <p className={styles.fieldError}>{errors.salary}</p>}
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Joining Date</label>
            <input type="date" className={styles.formInput} value={form.joiningDate} onChange={handleChange("joiningDate")} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.formActions} style={{ marginTop: 24 }}>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={submitting || loading}
            type="button"
          >
            {submitting ? "Creating..." : "✅ Create Staff"}
          </button>
          <button className={styles.btnSecondary} onClick={handleReset} type="button">
            🔄 Reset
          </button>
          <Link href="/dashboard/employee/list" className={styles.btnSecondary}>
            📋 Show Staff List
          </Link>
        </div>
      </div>
    </div>
  );
}
