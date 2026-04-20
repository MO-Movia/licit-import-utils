/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import { getCapcoFromNode } from './capco.util';
import { v4 as uuid } from 'uuid';

/*
 * Copyright 2022 Modus Operandi Inc.
 * All Rights Reserved.
 * Proprietary information of Modus Operandi Inc.
 */
interface InfoIconData {
  infoIconClass: string;
  infoIconUnicode: string;
}
const infoIconCircleData: InfoIconData = {
  infoIconClass: 'fa fa-info-circle',
  infoIconUnicode: '&#xf05a;',
};
const infoIconLockData: InfoIconData = {
  infoIconClass: 'fa fa-lock',
  infoIconUnicode: '&#xf023;',
};

type LicitAttrs = Record<string, unknown>;
interface Mark {
  type: string;
  attrs?: LicitAttrs;
  marks?: { type: string; attrs?: LicitAttrs }[];
  text?: string;
}

export type LicitElementJSON = Record<string, unknown>;

interface LicitElementAttrsJSON extends LicitAttrs {
  parser?: LicitAttrs;
}

interface LicitMarksJSON {
  type: string;
  attrs?: LicitAttrs;
}

interface LicitDocumentAttrsJSON extends LicitElementAttrsJSON {
  layout: null;
  padding: null;
  width: null;
}

export interface LicitImageAttrsJSON extends LicitElementAttrsJSON {
  align: string | null;
  alt: string | null;
  crop: string | null;
  height: string | null;
  rotate: string | null;
  src: string | null;
  title: string | null;
  width: string | null;
  fitToParent: number;
}

interface LicitImageJSON extends LicitElementJSON {
  type: string;
  attrs: LicitImageAttrsJSON;
}

interface LicitParagraphImageAttrsJSON extends LicitElementAttrsJSON {
  styleName?: string;
}

interface LicitImageContentJSON extends LicitElementJSON {
  type: string;
  attrs: LicitImageAttrsJSON;
}

interface LicitParagraphImageJSON extends LicitElementJSON {
  type: string;
  attrs: LicitParagraphImageAttrsJSON;
  content: LicitImageContentJSON[];
}

interface LicitHeaderAttrsJSON extends LicitElementAttrsJSON {
  styleName?: string;
  capco?: string;
  selectionId?: string;
}

interface LicitHeaderContentJSON extends LicitElementJSON {
  type: string;
  text: string;
  marks: LicitMarksJSON[];
}

interface LicitHeaderJSON extends LicitElementJSON {
  type: string;
  attrs: LicitHeaderAttrsJSON;
  content: LicitHeaderContentJSON[];
}

interface LicitParagraphAttrsJSON extends LicitElementAttrsJSON {
  styleName?: string;
  align?: string;
  indent?: number;
}

interface LicitParagraphContentJSON extends LicitElementJSON {
  type: string;
  text: string;
  marks: LicitMarksJSON[];
}

interface LicitParagraphJSON extends LicitElementJSON {
  type: string;
  attrs: LicitParagraphAttrsJSON;
  content: LicitParagraphContentJSON[];
}

interface LicitBulletListItemAttrsJSON extends LicitElementAttrsJSON {
  styleName?: string;
}

interface LicitBulletListItemJSON extends LicitElementJSON {
  type: string;
  attrs: LicitBulletListItemAttrsJSON;
  content: LicitParagraphJSON[];
}

interface LicitBulletListAttrsJSON extends LicitElementAttrsJSON {
  id: string;
  indent: number;
  listStyleType: string;
}

interface LicitBulletListJSON extends LicitElementJSON {
  type: 'bullet_list';
  attrs: LicitBulletListAttrsJSON;
  content: LicitBulletListItemJSON[];
}

interface LicitTableAttrsJSON extends LicitElementAttrsJSON {
  marginLeft: null;
  vignette: boolean;
}
interface LicitTableRowAttrsJSON extends LicitElementAttrsJSON {
  rowHeight: string;
}
interface LicitTableCellAttrsJSON extends LicitElementAttrsJSON {
  colspan: number;
  rowspan: number;
  colwidth: number[] | number;
  borderColor?: string;
  borderTop?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRight?: string;
  background: string;
  vignette?: boolean;
  fullSize?: number;
  vAlign?: string;
}

interface LicitTableCellJSON extends LicitElementJSON {
  type: 'table_cell' | 'table_header';
  attrs: LicitTableCellAttrsJSON;
  content: LicitParagraphJSON[];
}

interface LicitTableCellImageJSON extends LicitElementJSON {
  type: 'table_cell';
  attrs: LicitTableCellAttrsJSON;
  content: LicitParagraphImageJSON[];
}

interface LicitTableRowJSON extends LicitElementJSON {
  type: 'table_row';
  attrs: LicitTableRowAttrsJSON;
  content: LicitTableCellJSON[];
}

export interface LicitTableJSON extends LicitElementJSON {
  type: 'table';
  attrs: LicitTableAttrsJSON;
  content: LicitTableRowJSON[];
}

export abstract class LicitElement {
  styleLevel = 0;
  id?: string = '';
  abstract getBaseElement(): unknown;
  abstract render(): LicitElementJSON;
}

interface LicitHRJSON extends LicitElementJSON {
  type: string;
  attrs: LicitHRAttrsJSON;
}

interface LicitHRAttrsJSON extends LicitElementAttrsJSON {
  pageBreak: null;
}

interface LicitOrderedListJSON extends LicitElementJSON {
  type: 'ordered_list';
  attrs: LicitBulletListAttrsJSON;
  content: LicitBulletListItemJSON[];
}

interface CellStyleInfo {
  className?: string;
  id?: string;
  marginTop?: string;
  marginBottom?: string;
  fontSize?: string;
  letterSpacing?: string;
  cellWidth?: string;
}

export interface LicitDocumentJSON extends LicitElementJSON {
  type: 'doc';
  attrs: LicitDocumentAttrsJSON;
  content: LicitElementJSON[];
}

export class LicitDocumentElement extends LicitElement {
  getBaseElement(): LicitDocumentJSON {
    return {
      type: 'doc',
      attrs: {
        layout: null,
        padding: null,
        width: null,
      },
      content: [],
    };
  }

  children: LicitElement[] = [];

  appendElement(element: LicitElement) {
    this.children.push(element);
  }

  render(): LicitDocumentJSON {
    const element = this.getBaseElement();

    for (const child of this.children) {
      element.content.push(child.render());
    }

    return element;
  }
}

export class LicitImageElement extends LicitElement {
  source: string;
  alt: string;
  width?: string;
  height?: string;
  align?: string;
  constructor(
    src: string,
    altText?: string,
    width?: string,
    height?: string,
    align?: string
  ) {
    super();
    this.source = src;
    this.alt = altText ?? '';
    this.width = width;
    this.height = height;
    this.align = align;
  }

  getBaseElement(): LicitImageJSON {
    return {
      type: 'image',
      attrs: {
        align: null,
        alt: '',
        crop: null,
        height: null,
        rotate: null,
        src: '',
        title: null,
        width: null,
        fitToParent: null,
      },
    };
  }

  render(): LicitImageJSON {
    const element = this.getBaseElement();
    element.attrs.src = this.source;
    element.attrs.alt = this.alt ?? '';
    element.attrs.align = this.align ?? 'center';

    if (this.width) element.attrs.width = this.width;
    if (this.height) element.attrs.height = this.height;

    return element;
  }
}
export class LicitNewImageElement extends LicitElement {
  getBaseElement() {
    return {
      type: 'image',
      attrs: {
        alt: '',
        height: null,
        src: '',
        title: null,
        width: null,
        fitToParent: null,
        simpleImg: 'false',
        capco: this.capco,
      },
    };
  }

  source: string;
  alt: string;
  width: string;
  height: string;
  capco: string;
  constructor(
    src: string,
    width: string,
    height: string,
    altText?: string,
    capco?: string
  ) {
    super();
    this.source = src;
    this.alt = altText;
    this.height = height;
    this.width = width;
    this.capco = capco ?? '';
  }

  render() {
    const element = this.getBaseElement();
    element.attrs.src = this.source;
    element.attrs.alt = this.alt ?? '';
    element.attrs.width = this.width ?? null;
    element.attrs.height = this.height ?? null;
    return element;
  }
}

export class LicitParagraphImageElement extends LicitElement {
  getBaseElement(): LicitParagraphImageJSON {
    return {
      type: 'paragraph',
      attrs: {
        styleName: 'Normal',
      },
      content: [
        {
          type: 'image',
          attrs: {
            align: 'center',
            alt: this.alt ?? '',
            crop: null,
            height: null,
            rotate: null,
            src: this.source,
            title: null,
            width: null,
            fitToParent: null,
            capco: this.capco ?? '',
          },
        },
      ],
    };
  }

  source: string;
  alt: string;
  width?: string;
  height?: string;
  capco?: string;
  align?: string;

  constructor(
    src: string,
    alt?: string,
    width?: string,
    height?: string,
    align?: string
  ) {
    super();
    this.source = src;
    this.alt = alt;
    this.width = width;
    this.height = height;
    this.align = align;
  }

  render(): LicitParagraphImageJSON {
    const element = this.getBaseElement();
    if (this.width) element.content[0].attrs.width = this.width;
    if (this.height) element.content[0].attrs.height = this.height;
    if (this.align) element.content[0].attrs.align = this.align;
    return element;
  }
}
export class LicitEnhancedImageElement extends LicitElement {
  getBaseElement() {
    return {
      type: 'enhanced_table_figure',
      attrs: {
        id: '',
        figureType: 'figure',
        orientation: 'portrait',
        maximized: false,
        isValidate: true,
      },
      content: [],
    };
  }
  body: LicitEnhancedImageBodyElement;
  capco: LicitEnhancedTableFigureCapcoElement;
  orientation: string;
  constructor(orientation: string) {
    super();
    this.orientation = orientation;
  }
  render() {
    const element = this.getBaseElement();
    if (this.orientation) {
      element.attrs.orientation = this.orientation;
    }
    element.content.push(this.body.render(), this.capco.render());
    return element;
  }

