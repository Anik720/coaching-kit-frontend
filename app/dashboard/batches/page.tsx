import BatchesPage from "@/components/Btach/BatchesPage";


export default async function BatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <BatchesPage />;
}
