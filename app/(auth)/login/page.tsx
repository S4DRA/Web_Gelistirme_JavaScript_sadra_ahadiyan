import { AuthForm } from "@/components/auth-form";
import { redirect } from "next/navigation";

export default function LoginPage() {
  redirect("/dashboard");

  return <AuthForm mode="login" />;
}
