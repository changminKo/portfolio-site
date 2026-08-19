import createMDX from "@next/mdx";

// Turbopack은 loader 옵션을 직렬화하므로 remark 플러그인을 함수 참조가 아닌 이름으로 전달한다.
const withMDX = createMDX({ options: { remarkPlugins: [["remark-frontmatter", "yaml"]] } });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  turbopack: {
    root: process.cwd(),
  },
};

export default withMDX(nextConfig);
