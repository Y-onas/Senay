/**
 * Telegram confirmation sent only to the customer who submitted via the bot WebApp.
 * Mirrors the public website confirmation page. Does not affect admin alerts.
 */
import { escapeHtml } from "./helpers/html.js";

type Lang = "en" | "am";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatEtb(amount: number): string {
  return `${amount.toLocaleString("en-US")} ETB`;
}

function formatFulfillment(raw: string | null | undefined, lang: Lang): string {
  const value = (raw ?? "").toLowerCase();
  if (value === "pickup") return lang === "am" ? "በራስ መውሰድ" : "Self Pickup";
  if (value === "delivery") return lang === "am" ? "መላክ" : "Delivery";
  return raw?.trim() || (lang === "am" ? "—" : "—");
}

function thankYou(slug: string, lang: Lang): string {
  if (lang === "am") {
    switch (slug) {
      case "agelgil":
        return "አመሰግናለን! የአገልግል ትዕዛዝዎ ገብቷል። በቅርቡ እናረጋግጣለን።";
      case "baltina":
        return "አመሰግናለን! የበልቲና ትዕዛዝዎ ገብቷል። በቅርቡ እናረጋግጣለን።";
      case "drinks":
        return "አመሰግናለን! የመጠጥ ትዕዛዝዎ ገብቷል። በቅርቡ እናረጋግጣለን።";
      case "festival":
        return "አመሰግናለን! የበዓል ፓኬጅ ትዕዛዝዎ ገብቷል። በቅርቡ እናረጋግጣለን።";
      default:
        return "አመሰግናለን! የኬተሪንግ ጥያቄዎ ገብቷል። ቡድናችን ዝርዝሩን ለማቀድ በቅርቡ ያገኝዎታል።";
    }
  }

  switch (slug) {
    case "agelgil":
      return "Thank you! Your Agelgil order is in. We’ll confirm shortly.";
    case "baltina":
      return "Thank you! Your Baltina order is in. We’ll confirm shortly.";
    case "drinks":
      return "Thank you! Your drinks order is in. We’ll confirm shortly.";
    case "festival":
      return "Thank you! Your Festival package order is in. We’ll confirm shortly.";
    default:
      return "Thank you! Your catering request is in. Our team will reach out shortly to plan the details.";
  }
}

function formatComboLabel(combo: unknown): string | null {
  if (!Array.isArray(combo) || combo.length === 0) return null;
  const parts = combo.flatMap((line) => {
    const row = asRecord(line);
    if (!row) return [];
    const size = asNumber(row.size);
    const quantity = asNumber(row.quantity);
    if (size == null || quantity == null) return [];
    return [`${quantity} × ${size}-person`];
  });
  return parts.length ? parts.join(" + ") : null;
}

function formatLineItems(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    const row = asRecord(item);
    if (!row) return [];
    const name = asString(row.name);
    if (!name) return [];
    const qty = asNumber(row.qty);
    const unit = asString(row.unit);
    const lineTotal = asNumber(row.lineTotal);
    const qtyLabel = qty != null ? ` × ${qty}${unit ? ` ${unit}` : ""}` : "";
    const priceLabel = lineTotal != null ? ` — ${formatEtb(lineTotal)}` : "";
    return [`${escapeHtml(name)}${escapeHtml(qtyLabel)}${escapeHtml(priceLabel)}`];
  });
}

function detailLine(label: string, value: string): string {
  return `${escapeHtml(label)}: ${value}`;
}

