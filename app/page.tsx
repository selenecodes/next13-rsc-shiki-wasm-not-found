import fs from 'graceful-fs'
import { parseMarkdown } from "../markdown.plugin";

export default async function Page() {
    const mdString = fs.readFileSync('./content/test.md', 'utf8')
    console.log(mdString)
    const html = await parseMarkdown(mdString);
    return (
      <div
        className="prose-zinc prose dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
}
