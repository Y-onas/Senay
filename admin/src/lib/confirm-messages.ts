/**
 * Shared confirmation copy for admin destructive actions.
 * Used by the live admin bundle via admin-confirm.js; keep messages in sync when editing.
 */
export const ADMIN_CONFIRM = {
  deleteBlock: {
    title: "Delete this block?",
    description: "This block will be removed from the page. This cannot be undone.",
    confirmLabel: "Delete block",
  },
  deleteFaq: {
    title: "Delete FAQ?",
    description: "This question and answer will be permanently removed from the site.",
    confirmLabel: "Delete FAQ",
  },
  rejectTestimonial: {
    title: "Reject guest review?",
    description: "This review will be hidden from the website.",
    confirmLabel: "Reject review",
  },
  deleteTestimonial: {
    title: "Delete testimonial?",
    description: "This testimonial will be permanently removed.",
    confirmLabel: "Delete testimonial",
  },
  deleteNavigation: {
    title: "Delete navigation link?",
    description: "This menu link will be removed from the site header.",
    confirmLabel: "Delete link",
  },
  deleteMenuItem: {
    title: "Delete menu item?",
    description: "This dish will be removed from the menu.",
    confirmLabel: "Delete item",
  },
  deleteArticle: {
    title: "Delete article?",
    description: "This blog post will be permanently removed.",
    confirmLabel: "Delete article",
  },
  deleteAnnouncement: {
    title: "Delete announcement?",
    description: "This site-wide banner will be removed.",
    confirmLabel: "Delete announcement",
  },
  deleteMessage: {
    title: "Delete message?",
    description: "This contact message will be permanently removed.",
    confirmLabel: "Delete message",
  },
  removeAdmin: (email: string) => ({
    title: "Remove admin access?",
    description: `${email} will no longer be able to sign in to the admin panel.`,
    confirmLabel: "Remove access",
  }),
  deleteCatalogItem: {
    title: "Delete catalog item?",
    description: "This product or package will be permanently removed from the service.",
    confirmLabel: "Delete item",
  },
  deleteMedia: {
    title: "Delete media file?",
    description:
      "This file will be removed from the media library. Content still using this URL may show broken images.",
    confirmLabel: "Delete file",
  },
  importPublicImages: {
    title: "Import public images?",
    description:
      "Upload all images from public/images to Cloudinary and update existing content URLs. This may take a minute.",
    confirmLabel: "Start import",
    variant: "default" as const,
  },
} as const;

export type AdminConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
};

declare global {
  interface Window {
    adminConfirm?: (options: AdminConfirmOptions) => Promise<boolean>;
  }
}

export async function confirmAdminAction(options: AdminConfirmOptions): Promise<boolean> {
  if (typeof window !== "undefined" && window.adminConfirm) {
    return window.adminConfirm(options);
  }
  const message = [options.title, options.description].filter(Boolean).join("\n\n");
  return window.confirm(message);
}
