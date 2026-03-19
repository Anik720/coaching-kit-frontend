import { redirect } from "next/navigation";

export default function EvaluateTaskRedirect() {
  redirect("/dashboard/homework/create-task");
}
