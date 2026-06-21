import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <RegisterForm />
    </div>
  );
}
