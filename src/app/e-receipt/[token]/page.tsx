import { prisma } from "@/lib/prisma";
import { extractReceiptBody } from "@/lib/e-receipt/generator";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return [{ token: "_" }];
}

type Props = {
  params: Promise<{ token: string }>;
};

export default async function EReceiptPage({ params }: Props) {
  const { token } = await params;

  const receipt = await prisma.receipt.findUnique({
    where: { token },
  });

  if (!receipt) {
    notFound();
  }

  if (receipt.expiresAt && receipt.expiresAt < new Date()) {
    notFound();
  }

  if (!receipt.htmlContent) {
    notFound();
  }

  const bodyContent = extractReceiptBody(receipt.htmlContent);

  return (
    <div className="min-h-dvh bg-stone-200 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-xl bg-white ring-1 ring-black/5">
        <div
          dangerouslySetInnerHTML={{ __html: bodyContent }}
          className="[&_*]:max-w-full"
        />
      </div>
      <p className="mt-4 text-xs text-stone-500 font-medium">
        E-paragon wygenerowany elektronicznie — Karczma Łabędź
      </p>
    </div>
  );
}
