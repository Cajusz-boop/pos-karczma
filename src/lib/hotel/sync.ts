/**
 * Hotel Guest Sync — creates or updates Customer records from hotel guest data.
 * Called during room charge to maintain guest history in POS.
 */

import { prisma } from "@/lib/prisma";

interface HotelGuestData {
  guestId: string;
  guestName: string;
  roomNumber: string;
  phone?: string;
  email?: string;
}

/**
 * Sync hotel guest to POS Customer.
 * - If a Customer with matching hotelGuestId exists → update name, lastVisit, visitCount.
 * - Otherwise → create new Customer.
 * Returns the Customer id.
 */
export async function syncHotelGuest(guest: HotelGuestData): Promise<string> {
  if (!guest.guestId) {
    return "";
  }

  // Try to find existing customer by hotelGuestId
  const existing = await prisma.customer.findUnique({
    where: { hotelGuestId: guest.guestId },
  });

  if (existing) {
    await prisma.customer.update({
      where: { id: existing.id },
      data: {
        name: guest.guestName || existing.name,
        lastVisit: new Date(),
        visitCount: { increment: 1 },
        ...(guest.email && { email: guest.email }),
      },
    });
    return existing.id;
  }

  // Create new customer — phone is required and unique, use placeholder if not provided
  const phone = guest.phone || `hotel-${guest.guestId}`;

  // Check if phone already exists (edge case)
  const byPhone = await prisma.customer.findUnique({
    where: { phone },
  });

  if (byPhone) {
    // Link existing phone-matched customer to hotel guest
    await prisma.customer.update({
      where: { id: byPhone.id },
      data: {
        hotelGuestId: guest.guestId,
        name: guest.guestName || byPhone.name,
        lastVisit: new Date(),
        visitCount: { increment: 1 },
        ...(guest.email && { email: guest.email }),
      },
    });
    return byPhone.id;
  }

  const customer = await prisma.customer.create({
    data: {
      phone,
      name: guest.guestName,
      email: guest.email ?? null,
      hotelGuestId: guest.guestId,
      visitCount: 1,
      lastVisit: new Date(),
      notes: `Gość hotelowy, pokój ${guest.roomNumber}`,
    },
  });

  return customer.id;
}
