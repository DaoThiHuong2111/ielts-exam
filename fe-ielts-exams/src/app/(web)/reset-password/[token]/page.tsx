import ResetPasswordForm from "@/components/reset-password";

export default function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  return (
    <div className="min-h-dvh">
      <ResetPasswordForm token={params.token} />
    </div>
  );
}