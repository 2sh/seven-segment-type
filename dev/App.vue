<script setup lang="ts">
import SevenSegmentType, { libChars, normalizeToPinMap } from "../src/"
import type { Align, Char } from "../src/types"
import sst from './components/SevenSegmentText.vue'

import { computed, ref } from "vue"

import { hyphenateSync as hyphenate } from "hyphen/en-gb";

const chars: [Char, boolean][] = libChars
  .toSorted((c1, c2) => c1.chr.charCodeAt(0)-c2.chr.charCodeAt(0))
  .map(char =>
  {
    const pinMap = normalizeToPinMap(char.pin)
    const hasPin = !!(pinMap && typeof pinMap["_"] == "number")
    return [char, hasPin]
  })

const generalSss = new SevenSegmentType()
const gridSss = new SevenSegmentType({
  mods: ["*"]
})

function codeString(start: number, end: number)
{
	let t = ""
	for (let i=0; i<(end+1)-start; i++)
	{
		t += String.fromCharCode(i+start)
	}
	return t
}

function getRandomNumber(min: number, max: number)
{
  return Math.random() * (max - min) + min;
}

function toDozenal(num: number)
{
  return num.toString(12)
    .replaceAll('a', '↊').replaceAll('b', '↋')
}

function toAlphabetical(num: number, radix: number)
{
  return num.toString(radix).toUpperCase()
    .replaceAll('B', 'b').replaceAll('D', 'd')
}

function arrayToRadix(array: number[], radix: number = 10)
{
  return array.map(num =>
  {
    return radix == 12
      ? toDozenal(num)
      : toAlphabetical(num, radix)
  })
}

function exampleNumbers(radix: number = 10)
{
  return arrayToRadix(Array.from({length: 8}, () =>
  {
    const length = Math.round(getRandomNumber(2, 4))
    const lower = length-1
    const upper = length
    return Math.round(getRandomNumber(radix**lower, radix**upper-1))
  }), radix).join(' ')
}

function sstime(radix: number = 10)
{
  const now = new Date()
  const dtArray = [
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  ]
  const a = arrayToRadix(dtArray, radix)
    .map((n, i) => n.padStart(2, '0'))
  return `${a[0]}:${a[1]}:${a[2]}`
}

const weeks = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function ssdate(radix: number = 10)
{
  const now = new Date()
  const dtArray = [
    now.getFullYear(),
    now.getDate(),
  ]

  function changeCase(text: string)
  {
    if (caseMode.value == "upper")
      return text.toLocaleUpperCase()
    else if (caseMode.value == "lower")
      return text.toLocaleLowerCase()
    else
      return text
  }

  const week = changeCase(weeks[now.getDay()]!)
  const month = changeCase(months[now.getMonth()]!)



  const a = arrayToRadix(dtArray, radix)
    .map((n, i) => n.padStart(2, '0'))
  return `${week}, ${a[1]} ${month} ${a[0]}`
}

const hammondSst = new SevenSegmentType({mods: ['hammond_ten', 'hammond_elf', 'five_segment_six', 'five_segment_nine']})
const decDate = ref<string>('')
const decTime = ref<string>('')
const dozDate = ref<string>('')
const dozTime = ref<string>('')
const hexDate = ref<string>('')
const hexTime = ref<string>('')

function setTime()
{
  decDate.value = ssdate(10)
  decTime.value = sstime(10)
  dozDate.value = ssdate(12)
  dozTime.value = sstime(12)
  hexDate.value = ssdate(16)
  hexTime.value = sstime(16)
}


// https://clagnut.com/blog/2380

type LanguageSection = {
  name: string,
  code?: string,
  chars?: string[],
  examples?: string[]
}

