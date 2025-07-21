export interface MatterResult<T = Record<string, any>> {
  data?: T;
  content?: string;
}

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
