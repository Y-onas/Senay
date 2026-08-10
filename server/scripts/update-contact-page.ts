import { prisma } from "../src/lib/prisma.js";
import { deepNormalizeLocalizedTree } from "../src/lib/i18nContent.js";

const lt = (en: string, am: string) => ({ en, am });

const content = {
  eyebrow: lt("Contact", "እውቂያ"),
  title: lt("We'd love to hear from you", "ከእናንተ መስማት እንደምንፈልግ ነው"),
  description: lt(
    "Questions, reservations or feedback — reach out and our team will get back to you.",
    "ጥያቄዎች፣ ቦታ ማስያዝ ወይም አስተያየት — ያግኙን እና ቡድናችን ይመለስልዎታል።",
  ),
  formTitle: lt("Send a message", "መልእክት ይላኩ"),
  phone: "+251 91 234 5678",
  email: "hello@senaytela.com",
  hoursTitle: lt("Opening Hours", "የመክፈቻ ሰዓቶች"),
  contactTitle: lt("Get in touch", "ያግኙን"),
  openingHours: [
    {
      day: lt("Monday – Thursday", "ሰኞ – ሐሙስ"),
      hours: lt("11:00 AM – 10:00 PM", "11:00 ጥዋት – 10:00 ማታ"),
    },
    {
      day: lt("Friday – Saturday", "ዓርብ – ቅዳሜ"),
      hours: lt("11:00 AM – 12:00 AM", "11:00 ጥዋት – 12:00 ጥዋት"),
    },
    {
      day: lt("Sunday", "እሑድ"),
      hours: lt("12:00 PM – 9:00 PM", "12:00 ቀን – 9:00 ማታ"),
    },
  ],
  locationsTitle: lt("Locations", "ቦታዎች"),
  locationsDescription: lt(
    "Visit any of our three Addis Ababa branches for authentic Ethiopian food and house-brewed drinks.",
    "ባህላዊ የኢትዮጵያ ምግብና በቤት የተጠመቁ መጠጦችን ለመገኘት በአዲስ አበባ ያሉን ሶስት ቅርንጫፎች ይጎብኙ።",
  ),
  locationsButtonText: lt("Explore all locations", "ሁሉንም ቦታዎች ይመልከቱ"),
  branches: [
    {
      id: "lebu",
      name: lt("Lebu Muzika Sefer", "ለቡ ሙዚካ ሰፈር"),
      area: lt("Lebu · Addis Ababa", "ለቡ · አዲስ አበባ"),
      mapUrl:
        "https://www.google.com/maps/search/?api=1&query=Lebu+Muzika+Sefer+Addis+Ababa",
      image: "",
    },
    {
      id: "figa",
      name: lt("Figa Mebrat Summit Road", "ፊጋ መብራት ሳሚት መንገድ"),
      area: lt("Summit · Addis Ababa", "ሳሚት · አዲስ አበባ"),
      mapUrl:
        "https://www.google.com/maps/search/?api=1&query=Figa+Mebrat+Summit+Road+Addis+Ababa",
      image: "",
    },
    {
      id: "jemo",
      name: lt("Jemo 1 Condominium", "ጀሞ 1 ኮንዶሚኒየም"),
      area: lt("Jemo · Addis Ababa", "ጀሞ · አዲስ አበባ"),
      mapUrl:
        "https://www.google.com/maps/search/?api=1&query=Jemo+1+Condominium+Addis+Ababa",
      image: "",
    },
  ],
};

await prisma.siteSetting.upsert({
  where: { key: "page:contact" },
  create: { key: "page:contact", value: deepNormalizeLocalizedTree(content) as object },
  update: { value: deepNormalizeLocalizedTree(content) as object },
});

console.log("Updated page:contact with EN/AM content.");
await prisma.$disconnect();