const languageSections: LanguageSection[] = [
  {
    name: "General",
    chars: [
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      "abcdefghijklmnopqrstuvwxyz",
      "0123456789  " + exampleNumbers(10),
      "0123456789↊↋  " + exampleNumbers(12),
      "0123456789AbCdEF  " + exampleNumbers(16),
      "ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫⅬⅭⅮⅯ", "ⅯⅭⅯⅩⅭⅧ",
      "ⅰⅱⅲⅳⅴⅵⅶⅷⅸⅹⅺⅻⅼⅽⅾⅿ",
      "!\"#$%&'()*+,-./ :;<=>?@ [\\]^_` {|}~ √",
      "þðʒȝŋñĳ āēèíìıōúūùû",
      codeString(0x00A0, 0x00FF),
      codeString(0x2010, 0x203E),
      codeString(0x0100, 0x017F),
      codeString(0x0180, 0x024F),
    ],
    examples: [
      "CPU=14 MEM=50 SWP=00",
      "A cost of 100,766.35 dollars"
    ]
  },
  {
    name: "English",
    code: "en",
    examples: [
      "The quick brown fox jumps over the lazy dog.",
      "Pack my box with five dozen liquor jugs.",
      "The five boxing wizards jump quickly.",
      "aquittal aquifer aquattic aqua",
      "How quickly daft jumping zebras vex!",
      "Sixty zippers were quickly picked from the woven jute bag.",
      "Farmer Jack realized that big yellow quilts were expensive.",
      "Just keep examining every low bid quoted for zinc etchings.",
    ]
  },
  {
    name: "French",
    code: "fr",
    chars: [
      "Àà Ââ Ææ Çç Éé Èè Êê Ëë Îî Ïï Ôô Œœ Ùù Ûû Üü Ÿÿ"
    ],
    examples: [
      "Voix ambiguë d'un cœur qui, au zéphyr, préfère les jattes de kiwis.",
    ]
  },
  {
    name: "Italian",
    code: "it",
    chars: [
      "Àà Éé Èè Ìì Óó Òò Ùù Îî"
    ],
    examples: [
      "Pranzo d'acqua fa volti sghembi.",
      "Cantami o Diva del pelide Achille l'ira funesta."
    ]
  },
  {
    name: "Spanish",
    code: "es",
    chars: [
      "Áá Éé Íí Óó Úú Üü Ññ ¿¡!?"
    ],
    examples: [
      "Benjamín pidió una bebida de kiwi y fresa. Noé, sin vergüenza, la más exquisita champaña del menú.",
    ]
  },
  {
    name: "Portuguese",
    code: "pt",
    chars: [
      "Áá Àà Ââ Ãã Éé Êê Íí Óó Ôô Õõ Úú"
    ],
    examples: [
      "Luís argüia à Júlia que «brações, fé, chá, óxido, pôr, zângão» eram palavras do português.",
    ]
  },
  {
    name: "Romanian",
    code: "ro",
    chars: [
      "Ăă Ââ Îî Șș Țț"
    ],
    examples: [
      "Muzicologă în bej vând whisky și tequila, preț fix.",
    ]
  },
  {
    name: "Latin",
    code: "la",
    chars: [
      "Āā Ēē Īī Ōō Ūū Ȳȳ"
    ],
    examples: [
      "Sīc fugiēns, dux, zēlotypos, quam Karus habēris.",
    ]
  },
  {
    name: "German",
    code: "de",
    chars: [
      "Ää Öö Üü ßẞ"
    ],
    examples: [
      "Victor jagt zwölf Boxkämpfer quer über den großen Sylter Deich.",
      "Falsches Üben von Xylophonmusik quält jeden größeren Zwerg.",
      "Jörg bäckt quasi zwei Haxenfüße vom Wildpony.",
      "Zwölf laxe Typen qualmen verdächtig süße Objekte.",
      "Franz jagt im komplett verwahrlosten Taxi quer durch Bayern.",
      "Äußerst Öl Über",
    ]
  },
  {
    name: "Icelandic",
    code: "is",
    chars: [
      "Áá Ðð Éé Íí Óó Úú Ýý Þþ Ææ Öö"
    ],
    examples: [
      "Kæmi ný öxi hér, ykist þjófum nú bæði víl og ádrepa.",
    ]
  },
  {
    name: "Danish",
    code: "da",
    chars: [
      "Ææ Øø Åå"
    ],
    examples: [
      "Quizdeltagerne spiste jordbær med fløde, mens cirkusklovnen Walther spillede på xylofon.",
    ]
  },
  {
    name: "Norwegian",
    code: "no",
    chars: [
      "Ææ Øø Åå Éé Èè Êê Óó Òò Ôô Ùù"
    ],
    examples: [
      "Jeg begynte å fortære en sandwich mens jeg kjørte taxi på vei til quiz.",
    ]
  },
  {
    name: "Swedish",
    code: "sv",
    chars: [
      "Åå Ää Öö"
    ],
    examples: [
      "Flygande bäckasiner söka hwila på mjuka tuvor.",
    ]
  },
  {
    name: "Finnish",
    code: "fi",
    chars: [
      "Ää Öö Åå Šš Žž"
    ],
    examples: [
      "Albert osti fagotin ja töräytti puhkuvan melodian.",
    ]
  },
  {
    name: "Polish",
    code: "pl",
    chars: [
      "Ąą Ćć Ęę Łł Ńń Óó Śś Źź Żż"
    ],
    examples: [
      "Jeżu klątw, spłódź Finom część gry hańb!",
    ]
  },
  {
    name: "Czech",
    code: "cs",
    chars: [
      "Áá Čč Ďď Éé Ěě Íí Ňň Óó Řř Šš Ťť Úú Ůů Ýý Žž"
    ],
    examples: [
      "Příliš žluťoučký kůň úpěl ďábelské ódy.",
    ]
  },
  {
    name: "Lithuanian",
    code: "lt",
    chars: [
      "Ąą Čč Ęę Ėė Įį Šš Ųų Ūū Žž"
    ],
    examples: [
      "Įlinkdama fechtuotojo špaga sublykčiojusi pragręžė apvalų arbūzą.",
    ]
  },
  {
    name: "Irish",
    code: "ga",
    chars: [
      "Áá Óó Úú Éé Íí"
    ],
    examples: [
      "D’fhuascail Íosa Úrmhac na hÓighe Beannaithe pór Éava agus Ádhaimh.",
    ]
  },
  {
    name: "Russian",
    code: "ru",
    chars: [
      "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ",
      "абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
    ],
    examples: [
      "Съешь ещё этих мягких французских булок, да выпей же чаю.",
      "Шеф взъярён тчк щипцы с эхом гудбай Жюль",
      "Эх чужд кайф сплющь объём вши грызя цент",
    ]
    // https://en.wikipedia.org/wiki/Cyrillic_script
  },
  {
    name: "Serbian",
    code: "sr",
    chars: [
      "АБВГДЂЕЖЗИЈКЛЉМНЊОПРСТЋУФХЦЧЏШ",
      "абвгдђежзијклљмнњопрстћуфхцчџш",
    ],
  },
  {
    name: "Greek",
    code: "el",
    chars: [
      "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ",
      "αβγδεζηθικλμνξοπρστυφχψω",
      "Άά Έέ Ήή Ίί Όό Ύύ Ώώ ΐ ΰ Ϊϊ Ϋϋ"
    ],
    examples: [
      "Ξεσκεπάζω τὴν ψυχοφθόρα βδελυγμία.",
    ]
    // https://en.wikipedia.org/wiki/Greek_diacritics
  },
  {
    name: "CJK",
    chars: [
      codeString(0x3001, 0x303F),
      "一二三四五六七八九十百千万",
    ]
  },
  {
    name: "Japanese",
    code: "ja",
    chars: [
      "ヵヮャ　ァンワラヤマハナタサカア",
      "　　　　ィ゛ヰリ　ミヒニチシキイ",
      "　　ュッゥ゜　ルユムフヌツスクウ",
      "ヶ　　　ェーヱレ　メヘネテセケエ",
      "　　ョ　ォ　ヲロヨモホノトソコオ",
    ],
    examples: [
      "いろはにほへと　ちりぬるを　わかよたれそ　つねならむ　うゐのおくやま　けふこえて　あさきゆめみし　ゑひもせす",
      "やまざとにかぜわたる　こもれびゆらしいろを　ほんのりそめてふくあ　すはようみちなきおね　へつえむけぬ",
    ] // https://web.archive.org/web/20090330125307/http://admac.jp/pangram/sakuhin.html
  },
  {
    name: "Korean",
    code: "ko",
    chars: [
      "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ",
      "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ",
    ],
    examples: [
      "다람쥐 헌 쳇바퀴에 타고파.",
    ]
  },
  {
    name: "Misc",
    chars: [
      "AbCdEFGHIJKLMNoPQRsTUVWXYz",
    ],
    examples: [
      "ON OPEN PLAY StOP OFF CLOSE Error",
    ]
  },
]

