"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Banknote,
  CreditCard,
  Smartphone,
  Shuffle,
  ArrowLeft,
  Receipt,
  FileText,
  Percent,
  Tag,
  Check,
  Hotel,
  Loader2,
  Gift,
  Users,
} from "lucide-react";

type OrderItemBill = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRatePercent: number;
  taxRateSymbol: string;
};

type OrderBill = {
  id: string;
  orderNumber: number;
  userId: string;
  items: OrderItemBill[];
  discountJson: { type: string; value: number; reason?: string; authorizedBy?: string } | null;
};

function computeBill(order: OrderBill) {
  const items = order.items.filter((i) => i.quantity > 0);
  const subtotalGross = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  let discountAmount = 0;
  if (order.discountJson?.type === "PERCENT" && typeof order.discountJson.value === "number") {
    discountAmount = (subtotalGross * order.discountJson.value) / 100;
  } else if (order.discountJson?.type === "AMOUNT" && typeof order.discountJson.value === "number") {
    discountAmount = order.discountJson.value;
  }
  const grossTotal = Math.max(0, subtotalGross - discountAmount);
  const ratio = subtotalGross > 0 ? 1 - discountAmount / subtotalGross : 1;

  const bySymbol: Record<string, { net: number; vat: number; gross: number }> = {};
  for (const i of items) {
    const lineGross = i.quantity * i.unitPrice * ratio;
    const rate = i.taxRatePercent;
    const net = lineGross / (1 + rate / 100);
    const vat = lineGross - net;
    const sym = i.taxRateSymbol || "?";
    if (!bySymbol[sym]) bySymbol[sym] = { net: 0, vat: 0, gross: 0 };
    bySymbol[sym].net += net;
    bySymbol[sym].vat += vat;
    bySymbol[sym].gross += lineGross;
  }
  const netTotal = Object.values(bySymbol).reduce((s, x) => s + x.net, 0);
  const vatTotal = Object.values(bySymbol).reduce((s, x) => s + x.vat, 0);

  return { items, subtotalGross, discountAmount, grossTotal, bySymbol, netTotal, vatTotal };
}

type PaymentRow = { method: "CASH" | "CARD" | "BLIK"; amount: string };

type HotelRoom = {
  roomNumber: string;
  guestName: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  reservationId: string;
};

const QUICK_CASH = [10, 20, 50, 100, 200, 500];

