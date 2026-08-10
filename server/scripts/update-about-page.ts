import { prisma } from "../src/lib/prisma.js";
import { deepNormalizeLocalizedTree } from "../src/lib/i18nContent.js";

const lt = (en: string, am: string) => ({ en, am });

const content = {
  eyebrow: lt("About Us", "ስለ እኛ"),
  title: lt("The story of Senay Tela", "የሰናይ ተላ ታሪክ"),
  description: lt(
    "A family kitchen keeping Ethiopian tradition alive — one stew, one ceremony, one celebration at a time.",
    "ቤተሰብ ኩሽን የኢትዮጵያን ባህል በአንድ ወጥ፣ በአንድ ስነ-ስርዓት እና በአንድ በዓል በአንድ ጊዜ እያስቀመጠ ይገኛል።",
  ),
  sectionLabel: lt("Who we are", "እኛ ማን ነን"),
  sectionTitle: lt(
    "More than a restaurant — a living tradition",
    "ከሬስቶራን በላይ — በሕይወት ያለ ባህል",
  ),
  paragraphs: [
    lt(
      "Senay Tela was born from a simple wish: to share the food and drink that bring Ethiopian families together.",
      "ሰናይ ተላ ከቀላል ፍላጎት ተወለደ፡ የኢትዮጵያ ቤተሰቦችን የሚያሰባስቡ ምግብና መጠጥን ለማካፈል።",
    ),
    lt(
      "Every dish that leaves our kitchen carries the same care it would in a family home.",
      "ከኩሽናችን የሚወጣ እያንዳንዱ ምግብ በቤተሰብ ቤት እንደሚሰራው ተመሳሳይ እንክብካቤ ይወጣል።",
    ),
  ],
  values: [
    {
      title: lt("Cooked slowly", "በዝግታ የተቀመጠ"),
      text: lt(
        "Our wats simmer for hours in seasoned clay, just as they have for generations.",
        "ወጦቻችን በተሞላ በሸክላ ለሰዓታት ይቀመጣሉ፣ ለትውልድ የተደረገውን ባህል እንደሚከተል ይቀመጣሉ።",
      ),
    },
    {
      title: lt("Brewed in-house", "በቤት ውስጥ የተጠመቀ"),
      text: lt(
        "We ferment our own tela and tej — never bought, always fresh from the pot.",
        "ተላንና ጠጅን በእኛ ቤት እናጠማቅቃለን — ከውጭ አንገዝም፣ ሁልጊዜ ከሸክላ ጠረጴዛ በቅርብ ይወጣል።",
      ),
    },
    {
      title: lt("Honest ingredients", "ቅን ውጤቶች"),
      text: lt(
        "Stone-ground spices, fresh produce and no shortcuts. Many dishes are fully vegan.",
        "በድንጋይ የተፈጨ ጠቅላላ ምግቦች፣ ትኩስ ምርቶች እና አጭር መንገድ የለም። ብዙ ምግቦች ሙሉ በሙሉ ከሥጋ ነፃ ናቸው።",
      ),
    },
    {
      title: lt("Genuine hospitality", "እውነተኛ መከበር"),
      text: lt(
        "You are welcomed as family. Sharing food is the whole point.",
        "እንደ ቤተሰብ ትቀበላለህ። ምግብን ማካፈል ሁሉም ነገር ነው።",
      ),
    },
  ],
  milestones: [
    {
      year: "2011",
      text: lt(
        "Senay Tela opens its doors with a single clay pot and a family recipe book.",
        "ሰናይ ተላ በአንድ ሸክላ ፈሳሽ እና በቤተሰብ የምግብ አዘገጃጀት መጽሐፍ በሮቱን ከፈተች።",
      ),
    },
    {
      year: "2016",
      text: lt(
        "We begin brewing our own tela and tej, becoming a neighbourhood favourite.",
        "ተላንና ጠጅን በቤት መጠመቅ ጀመርን፣ በአካባቢው ተወዳጅ ሆነን።",
      ),
    },
    {
      year: "2020",
      text: lt(
        "Our catering service launches, serving weddings and holidays across Addis.",
        "የካትሪንግ አገልግሎታችን ጀመረ፣ በአዲስ አበባ ሙሽራዎችን እና በዓላትን እናገልግላለን።",
      ),
    },
    {
      year: "Today",
      text: lt(
        "We bring tradition to your table — in the restaurant, at home, and at your events.",
        "ባህልን ወደ ማዕዘንዎ እናመጣለን — በሬስቶራን፣ በቤት እና በዝግጅቶችዎ ላይ።",
      ),
    },
  ],
};

await prisma.siteSetting.upsert({
  where: { key: "page:about" },
  create: { key: "page:about", value: deepNormalizeLocalizedTree(content) as object },
  update: { value: deepNormalizeLocalizedTree(content) as object },
});

console.log("Updated page:about with EN/AM content.");
await prisma.$disconnect();
