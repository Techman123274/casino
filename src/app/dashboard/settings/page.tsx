import { getSettingsData } from "./settings-actions";
import { SettingsClient } from "./SettingsClient";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const result = await getSettingsData();

  if (!result.ok) {
    redirect("/login");
  }

  return <SettingsClient data={result.data} />;
}
