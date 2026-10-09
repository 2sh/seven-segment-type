/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * A library to display text on 7 segment displays.
 *
 * @packageDocumentation
 */

import type {
  Char,
  CharVisible,
  FunctionOptions,
  InstanceOptions,
  Align,
  TextElement,
  TextGeneralOptions,
  TextStringOptions,
  TextStringSpecificOptions,
  VariationMap,
  WrapOptions,
  CharPin,
  Pins
} from "./types"

interface NormChar extends Char {
  pin?: VariationMap
}

type CharMap = { [key: string]: NormChar }

/*

    a
  f   b
    g
  e   c
    d

    abcdefgP
  0b........

*/

import segments from './chars/segments'
import punctuation from './chars/punctuation'
import diacritics from './chars/diacritics'
import numbers from './chars/numerals'
import latin from './chars/latin'
import cyrillic from './chars/cyrillic'
import greek from './chars/greek'
import gothic from './chars/gothic'
import cjkPunctuation from './chars/cjk_punctuation'
import japanese from './chars/japanese'
import korean from './chars/korean'

export const libChars: Char[] =
[
  ...segments,
	...punctuation,
	...diacritics,
	...numbers,
	...latin,
	...cyrillic,
	...greek,
  ...gothic,
	...cjkPunctuation,
	...japanese,
	...korean,
]

const decimalPoint = 0b00000001
const decimalPointModChar = "\0" // null