  addBody(bodyObj: LicitEnhancedImageBodyElement) {
    this.body = bodyObj;
  }
  addCapco(capcoObj: LicitEnhancedTableFigureCapcoElement) {
    this.capco = capcoObj;
  }
}
export class LicitEnhancedImageBodyElement extends LicitElement {
  image: LicitNewImageElement;
  getBaseElement() {
    return {
      type: 'enhanced_table_figure_body',
      content: [],
    };
  }
  constructor(img: LicitNewImageElement) {
    super();
    this.image = img;
  }
  render() {
    const element = this.getBaseElement();
    element.content.push(this.image.render());
    return element;
  }
}

export class LicitHeaderElement extends LicitElement {
  getBaseElement(): LicitHeaderJSON {
    return {
      type: 'paragraph',
      attrs: { styleName: 'Normal' },
      content: [
        {
          type: 'text',
          text: '',
          marks: [
            {
              type: 'mark-font-size',
              attrs: {
                pt: 12,
              },
            },
            {
              type: 'mark-font-type',
              attrs: {
                name: 'Times New Roman',
              },
            },
            {
              type: 'strong',
              attrs: { overridden: true },
            },
          ],
        },
      ],
    };
  }

  text: string;
  subText: string;
  // override styleLevel: number;
  align: string | null = null;
  styleName: string;
  capco: string;
  selectionId?: string;
  name?: string = '';
  marks?: Mark[] = [];
  constructor(
    text = '',
    subText = '',
    styleLevel = 0,
    styleName = '',
    capco = '',
    node?: HTMLElement
  ) {
    super();
    this.text = text;
    this.subText = subText;
    this.styleLevel = styleLevel;
    this.styleName = styleName;
    this.capco = capco;

    this.setInnerlinks(node);
    this.marks = this.handleInlineStyles(node);
  }

  render(): LicitHeaderJSON {
    const element = this.getBaseElement();
    element.content[0].text = this.text;
    if (this.subText.length) {
      element.content.push({
        type: 'text',
        text: this.subText,
        marks: [
          {
            type: 'mark-font-type',
            attrs: {
              name: 'Times New Roman',
            },
          },
          {
            type: 'mark-font-size',
            attrs: {
              pt: 12,
            },
          },
        ],
      });
    }
    if (this.marks && this.marks.length > 0) {
      if (element.content[0].type === 'text') {
        element.content[0].marks.push(...this.marks);
      }
    }
    element.attrs.styleName = this.styleName;
    element.attrs.capco = this.capco;
    element.attrs.selectionId = this.selectionId;
    return element;
  }
  //innerLinks
  setInnerlinks(node?: HTMLElement) {
    if (!node) return;

    for (const n of Array.from(node.childNodes)) {
      if (n.nodeName !== 'A') {
        continue;
      }

      const anchorElement = n as HTMLAnchorElement;
      const anchorId = anchorElement.getAttribute('id') || anchorElement.getAttribute('name');

      if (!anchorElement.href && anchorId) {

        this.name = anchorId;
        this.id = anchorId;
        this.selectionId = '#' + anchorId;
      }
    }
  }
  handleInlineStyles(node: HTMLElement): Mark[] {
    const marks: Mark[] = [];
    if (node?.style?.length > 0) {
      const nodeStyles: string[] = node.getAttribute('style')?.split(';');
      if (nodeStyles?.length > 0) {
        const inlineStyles: string[] = getInlineStylesArray(nodeStyles);
        if (inlineStyles.length > 0 && node.textContent !== '') {
          this.mapInlineStylesToMarks(inlineStyles, marks);
        }
      }
    }
    return marks;
  }
  mapInlineStylesToMarks(
    inlineStyles: string[],
    inlineMarks: { type: string; attrs?: LicitAttrs }[]
  ) {
    for (const inlineStyle of inlineStyles) {
      switch (inlineStyle.toLowerCase()) {
        case 'italic': {
          const em: { type: string; attrs?: LicitAttrs } = {
            type: 'em',
            attrs: { overridden: true },
          };
          inlineMarks.push(em);
          break;
        }
        case 'underline': {
          const u: Mark = {
            type: 'underline',
            attrs: { overridden: true },
          };
          inlineMarks.push(u);
          break;
        }
        case 'uppercase': {
          this.text = this.text.toUpperCase();
          break;
        }
        case 'lowercase': {
          this.text = this.text.toLowerCase();
          break;
        }
        default: {
          if (inlineStyle.startsWith('color-')) {
            const colorValue = inlineStyle.replace('color-', '');
            if (CSS.supports('color', colorValue)) {
              inlineMarks.push({
                type: 'mark-text-color',
                attrs: { color: colorValue, overridden: true },
              });
            }
          }
          break;
        }
      }
    }
  }
}

//Licit Paragraph node for handling note
export class LicitParagraphNote extends LicitElement {
  node: HTMLElement;
  styleName: string;
  capco = '';
  constructor(node: HTMLElement) {
    super();
    this.node = node;
    this.styleName = node.className ?? 'Normal';
    this.capco = getCapcoFromNode(node);
  }
  getBaseElement(): LicitParagraphJSON {
    return {
      type: 'paragraph',
      attrs: {
        styleName: this.styleName,
        capco: this.capco,
      },
      content: [],
    };
  }
  render() {
    const element = this.getBaseElement();
    const text = this.node.textContent;
    const noteName = text.split(':')[0] + ':';
    const noteValue = text.split(':')[1];
    if (noteName && noteValue) {
      const firstContent = {
        type: 'text',
        text: noteName,
        marks: [
          {
            type: 'mark-font-type',
            attrs: {
              name: 'Times New Roman',
            },
          },
          {
            type: 'mark-font-size',
            attrs: {
              pt: 12,
            },
          },
          {
            type: 'em',
            attrs: { overridden: true },
          },
        ],
      };
      element.content.push(firstContent, {
        type: 'text',
        text: noteValue,
        marks: [
          {
            type: 'mark-font-type',
            attrs: {
              name: 'Times New Roman',
            },
          },
          {
            type: 'mark-font-size',
            attrs: {
              pt: 12,
            },
          },
        ],
      });
    } else {
      element.content.push({
        type: 'text',
        text: this.node.textContent,
        marks: [
          {
            type: 'mark-font-type',
            attrs: {
              name: 'Times New Roman',
            },
          },
          {
            type: 'mark-font-size',
            attrs: {
              pt: 12,
            },
          },
        ],
      });
    }
    return element;
  }
}

export class LicitParagraphElement extends LicitElement {
  getBaseElement(): LicitParagraphJSON {
    return {
      type: 'paragraph',
      attrs: {
        styleName: 'Normal',
      },
      content: [
        {
          type: 'text',
          text: '',
          marks: [
            {
              type: 'mark-font-type',
              attrs: {
                name: 'Times New Roman',
              },
            },
            {
              type: 'mark-font-size',
              attrs: {
                pt: 12,
              },
            },
          ],
        },
      ],
    };
  }

  text: string;
  align: string | null = null;
  constructor(text = '') {
    super();
    this.text = text;
  }

  render() {
    const element = this.getBaseElement();
    element.content[0].text = this.text; //SL-13
    return element;
  }
}

export class NewLicitParagraphElement extends LicitElement {
  text: string;
  align: string | null = 'Left';
  node: NodeList;
  marks: Mark[] = [];
  styleName = 'Normal';
  selectionId?: string;
  id?: string = '';
  capco?: string = '';
  indent = 0;
  name?: string = '';
  overriddenLineSpacing?: boolean = false;
  imgContent: string[] = [];
  lineSpacing?: string | null = null;
  overriddenLineSpaceingValue?: string | null = null;
  overriddenAlignValue?: string | null = null;
  overriddenAlign?: boolean = false;
  hangingindent?: boolean = false;
  reset?: boolean = null;
  constructor(
    node: HTMLElement,
    infoIconData?: HTMLOListElement[],
    renderedContentList?: Node[]
  ) {
    super();
    let className = node?.getAttribute('class');
    this.id = node?.getAttribute('id');
    this.setInnerlinks(node);
    className ??= node?.getAttribute('className');
    if (className?.toLowerCase() === 'acronym') {
      this.hangingindent = true;
      const rawText = node.textContent?.trim() || '';

      // Split at the first run of multiple spaces (limit to max 10 spaces)
      const parts = rawText.split(/\s{2,10}/);

      const shortForm = parts[0] ?? '';
      const expansion = parts[1] ?? '';

      // Clear the original content
      node.textContent = '';

      const shortNode = document.createElement('span');
      shortNode.className = 'acronym-short';
      shortNode.textContent = shortForm;

      const expansionNode = document.createElement('span');
      expansionNode.className = 'acronym-expansion';
      expansionNode.textContent = expansion;
      node.append(shortNode, expansionNode);
    }
    this.styleName = className || 'Normal';
    this.align = node?.getAttribute('align')
      ? node?.getAttribute('align')
      : 'Left';
    this.capco = getCapcoFromNode(node);
    if (undefined === this.selectionId || this.selectionId === '') {
      this.selectionId = uuid();
    }
    this.ConvertMarks(node, infoIconData, renderedContentList);
  }
  setInnerlinks(node: HTMLElement) {
    for (const n of Array.from(node?.childNodes ?? [])) {
      if (n.nodeName !== 'A') {
        continue;
      }

      const anchorElement = n as HTMLAnchorElement;
      const anchorId = anchorElement.getAttribute('id') || anchorElement.getAttribute('name');

      if (!anchorElement.href && anchorId) {

        this.name = anchorId;
        this.id = anchorId;
        this.selectionId = '#' + anchorId;
      }
    }
  }
  ConvertMarks(
    node: HTMLElement,
    infoIconData?: HTMLOListElement[],
    renderedContentList?: Node[]
  ) {
    let tMark: Mark[] = [];
    const inlineMarks = this.fetchInlineStyles(node);
    for (const n of Array.from(node?.childNodes ?? [])) {
      let mark_Colour: string;
      if (n.nodeName === 'A') {
        mark_Colour = (n as HTMLElement).getAttribute('color');
      }

      if (tMark.length > 0) {
        tMark = [];
      }
      this.modifyChildNodes(
        n as HTMLElement,
        infoIconData,
        tMark,
        mark_Colour,
        node,
        renderedContentList,
        inlineMarks
      );
    }
  }

  private handleTextMark(
    n: HTMLElement,
    getMark: (n: HTMLElement, data?: HTMLOListElement[]) => Mark | undefined,
    data?: HTMLOListElement[]
  ) {
    const mark: Mark = getMark(n, data);
    if (mark) {
      this.marks.push(mark);
    }
  }

