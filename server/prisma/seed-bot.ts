/**
 * Seed script for Telegram Bot data.
 * Creates initial BotMessage and BotMenu entries that admins can later edit.
 *
 * Run: npx tsx server/prisma/seed-bot.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedBotMessages() {
  console.log("📝 Seeding bot messages...");

  const messages = [
    {
      key: "welcome",
      text: "Welcome to Senay Tela! 🍽️\nYour favorite Ethiopian food, delivered with love.\n\nChoose an option below:",
      textI18n: {
        en: "Welcome to Senay Tela! 🍽️\nYour favorite Ethiopian food, delivered with love.\n\nChoose an option below:",
        am: "እንኳን ወደ ሰናይ ጤላ በደህና መጡ! 🍽️\nየሚወዱት የኢትዮጵያ ምግብ በፍቅር ይደርሳል።\n\nከታች ያሉትን ይምረጡ:",
      },
    },
    {
      key: "language_prompt",
      text: "🌍 Please select your language:\n\nቋንቋዎን ይምረጡ:",
      textI18n: {
        en: "🌍 Please select your language:\n\nቋንቋዎን ይምረጡ:",
        am: "🌍 ቋንቋዎን ይምረጡ:\n\nPlease select your language:",
      },
    },
    {
      key: "language_updated",
      text: "✅ Language updated to English",
      textI18n: {
        en: "✅ Language updated to English",
        am: "✅ ቋንቋ ወደ አማርኛ ተቀይሯል",
      },
    },
    {
      key: "select_service",
      text: "📦 Choose a service:",
      textI18n: {
        en: "📦 Choose a service:",
        am: "📦 አገልግሎት ይምረጡ:",
      },
    },
    {
      key: "select_option",
      text: "Choose an option:",
      textI18n: {
        en: "Choose an option:",
        am: "አማራጭ ይምረጡ:",
      },
    },
    {
      key: "open_webapp",
      text: "Continue to order",
      textI18n: {
        en: "Continue to order",
        am: "ትዕዛዝ ለመቀጠል",
      },
    },
    {
      key: "faq_header",
      text: "❓ Frequently Asked Questions",
      textI18n: {
        en: "❓ Frequently Asked Questions",
        am: "❓ በተደጋጋሚ የሚጠየቁ ጥያቄዎች",
      },
    },
    {
      key: "contact_header",
      text: "📞 Contact Us",
      textI18n: {
        en: "📞 Contact Us",
        am: "📞 አግኙን",
      },
    },
    {
      key: "about_header",
      text: "ℹ️ About Senay Tela",
      textI18n: {
        en: "ℹ️ About Senay Tela",
        am: "ℹ️ ስለ ሰናይ ጤላ",
      },
    },
    {
      key: "about_content",
      text: "Senay Tela is a premium Ethiopian food service specializing in catering, traditional dishes, and event packages.\n\nWe bring the authentic taste of Ethiopia to your table.",
      textI18n: {
        en: "Senay Tela is a premium Ethiopian food service specializing in catering, traditional dishes, and event packages.\n\nWe bring the authentic taste of Ethiopia to your table.",
        am: "ሰናይ ጤላ በኬተሪንግ፣ በባህላዊ ምግቦች እና በዝግጅት ፓኬጆች ላይ የተሰማራ ልዩ የኢትዮጵያ ምግብ አገልግሎት ነው።\n\nየኢትዮጵያን ትክክለኛ ጣዕም ወደ ጠረጴዛዎ እናመጣለን።",
      },
    },
    {
      key: "request_received",
      text: "✅ Your request has been received!\n\n📋 Reference: {reference}\n\nWe will contact you shortly.",
      textI18n: {
        en: "✅ Your request has been received!\n\n📋 Reference: {reference}\n\nWe will contact you shortly.",
        am: "✅ ጥያቄዎ ደርሷል!\n\n📋 ማጣቀሻ: {reference}\n\nበቅርቡ እናገኝዎታለን።",
      },
    },
    {
      key: "help",
      text: "📖 <b>Available Commands</b>\n\n/start — Main menu\n/order — Place an order\n/language — Change language\n/contact — Contact us\n/help — Show this help",
      textI18n: {
        en: "📖 <b>Available Commands</b>\n\n/start — Main menu\n/order — Place an order\n/language — Change language\n/contact — Contact us\n/help — Show this help",
        am: "📖 <b>የሚገኙ ትዕዛዞች</b>\n\n/start — ዋና ምናሌ\n/order — ትዕዛዝ ያስገቡ\n/language — ቋንቋ ቀይር\n/contact — አግኙን\n/help — እርዳታ",
      },
    },
  ];

  for (const msg of messages) {
    await prisma.botMessage.upsert({
      where: { key: msg.key },
      create: msg,
      update: { text: msg.text, textI18n: msg.textI18n },
    });
    console.log(`  ✓ ${msg.key}`);
  }
}

async function seedBotMenus() {
  console.log("\n📋 Seeding bot menus...");

  const menus = [
    // ── Main menu items (parentKey = null) ─────────────────────────────────
    {
      key: "order",
      parentKey: null,
      label: "Order",
      labelI18n: { en: "Order", am: "ትዕዛዝ" },
      action: "services",
      actionData: null,
      icon: "📦",
      sortOrder: 1,
    },
    {
      key: "faq",
      parentKey: null,
      label: "FAQ",
      labelI18n: { en: "FAQ", am: "ጥያቄዎች" },
      action: "faq",
      actionData: null,
      icon: "❓",
      sortOrder: 2,
    },
    {
      key: "contact",
      parentKey: null,
      label: "Contact Us",
      labelI18n: { en: "Contact Us", am: "አግኙን" },
      action: "contact",
      actionData: null,
      icon: "📞",
      sortOrder: 3,
    },
    {
      key: "about",
      parentKey: null,
      label: "About",
      labelI18n: { en: "About", am: "ስለ እኛ" },
      action: "about",
      actionData: null,
      icon: "ℹ️",
      sortOrder: 4,
    },
    {
      key: "location",
      parentKey: null,
      label: "Location",
      labelI18n: { en: "Location", am: "አድራሻ" },
      action: "location",
      actionData: null,
      icon: "📍",
      sortOrder: 5,
    },
  ];

  for (const menu of menus) {
    await prisma.botMenu.upsert({
      where: { key: menu.key },
      create: menu,
      update: {
        label: menu.label,
        labelI18n: menu.labelI18n,
        action: menu.action,
        icon: menu.icon,
        sortOrder: menu.sortOrder,
      },
    });
    console.log(`  ✓ ${menu.icon} ${menu.key} → ${menu.action}`);
  }
}

async function main() {
  console.log("🤖 Seeding Telegram Bot data...\n");

  await seedBotMessages();
  await seedBotMenus();

  console.log("\n✅ Bot seed complete!\n");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
