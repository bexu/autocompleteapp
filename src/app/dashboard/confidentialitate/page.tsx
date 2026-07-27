import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getConsentStatus } from "@/lib/gdpr/consent";
import { PrivacyPanel } from "./privacy-panel";

export default async function ConfidentialitatePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const consents = await getConsentStatus(session.user.id);
  return <PrivacyPanel initial={consents.map((c) => ({ category: c.category, granted: c.granted }))} />;
}