  /**
   * Modifies and processes the child nodes of a given HTML element, applying various transformations
   * and extracting semantic marks based on the node type. Handles inline styles, anchors, strong/emphasis/underline tags,
   * superscript/subscript, text color/highlight, images, spans, and paragraphs. Updates mark collections and invokes
   * specialized parsing methods for each supported node type.
   *
   * @param n - The current HTML element node to process.
   * @param infoIconData - An array of HTMLOListElement objects containing info icon data.
   * @param tMark - An array of Mark objects representing text marks.
   * @param mark_Colour - The color to apply to marks.
   * @param node - The parent HTML element node.
   * @param renderedContentList - (Optional) An array of Node objects representing rendered content.
   * @param parentInlineMarks - (Optional) An array of Mark objects representing inline stlyes written for parent node.
   */
  modifyChildNodes(
    n: HTMLElement,
    infoIconData: HTMLOListElement[],
    tMark: Mark[],
    mark_Colour: string,
    node: HTMLElement,
    renderedContentList?: Node[],
    parentInlineMarks?: Mark[]
  ) {
    let em: Mark;
    let b: Mark;
    let myMark: Mark;
    let source: string;
    let altText: string;
    let u: Mark;
    const styleMarks: { type: string; attrs?: LicitAttrs }[] = [];

    if (parentInlineMarks && parentInlineMarks.length > 0) {
      styleMarks.push(...parentInlineMarks);
    }
    if (n.nodeType === Node.ELEMENT_NODE) {
      const childrenInlineStyles = this.fetchInlineStyles(n);
      styleMarks.push(...childrenInlineStyles);
    }
    switch (n.nodeName) {
      case 'FONT':
        this.parseFont(n, myMark, infoIconData, tMark);
        break;
      case 'A':
        this.parseAnchor(
          n as HTMLAnchorElement,
          myMark,
          mark_Colour,
          infoIconData,
          renderedContentList
        );
        break;
      case 'STRONG':
        myMark = {
          type: 'text',
          marks: [],
          text: node.textContent,
        };
        b = {
          type: 'strong',
          attrs: { overridden: true },
        };

        this.parseStrong(n, myMark, b, infoIconData);
        break;
      case 'EM':
        myMark = {
          type: 'text',
          marks: [],
          text: n.textContent,
        };
        em = {
          type: 'em',
          attrs: { overridden: true },
        };

        this.parseEmphisis(n, myMark, em, infoIconData);
        break;
      case 'U':
        myMark = {
          type: 'text',
          marks: [],
          text: '',
        };
        u = {
          type: 'underline',
          attrs: { overridden: true },
        };
        this.parseUnderline(n, myMark, u, infoIconData);

        break;
      case 'SUP':
        this.handleTextMark(
          n,
          (node, data) => this.getSuperScriptMarks(node, data),
          infoIconData
        );
        break;
      case 'SUB':
        if (n.innerText?.trim()) {
          this.marks.push(this.getSubscriptMarks(n));
        }
        break;
      //Case for text color and/or highlight
      case 'MARK-TEXT-HIGHLIGHT':
        this.handleTextMark(n, this.getHighLightAndTextColor);
        break;
      case 'TEXT':
      case '#text': {
        //Set boolean for First sentence bold logic
        const isFirstSentenceBold = checkFirstSentenceBold(node);
        this.handleText(n, myMark, isFirstSentenceBold, styleMarks);
        break;
      }
      case 'BR':
        myMark = {
          type: 'hard_break',
        };
        this.marks.push(myMark);
        break;
      case 'IMG': {
        const imgEl = n as HTMLImageElement;

        source = imgEl?.getAttribute('srcRelative') ?? imgEl?.src;
        altText = imgEl?.alt;

        const width = imgEl?.getAttribute('width') ?? null;
        const height = imgEl?.getAttribute('height') ?? null;
        const align = getElementAlignment(imgEl);
        this.parseImage(source, altText, myMark, width, height, align);
        break;
      }
      // Handling content inside span
      case 'SPAN':
        this.handleSpan(
          n,
          myMark,
          infoIconData,
          tMark,
          mark_Colour,
          renderedContentList,
          styleMarks
        );
        break;
      // Handling marks with header subtext (subtext is added as a child paragraph node of the header node)
      case 'P':
        this.handleParagraph(
          n,
          infoIconData,
          tMark,
          mark_Colour,
          renderedContentList
        );
        break;
    }
  }

  private handleParagraph(
    n: HTMLElement,
    infoIconData: HTMLOListElement[] | undefined,
    tMark: Mark[],
    mark_Colour: string,
    renderedContentList: Node[]
  ) {
    for (const cNode of Array.from(n.childNodes)) {
      //Subtext needs to be on the same line as that of header
      if (
        !(
          cNode.nodeType === Node.TEXT_NODE &&
          cNode.textContent.trim() === '' &&
          cNode.textContent.includes('\n')
        )
      ) {
        this.modifyChildNodes(
          cNode as HTMLElement,
          infoIconData,
          tMark,
          mark_Colour,
          n,
          renderedContentList
        );
      }
    }
  }

  private handleSpan(
    n: HTMLElement,
    myMark: Mark,
    infoIconData: HTMLOListElement[] | undefined,
    tMark: Mark[],
    mark_Colour: string,
    renderedContentList: Node[],
    styleMarks: { type: string; attrs?: LicitAttrs }[] = []
  ) {
    //Skipping hidden class
    if (n.className.toLowerCase() === 'hidden') {
      return;
    }
    if (this.isEmptySpaceSpan(n)) {
      this.addTrailingSpace();
    }
    if (myMark) {
      //Adding mark for hyperLinks
      if (myMark.type == 'text' && myMark.text) {
        this.setLink(myMark);
      }
      this.marks.push(myMark);
    } else {
      for (const cNode of Array.from(n.childNodes)) {
        this.modifyChildNodes(
          cNode as HTMLElement,
          infoIconData,
          tMark,
          mark_Colour,
          n,
          renderedContentList,
          styleMarks
        );
      }
    }
  }

  isEmptySpaceSpan(node: HTMLElement) {
    const hasOnlySpace =
      node.textContent === '\u00A0' || node.textContent === ' ';
    const hasLetterSpacing = node.style.letterSpacing !== '';
    return hasOnlySpace && hasLetterSpacing;
  }
  isLastCharNotEmpty(str) {
    if (str.length === 0) return false;
    return str.at(-1).trim() !== '';
  }
  addTrailingSpace() {
    if (this.marks.at(-1)) {
      const text = this.marks.at(-1).text;
      if (this.isLastCharNotEmpty(text)) {
        this.marks.at(-1).text += ' ';
      }
    }
  }
  // To find text with URLs
  handleText(
    textNode: HTMLElement,
    myMark: Mark,
    isFirstSentenceBold: boolean,
    styleMarks?: { type: string; attrs?: LicitAttrs }[]
  ) {
    const textContent = textNode.textContent;
    const urlRegex = /(https?:\/\/[^\s]{1,2048})/g;
    const matches = this.checkForLinks(textContent, urlRegex);
    if (matches) {
      this.addLinks(textContent, urlRegex, myMark);
    } else {
      // If no URLs, add normal text
      const textMark: Mark = {
        type: 'text',
        marks: [],
        text: textContent,
      };
      // Apply inline styles if any
      if (styleMarks && styleMarks.length > 0) {
        for (const styleMark of styleMarks) {
          textMark.marks.push(styleMark);
        }
      }
      if (isFirstSentenceBold) {
        const b: Mark = {
          type: 'strong',
          attrs: { overridden: true },
        };
        textMark.marks?.push(b);
      }
      this.addMark(textMark, myMark);
      if (textNode?.parentElement?.className === 'acronym-short') {
        const acronymMark: Mark = {
          type: 'mark-hanging-indent',
          attrs: { prefix: 0, overridden: true },
        };
        textMark.marks?.push(acronymMark);
      }
      if (textNode?.parentElement?.className === 'acronym-expansion') {
        const acronymMark: Mark = {
          type: 'mark-hanging-indent',
          attrs: { prefix: 1, overridden: true },
        };
        textMark.marks?.push(acronymMark);
      }
      this.marks.push(textMark);
    }
  }
  checkForLinks(text: string, urlRegex: RegExp): RegExpMatchArray {
    return urlRegex.exec(text);
  }
  addLinks(text: string, urlRegex: RegExp, myMark: Mark) {
    const parts = text.split(urlRegex);

    for (const part of parts) {
      if (urlRegex.test(part)) {
        // If it's a URL, create a link mark
        const linkMark: Mark = {
          type: 'text',
          marks: [
            {
              type: 'link',
              attrs: {
                href: part,
                target: '_blank',
                rel: 'noopener noreferrer',
              },
            },
          ],
          text: part,
        };
        this.addMark(linkMark, myMark);
        this.marks.push(linkMark);
      } else {
        // Otherwise, add as normal text
        const textMark: Mark = {
          type: 'text',
          marks: [],
          text: part,
        };
        this.addMark(textMark, myMark);
        this.marks.push(textMark);
      }
    }
  }
  addMark(textMark: Mark, newMark: Mark) {
    for (const mark of newMark?.marks ?? []) {
      textMark.marks.push(mark);
    }
    return textMark;
  }

  /**
   * Extracts inline style marks from a DOM node and returns an array of mark objects.
   *
   * This function parses the `style` attribute of the given node, identifies supported inline styles
   * (such as italic, bold, underline, text color, line height, and text alignment), and returns
   * corresponding mark objects with their attributes. It also updates certain instance properties
   * for overridden line spacing and alignment when those styles are detected.
   *
   * @param node - The DOM node from which to extract inline styles.
   * @returns An array of objects representing inline style marks, each with a `type` and optional `attrs`.
   */
  fetchInlineStyles(node: HTMLElement): { type: string; attrs?: LicitAttrs }[] {
    const inlineMarks: { type: string; attrs?: LicitAttrs }[] = [];
    if (node?.style?.length > 0) {
      const nodeStyles: string[] = node.getAttribute('style')?.split(';');
      if (nodeStyles?.length > 0) {
        const inlineStyles: string[] = getInlineStylesArray(nodeStyles);
        if (inlineStyles.length > 0 && node.textContent !== '') {
          this.mapInlineStylesToMarks(inlineStyles, inlineMarks);
        }
      }
    }
    if (node?.getAttribute('align')) {
      const alignmentValue = node.getAttribute('align').toLowerCase();
      this.overriddenAlign = true;
      this.align = alignmentValue;
      this.overriddenAlignValue = alignmentValue;
    }
    return inlineMarks;
  }

