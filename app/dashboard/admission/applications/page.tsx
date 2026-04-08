import AdmissionPage from '@/components/admissionPage/AdmissionPage';
import { AdmissionStatus } from '@/api/admissionApi/types/admission.types';

export default function OpenApplicationsRoute() {
  // এটি স্বয়ংক্রিয়ভাবে শুধু Pending অ্যাপলিকেশনগুলো দেখাবে
  return <AdmissionPage defaultStatus={AdmissionStatus.PENDING} />;
}