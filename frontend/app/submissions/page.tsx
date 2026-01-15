/**
 * Submissions page - redirects to dashboard.
 * The submission history is now integrated into the dashboard (Zone C).
 */

import { redirect } from "next/navigation";

export default function SubmissionsPage() {
  redirect("/dashboard");
}
