<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import SevenSegmentType, { Align, bits2byte, SevenSegmentLine } from '../../src'

type Mode =
  | 'line'
  | 'individual'
  | 'word'
  | 'wrap'

type Pin = string | number

export interface Props {
  sst?: SevenSegmentType,
  mode?: Mode,
  pin?: Pin | Pin[],
  text?: string,
  color?: string,
  length?: number,
  align?: Align,
  justify?: boolean,
  convertColon?: boolean,
}

const props = withDefaults(defineProps<Props>(), {
  sst: () => new SevenSegmentType(),
  mode: "line",
  text: "",
  pin: () => [],
  color: "#00ff3f",
  length: 4*6,
  align: 'left',
  justify: false,
  convertColon: false,
})

const lines = ref<string[][]>([])

const textParts = ref<string[]>([])
//const outParts = ref<string[]>([])

function split(str: string)
{
  const arr = [];
  for (const char of str) {
    arr.push(char);
  }
  return arr;
}

watch(props, () =>
{
  if (props.mode == 'individual' || props.mode == 'word')
  {
    textParts.value = props.mode == 'individual'
      ? split(props.text)
      : props.text.split(/(?<=\s+)/)
    lines.value = [textParts.value.map(text =>
      props.sst.convert(text).toDsegString())]
  }
  else if (props.convertColon)
  {
    const parts = props.text.split(/([:␣])/)
    lines.value = [[parts.map(text => (text == ":" || text == "␣")
        ? text.replaceAll("␣", " ")
        : props.sst.convert(text).toDsegString()).join('')]]
  }
  else
  {
    textParts.value = []
    let line: SevenSegmentLine
    if (typeof props.pin == "number" || props.pin.length)
    {
      const pins = typeof props.pin != "object" ? [props.pin] : props.pin
      line = new SevenSegmentLine(pins.map(pin =>
      {
        return { pin: typeof pin == 'number' ? pin : bits2byte(pin) }
      }))
    }
    else
    {
      line = props.sst.convert(props.text)
    }

    if (props.mode == 'wrap')
    {
      lines.value = line.wrap({
        length: props.length,
        align: props.align,
        justify: props.justify,
      }).map(l => [l.toDsegString()])
    }
    else
    {
      lines.value = [[line.toDsegString()]]
    }
  }
}, { immediate: true })

const lineStyle = computed(() =>
{
  return {
    color: props.color,
    textShadow: `0 0 3px ${props.color}`
  }
})
</script>

<template>
<div class="seven-segment-panel">
  <div class="line" v-for="line in lines">
    <div class="part" v-for="(part, i) in line">
      <div class="displays sevensegment-text">
        <div class="off">{{ part.split('').map(c => (c == ":" || c == " ") ? ':' : '8').join('') }}</div>
        <div class="on" :style="lineStyle">{{ part }}</div>
      </div>
      <div v-if="textParts.length" class="plain"><div>{{ textParts[i] }}</div></div>
    </div>
  </div>
</div>
</template>

<style scoped>
.seven-segment-panel
{
  display: inline-block;

}

.part
{
  display: inline-block;
}

.off
{
  position: absolute;
  color: rgb(43, 43, 43);
  z-index: -1;
}

.plain
{
  width: 0;
  position: relative;
  height: 30px;
  font-family: monospace;
  font-size: 0.8em;
}

.plain div
{
  position: absolute;
  left: 0;
  top: 0;
  line-height: 30px;
  white-space: nowrap;
}
</style>
