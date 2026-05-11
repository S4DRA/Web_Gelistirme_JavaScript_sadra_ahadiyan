import { AuthForm } from "@/components/auth-form";

type SignupPageProps = {
  searchParams: Promise<{ accessToken?: string | string[]; email?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <AuthForm
      initialEmail={firstParam(params.email)}
      initialAccessToken={firstParam(params.accessToken)}
      mode="signup"
    />
  );
}
