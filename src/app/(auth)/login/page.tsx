import { LoginClient } from "./LoginClient";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <h1 className="mb-8 text-2xl font-semibold">Karczma Łabędź — logowanie</h1>
      <LoginClient />
    </div>
  );
}
