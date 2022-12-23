import rehypePrettyCode from "rehype-pretty-code";
import { join as pathJoin } from "path";
import * as shiki from "shiki";
import fs from "graceful-fs";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import remark2rehype from "remark-rehype";
import { unified } from "unified";

export async function parseMarkdown(markdown) {
  // const res = remark.parse(markdown)
  // remark.p
  // return res
  const builder = unified();

  // parses out the frontmatter (which is needed for full-document parsing)
  builder.use(remarkFrontmatter);

  // parse markdown
  builder.use(remarkParse);
  builder.use(remark2rehype);

  if (rehypePlugins.length) {
    builder.use(rehypePlugins as any);
  }

  // rehype to html
  builder.use(rehypeStringify);
  const res = await builder.process(markdown);
  return res.toString();
}

// Shiki loads languages and themes using "fs" instead of "import", so Next.js
// doesn't bundle them into production build. To work around, we manually copy
// them over to our source code (lib/shiki/*) and update the "paths".
//
// Note that they are only referenced on server side
// See: https://github.com/shikijs/shiki/issues/138
const getShikiPath = () => {
  return pathJoin(process.cwd(), "lib/mdx/shiki");
};

const touched = { current: false };

// "Touch" the shiki assets so that Vercel will include them in the production
// bundle. This is required because shiki itself dynamically access these files,
// so Vercel doesn't know about them by default
const touchShikiPath = () => {
  if (touched.current) return; // only need to do once
  fs.readdir(getShikiPath()); // fire and forget
  touched.current = true;
};

const getHighlighter = async (options) => {
  touchShikiPath();

  const highlighter = await shiki.getHighlighter({
    // This is technically not compatible with shiki's interface but
    // necessary for rehype-pretty-code to work
    // - https://rehype-pretty-code.netlify.app/ (see Custom Highlighter)
    ...options,
    paths: {
      wasm: `${getShikiPath()}/onig.wasm`,
      languages: `${getShikiPath()}/languages/`,
      themes: `${getShikiPath()}/themes/`,
    },
  });

  return highlighter;
};

export const rehypePlugins = [
  [
    rehypePrettyCode,
    {
      theme: "github-dark",
      getHighlighter,
      onVisitLine(node) {
        // Prevent lines from collapsing in `display: grid` mode, and allow empty
        // lines to be copy/pasted
        if (node.children.length === 0) {
          node.children = [{ type: "text", value: " " }];
        }
      },
      onVisitHighlightedLine(node) {
        node.properties.className.push("line--highlighted");
      },
      onVisitHighlightedWord(node) {
        node.properties.className = ["word--highlighted"];
      },
    },
  ],
];
