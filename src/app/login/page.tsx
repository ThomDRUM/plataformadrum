import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            DRUM
          </span>
          <p className="mt-1 text-sm text-muted-foreground">
            Plataforma de desenvolvimento
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
