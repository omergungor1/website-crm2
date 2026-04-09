"use client";

import { useEffect, useState } from "react";
import InstallationForm from "@/components/installation/InstallationForm";

export default function PublicInstallationForm({ token }) {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/installation/public/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Form bulunamadı");
        return r.json();
      })
      .then((d) => {
        setFormData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-zinc-900">Form Bulunamadı</h1>
          <p className="mt-2 text-sm text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Kurulum Formu</h1>
          <p className="text-sm text-zinc-500">
            Lütfen aşağıdaki bilgileri eksiksiz doldurun.
          </p>
        </div>
      </header>

      {saved && (
        <div className="mx-auto mt-4 max-w-3xl px-4">
          <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            Form başarıyla gönderildi. En kısa sürede dönüş yapılacaktır.
          </div>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-6">
        <InstallationForm
          initialData={formData}
          projectId={formData?.project_id}
          isAdmin={false}
          isPublic={true}
          apiUrl={`/api/installation/public/${token}`}
          method="PUT"
          onSave={(updated) => {
            setFormData(updated);
            if (updated.is_completed) setSaved(true);
          }}
        />
      </main>
    </div>
  );
}
