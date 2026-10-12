# Seven-Segment Type

This library provides functionality for displaying text on seven-segment display panels.
It makes use of a standardized typeface that currently covers the following characters:

- **Numerals**
- **Punctuation**
- **Alphabets** (both uppercase and lowercase):
  - **Latin alphabet**, including many supplemental characters and diacritics
  - **Greek alphabet**, including some accented characters
  - **Cyrillic alphabet**, including some supplemental characters
  - **Gothic alphabet**
- **Japanese Katakana**, with mappings from Hiragana
- **Korean Hangul Jamo**

Locales can be specified to improve the mapping of characters, particularly diacritics.
For example, for the German ('de') locale, the characters Ä, Ö and Ü
are mapped to AE, OE and UE, but by default to A, O and U.

[Development page with all the characters](https://2sh.github.io/seven-segment-type/)

## Usage

```js
const sst = new SevenSegmentType()

const text = "Text to be displayed"
const displayLine = sst.convert(text)

// String to be rendered with the DSEG font
const stringOutput = displayLine.toDsegString()

// Formats useful for feeding to seven segment displays
const byteArray = displayLine.toBytes()
const pinsLine = displayLine.toPinsArray({
  // if some other pin mapping is more convenient
  pinMap: [0,6,2,4,3,5,1,7]
})

// Automatically add soft hyphens using the hyphen NPM package
const hyphenatedMultiLineText = hyphenate(multiLineText)
// Wrapping the text for a panel with a width of 24 seven-segment displays
sst.convert(hyphenatedMultiLineText).wrap({length: 24}).forEach(line =>
{
  line.toBytes()
})
// Wrapping takes into account spaces, newline and soft/hard hyphenation characters

// English doesn't require this, but for various other locales,
// either set them in the instance:
const sstMultiLang = new SevenSegmentType({
  // Note Ü would map to UE even in French text
  mods: ['fr', 'it', 'de']
})

// or during the conversion:
const deText = "Öffentlich text anzeigen." // Ö becomes Oe
const deDisplayLine = sst.convert(text, { mods: ['de'] })
```

The font to use is [DSEG font v0.50beta1](https://github.com/keshikan/DSEG/releases/tag/v0.50beta1). The current NPM stable release does not include the
correct structure for displaying the characters programmatically.

## Stylistic Choice

- Characters are allowed to look the same as the numerals.
- **Lowercase letters** are generally designed to have more weight in
  the lower 4 segments and to never have the upper 4 segments all lit
  at once,
  ensuring a distinct visual difference from uppercase letters.
  This may require the "invention" of some new characters, which may take
  some time to become familiar with and read fluently at first.
- **Uppercase and lowercase letters** should ideally all be distinct
  from one another.
- Aside from its numerical usage, the **decimal point (DP)**
  is used to mark unknown characters or variations of diacritics or letters.
  However, it should be used sparingly as some displays might not
  include it.

## Help required

Potential areas for improvement:

- **Languages using the Latin alphabet with diacritics**
- **Greek**
- **Languages using Cyrillic**
- **Hiragana** (Maybe)
- **Korean**
- **Any other writing systems**

This project needs contributors who are native speakers or highly
familiar with the languages being worked on as it's important to have a strong sense of how words in these languages are meant to look.
This helps determine whether they remain visually recognizable and
aesthetically pleasing on seven-segment displays.

Many diacritics map to the same seven-segment characters, so adjustments
may be necessary for each language to better differentiate them.

Don't hesitate to [suggest](https://github.com/2sh/seven-segment-type/discussions) major changes, as this project is still very
much a work in progress.

## Development

### Dev Web View

To view all the characters in use on a web page, run:

```sh
yarn dev
```

### Build

To build the library, run:

```sh
yarn build
```
