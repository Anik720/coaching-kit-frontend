export interface FeeCategory {
  _id: string;
  name: string;
  status: string;
}

export interface Enrollment {
  _id: string;
  studentId: string;
  batchId: string;
  enrollmentDate: string;
  effectiveMonth: string;
}

export interface Fee {
  _id: string;
  studentId: any;
  batchId: any;
  month: string;
  year: string;
  total_amount: number;
  custom_amount?: number;
  calculated_amount: number;
  discount: number;
  paidAmount: number;
  status: 'unpaid' | 'partial' | 'paid';
}

export interface Payment {
  _id: string;
  studentId: string;
  feeId: string;
  amount: number;
  payment_date: string;
  method: string;
  note?: string;
  discount: number;
}

// ── New types for student-level fee tracking ──────────────────────────────────

export interface TuitionMonthEntry {
  month: string;        // 'YYYY-MM'
  monthLabel: string;   // 'January 2026'
  expected_fee: number;
  paid_amount: number;
  due_amount: number;
  status: 'paid' | 'partial' | 'due';
}

export interface StudentFeeSummary {
  studentId: string;
  batchId: string;
  batchTuitionFee: number;
  batchAdmissionFee: number;
  batchCourseFee: number;
  admission: {
    expected: number;
    paid: number;
    due: number;
    status: 'paid' | 'partial' | 'due';
  };
  course: {
    expected: number;
    paid: number;
    due: number;
    status: 'paid' | 'partial' | 'due';
  } | null;
  tuition: {
    months: TuitionMonthEntry[];
    totalDue: number;
  };
  totalDue: number;
}

export interface RecordStudentPaymentDto {
  studentId: string;
  batchId: string;
  fee_type: 'admission' | 'tuition' | 'course';
  month?: string | null;
  expected_fee: number;
  amount_paid: number;
  status: 'paid' | 'partial';
  method: string;
  note?: string;
}

export interface StudentPaymentHistoryItem {
  _id: string;
  studentId: {
    _id: string;
    nameEnglish: string;
    registrationId: string;
    fatherMobileNumber?: string;
    studentMobileNumber?: string;
  };
  batchId: {
    _id: string;
    batchName: string;
    className?: { classname: string };
  };
  fee_type: 'admission' | 'tuition' | 'course';
  month: string | null;
  expected_fee: number;
  amount_paid: number;
  status: 'paid' | 'partial' | 'due';
  method: string;
  note: string | null;
  payment_date: string;
  createdAt: string;
}

export interface FeeState {
  feeCategories: FeeCategory[];
  fees: Fee[];
  dueList: Fee[];
  history: Fee[];
  loading: boolean;
  error: string | null;
  success: boolean;
}
