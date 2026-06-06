import { LoginForm } from "@/components/features/auth/login-form";
import { Briefcase } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
      <div className="w-full max-w-md px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
            <Briefcase className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">GetTheJob</h1>
          <p className="text-muted-foreground mt-2">
            Track your job applications in one place
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
