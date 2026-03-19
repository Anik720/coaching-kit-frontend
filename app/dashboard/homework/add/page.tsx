import { Suspense } from "react";
import AddHomeworkPage from "@/components/homeworkPage/AddHomeworkPage";

export default function AddHomeworkRoute() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", color: "#9ca3af" }}>Loading…</div>}>
      <AddHomeworkPage />
    </Suspense>
  );
}
