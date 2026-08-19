import createMDX from "@next/mdx";
import remarkFrontmatter from "remark-frontmatter";

const withMDX = createMDX({ options: { remarkPlugins: [remarkFrontmatter] } });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  turbopack: {
    root: process.cwd(),
  },
};

export default withMDX(nextConfig);
