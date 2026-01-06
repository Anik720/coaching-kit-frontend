import StudentsPage from "@/components/StudentPage/StudentPage";


export default async function StudentListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentsPage />;
}