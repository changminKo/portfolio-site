import { defineConfig } from "@stackflow/config";

declare module "@stackflow/config" {
  interface Register {
    Shelf: Record<string, never>;
    Book: { bookId: string; title: string };
    Reader: { bookId: string; title: string };
  }
}

export const stackflowConfig = defineConfig({
  activities: [{ name: "Shelf" }, { name: "Book" }, { name: "Reader" }],
  initialActivity: () => "Shelf",
  transitionDuration: 350,
});
