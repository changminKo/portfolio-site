import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { stackflow, type StackflowReactPlugin } from "@stackflow/react";
import { BookActivity } from "./BookActivity";
import { ReaderActivity } from "./ReaderActivity";
import { ShelfActivity } from "./ShelfActivity";
import { setStackflowStatus } from "./stackflow-status-store";
import { stackflowConfig } from "./stackflow.config";

function countActiveActivities(actions: { getStack: () => { activities: { exitedBy?: unknown }[] } }): number {
  return actions.getStack().activities.filter((activity) => !activity.exitedBy).length;
}

const stackflowStatusPlugin: StackflowReactPlugin<never> = () => ({
  key: "stackflow-status-plugin",
  onPushed({ actions }) {
    setStackflowStatus({ depth: countActiveActivities(actions), last: "push" });
  },
  onPopped({ actions }) {
    setStackflowStatus({ depth: countActiveActivities(actions), last: "pop" });
  },
});

export const { Stack } = stackflow({
  config: stackflowConfig,
  components: { Shelf: ShelfActivity, Book: BookActivity, Reader: ReaderActivity },
  plugins: [
    basicRendererPlugin(),
    basicUIPlugin({ theme: "cupertino", appBar: { backButton: { ariaLabel: "이전 화면으로" } } }),
    stackflowStatusPlugin,
  ],
});