  mapInlineStylesToMarks(
    inlineStyles: string[],
    inlineMarks: { type: string; attrs?: LicitAttrs }[]
  ) {
    for (const inlineStyle of inlineStyles) {
      switch (inlineStyle.toLowerCase()) {
        case 'italic': {
          const em: { type: string; attrs?: LicitAttrs } = {
            type: 'em',
            attrs: { overridden: true },
          };
          inlineMarks.push(em);
          break;
        }
        case 'bold': {
          const b: Mark = { type: 'strong', attrs: { overridden: true } };
          inlineMarks.push(b);
          break;
        }
        case 'underline': {
          const u: Mark = {
            type: 'underline',
            attrs: { overridden: true },
          };
          inlineMarks.push(u);
          break;
        }
        default: {
          this.handleCustomInlineStyle(inlineStyle, inlineMarks);
          break;
        }
      }
    }
  }

  handleCustomInlineStyle(
    inlineStyle: string,
    inlineMarks: { type: string; attrs?: LicitAttrs }[]
  ): void {
    const BASE_FONT_SIZE_PT = 12;

    if (inlineStyle.startsWith('color-')) {
      const colorValue = inlineStyle.replace('color-', '');
      if (CSS.supports('color', colorValue)) {
        inlineMarks.push({
          type: 'mark-text-color',
          attrs: { color: colorValue, overridden: true },
        });
      }
    } else if (inlineStyle.startsWith('line-height-')) {
      const lineHeightValue = inlineStyle.replace('line-height-', '');
      const ptValue = Number.parseFloat(lineHeightValue);
      if (!Number.isNaN(ptValue)) {
        const percentage = (ptValue / BASE_FONT_SIZE_PT) * 100 + '%';
        this.overriddenLineSpacing = true;
        this.lineSpacing = percentage;
        this.overriddenLineSpaceingValue = percentage;
      }
    } else if (inlineStyle.startsWith('text-align-')) {
      const alignValue = inlineStyle.replace('text-align-', '');
      this.overriddenAlign = true;
      this.align = alignValue;
      this.overriddenAlignValue = alignValue;
    }
  }

  private parseImage(
    source: string,
    altText: string,
    myMark: Mark,
    width?: string,
    height?: string,
    align?: string
  ) {
    if (source) {
      const img = new LicitImageElement(source, altText, width, height, align);
      if (img) {
        this.marks.push(img.render());
      }

      if (altText === '/ERR:Unsupported Image Format x-emf') {
        myMark = {
          type: 'text',
          marks: [
            { type: 'strong', attrs: { overridden: true } },
            {
              type: 'mark-text-color',
              attrs: { color: '#f20d0d', overridden: true },
            },
          ],
          text: '/ERR:Unsupported Image Format x-emf',
        };
        this.marks.push(myMark);
      }
    }
    return myMark;
  }

  private parseUnderline(
    n: Element,
    myMark: Mark,
    u: Mark,
    infoIconData: HTMLOListElement[]
  ) {
    if (n.childNodes.length === 1) {
      myMark?.marks.push(u);
      myMark = this.parseSubMarks(n.childNodes[0], myMark, true, infoIconData);
      if (myMark) {
        this.marks.push(myMark);
      }
    } else {
      for (const unodes of Array.from(n.childNodes)) {
        if (unodes.nodeName === 'TEXT' || unodes.nodeName === '#text') {
          const subMark = {
            type: 'text',
            marks: [],
            text: '',
          };
          subMark.marks.push(u);
          subMark.text = unodes.textContent;
          this.marks.push(subMark);
        } else {
          myMark?.marks.push(u);
          myMark = this.parseSubMarks(unodes, myMark, false, infoIconData);
          if (myMark) {
            this.marks.push(myMark);
          }
        }
      }
    }
    return myMark;
  }

  private parseEmphisis(
    n: HTMLElement,
    myMark: Mark,
    em: Mark,
    infoIconData: HTMLOListElement[]
  ) {
    if (n.childNodes.length === 1) {
      myMark?.marks.push(em);
      myMark = this.parseSubMarks(n.childNodes[0], myMark, true, infoIconData);
      if (myMark) {
        this.marks.push(myMark);
      }
    } else {
      for (const enodes of Array.from(n.childNodes)) {
        if (enodes.nodeName === 'TEXT' || enodes.nodeName === '#text') {
          const subMark = {
            type: 'text',
            marks: [],
            text: '',
          };
          subMark.marks.push(em);
          subMark.text = enodes.textContent;
          this.marks.push(subMark);
        } else {
          myMark?.marks.push(em);
          myMark = this.parseSubMarks(enodes, myMark, false, infoIconData);
          if (myMark) {
            this.marks.push(myMark);
          } else if (enodes.textContent === ' ')
            this.marks.push(this.getEmptyTextMark());
        }
      }
    }
    //Handling superscript and subscript with class name
    this.handleClassName(n.className, myMark);
    return myMark;
  }

  private parseStrong(
    n: HTMLElement,
    myMark: Mark,
    b: Mark,
    infoIconData: HTMLOListElement[]
  ) {
    if (n.childNodes.length === 1) {
      myMark?.marks.push(b);
      myMark = this.parseSubMarks(n.childNodes[0], myMark, true, infoIconData);
      if (myMark) {
        this.marks.push(myMark);
      }
    } else {
      for (const bnodes of Array.from(n.childNodes)) {
        if (bnodes.nodeName === 'TEXT' || bnodes.nodeName === '#text') {
          const subMark = {
            type: 'text',
            marks: [],
            text: '',
          };
          subMark.marks.push(b);
          subMark.text = bnodes.textContent;
          this.marks.push(subMark);
        } else {
          myMark?.marks.push(b);
          myMark = this.parseSubMarks(bnodes, myMark, false, infoIconData);
          if (myMark) {
            this.marks.push(myMark);
          } else {
            const subMark = {
              type: 'text',
              marks: [],
              text: ' ',
            };
            this.marks.push(subMark);
          }
        }
      }
    }
    return myMark;
  }

  private parseAnchor(
    n: HTMLAnchorElement,
    myMark: Mark,
    mark_Colour: string,
    infoIconData: HTMLOListElement[],
    renderedContentList?: Node[]
  ) {
    if (n.id === '_LINK_TO_THIS' || n.textContent.trim() === '') {
      return myMark;
    }
    let selectionIdModified: string;
    let content: string;
    myMark = {
      type: 'text',
      marks: [],
      text: n.textContent,
    };
    const isFirstSentenceBold = checkFirstSentenceBold(n.parentElement);
    if (isFirstSentenceBold) {
      const b: Mark = {
        type: 'strong',
        attrs: { overridden: true },
      };
      myMark.marks?.push(b);
    }
    if (n.hash == '') {
      selectionIdModified = '';
      content = '';
    } else {
      selectionIdModified = n.hash;
      if (renderedContentList?.length > 0) {
        const firstElement = renderedContentList[0];
        content = (firstElement as HTMLAnchorElement).innerText;
        renderedContentList.shift();
      }
    }

    const href = content?.trim?.() ? content : (n.href ?? '');
    const isLink = href && href.trim() !== '';

    const lnk = isLink
      ? {
        type: 'link',
        attrs: {
          href: href,
          rel: n.rel,
          target: 'blank',
          title: null,
          selectionId: selectionIdModified,
        },
      }
      : null;
    const clr = {
      type: 'mark-text-color',
      attrs: {
        color: mark_Colour,
        overridden: true,
      },
    };

    if (n.childNodes.length === 1) {
      this.applyLinkAndColorMarks(myMark, lnk, clr, mark_Colour);
      myMark = this.parseSubMarks(n.childNodes[0], myMark, true, infoIconData);
      if (myMark) {
        this.marks.push(myMark);
      }
    } else {
      for (const enodes of Array.from(n.childNodes)) {
        myMark = this.parseLinkText(
          enodes as HTMLLinkElement,
          lnk,
          mark_Colour,
          clr,
          myMark,
          infoIconData
        );
      }
    }
    return myMark;
  }

  private applyLinkAndColorMarks(
    myMark: Mark,
    lnk: Mark | null,
    clr: Mark,
    mark_Colour: string
  ) {
    if (lnk) {
      myMark?.marks.push(lnk);
      if (mark_Colour) {
        myMark?.marks.push(clr);
      }
    }
  }