const caseMode = ref('normal')
const enableRemovingDiacritics = ref(false)
const hideTranscriptions = ref(false)
const color = ref('#00ff3f')
const customText = ref('Custom text input')
const customTextOutput = computed(() => hyphenate(customText.value))
const customTextWrapLength = ref(4*12)
const customTextWrapAlign = ref<Align>('left')
const customTextWrapJustify = ref(false)

const sections = computed<[SevenSegmentType, LanguageSection][]>(() =>
{
  return languageSections.map(section =>
  {
    const ssd = section.code
      ? new SevenSegmentType({mods: [section.code]})
      : new SevenSegmentType()

    let examples = section.examples
    if (examples)
    {
      if (section.code == "ko")
      {
        examples = examples.map(e => e.normalize("NFKD").split('').join(''))
      }
      else
      {
        examples = examples.map(example =>
        {
          if (caseMode.value == "upper")
            example = example.toLocaleUpperCase()
          else if (caseMode.value == "lower")
            example = example.toLocaleLowerCase()
          if (enableRemovingDiacritics.value)
            example = example.normalize("NFD").replace(/\p{Diacritic}/gu, "")
          return example
        })
      }
    }

    return [ssd, {
      name: section.name,
      chars: section.chars,
      examples
    }]
  })
})

function onColorPreset(e: Event)
{
  const target = e.target as HTMLSelectElement
  color.value = target.value
  target.value = ''
}

