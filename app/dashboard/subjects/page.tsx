import SubjectsPage from "@/components/subject/SubjectsPage";


export default async function ClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SubjectsPage />;
}
