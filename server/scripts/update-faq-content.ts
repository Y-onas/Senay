import { prisma } from "../src/lib/prisma.js";
import { deepNormalizeLocalizedTree } from "../src/lib/i18nContent.js";

const lt = (en: string, am: string) => ({ en, am });

const faqItems = [
  {
    question: lt(
      "Do you deliver across Addis Ababa?",
      "በአዲስ አበባ ውስጥ ይላካሉ?",
    ),
    answer: lt(
      "Yes. We deliver tela, tej and take-home products across Addis Ababa, with pickup also available from our restaurant in Bole.",
      "አዎ። ተላ፣ ጠጅ እና ለማጸዳት ምርቶችን በአዲስ አበባ ውስጥ እናገልግላለን፣ ከቦሌ ያለው ሬስቶራንችን መጥተው ማምጣትም ይቻላል።",
    ),
  },
  {
    question: lt(
      "How far in advance should I book catering?",
      "ካትሪንግ ለመያዝ ከመቼ ጀምሮ መያዝ አለብኝ?",
    ),
    answer: lt(
      "For catering we recommend booking at least 48 hours in advance. For large events like weddings, a week or more lets us plan the perfect spread.",
      "ካትሪንግ ቢያንስ 48 ሰዓት በፊት መያዝ እንመክራለን። ለሙሽራዎች የመሳሰሉት ትላልቅ ዝግጅቶች አንድ ሳምንት ወይም ከዚያ በላይ ያስችላን ፍጹም ምግብ እንድንዘጋጅ።",
    ),
  },
  {
    question: lt(
      "Is your tela and tej brewed in-house?",
      "ተላና ጠጅ በቤት ውስጥ ይጠመቃሉ?",
    ),
    answer: lt(
      "Always. Our tela and tej are fermented in clay pots in our own kitchen using traditional methods — never bought in.",
      "ሁልጊዜ። ተላና ጠጅ በሸክላ ፈሳሽ በኩሽናችን በባህላዊ መንገድ እናጠማቅቃለን — ከውጭ አንገዝም።",
    ),
  },
  {
    question: lt(
      "Do you have vegan and fasting options?",
      "ከሥጋ ነፃ እና ጾም አማራጮች አሉ?",
    ),
    answer: lt(
      "Absolutely. Our beyaynetu and shiro are fully vegan, and we offer complete fasting spreads for events during fasting seasons.",
      "እርግጠኛ። በያይነቱና ሽሮ ሙሉ በሙሉ ከሥጋ ነፃ ናቸው፣ በጾም ጊዜ ለዝግጅቶች ሙሉ ጾም ምግቦችንም እናቀርባለን።",
    ),
  },
  {
    question: lt("Can I reserve a table?", "ጠረጴዛ መያዝ ይቻላል?"),
    answer: lt(
      "Yes — call us or use the contact page and we will hold a table for you, especially recommended on weekends.",
      "አዎ — ይደውሉልን ወይም የእውቂያ ገጹን ይጠቀሙ እና ጠረጴዛ እንይዝልዎታለን፣ በተለይ በሳምንት መጨረሻዎች ይመከራል።",
    ),
  },
];

const faqSectionContent = {
  eyebrow: lt("FAQ", "ጥያቄዎች"),
  title: lt("Questions? Answered.", "ጥያቄዎች? መልስ አለ!"),
  description: lt(
    "Got questions about ordering, catering or our brewing? Here are the answers our guests ask most.",
    "ስለ ትዕዛዝ፣ ካትሪንግ ወይም መጠመቃችን ጥያቄዎች አሉዎት? እንግዶቻችን ብዙ ጊዜ የሚጠይቁ መልሶች እነህን ነው።",
  ),
};

const existingFaqs = await prisma.faq.findMany({ orderBy: { sortOrder: "asc" } });

if (existingFaqs.length === faqItems.length) {
  for (let i = 0; i < faqItems.length; i++) {
    const item = faqItems[i];
    const row = existingFaqs[i];
    await prisma.faq.update({
      where: { id: row.id },
      data: {
        question: item.question.en,
        questionI18n: item.question,
        answer: item.answer.en,
        answerI18n: item.answer,
        sortOrder: i + 1,
        published: true,
      },
    });
  }
} else {
  await prisma.faq.deleteMany();
  for (const [i, item] of faqItems.entries()) {
    await prisma.faq.create({
      data: {
        question: item.question.en,
        questionI18n: item.question,
        answer: item.answer.en,
        answerI18n: item.answer,
        sortOrder: i + 1,
        published: true,
      },
    });
  }
}

const faqSection = await prisma.homeSection.findUnique({ where: { key: "faq" } });
if (faqSection) {
  await prisma.homeSection.update({
    where: { id: faqSection.id },
    data: {
      content: deepNormalizeLocalizedTree({
        ...((faqSection.content as object) ?? {}),
        ...faqSectionContent,
      }) as object,
    },
  });
}

console.log("Updated FAQs and home FAQ section with EN/AM content.");
await prisma.$disconnect();
