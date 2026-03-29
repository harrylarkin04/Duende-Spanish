import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileView } from "@/components/profile/profile-view";
import { getProfilePageData } from "@/lib/data/profile-page";

export const metadata: Metadata = {
  title: "Perfil — Duende",
  description: "Tu perfil, rachas y récords en Duende.",
};

export default async function ProfilePage() {
  const data = await getProfilePageData();
  if (!data) redirect("/login");

  return <ProfileView data={data} />;
}
