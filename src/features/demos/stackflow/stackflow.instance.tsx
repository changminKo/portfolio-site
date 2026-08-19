import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { stackflow } from "@stackflow/react";
import { BookActivity } from "./BookActivity";
import { ReaderActivity } from "./ReaderActivity";
import { ShelfActivity } from "./ShelfActivity";
import { stackflowConfig } from "./stackflow.config";

export const { Stack } = stackflow({
  config: stackflowConfig,
  components: { Shelf: ShelfActivity, Book: BookActivity, Reader: ReaderActivity },
  plugins: [basicRendererPlugin(), basicUIPlugin({ theme: "cupertino" })],
});