  private parseLinkText(
    enodes: HTMLLinkElement,
    lnk: Mark,
    mark_Colour: string,
    clr: Mark,
    myMark: Mark,
    infoIconData: HTMLOListElement[]
  ) {
    if (enodes.nodeName === 'TEXT' || enodes.nodeName === '#text') {
      const subMark = {
        type: 'text',
        marks: [],
        text: '',
      };
      subMark.marks.push(lnk);
      if (mark_Colour) {
        subMark.marks.push(clr);
      }
      subMark.text = enodes.textContent;
      this.marks.push(subMark);
    } else if (enodes.textContent.trim() !== '') {
      myMark?.marks.push(lnk);
      if (mark_Colour) {
        myMark?.marks.push(clr);
      }
      myMark = this.parseSubMarks(enodes, myMark, false, infoIconData);
      if (myMark) {
        this.marks.push(myMark);
      }
    }
    return myMark;
  }
  private setLink(myMark: Mark) {
    const urlRegex = /(https?:\/\/[^\s]{1,2048})/g;
    if (urlRegex.test(myMark.text)) {
      const linkMark: Mark = {
        type: 'link',
        attrs: {
          href: myMark.text,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      };
      myMark.marks.push(linkMark);
    }
  }
  private parseFont(
    n,
    myMark: Mark,
    infoIconData: HTMLOListElement[],
    tMark: Mark[]
  ) {
    if (!this.hasFontDetails(n)) {
      return myMark;
    }
    myMark = {
      type: 'text',
      marks: [],
      text: n.textContent,
    };
    const f = {
      type: 'mark-font-type',
      attrs: {
        name: n.getAttribute?.('style')
          ? n.getAttribute('style').valueOf(0).split(':')[1]
          : n.parentNode.getAttribute('style').valueOf(0).split(':')[1],
      },
    };

    if (n.childNodes.length === 1) {
      myMark?.marks.push(f);
      return this.parseSubMarks(n.childNodes[0], myMark, true, infoIconData);
    }
    let subMark: Mark;
    let innerFontMark: Mark;
    myMark?.marks.push(f);
    for (const fnodes of n.childNodes) {
      if (fnodes.nodeName === 'IMG') {
        return;
      }
      if (fnodes.nodeName === 'TEXT' || fnodes.nodeName === '#text') {
        subMark = {
          type: 'text',
          marks: [],
          text: '',
        };
        subMark.marks.push(f);
        subMark.text = fnodes.textContent;
        tMark.push(subMark);
      } else if (fnodes.nodeName === 'FONT') {
        innerFontMark = {
          type: 'text',
          marks: [],
          text: '',
        };
        myMark = this.parseSubMarks(fnodes, innerFontMark, false, infoIconData);
        if (myMark?.text && myMark.text.trim() !== '') {
          tMark.push(myMark);
        }
      } else {
        myMark = this.parseSubMarks(fnodes, myMark, false, infoIconData);
      }
    }
    return myMark;
  }
  //Handling superscript and subscript with class name
  handleClassName(className: string, mark: Mark) {
    if (className == 'superscript') {
      const m = {
        type: 'super',
        attrs: {
          overridden: true,
        },
      };
      mark?.marks.push(m);
    } else if (className == 'subscript') {
      const m = {
        type: 'sub',
        attrs: {
          overridden: true,
        },
      };
      mark?.marks.push(m);
    }
  }
  getEmptyTextMark() {
    return {
      type: 'text',
      marks: [],
      text: ' ',
    };
  }
  hasFontDetails(n: HTMLElement): boolean {
    let bOk = false;
    if (n.getAttribute?.('style')) {
      bOk = true;
    }
    if (!bOk && (n.parentNode as HTMLElement).getAttribute?.('style')) {
      bOk = true;
    }
    return bOk;
  }

  parseSubMarks(
    n,
    mark: Mark,
    _hasOneChild: boolean,
    infoIconData?: HTMLOListElement[]
  ) {
    let retMark: Mark = null;
    let mark_Colour: string;
    let em: Mark;
    if (n.nodeName === 'A') {
      mark_Colour = n.getAttribute('color');
    }
    if (n.nodeName === 'BR') {
      return;
    }
    switch (n.nodeName) {
      case 'FONT':
        retMark = this.parseFontWithInfoicon(n, mark, retMark, infoIconData);
        break;
      case 'MARK-TEXT-HIGHLIGHT':
        this.handleTextMark(n as HTMLElement, this.getHighLightAndTextColor);
        break;
      case 'TEXT':
      case '#text':
        if (mark === null || mark === undefined) {
          // ignore
        }
        if (mark) {
          retMark = {
            type: 'text',
            marks: mark?.marks,
            text: n.textContent,
          };
        } else {
          retMark = {
            type: 'text',
            text: n.textContent,
          };
        }
        break;
      case 'A':
        retMark = this.parseAnchorWithInfoIcon(
          n,
          mark_Colour,
          mark,
          retMark,
          infoIconData
        );
        break;
      case 'STRONG':
        retMark = this.parseStrongWithInfoicon(n, mark, retMark, infoIconData);
        break;
      case 'EM':
        retMark = this.parseEMWithInfoicon(n, em, mark, retMark, infoIconData);
        break;
      case 'U':
        retMark = this.parseUnderlineWithInfoicon(
          n,
          mark,
          retMark,
          infoIconData
        );

        break;
      case 'SUP':
        if (n.textContent.trim() !== '' && n.innerText.trim() !== '') {
          const sup = this.getSuperScriptMarks(n, infoIconData);
          retMark = sup || retMark;
        }
        break;
      case 'SUB':
        if (n.textContent.trim() !== '') {
          this.marks.push(this.getSubscriptMarks(n));
        }
        break;
    }

    return retMark;
  }

  private parseFontWithInfoicon(
    n,
    mark: Mark,
    retMark: Mark,
    infoIconData: HTMLOListElement[]
  ) {
    if (n.textContent.trim() === '') {
      return retMark;
    }
    if (this.hasFontDetails(n)) {
      const f = {
        type: 'mark-font-type',
        attrs: {
          name: n.getAttribute?.('style')
            ? n.getAttribute('style').valueOf(0).split(':')[1]
            : n.parentNode.getAttribute('style').valueOf(0).split(':')[1],
        },
      };

      if (n.childNodes.length === 1) {
        mark?.marks.push(f);
        retMark = this.parseSubMarks(n.childNodes[0], mark, true, infoIconData);
      } else {
        const m = mark?.marks.push(f);
        retMark = {
          type: 'text',
          marks: [],
        };
        if (!Number.isNaN(m)) {
          retMark = mark;
        }

        for (const enodes of n.childNodes) {
          retMark = this.parseSubMarks(enodes, retMark, false, infoIconData);
        }
      }
    }
    return retMark;
  }

  private parseUnderlineWithInfoicon(
    n: HTMLElement,
    mark: Mark,
    retMark: Mark,
    infoIconData: HTMLOListElement[]
  ) {
    if (n.textContent.trim() !== '') {
      const u = {
        type: 'underline',
        attrs: { overridden: true },
      };
      if (n.childNodes.length === 1) {
        mark?.marks.push(u);
        retMark = this.parseSubMarks(n.childNodes[0], mark, true, infoIconData);
      } else {
        mark?.marks.push(u);
        retMark = {
          type: 'text',
          marks: mark?.marks,
        };
        for (const unodes of Array.from(n.childNodes)) {
          retMark = this.parseSubMarks(unodes, retMark, false, infoIconData);
        }
      }
    }
    return retMark;
  }

  private parseEMWithInfoicon(
    n: HTMLElement,
    em: Mark,
    mark: Mark,
    retMark: Mark,
    infoIconData: HTMLOListElement[]
  ) {
    if (n.textContent.trim() !== '') {
      em = {
        type: 'em',
        attrs: { overridden: true },
      };

      if (n.childNodes.length === 1) {
        mark?.marks.push(em);
        retMark = this.parseSubMarks(n.childNodes[0], mark, true, infoIconData);
      } else {
        mark?.marks.push(em);
        retMark = {
          type: 'text',
          marks: mark?.marks,
        };
        for (const enodes of Array.from(n.childNodes)) {
          retMark = this.parseSubMarks(enodes, retMark, false, infoIconData);
        }
      }
    }
    return retMark;
  }

  private parseStrongWithInfoicon(
    n: HTMLElement,
    mark: Mark,
    retMark: Mark,
    infoIconData: HTMLOListElement[]
  ) {
    if (n.textContent.trim() === '') {
      return retMark;
    }
    const b = {
      type: 'strong',
      attrs: { overridden: true },
    };
    if (n.childNodes.length === 1) {
      mark?.marks.push(b);
      retMark = this.parseSubMarks(n.childNodes[0], mark, true, infoIconData);
    } else {
      mark?.marks.push(b);
      retMark = {
        type: 'text',
        marks: mark?.marks,
      };
      for (let bi = 0; bi < n.childNodes.length; bi++) {
        const bnodes = n.childNodes[bi];
        retMark = this.parseSubMarks(bnodes, retMark, false, infoIconData);
        if (retMark) {
          if (bi < n.childNodes.length - 1) {
            this.marks.push(retMark);
          }
        } else {
          retMark = {
            type: 'text',
            marks: mark?.marks,
          };
        }
      }
    }
    return retMark;
  }

  private parseAnchorWithInfoIcon(
    n: HTMLAnchorElement,
    mark_Colour: string,
    mark: Mark,
    retMark: Mark,
    infoIconData: HTMLOListElement[]
  ) {
    if (n.textContent.trim() !== '') {
      const lnk = {
        type: 'link',
        attrs: {
          href: n.href,
          rel: n.rel,
          target: 'blank',
          title: null,
        },
      };
      const clr = {
        type: 'mark-text-color',
        attrs: {
          color: mark_Colour,
          overridden: true,
        },
      };

      if (n.childNodes.length === 1) {
        mark?.marks.push(lnk);
        if (mark_Colour) {
          mark?.marks.push(clr);
        }
        retMark = this.parseSubMarks(n.childNodes[0], mark, true, infoIconData);
      } else {
        mark?.marks.push(lnk);
        if (mark_Colour) {
          mark?.marks.push(clr);
        }
        retMark = {
          type: 'text',
          marks: mark?.marks,
        };
        for (const enodes of Array.from(n.childNodes)) {
          retMark = this.parseSubMarks(enodes, retMark, false, infoIconData);
        }
      }
    }
    return retMark;
  }

  getBaseElement() {
    return {
      type: 'paragraph',
      attrs: {
        styleName: this.styleName,
        align: this.align,
        indent: this.indent,
        id: this.id ? this.id : '',
        capco: this.capco ? this.capco : '',
        selectionId: this.selectionId ? this.selectionId : undefined,
        overriddenLineSpacing: this.overriddenLineSpacing,
        lineSpacing: this.lineSpacing,
        overriddenLineSpaceingValue: this.overriddenLineSpaceingValue,
        overriddenAlignValue: this.overriddenAlignValue,
        overriddenAlign: this.overriddenAlign,
        hangingindent: this.hangingindent,
        reset: this.reset,
      },
      content: null,
    };
  }

  getBoldMarks(node: HTMLElement) {
    return {
      type: 'text',
      marks: [
        {
          type: 'strong',
          attrs: { overridden: true },
        },
      ],
      text: node.innerText,
    };
  }

  getEmMarks(node: HTMLElement, data?) {
    if (!node.childNodes) {
      return {
        type: 'text',
        marks: [
          {
            type: 'em',
            attrs: { overridden: true },
          },
        ],
        text: node.innerText,
      };
    }

    for (const childNode of Array.from(node.childNodes)) {
      if ((childNode as { id?: string }).id === 'infoIcon') {
        const infoMark = this.getEmInfoIconMark(childNode, data);
        if (infoMark) {
          return infoMark;
        }
      } else {
        return {
          type: 'text',
          marks: [
            {
              type: 'em',
              attrs: { overridden: true },
            },
          ],
          text: childNode.textContent,
        };
      }
    }
  }

  getEmInfoIconMark(childNode: ChildNode, data?): Mark | undefined {
    for (const infoNode of Array.from(childNode.childNodes)) {
      const infoID = (infoNode as { id?: string }).id;
      for (const dataNode of data[0].childNodes) {
        if (infoID === dataNode.id) {
          const infoDescription = dataNode.innerText;
          const infoIconClassData = infoDescription.includes(
            'Common access card required'
          )
            ? infoIconLockData
            : infoIconCircleData;
          return this.getInfoIconJson(infoDescription, infoIconClassData);
        }
      }
    }
    return undefined;
  }

  getUnderLineMarks(node: HTMLElement) {
    return {
      type: 'text',
      marks: [
        {
          type: 'underline',
          attrs: { overridden: true },
        },
      ],
      text: node.innerText,
    };
  }

  getSuperScriptMarks(node: HTMLElement, data?) {
    if (data && node.id === 'infoIcon') {
      const infoID = node.childNodes[0]['id'];
      for (const childNode of data[0].childNodes) {
        if (infoID === childNode?.id) {
          const infoDescription = childNode.innerText;
          const infoIconClassData = infoDescription.includes(
            'Common access card required'
          )
            ? infoIconLockData
            : infoIconCircleData;
          const InfoJson = this.getInfoIconJson(
            infoDescription,
            infoIconClassData
          );
          return InfoJson;
        }
      }
    } else {
      return {
        type: 'text',
        marks: [
          {
            type: 'super',
            attrs: { overridden: true },
          },
        ],
        text: node.innerText,
      };
    }
  }
  //Method for highlight and/or text color
  getHighLightAndTextColor(node: HTMLElement): Mark | undefined {
    const marks: { type: string; attrs?: LicitAttrs }[] = [];

    if (node.getAttribute('highlight-color')) {
      marks.push({
        type: 'mark-text-highlight',
        attrs: {
          highlightColor: node.getAttribute('highlight-color'),
          overridden: true,
        },
      });
    }
    if (node.getAttribute('color')) {
      marks.push({
        type: 'mark-text-color',
        attrs: {
          color: node.getAttribute('color'),
          overridden: true,
        },
      });
    }
    if (marks.length > 0) {
      return {
        type: 'text',
        marks,
        text: node.innerText,
      };
    }
    return undefined;
  }
  getSubscriptMarks(node: HTMLElement) {
    return {
      type: 'text',
      marks: [
        {
          type: 'sub',
          attrs: { overridden: true },
        },
      ],
      text: node.innerText,
    };
  }

  getLinkMarks(node: HTMLLinkElement) {
    return {
      type: 'text',
      marks: [
        {
          type: 'link',
          attrs: {
            href: node.href,
            rel: node.rel,
            target: 'blank',
            title: null,
          },
        },
      ],

      text: node.innerText,
    };
  }

  getText(node: HTMLElement) {
    return {
      type: 'text',
      text: node.innerText ? node.innerText : node.textContent,
    };
  }

  getInfoIconJson(infoDescription: string, Data: InfoIconData) {
    return {
      type: 'infoicon',
      attrs: {
        from: null,
        to: null,
        description: infoDescription,
        infoIcon: {
          name: Data.infoIconClass,
          unicode: Data.infoIconUnicode,
          selected: false,
        },
      },
    };
  }

  render() {
    const element = this.getBaseElement();

    element.content = this.marks;
    return element;
  }
}

export class LicitErrorTextElement extends LicitElement {
  getBaseElement() {
    return {
      type: 'paragraph',
      attrs: {
        align: 'center',
        color: null,
        id: null,
        indent: null,
        lineSpacing: null,
        paddingBottom: null,
        paddingTop: null,
      },
      content: [
        {
          type: 'text',
          marks: [
            { type: 'strong', attrs: { overridden: true } },
            {
              type: 'mark-text-color',
              attrs: { color: '#f20d0d', overridden: true },
            },
          ],
          text: this.text,
        },
      ],
    };
  }