const wrappingTextExample = "\x01Title\n\x03Right aligned\n123456789012345678901234 Testing hyphenating sen\u00ADtence and some no\u00A0break\u00A0spaces. With many many words to test the wrapping of seven\u2010segment text and also\na newline character."

setInterval(setTime, 1000)
setTime()

const customChar = ref([0,0,0,0,0,0,0,0])

const customCharBin = computed(() =>
{
  return customChar.value
    .map(n => n.toString())
    .join('')
})

const customCharRep = computed(() =>
{
  const byte = parseInt(customChar.value
    .map(n => n.toString())
    .toReversed()
    .join(''), 2) || 0
  return String.fromCodePoint(0x2800 + byte)
})

function addCustomChar()
{
  customText.value += customCharRep.value
}

</script>

<template>
  <div id="main" :class="{'hide-transcriptions': hideTranscriptions}">
    <div>
      <div class="options">
        <div>
          <label>Colour:
            <input style='width: 60px; font-family:monospace' v-model="color" value="#00ff3f"/>
            <select v-on:change="onColorPreset">
            <option disabled selected value="">Preset</option>
            <option value="#00ff3f">Green</option>
            <option value="#ff3333">Red</option>
            <option value="#FFA500">Orange</option>
            <option value="#0c5afc">Blue</option>
            <option value="#ffff00">Yellow</option>
          </select></label>
        </div>
        <div>
          <label>Hide transcriptions: <input type="checkbox" v-model="hideTranscriptions"></label>
        </div>
      </div>
      <div class="options">
        <div class="options-header">
        Options for the examples:
        </div>
        <div>
          <label>Casing: <select v-model="caseMode">
            <option value="normal">Normal</option>
            <option value="upper">All uppercase</option>
            <option value="lower">All lowercase</option>
          </select></label>
        </div>
        <div>
          <label>Remove diacritics: <input type="checkbox" v-model="enableRemovingDiacritics"></label>
        </div>
      </div>
      <div id="custom-text-section">
        <div>
          <div>
            <textarea v-model="customText"></textarea>
          </div>
          <div>
            <label>Custom char:</label>
            <div class="custom-char-bits">
              <span><sst :text="customCharRep"/></span>
              <div v-for="n in 8"
                @click="() => customChar[n-1] = customChar[n-1] ? 0 : 1"
                :class="'custom-char-bit bit-' + n"></div>
            </div>
            <span>{{ customCharBin }}</span>
            <button @click="addCustomChar">Add</button>
          </div>
          <div>
            <label>Panel width: <input type="number" v-model="customTextWrapLength"></label>
            <label>Align: <select v-model="customTextWrapAlign">
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="center">Center</option>
            </select></label>
            <label>Justify: <input type="checkbox" v-model="customTextWrapJustify"></label>
          </div>
        </div>
        <div id="custom-text-output" class="larger-displays">
          <sst :color="color" :mode="'wrap'" :sst="generalSss" :text="customTextOutput"
            :length="customTextWrapLength"
            :align="customTextWrapAlign"
            :justify="customTextWrapJustify"></sst>
        </div>
      </div>
      <div class="larger-displays">
        <h2>Date & Time</h2>
        <h3>Decimal</h3>
        <div class="date-time">
          <div><sst :text="decDate"/></div>
          <div><sst :convertColon="true" :text="decTime"/></div>
        </div>
        <h3>Dozenal</h3>
        <div class="date-time">
          <div><sst :text="dozDate"/></div>
          <div><sst :convertColon="true" :text="dozTime"/></div>
        </div>
        <h3>Dozenal (Hammond)</h3>
        <div class="date-time">
          <div><sst :sst="hammondSst" :text="dozDate"/></div>
          <div><sst :convertColon="true" :sst="hammondSst" :text="dozTime"/></div>
        </div>
        <h3>Hexadecimal</h3>
        <div class="date-time">
          <div><sst :text="hexDate"/></div>
          <div><sst :convertColon="true" :text="hexTime"/></div>
        </div>
      </div>
      <div v-for="([ssd, section]) in sections" class="larger-displays">
        <h2>{{ section.name }}</h2>
        <div>
          <div class="subsection">
            <div v-for="line in section.chars">
              <sst :color="color" :mode="'individual'" :sst="ssd" :text="line"></sst>
            </div>
          </div>
          <div class="subsection">
            <div v-for="line in section.examples">
              <sst :color="color" :mode="'word'" :sst="ssd" :text="line"></sst>
            </div>
          </div>
        </div>
      </div>
      <div class="larger-displays">
        <h2>Text Wrapping Test</h2>
        <div style="margin: 10px;">
          <sst :mode="'wrap'" :text="wrappingTextExample" :length="24"></sst>
        </div>
      </div>
      <div>
        <h2>Notes</h2>
        <div>
          a <sst pin="00110010"/> : Considered was <sst pin="00100010"/> as it would mirror `e` <sst pin="00011000"/>, and <sst pin="00110010"/> could then be used for `s` perhaps, but using it also for Greek and Cyrillic `a` would conflict with their `t` <sst pin="00100010"/>. It also makes words a bit less recognisable.
        </div>
        <div>
          f <sst pin="00001110"/> : A strong contender is <sst pin="10001010"/> but that one can be used for `r` with diacritics: ř. May still change though.
        </div>
        <div>
          g <sst pin="00100010"/> : Maybe a stretch... but it's the hook of `G`, has the downward motion of `g`, and mirrors <sst pin="00001010"/> used for Cyrillic `г` and and Greek `γ`. <sst pin="10010110"/> and <sst pin="11110110"/> are too top heavy. A strong contender is <sst pin="10011010"/> but that one can be used for `c` with diacritics: č. May still change though. Also a consideration is to use <sst pin="00100010"/> for `s`.
        </div>
        <div>
          m <sst pin="10101000"/> : Not <sst pin="10101010"/> to allow `ñ` to use it. Same as w <sst pin="01010100"/> upside down.
        </div>
        <div>
          R <sst pin="11101010"/> : Could perhaps also be <sst pin="10001100"/> but then it wouldn't feel like a proper unique capital letter and also wouldn't mirror Cyrillic `Я` <sst pin="10101110"/>.
        </div>
        <div>
          T <sst pin="11100000"/> : Not <sst pin="10001100"/> to allow Greek `Γ` and Cyrillic `Г` to use it and for all `T`s to look the same. Opposite segments of `t` <sst pin="00011110"/>.
        </div>
        <div>
          w <sst pin="01010100"/> : Not <sst pin="10111000"/> to allow `ū` to use it. Same as m <sst pin="10101000"/> upside down.
        </div>
        <div>
          X <sst pin="00100110"/> : Not <sst pin="10010010"/> to allow Cyrillic `Ш` and Greek `Ξ` to use it and for all `X`s to look the same. Strongly considered was <sst pin="01101100"/> but looks a bit too disconnected.
        </div>
        <div>
          x <sst pin="00101000"/> : <sst pin="00010010"/> is already used by Cyrillic `к` and Greek `κ`.
        </div>
        <div>
          y <sst pin="01100010"/> : Like a `y` but rotated to make the right line vertical. <sst pin="01100110"/> looks too top heavy. Could also be <sst pin="01110010"/> but it feels a bit less recognisable.
        </div>
        <div>
          Ĳ <sst pin="01110100"/> : Does not require upper and lowercase versions, because "When a Dutch word starting with `Ĳ` is capitalised, the entire digraph is capitalised" (e.g. It's IJmuiden not Ijmuiden)
        </div>
        <div>
          M <sst pin="11010100"/>, Q <sst pin="11010110"/>, i <sst pin="10100000"/>, k <sst pin="00010110"/>, m <sst pin="10101000"/> & w <sst pin="01010100"/> : Shouldn't be too many disconnected base characters.
        </div>
        <div>
          Between `ò` <sst pin="10111010"/> and `ó` <sst pin="10111010"/> in the Italian locale, `ó` gets the decimal point <sst pin="10111011"/> as it has a low occurrence in Italian.
        </div>
        <div>
          ィ <sst pin="00100000"/> : Different from the origin, it has been changed from <sst pin="00001000"/> to avoid conflict with the comma.
        </div>
        <div>
          6 <sst pin="10111110"/>, 7 <sst pin="11100000"/> & 9 <sst pin="11110110"/>: These seem to be most common on general displays. Though `7` is often found as <sst pin="11100100"/> on calculators. `6` <sst pin="00111110"/>, `7` <sst pin="11100100"/> & `9` <sst pin="11100110"/> can be displayed instead with the var keys `five_segment_six`, `four_segment_seven` and `five_segment_nine`, respectively.
        </div>
        <div>
↊ <sst pin="10001100"/> & ↋ <sst pin="10011110"/> : Both DSGB and DSA now use
the rotated `2` and `3` by Isaac Pitman. Though rotated `2` <sst pin="11011010"/>
in 7 segments ends up being <sst pin="11011010"/> again.
<sst pin="10001100"/> was designed from an insular/uncial `Ꞇ` (T) which looks very similar to the `↊`.
Also `T` for <i>T</i>en. Other design ideas: <sst pin="10011100"/>
looks like a C, <sst pin="10111100"/> looks like a `G`,
and <sst pin="00011100"/> and <sst pin="00111100"/> look like `L` and `l`.

I really wanted to avoid inventing something new but was unsatified with the
<a href="https://dozenal.org/drupal/content/dsa-symbology-synopsis.html">various proposals</a> out there.
For `↊`, thinking of `*` (telephone key) or `X` (Roman numeral for 10) there's the following:
<sst pin="01101110"/> would allow for <sst pin="01101110"/><sst pin="01101110"/>
as a valid number; <sst pin="01001010"/> and <sst pin="00100110"/> look like
slashes; <sst pin="00001110"/> and <sst pin="10010010"/> are too obscure looking;
and <sst pin="01101100"/> looks like two `1`s.

Strongly considered were <sst pin="01011010"/> & <sst pin="00011110"/>, a
<a href="http://www.dozenalsociety.org.uk/basicstuff/hammond.html">proposal</a>
by Don Hammond but amongst the other numbers 0-9, they just don't look "full"
enough, like lower case letters (`z` and `t`). Don Hammond's proposal can be
displayed instead with the var keys `hammond_ten` and `hammond_elf`. These
in combination with `five_segment_six` and `five_segment_nine` makes it more
aesthetically pleasing.
        </div>
      </div>
      <div class="larger-displays">
        <h2>Character Map</h2>
        <div id="character-map">
          <div class="character" v-bind:class="{'has-pin': hasPin }" v-for="[char, hasPin] in chars">
            <div class="title">{{ char.chr }}</div>
            <div class="ssbox sevensegment-text"><div>{{ gridSss.convert(char.chr).toDsegString() }}</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.larger-displays .seven-segment-panel
{
  font-size: 20px;
}

.custom-char-bits
{
  font-size: 50px;
  position: relative;
  user-select: none;
}

.custom-char-bit
{
  position: absolute;
  left: 0;
  top: 0;
}

.custom-char-bit.bit-1,
.custom-char-bit.bit-4,
.custom-char-bit.bit-7
{
  width: 18px;
  height: 8px;
  left: 12px;
}

.custom-char-bit.bit-7
{
  top: 23px;
}

.custom-char-bit.bit-4
{
  top: 46px;
}

.custom-char-bit.bit-2,
.custom-char-bit.bit-3,
.custom-char-bit.bit-5,
.custom-char-bit.bit-6
{
  width: 8px;
  height: 18px;
}

.custom-char-bit.bit-2,
.custom-char-bit.bit-6
{
  top: 6px;
}

.custom-char-bit.bit-3,
.custom-char-bit.bit-5
{
  top: 30px;
}

.custom-char-bit.bit-5,
.custom-char-bit.bit-6
{
  left: 4px;
}

.custom-char-bit.bit-2,
.custom-char-bit.bit-3
{
  left: 30px;
}

.custom-char-bit.bit-8
{
  left: 38px;
  top: 45px;

  width: 8px;
  height: 8px;
}


.options
{
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.options-header
{
  font-weight: bold;
}

#custom-text-section
{
  margin: 10px;
}

#custom-text-section textarea
{
  width: 600px;
  height: 100px;
  background-color: black;
  color: white;
}

#custom-text-output
{
  margin-top: 10px;
}

.date-time > div
{
  display: inline-block;
  margin: 0 10px;
}

#character-map
{
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.character
{
  border: 1px solid white;
  display: flex;
  flex-direction: column;
  width: 30px;
}

.title
{
  text-align: center;
  background-color: rgb(180, 180, 180);
  color: black;
  vertical-align: middle;
  line-height: 22px;
  height: 22px;
}

.character:not(.has-pin) .title
{
  background-color: #ffdbb3;
}

.ssbox
{
  vertical-align: middle;
  flex-grow: 2;
  display: flex;
  justify-content: center;
  align-items: center;

  padding: 4px;
}

h2, h3
{
  margin: 0;
  margin-bottom: 8px;
}

.subsection
{
  margin: 10px 0 20px 10px;
}

.test-line
{
  margin: 10px;
}
</style>

<style>
.hide-transcriptions .seven-segment-panel .plain
{
  display: none;
}
</style>