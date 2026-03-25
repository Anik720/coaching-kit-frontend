import { redirect } from "next/navigation";

export default function TeachersRedirect() {
  redirect("/dashboard/teachers/list");
}
