"use client";

import { useParams } from "next/navigation";
import HomeworkViewPage from "@/components/homeworkPage/HomeworkViewPage";

export default function HomeworkViewRoute() {
  const params = useParams();
  const id = params.id as string;
  return <HomeworkViewPage homeworkId={id} />;
}
