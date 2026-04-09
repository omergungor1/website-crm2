import PublicUpdateForm from "@/components/public/PublicUpdateForm";

export const metadata = { title: "Güncelleme Talebi" };

export default async function PublicUpdatePage({ params }) {
  const { projectId } = await params;
  return <PublicUpdateForm projectId={projectId} />;
}