  text: string;
  constructor(altText: string) {
    super();
    this.text = altText;
  }

  render() {
    const element = this.getBaseElement();
    return element;
  }
}

export class LicitBulletListItemElement extends LicitElement {
  getBaseElement(): LicitBulletListItemJSON {
    return {
      type: 'list_item',
      attrs: {},
      content: [],
    };
  }

  node: HTMLElement;
  constructor(_node: HTMLElement) {
    super();
    this.node = _node;
  }

  render(): LicitBulletListItemJSON {
    const element = this.getBaseElement();
    const paragraph = new NewLicitParagraphElement(this.node, null);
    element.content.push(paragraph.render());
    return element;
  }
}

export class LicitBulletListElement extends LicitElement {
  getBaseElement(): LicitBulletListJSON {
    return {
      type: 'bullet_list',
      attrs: {
        id: null,
        indent: this.indent,
        listStyleType: null,
      },
      content: [],
    };
  }

  listItems: LicitBulletListItemElement[] = [];
  indent = 0;
  constructor(indent: number) {
    super();
    this.indent = indent;
  }

  addItem(item: LicitBulletListItemElement) {
    this.listItems.push(item);
  }

  render(): LicitBulletListJSON {
    const element = this.getBaseElement();

    for (const item of this.listItems) {
      const obj = item.render();
      element.content.push(obj);
    }

    return element;
  }
}

export class LicitTableCellElement extends LicitElement {
  getBaseElement(): LicitTableCellJSON {
    return {
      type: 'table_cell',
      attrs: {
        colspan: 1,
        rowspan: 1,
        colwidth: this.colwidth,
        background: this.bgColor,
        vignette: false,
        fullSize: 0,
        vAlign: this.vAlign,
      },
      content: [
        {
          type: 'paragraph',
          attrs: {
            align: this.align,
          },
          content: [
            {
              type: 'text',
              text: '',
              marks: [
                {
                  type: 'mark-font-type',
                  attrs: {
                    name: 'Times New Roman',
                  },
                },
                {
                  type: 'mark-font-size',
                  attrs: {
                    pt: 12,
                  },
                },
              ],
            },
          ],
        },
      ],
    };
  }

  text: string;
  rowspan = 1;
  colspan = 1;
  bgColor: string;
  align: string;
  colwidth: [number];
  vAlign: string;
  constructor(
    text: string,
    bgColor?: string,
    alignment?: string,
    colWidth?: [number],
    verticalAlignment?: string
  ) {
    super();
    this.text = text;
    this.bgColor = bgColor;
    this.align = alignment;
    this.colwidth = colWidth;
    this.vAlign = verticalAlignment;
  }

  render(): LicitTableCellJSON {
    const element = this.getBaseElement();
    element.content[0].content[0].text = this.text;
    element.attrs.colspan = this.colspan;
    element.attrs.rowspan = this.rowspan;
    element.attrs.background = this.bgColor;
    element.attrs.vAlign = this.vAlign;
    return element;
  }
}

export class LicitTableCellParagraph extends LicitElement {
  getBaseElement() {
    return {
      type: 'table_cell',
      attrs: {
        colspan: 1,
        rowspan: 1,
        colwidth: this.colWidth,
        background: this.bgColor,
        vAlign: this.vAlign,
      },
      content: [],
    };
  }

  node: HTMLElement;
  rowspan = 1;
  colspan = 1;
  bgColor: string;
  colWidth: [number];
  content = [];
  vAlign: string;
  cellStyleInfo?: CellStyleInfo;
  constructor(
    node: HTMLElement,
    bgColor?: string,
    colwidth?: [number],
    vericalAlignment?: string,
    cellStyleInfo?: CellStyleInfo,
  ) {
    super();
    this.bgColor = bgColor;
    this.colWidth = colwidth;
    this.vAlign = vericalAlignment;
    this.cellStyleInfo = cellStyleInfo;
    const paragraph = new NewLicitParagraphElement(node, null);
    if (paragraph) {
      this.content.push(paragraph.render());
    }
  }

  render() {
    const element = this.getBaseElement();
    element.content = this.content;
    element.attrs.colspan = this.colspan;
    element.attrs.rowspan = this.rowspan;
    element.attrs.background = this.bgColor;
    element.attrs.vAlign = this.vAlign;
    return element;
  }
}

export class NewLicitTableCellParagraph extends LicitElement {
  getBaseElement() {
    const defaultColWidth = 100;
    const defaultBgColor = '#FFFFFF';

    return {
      type: 'table_cell',
      attrs: {
        colspan: 1,
        rowspan: 1,
        colwidth: this.colWidth || defaultColWidth,
        background: this.bgColor || defaultBgColor,
        vAlign: this.vAlign || 'top',
      },
      content: [],
    };
  }

  node: HTMLElement;
  rowspan = 1;
  colspan = 1;
  bgColor: string;
  colWidth: [number];
  content = [];
  vAlign: string;
  constructor(
    node: HTMLElement,
    bgColor?: string,
    colwidth?: [number],
    vericalAlignment?: string
  ) {
    super();
    this.vAlign = vericalAlignment;
    this.bgColor = bgColor;
    this.colWidth = colwidth;

    const paragraph = new NewLicitParagraphElement(node, null);
    //paraElement
    if (paragraph) {
      this.content.push(paragraph.render());
    }
  }

  render() {
    const baseElement = this.getBaseElement();
    baseElement.content = this.content;
    baseElement.attrs = {
      ...baseElement.attrs,
      colspan: this.colspan,
      rowspan: this.rowspan,
      background: this.bgColor,
      vAlign: this.vAlign,
    };
    return baseElement;
  }
}

export class LicitTableCellImageElement extends LicitElement {
  getBaseElement(): LicitTableCellImageJSON {
    return {
      type: 'table_cell',
      attrs: {
        colspan: 1,
        rowspan: 1,
        colwidth: this.colWidth,
        borderColor: null,
        borderLeft: null,
        borderRight: null,
        borderBottom: null,
        borderTop: null,
        background: this.bgColor,
        vignette: false,
        fullSize: this.fillImg,
      },
      content: [
        {
          type: 'paragraph',
          attrs: {
            styleName: 'Normal',
          },
          content: [
            {
              type: 'image',
              attrs: {
                align: 'center',
                alt: this.alt,
                crop: null,
                height: this.height,
                rotate: null,
                src: this.src,
                title: null,
                width: null,
                fitToParent: this.fitToParent,
              },
            },
          ],
        },
      ],
    };
  }