export function formatCustomerRequestConfirmation(input: {
  serviceSlug: string;
  reference: string;
  payload: Record<string, unknown>;
  guests?: number | null;
  totalAmount?: number | null;
  packageSummary?: string | null;
  deliveryMethod?: string | null;
  languageCode?: string | null;
}): string {
  const lang: Lang = input.languageCode === "am" ? "am" : "en";
  const payload = input.payload;
  const slug = input.serviceSlug;

  const title = lang === "am" ? "ጥያቄዎ ደርሷል!" : "Request received!";
  const referenceLabel = lang === "am" ? "ማጣቀሻ" : "Reference";
  const guestsLabel = lang === "am" ? "እንግዶች" : "Guests";
  const packagesLabel = lang === "am" ? "ፓኬጆች" : "Packages";
  const packageLabel = lang === "am" ? "ፓኬጅ" : "Package";
  const drinkLabel = lang === "am" ? "መጠጥ" : "Drink";
  const totalLabel = lang === "am" ? "ድምር" : "Total";
  const fulfillmentLabel = lang === "am" ? "አቀራረብ" : "Fulfillment";

  const payloadDelivery = asString(payload.deliveryMethod) ?? input.deliveryMethod;
  const guests = asNumber(payload.guests) ?? input.guests ?? null;
  const total =
    asNumber(payload.grandTotal) ??
    asNumber(payload.totalPrice) ??
    input.totalAmount ??
    null;

  const lines: string[] = [
    `✅ <b>${escapeHtml(title)}</b>`,
    "",
    escapeHtml(thankYou(slug, lang)),
    "",
    `📋 <b>${escapeHtml(referenceLabel)}:</b> ${escapeHtml(input.reference)}`,
    "",
  ];

  if (slug === "baltina" || slug === "drinks") {
    const itemLines = formatLineItems(payload.items);
    if (itemLines.length) {
      lines.push(...itemLines, "");
    } else if (input.packageSummary) {
      lines.push(escapeHtml(input.packageSummary), "");
    }
  } else if (slug === "festival") {
    const packageName = asString(payload.packageName) ?? input.packageSummary;
    const qty = asNumber(payload.qty);
    if (packageName) {
      const qtySuffix = qty != null && qty > 1 ? ` × ${qty}` : "";
      lines.push(detailLine(packageLabel, `${escapeHtml(packageName)}${escapeHtml(qtySuffix)}`));
    }
    const drink = asString(payload.drinkChoice);
    if (drink) {
      lines.push(detailLine(drinkLabel, escapeHtml(drink)));
    }
    const included = Array.isArray(payload.includedItems)
      ? payload.includedItems.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
    if (included.length) {
      lines.push(...included.map((item) => `• ${escapeHtml(item)}`));
    }
    if (packageName || drink || included.length) lines.push("");
  } else if (slug === "agelgil") {
    if (guests != null) {
      lines.push(detailLine(guestsLabel, String(guests)));
    }
    const combo = formatComboLabel(payload.combo) ?? input.packageSummary;
    if (combo) {
      lines.push(detailLine(packagesLabel, escapeHtml(combo)));
    }
    if (guests != null || combo) lines.push("");
  } else {
    if (guests != null) {
      lines.push(detailLine(guestsLabel, String(guests)));
    }
    if (input.packageSummary) {
      lines.push(detailLine(packageLabel, escapeHtml(input.packageSummary)));
    }
    if (guests != null || input.packageSummary) lines.push("");
  }

  if (total != null) {
    lines.push(detailLine(totalLabel, escapeHtml(formatEtb(total))));
  }
  if (payloadDelivery) {
    lines.push(detailLine(fulfillmentLabel, escapeHtml(formatFulfillment(payloadDelivery, lang))));
    const pickupLocation =
      asString(payload.pickupLocation) ??
      ((payloadDelivery ?? "").toLowerCase() === "pickup" ? asString(payload.location) : null);
    if (pickupLocation && (payloadDelivery ?? "").toLowerCase() === "pickup") {
      const pickupLocLabel = lang === "am" ? "የመውሰጃ ቦታ" : "Pickup location";
      lines.push(detailLine(pickupLocLabel, escapeHtml(pickupLocation)));
    }
  }

  const isDelivery = (payloadDelivery ?? "").toLowerCase() === "delivery";
  if (slug !== "catering" && isDelivery) {
    const noticeTitle = lang === "am" ? "ማሳሰቢያ" : "Important Notice";
    const noticeBody =
      lang === "am"
        ? "ለዚህ ትዕዛዝ ተጨማሪ የማድረሻ ክፍያ የሚታሰብ ሲሆን አጠቃላይ ሂሳብዎ ላይ የሚደመር ይሆናል።"
        : "An additional delivery fee applies to this order. The delivery fee will be added to your order.";
    lines.push("", `⚠️ <b>${escapeHtml(noticeTitle)}</b>`, escapeHtml(noticeBody));
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
