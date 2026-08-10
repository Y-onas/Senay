import { prisma } from "../src/lib/prisma.js";
import { blogBlockSchema, normalizeBlocks } from "../src/lib/blogBlocks.js";

const post = await prisma.blogPost.findUnique({
  where: { slug: "celebrating-success-together" },
});

const parsed = blogBlockSchema.array().safeParse(post?.blocks);
console.log("parse ok:", parsed.success);
if (!parsed.success) console.log(parsed.error.flatten());

console.log("blocks type:", typeof post?.blocks, Array.isArray(post?.blocks));
console.log("raw blocks length:", Array.isArray(post?.blocks) ? post.blocks.length : 0);
console.log("normalized length:", normalizeBlocks(post?.blocks, post?.content ?? []).length);
console.log("types:", normalizeBlocks(post?.blocks, post?.content ?? []).map((b) => b.type));

await prisma.$disconnect();