  text: string;
  src: string;
  rowspan = 1;
  colspan = 1;
  height: string;
  bgColor: string;
  colWidth: [number];
  alt: string;
  fillImg: number;
  fitToParent: number;
  cellStyleInfo?: CellStyleInfo;

  constructor(
    src: string,
    fillImg: number,
    fitToParent: number,
    bgColor?: string,
    imgHeight?: string,
    colWidth?: [number],
    alt?: string,
    cellStyleInfo?: CellStyleInfo,
  ) {
    super();

    this.src = src;
    this.bgColor = bgColor;
    this.height = imgHeight;
    this.colWidth = colWidth;
    this.alt = alt;
    this.fillImg = fillImg;
    this.fitToParent = fitToParent;
    this.cellStyleInfo = cellStyleInfo;
  }

  render(): LicitTableCellImageJSON {
    const element = this.getBaseElement();
    element.attrs.colspan = this.colspan;
    element.attrs.rowspan = this.rowspan;
    element.attrs.colwidth = this.colWidth;
    element.attrs.background = this.bgColor;
    return element;
  }
}

export class LicitVignetteElement extends LicitElement {
  getBaseElement() {
    const width = '0.25px';
    const style = 'solid';
    const cssValue = `${width} ${style} ${this.borderColor}`;

    return {
      type: 'table_cell',
      attrs: {
        colspan: 1,
        rowspan: 1,
        colwidth: this.width,
        borderColor: this.borderColor,
        borderTop: cssValue,
        borderBottom: cssValue,
        borderLeft: cssValue,
        borderRight: cssValue,
        background: this.bgColor,
        vignette: true,
      },
      content: [],
    };
  }

  text: string;
  src: string;
  rowspan = 1;
  colspan = 1;
  borderColor: string;
  bgColor: string;
  isVignet: boolean;
  width: number[] = [];
  content = [];

  constructor(
    node: Element,
    borderColor: string,
    bgColor: string,
    width: number
  ) {
    super();
    this.borderColor = borderColor === '#undefined' ? '#36598d' : borderColor;
    this.bgColor = bgColor || '#dce6f2';
    this.width = [width];
    this.ConvertElements(node);
  }

  ConvertElements(node: Element) {
    for (const n of Array.from(node.childNodes)) {
      //SL-1
      switch (n.nodeName) {
        case 'P': {
          const paragraph = new NewLicitParagraphElement(
            n as HTMLElement,
            null
          );
          if (paragraph) {
            this.content.push(paragraph.render());
          }
          break;
        }

        case 'DIV': {
          this.convertDiv(n);
          break;
        }

        case 'SPAN': {
          for (const pNode of Array.from(n.childNodes)) {
            this.handleVignetteSpan(pNode);
          }
          break;
        }

        case 'IMG': {
          const imgNode = n as HTMLImageElement;
          const source = imgNode?.src;
          if (!source) break;

          const alt = imgNode?.alt;
          const width = imgNode?.getAttribute('width');
          const height = imgNode?.getAttribute('height');

          const imgElement = new LicitParagraphImageElement(
            source,
            alt,
            width,
            height
          );
          this.content.push(imgElement.render());
          break;
        }
      }
    }
  }

  private convertDiv(n: ChildNode) {
    for (const childNode of Array.from(n.childNodes)) {
      if (childNode.nodeName === 'SPAN') {
        this.processSpanChildren(childNode);
      } else if (childNode.nodeName === 'DIV') {
        this.processDivChildren(childNode);
      }
    }
  }

  private processSpanChildren(spanNode: ChildNode) {
    for (const grandChildNode of Array.from(spanNode.childNodes)) {
      this.handleVignetteSpan(grandChildNode);
    }
  }

  private processDivChildren(divNode: ChildNode) {
    for (const grandChildNode of Array.from(divNode.childNodes)) {
      if (grandChildNode.nodeName !== 'SPAN') {
        return;
      }
      for (const sNode of Array.from(grandChildNode.childNodes)) {
        this.handleVignetteSpan(sNode);
      }
    }
  }

  handleVignetteSpan(pNode) {
    let paragraph;
    switch (pNode.nodeName) {
      case 'P':
        paragraph = new NewLicitParagraphElement(pNode, null);
        //paraElement
        if (paragraph) {
          this.content.push(paragraph.render());
        }
        break;
      case 'IMG': {
        const imgNode = pNode as HTMLImageElement;
        const source = imgNode?.src;
        const altText = imgNode?.alt;
        const width = imgNode?.getAttribute('width');
        const height = imgNode?.getAttribute('height');

        if (source) {
          const imgElement = new LicitParagraphImageElement(
            source,
            altText,
            width,
            height
          );
          this.content.push(imgElement.render());

          if (altText === '/ERR:Unsupported Image Format x-emf') {
            const errText = new LicitErrorTextElement(altText);
            this.content.push(errText.render());
          }
        }
        break;
      }
    }
  }

  render() {
    const element = this.getBaseElement();
    element.content = this.content;
    element.attrs.colspan = this.colspan;
    element.attrs.rowspan = this.rowspan;
    element.attrs.borderColor = this.borderColor;
    element.attrs.background = this.bgColor;
    element.attrs.colwidth = this.width;
    return element;
  }
}

export class LicitTableCellParaElement extends LicitElement {
  getBaseElement(): LicitTableCellJSON {
    const defaultColWidth = 120;
    const defaultBgColor = '#FFFFFF';
    return {
      type: this.isTableHeader ? 'table_header' : 'table_cell',
      attrs: {
        colspan: 1,
        rowspan: 1,
        colwidth: this.colWidth || defaultColWidth,
        background: this.bgColor || defaultBgColor,
        vAlign: this.vAlign || 'middle',
        cellWidth: this.cellStyleInfo?.cellWidth ?? null,
        cellStyle: this.cellStyleInfo?.className ?? null,
        fontSize: this.cellStyleInfo?.fontSize ?? null,
        letterSpacing: this.cellStyleInfo?.letterSpacing ?? null,
        marginTop: this.cellStyleInfo?.marginTop ?? null,
        marginBottom: this.cellStyleInfo?.marginBottom ?? null,
      },
      content: [],
    };
  }

  node: HTMLElement;
  rowspan = 1;
  colspan = 1;
  bgColor: string;
  colWidth: number[];
  content = [];
  vAlign: string;
  isTableHeader: boolean;
  isTransparentTable: boolean;
  cellStyleInfo?: CellStyleInfo;
  constructor(
    node: HTMLElement,
    bgColor?: string,
    colwidth?: [number],
    vericalAlignment?: string,
    isTableHeader?: boolean,
    isTransparentTable?: boolean,
    cellStyleInfo?: CellStyleInfo,
  ) {
    super();
    this.bgColor = bgColor;
    this.colWidth = colwidth;
    this.vAlign = vericalAlignment;
    this.isTableHeader = isTableHeader;
    this.isTransparentTable = isTransparentTable;
    this.cellStyleInfo = cellStyleInfo;
    this.ConvertElements(node);
  }

  ConvertElements(node: HTMLElement) {
    let i = 0;
    while (i < node.childNodes.length) {
      const childNode = node.childNodes[i];
      const nextChild = node.childNodes[i + 1];

      if (
        childNode.nodeType === Node.ELEMENT_NODE &&
        nextChild?.nodeType === Node.ELEMENT_NODE
      ) {
        if (
          shouldSkipNext((childNode as Element).className) &&
          !shouldSkipNext((nextChild as Element).className)
        ) {
          function updateTextContent(el: ChildNode) {
            for (const childNode of Array.from(el.childNodes)) {
              if (childNode.nodeType === Node.TEXT_NODE) {
                childNode.textContent += '. ';
              }
            }
          }
          updateTextContent(childNode);
          childNode.appendChild(nextChild);
        }
      }

      this.processChildNode(childNode);
      i++;
    }
  }
  processChildNode(childNode: ChildNode) {
    if (childNode.nodeName === 'P') {
      const paragraph = new NewLicitParagraphElement(
        childNode as HTMLElement,
        null
      );
      if (paragraph) {
        const renderedParagraph = paragraph.render();
        this.applyOverriddenCellTextMarks(renderedParagraph);
        this.content.push(renderedParagraph);
      }
    } else if (childNode.nodeName === 'IMG') {
      const imgElement = childNode as HTMLImageElement;
      const source = imgElement?.getAttribute('srcRelative') ?? imgElement?.src;
      if (!source) return;
      const alt = imgElement?.alt;
      const width = imgElement?.getAttribute('width');
      const height = imgElement?.getAttribute('height');
      const img = new LicitParagraphImageElement(source, alt, width, height);
      this.content.push(img.render());
    } else if (childNode.nodeName === 'OL') {
      this.processChildOL(childNode);
    } else if (childNode.nodeName === 'UL') {
      this.processChildUL(childNode);
    }
  }
  private applyOverriddenCellTextMarks(paragraph: LicitElementJSON) {
    const overriddenMarks = [this.getFontSizeMark(), this.getLetterSpacingMark()]
      .filter(Boolean) as { type: string; attrs?: LicitAttrs }[];

    if (overriddenMarks.length === 0 || !Array.isArray(paragraph?.content)) {
      return;
    }

    const overriddenMarkTypes = new Set(
      overriddenMarks.map((mark) => mark.type),
    );

    for (const contentNode of paragraph.content as Mark[]) {
      if (contentNode?.type !== 'text') {
        continue;
      }
      contentNode.marks ??= [];
      contentNode.marks = contentNode.marks.filter(
        (mark) => !overriddenMarkTypes.has(mark?.type),
      );
      contentNode.marks.push(...overriddenMarks);
    }
  }
  private getFontSizeMark(): { type: string; attrs?: LicitAttrs } | null {
    const rawFontSize = this.cellStyleInfo?.fontSize;
    if (!rawFontSize) {
      return null;
    }

    const pt = Number.parseFloat(rawFontSize);
    if (Number.isNaN(pt)) {
      return null;
    }

    return {
      type: 'mark-font-size',
      attrs: {
        pt,
        overridden: true,
      },
    };
  }

