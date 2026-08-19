import type { MDXComponents } from "mdx/types";
import { DemoSlot } from "@/components/mdx/DemoSlot";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    a: ({ children, ...props }) => <a {...props}>{children}</a>,
    DemoSlot,
    ...components,
  };
}
