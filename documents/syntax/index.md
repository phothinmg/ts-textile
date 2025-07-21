---
title: Textile Syntax Guides
group: Documents
category: Syntax
children:
    - ./block.md
---

_In this guide, the Textile syntax that can be parsed to HTML by this package does not include all of the Textile Syntax._

For more about Textile syntax visit [here][textile-web] .

## An overview of the Textile syntax

### Block formatting

Textile processes text in units of blocks of text, which are separated by `a blank line`. 

Paragraphs are the default block type, therefore `<p>…</p>` tags are added to plain text blocks. In order to identify special types of text blocks, a block signature is used. Block signatures are one to three characters terminated by a period, and are placed at the beginning of a text block.

**_Text Blocks_**

- `p.` a paragraph (default)
- `h1. – h6.` a heading from level 1 to 6
- `pre.` pre-formatted text
- `bc.` a block of lines of code
- `bq.` a quotation block
- `###.` a comment block
- `notextile.` no formatting (override Textile)


### Formatting modifiers

Some block signatures accept formatting modifiers, also for CSS or language specification. They include:

- `(` adds 1em of padding to the left for each `(` character used
- `)` adds 1em of padding to the right for each `)` character used
- `<` aligns to the left (floats to left for tables if combined with the `)` modifier)
- `>` aligns to the right (floats to right for tables if combined with the `(` modifier)
- `=` aligns to center ( sets left, right margins to `auto` for tables )
- `<>`justifies text alignment
- `{style rule}` a CSS style rule
- `[language]` a language identifier (for a `lang` attribute)
- `(class)` or `(#id)` or `(class #id)` for CSS `class` and/or `id` attributes


### Inline formatting

Within a text block, any portion of the text can be modified by inline formatting signatures. They include:

- `*strong*` translates into `<strong>strong</strong>`
- `_emphasis_` translates into `<em>emphasis</em>`
- `**bold**` translates into `<b>bold</b>`
- `__italics__` translates into `<i>italics</i>`
- `-deleted text-` translates into `<del>deleted text</del>`
- `+inserted text+` translates into `<ins>inserted text</ins>`
- `^superscript^` translates into `<sup>superscript </sup>`
- `~subscript~` translates into `<sub>subscript</sub>`
- `??citation??` translates into `<cite>citation</cite>`
- `%span%` translates into `<span>span</span>`
- `@code@` translates into `<code>code</code>`









<!-- Definition -->
[textile-web]: https://textile-lang.com/