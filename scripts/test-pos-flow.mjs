const BASE = "http://localhost:3000";

async function test() {
  console.log("1. Pobieranie użytkowników…");
  const usersRes = await fetch(`${BASE}/api/auth/users`);
  if (!usersRes.ok) throw new Error("GET /api/auth/users failed: " + usersRes.status);
  const users = await usersRes.json();
  const lukasz = users.find((u) => u.name === "Łukasz");
  if (!lukasz) throw new Error("Brak użytkownika Łukasz");
  console.log("   OK:", lukasz.name, lukasz.id);

  console.log("2. Logowanie (PIN 1234)…");
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: lukasz.id, pin: "1234" }),
  });
  if (!loginRes.ok) throw new Error("POST /api/auth/login failed: " + loginRes.status);
  const loginData = await loginRes.json();
  console.log("   OK:", loginData.user.name);

  console.log("3. Pobieranie sal i stolików…");
  const roomsRes = await fetch(`${BASE}/api/rooms`);
  if (!roomsRes.ok) throw new Error("GET /api/rooms failed: " + roomsRes.status);
  const rooms = await roomsRes.json();
  const restauracja = rooms.find((r) => r.name === "Restauracja");
  if (!restauracja) throw new Error("Brak sali Restauracja");
  const freeTable = restauracja.tables.find((t) => t.status === "FREE");
  if (!freeTable) throw new Error("Brak wolnego stolika w Restauracji");
  console.log("   OK: Restauracja, stolik", freeTable.number, freeTable.id);

  console.log("4. Tworzenie zamówienia (2 gości)…");
  const orderRes = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tableId: freeTable.id,
      roomId: restauracja.id,
      userId: lukasz.id,
      guestCount: 2,
    }),
  });
  if (!orderRes.ok) {
    const err = await orderRes.text();
    throw new Error("POST /api/orders failed: " + orderRes.status + " " + err);
  }
  const orderData = await orderRes.json();
  console.log("   OK: zamówienie", orderData.order.id, "nr", orderData.order.orderNumber);

  console.log("5. Sprawdzenie mapy — stolik zajęty…");
  const rooms2Res = await fetch(`${BASE}/api/rooms`);
  const rooms2 = await rooms2Res.json();
  const rest2 = rooms2.find((r) => r.name === "Restauracja");
  const tableAfter = rest2.tables.find((t) => t.id === freeTable.id);
  if (tableAfter.status !== "OCCUPIED") throw new Error("Stolik powinien być OCCUPIED");
  if (!tableAfter.activeOrder || tableAfter.activeOrder.id !== orderData.order.id)
    throw new Error("Stolik powinien mieć activeOrder");
  console.log("   OK: status OCCUPIED, activeOrder", tableAfter.activeOrder.id);

  console.log("\n✅ Test flow zakończony pomyślnie.");
}

test().catch((e) => {
  console.error("\n❌ Błąd:", e.message);
  process.exit(1);
});
