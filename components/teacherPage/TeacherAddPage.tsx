"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useTeacher } from "@/hooks/useTeacher";
import { createTeacher } from "@/api/teacherApi/teacherSlice";
import { toastManager } from "@/utils/toastConfig";
import { CreateTeacherDto } from "@/api/teacherApi/types/teacher.types";
import CreateTeacherModal from "./CreateTeacherModal";

export default function TeacherAddPage() {
  const router = useRouter();
  const { loading, dispatch } = useTeacher();

  const handleCreate = useCallback(
    async (data: CreateTeacherDto) => {
      const id = toastManager.showLoading("Creating teacher...");
      try {
        await dispatch(createTeacher(data)).unwrap();
        toastManager.updateToast(id, "Teacher created successfully!", "success");
        router.push("/dashboard/teachers/list");
      } catch (err: any) {
        toastManager.safeUpdateToast(id, err.message || "Failed to create teacher", "error");
      }
    },
    [dispatch, router]
  );

  return (
    <CreateTeacherModal
      onClose={() => router.push("/dashboard/teachers/list")}
      onCreate={handleCreate}
      loading={loading}
      inline={true}
    />
  );
}
