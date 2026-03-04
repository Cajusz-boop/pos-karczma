import Image from "next/image";
import { LoginClient } from "./LoginClient";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary p-4">
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="relative h-32 w-48">
          <Image
            src="/logo.png"
            alt="Łabędź — Hotel Iława"
            fill
            className="object-contain object-center"
            priority
            unoptimized
          />
        </div>
        <h1 className="text-center text-xl font-semibold text-primary-foreground">
          Karczma Łabędź — logowanie
        </h1>
      </div>
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
        <LoginClient />
      </div>
    </div>
  );
}