export function PaymentDialog({
  open,
  onOpenChange,
  order,
  currentUserId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderBill | null;
  currentUserId: string | null;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"method" | "cash" | "card" | "blik" | "mix" | "room" | "voucher" | "e-receipt">("method");
  const [cashReceived, setCashReceived] = useState("");
  const [payments, setPayments] = useState<PaymentRow[]>([{ method: "CASH", amount: "" }]);
  const [tipAmount, setTipAmount] = useState("");
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"PERCENT" | "AMOUNT">("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceNip, setInvoiceNip] = useState("");
  const [invoiceName, setInvoiceName] = useState("");
  const [invoiceAddress, setInvoiceAddress] = useState("");
  const [receiptNip, setReceiptNip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardOrBlikConfirmed, setCardOrBlikConfirmed] = useState(false);
  // E-receipt state
  const [eReceiptToken, setEReceiptToken] = useState<string | null>(null);
  const [eReceiptQrUrl, setEReceiptQrUrl] = useState<string | null>(null);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  // Room charge state
  const [hotelRooms, setHotelRooms] = useState<HotelRoom[]>([]);
  const [hotelError, setHotelError] = useState<string | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherBalance, setVoucherBalance] = useState<number | null>(null);
  const [voucherChecking, setVoucherChecking] = useState(false);
  const [voucherValid, setVoucherValid] = useState(false);
  // Split bill state
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitPeople, setSplitPeople] = useState("2");
  const [splitting, setSplitting] = useState(false);
  const [splitResult, setSplitResult] = useState<{ splits: { id: string; orderNumber: number; amount: number; personIndex: number }[]; perPerson: number } | null>(null);
  // Foreign currency state
  const [foreignCurrency, setForeignCurrency] = useState(false);
  const [foreignCode, setForeignCode] = useState("EUR");
  const [foreignRate, setForeignRate] = useState(4.30);
  const [foreignSymbol, setForeignSymbol] = useState("€");
  const [currencyRates, setCurrencyRates] = useState<{ code: string; rate: number; symbol: string; name: string }[]>([]);

  const bill = useMemo(() => (order ? computeBill(order) : null), [order]);
  const totalToPay = bill?.grossTotal ?? 0;

  const rawCashInput = parseFloat(cashReceived) || 0;
  const paidByCash = step === "cash" ? rawCashInput : 0;
  const paidByMix = step === "mix" ? payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) : 0;
  const effectiveCashPln = step === "cash" && foreignCurrency && foreignRate > 0
    ? rawCashInput * foreignRate
    : rawCashInput;
  const change = step === "cash" ? Math.max(0, effectiveCashPln - totalToPay) : 0;

  const canConfirm =
    (step === "cash" && effectiveCashPln >= totalToPay - 0.01) ||
    ((step === "card" || step === "blik") && cardOrBlikConfirmed) ||
    (step === "mix" && paidByMix >= totalToPay - 0.01) ||
    (step === "room" && selectedRoom !== null) ||
    (step === "voucher" && voucherValid && voucherBalance !== null);

  const resetState = () => {
    setStep("method");
    setCashReceived("");
    setPayments([{ method: "CASH", amount: "" }]);
    setTipAmount("");
    setDiscountOpen(false);
    setDiscountValue("");
    setInvoiceOpen(false);
    setReceiptNip("");
    setCardOrBlikConfirmed(false);
    setError(null);
    setSelectedRoom(null);
    setHotelRooms([]);
    setHotelError(null);
    setVoucherCode("");
    setVoucherBalance(null);
    setVoucherChecking(false);
    setVoucherValid(false);
    setForeignCurrency(false);
  };

  const applyDiscount = async () => {
    if (!order || !discountValue.trim()) return;
    const value = parseFloat(discountValue.replace(",", "."));
    if (isNaN(value) || value < 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountJson: { type: discountType, value, reason: "Rabat ręczny" },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Błąd rabatu");
      setDiscountOpen(false);
      setDiscountValue("");
      onSuccess();
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = (): { method: string; amount: number }[] => {
    if (step === "cash") return [{ method: "CASH", amount: totalToPay }];
    if (step === "card") return [{ method: "CARD", amount: totalToPay }];
    if (step === "blik") return [{ method: "BLIK", amount: totalToPay }];
    if (step === "room") return [{ method: "ROOM_CHARGE", amount: totalToPay }];
    if (step === "voucher" && voucherBalance !== null) {
      const voucherAmount = Math.min(totalToPay, voucherBalance);
      return [{ method: "VOUCHER", amount: voucherAmount }];
    }
    if (step === "mix") {
      return payments
        .filter((p) => parseFloat(p.amount) > 0)
        .map((p) => ({ method: p.method, amount: parseFloat(p.amount) }));
    }
    return [];
  };

  const fetchHotelRooms = async () => {
    setRoomsLoading(true);
    setHotelError(null);
    try {
      const res = await fetch("/api/hotel/rooms");
      const data = await res.json();
      if (data.error) {
        setHotelError(data.error);
        setHotelRooms([]);
      } else {
        setHotelRooms(data.rooms ?? []);
        if ((data.rooms ?? []).length === 0) {
          setHotelError("Brak zajętych pokoi w hotelu");
        }
      }
    } catch {
      setHotelError("Błąd połączenia z systemem hotelowym");
      setHotelRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleSplitBill = async () => {
    if (!order) return;
    const num = parseInt(splitPeople);
    if (isNaN(num) || num < 2) return;
    setSplitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/split-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numberOfPeople: num }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd podziału");
      setSplitResult(data);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setSplitting(false);
    }
  };

  const fetchCurrencyRates = async () => {
    try {
      const res = await fetch("/api/currency?active=true");
      const data = await res.json();
      if (data.rates?.length > 0) {
        setCurrencyRates(data.rates);
        setForeignCode(data.rates[0].code);
        setForeignRate(data.rates[0].rate);
        setForeignSymbol(data.rates[0].symbol);
      }
    } catch {
      // ignore — rates stay at defaults
    }
  };

  const foreignAmountNeeded = foreignRate > 0 ? Math.ceil((totalToPay / foreignRate) * 100) / 100 : 0;
  const foreignCashPln = foreignCurrency && foreignRate > 0
    ? (parseFloat(cashReceived) || 0) * foreignRate
    : parseFloat(cashReceived) || 0;

  const checkVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherChecking(true);
    setVoucherValid(false);
    setVoucherBalance(null);
    setError(null);
    try {
      const res = await fetch(`/api/vouchers?code=${encodeURIComponent(voucherCode.trim())}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Voucher nie znaleziony");
        return;
      }
      const v = data.voucher;
      if (!v.isActive) {
        setError("Voucher jest dezaktywowany");
        return;
      }
      if (v.expiresAt && new Date(v.expiresAt) < new Date()) {
        setError("Voucher wygasł");
        return;
      }
      const bal = Number(v.balance);
      if (bal <= 0) {
        setError("Voucher ma zerowe saldo");
        return;
      }
      setVoucherBalance(bal);
      setVoucherValid(true);
    } catch {
      setError("Błąd sprawdzania vouchera");
    } finally {
      setVoucherChecking(false);
    }
  };

  const submitParagon = async () => {
    if (!order || !canConfirm) return;
    setLoading(true);
    setError(null);
    try {
      // If paying by room, first post the charge to the hotel and sync guest
      if (step === "room" && selectedRoom) {
        const resHotel = await fetch("/api/hotel/charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomNumber: selectedRoom.roomNumber,
            orderId: order.id,
            guestName: selectedRoom.guestName,
            guestId: selectedRoom.guestId,
          }),
        });
        const hotelData = await resHotel.json();
        if (!resHotel.ok || hotelData.charge?.status === "FAILED") {
          throw new Error(hotelData.error || "Nie udało się obciążyć pokoju");
        }
      }

      // If paying by voucher, use the redeem endpoint (it creates Payment internally)
      if (step === "voucher" && voucherCode.trim()) {
        const voucherAmount = Math.min(totalToPay, voucherBalance ?? 0);
        if (voucherAmount < totalToPay - 0.01) {
          throw new Error(
            `Voucher pokrywa tylko ${voucherAmount.toFixed(2)} zł z ${totalToPay.toFixed(2)} zł. Użyj płatności Mix.`
          );
        }
        const resRedeem = await fetch("/api/vouchers/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: voucherCode.trim(),
            amount: voucherAmount,
            orderId: order.id,
          }),
        });
        if (!resRedeem.ok) {
          const redeemData = await resRedeem.json();
          throw new Error(redeemData.error || "Błąd realizacji vouchera");
        }
      } else {
        const tip = parseFloat(tipAmount.replace(",", ".")) || 0;
        const resPay = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            payments: buildPayload(),
            tipAmount: tip > 0 ? tip : undefined,
            tipUserId: tip > 0 && currentUserId ? currentUserId : undefined,
          }),
        });
        if (!resPay.ok) throw new Error((await resPay.json()).error || "Błąd płatności");
      }

      const resClose = await fetch(`/api/orders/${order.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: true, buyerNip: receiptNip.trim() || undefined }),
      });
      if (!resClose.ok) throw new Error((await resClose.json()).error || "Błąd zamykania");
      const closeData = await resClose.json();
      // Save e-receipt data if available, but don't force the step
      if (closeData.receiptToken) {
        setEReceiptToken(closeData.receiptToken);
        setReceiptId(closeData.receiptId ?? null);
        const appUrl = typeof window !== "undefined" ? window.location.origin : "";
        setEReceiptQrUrl(`${appUrl}/e-receipt/${closeData.receiptToken}`);
      }
      // Go back to map immediately (e-receipt is optional)
      resetState();
      onOpenChange(false);
      onSuccess();
      router.push("/pos");
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  };

  const handleSendSms = async () => {
    if (!receiptId || !smsPhone.trim()) return;
    setSmsSending(true);
    try {
      const res = await fetch("/api/e-receipt/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId, phone: smsPhone.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Błąd SMS");
      setSmsSent(true);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setSmsSending(false);
    }
  };

  const finishAndGoBack = () => {
    resetState();
    onOpenChange(false);
    onSuccess();
    router.push("/pos");
  };

  const submitFaktura = async () => {
    if (!order || !canConfirm) return;
    setLoading(true);
    setError(null);
    try {
      const tip = parseFloat(tipAmount.replace(",", ".")) || 0;
      const resPay = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          payments: buildPayload(),
          tipAmount: tip > 0 ? tip : undefined,
          tipUserId: tip > 0 && currentUserId ? currentUserId : undefined,
        }),
      });
      if (!resPay.ok) throw new Error((await resPay.json()).error || "Błąd płatności");
      const resInv = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          buyerNip: invoiceNip.trim() || undefined,
          buyerName: invoiceName.trim() || undefined,
          buyerAddress: invoiceAddress.trim() || undefined,
        }),
      });
      if (!resInv.ok) throw new Error((await resInv.json()).error || "Błąd faktury");
      const resClose = await fetch(`/api/orders/${order.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: false }),
      });
      if (!resClose.ok) throw new Error((await resClose.json()).error || "Błąd zamykania");
      setInvoiceOpen(false);
      resetState();
      onOpenChange(false);
      onSuccess();
      router.push("/pos");
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  // Invoice sub-dialog
  if (invoiceOpen) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setInvoiceOpen(false); } onOpenChange(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dane do faktury</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">NIP</label>
              <Input placeholder="NIP nabywcy" value={invoiceNip} onChange={(e) => setInvoiceNip(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nazwa</label>
              <Input placeholder="Nazwa firmy" value={invoiceName} onChange={(e) => setInvoiceName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Adres</label>
              <Input placeholder="Adres siedziby" value={invoiceAddress} onChange={(e) => setInvoiceAddress(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>Wstecz</Button>
            <Button onClick={submitFaktura} disabled={!canConfirm || loading} className="gap-2">
              <FileText className="h-4 w-4" />
              {loading ? "Wystawianie…" : "Wystaw fakturę"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-2xl">
        {/* Header with total */}
        <div className="mb-2 text-center">
          <p className="text-sm text-muted-foreground">Zamówienie #{order.orderNumber}</p>
          <p className="text-4xl font-black tabular-nums sm:text-5xl">
            {totalToPay.toFixed(2)} <span className="text-2xl sm:text-3xl">zł</span>
          </p>
          {bill && bill.discountAmount > 0 && (
            <p className="text-sm text-muted-foreground">
              Rabat: -{bill.discountAmount.toFixed(2)} zł
            </p>
          )}
        </div>

        {/* Step: Choose payment method */}
        {step === "method" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => { setStep("cash"); setCashReceived(totalToPay.toFixed(2)); }}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-6 text-emerald-700 shadow-sm transition-all active:scale-95 dark:bg-emerald-950/30 dark:text-emerald-400"
              >
                <Banknote className="h-10 w-10" />
                <span className="text-lg font-bold">Gotówka</span>
              </button>
              <button
                type="button"
                onClick={() => { setStep("card"); setCardOrBlikConfirmed(false); }}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-blue-500 bg-blue-50 p-6 text-blue-700 shadow-sm transition-all active:scale-95 dark:bg-blue-950/30 dark:text-blue-400"
              >
                <CreditCard className="h-10 w-10" />
                <span className="text-lg font-bold">Karta</span>
              </button>
              <button
                type="button"
                onClick={() => { setStep("blik"); setCardOrBlikConfirmed(false); }}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-pink-500 bg-pink-50 p-6 text-pink-700 shadow-sm transition-all active:scale-95 dark:bg-pink-950/30 dark:text-pink-400"
              >
                <Smartphone className="h-10 w-10" />
                <span className="text-lg font-bold">BLIK</span>
              </button>
              <button
                type="button"
                onClick={() => setStep("mix")}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-purple-500 bg-purple-50 p-6 text-purple-700 shadow-sm transition-all active:scale-95 dark:bg-purple-950/30 dark:text-purple-400"
              >
                <Shuffle className="h-10 w-10" />
                <span className="text-lg font-bold">Mix</span>
              </button>
              <button
                type="button"
                onClick={() => setStep("voucher")}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-orange-500 bg-orange-50 p-6 text-orange-700 shadow-sm transition-all active:scale-95 dark:bg-orange-950/30 dark:text-orange-400"
              >
                <Gift className="h-10 w-10" />
                <span className="text-lg font-bold">Voucher</span>
              </button>
              <button
                type="button"
                onClick={() => { setStep("room"); fetchHotelRooms(); }}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-amber-500 bg-amber-50 p-6 text-amber-700 shadow-sm transition-all active:scale-95 dark:bg-amber-950/30 dark:text-amber-400"
              >
                <Hotel className="h-10 w-10" />
                <span className="text-lg font-bold">Na pokój</span>
              </button>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDiscountOpen(!discountOpen)}>
                <Percent className="h-3.5 w-3.5" />
                Rabat
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                NIP na paragonie
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSplitOpen(!splitOpen)}>
                <Users className="h-3.5 w-3.5" />
                Podziel rachunek
              </Button>
            </div>

            {/* Split bill panel */}
            {splitOpen && !splitResult && (
              <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                <p className="text-sm font-semibold">Podziel rachunek równo</p>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Liczba osób:</label>
                  <div className="flex gap-1">
                    {[2, 3, 4, 5, 6].map((n) => (
                      <Button
                        key={n}
                        variant={splitPeople === String(n) ? "default" : "outline"}
                        size="sm"
                        className="h-10 w-10 text-lg font-bold"
                        onClick={() => setSplitPeople(String(n))}
                      >
                        {n}
                      </Button>
                    ))}
                    <Input
                      type="number"
                      min="2"
                      max="20"
                      value={splitPeople}
                      onChange={(e) => setSplitPeople(e.target.value)}
                      className="w-16 text-center font-bold"
                    />
                  </div>
                </div>
                {parseInt(splitPeople) >= 2 && (
                  <p className="text-sm text-muted-foreground">
                    Każda osoba zapłaci: <span className="font-bold">{(totalToPay / parseInt(splitPeople)).toFixed(2)} zł</span>
                  </p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSplitBill} disabled={splitting || parseInt(splitPeople) < 2}>
                    {splitting ? "Dzielenie…" : "Podziel"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSplitOpen(false)}>Anuluj</Button>
                </div>
              </div>
            )}

            {/* Split result */}
            {splitResult && (
              <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3 space-y-2 dark:bg-emerald-950/20">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Rachunek podzielony na {splitResult.splits.length} części
                </p>
                <div className="space-y-1">
                  {splitResult.splits.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded bg-white/50 px-2 py-1 text-sm dark:bg-black/20">
                      <span>Osoba {s.personIndex} — Zam. #{s.orderNumber}</span>
                      <span className="font-bold tabular-nums">{s.amount.toFixed(2)} zł</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Każde zamówienie można opłacić osobno. Wróć do mapy stolików.
                </p>
                <Button size="sm" onClick={() => { resetState(); onOpenChange(false); onSuccess(); router.push("/pos"); }}>
                  Wróć do stolików
                </Button>
              </div>
            )}

            {/* Discount panel */}
            {discountOpen && (
              <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                <p className="text-sm font-semibold">Rabat</p>
                <div className="flex gap-2">
                  <Button
                    variant={discountType === "PERCENT" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDiscountType("PERCENT")}
                  >
                    Procentowy (%)
                  </Button>
                  <Button
                    variant={discountType === "AMOUNT" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDiscountType("AMOUNT")}
                  >
                    Kwotowy (zł)
                  </Button>
                </div>
                <Input
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "PERCENT" ? "np. 10" : "np. 5.00"}
                  type="number"
                  step="0.01"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={applyDiscount} disabled={loading}>Zastosuj</Button>
                  <Button variant="outline" size="sm" onClick={() => { setDiscountOpen(false); setDiscountValue(""); }}>Anuluj</Button>
                </div>
              </div>
            )}

            {/* Bill breakdown */}
            {bill && (
              <details className="rounded-lg border p-2">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                  Szczegóły rachunku ({bill.items.length} poz.)
                </summary>
                <div className="mt-2 space-y-1 text-xs">
                  {bill.items.map((i) => (
                    <div key={i.id} className="flex justify-between">
                      <span>{i.productName} × {i.quantity}</span>
                      <span className="tabular-nums">{(i.quantity * i.unitPrice).toFixed(2)} zł</span>
                    </div>
                  ))}
                  <div className="border-t pt-1">
                    {Object.entries(bill.bySymbol).map(([sym, v]) => (
                      <div key={sym} className="flex justify-between text-muted-foreground">
                        <span>VAT {sym}</span>
                        <span>netto {v.net.toFixed(2)} + VAT {v.vat.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            )}
          </div>
        )}

        {/* Step: Cash payment */}
        {step === "cash" && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setStep("method")}>
              <ArrowLeft className="h-4 w-4" />
              Zmień formę
            </Button>

            <div>
              <label className="mb-1 block text-sm font-medium">Kwota od klienta</label>
              <Input
                type="number"
                step="0.01"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="h-14 text-center text-2xl font-bold"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {QUICK_CASH.map((v) => (
                <Button
                  key={v}
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => setCashReceived(String(v))}
                >
                  {v} zł
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full h-12 text-lg font-semibold"
              onClick={() => {
                if (foreignCurrency) {
                  setCashReceived(foreignAmountNeeded.toFixed(2));
                } else {
                  setCashReceived(totalToPay.toFixed(2));
                }
              }}
            >
              Odliczone ({foreignCurrency ? `${foreignAmountNeeded.toFixed(2)} ${foreignSymbol}` : `${totalToPay.toFixed(2)} zł`})
            </Button>

            {/* Foreign currency toggle */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={foreignCurrency}
                  onChange={(e) => {
                    setForeignCurrency(e.target.checked);
                    if (e.target.checked && currencyRates.length === 0) {
                      fetchCurrencyRates();
                    }
                    setCashReceived("");
                  }}
                  className="h-4 w-4 rounded"
                />
                <span className="font-medium">Waluta obca</span>
              </label>
              {foreignCurrency && (
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-lg border bg-background px-3 py-2 text-sm font-medium"
                    value={foreignCode}
                    onChange={(e) => {
                      const sel = currencyRates.find((r) => r.code === e.target.value);
                      if (sel) {
                        setForeignCode(sel.code);
                        setForeignRate(sel.rate);
                        setForeignSymbol(sel.symbol);
                      }
                      setCashReceived("");
                    }}
                  >
                    {currencyRates.length > 0 ? (
                      currencyRates.map((r) => (
                        <option key={r.code} value={r.code}>{r.code} ({r.symbol})</option>
                      ))
                    ) : (
                      <>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                      </>
                    )}
                  </select>
                  <span className="text-sm text-muted-foreground">
                    Kurs: 1 {foreignCode} = {foreignRate.toFixed(2)} PLN
                  </span>
                </div>
              )}
              {foreignCurrency && rawCashInput > 0 && (
                <p className="text-sm text-muted-foreground">
                  {rawCashInput.toFixed(2)} {foreignSymbol} = <span className="font-bold">{effectiveCashPln.toFixed(2)} PLN</span>
                </p>
              )}
            </div>

            {effectiveCashPln >= totalToPay - 0.01 && (
              <div className="rounded-2xl bg-emerald-50 p-4 text-center dark:bg-emerald-950/30">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">Reszta</p>
                <p className="text-5xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                  {change.toFixed(2)} zł
                </p>
                {foreignCurrency && change > 0 && (
                  <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                    ({(change / foreignRate).toFixed(2)} {foreignSymbol})
                  </p>
                )}
              </div>
            )}

            {/* Tip */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Napiwek:</label>
              <Input
                type="number"
                step="0.01"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="0.00"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">zł</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">NIP na paragonie:</label>
              <Input
                value={receiptNip}
                onChange={(e) => setReceiptNip(e.target.value)}
                placeholder="opcjonalnie"
                className="w-40"
              />
            </div>
          </div>
        )}

        {/* Step: Card / BLIK */}
        {(step === "card" || step === "blik") && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setStep("method")}>
              <ArrowLeft className="h-4 w-4" />
              Zmień formę
            </Button>

            <div className="rounded-2xl border-2 border-dashed p-8 text-center">
              {step === "card" ? (
                <>
                  <CreditCard className="mx-auto mb-3 h-16 w-16 text-blue-500" />
                  <div className="mx-auto mb-3 h-20 w-20 rounded-full border-4 border-blue-200 flex items-center justify-center animate-pulse">
                    <Smartphone className="h-10 w-10 text-blue-400" />
                  </div>
                </>
              ) : (
                <Smartphone className="mx-auto mb-3 h-16 w-16 text-pink-500" />
              )}
              <p className="text-lg font-semibold">
                {step === "card" ? "Przyłóż kartę do telefonu" : "Oczekiwanie na BLIK…"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Kwota: {totalToPay.toFixed(2)} zł
              </p>
              {step === "card" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Karta płatnicza, telefon z NFC lub zegarek
                </p>
              )}
            </div>

            <Button
              className={cn(
                "w-full h-14 text-lg font-bold gap-2",
                cardOrBlikConfirmed && "bg-emerald-600 hover:bg-emerald-700"
              )}
              variant={cardOrBlikConfirmed ? "default" : "outline"}
              onClick={() => setCardOrBlikConfirmed(true)}
            >
              <Check className="h-5 w-5" />
              {cardOrBlikConfirmed
                ? "Płatność zaakceptowana"
                : step === "card"
                  ? "Potwierdź akceptację karty"
                  : "Potwierdź akceptację BLIK"
              }
            </Button>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Napiwek:</label>
              <Input type="number" step="0.01" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} placeholder="0.00" className="w-24" />
              <span className="text-sm text-muted-foreground">zł</span>
            </div>
          </div>
        )}

        {/* Step: Mix payment */}
        {step === "mix" && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setStep("method")}>
              <ArrowLeft className="h-4 w-4" />
              Zmień formę
            </Button>

            <div className="space-y-2">
              {payments.map((p, idx) => (
                <div key={idx} className="flex gap-2">
                  <select
                    className="rounded-lg border bg-background px-3 py-2 text-sm"
                    value={p.method}
                    onChange={(e) => {
                      const next = [...payments];
                      next[idx] = { ...next[idx], method: e.target.value as PaymentRow["method"] };
                      setPayments(next);
                    }}
                  >
                    <option value="CASH">Gotówka</option>
                    <option value="CARD">Karta</option>
                    <option value="BLIK">BLIK</option>
                  </select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Kwota"
                    value={p.amount}
                    className="text-lg font-semibold"
                    onChange={(e) => {
                      const next = [...payments];
                      next[idx] = { ...next[idx], amount: e.target.value };
                      setPayments(next);
                    }}
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setPayments([...payments, { method: "CASH", amount: "" }])}>
                + Dodaj płatność
              </Button>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Suma płatności:</span>
                <span className={cn("font-bold tabular-nums", paidByMix >= totalToPay - 0.01 ? "text-emerald-600" : "text-destructive")}>
                  {paidByMix.toFixed(2)} / {totalToPay.toFixed(2)} zł
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Napiwek:</label>
              <Input type="number" step="0.01" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} placeholder="0.00" className="w-24" />
              <span className="text-sm text-muted-foreground">zł</span>
            </div>
          </div>
        )}

        {/* Step: Voucher payment */}
        {step === "voucher" && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setStep("method"); setVoucherCode(""); setVoucherBalance(null); setVoucherValid(false); setError(null); }}>
              <ArrowLeft className="h-4 w-4" />
              Zmień formę
            </Button>

            <div className="text-center">
              <Gift className="mx-auto mb-2 h-12 w-12 text-orange-500" />
              <p className="text-lg font-semibold">Płatność voucherem</p>
              <p className="text-sm text-muted-foreground">Wpisz kod z karty podarunkowej</p>
            </div>

            <div className="flex gap-2">
              <Input
                value={voucherCode}
                onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherValid(false); setVoucherBalance(null); setError(null); }}
                placeholder="GV-XXXX-XXXX"
                className="h-14 text-center text-xl font-mono font-bold tracking-wider"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") checkVoucher(); }}
              />
              <Button
                className="h-14 px-6"
                onClick={checkVoucher}
                disabled={voucherChecking || !voucherCode.trim()}
              >
                {voucherChecking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sprawdź"}
              </Button>
            </div>

            {voucherValid && voucherBalance !== null && (
              <div className="rounded-2xl bg-orange-50 p-4 text-center dark:bg-orange-950/30">
                <p className="text-sm text-orange-700 dark:text-orange-400">Saldo vouchera</p>
                <p className="text-4xl font-black tabular-nums text-orange-600 dark:text-orange-400">
                  {voucherBalance.toFixed(2)} zł
                </p>
                {voucherBalance >= totalToPay ? (
                  <p className="mt-1 text-sm text-emerald-600">
                    Wystarczy na pokrycie rachunku ({totalToPay.toFixed(2)} zł)
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-amber-600">
                    Pokrywa {voucherBalance.toFixed(2)} zł z {totalToPay.toFixed(2)} zł
                    — brakuje {(totalToPay - voucherBalance).toFixed(2)} zł
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step: Room charge */}
        {step === "room" && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setStep("method"); setSelectedRoom(null); }}>
              <ArrowLeft className="h-4 w-4" />
              Zmień formę
            </Button>

            <div className="text-center">
              <Hotel className="mx-auto mb-2 h-12 w-12 text-amber-500" />
              <p className="text-lg font-semibold">Obciąż pokój hotelowy</p>
              <p className="text-sm text-muted-foreground">
                Kwota {totalToPay.toFixed(2)} zł zostanie dopisana do rachunku pokoju
              </p>
            </div>

            {roomsLoading && (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                <span className="text-sm text-muted-foreground">Pobieranie pokoi…</span>
              </div>
            )}

            {hotelError && !roomsLoading && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center">
                <p className="text-sm text-destructive">{hotelError}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={fetchHotelRooms}>
                  Spróbuj ponownie
                </Button>
              </div>
            )}

            {!roomsLoading && !hotelError && hotelRooms.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {hotelRooms.map((room) => (
                  <button
                    key={room.roomNumber}
                    type="button"
                    onClick={() => setSelectedRoom(room)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all active:scale-[0.98]",
                      selectedRoom?.roomNumber === room.roomNumber
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                        : "border-muted hover:border-amber-300"
                    )}
                  >
                    <div>
                      <p className="text-lg font-bold">Pokój {room.roomNumber}</p>
                      <p className="text-sm text-muted-foreground">{room.guestName}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{room.checkIn ? new Date(room.checkIn).toLocaleDateString("pl-PL") : ""}</p>
                      <p>→ {room.checkOut ? new Date(room.checkOut).toLocaleDateString("pl-PL") : ""}</p>
                    </div>
                    {selectedRoom?.roomNumber === room.roomNumber && (
                      <Check className="ml-2 h-6 w-6 text-amber-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {selectedRoom && (
              <div className="rounded-2xl bg-amber-50 p-4 text-center dark:bg-amber-950/30">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Pokój <span className="font-bold">{selectedRoom.roomNumber}</span> — {selectedRoom.guestName}
                </p>
                <p className="text-3xl font-black tabular-nums text-amber-600 dark:text-amber-400">
                  {totalToPay.toFixed(2)} zł
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step: E-receipt (after payment) */}
        {step === "e-receipt" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 p-6 text-center dark:bg-emerald-950/30">
              <Check className="mx-auto mb-2 h-12 w-12 text-emerald-600" />
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                Płatność przyjęta!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Zamówienie #{order.orderNumber} zamknięte
              </p>
            </div>

            <div className="text-center">
              <p className="mb-3 text-sm font-semibold">E-paragon dla gościa</p>

              {/* QR Code */}
              {eReceiptQrUrl && (
                <div className="mx-auto mb-3 inline-block rounded-xl border-2 bg-white p-4">
                  <div className="flex h-48 w-48 items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(eReceiptQrUrl)}`}
                      alt="QR e-paragon"
                      className="h-48 w-48"
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Gość skanuje telefonem
                  </p>
                </div>
              )}

              {/* SMS option */}
              <div className="mx-auto max-w-xs space-y-2">
                <p className="text-xs text-muted-foreground">lub wyślij SMS z linkiem:</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nr telefonu (np. 500600700)"
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    className="text-center"
                    type="tel"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendSms}
                    disabled={smsSending || smsSent || !smsPhone.trim()}
                  >
                    {smsSent ? "Wysłano!" : smsSending ? "…" : "Wyślij"}
                  </Button>
                </div>
                {smsSent && (
                  <p className="text-xs text-emerald-600">SMS z e-paragonem wysłany</p>
                )}
              </div>
            </div>

            <Button
              className="w-full h-14 text-lg font-bold"
              onClick={finishAndGoBack}
            >
              Gotowe — wróć do stolików
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={finishAndGoBack}
            >
              Pomiń e-paragon
            </Button>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Footer: Paragon / Faktura buttons */}
        {step !== "method" && step !== "e-receipt" && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1 h-14 gap-2 text-lg font-bold"
              onClick={submitParagon}
              disabled={!canConfirm || loading}
            >
              <Receipt className="h-5 w-5" />
              {loading ? "Przetwarzanie…" : "Paragon"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-14 gap-2 text-lg font-bold"
              onClick={() => setInvoiceOpen(true)}
              disabled={!canConfirm || loading}
            >
              <FileText className="h-5 w-5" />
              Faktura
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
