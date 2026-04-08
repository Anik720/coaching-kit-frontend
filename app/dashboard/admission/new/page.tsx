import AdmissionPage from '@/components/admissionPage/AdmissionPage';
import { AdmissionStatus } from '@/api/admissionApi/types/admission.types';

export default function OpenApplicationsRoute() {
  // Shows only pending applications waiting for approval
  return <AdmissionPage defaultStatus={AdmissionStatus.PENDING} />;
}