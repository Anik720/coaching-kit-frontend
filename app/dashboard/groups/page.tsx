import GroupsPage from "@/components/Groups/GroupsPage";


export default async function ClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <GroupsPage />;
}
