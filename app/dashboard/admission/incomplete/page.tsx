import AdmissionPage from '@/components/admissionPage/AdmissionPage';
import { AdmissionStatus } from '@/api/admissionApi/types/admission.types';

export default function IncompleteAdmissionsRoute() {
  // এটি স্বয়ংক্রিয়ভাবে শুধু Incomplete স্ট্যাটাসের ডাটাগুলো ফিল্টার করে দেখাবে
  return <AdmissionPage defaultStatus={AdmissionStatus.INCOMPLETE} />;
}