function escapeRegExp(string: string): string
{
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function bits2byte(bits: string): number
{
  return parseInt(bits, 2)
}

export function byte2bits(byte: number): string
{
  return byte.toString(2).padStart(8, "0")
}

function getVariation(varMap: VariationMap, varKeys: string[]): CharPin | null
{
  for (const key of varKeys)
  {
    if (typeof varMap[key] !== 'undefined')
      return varMap[key]
  }
  if (typeof varMap["_"] !== 'undefined')
    return varMap["_"]
  if (varKeys.includes("*"))
  {
    const found = Object.entries(varMap)[0]
    if (found) return found[1]
  }
  return null
}

function isLowerCase(str: string): boolean
{
  return str != str.toUpperCase()
}

function getNormalizedChr(str: string)
{
  return str.normalize("NFD")[0]
}

function orPinMap(a: number, b: number): number
{
  return a | b
}

function remap(pin: number, pinMap: Pins)
{
  const bits = byte2bits(pin)
  return pinMap.map(i => bits[i]).join("")
}

export function normalizeToPinMap(pin: CharPin | VariationMap | undefined):
  VariationMap | undefined
{
  if ((typeof pin == 'object' && !Array.isArray(pin))
    || typeof pin == 'undefined')
  {
    return pin
  }
  else
  {
    return { _: pin }
  }
}

type BreakCheck = (visible: CharVisible | undefined) => boolean

const isVisibleWithinLine: BreakCheck = (visible) =>
{
  return visible == 'hide-on-break' || typeof visible == 'undefined'
}

const isVisibleOnBreak: BreakCheck = (visible) =>
{
  return visible == 'show-on-break' || typeof visible == 'undefined'
}

function toSimpleChar(element: TextElement): TextElement
{
  return { pin: element.pin }
}

function blankFill(length: number): TextElement[]
{
  return Array(Math.max(length, 0)).fill({pin: '00000000'})
}

function alignLeft(line: TextElement[], length: number): TextElement[]
{
  return line.concat(blankFill(length - line.length))
}

function alignRight(line: TextElement[], length: number): TextElement[]
{
  return blankFill(length - line.length).concat(line)
}

function alignCenter(line: TextElement[], length: number): TextElement[]
{
  const remaining = length - line.length
  const left = Math.floor(remaining/2)
  const right = remaining - left
  return blankFill(left).concat(line, blankFill(right))
}

function trim(line: TextElement[]): [TextElement[], number, number]
{
  let l = 0
  let r = 0
  for(; l<line.length; l++)
    if (line[l]?.pin != 0b00000000) break
  for(; r<line.length-l; r++)
    if (line[line.length-r-1]?.pin != 0b00000000) break
  return [line.slice(l, line.length-r), l, r]
}

function splitInt(number: number, divisions: number): number[]
{
  if(divisions == 0) return []

  const minInt = Math.floor(number / divisions)
  const rem = number % divisions
  const c = divisions - rem

  let out: number[] = Array(divisions)
  let a = 1
  let b = 1

  for(let i = 0; i < divisions; i++)
  {
    if((a * rem) < (b * c))
    {
      a++
      out[i] = minInt
    }
    else
    {
      b++
      out[i] = minInt + 1
    }
  }

  return out
}

/*
UTF-16 aware splitting
*/
function splitStr(str: string)
{
  const arr = [];
  for (const char of str) {
    arr.push(char);
  }
  return arr;
}

function interleave<T>(...arrays: T[][]): T[]
{
  const out: T[] = []
  for (let i=0; i<Math.max(...arrays.map(a=>a.length)); i++)
  {
    arrays.forEach(array => {
      if (typeof array[i] != 'undefined') out.push(array[i]!)
    })
  }
  return out
}

function justify(line: TextElement[], length: number): TextElement[]
{
  const words: TextElement[][] = [[]]
  let charCount = 0

  const [trimmedLine, l, r] = trim(line)

  trimmedLine.forEach(e =>
  {
    if (e.pin == 0b00000000)
      words.push([])
    else
    {
      charCount += 1
      words[words.length-1]?.push(e)
    }
  })

  if (words.length < 2)
    return line // no change

  const remaining = (length - charCount) - l - r
  const blanks = splitInt(remaining, words.length-1).map(blankFill)
  return blankFill(l).concat(interleave(words, blanks).flat(), blankFill(r))
}

/**
 * An object containing the converted string with methods for outputting
 * into various convenient formats.
 */
export class SevenSegmentLine
{
  private elements: TextElement[]
  private properties: Required<TextGeneralOptions>
  constructor(elements: TextElement[])
  {
    this.elements = elements
    this.properties = {
      pinMap: null
    }
  }

  /**
   * Split the seven segment line into fixed width lines for outputting
   * to panels.
   *
   * Takes into account soft and line break characters and whether they
   * are still visible on break or hidden on break.
   *
   * Examples of soft and line breaks and their visibility:
   * soft break:
   *   space: hide on break
   *   soft-hyphen: show on break
   *   hard-hyphen: always shown
   *   zero-width space: never shown
   * line break:
   *   new line: hide on break
   *
   * @param options - Optional parameters.
   * @returns An array of strings
   */
  public wrap(options: WrapOptions): SevenSegmentLine[]
  {
    const opts: Required<WrapOptions> =
    {
      length: 24,
      align: 'left',
      justify: false,
      justifyLastLine: false,
      breakWordAnywhere: false,
      breakPin: 0b00000010,
      limit: null,
      ...options,
    }

    if (opts.limit == 0) return []
    if (opts.limit == 1) return [this]

    const lines: TextElement[][] = []
    let line: TextElement[] = []
    let part: TextElement[] = []
    let lineAlign: Align = opts.align
    let lineJustify: boolean = opts.justify

    let breakElement: TextElement | null = null

    function pushBreakElement(check: BreakCheck)
    {
      if (breakElement && check(breakElement.visible))
        line.push(toSimpleChar(breakElement))
      breakElement = null
    }

    function pushPart()
    {
      pushBreakElement(isVisibleWithinLine)
      line = line.concat(part)
      part = []
    }

    function pushLine(isHard = false)
    {
      pushBreakElement(isVisibleOnBreak)

      if ((opts.justifyLastLine || !isHard)
        && lineJustify)
      {
        line = justify(line, opts.length)
      }

      if (lineAlign == "left")
      {
        line = alignLeft(line, opts.length)
      }
      else if (lineAlign == "right")
      {
        line = alignRight(line, opts.length)
      }
      else if (lineAlign == "center")
      {
        line = alignCenter(line, opts.length)
      }

      lines.push(line)
      line = []
      lineAlign = opts.align
      lineJustify = opts.justify
    }

    const processElement = (el: TextElement, index: number) =>
    {
      const lineLength = line.length
        + (breakElement && isVisibleWithinLine(breakElement.visible) ? 1 : 0)
        + part.length

      if (el.align)
      {
        lineAlign = el.align
      }

      if (el.break)
      {
        if (isVisibleOnBreak(el.visible) && (lineLength + 1 > opts.length))
          pushLine() // line with break char would exceed max length
        pushPart()
        breakElement = el
        if (el.break == "line")
          pushLine(true)
      }
      else if (el.visible != 'never')
      {
        if (lineLength + 1 > opts.length)
        {
          if (line.length == 0)
            pushPart() // part exceeds max length
          pushLine()
        }
        part.push(el)

        const oneAhead = this.elements[index+1]
        if (opts.breakWordAnywhere
          && lineLength + 3 > opts.length
          && oneAhead && !oneAhead.break)
        {
          if (oneAhead.pin == 0b00000000
             || oneAhead.pin == opts.breakPin)
            oneAhead.break = "soft"
          else
          {
            if (opts.breakPin)
              processElement({ pin: opts.breakPin,
                break: 'soft', visible: 'show-on-break' }, index)
            else
            processElement({ pin: 0b00000000,
              break: 'soft', visible: 'never' }, index)
          }
        }
      }
    }

    this.elements.forEach((el, index) =>
    {
      if (opts.limit !== null && lines.length >= opts.limit-1)
      {
        part.push(el)
      }
      else
      {
        processElement(el, index)
      }
    })
    pushPart()
    if (line.length) pushLine(true)
    return lines.map(line => new SevenSegmentLine(line))
  }

  private getFilteredElements(): TextElement[]
  {
    return this.elements
      .filter(el => el.visible != 'never'
        && el.visible != 'show-on-break')
  }

  /**
   * Output an array of strings representing the 8 segments
   * as '1' or '0'.
   * @param options - Optional parameters.
   * @returns An array of strings
   */
  public toPinsArray(options?: TextGeneralOptions): string[]
  {
    const opts: Required<TextGeneralOptions> = {
      ...this.properties,
      ...options,
    }
    return this.getFilteredElements().map(el =>
    {
      return opts.pinMap
        ? remap(el.pin, opts.pinMap)
        : byte2bits(el.pin)
    })
  }

  /**
   * Output an array of bytes, a compact format for
   * data tranfer.
   * @param options - Optional parameters.
   * @returns An array of bytes
   */
  public toBytes(options?: TextGeneralOptions): number[]
  {
    const opts: Required<TextGeneralOptions> = {
      ...this.properties,
      ...options,
    }
    return this.getFilteredElements().map(el =>
    {
      return opts.pinMap
        ? bits2byte(remap(el.pin, opts.pinMap))
        : el.pin
    })
  }

  /**
   * Output a string of bytes.
   * @param options - Optional parameters.
   * @returns A string of bytes
   */
  public toString(options?: TextStringOptions): string
  {
    const opts: Required<TextStringSpecificOptions> = {
      startCharCode: 0,
      ...options,
    }
    const bytes = this.toBytes(options)
    const chars: string[] = []
    for (let i=0; i<bytes.length; i++)
    {
      chars.push(String.fromCharCode(opts.startCharCode + bytes[i]!))
    }
    return chars.join("")
  }

  /**
   * Output a string for displaying using the DSEG 7-segment
   * font (at least v0.5beta1:
   * https://github.com/keshikan/DSEG/releases/tag/v0.50beta1)
   * @param options - Optional parameters.
   * @returns A string of bytes
   */
  public toDsegString(options?: TextStringOptions): string
  {
    return this.toString({
      pinMap: [7,6,5,4,3,2,1,0],
      startCharCode: 0x2800,
      ...options,
    })
  }
}

/**
 * The class from which to create a `SevenSegmentType` instance for
 * converting text to display on 7 segment displays.
 */
export default class SevenSegmentType
{
  /**
   * The properties of the class, set by the options of the constructor.
   */
  private properties: Required<InstanceOptions>
  /**
   * The processed character mapping.
   */
  private charMap: CharMap

  /**
   * The constructor of the `SevenSegmentType` class.
   * @param options - Optional parameters.
   */
  constructor(options?: InstanceOptions)
  {
    this.properties =
    {
      characters: libChars,
      mods: [],
      enhanceNumbers: true,
      numberPattern: "[0-9↊↋]",
      numberDecimalSeparatorPattern: "\\.",
      numberGroupSeparatorPattern: ",",
      ...options,
    }

    this.charMap = Object.fromEntries(
      this.properties.characters.map(char => [char.chr,
      {
        ...char,
        pin: normalizeToPinMap(char.pin)
      }]))
  }

  /**
   * Convert a string to a seven segment line object.
   * @param text - The text to convert.
   * @param options - Instance properties to adjust.
   * @returns An instance of the
   *   {@link SevenSegmentLine | `SevenSegmentLine`} class.
   */
  public convert(text: string, options?: FunctionOptions): SevenSegmentLine
  {
    const opts: Required<InstanceOptions> =
    {
      ...this.properties,
      ...options
    }
    const mods = options && options.mods
      ? this.properties.mods.concat(options.mods)
      : this.properties.mods

    if (opts.enhanceNumbers)
    {
      const d = opts.numberPattern
      const p = opts.numberDecimalSeparatorPattern
      const g = opts.numberGroupSeparatorPattern
      const np = `${d}|${p}|${g}`

      const reNumber = new RegExp(
          `(?<!${np})`
        + `(${d}{1,3}(${g}${d}{3})+(${p}${d}+)?|${d}+${p}${d}+)`
        + `(?!${np})`,
        "gu")
      const reGroupSep = new RegExp(g, "gu")
      const reDecSep = new RegExp(p, "gu")
      text = text.replace(reNumber, m =>
      {
        return m
          .replace(reGroupSep, '')
          .replace(reDecSep, decimalPointModChar)
      })
    }

    const splitText = splitStr(text)

    const resolveChr = (chr: string, index: number): string | string[] =>
    {
      if (chr == decimalPointModChar) return chr
      const char = this.charMap[chr]
      let variation: CharPin | null = null
      if (char && typeof char.pin !== "undefined")
      {
        variation = getVariation(char.pin, mods)
        if (typeof variation === 'number')
          return chr
        if (variation !== null)
        {
          if (typeof variation !== 'string')
          {
            const varIndex = (index+1 < splitText.length
              && isLowerCase(splitText[index+1]!)) ? 1 : 0
            variation = variation[varIndex]
          }
          return splitStr(variation).flat()
        }
      }
      return getNormalizedChr(chr) + decimalPointModChar
    }

    // Replace chrs in text with variations
    const processedText = splitText.map(resolveChr).flat()

    // convert text to 7s bytes
    const elements: TextElement[] = []
    splitStr(processedText.join("")).forEach(chr =>
    {
      const char = this.charMap[chr]

      if ((chr == decimalPointModChar || (char && char.dp))
        && elements.length > 0)
      {
        // insert dec point into previous char if exists
        const lastIndex = elements.length-1
        elements[lastIndex]!.pin =
          orPinMap(elements[lastIndex]!.pin, decimalPoint)
      }
      else if (!char)
      {
        // append dec point on its own if no char
        elements.push({pin: decimalPoint})
      }
      else
      {
        const pin = typeof char.pin != 'undefined'
          && getVariation(char.pin, mods)
        elements.push({
          pin: typeof pin !== "number" ? decimalPoint : pin,
          break: char.break,
          visible: char.visible,
          align: char.align,
        })
      }
    })

    return new SevenSegmentLine(elements)
  }
}
