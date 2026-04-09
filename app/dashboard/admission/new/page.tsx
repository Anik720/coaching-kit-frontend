import AdmissionPage from '@/components/admissionPage/AdmissionPage';

export default function NewAdmissionRoute() {
  return <AdmissionPage defaultStatus="all" autoOpenNew={true} />;
}
