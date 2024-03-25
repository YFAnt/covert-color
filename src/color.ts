import { AnyColor, Colord, colord, extend } from "colord";
import cmykPlugin from "colord/plugins/cmyk";
import namesPlugin from "colord/plugins/names";

import { ColorDescribe } from "./type";

extend([cmykPlugin, namesPlugin]);
export type ColorType = "rgb" | "hsl" | "hex" | "cmyk" | "named";
type CorrectionFn = (i: string) => Colord | AnyColor;
type ColorTypeMatcher = {
  type: ColorType;
  reg: RegExp;
};
export const colorCorrection: Record<Exclude<ColorType, "named">, CorrectionFn> = {
  hex(input) {
    let output = input.replace(/^#/g, "");
    const len = output.length;
    if (len === 0) return "#";
    /**
     * a => aa0000
     * ab => aabb00
     * abc => aabbcc
     * abcd => aabbccdd
     * */
    if (len <= 4) {
      output = output
        .split("")
        .map((s) => s.repeat(2))
        .join("");
    }

    output = output.padEnd(6, "0");
    output = output.padEnd(8, "f");

    return `#${output}`;
  },

  rgb(input) {
    const output = input.replace(/[^\d,.]/g, "");
    const [r, g = 0, b = 0, a = 1] = output.split(",");

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  },

  hsl(input) {
    const output = input.replace(/[^\d,.]/g, "");
    const [h, s = 100, l = 50, a = 1] = output.split(",");

    return `hsla(${h}, ${s}, ${l}, ${a})`;
  },
  cmyk(input) {
    const output = input.replace(/[^\d,.]/g, "");
    const [c = 0, m = 0, y = 0, k = 0] = output.split(",");
    return {
      c,
      m,
      y,
      k,
    } as AnyColor;
  },
};

const typeMatcher: ColorTypeMatcher[] = [
  { type: "hex", reg: /^#/ },
  { type: "rgb", reg: /^rgb/i },
  { type: "hsl", reg: /^hsl/i },
  { type: "cmyk", reg: /^cmyk/i },
  { type: "named", reg: /^.+/i },
];

export function getColorType(colorStr: string): ColorType {
  return typeMatcher.find((m) => m.reg.test(colorStr))!.type;
}

export function dealWithOthers(input: string, type: ColorType): ColorDescribe[] {
  if (!type) {
    return [];
  }
  let color: Colord;
  if (type === "named") {
    color = colord(input);
  } else {
    color = colord(colorCorrection[type](input));
  }
  const iconColor = color.toHex();
  const options = [
    { name: color.toHex(), desc: "CSS Hexadecimal" },
    { name: color.toRgbString(), desc: `CSS RGB` },
    { name: color.toHslString(), desc: `CSS HSL` },
    { name: JSON.stringify(color.toCmyk()), desc: `CMYK JSON` },
    { name: color.toCmykString(), desc: `CMYK` },
  ];

  return options.map(({ name, desc }) => {
    return {
      title: name,
      subtitle: desc,
      iconColor
    };
  });
}
