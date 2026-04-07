'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../Fee.module.css';
import studentService from '@/api/studentApi/services/studentService';
import feeService from '@/api/feeApi/services/feeService';
import { StudentItem } from '@/api/studentApi/types/student.types';
import { StudentFeeSummary, TuitionMonthEntry } from '@/api/feeApi/types/fee.types';

// ── Types for local state ─────────────────────────────────────────────────────

interface TuitionRow extends TuitionMonthEntry {
  inputAmount: string;
  paymentType: 'partial' | 'special_discount' | null; // null = not yet decided
  selected: boolean;
}

interface ClassifyPopup {
  monthKey: string;
  monthLabel: string;
  expected: number;
  entered: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────

const statusChip = (status: string) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    paid:    { bg: 'rgba(16,185,129,.12)',  color: '#059669', label: 'Paid' },
    partial: { bg: 'rgba(245,158,11,.12)',  color: '#d97706', label: 'Partial' },
    due:     { bg: 'rgba(239,68,68,.12)',   color: '#dc2626', label: 'Due' },
  };
  const s = map[status] ?? map.due;
  return (
    <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:'700', background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReceivePaymentPage() {

  // search
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState<StudentItem[]>([]);
  const [isSearching, setIsSearching]     = useState(false);
  const [showDropdown, setShowDropdown]   = useState(false);
  const searchRef   = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // selected student + summary
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [summary, setSummary]   = useState<StudentFeeSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // admission payment input
  const [admissionInput, setAdmissionInput]   = useState('');
  const [admissionSelected, setAdmissionSelected] = useState(false);

  // course fee payment input
  const [courseInput, setCourseInput]     = useState('');
  const [courseSelected, setCourseSelected] = useState(false);

  // tuition rows
  const [tuitionRows, setTuitionRows] = useState<TuitionRow[]>([]);

  // classify popup
  const [classifyPopup, setClassifyPopup] = useState<ClassifyPopup | null>(null);

  // payment method + note
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── outside click ──────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── debounced search ───────────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setSearchResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await studentService.getAllStudents({ search: value.trim(), limit: 8 });
        setSearchResults(res.students || res.data || []);
      } catch { setSearchResults([]); }
      finally { setIsSearching(false); }
    }, 400);
  }, []);

  // ── load fee summary ───────────────────────────────────────────────────────
  const loadSummary = useCallback(async (student: StudentItem) => {
    setSummaryLoading(true);
    setSummary(null);
    setAdmissionInput('');
    setAdmissionSelected(false);
    setCourseInput('');
    setCourseSelected(false);
    setTuitionRows([]);
    try {
      const s = await feeService.getStudentFeeSummary(student._id);
      setSummary(s);
      // build tuition rows – only show months with due > 0
      const rows: TuitionRow[] = s.tuition.months
        .filter(m => m.status !== 'paid')
        .map(m => ({
          ...m,
          inputAmount: String(m.due_amount),
          paymentType: null,
          selected: false,
        }));
      setTuitionRows(rows);
      // pre-select admission if due
      if (s.admission.due > 0) {
        setAdmissionInput(String(s.admission.due));
        setAdmissionSelected(true);
      }
      // pre-select course if due
      if (s.course && s.course.due > 0) {
        setCourseInput(String(s.course.due));
        setCourseSelected(true);
      }
    } catch { setSummary(null); }
    finally { setSummaryLoading(false); }
  }, []);

  // ── select student ─────────────────────────────────────────────────────────
  const handleSelectStudent = useCallback(async (student: StudentItem) => {
    setSelectedStudent(student);
    setSearchQuery(student.nameEnglish);
    setShowDropdown(false);
    setSearchResults([]);
    await loadSummary(student);
  }, [loadSummary]);

  // ── tuition row helpers ────────────────────────────────────────────────────
  const updateRow = (monthKey: string, changes: Partial<TuitionRow>) => {
    setTuitionRows(prev => prev.map(r => r.month === monthKey ? { ...r, ...changes } : r));
  };

  const handleTuitionAmountBlur = (row: TuitionRow) => {
    if (!summary) return;
    const entered = parseFloat(row.inputAmount) || 0;
    if (entered <= 0) return;
    if (entered !== summary.batchTuitionFee) {
      // show classify popup
      setClassifyPopup({
        monthKey: row.month,
        monthLabel: row.monthLabel,
        expected: summary.batchTuitionFee,
        entered,
      });
    } else {
      // exact match → auto mark as will-be-paid
      updateRow(row.month, { paymentType: null });
    }
  };

  const handleClassifyConfirm = (type: 'partial' | 'special_discount') => {
    if (!classifyPopup) return;
    updateRow(classifyPopup.monthKey, { paymentType: type, selected: true });
    setClassifyPopup(null);
  };

  // ── calculate net payable ─────────────────────────────────────────────────
  const admissionAmt = admissionSelected ? (parseFloat(admissionInput) || 0) : 0;
  const courseAmt    = courseSelected    ? (parseFloat(courseInput)    || 0) : 0;
  const tuitionAmt   = tuitionRows
    .filter(r => r.selected)
    .reduce((s, r) => s + (parseFloat(r.inputAmount) || 0), 0);
  const netPayable   = admissionAmt + courseAmt + tuitionAmt;

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedStudent || !summary || netPayable <= 0) return;

    // Check if any selected tuition row still needs classification
    const needsClassify = tuitionRows.find(
      r => r.selected && r.paymentType === null &&
           (parseFloat(r.inputAmount) || 0) !== summary.batchTuitionFee
    );
    if (needsClassify) {
      setClassifyPopup({
        monthKey: needsClassify.month,
        monthLabel: needsClassify.monthLabel,
        expected: summary.batchTuitionFee,
        entered: parseFloat(needsClassify.inputAmount) || 0,
      });
      return;
    }

    setSubmitting(true);
    try {
      const base = { studentId: summary.studentId as string, batchId: summary.batchId as string, method: paymentMethod, note };

      // Admission
      if (admissionSelected && admissionAmt > 0 && summary.admission.due > 0) {
        await feeService.recordStudentPayment({
          ...base, fee_type: 'admission',
          expected_fee: summary.admission.expected,
          amount_paid: admissionAmt,
          status: admissionAmt >= summary.admission.due ? 'paid' : 'partial',
        });
      }

      // Course
      if (courseSelected && courseAmt > 0 && summary.course && summary.course.due > 0) {
        await feeService.recordStudentPayment({
          ...base, fee_type: 'course',
          expected_fee: summary.course.expected,
          amount_paid: courseAmt,
          status: courseAmt >= summary.course.due ? 'paid' : 'partial',
        });
      }

      // Tuition months
      for (const row of tuitionRows.filter(r => r.selected)) {
        const amt = parseFloat(row.inputAmount) || 0;
        if (amt <= 0) continue;
        const isSpecialDiscount = row.paymentType === 'special_discount';
        await feeService.recordStudentPayment({
          ...base, fee_type: 'tuition', month: row.month,
          expected_fee: row.expected_fee,
          amount_paid: amt,
          // special discount → mark full paid; partial → partial
          status: (isSpecialDiscount || amt >= row.due_amount) ? 'paid' : 'partial',
        });
      }

      alert('Payment recorded successfully!');
      await loadSummary(selectedStudent);
      setPaymentMethod('cash');
      setNote('');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.pageContainer}>

      {/* ── Header ── */}
      <div className={styles.pageHeader} style={{ marginBottom: '28px', padding: '28px 32px' }}>
        <div className={styles.headerContent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99,102,241,.3)', flexShrink: 0 }}>
              <svg width="26" height="26" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className={styles.pageTitle} style={{ fontSize: '26px', marginBottom: '4px' }}>Receive Payment</h1>
              <p className={styles.pageSubtitle}>Process student fee payments — admission, course & monthly tuition</p>
            </div>
          </div>
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', marginBottom: '24px', border: '1px solid #f3f4f6' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Find Student
        </label>
        <div ref={searchRef} style={{ position: 'relative' }}>
          <div className={styles.searchBox} style={{ maxWidth: '100%' }}>
            {isSearching
              ? <div style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', width:'18px', height:'18px', borderRadius:'50%', border:'2px solid rgba(99,102,241,.2)', borderTop:'2px solid #6366f1', animation:'spin .8s linear infinite' }} />
              : <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            }
            <input type="text" className={styles.searchInput}
              placeholder="Search by Name, Student ID, or Mobile Number..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              style={{ fontSize: '15px', padding: '13px 40px 13px 44px', borderRadius: '12px' }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); setSelectedStudent(null); setSummary(null); }}
                style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:'20px', lineHeight:1 }}>×</button>
            )}
          </div>

          {showDropdown && searchQuery.trim() && (
            <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, zIndex:50, background:'white', borderRadius:'14px', boxShadow:'0 8px 32px rgba(0,0,0,.12)', border:'1px solid #e5e7eb', overflow:'hidden' }}>
              {isSearching ? (
                <div style={{ padding:'20px', textAlign:'center', color:'#9ca3af', fontSize:'14px' }}>Searching...</div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding:'20px', textAlign:'center', color:'#9ca3af', fontSize:'14px' }}>No students found for &quot;{searchQuery}&quot;</div>
              ) : searchResults.map((s, i) => (
                <div key={s._id} onClick={() => handleSelectStudent(s)}
                  style={{ padding:'14px 20px', cursor:'pointer', borderBottom: i < searchResults.length-1 ? '1px solid #f3f4f6':'none', display:'flex', alignItems:'center', gap:'14px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >
                  <div style={{ width:'40px', height:'40px', borderRadius:'10px', flexShrink:0, background:'linear-gradient(135deg,#e0e7ff,#ddd6fe)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px', fontWeight:'700', color:'#6366f1' }}>
                    {s.nameEnglish[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontWeight:'600', color:'#1f2937', fontSize:'15px' }}>{s.nameEnglish}</p>
                    <p style={{ margin:'2px 0 0', fontSize:'13px', color:'#9ca3af' }}>ID: {s.registrationId}{s.fatherMobileNumber ? ` · ${s.fatherMobileNumber}`:''}</p>
                  </div>
                  <span style={{ fontSize:'12px', padding:'3px 10px', borderRadius:'20px', background: s.isActive?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)', color: s.isActive?'#059669':'#dc2626', fontWeight:'600' }}>
                    {s.isActive ? 'Active':'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Student Info ── */}
      <div style={{ background:'white', borderRadius:'16px', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06)', border:'1px solid #f3f4f6', marginBottom:'24px' }}>
        <div style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', padding:'14px 24px', display:'flex', alignItems:'center', gap:'10px' }}>
          <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span style={{ color:'white', fontWeight:'700', fontSize:'15px' }}>Student Information</span>
        </div>
        <div style={{ padding:'24px 28px', display:'flex', alignItems:'center', gap:'28px', background:'#fafafa' }}>
          <div style={{ width:'80px', height:'80px', borderRadius:'20px', flexShrink:0, background:'linear-gradient(135deg,#e0e7ff,#ddd6fe)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(99,102,241,.15)', border:'3px solid white', overflow:'hidden' }}>
            {selectedStudent?.photoUrl
              ? <img src={selectedStudent.photoUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : selectedStudent
              ? <span style={{ fontSize:'30px', fontWeight:'800', color:'#6366f1' }}>{selectedStudent.nameEnglish[0]?.toUpperCase()}</span>
              : <svg width="36" height="36" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            }
          </div>
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'14px 32px' }}>
            {[
              { label:'👤 Student Name', value: selectedStudent?.nameEnglish || '—' },
              { label:'📱 Mobile',        value: selectedStudent?.fatherMobileNumber || selectedStudent?.studentMobileNumber || '—' },
              { label:'📚 Class',         value: selectedStudent?.class?.classname || selectedStudent?.batch?.classDetails?.classname || '—' },
              { label:'🎓 Batch',         value: selectedStudent?.batch?.batchName || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize:'11px', fontWeight:'600', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 3px' }}>{label}</p>
                <p style={{ fontSize:'15px', fontWeight:'600', color:'#1f2937', margin:0 }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ padding:'10px 20px', borderRadius:'12px', background:'linear-gradient(135deg,#dbeafe,#bfdbfe)', border:'1px solid #bfdbfe' }}>
              <p style={{ fontSize:'11px', fontWeight:'700', color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 2px' }}>Student ID</p>
              <p style={{ fontSize:'18px', fontWeight:'800', color:'#1e40af', margin:0 }}>{selectedStudent?.registrationId || '—'}</p>
            </div>
            {summary && summary.totalDue > 0 && (
              <div style={{ marginTop:'8px', padding:'6px 14px', borderRadius:'10px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)' }}>
                <p style={{ fontSize:'11px', fontWeight:'700', color:'#dc2626', margin:'0 0 1px' }}>TOTAL DUE</p>
                <p style={{ fontSize:'16px', fontWeight:'800', color:'#dc2626', margin:0 }}>৳ {summary.totalDue.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Fee Sections ── */}
      {summaryLoading && (
        <div style={{ background:'white', borderRadius:'16px', padding:'48px', textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,.06)', marginBottom:'24px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:'3px solid rgba(99,102,241,.2)', borderTop:'3px solid #6366f1', animation:'spin .8s linear infinite', margin:'0 auto 12px' }} />
          <p style={{ color:'#9ca3af', margin:0 }}>Loading fee summary...</p>
        </div>
      )}

      {!summaryLoading && selectedStudent && !summary && (
        <div style={{ background:'white', borderRadius:'16px', padding:'40px', textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,.06)', marginBottom:'24px' }}>
          <p style={{ color:'#ef4444', fontWeight:'600' }}>Could not load fee summary. Please ensure this student has a batch assigned.</p>
        </div>
      )}

      {!summaryLoading && summary && (
        <>
          {/* ── Fee Breakdown Panel ── */}
          <BreakdownPanel
            summary={summary}
            tuitionRows={tuitionRows}
            admissionAmt={admissionAmt}
            courseAmt={courseAmt}
            admissionSelected={admissionSelected}
            courseSelected={courseSelected}
          />
          {/* ── Admission Fee ── */}
          {summary.admission.due > 0 && (
            <FeeSection
              title="Admission Fee"
              icon={<svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
              color="#6366f1"
            >
              <div style={{ padding:'20px 24px', display:'flex', alignItems:'center', gap:'20px', flexWrap:'wrap' }}>
                <InfoPill label="Expected" value={`৳ ${summary.admission.expected}`} />
                <InfoPill label="Already Paid" value={`৳ ${summary.admission.paid}`} color="green" />
                <InfoPill label="Due" value={`৳ ${summary.admission.due}`} color="red" />
                {statusChip(summary.admission.status)}
                <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'12px' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#374151' }}>
                    <ToggleCheckbox checked={admissionSelected} onChange={v => setAdmissionSelected(v)} />
                    Include in payment
                  </label>
                  {admissionSelected && (
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <span style={{ fontSize:'13px', color:'#6b7280' }}>৳</span>
                      <input type="number" min="0" max={summary.admission.due}
                        value={admissionInput}
                        onChange={e => setAdmissionInput(e.target.value)}
                        className={styles.input}
                        style={{ width:'120px', padding:'8px 12px', borderRadius:'10px', fontSize:'14px', fontWeight:'600', border:'2px solid #c7d2fe' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </FeeSection>
          )}

          {/* ── Course Fee ── */}
          {summary.course && summary.course.due > 0 && (
            <FeeSection
              title="Course Fee"
              icon={<svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
              color="#8b5cf6"
            >
              <div style={{ padding:'20px 24px', display:'flex', alignItems:'center', gap:'20px', flexWrap:'wrap' }}>
                <InfoPill label="Expected" value={`৳ ${summary.course!.expected}`} />
                <InfoPill label="Already Paid" value={`৳ ${summary.course!.paid}`} color="green" />
                <InfoPill label="Due" value={`৳ ${summary.course!.due}`} color="red" />
                {statusChip(summary.course!.status)}
                <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'12px' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#374151' }}>
                    <ToggleCheckbox checked={courseSelected} onChange={v => setCourseSelected(v)} />
                    Include in payment
                  </label>
                  {courseSelected && (
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <span style={{ fontSize:'13px', color:'#6b7280' }}>৳</span>
                      <input type="number" min="0" max={summary.course!.due}
                        value={courseInput}
                        onChange={e => setCourseInput(e.target.value)}
                        className={styles.input}
                        style={{ width:'120px', padding:'8px 12px', borderRadius:'10px', fontSize:'14px', fontWeight:'600', border:'2px solid #c7d2fe' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </FeeSection>
          )}

          {/* ── Tuition Fees ── */}
          <FeeSection
            title="Monthly Tuition"
            icon={<svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            color="#10b981"
            badge={tuitionRows.length > 0 ? `${tuitionRows.length} due` : 'All clear'}
          >
            {tuitionRows.length === 0 ? (
              <div style={{ padding:'32px', textAlign:'center' }}>
                <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(16,185,129,.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                  <svg width="28" height="28" fill="none" stroke="#10b981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p style={{ color:'#10b981', fontWeight:'700', margin:'0 0 4px' }}>All Months Paid</p>
                <p style={{ color:'#9ca3af', fontSize:'13px', margin:0 }}>No tuition dues found for this student</p>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'linear-gradient(135deg,#f9fafb,#f3f4f6)' }}>
                      {['', 'Month', 'Expected', 'Already Paid', 'Due', 'Status', 'Pay Amount'].map((h, i) => (
                        <th key={i} style={{ padding:'13px 18px', textAlign: i===0?'center':'left', fontSize:'11px', fontWeight:'700', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'2px solid #e5e7eb' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tuitionRows.map((row, idx) => (
                      <tr key={row.month} style={{ borderBottom: idx < tuitionRows.length-1 ? '1px solid #f3f4f6':'none', background: row.selected ? 'rgba(16,185,129,.03)':'white', transition:'background .15s' }}>
                        <td style={{ padding:'14px 18px', textAlign:'center', width:'50px' }}>
                          <ToggleCheckbox checked={row.selected} onChange={v => updateRow(row.month, { selected: v })} color="#10b981" />
                        </td>
                        <td style={{ padding:'14px 18px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:'linear-gradient(135deg,#d1fae5,#a7f3d0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'800', color:'#059669' }}>
                              {row.monthLabel.slice(0, 3).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ margin:0, fontWeight:'600', color:'#1f2937', fontSize:'14px' }}>{row.monthLabel}</p>
                              {row.paymentType && (
                                <p style={{ margin:0, fontSize:'11px', fontWeight:'600', color: row.paymentType==='special_discount' ? '#059669':'#d97706' }}>
                                  {row.paymentType === 'special_discount' ? '✓ Special Discount':'↓ Partial'}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'14px 18px', fontSize:'14px', color:'#6366f1', fontWeight:'700' }}>৳ {row.expected_fee}</td>
                        <td style={{ padding:'14px 18px', fontSize:'14px', color:'#10b981', fontWeight:'600' }}>৳ {row.paid_amount}</td>
                        <td style={{ padding:'14px 18px', fontSize:'14px', color:'#ef4444', fontWeight:'700' }}>৳ {row.due_amount}</td>
                        <td style={{ padding:'14px 18px' }}>{statusChip(row.status)}</td>
                        <td style={{ padding:'14px 18px', width:'150px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                            <span style={{ fontSize:'13px', color:'#6b7280' }}>৳</span>
                            <input
                              type="number" min="0"
                              className={styles.input}
                              style={{ width:'100px', padding:'8px 10px', borderRadius:'10px', fontSize:'14px', fontWeight:'600', border: row.paymentType==='partial' ? '2px solid #f59e0b' : row.paymentType==='special_discount' ? '2px solid #10b981' : '2px solid #e5e7eb' }}
                              value={row.inputAmount}
                              onChange={e => updateRow(row.month, { inputAmount: e.target.value })}
                              onBlur={() => row.selected && handleTuitionAmountBlur(row)}
                              disabled={!row.selected}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </FeeSection>

          {/* ── Payment Summary + Confirm ── */}
          <div style={{ background:'white', borderRadius:'16px', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06)', border:'1px solid #f3f4f6', marginTop:'8px' }}>
            <div style={{ padding:'14px 24px', background:'#fafafa', borderBottom:'1px solid #f3f4f6' }}>
              <span style={{ fontWeight:'700', fontSize:'15px', color:'#1f2937' }}>Complete Payment</span>
            </div>
            <div style={{ padding:'28px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px' }}>
              {/* Left */}
              <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
                <div className={styles.formField} style={{ margin:0 }}>
                  <label className={styles.label} style={{ fontSize:'13px', marginBottom:'8px' }}>Payment Method</label>
                  <select className={styles.input} style={{ padding:'12px 14px', borderRadius:'12px', fontSize:'14px' }} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="cash">💵 Cash</option>
                    <option value="bkash">📱 bKash</option>
                    <option value="nagad">📱 Nagad</option>
                    <option value="bank">🏦 Bank Transfer</option>
                  </select>
                </div>
                <div className={styles.formField} style={{ margin:0 }}>
                  <label className={styles.label} style={{ fontSize:'13px', marginBottom:'8px' }}>Note <span style={{ color:'#9ca3af', fontWeight:'400' }}>(optional)</span></label>
                  <textarea className={styles.textarea} placeholder="Any specific notes..." style={{ minHeight:'80px', borderRadius:'12px', fontSize:'14px' }} value={note} onChange={e => setNote(e.target.value)} />
                </div>
              </div>

              {/* Right: summary */}
              <div>
                <p style={{ fontSize:'12px', fontWeight:'700', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'14px' }}>This Payment — Breakdown</p>
                <div style={{ background:'#f9fafb', borderRadius:'14px', border:'1px solid #e5e7eb', overflow:'hidden', marginBottom:'16px' }}>
                  {/* header row */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 80px', padding:'9px 16px', background:'#f3f4f6', borderBottom:'1px solid #e5e7eb' }}>
                    {['Fee Item','Paying','Due','After'].map(h => (
                      <span key={h} style={{ fontSize:'11px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'right' }}>{h}</span>
                    ))}
                  </div>
                  {admissionSelected && admissionAmt > 0 && summary.admission.due > 0 && (
                    <PayBreakdownRow
                      label="Admission Fee"
                      paying={admissionAmt}
                      currentDue={summary.admission.due}
                    />
                  )}
                  {courseSelected && courseAmt > 0 && summary.course && summary.course.due > 0 && (
                    <PayBreakdownRow
                      label="Course Fee"
                      paying={courseAmt}
                      currentDue={summary.course.due}
                    />
                  )}
                  {tuitionRows.filter(r => r.selected).map(r => (
                    <PayBreakdownRow
                      key={r.month}
                      label={`Tuition · ${r.monthLabel}`}
                      paying={parseFloat(r.inputAmount)||0}
                      currentDue={r.due_amount}
                      tag={r.paymentType === 'special_discount' ? 'Discount' : r.paymentType === 'partial' ? 'Partial' : undefined}
                    />
                  ))}
                  {/* total row */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 80px', padding:'13px 16px', background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderTop:'2px solid #e5e7eb' }}>
                    <span style={{ fontSize:'14px', fontWeight:'700', color:'#374151' }}>Total</span>
                    <span style={{ fontSize:'15px', fontWeight:'800', color:'#6366f1', textAlign:'right' }}>৳ {netPayable}</span>
                    <span style={{ fontSize:'14px', fontWeight:'700', color:'#ef4444', textAlign:'right' }}>
                      ৳ {summary.totalDue}
                    </span>
                    <span style={{ fontSize:'14px', fontWeight:'700', color: (summary.totalDue - netPayable) <= 0 ? '#10b981':'#ef4444', textAlign:'right' }}>
                      ৳ {Math.max(0, summary.totalDue - netPayable)}
                    </span>
                  </div>
                </div>
                <button
                  className={styles.btnPrimary}
                  onClick={handleSubmit}
                  disabled={submitting || netPayable <= 0}
                  style={{ width:'100%', justifyContent:'center', padding:'15px', fontSize:'16px', borderRadius:'12px', opacity:(submitting||netPayable<=0)?.6:1, cursor:(submitting||netPayable<=0)?'not-allowed':'pointer' }}
                >
                  {submitting
                    ? <><div style={{ width:'18px', height:'18px', borderRadius:'50%', border:'2px solid rgba(255,255,255,.3)', borderTop:'2px solid white', animation:'spin .8s linear infinite' }} /> Processing...</>
                    : <><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Confirm &amp; Record Payment</>
                  }
                </button>
              </div>
            </div>

            {/* Receipt footer */}
            <div style={{ background:'#f9fafb', padding:'12px 28px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:'12px', color:'#9ca3af', fontFamily:'monospace', fontWeight:'600' }}>RECEIVED BY: <span style={{ color:'#6366f1' }}>SYSTEM</span></span>
              <span style={{ fontSize:'12px', color:'#9ca3af', fontFamily:'monospace', fontWeight:'600' }}>DATE: <span style={{ color:'#374151' }}>{new Date().toLocaleDateString('en-GB')}</span></span>
              <span style={{ fontSize:'12px', color:'#9ca3af', fontFamily:'monospace', fontWeight:'600' }}>COACHING KIT — FEE MANAGEMENT</span>
            </div>
          </div>
        </>
      )}

      {/* ── Placeholder when no student ── */}
      {!selectedStudent && !summaryLoading && (
        <div style={{ background:'white', borderRadius:'16px', padding:'64px 32px', textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,.06)', border:'1px solid #f3f4f6' }}>
          <div style={{ width:'72px', height:'72px', borderRadius:'18px', background:'rgba(99,102,241,.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <svg width="36" height="36" fill="none" stroke="#6366f1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <p style={{ color:'#374151', fontSize:'16px', fontWeight:'600', margin:'0 0 6px' }}>Search for a Student</p>
          <p style={{ color:'#9ca3af', fontSize:'14px', margin:0 }}>Use the search bar above to find a student and view their fee details</p>
        </div>
      )}

      {/* ── Classify Popup ── */}
      {classifyPopup && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)' }}
          onClick={() => setClassifyPopup(null)}>
          <div style={{ background:'white', borderRadius:'20px', width:'440px', maxWidth:'95vw', boxShadow:'0 24px 64px rgba(0,0,0,.2)', animation:'slideUp .25s ease', overflow:'hidden' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', padding:'20px 24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>⚠️</div>
                <div>
                  <h3 style={{ margin:0, color:'white', fontSize:'17px', fontWeight:'700' }}>Amount Mismatch</h3>
                  <p style={{ margin:0, color:'rgba(255,255,255,.8)', fontSize:'13px' }}>{classifyPopup.monthLabel}</p>
                </div>
              </div>
            </div>
            {/* Body */}
            <div style={{ padding:'24px' }}>
              <div style={{ background:'#fef3c7', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px', border:'1px solid #fde68a' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span style={{ fontSize:'14px', color:'#92400e' }}>নির্ধারিত টিউশন ফি:</span>
                  <span style={{ fontSize:'14px', fontWeight:'700', color:'#92400e' }}>৳ {classifyPopup.expected}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'14px', color:'#92400e' }}>আপনি এন্ট্রি করেছেন:</span>
                  <span style={{ fontSize:'14px', fontWeight:'700', color:'#d97706' }}>৳ {classifyPopup.entered}</span>
                </div>
              </div>
              <p style={{ fontSize:'14px', fontWeight:'700', color:'#374151', marginBottom:'14px' }}>এটি কি?</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <button onClick={() => handleClassifyConfirm('partial')}
                  style={{ padding:'14px 20px', borderRadius:'12px', border:'2px solid #f59e0b', background:'rgba(245,158,11,.06)', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px', textAlign:'left' }}>
                  <div style={{ width:'20px', height:'20px', borderRadius:'50%', border:'2px solid #f59e0b', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#f59e0b' }} />
                  </div>
                  <div>
                    <p style={{ margin:0, fontWeight:'700', color:'#92400e', fontSize:'15px' }}>Partial Payment</p>
                    <p style={{ margin:0, fontSize:'12px', color:'#b45309' }}>Status = PARTIAL · বাকি ৳ {classifyPopup.expected - classifyPopup.entered} due থাকবে</p>
                  </div>
                </button>
                <button onClick={() => handleClassifyConfirm('special_discount')}
                  style={{ padding:'14px 20px', borderRadius:'12px', border:'2px solid #10b981', background:'rgba(16,185,129,.06)', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px', textAlign:'left' }}>
                  <div style={{ width:'20px', height:'20px', borderRadius:'50%', border:'2px solid #10b981', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#10b981' }} />
                  </div>
                  <div>
                    <p style={{ margin:0, fontWeight:'700', color:'#065f46', fontSize:'15px' }}>Special Discount</p>
                    <p style={{ margin:0, fontSize:'12px', color:'#047857' }}>Status = PAID · Due = 0 · পূর্ণ পেইড গণ্য হবে</p>
                  </div>
                </button>
              </div>
            </div>
            <div style={{ padding:'16px 24px', borderTop:'1px solid #f3f4f6', display:'flex', justifyContent:'flex-end', background:'#fafafa' }}>
              <button onClick={() => setClassifyPopup(null)} style={{ padding:'9px 20px', borderRadius:'10px', border:'2px solid #e5e7eb', background:'white', color:'#6b7280', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}} @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FeeSection({ title, icon, color, badge, children }: { title: string; icon: React.ReactNode; color: string; badge?: string; children: React.ReactNode }) {
  return (
    <div style={{ background:'white', borderRadius:'16px', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06)', border:'1px solid #f3f4f6', marginBottom:'16px' }}>
      <div style={{ background: `linear-gradient(135deg,${color},${color}cc)`, padding:'13px 22px', display:'flex', alignItems:'center', gap:'10px' }}>
        {icon}
        <span style={{ color:'white', fontWeight:'700', fontSize:'15px', flex:1 }}>{title}</span>
        {badge && <span style={{ fontSize:'12px', padding:'3px 12px', borderRadius:'20px', background:'rgba(255,255,255,.25)', color:'white', fontWeight:'700' }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function InfoPill({ label, value, color }: { label: string; value: string; color?: 'green' | 'red' }) {
  const col = color === 'green' ? '#059669' : color === 'red' ? '#dc2626' : '#1f2937';
  return (
    <div style={{ padding:'8px 14px', borderRadius:'10px', background:'#f9fafb', border:'1px solid #e5e7eb', textAlign:'center' }}>
      <p style={{ margin:0, fontSize:'11px', color:'#9ca3af', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</p>
      <p style={{ margin:'2px 0 0', fontSize:'15px', fontWeight:'700', color: col }}>{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding:'11px 18px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <span style={{ fontSize:'13px', color:'#6b7280' }}>{label}</span>
      <span style={{ fontSize:'14px', fontWeight:'700', color:'#1f2937' }}>{value}</span>
    </div>
  );
}

function ToggleCheckbox({ checked, onChange, color = '#6366f1' }: { checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ width:'20px', height:'20px', borderRadius:'6px', cursor:'pointer', border: checked ? `2px solid ${color}` : '2px solid #d1d5db', background: checked ? color : 'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .2s' }}>
      {checked && <svg width="12" height="12" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
    </div>
  );
}

// ── BreakdownPanel ─────────────────────────────────────────────────────────────
// Shows a receipt-style table: Expected − Already Paid = Due for every fee type

function BreakdownPanel({
  summary,
  tuitionRows,
  admissionAmt,
  courseAmt,
  admissionSelected,
  courseSelected,
}: {
  summary: StudentFeeSummary;
  tuitionRows: TuitionRow[];
  admissionAmt: number;
  courseAmt: number;
  admissionSelected: boolean;
  courseSelected: boolean;
}) {
  const tdBase: React.CSSProperties = { padding: '11px 14px', fontSize: '13px' };
  const numTd: React.CSSProperties = { ...tdBase, textAlign: 'right', fontWeight: '600', fontVariantNumeric: 'tabular-nums' };

  const rows: { label: string; expected: number; paid: number; due: number; status: string; payingNow?: number; tag?: string }[] = [];

  // Admission
  rows.push({
    label: 'Admission Fee',
    expected: summary.admission.expected,
    paid: summary.admission.paid,
    due: summary.admission.due,
    status: summary.admission.status,
    payingNow: admissionSelected ? admissionAmt : 0,
  });

  // Course fee (if applicable)
  if (summary.course) {
    rows.push({
      label: 'Course Fee',
      expected: summary.course.expected,
      paid: summary.course.paid,
      due: summary.course.due,
      status: summary.course.status,
      payingNow: courseSelected ? courseAmt : 0,
    });
  }

  // Tuition months
  for (const row of summary.tuition.months) {
    const localRow = tuitionRows.find(r => r.month === row.month);
    const payingNow = localRow?.selected ? (parseFloat(localRow.inputAmount) || 0) : 0;
    const tag = localRow?.paymentType === 'special_discount' ? 'Discount' : localRow?.paymentType === 'partial' ? 'Partial' : undefined;
    rows.push({
      label: `Tuition · ${row.monthLabel}`,
      expected: row.expected_fee,
      paid: row.paid_amount,
      due: row.due_amount,
      status: row.status,
      payingNow,
      tag,
    });
  }

  const totalExpected = rows.reduce((s, r) => s + r.expected, 0);
  const totalPaid     = rows.reduce((s, r) => s + r.paid, 0);
  const totalDue      = rows.reduce((s, r) => s + r.due, 0);
  const totalPaying   = rows.reduce((s, r) => s + (r.payingNow || 0), 0);

  const headerTh: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    textAlign: 'right',
    borderBottom: '2px solid #e5e7eb',
    background: 'linear-gradient(135deg,#f9fafb,#f3f4f6)',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: '1px solid #f3f4f6', marginBottom: '20px' }}>
      {/* Panel header */}
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>Fee Breakdown</span>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'rgba(255,255,255,.6)', fontFamily: 'monospace' }}>Expected − Paid = Due</span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headerTh, textAlign: 'left' }}>Fee Item</th>
              <th style={headerTh}>Expected (৳)</th>
              <th style={headerTh}>Already Paid (৳)</th>
              <th style={headerTh}>Due (৳)</th>
              <th style={headerTh}>Status</th>
              <th style={headerTh}>Paying Now (৳)</th>
              <th style={headerTh}>Remaining (৳)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const remaining = Math.max(0, row.due - (row.payingNow || 0));
              const isActive = (row.payingNow || 0) > 0;
              return (
                <tr key={idx} style={{ borderBottom: idx < rows.length - 1 ? '1px solid #f3f4f6' : 'none', background: isActive ? 'rgba(99,102,241,.03)' : 'white' }}>
                  <td style={{ ...tdBase, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{row.label}</span>
                      {row.tag && (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: row.tag === 'Discount' ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)', color: row.tag === 'Discount' ? '#059669' : '#d97706', fontWeight: '700' }}>
                          {row.tag}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ ...numTd, color: '#6366f1' }}>৳ {row.expected.toLocaleString()}</td>
                  <td style={{ ...numTd, color: '#10b981' }}>৳ {row.paid.toLocaleString()}</td>
                  <td style={{ ...numTd, color: row.due > 0 ? '#ef4444' : '#10b981' }}>৳ {row.due.toLocaleString()}</td>
                  <td style={{ ...tdBase, textAlign: 'right' }}>
                    {(() => {
                      const map: Record<string, { bg: string; color: string; label: string }> = {
                        paid:    { bg: 'rgba(16,185,129,.12)', color: '#059669', label: 'Paid' },
                        partial: { bg: 'rgba(245,158,11,.12)', color: '#d97706', label: 'Partial' },
                        due:     { bg: 'rgba(239,68,68,.12)',  color: '#dc2626', label: 'Due' },
                      };
                      const s = map[row.status] ?? map.due;
                      return <span style={{ display: 'inline-flex', padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: s.bg, color: s.color }}>{s.label}</span>;
                    })()}
                  </td>
                  <td style={{ ...numTd, color: isActive ? '#6366f1' : '#9ca3af' }}>
                    {isActive ? `৳ ${(row.payingNow || 0).toLocaleString()}` : '—'}
                  </td>
                  <td style={{ ...numTd, color: remaining === 0 ? '#10b981' : '#ef4444' }}>
                    {row.due > 0 ? `৳ ${remaining.toLocaleString()}` : <span style={{ color: '#10b981' }}>✓ Clear</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Grand total row */}
          <tfoot>
            <tr style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderTop: '2px solid #e5e7eb' }}>
              <td style={{ ...tdBase, textAlign: 'left', fontWeight: '800', color: '#1f2937', fontSize: '14px' }}>Grand Total</td>
              <td style={{ ...numTd, color: '#6366f1', fontSize: '14px', fontWeight: '800' }}>৳ {totalExpected.toLocaleString()}</td>
              <td style={{ ...numTd, color: '#10b981', fontSize: '14px', fontWeight: '800' }}>৳ {totalPaid.toLocaleString()}</td>
              <td style={{ ...numTd, color: '#ef4444', fontSize: '14px', fontWeight: '800' }}>৳ {totalDue.toLocaleString()}</td>
              <td />
              <td style={{ ...numTd, color: '#6366f1', fontSize: '14px', fontWeight: '800' }}>
                {totalPaying > 0 ? `৳ ${totalPaying.toLocaleString()}` : '—'}
              </td>
              <td style={{ ...numTd, color: Math.max(0, totalDue - totalPaying) === 0 ? '#10b981' : '#ef4444', fontSize: '14px', fontWeight: '800' }}>
                ৳ {Math.max(0, totalDue - totalPaying).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── PayBreakdownRow ────────────────────────────────────────────────────────────
// Used inside the "Complete Payment" right panel to show per-item: Paying | Due | After

function PayBreakdownRow({
  label,
  paying,
  currentDue,
  tag,
}: {
  label: string;
  paying: number;
  currentDue: number;
  tag?: string;
}) {
  const after = Math.max(0, currentDue - paying);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', padding: '10px 16px', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>{label}</span>
        {tag && (
          <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px', background: tag === 'Discount' ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)', color: tag === 'Discount' ? '#059669' : '#d97706', fontWeight: '700' }}>
            {tag}
          </span>
        )}
      </div>
      <span style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', textAlign: 'right' }}>৳ {paying.toLocaleString()}</span>
      <span style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444', textAlign: 'right' }}>৳ {currentDue.toLocaleString()}</span>
      <span style={{ fontSize: '13px', fontWeight: '700', color: after === 0 ? '#10b981' : '#ef4444', textAlign: 'right' }}>৳ {after.toLocaleString()}</span>
    </div>
  );
}
