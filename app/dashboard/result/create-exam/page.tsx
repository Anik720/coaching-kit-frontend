import ExamPage from "@/components/result-management/create-exam/ExamPage";




export default async function ExamCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExamPage />;
}