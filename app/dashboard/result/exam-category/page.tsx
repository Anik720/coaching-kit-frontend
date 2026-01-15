import ExamCategoriesPage from "@/components/result-management/exam-category/ExamCategoriesPage";



export default async function ExamCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExamCategoriesPage />;
}