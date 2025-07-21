import { bc } from "./bc.js";
import { matter } from "./matter.js";

export function preProcessedString<T extends Record<string, any>>(str: string) {
  let { data, content } = matter<T>(str);
  content = bc(content);
  return { data, content };
}
