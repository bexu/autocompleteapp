import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { OnboardingUpload } from "./onboarding-upload";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <OnboardingUpload />;
}
