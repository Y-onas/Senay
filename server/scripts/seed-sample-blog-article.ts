import { prisma } from "../src/lib/prisma.js";

const slug = "celebrating-success-together";

const blocks = [
  {
    id: "intro-1",
    type: "paragraph",
    text: "Success is never achieved by one person alone. Behind every memorable meal, every successful catering event, and every satisfied customer is a dedicated team working together with passion and commitment.",
  },
  {
    id: "intro-2",
    type: "paragraph",
    text: "To celebrate another successful milestone, Senay Restaurant & Catering decided to do something special. Instead of serving customers for the day, the restaurant temporarily closed its doors to celebrate the people who made that success possible—its team.",
  },
  {
    id: "intro-3",
    type: "paragraph",
    text: "The day began with warm speeches, laughter, and words of appreciation. Management thanked every employee for their dedication, teamwork, and commitment to delivering exceptional service throughout the year.",
  },
  {
    id: "heading-1",
    type: "heading",
    level: 2,
    text: "A Sweet Celebration",
  },
  {
    id: "section-1-text",
    type: "paragraph",
    text: "The highlight of the event was the cake-cutting ceremony. It symbolized not only another successful year but also the strong relationships built within the team. Every employee gathered together to celebrate the journey and look forward to even greater achievements.",
  },
  {
    id: "section-1-image",
    type: "image",
    url: "/images/blog/cake-cutting-ceremony.png",
    caption: "The team gathers for the cake-cutting ceremony",
    layout: "wide",
  },
  {
    id: "heading-2",
    type: "heading",
    level: 2,
    text: "Friends Beyond the Workplace",
  },
  {
    id: "section-2-text",
    type: "paragraph",
    text: "The celebration continued with memorable moments shared among colleagues who have become close friends. Beyond working together every day, they have built lasting relationships founded on trust, respect, and teamwork.",
  },
  {
    id: "section-2-image",
    type: "image",
    url: "/images/blog/senay-with-friends.png",
    caption: "Senay with colleagues who have become close friends",
    layout: "default",
  },
  {
    id: "heading-3",
    type: "heading",
    level: 2,
    text: "One Team, One Family",
  },
  {
    id: "section-3-text",
    type: "paragraph",
    text: "The day concluded with a group photograph capturing everyone who contributes to the success of Senay Restaurant & Catering. It serves as a reminder that every achievement is the result of collaboration, dedication, and a shared commitment to excellence.",
  },
  {
    id: "section-3-image",
    type: "image",
    url: "/images/blog/team-group-photo.png",
    caption: "The Senay Restaurant & Catering team together",
    layout: "full",
  },
  {
    id: "closing",
    type: "paragraph",
    text: "The restaurant looks forward to continuing this journey together while creating unforgettable experiences for every customer.",
  },
];

const content = blocks
  .filter((block) => block.type === "paragraph")
  .map((block) => block.text);

await prisma.blogPost.upsert({
  where: { slug },
  create: {
    slug,
    title: "Celebrating Success Together: A Day of Gratitude at Senay Restaurant & Catering",
    excerpt:
      "Senay Restaurant & Catering closed for a day to celebrate the team whose dedication makes every meal and event memorable.",
    content,
    blocks,
    image: "/images/blog/senay-celebration-cake.png",
    author: "Senay Tela",
    publishedAt: new Date("2026-03-15"),
    readTime: "5 min",
    tags: ["team", "culture", "celebration"],
    seoTitle: "Celebrating Success Together | Senay Restaurant & Catering",
    seoDescription:
      "How Senay Restaurant & Catering paused service for a day to thank the team behind every successful meal and event.",
    published: true,
  },
  update: {
    title: "Celebrating Success Together: A Day of Gratitude at Senay Restaurant & Catering",
    excerpt:
      "Senay Restaurant & Catering closed for a day to celebrate the team whose dedication makes every meal and event memorable.",
    content,
    blocks,
    image: "/images/blog/senay-celebration-cake.png",
    author: "Senay Tela",
    readTime: "5 min",
    tags: ["team", "culture", "celebration"],
    seoTitle: "Celebrating Success Together | Senay Restaurant & Catering",
    seoDescription:
      "How Senay Restaurant & Catering paused service for a day to thank the team behind every successful meal and event.",
    published: true,
  },
});

console.log("Sample blog article seeded.");
await prisma.$disconnect();
