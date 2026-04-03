"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { fetchAssignments } from "@/api/teacherApi/teacherSlice";
import { TeacherItem, TeacherStatus, TeacherAssignment, PaymentType } from "@/api/teacherApi/types/teacher.types";
import styles from './TeacherDetailsModal.module.css';

const STATUS_COLORS: Record<TeacherStatus, string> = {
  [TeacherStatus.ACTIVE]:    "#28a745",
  [TeacherStatus.INACTIVE]:  "#6c757d",
  [TeacherStatus.SUSPENDED]: "#dc3545",
  [TeacherStatus.RESIGNED]:  "#fd7e14",
  [TeacherStatus.ON_LEAVE]:  "#ffc107",
};

interface TeacherDetailsModalProps {
  teacher: TeacherItem;
  onClose: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

export default function TeacherDetailsModal({
  teacher,
  onClose,
  onToggleActive,
  onDelete,
}: TeacherDetailsModalProps) {
  const reduxDispatch = useDispatch<AppDispatch>();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingAssignments(true);
      try {
        const result = await reduxDispatch(
          fetchAssignments({ teacher: teacher._id, limit: 100 } as any)
        ).unwrap();
        setAssignments((result as any).assignments ?? []);
      } catch {
        setAssignments([]);
      } finally {
        setLoadingAssignments(false);
      }
    };
    load();
  }, [teacher._id]);

  const fmt = (text?: string): string => {
    if (!text) return '—';
    return text.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const fmtDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const fmtAmount = (n?: number) => (n != null ? `৳ ${n.toLocaleString()}` : null);

  const amountLabel = (pt: PaymentType) => {
    if (pt === PaymentType.MONTHLY)         return 'Monthly Salary';
    if (pt === PaymentType.DAILY)           return 'Daily Rate';
    if (pt === PaymentType.PER_CLASS)       return 'Rate/Class';
    if (pt === PaymentType.PER_CLASS_HOURLY) return 'Rate/Class';
    if (pt === PaymentType.MONTHLY_HOURLY)  return 'Monthly Total';
    return 'Monthly Total';
  };

  const renderPayTypeDetails = (a: TeacherAssignment) => {
    switch (a.paymentType) {
      case PaymentType.PER_CLASS:
        return (
          <>
            {a.ratePerClass != null && (
              <span className={styles.assignmentChip}>Rate: {fmtAmount(a.ratePerClass)}/class</span>
            )}
            {a.totalClassesPerMonth != null && (
              <span className={styles.assignmentChip}>{a.totalClassesPerMonth} classes/month</span>
            )}
          </>
        );

      case PaymentType.PER_CLASS_HOURLY: {
        // Total hours = stored totalHoursPerMonth OR (durationMinutes × totalClassesPerMonth / 60)
        const storedHours = a.totalHoursPerMonth;
        const derivedHours =
          a.durationMinutes != null && a.totalClassesPerMonth != null
            ? Math.round((a.durationMinutes * a.totalClassesPerMonth) / 60 * 10) / 10
            : null;
        // Also try deriving from durationMinutes and amount / ratePerClass if classes not stored
        const classesFromAmount =
          a.ratePerClass != null && a.ratePerClass > 0 && a.totalClassesPerMonth == null
            ? null  // can't derive classes from amount alone reliably
            : null;
        const calcHours = storedHours ?? derivedHours ?? classesFromAmount;
        return (
          <>
            {a.ratePerClass != null && (
              <span className={styles.assignmentChip}>Rate: {fmtAmount(a.ratePerClass)}/class</span>
            )}
            {a.durationMinutes != null && (
              <span className={styles.assignmentChip}>⏱ {a.durationMinutes} min/class</span>
            )}
            {a.totalClassesPerMonth != null && (
              <span className={styles.assignmentChip}>{a.totalClassesPerMonth} classes/month</span>
            )}
            {calcHours != null && (
              <span className={styles.assignmentChip} style={{ background: '#ede9fe', color: '#6d28d9', border: '1px solid #c4b5fd' }}>
                🕐 {calcHours} hrs/month
              </span>
            )}
          </>
        );
      }

      case PaymentType.MONTHLY:
        return (
          <>
            {a.totalClassesPerMonth != null && (
              <span className={styles.assignmentChip}>{a.totalClassesPerMonth} classes/month</span>
            )}
          </>
        );

      case PaymentType.MONTHLY_HOURLY: {
        // Hours: prefer stored totalHoursPerMonth, else derive from amount ÷ ratePerHour
        const storedHours = a.totalHoursPerMonth;
        const derivedHoursFromRate =
          storedHours == null && a.ratePerHour != null && a.ratePerHour > 0 && a.amount > 0
            ? Math.round((a.amount / a.ratePerHour) * 10) / 10
            : null;
        const displayHours = storedHours ?? derivedHoursFromRate;

        // Hourly rate: prefer stored ratePerHour, else derive from amount ÷ totalHoursPerMonth
        const storedRate = a.ratePerHour;
        const derivedRate =
          storedRate == null && storedHours != null && storedHours > 0 && a.amount > 0
            ? Math.round((a.amount / storedHours) * 10) / 10
            : null;
        const displayRate = storedRate ?? derivedRate;

        return (
          <>
            {displayRate != null && (
              <span className={styles.assignmentChip}>Rate: {fmtAmount(displayRate)}/hr</span>
            )}
            {displayHours != null && (
              <span className={styles.assignmentChip} style={{ background: '#ede9fe', color: '#6d28d9', border: '1px solid #c4b5fd' }}>
                🕐 {displayHours} hrs/month
              </span>
            )}
          </>
        );
      }

      case PaymentType.DAILY:
        return (
          <>
            {a.totalClassPerDay != null && (
              <span className={styles.assignmentChip}>{a.totalClassPerDay} classes/day</span>
            )}
          </>
        );

      default:
        return null;
    }
  };

  const initials = teacher.fullName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  const statusColor = teacher.status ? STATUS_COLORS[teacher.status] ?? '#6c757d' : '#6c757d';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* ── Hero ── */}
        <div className={styles.hero}>
          <button className={styles.heroClose} onClick={onClose} type="button" aria-label="Close">
            ✕
          </button>

          <div className={styles.heroBody}>
            <div className={styles.avatar}>{initials}</div>

            <div className={styles.heroInfo}>
              <h2 className={styles.heroName}>{teacher.fullName}</h2>
              <p className={styles.heroDesignation}>{fmt(teacher.designation)}</p>

              <div className={styles.heroBadges}>
                {/* isActive badge */}
                <span className={teacher.isActive ? styles.badgeActive : styles.badgeInactive}>
                  {teacher.isActive ? 'Active' : 'Inactive'}
                </span>

                {/* status badge — colored like the list */}
                {teacher.status && (
                  <span
                    className={styles.badgeStatus}
                    style={{
                      background: statusColor + '22',
                      color: statusColor,
                      border: `1px solid ${statusColor}55`,
                    }}
                  >
                    {fmt(teacher.status)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>

          {/* Contact */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.cardIconBlue}`}>📬</div>
              <h4 className={styles.cardTitle}>Contact Information</h4>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Personal Email</span>
                <span className={styles.infoValue}>
                  {teacher.email}
                  <span className={teacher.isEmailVerified ? `${styles.verifiedChip} ${styles.verifiedChipOk}` : `${styles.verifiedChip} ${styles.verifiedChipNo}`}>
                    {teacher.isEmailVerified ? '✓ Verified' : '✗ Unverified'}
                  </span>
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>
                  {teacher.contactNumber}
                  <span className={teacher.isPhoneVerified ? `${styles.verifiedChip} ${styles.verifiedChipOk}` : `${styles.verifiedChip} ${styles.verifiedChipNo}`}>
                    {teacher.isPhoneVerified ? '✓ Verified' : '✗ Unverified'}
                  </span>
                </span>
              </div>
              {teacher.whatsappNumber && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>WhatsApp</span>
                  <span className={styles.infoValue}>{teacher.whatsappNumber}</span>
                </div>
              )}
              {teacher.systemEmail && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>System Email</span>
                  <span className={styles.infoValue}>{teacher.systemEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Professional */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.cardIconGreen}`}>💼</div>
              <h4 className={styles.cardTitle}>Professional Information</h4>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Designation</span>
                <span className={styles.infoValue}>{fmt(teacher.designation)}</span>
              </div>
              {teacher.assignType && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Assign Type</span>
                  <span className={styles.infoValue}>{fmt(teacher.assignType)}</span>
                </div>
              )}
              {teacher.monthlyTotalClass != null && teacher.monthlyTotalClass > 0 && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Monthly Classes</span>
                  <span className={styles.infoValue}>{teacher.monthlyTotalClass}</span>
                </div>
              )}
              {teacher.salary != null && teacher.salary > 0 && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Salary</span>
                  <span className={styles.infoValue}>৳ {teacher.salary.toLocaleString()}</span>
                </div>
              )}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Joining Date</span>
                <span className={styles.infoValue}>{fmtDate(teacher.joiningDate)}</span>
              </div>
              {teacher.createdAt && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Added On</span>
                  <span className={styles.infoValue}>{fmtDate(teacher.createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Personal */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.cardIconOrange}`}>👤</div>
              <h4 className={styles.cardTitle}>Personal Information</h4>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Gender</span>
                <span className={styles.infoValue}>{fmt(teacher.gender)}</span>
              </div>
              {teacher.bloodGroup && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Blood Group</span>
                  <span className={styles.infoValue}>{teacher.bloodGroup}</span>
                </div>
              )}
              {teacher.religion && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Religion</span>
                  <span className={styles.infoValue}>{fmt(teacher.religion)}</span>
                </div>
              )}
              {teacher.dateOfBirth && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Date of Birth</span>
                  <span className={styles.infoValue}>{fmtDate(teacher.dateOfBirth)}</span>
                </div>
              )}
              {teacher.nationalId && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>National ID</span>
                  <span className={styles.infoValue}>{teacher.nationalId}</span>
                </div>
              )}
              {teacher.presentAddress && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Address</span>
                  <span className={styles.infoValue}>{teacher.presentAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Salary & Assignments */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.cardIconPurple}`}>💰</div>
              <h4 className={styles.cardTitle}>
                Salary &amp; Assignments
                {!loadingAssignments && assignments.length > 0 && (
                  <span className={styles.assignmentCount}>{assignments.length}</span>
                )}
              </h4>
            </div>
            <div className={styles.cardBody}>
              {loadingAssignments ? (
                <div className={styles.assignmentLoading}>Loading assignments…</div>
              ) : assignments.length === 0 ? (
                <div className={styles.assignmentEmpty}>No assignments found</div>
              ) : (
                assignments.map((a) => (
                  <div key={a._id} className={styles.assignmentItem}>
                    {/* Subject + payment type */}
                    <div className={styles.assignmentTop}>
                      <span className={styles.assignmentSubject}>{a.subject?.subjectName ?? '—'}</span>
                      <span className={styles.assignmentPayType}>{fmt(a.paymentType)}</span>
                    </div>

                    {/* Class / Batch chips */}
                    <div className={styles.assignmentMeta}>
                      {a.class?.classname && (
                        <span className={styles.assignmentChip}>📚 {a.class.classname}</span>
                      )}
                      {a.batch?.batchName && (
                        <span className={styles.assignmentChip}>
                          🎓 {a.batch.batchName}
                          {a.batch.sessionYear ? ` (${a.batch.sessionYear})` : ''}
                        </span>
                      )}
                      {/* Payment-type-specific fields */}
                      {renderPayTypeDetails(a)}
                    </div>

                    {/* Amount + effective dates */}
                    <div className={styles.assignmentAmount}>
                      <span>{amountLabel(a.paymentType)}:</span>
                      <strong>{fmtAmount(a.amount) ?? '—'}</strong>
                      <span className={styles.assignmentDate}>
                        {fmtDate(a.effectiveFrom)}
                        {a.effectiveTo ? ` → ${fmtDate(a.effectiveTo)}` : ' → ongoing'}
                      </span>
                    </div>

                    {/* Status if inactive/suspended */}
                    {a.status && a.status !== 'active' && (
                      <div className={styles.assignmentStatus}>{fmt(a.status)}</div>
                    )}

                    {/* Notes if present */}
                    {a.notes && (
                      <div className={styles.assignmentNotes}>{a.notes}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <div className={styles.footerActions}>
            <button
              onClick={onToggleActive}
              className={teacher.isActive ? styles.btnDeactivate : styles.btnActivate}
              type="button"
            >
              {teacher.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={onDelete} className={styles.btnDelete} type="button">
              Delete
            </button>
          </div>

          <button onClick={onClose} className={styles.btnClose} type="button">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
