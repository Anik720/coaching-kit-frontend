import { Suspense } from "react";
import AttendanceDetailPage from "@/components/teacherPage/attendance/AttendanceDetailPage";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading...</div>}>
      <AttendanceDetailPage />
    </Suspense>
  );
}
