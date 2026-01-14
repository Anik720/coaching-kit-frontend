import AttendancePage from "@/components/attendancePage/AttendancePage";



export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AttendancePage />;
}
