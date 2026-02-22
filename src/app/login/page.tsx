import { LoginModal } from "@/components/auth/LoginModal";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <LoginModal isIntercepted={false} />
      </div>
    </div>
  );
}
