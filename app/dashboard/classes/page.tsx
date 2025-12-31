import ClassesPage from "@/components/classPage/ClassesPage";

export default async function ClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ClassesPage />;
}
