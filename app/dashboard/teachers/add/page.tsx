
import TeachersPage from "@/components/teacherPage/TeachersPage";


export default async function AddTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TeachersPage />;
}