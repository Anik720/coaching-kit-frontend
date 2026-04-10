import StudentsPage from '@/components/StudentPage/StudentPage';
import { StudentStatus } from '@/api/studentApi/types/student.types';

export default function IncompleteAdmissionsRoute() {
  // Return the main student page but force filtering to PENDING students
  return <StudentsPage defaultStatus={StudentStatus.PENDING} />;
}