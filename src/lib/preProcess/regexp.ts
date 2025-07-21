export const StateARegexp = {
	alignRe: /^(<>|<|>|=|~|\^|-)/,
	classIdRe: /^\(([^()\n]+)\)/,
	styleRe: /^\{([^}]*)\}/,
	langRe: /^\[([^[\]\n]+)\]/,
	cssRe: /^\s*([^:\s]+)\s*:\s*(.+)\s*$/,
	links: {
		link: /^"(?!\s)((?:[^"]|"(?![\s:])[^\n"]+"(?!:))+)":((?:[^\s()]|\([^\s()]+\)|[()])+?)(?=[!-.:-@[\\\]-`{-~]+(?:$|\s)|$|\s)/,
		/**
		 * m[1] = data , m[2] = href , m[3] = foot note ref or note#
		 */
		fenced: /^\["([^\n]+?)":((?:\[[a-z0-9]*\]|[^\]])+)\](.*)/,
		title: /\s*\(((?:\([^()]*\)|[^()])+)\)$/,
		reference: /^\[([^\]]+)\]((?:https?:\/\/|\/|\.\/|#)\S+)(?:\s*\n|$)/,
		/**
		 * m[1] = attrs , m[2] = img src, m[3] = (alt),m[4] = link href
		 */
		image:
			/^!((?:>|<|<>|=|\([^)]*\)|\{[^}]*\}|\[[^\]]*\])*)((?:https?:\/\/|\/|\.\/)?\S+?)(\([^)]*\))?!:((?:https?:\/\/|\/|\.\/|#)\S+)/,
	},
	/** 
 * Regular Expression for Blocks signature of `Textile Syntax`
 * 
 {@see https://regex101.com/r/lWUVsx/3 }
 */
	blocks: /^(b[cq]|notextile|pre|h[1-6]|p|###)([^.]*)(\.\.|\.)?\s*(.*)$/m,
	images: {
		image:
			/^!(?!\s)((?:\([^)]+\)|\{[^}]+\}|\[[^[\]]+\]|(?:<>|<|>|=)|[()]+)*(?:\.[^\n\S]|\.(?:[^./]))?)([^!\s]+?) ?(?:\(((?:[^()]|\([^()]+\))+)\))?!(?::([^\s]+?(?=[!-.:-@[\\\]-`{-~](?:$|\s)|\s|$)))?/,
	},
	/**
   * To match and capture all attribute groups—parentheses `(…)`, braces `{…}`, and brackets `[…]`—after the marker (`*` or `#`), use this regex:

    ```js
    /^(\#+|\*+)((?:\([^\)]*\)|\{[^}]*\}|\[[^\]]*\])*)\s+(.*)/
    ```

    - `((?:\([^\)]*\)|\{[^}]*\}|\[[^\]]*\])*)` matches zero or more of any attribute group: `(…)`, `{…}`, or `[…]`.
    - This will capture all attribute groups together in one string (e.g., `"(foo){color:blue}[fr]"`).

    **Example usage:**
    ```js
    const re = /^(\#+|\*+)((?:\([^\)]*\)|\{[^}]*\}|\[[^\]]*\])*)\s+(.*)/;
    console.log(re.exec("*(foo){color:blue}[fr] Item 1"));
    // Output: [ '*(foo){color:blue}[fr] Item 1', '*', '(foo){color:blue}[fr]', 'Item 1' ]
    ```

    **Summary:**  
    This regex will match and capture all attribute groups after the marker, including `()`, `{}`, and `[]`, as a single string.
   */
	lists: /^(#+|\*+)((?:\([^)]*\)|\{[^}]*\}|\[[^\]]*\])*)\s+(.*)/,
	definitionList: {
		/**
     * To ensure that the optional `=:` at the end is not included in `match[2]`, you should use a **non-greedy** match for the second capture group and anchor the optional `=:` (with optional whitespace) after it.

      The correct regex:

      ```js
      /^-\s+(.*)\s+:=(.*?)(?:\s*=:\s*)?$/
      ```

      - `.*?` makes the second group non-greedy, so it stops matching at the first `=:` (if present).
      - `(?:\s*=:\s*)?` matches an optional `=:` with optional surrounding whitespace, but does not capture it.

      **Example:**
      ```js
      const re = /^-\s+(.*)\s+:=(.*?)(?:\s*=:\s*)?$/;
      console.log(re.exec("- HTML := HyperText Markup Language, based on SGML. =:"));
      // match[1]: "HTML"
      // match[2]: "HyperText Markup Language, based on SGML."
      console.log(re.exec("- HTML := HyperText Markup Language, based on SGML."));
      // match[1]: "HTML"
      // match[2]: "HyperText Markup Language, based on SGML."
      ```

      **Summary:**  
      Use `(?:\s*=:\s*)?` after a non-greedy `(.*?)` to keep `=:` out of the capture group.
     */
		list: /^-\s+(.*)\s+:=(.*?)(?:\s*=:\s*)?$/,
		// not start with `-` and end with `=:`
		endList: /^(?!-)(.*)=:$/,
		/**
     * dt and dd match for WikiMedia markup style definition lists:
     * 
     * ```text
     * ; HTML
       : HyperText Markup Language, based on SGML.
       ; XHTML
       : HTML 4.0 rewritten to be compliant with XML rules.
       ; HTML5
       : The latest revision of the HTML standard.
       : Still under development.
     * 
     * ```
     */
		dt: /^;(.*)$/,
		dd: /^:(.*)$/,
	},
	footNote: {
		/**
		 * To match `fn1` or `fn^`(A footnote with a back link)
		 * m[1] = foot-note number
		 * m[2] = `^` or undefined
		 * m[3] = footnote reference
		 */
		def: /^fn(\d+)(\^)?\.\s*(.*)\s*$/,
		// TODO inline footnote reference
	},
	noteList: /^note#(\w*\d*)(\^|!|\*)?\.\s*(.*)\s*$/,
	table: {
		table:
			/^((?:table(?:\([^)]+\)|\{[^}]+\}|\[[^[\]]+\]|(?:<>|<|>|=)|[()]+)*\.(?:\s([^\0]+?))\s*\n)?(?:(?:(?:\([^)]+\)|\{[^}]+\}|\[[^[\]]+\]|(?:<>|<|>|=)|[()]+)*\.[^\n\S]*)?\|[^\0]*?\|[^\n\S]*(?:\n|$))+)([^\n\S]*\n+)?/,
		head: /^table(_?)([^\n]*?)\.(?:[ \t](.+?))?\s*\n/,
		caption: /^\|=([^\n+]*)\n/,
		colGroup: /^\|:([^\n+]*)\|[\r\t ]*\n/,
		rowGroup: /^\|([\^\-~])([^\n+]*)\.[ \t\r]*\n/,
		row: /^(?:\|([~^-](?:\([^)]+\)|\{[^}]+\}|\[[^[\]]+\]|(?:<>|<|>|=)|[()]+)*)\.\s*\n)?((?:\([^)]+\)|\{[^}]+\}|\[[^[\]]+\]|(?:<>|<|>|=)|[()]+)*\.[^\n\S]*)?\|([^\0]*?)\|[^\n\S]*(\n|$)/,
		rowSpan: /^\/(\d+)/,
		colSpan: /^\\(\d+)/,
		blocks: /^table([^.]*)\s*(.*)$/,
	},
	html: {
		tag: /^<([a-zA-Z][a-zA-Z\d:]*)((?:\s[^=\s/]+(?:\s*=\s*(?:"[^"]+"|'[^']+'|[^>\s]+))?)+)?\s*(\/?)>/,
		endTag: /^<\/([a-zA-Z][a-zA-Z\d:]*)([^>]*)>/,
		tagBlock:
			/^\s*<([a-zA-Z][a-zA-Z\d:]*(?::[a-zA-Z\d]+)*)((?:\s[^=\s/]+(?:\s*=\s*(?:"[^"]+"|'[^']+'|[^>\s]+))?)+)?\s*(\/?)>/,
	},
};
