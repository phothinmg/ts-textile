export interface MatterResult<T = Record<string, any>> {
  data?: T;
  content?: string;
}

/**
 * Parse a given string of source text into a "matter" object and the remaining
 * content. The "matter" object is a JSON object containing key-value pairs of
 * the metadata in the source text, and the content is the remaining text after
 * the metadata.
 *
 * The source text is expected to be in the format of a YAML front-matter
 * block, which is a block of key-value pairs of metadata, separated by
 * line breaks, and bounded by triple hyphens (`---`) on either side.
 *
 * If the source text does not contain a valid YAML front-matter block, then
 * the function will return an object containing the given source text as the
 * content, and an empty object as the data.
 *
 * @param str - The source string to be parsed, containing the metadata and
 *              the content.
 *
 * @returns An object containing the parsed metadata as the data property,
 *          and the remaining content as the content property.
 */
export function matter<T extends Record<string, any> = Record<string, any>>(
  str: string
): MatterResult<T> {
  const re =
    /^(---\r?\n(?<matterData>[\s\S]*?)\r?\n---\r?\n)(?<bodyContent>[\s\S]*)$/;
  const m = str.match(re);

  if (!m?.groups) {
    return { content: str };
  }

  const { matterData, bodyContent } = m.groups;
  const data = {} as T;

  if (matterData) {
    for (const line of matterData.split(/\r?\n/)) {
      const idx = line.indexOf(":");
      if (idx !== -1) {
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (key) {
          (data as any)[key] = value;
        }
      }
    }
  }

  return { data, content: bodyContent };
}
