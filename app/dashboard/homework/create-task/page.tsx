import { Suspense } from "react";
import CreateTaskPage from "@/components/homeworkPage/CreateTaskPage";

export default function CreateTaskRoute() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", color: "#9ca3af" }}>Loading…</div>}>
      <CreateTaskPage />
    </Suspense>
  );
}
