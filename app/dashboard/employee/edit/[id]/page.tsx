import EditStaffPage from "@/components/employeePage/EditStaffPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <EditStaffPage id={resolvedParams.id} />;
}
