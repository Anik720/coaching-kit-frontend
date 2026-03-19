"use client";

import { useParams } from "next/navigation";
import HomeworkSubmissionPage from "@/components/homeworkPage/HomeworkSubmissionPage";

export default function HomeworkSubmissionRoute() {
  const params = useParams();
  const id = params.id as string;
  return <HomeworkSubmissionPage homeworkId={id} />;
}