  private getLetterSpacingMark(): { type: string; attrs?: LicitAttrs } | null {
    const rawLetterSpacing = this.cellStyleInfo?.letterSpacing;
    if (!rawLetterSpacing) {
      return null;
    }

    const letterSpacing = rawLetterSpacing.trim();
    if (!letterSpacing) {
      return null;
    }

    return {
      type: 'mark-letter-spacing',
      attrs: {
        letterSpacing,
        overridden: true,
      },
    };
  }
  processChildOL(childNode: ChildNode) {
    const orderedList = new LicitOrderedListElement(0);
    const olText = childNode.textContent;
    if (olText && childNode.childNodes && childNode.childNodes.length > 0) {
      const childNodes = Array.from(
        (childNode as HTMLElement).childNodes
      ).filter((node) => (node as HTMLElement).tagName?.toLowerCase() === 'li');
      for (const n of childNodes) {
        n.textContent = this.removeNewLines(n.textContent);
        const bulletItem = new LicitBulletListItemElement(n as HTMLElement);
        orderedList.addItem(bulletItem);
      }
      this.content.push(orderedList.render());
    }
  }
  processChildUL(childNode: ChildNode) {
    const bulletList = new LicitBulletListElement(0);
    const ulText = childNode.textContent;
    if (ulText && childNode.childNodes && childNode.childNodes.length > 0) {
      const childNodes = Array.from(
        (childNode as HTMLElement).childNodes
      ).filter((node) => (node as HTMLElement).tagName?.toLowerCase() === 'p');
      for (const n of childNodes) {
        this.processTextNodes(n);
        const bulletItem = new LicitBulletListItemElement(n as HTMLElement);
        bulletList.addItem(bulletItem);
      }
    }
    this.content.push(bulletList.render());
  }

  processTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent = this.cleanupText(node.textContent);
      return;
    }
    const children = Array.from(node.childNodes);
    for (const child of children) {
      this.processTextNodes(child);
    }
  }

  cleanupText(text) {
    return this.removeBullets(this.removeNewLines(text));
  }
  removeNewLines(text: string) {
    return text.split('\n').join('');
  }
  removeBullets(text: string) {
    return text.split('•').join('');
  }

  render() {
    const element = this.getBaseElement();
    element.content = this.content;
    element.attrs.colspan = this.colspan;
    element.attrs.rowspan = this.rowspan;
    element.attrs.background = this.bgColor;
    //Adding border styles for transparent table
    if (this.isTransparentTable) {
      element.attrs.borderTop = '0.25px solid #ffffff';
      element.attrs.borderLeft = '0.25px solid #ffffff';
      element.attrs.borderRight = '0.25px solid #ffffff';
      element.attrs.borderBottom = '0.25px solid #000000';
    }
    element.attrs.colwidth = this.colWidth;
    return element;
  }
}

export class LicitTableRowElement extends LicitElement {
  height?: string;
  rowHeight?: string;
  getBaseElement(): LicitTableRowJSON {
    return {
      type: 'table_row',
      attrs: {
        rowHeight: this.rowHeight,
      },
      content: [],

    };
  }

  cells: LicitTableCellElement[] = [];

  addCell(cell: LicitTableCellElement) {
    this.cells.push(cell);
  }

  render(): LicitTableRowJSON {
    const element = this.getBaseElement();

    for (const cell of this.cells) {
      element.content.push(cell.render());
    }

    return element;
  }
}

export class LicitTableElement extends LicitElement {
  getBaseElement(): LicitTableJSON {
    return {
      type: 'table',
      attrs: {
        marginLeft: null,
        vignette: this.isVignette,
        capco: this.capco,
        noOfColumns: this.noOfColumns ?? null,
        tableHeight: this.tableHeight ?? null,
      },
      content: [],
    };
  }

  rows: LicitTableRowElement[] = [];
  isVignette = false;
  capco?: string;
  noOfColumns?: number;
  tableHeight?: string;

  constructor(isVignette?: boolean, capco?: string) {
    super();
    this.isVignette = isVignette;
    this.capco = capco;
  }

  addRow(row: LicitTableRowElement) {
    this.rows.push(row);
  }

  render(): LicitTableJSON {
    const element = this.getBaseElement();

    for (const row of this.rows) {
      element.content.push(row.render());
    }

    return element;
  }
}
export class LicitEnhancedTableElement extends LicitElement {
  getBaseElement() {
    return {
      type: 'enhanced_table_figure',
      attrs: {
        id: '',
        figureType: 'table',
        orientation: this.orientation,
        maximized: false,
        isValidate: true,
      },
      content: [],
    };
  }
  body: LicitEnhancedTableFigureBodyElement;
  capco: LicitEnhancedTableFigureCapcoElement;
  notes: LicitEnhancedTableNotesElement;
  orientation: string;
  constructor(orientation = 'portrait') {
    super();
    this.orientation = orientation;
  }
  render() {
    const element = this.getBaseElement();
    if (this.body) {
      element.content.push(this.body.render());
    }
    if (this.notes) {
      element.content.push(this.notes.render());
    }
    if (this.capco) {
      element.content.push(this.capco.render());
    }
    return element;
  }

  addBody(bodyObj: LicitEnhancedTableFigureBodyElement) {
    this.body = bodyObj;
  }
  addCapco(capcoObj: LicitEnhancedTableFigureCapcoElement) {
    this.capco = capcoObj;
  }
  addNotes(notesObj: LicitEnhancedTableNotesElement) {
    this.notes = notesObj;
  }
  removeLastRow() {
    if (this.body?.table?.rows?.length > 0) {
      this.body.table.rows.pop();
    }
  }
}
export class LicitEnhancedTableFigureBodyElement extends LicitElement {
  table: LicitTableElement;
  getBaseElement() {
    return {
      content: [],
      type: 'enhanced_table_figure_body',
    };
  }

  render() {
    const element = this.getBaseElement();
    element.content.push(this.table.render());
    return element;
  }
  addTable(table: LicitTableElement) {
    this.table = table;
  }
}
export class LicitEnhancedTableFigureCapcoElement extends LicitElement {
  text: string;
  capco: string | null;
  getBaseElement() {
    return {
      type: 'enhanced_table_figure_capco',
      attrs: {
        form: 'long',
        capco: this.capco,
        style: '',
        isValidate: true,
      },
      content: [],
    };
  }
  constructor(capco: string) {
    super();
    this.text = ' ';
    this.capco = capco;
  }

  render() {
    const element = this.getBaseElement();
    element.attrs.capco = this.capco;
    element.content.push({
      type: 'text',
      text: this.text,
    });
    return element;
  }
}

export class LicitEnhancedTableNotesElement extends LicitElement {
  paragraphs: NewLicitParagraphElement[];

  constructor(paragraphNodes: HTMLElement[]) {
    super();
    this.paragraphs = paragraphNodes.map(
      (p) => new NewLicitParagraphElement(p)
    );
  }

  getBaseElement() {
    return {
      type: 'enhanced_table_figure_notes',
      attrs: {
        styleName: 'Normal',
      },
      content: [],
    };
  }

  render() {
    const element = this.getBaseElement();

    for (const p of this.paragraphs) {
      element.content.push(p.render());
    }

    return element;
  }
}

export class LicitHRElement extends LicitElement {
  getBaseElement(): LicitHRJSON {
    return {
      type: 'horizontal_rule',
      attrs: {
        pageBreak: null,
      },
    };
  }

  render(): LicitHRJSON {
    const element = this.getBaseElement();
    return element;
  }
}

export class LicitOrderedListElement extends LicitElement {
  getBaseElement(): LicitOrderedListJSON {
    return {
      type: 'ordered_list',
      attrs: {
        id: null,
        indent: this.indent,
        listStyleType: null,
      },
      content: [],
    };
  }

  listItems: LicitBulletListItemElement[] = [];

  indent = 0;
  constructor(indent: number) {
    super();
    this.indent = indent;
  }

  addItem(item: LicitBulletListItemElement) {
    this.listItems.push(item);
  }

  render(): LicitOrderedListJSON {
    const baseElement = this.getBaseElement();
    const renderedElement = { ...baseElement };

    for (const item of this.listItems) {
      const renderedItem = item.render();
      renderedElement.content.push(renderedItem);
    }

    return renderedElement;
  }
}

export function shouldSkipNext(className: string): boolean {
  const classesToSkip = [
    'chpara0',
    'chsubpara1',
    'attpara0',
    'attsubpara1',
    'FM_chpara0',
    'FM_attpara0',
    'FM_chsubpara1',
    'FM_attsubpara1',
  ];

  return classesToSkip.includes(className);
}

function checkFirstSentenceBold(parentNode: HTMLElement): boolean {
  return shouldSkipNext(parentNode?.className);
}
/**
 * Adds ". " to the end of the text if it doesn't already end with it.
 * @param {string} text - The input text to check.
 * @returns {string} The text ending with ". "
 */

function getInlineStylesArray(nodeStyles: string[]) {
  const inlineStyles: string[] = [];
  const stylesToInclude = new Set([
    'italic',
    'bold',
    'underline',
    'uppercase',
    'lowercase',
  ]);

  for (const styleArray of nodeStyles) {
    if (styleArray?.includes(':')) {
      const [styleType, styleValue] = styleArray
        .split(':')
        .map((s) => s.toLowerCase().trim());

      if (stylesToInclude.has(styleValue)) {
        inlineStyles.push(styleValue);
      } else if (styleType === 'line-height') {
        inlineStyles.push(`line-height-${styleValue}`);
      } else if (styleType === 'text-align') {
        inlineStyles.push(`text-align-${styleValue}`);
      } else if (styleType === 'color') {
        inlineStyles.push(`color-${styleValue}`);
      }
    }
  }
  return inlineStyles;
}
export function getElementAlignment(imgEl: Element) {
  const alignAttr = imgEl?.getAttribute('align');
  if (alignAttr) {
    return alignAttr;
  }
  // If no align attribute, check inline styles
  // Split by semicolon to get individual style declarations
  const styles = imgEl?.getAttribute('style')?.split(';') ?? [];
  for (const style of styles) {
    const parts = style.split(':');
    if (parts.length !== 2) {
      continue;
    }
    const property = parts[0].trim().toLowerCase();

    // Check for align or text-align properties
    if (property === 'align') {
      const value = parts[1].trim();
      return value;
    }
  }
  return null;
}
