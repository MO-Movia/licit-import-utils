/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import type { LicitDocumentJSON, LicitElement } from './licit-elements';
import {
  getElementAlignment,
  LicitBulletListElement,
  LicitBulletListItemElement,
  LicitDocumentElement,
  LicitEnhancedImageBodyElement,
  LicitEnhancedImageElement,
  LicitEnhancedTableElement,
  LicitEnhancedTableFigureBodyElement,
  LicitEnhancedTableFigureCapcoElement,
  LicitEnhancedTableNotesElement,
  LicitErrorTextElement,
  LicitHeaderElement,
  LicitHRElement,
  LicitNewImageElement,
  LicitOrderedListElement,
  LicitParagraphElement,
  LicitParagraphImageElement,
  LicitParagraphNote,
  LicitTableCellElement,
  LicitTableCellImageElement,
  LicitTableCellParaElement,
  LicitTableCellParagraph,
  LicitTableElement,
  LicitTableRowElement,
  LicitVignetteElement,
  NewLicitParagraphElement,
  shouldSkipNext,
} from './licit-elements';
import type { UpdatedCapco } from './capco.util';
import {
  getCapcoFromNode,
  safeCapcoParse,
  updateCapcoFromContent,
  removeCapcoTextFromNode,
} from './capco.util';
import type { MessageSink } from './types';

export interface ParserElement {
  node: Element;
  class: string;
  type: ParserElementType;
  level: number;
  subText: string;
}
interface ImageInfo {
  src: string;
  alt: string;
  width: number;
  height: number;
}
enum ParserElementType {
  ChapterTitle,
  ChapterSubtitle,
  ChapterFigureTitle,
  Header,
  Note,
  Paragraph,
  SectionTitle,
  TableTitle,
  FigureTitle,
  BulletListItem,
  OrderedListItem,
  Table,
  EnhancedTable,
  Figure,
  ChangeBarPara,
  hr,
  vignet,
  Uncategorized,
  infoIcon,
  NewFigureTitle,
}

export interface StyleInfo {
  styleName: string;
  styles?: {
    styleLevel?: number | string;
  };
}

export interface TransformConfig {
  customStylesUrl: string;
  replacementChars: { find: string; replace: string }[];
  replaceCharacters: boolean;
  stripSectionNumbers: boolean;
  replaceWithLinks: { find: string; href: string }[];
  messageSink?: MessageSink;
  customStyles: StyleInfo[];
}

export const DEFAULT_Config: TransformConfig = {
  customStylesUrl: 'styles/',
  replacementChars: [
    {
      find: '‘',
      replace: "'",
    },
    {
      find: '’',
      replace: "'",
    },
    {
      find: '“',
      replace: '"',
    },
    {
      find: '”',
      replace: '"',
    },
    {
      find: '±',
      replace: '+/-',
    },
  ],
  stripSectionNumbers: true,
  replaceCharacters: true,
  replaceWithLinks: [],
  customStyles: [],
};

export function asTransformConfig(config: Partial<TransformConfig> = {}) {
  config ??= {};
  return {
    ...DEFAULT_Config,
    ...config,
  };
}

export interface AddCellOptions {
  bgColor: string;
  isChapterHeader: boolean;
  verAlign: string;
  cellIndex: number;
  widthArray: number[];
  isTransparent: boolean;
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
export class LicitConverter {
  private readonly elementsParsedMap = new Map<string, boolean>();
  private elements: ParserElement[] = [];
  constructor(private readonly config: TransformConfig) {}
  public parseHTML(
    html: Document,
    isDoctorine: boolean,
    moDocType?: string
  ): LicitDocumentJSON {
    if (typeof html === 'string') {
      if (!isDoctorine) {
        this.sanitizeHTML(html);
      }
      html = new DOMParser().parseFromString(html, 'text/html');
    }
    let nodes: NodeListOf<Element>;
    if (isDoctorine) {
      nodes = html.querySelectorAll('body > *');
    } else {
      const firstChild = html.querySelector('body > *');
      if (firstChild.tagName === 'DIV') {
        nodes = html.querySelectorAll('body > div > *');
      } else {
        nodes = html.querySelectorAll('body > *');
      }
    }
    // to print all the nodes in console
    // this.printNodes(nodes, 0);
    this.elements = [];
    if (isDoctorine) {
      this.elementsParsedMap.clear();
      return this.render_doc(nodes, extractInfoIconData(html), moDocType);
    } else {
      return this.render(nodes);
    }
  }
  public parseFrameMakerHTML5(html: Element[]): LicitDocumentJSON {
    this.elements = [];
    if (!html?.length) {
      return undefined;
    }
    let parentDiv = html[0] as HTMLElement;
    if (parentDiv.tagName != 'DIV') {
      parentDiv = document.createElement('div');
      parentDiv.appendChild(html[0].cloneNode(true));
    }
    // skip first. First element is parent.
    for (const e of html.slice(1)) {
      parentDiv.appendChild(e.cloneNode(true));
    }
    const dom: HTMLElement = parentDiv;
    const nodes: NodeList =
      dom.tagName === 'DIV'
        ? dom.querySelectorAll('div > *')
        : dom.querySelectorAll('*');
    const renderedContentList = this.fetchRenderedContent(nodes);
    return this.render_FrameMakerHTML5_zip(
      nodes,
      extractInfoIconData(dom),
      null,
      renderedContentList
    );
  }

  private render_FrameMakerHTML5_zip(
    nodes: NodeList,
    infoIconData?: HTMLOListElement[],
    _moDocType?: string,
    renderedContentList?: Node[]
  ): LicitDocumentJSON {
    // Build elements, joining special cases
    this.handleNodes(nodes);
    let isNumberReseted = false;
    const licitDocument = new LicitDocumentElement();

    for (const e of this.elements) {
      this.updateChildCapcoContent(e);
      isNumberReseted = this.render_FrameMakerHTML5_zip_SwitchHelper(
        e,
        infoIconData,
        renderedContentList,
        isNumberReseted,
        licitDocument
      );
    }

    return licitDocument.render();
  }

  private render_FrameMakerHTML5_zip_SwitchHelper(
    e: ParserElement,
    infoIconData: HTMLOListElement[],
    renderedContentList: Node[],
    isNumberReseted: boolean,
    licitDocument: LicitDocumentElement
  ) {
    let resetNumbering = isNumberReseted;
    switch (e.type) {
      case ParserElementType.ChapterTitle:
      case ParserElementType.ChapterSubtitle:
      case ParserElementType.Header: {
        const n = e.node;
        if (n) {
          const paragraph = new NewLicitParagraphElement(
            n as HTMLElement,
            infoIconData,
            renderedContentList
          );
          if (e.subText.length > 0) {
            const subMark = {
              type: 'text',
              text: e.subText,
            };
            paragraph.marks.push(subMark);
          }
          //Reset numbering for first attachmentTitle
          if (n.className === 'attachmentTitle' && !resetNumbering) {
            resetNumbering = true;
            paragraph.reset = true;
          }
          licitDocument.appendElement(paragraph);
        }
        break;
      }

      case ParserElementType.Figure: {
        this.renderDocFigure(e, licitDocument);
        break;
      }

      case ParserElementType.BulletListItem: {
        this.renderDocBulletItems(e, licitDocument);
        break;
      }

      case ParserElementType.Paragraph:
        this.figureParagraphCase(
          e,
          licitDocument,
          infoIconData,
          renderedContentList
        );
        break;

      case ParserElementType.Note:
        this.figureNoteCase(e, licitDocument);
        break;

      case ParserElementType.Table: {
        this.renderDocTable(e, licitDocument);
        break;
      }
      case ParserElementType.EnhancedTable: {
        this.renderEnhancedTable(e, licitDocument);
        break;
      }
      case ParserElementType.TableTitle:
        this.figureTableTitleCase(e, licitDocument);
        break;

      case ParserElementType.FigureTitle:
        this.figureTitleCase(e, licitDocument);
        break;
      case ParserElementType.NewFigureTitle:
        this.renderNewFigureTitle(e, licitDocument);
        break;
      case ParserElementType.SectionTitle: {
        const styleName = e.node.getAttribute('class') ?? 'normal';
        const text = e.node.textContent;
        if (text) {
          const header = new LicitHeaderElement(
            text,
            '',
            0,
            styleName,
            getCapcoFromNode(e.node as HTMLElement) ?? '',
            e.node as HTMLElement
          );
          header.align = 'center';
          licitDocument.appendElement(header);
        }
        break;
      }

      default:
        console.warn(`Parser not configured to render element: ${e.class}`);
    }

    return resetNumbering;
  }

  private handleNodes(nodes: NodeList) {
    let skipCount = 0;

    for (let i = 0; i < nodes.length; i++) {
      if (skipCount > 0) {
        skipCount--;
        continue;
      }

      const node = nodes[i] as Element;
      const nextNode = nodes[i + 1] as Element;
      skipCount = this.handleNode(node, nextNode);
    }
  }

  private fetchRenderedContent(nodes: NodeList): Node[] {
    const renderedArr: Node[] = [];

    // Process paragraph nodes with anchor tags that have hash values
    const processParagraphNodes = (node: HTMLElement) => {
      const anchorTags = Array.from(node.getElementsByTagName('a'));
      for (const anchorTag of anchorTags) {
        if (anchorTag.hash && anchorTag.hash.trim() !== '') {
          renderedArr.push(node);
          break;
        }
      }
    };

    // Process ordered list nodes with specific anchor tag conditions
    const processOrderedListNodes = (node: HTMLElement): void => {
      const anchorTags = Array.from(node.getElementsByTagName('a'));
      for (let i = 0; i < anchorTags.length - 1; i++) {
        const currentAnchor = anchorTags[i];
        const nextAnchor = anchorTags[i + 2];

        const isInnerLink =
          currentAnchor?.parentElement?.innerHTML.includes('&nbsp;');
        if (isInnerLink && nextAnchor) {
          // Get the NAME from the first anchor
          const nameValue = currentAnchor.getAttribute('NAME');
          if (
            nameValue &&
            nameValue == Number.parseInt(nameValue, 10).toString()
          ) {
            // Set this NAME to the second anchor
            nextAnchor.setAttribute('NAME', nameValue);
            // Delete the current anchor node
            currentAnchor.remove();
            break;
          }
        }
      }
    };

    // Process each node based on its type
    for (const node of Array.from(nodes)) {
      if (node.nodeName === 'P') {
        processParagraphNodes(node as HTMLElement);
      } else if (node.nodeName === 'OL') {
        processOrderedListNodes(node as HTMLElement);
      }
    }

    return renderedArr;
  }

  private getCustomStyle(styleName: string): StyleInfo | undefined {
    return this.config.customStyles?.find((s) => s.styleName === styleName);
  }

  private handleOrderedListItem(
    e: ParserElement,
    licitDocument: LicitDocumentElement
  ) {
    const orderedList = new LicitOrderedListElement(0);
    const text = e.node.textContent;
    if (text) {
      const orderedItem = new LicitBulletListItemElement(e.node as HTMLElement);
      orderedList.addItem(orderedItem);
      orderedList.styleLevel = e.level;
      licitDocument.appendElement(orderedList);
    }
  }

  /**
   * Renders the HTML as a Licit JSON structure
   *
   * @returns The document as an `LicitDocumentJSON` object
   */
  private render(nodes: NodeListOf<Element>): LicitDocumentJSON {
    // Build elements, joining special cases
    this.buildElements(nodes);

    const licitDocument = new LicitDocumentElement();

    for (const e of this.elements) {
      this.renderSwitchHelper(e, licitDocument);
    }

    return licitDocument.render();
  }

  private renderSwitchHelper(
    e: ParserElement,
    licitDocument: LicitDocumentElement
  ) {
    switch (e.type) {
      case ParserElementType.ChapterTitle:
      case ParserElementType.ChapterSubtitle:
      case ParserElementType.Header: {
        this.renderHeader(e, licitDocument);
        break;
      }

      case ParserElementType.Figure: {
        const image = e.node.querySelector('img');
        const source = image?.src;
        const alt = image?.alt;
        const width = image?.getAttribute('width');
        const height = image?.getAttribute('height');
        const align = getElementAlignment(image);
        if (source) {
          // seybi excluded image
          const imageElement = new LicitParagraphImageElement(
            source,
            alt,
            width,
            height,
            align
          );
          licitDocument.appendElement(imageElement);
        }
        break;
      }

      case ParserElementType.OrderedListItem: {
        this.handleOrderedListItem(e, licitDocument);
        break;
      }

      case ParserElementType.BulletListItem: {
        const bulletList = new LicitBulletListElement(0);
        const text = e.node.textContent;
        if (text) {
          const bulletItem = new LicitBulletListItemElement(
            e.node as HTMLElement
          );
          bulletList.addItem(bulletItem);
          bulletList.styleLevel = e.level;
          licitDocument.appendElement(bulletList);
        }
        break;
      }

      case ParserElementType.Paragraph: {
        // SL-15
        this.renderParagraph(e, licitDocument);
        break;
      }

      case ParserElementType.Note: {
        const text = e.node.textContent;
        if (text) {
          const paragraph = new LicitParagraphElement(text);
          paragraph.styleLevel = 0;
          licitDocument.appendElement(paragraph);
        }
        break;
      }

      case ParserElementType.Table: {
        this.renderTable(e, licitDocument);
        break;
      }

      case ParserElementType.FigureTitle:
      case ParserElementType.TableTitle: {
        const text = e.node.textContent;
        const styleName = e.node.getAttribute('class') ?? 'normal';
        if (text) {
          const header = new LicitHeaderElement(
            text,
            '',
            0,
            styleName,
            getCapcoFromNode(e.node as HTMLElement) ?? '',
            e.node as HTMLElement
          );
          licitDocument.appendElement(header);
        }
        break;
      }

      case ParserElementType.SectionTitle: {
        const text = e.node.textContent;
        const styleName = e.node.getAttribute('class') ?? 'normal';
        if (text) {
          const header = new LicitHeaderElement(
            text,
            '',
            0,
            styleName,
            getCapcoFromNode(e.node as HTMLElement) ?? '',
            e.node as HTMLElement
          );
          header.align = 'center';
          licitDocument.appendElement(header);
        }
        break;
      }

      default:
        console.warn(`Parser not configured to render element: ${e.class}`);
    }
  }

  private renderTable(e: ParserElement, licitDocument: LicitDocumentElement) {
    const licitTable = new LicitTableElement();
    const table = e.node.querySelector('table');

    if (table) {
      const rows = table.querySelectorAll('tr');
      for (const row of Array.from(rows)) {
        const licitRow = new LicitTableRowElement();
        const cells = row.querySelectorAll('td');
        for (const cell of Array.from(cells)) {
          const rowspan = cell.rowSpan;
          const colspan = cell.colSpan;

          const text = cell.textContent || '';
          const licitCell = new LicitTableCellElement(text);
          licitCell.rowspan = rowspan;
          licitCell.colspan = colspan;

          licitRow.addCell(licitCell);
        }
        licitTable.addRow(licitRow);
      }
      licitDocument.appendElement(licitTable);
    }
  }

  private renderParagraph(
    e: ParserElement,
    licitDocument: LicitDocumentElement
  ) {
    const text = e.node.textContent;
    if (text) {
      const paragraph = new LicitParagraphElement(text);
      if (e.node.attributes.getNamedItem('align')) {
        paragraph.align = e.node.attributes.getNamedItem('align').value;
      }
      licitDocument.appendElement(paragraph);
    }
  }

  private renderHeader(e: ParserElement, licitDocument: LicitDocumentElement) {
    const text = e.node.textContent;
    const subText = e.subText || '';
    const styleName = e.node.getAttribute('class') ?? 'normal';
    if (text) {
      const header = new LicitHeaderElement(
        text,
        subText,
        e.level,
        styleName,
        getCapcoFromNode(e.node as HTMLElement) ?? '',
        e.node as HTMLElement
      );

      if (e.type !== ParserElementType.Header) {
        header.align = 'center';
      }

      licitDocument.appendElement(header);
    }
  }

  private buildElements(nodes: NodeListOf<Element>) {
    let skipNext = false;
    for (let i = 0; i < nodes.length; i++) {
      if (skipNext) {
        skipNext = false;
        continue;
      }

      const node = nodes[i];
      const nextNode = nodes[i + 1];
      const className = node.className;

      if (!className) {
        if (!node.tagName) {
          this.parseTableFigure(node);
          continue;
        }
        if (node.tagName === 'OL') {
          this.checkChildNode(node, nextNode);
        } else {
          this.parseTableFigure(node);
        }

        continue;
      }
      this.parseElement(node, nextNode);
      // className is set before parseElement / stripFmPrefix is called.
      // do not remove 'FM_ from the switch statement below.
      switch (className) {
        case 'FM_chpara0':
        case 'FM_attpara0':
        case 'FM_chsubpara1':
        case 'FM_attsubpara1':
          skipNext = !!nextNode;
          break;
        default:
          skipNext = false;
      }
    }
  }

  private checkChildNode(
    node: HTMLElement | Element,
    nextNode: HTMLElement | Element
  ): number {
    const children = node.children;
    let skipCount = 0;

    if (children) {
      for (let j = 0; j < children.length; j++) {
        if (skipCount > 0) {
          skipCount--;
          continue;
        }

        const childNode = children[j];
        let nextChildNode = children[j + 1];

        // Handling paragraph combining logic for the case where
        // heading is inside <OL>/<UL> and content is outside
        if (
          !nextChildNode &&
          (node.tagName === 'OL' || node.tagName === 'UL') &&
          shouldSkipNext(childNode.className)
        ) {
          nextChildNode = nextNode;
        }

        skipCount = this.handleNode(childNode, nextChildNode);
      }
    }
    return skipCount;
  }

  private render_doc(
    nodes: NodeListOf<Element>,
    infoIconData: HTMLOListElement[] | undefined,
    moDocType: string
  ): LicitDocumentJSON {
    // Build elements, joining special cases
    for (const node of Array.from(nodes)) {
      if (this.isTableFigureNode(node)) {
        this.parseTableFigure(node);
      } else if (
        node.children.item(0)?.tagName === 'TBODY' ||
        node.children.item(0)?.tagName === 'THEAD'
      ) {
        this.parseTable(node, false);
      } else {
        this.parseElement_doc(node, null);
      }
    }

    const licitDocument = new LicitDocumentElement();
    let tocRemoved = false;

    for (const e of this.elements) {
      this.updateChildCapcoContent(e);
      tocRemoved = this.render_docSwitchHelper(
        e,
        licitDocument,
        tocRemoved,
        infoIconData,
        moDocType
      );
    }

    return licitDocument.render();
  }

  private render_docSwitchHelper(
    e: ParserElement,
    licitDocument: LicitDocumentElement,
    tocRemoved: boolean,
    infoIconData: HTMLOListElement[],
    moDocType: string
  ) {
    switch (e.type) {
      case ParserElementType.ChapterTitle:
      case ParserElementType.ChapterSubtitle:
      case ParserElementType.Header: {
        this.renderHeader(e, licitDocument);
        break;
      }

      case ParserElementType.Figure: {
        this.renderDocFigure(e, licitDocument);
        break;
      }

      case ParserElementType.BulletListItem: {
        this.renderDocBulletItems(e, licitDocument);
        break;
      }

      case ParserElementType.OrderedListItem: {
        this.parseOL(e, licitDocument);
        break;
      }

      case ParserElementType.Paragraph: {
        //SL-14
        // Remove 'Table of Contents'
        const text = (e.node.textContent || '').trim();
        if (!tocRemoved && text.toLowerCase() === 'table of contents') {
          tocRemoved = true;
          return tocRemoved;
        }

        this.renderTypeParagraph(e, licitDocument, infoIconData);
        break;
      }

      case ParserElementType.Note: {
        const text = e.node.textContent;
        if (text) {
          const paragraph = new LicitParagraphElement(text);
          paragraph.styleLevel = 0;
          licitDocument.appendElement(paragraph);
        }
        break;
      }

      case ParserElementType.Table:
      case ParserElementType.EnhancedTable: {
        this.renderDocTable(e, licitDocument);
        break;
      }
      case ParserElementType.vignet: {
        // Handling generic docs in  nonspecfic type
        this.renderDocVignet(moDocType, e, licitDocument);
        break;
      }

      case ParserElementType.FigureTitle:
      case ParserElementType.TableTitle: {
        const text = e.node.textContent;
        const styleName = e.node.getAttribute('class') ?? 'normal';
        if (text) {
          const header = new LicitHeaderElement(
            text,
            '',
            0,
            styleName,
            getCapcoFromNode(e.node as HTMLElement) ?? '',
            e.node as HTMLElement
          );
          licitDocument.appendElement(header);
        }
        break;
      }

      case ParserElementType.SectionTitle: {
        const text = e.node.textContent;
        if (text) {
          const header = new LicitHeaderElement(text);
          header.align = 'center';
          licitDocument.appendElement(header);
        }
        break;
      }
      case ParserElementType.hr: {
        const hr = new LicitHRElement();
        licitDocument.appendElement(hr);
        break;
      }

      default:
        console.warn(`Parser not configured to render element: ${e.class}`);
    }

    return tocRemoved;
  }

  private renderTypeParagraph(
    e: ParserElement,
    licitDocument: LicitDocumentElement,
    infoIconData?: HTMLOListElement[]
  ) {
    const n = e.node;
    if (!n) {
      return;
    }
    if (e.class && e.class === 'Chapter Header') {
      const spaceAbove = 3;
      const p = document.createElement('p');
      const p1 = new NewLicitParagraphElement(p as HTMLElement, infoIconData);
      p1.id = 'chspace';

      for (let i = 0; i < spaceAbove; i++) {
        licitDocument.appendElement(p1);
      }

      const paragraph = new NewLicitParagraphElement(
        n as HTMLElement,
        infoIconData
      );
      licitDocument.appendElement(paragraph);
      return;
    }
    const text = n.textContent || '';

    // Regular expression to find URLs (http:// or https://)
    const urlRegex = /(https?:\/\/[^\s]{1,999})/g;

    if (urlRegex.test(text)) {
      this.handle_UrlText(text, licitDocument, infoIconData);
    } else {
      this.text_WithoutUrl(n, licitDocument, infoIconData);
    }
  }

  private handle_UrlText(
    text: string,
    licitDocument: LicitDocumentElement,
    infoIconData?: HTMLOListElement[]
  ) {
    const urlRegex = /(https?:\/\/[^\s]{1,999})/g;
    const parts = text.split(urlRegex);

    const pElement = document.createElement('p');

    for (const part of parts) {
      if (urlRegex.test(part)) {
        const anchor = document.createElement('a');
        anchor.href = part;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = part;
        pElement.appendChild(anchor);
      } else {
        const textNode = document.createTextNode(part);
        pElement.appendChild(textNode);
      }
    }

    const paragraph = new NewLicitParagraphElement(
      pElement as HTMLElement,
      infoIconData
    );
    licitDocument.appendElement(paragraph);
  }

  private text_WithoutUrl(
    n: Node,
    licitDocument: LicitDocumentElement,
    infoIconData?: HTMLOListElement[]
  ) {
    const paragraph = new NewLicitParagraphElement(
      n as HTMLElement,
      infoIconData
    );
    licitDocument.appendElement(paragraph);

    const element = n as HTMLElement;
    const indent = Number(element.dataset.indent);
    if (indent > 0) {
      paragraph.indent = indent;
    }
  }

  private handleNode(node: Element, nextNode: Element): number {
    const className = node.className;
    const titleClasses = [
      'attTableTitle',
      'attFigureTitle',
      'chTableTitle',
      'chFigureTitle',
    ];

    for (const cls of titleClasses) {
      if (node.classList?.contains(cls)) {
        const el = node as HTMLElement;
        el.style.textTransform = 'none';
        el.style.color = '#000000';
        break;
      }
    }

    if (node.tagName !== 'DIV' && node.children.item(0)?.tagName === 'IMG') {
      this.parseTableFigure(node);
    } else if (node.tagName === 'TABLE') {
      this.parseTable(node, true);
    } else if (node.tagName === 'OL' || node.tagName === 'UL') {
      return this.checkChildNode(node, nextNode);
    } else if (node.tagName === 'IMG') {
      this.parseFigure(node);
    } else if (node.tagName === 'SPAN') {
      return this.mergeSpans(node, nextNode);
    } else {
      this.parseElement(node, nextNode);
    }

    //  Old "skip next" logic for paragraph combining
    if (
      shouldSkipNext(node.className) &&
      nextNode &&
      shouldSkipNext(nextNode.className)
    ) {
      return 1; // skip just next
    }

    return shouldSkipNext(className) ? 1 : 0;
  }

  //Merge consecutive spans below the table into a single paragraph
  private mergeSpans(node: Element, nextNode: Element): number {
    const p = document.createElement('p');
    p.classList.add('dynamicTableHeader');

    let current: Element | null = node;
    let consumed = 0;

    let styleApplied = false;
    let anchorInserted = false;

    while (current?.tagName === 'SPAN') {
      const style = (current as HTMLElement).getAttribute('style');
      if (!styleApplied && style) {
        p.setAttribute('style', style);
        styleApplied = true;
      }

      //Directly look for <a id> inside the span for  handling link references like <a id="1050920" name="1050920"></a>
      if (!anchorInserted) {
        const anchorInSpan = current.querySelector('a[id]');
        if (anchorInSpan) {
          const anchor = document.createElement('a');
          anchor.id = anchorInSpan.id;
          const nameAttr = anchorInSpan.getAttribute('name');
          if (nameAttr) {
            anchor.setAttribute('name', nameAttr);
          }
          p.appendChild(anchor);
          anchorInserted = true;
        }
      }
      // Append span content
      p.innerHTML += current.innerHTML;
      current = current.nextElementSibling;
      consumed++;
    }
    // process merged paragraph
    this.parseElement(p, nextNode);
    // skip already consumed spans (minus the first one we processed)
    return consumed - 1;
  }

  private updateChildCapcoContent(e: ParserElement) {
    if (e.node.textContent === '') {
      return;
    }
    if (e.type === ParserElementType.EnhancedTable) {
      this.processTableCapco(e.node as HTMLTableElement);
      return;
    }
    if (e.node.childNodes.length > 1) {
      const childrens = e.node.childNodes;
      this.processChildNodesCapco(childrens);
    } else {
      const res = updateCapcoFromContent(e.node);
      if (res?.containsCapco) {
        if (e.node.nodeType === Node.ELEMENT_NODE) {
          const element = e.node;
          this.updateChildCapcoContentLoopHelper(
            Array.from(element.childNodes),
            res
          );
          element.setAttribute('capco', JSON.stringify(res.capco));
        } else if (e.node.nodeType === Node.TEXT_NODE) {
          e.node.textContent = res.updatedTextContent;
        }
      }
    }

    if (this.isNoteNode(e.node.className)) {
      removeCapcoTextFromNode(e.node);
    }
  }

  private updateChildCapcoContentLoopHelper(
    childNodes: ChildNode[],
    res: UpdatedCapco
  ) {
    for (const node of childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = res.updatedTextContent;
      }
    }
  }

  private processChildNodesCapco(childNodes: NodeListOf<ChildNode>) {
    // For skipping trimStart logic for the case while handling " "
    for (const child of Array.from(childNodes)) {
      //Hidden -> contine;
      if (
        child.nodeType === Node.ELEMENT_NODE &&
        (child as Element).className == 'Hidden'
      ) {
        continue;
      }
      if (
        child.nodeType === Node.TEXT_NODE &&
        child.textContent.trim() !== ''
      ) {
        const res = updateCapcoFromContent(child as Element);
        if (res?.containsCapco) {
          this.updateCapcoToParagraph(child, res);
        }
      }
      //Recursively looping through nodes
      else if (
        child.nodeType === Node.ELEMENT_NODE &&
        child.childNodes.length > 0
      ) {
        this.processChildNodesCapco(child.childNodes);
      }
      if ((child.textContent?.trim()?.length ?? 0) > 0) {
        break;
      }
    }
  }

  private updateCapcoToParagraph(child: ChildNode, res: UpdatedCapco) {
    child.textContent = res.updatedTextContent;

    // Find the nearest paragraph
    let parent = child.parentElement;
    while (parent && parent.tagName.toLowerCase() !== 'p') {
      parent = parent.parentElement;
    }

    if (parent) {
      parent.setAttribute('capco', JSON.stringify(res.capco));
    }
  }
  private processTableCapco(tableNode: HTMLTableElement) {
    const table = tableNode.querySelector('tbody');
    const rows = table?.rows;
   if (!rows || rows.length === 0) {
      table?.setAttribute(
        'capco',
        JSON.stringify({ ism: undefined, portionMarking: 'U' }),
      );
      return;
    }

    const lastRowIndex = rows.length - 1;
    const lastRow: HTMLTableRowElement = rows[lastRowIndex];

    if (lastRow?.cells?.length !== 1) {
      table?.setAttribute(
        'capco',
        JSON.stringify({ ism: undefined, portionMarking: 'U' }),
      );
      return;
    }

    const cell: HTMLTableCellElement = lastRow.cells[0];

       // Use the SAME CAPCO parser as paragraphs
    const res = updateCapcoFromContent(cell);
     // If CAPCO was found, attach it; otherwise default to U
    table?.setAttribute(
      'capco',
      JSON.stringify(
        res?.containsCapco
          ? res.capco
          : { ism: undefined, portionMarking: 'U' },
      ),
    );
    // Remove the footer CAPCO row from the table unless it contains the word 'note'
    const footerText = (lastRow?.textContent ?? '').toLowerCase();
    if (!footerText.includes('note')) {
      table.deleteRow(lastRowIndex);
    }
  }

  private figureTitleCase(
    e: ParserElement,
    licitDocument: LicitDocumentElement
  ) {
    let text = e.node.textContent;
    const styleName = e.node.getAttribute('class') ?? 'normal';
    if (text) {
      if (text.startsWith('Figure')) {
        text = text.replace(
          /^Figure\s{1,50}[A-Za-z0-9.\-:]{1,50}\s{1,50}(\([A-Z]{1,4}\))?\s{0,10}/,
          ''
        );
      }
      const header = new LicitHeaderElement(
        text,
        '',
        0,
        styleName,
        getCapcoFromNode(e.node as HTMLElement) ?? '',
        e.node as HTMLElement
      );
      licitDocument.appendElement(header);
    }
    // Added for handling image inside chFigureTitle class
    if (e.node.children.length > 0) {
      const children = e.node.children;
      const childrenArray = Array.from(children);
      for (const child of childrenArray) {
        this.handleImageChild(child, licitDocument);
      }
    }
  }

  private handleImageChild(
    child: Element,
    licitDocument: LicitDocumentElement
  ): void {
    if (child.tagName !== 'IMG') return;

    const src = child.getAttribute('src');
    if (!src) return;

    const alt = child.getAttribute('alt') ?? '';
    const rawWidth = (child as HTMLImageElement).width;
    const width =
      rawWidth && rawWidth > 0 ? this.getScaledWidth(rawWidth) : undefined;
    const height = child.getAttribute('height');

    const imageElement = new LicitParagraphImageElement(
      src,
      alt,
      width,
      height
    );
    licitDocument.appendElement(imageElement);
  }

  private renderNewFigureTitle(
    e: ParserElement,
    licitDocument: LicitDocumentElement
  ) {
    let text = e.node.textContent;
    const styleName = e.node.getAttribute('class') ?? 'normal';
    const capco = getCapcoFromNode(e.node as HTMLElement);
    if (text) {
      if (text.startsWith('Figure')) {
        text = text.replace(
          /^Figure\s{1,50}[A-Za-z0-9.\-:]{1,50}\s{1,50}(\([A-Z]{1,4}\))?\s{0,10}/,
          ''
        );
      }
      const header = new LicitHeaderElement(
        text,
        '',
        0,
        styleName,
        capco ?? '',
        e.node as HTMLElement
      );
      licitDocument.appendElement(header);
    }
    if (e.node.children.length === 0) return;
    const children = Array.from(e.node.children);
    for (const child of children) {
      if (child.tagName !== 'IMG') continue;

      const imgElement = child as HTMLImageElement;
      const imageSrc = imgElement.getAttribute('src');

      if (!imageSrc) continue;

      const licitEnhancedImage = this.renderNewLicitImage(imgElement, capco);
      licitDocument.appendElement(licitEnhancedImage);
    }
  }
  private figureParagraphCase(
    e: ParserElement,
    licitDocument: LicitDocumentElement,
    infoIconData: HTMLOListElement[] | undefined,
    renderedContentList: Node[]
  ) {
    const n = e.node;
    if (n) {
      const paragraph = new NewLicitParagraphElement(
        n as HTMLElement,
        infoIconData,
        renderedContentList
      );
      licitDocument.appendElement(paragraph);

      if (Number((n as HTMLElement).dataset.indent) > 0) {
        paragraph.indent = Number((n as HTMLElement).dataset.indent);
      }
    }
  }

  private figureNoteCase(
    e: ParserElement,
    licitDocument: LicitDocumentElement
  ) {
    const paragraph = new LicitParagraphNote(e.node as HTMLElement);
    licitDocument.appendElement(paragraph);
  }

  private figureTableTitleCase(
    e: ParserElement,
    licitDocument: LicitDocumentElement
  ) {
    let text = e.node.textContent;
    const styleName = e.node.getAttribute('class') ?? 'normal';
    if (text) {
      if (text.startsWith('Table')) {
        text = text.replace(
          /^Table\s{1,50}[A-Za-z0-9.\-:]{1,50}\s{1,50}(\([A-Z]{1,4}\))?\s{0,10}/,
          ''
        );
      }

      const header = new LicitHeaderElement(
        text,
        '',
        0,
        styleName,
        getCapcoFromNode(e.node as HTMLElement) ?? '',
        e.node as HTMLElement
      );
      licitDocument.appendElement(header);
    }
  }

  private renderDocVignet(
    moDocType: string,
    e: ParserElement,
    licitDocument: LicitDocumentElement
  ) {
    if (moDocType == 'Non Specific') {
      this.parseUntypedDocVignet(e, licitDocument);
    } else {
      this.parseTypedDocVignet(e, licitDocument);
    }
  }

  private parseUntypedDocVignet(
    e: ParserElement,
    licitDocument: LicitDocumentElement
  ) {
    const image = e.node.querySelector('img');
    const source = image?.src;
    const altText = image?.alt;
    const width = image?.getAttribute('width');
    const height = image?.getAttribute('height');
    const align = getElementAlignment(image);
    if (source) {
      const imageElement = new LicitParagraphImageElement(
        source,
        altText,
        width,
        height,
        align
      );
      licitDocument.appendElement(imageElement);
      if (altText === '/ERR:Unsupported Image Format x-emf') {
        const errText = new LicitErrorTextElement(altText);
        licitDocument.appendElement(errText);
      }
    }

    const text = e.node.textContent;
    if (text) {
      for (const node of Array.from(e.node.childNodes)) {
        if (node.nodeName === 'P') {
          const paragraph = new NewLicitParagraphElement(node as HTMLElement);
          licitDocument.appendElement(paragraph);
        }
      }
    }
  }

  private parseTypedDocVignet(
    e: ParserElement,
    licitDocument: LicitDocumentElement
  ) {
    const licitTable = new LicitTableElement(true);
    const licitRow = new LicitTableRowElement();
    const rowspan = 1;
    const colspan = 1;
    let licitCell = null;
    const style = e.node.getAttribute('style');
    let borderColor: string;
    let bgColor: string;
    let boxWidth: number;
    if (style) {
      const styleVals = style.split(';');
      for (const val of styleVals) {
        const styles = this.parseTypedDocVignetHelper(
          val,
          bgColor,
          borderColor,
          boxWidth
        );
        borderColor = styles.borderColor;
        bgColor = styles.bgColor;
        boxWidth = styles.boxWidth;
      }
    }

    licitCell = new LicitVignetteElement(
      e.node,
      borderColor,
      bgColor,
      boxWidth
    );

    licitCell.rowspan = rowspan;
    licitCell.colspan = colspan;
    licitRow.addCell(licitCell);
    licitTable.addRow(licitRow);
    licitDocument.appendElement(licitTable);
  }

  private parseTypedDocVignetHelper(
    val: string,
    bgColor: string,
    borderColor: string,
    boxWidth: number
  ) {
    if (val.startsWith('background-color')) {
      bgColor = val.split(':')[1];
    }
    if (val.startsWith('border')) {
      borderColor = '#' + val.split('#')[1];
    }
    if (val.startsWith('width')) {
      const calculatedWidth =
        Number(val.split(':')[1].replace('pt', '')) / 0.75;
      boxWidth = Math.min(700, calculatedWidth);
    }

    return {
      bgColor: bgColor,
      borderColor: borderColor,
      boxWidth: boxWidth,
    };
  }

  private renderDocTable(
    e: ParserElement,
    licitDocument: LicitDocumentElement
  ) {
    const licitTable = new LicitTableElement();
    const colWidthsArray = this.getColWidthArray(e.node as HTMLTableElement);
    licitTable.noOfColumns = colWidthsArray?.length ?? 0;
    const tableHead = e.node.querySelector('thead');
    const table = e.node.querySelector('tbody');
    licitTable.capco = getCapcoFromNode(table);
    const isTransparentTable = this.isTransparentTable(e.node);
    //Process table header first and then table body. If there is no body then process table header only.
    if (tableHead) {
      this.parseTableContent(
        e,
        tableHead,
        'th',
        true,
        licitTable,
        colWidthsArray,
        isTransparentTable
      );
    }
    if (table) {
      this.parseTableContent(
        e,
        table,
        'td',
        false,
        licitTable,
        colWidthsArray,
        isTransparentTable
      );
    }

    if (tableHead || table) {
      licitDocument.appendElement(licitTable);
    }
  }
  private renderEnhancedTable(
    e: ParserElement,
    licitDocument: LicitDocumentElement
  ) {
    const widthArray = this.getColWidthArray(e.node as HTMLTableElement);
    const table = e.node.querySelector('tbody');
    let totalWidth = 619;
    if (widthArray) {
      totalWidth = this.getSumOfArray(widthArray);
    }
    const orientation = this.findOrientation(totalWidth);
    const capco = getCapcoFromNode(table);
    const licitNewTable = new LicitEnhancedTableElement(orientation);
    const newBody = new LicitEnhancedTableFigureBodyElement();
    const tableCapco = new LicitEnhancedTableFigureCapcoElement(
      safeCapcoParse(capco).portionMarking
    );
    const licitTable = this.getLicitTable(e, widthArray, capco);
    if (licitTable.rows.length > 0) {
      newBody.addTable(licitTable);
      licitNewTable.addBody(newBody);
      licitNewTable.addCapco(tableCapco);
      const noteParagraphs = this.extractNote(table);
      //If the table has a note, create a new notes element and add it to the table
      if (noteParagraphs) {
        const note = new LicitEnhancedTableNotesElement(noteParagraphs);
        licitNewTable.addNotes(note);
        //Remove the row containing the note from the table
        licitNewTable.removeLastRow();
      }
      licitDocument.appendElement(licitNewTable);
    }
  }
  private getLicitTable(
    e: ParserElement,
    widthArray: number[],
    capco?: string
  ): LicitTableElement {
    const licitTable = new LicitTableElement(false, capco);
    const tableHead = e.node.querySelector('thead');
    const table = e.node.querySelector('tbody');
    const isChapterHeader = false;
    if (table) {
      if (tableHead) {
        this.parseTableContent(
          e,
          tableHead,
          'th',
          isChapterHeader,
          licitTable,
          widthArray,
          false
        );
      }
      this.parseTableContent(
        e,
        table,
        'td',
        isChapterHeader,
        licitTable,
        widthArray,
        false
      );
    }
    return licitTable;
  }
  //To get Image node from the dom and return the Licit Enhanced Image Element.
  private renderNewLicitImage(
    imageElement: HTMLImageElement,
    capco: string | null
  ): LicitEnhancedImageElement {
    const imageInfo = this.extractImageInfo(imageElement);
    const orientation = this.findOrientation(imageInfo.width);
    const licitImage = new LicitNewImageElement(
      imageInfo.src,
      imageInfo.width?.toString(),
      imageInfo.height?.toString(),
      imageInfo.alt,
      capco
    );
    const licitBody = new LicitEnhancedImageBodyElement(licitImage);
    const capcoString = safeCapcoParse(capco).portionMarking;
    const licitCapco = new LicitEnhancedTableFigureCapcoElement(capcoString);
    const licitEnhancedImage = new LicitEnhancedImageElement(orientation);
    licitEnhancedImage.addBody(licitBody);
    licitEnhancedImage.addCapco(licitCapco);
    return licitEnhancedImage;
  }
  private renderDocBulletItems(
    e: ParserElement,
    licitDocument: LicitDocumentElement
  ) {
    const indent = 0;
    const bulletList = new LicitBulletListElement(indent);
    const text = e.node.textContent;
    if (!text || (!e.node.childNodes && e.node.childNodes.length === 0)) {
      return;
    }
    this.removeEmptyATags(e.node);
    const childNodes = Array.from(e.node.childNodes);
    const firstChild = childNodes[0];
    if ((firstChild as Node).nodeName === '#text') {
      const bulletItem = new LicitBulletListItemElement(e.node as HTMLElement);
      bulletList.addItem(bulletItem);
      bulletList.styleLevel = e.level;
      this.addElementLicit(licitDocument, bulletList);
    } else {
      this.processBulletNodes(
        childNodes as Node[],
        bulletList,
        licitDocument,
        indent,
        e
      );
    }
  }

  private processBulletNodes(
    childNodes: Node[],
    bulletList: LicitBulletListElement,
    licitDocument,
    indent: number,
    e
  ) {
    for (const node of childNodes) {
      const ulNode = Array.from(node.childNodes).find(
        (childNode) => childNode.nodeName === 'UL'
      );
      const olNode = Array.from(node.childNodes).find(
        (childNode) => childNode.nodeName === 'OL'
      );
      if (!(ulNode && olNode) && node.nextSibling && node.nodeName !== 'LI') {
        const bulletItem = new LicitBulletListItemElement(e.node);
        bulletList.addItem(bulletItem);
        this.addElementLicit(licitDocument, bulletList);
        break;
      } else {
        const bulletItem = new LicitBulletListItemElement(node as HTMLElement);
        bulletList.addItem(bulletItem);
        this.addElementLicit(licitDocument, bulletList);
        if (ulNode) {
          this.handleULNode(licitDocument, indent, ulNode);
        }
        if (olNode) {
          this.parseOL(e, licitDocument);
        }
      }
      bulletList = new LicitBulletListElement(0);
    }
  }

  private addElementLicit(licitDocument, bulletList: LicitBulletListElement) {
    if (bulletList.listItems.length > 0) {
      licitDocument?.appendElement(bulletList);
    }
  }

  private removeEmptyATags(node: Node) {
    const childNodes = Array.from(node.childNodes);
    for (const childNode of childNodes) {
      if (childNode.nodeName === 'A' && childNode.textContent === '') {
        const index = childNodes.indexOf(childNode);
        if (index != -1) {
          childNodes[index].remove();
        }
      }
    }
  }
  private handleULNode(
    licitDocument: LicitDocumentElement,
    indent: number,
    ulNode: ChildNode
  ) {
    indent++;
    this.ParseNestedList('UL', ulNode, licitDocument, indent);
  }

  private renderDocFigure(
    e: ParserElement,
    licitDocument: LicitDocumentElement
  ) {
    if (e.node.tagName === 'P') {
      const paraImages = new NewLicitParagraphElement(e.node as HTMLElement);
      licitDocument.appendElement(paraImages);
    } else if (e.node.tagName === 'IMG') {
      this.renderImage(e.node as HTMLImageElement, licitDocument);
    } else {
      const images = e.node.querySelectorAll('img');
      for (const element of Array.from(images)) {
        if (element) {
          this.renderImage(element, licitDocument);
        }
      }
      if (e.node.tagName === 'DIV') {
        const caption = e.node.querySelector('p');
        const paraImages = new NewLicitParagraphElement(caption as HTMLElement);
        licitDocument.appendElement(paraImages);
      }
    }
  }
  private renderImage(
    imgElement: HTMLImageElement,
    licitDocument: LicitDocumentElement
  ) {
    const source = imgElement.getAttribute('src');
    const altText = imgElement.alt;
    if (source) {
      const imageElement = new LicitParagraphImageElement(source);
      if (altText === '/ERR:Unsupported Image Format x-emf') {
        const errText = new LicitErrorTextElement(altText);
        licitDocument.appendElement(imageElement);
        licitDocument.appendElement(errText);
      }
      licitDocument.appendElement(imageElement);
      if (imgElement.childNodes.length > 1) {
        imgElement.remove();
        const textInline = new NewLicitParagraphElement(
          imgElement as HTMLElement
        );
        licitDocument.appendElement(textInline);
      }
    }
  }
  private parseOL(e: ParserElement, licitDocument: LicitDocumentElement) {
    if (e.node.id === 'infoIcon') {
      return;
    }
    let indent = 0;
    let orderedList = new LicitOrderedListElement(indent);
    const text = e.node.textContent;
    if (text && e.node.childNodes && e.node.childNodes.length > 0) {
      const childNodes = Array.from(e.node.childNodes);
      for (const n of childNodes) {
        const ulNode = Array.from(n.childNodes).find(
          (node) => node.nodeName === 'OL'
        );
        const bulletItem = new LicitBulletListItemElement(n as HTMLElement);
        orderedList.addItem(bulletItem);
        if (ulNode) {
          licitDocument.appendElement(orderedList);
          indent++;
          this.ParseNestedList('OL', ulNode, licitDocument, indent);
          orderedList = new LicitOrderedListElement(0);
        }
      }
      if (orderedList.listItems.length > 0) {
        licitDocument.appendElement(orderedList);
      }
    }
  }

  /**
   * To parse table data
   * @param e - element
   * @param tableTag - The tag name or identifier of the table.
   * @param querySel Selector for Querying from table row
   * @param isChapterHeader  flag to determine ChapterHeader
   * @param licitTable -Licit Table Element
   * @param widthArray - To scale the table to specific sizes
   * @param isTransparent - flag to distinguish preface table
   * @returns void
   */

  private parseTableContent(
    _e,
    tableTag,
    querySel,
    isChapterHeader,
    licitTable,
    widthArray: number[],
    isTransparent: boolean
  ) {
    const rows = tableTag.querySelectorAll('tr');
    let totalTableHeight = 0; 
    for (let i = 0; i < rows.length; i++) {
      if (
        !isTransparent &&
        i == 0 &&
        !isChapterHeader &&
        rows[i].cells.length > 1
      ) {
        isChapterHeader = true;
      }
      const licitRow = new LicitTableRowElement();
      // ** Capture row height **
      const rowHeight = rows[i].getAttribute('height');
      if (rowHeight) {
        licitRow.height = rowHeight;
        licitRow.rowHeight = rowHeight;     
        totalTableHeight += parseFloat(rowHeight);
      }
      const cells = rows[i].querySelectorAll(querySel);

      this.parseTableContentInnerLoopHelper(
        cells,
        i,
        isChapterHeader,
        licitRow,
        widthArray,
        isTransparent
      );

      licitTable.addRow(licitRow);
      isChapterHeader = false;
    }
    if (totalTableHeight > 0) {
      licitTable.tableHeight = `${totalTableHeight}px`;
    }
  }

  private parseTableContentInnerLoopHelper(
    cells,
    _cellIndex: number,
    isChapterHeader: boolean,
    licitRow: LicitTableRowElement,
    widthArray: number[],
    isTransparent: boolean
  ) {
    for (let j = 0; j < cells.length; j++) {
      //Start RK-Dynamic Cell(2-2 of Chapter Header) BgColor
      const style = cells[j].getAttribute('style');
      let bgColor: string;
      if (style) {
        const styleVals = style.split(';');
        for (const val of styleVals) {
          if (val.startsWith('background-color')) {
            bgColor = val.split(':')[1];
          }
        }
      } else if (cells[j].getAttribute('fillcolor')) {
        bgColor = cells[j].getAttribute('fillcolor');
      }
      //
      let verAlign = 'top';
      if (cells[j].id === 'LC-Center') {
        verAlign = 'middle';
      }
      //END
      const cellOptions: AddCellOptions = {
        bgColor,
        isChapterHeader,
        verAlign,
        cellIndex: j,
        widthArray,
        isTransparent,
      };
      this.addCell(cells[j], licitRow, cellOptions);
    }
  }

  private addCell(
    cell: HTMLTableCellElement,
    licitRow: LicitTableRowElement,
    cellOptions: AddCellOptions
  ) {
    if (!cell) {
      return;
    }
    let { bgColor } = cellOptions;
    const { verAlign, cellIndex, widthArray, isTransparent, isChapterHeader } =
      cellOptions;
    const rowspan = cell.rowSpan;
    const colspan = cell.colSpan;
    let colWidth: [number];
    let licitCell = null;

    const text = cell.textContent ?? '';
    // Extract cell-level style information**
    const cellStyleInfo = this.extractCellStyles(cell);
    if (widthArray?.length > 0) {
      const computedWidth = this.setCellWidth(colspan, cellIndex, widthArray);
      cellStyleInfo.cellWidth = computedWidth?.join(',');
    }

    if (cell.childNodes?.length <= 0) {
      //condition
      licitCell = new LicitTableCellParaElement(
        cell,
        bgColor,
        null,
        verAlign,
        isChapterHeader,
        isTransparent,
        cellStyleInfo,
      );
    } else if (
      '' === text &&
      (cell.childNodes[0] as Element).querySelector('img')
    ) {
      ({ licitCell } = this.addTableImageCell(
        cell,
        bgColor,
        isChapterHeader,
        licitCell,
        verAlign,
        cellStyleInfo,
      ));
    } else {
      if (isChapterHeader) {
        bgColor = bgColor || '#d8d8d8';
        (cell as unknown as Record<string, unknown>).align = 'center'; // NOSONAR used by Licit parser (depricated)
        cell.setAttribute('classname', 'LC-Center');
      }
      licitCell = new LicitTableCellParaElement(
        cell,
        bgColor,
        colWidth,
        verAlign,
        isChapterHeader,
        isTransparent,
        cellStyleInfo,
      );
    }
    licitCell.rowspan = rowspan;
    licitCell.colspan = colspan;
    if (widthArray?.length > 0) {
      licitCell.colWidth = this.setCellWidth(colspan, cellIndex, widthArray);
    }
    licitRow.addCell(licitCell);
  }
/**
 * Extracts style information from a table cell element per the ingest requirements.
 * Captures: margins (top/bottom), font-size overrides, and letter-spacing for non-breaking spaces.
 * 
 * @param cell - The HTMLTableCellElement to extract styles from
 * @returns Object containing extracted style information
 */
  private extractCellStyles(cell: HTMLTableCellElement): CellStyleInfo {
    const styleInfo: CellStyleInfo = {};

    // Capture class and ID from the paragraph inside the cell
    const paragraph = cell.querySelector('p');
    if (paragraph) {
      if (paragraph.className) {
        styleInfo.className = paragraph.className;
      }
      if (paragraph.id) {
        styleInfo.id = paragraph.id;
      }

      // Extract style attributes from the paragraph's style attribute
      const style = paragraph.getAttribute('style');
      if (style) {
        this.extractParagraphStyles(style, styleInfo);
      }

      // Extract letter-spacing for non-breaking spaces
      const spans = paragraph.querySelectorAll('span[style*="letter-spacing"]');
      this.extractLetterSpacing(spans, styleInfo);
    }
    return styleInfo;
  }

  /**
   * Extracts margin and font-size properties from a style string.
   * 
   * @param style - The style attribute string
   * @param styleInfo - The style info object to populate
   */
  private extractParagraphStyles(
    style: string,
    styleInfo: {
      marginTop?: string;
      marginBottom?: string;
      fontSize?: string;
    }
  ): void {
    const styleProps = style.split(';');
    for (const prop of styleProps) {
      const trimmedProp = prop.trim();

      if (trimmedProp.startsWith('margin-top')) {
        styleInfo.marginTop = trimmedProp.split(':')[1]?.trim();
      } else if (trimmedProp.startsWith('margin-bottom')) {
        styleInfo.marginBottom = trimmedProp.split(':')[1]?.trim();
      } else if (trimmedProp.startsWith('font-size')) {
        styleInfo.fontSize = trimmedProp.split(':')[1]?.trim();
      }
    }
  }

  /**
   * Extracts the first letter-spacing value from spans containing non-breaking spaces.
   * 
   * @param spans - NodeList of span elements with letter-spacing styles
   * @param styleInfo - The style info object to populate
   */
  private extractLetterSpacing(
    spans: NodeListOf<Element>,
    styleInfo: { letterSpacing?: string }
  ): void {
    const letterSpacingRegex = /letter-spacing\s{0,1000}:\s{0,1000}([^;]{1,1000})/;

    for (const span of Array.from(spans)) {
      // Check if this span contains a non-breaking space
      const content = span.innerHTML;
      if (content.includes('&#160;') || content.includes('&nbsp;')) {
        const spanStyle = (span as HTMLElement).getAttribute('style');
        if (spanStyle) {
          const match = letterSpacingRegex.exec(spanStyle);
          if (match) {
            // Store the first letter-spacing value found
            styleInfo.letterSpacing = match[1].trim();
            break;
          }
        }
      }
    }
  }
  checkCellStyle(style: string | null): string | null {
    let borderColor: string = null;
    if (style != null) {
      const styleVals = style.split(';');
      for (const val of styleVals) {
        if (
          val.length > 0 &&
          val.includes('border') &&
          !val.includes('style') &&
          !val.includes('radius')
        ) {
          const border = val.split(':')[1];
          if (border == '0') {
            borderColor = '#FFFFFF';
          }
        }
      }
    }
    return borderColor;
  }

  private addTableImageCell(
    cell: HTMLElement,
    bgColor: string,
    isChapterHeader: boolean,
    licitCell: LicitElement,
    verAlign: string,
    cellStyleInfo?: CellStyleInfo, 
  ) {
    const image = (cell.childNodes[0] as Element).querySelector('img');
    let altText = null;
    let imgHeight = null;
    let colWidth = null;
    let fillImg = 0;
    let fitoParent = 0;
    if (['LC-Image-1', 'LC-Image-2'].includes(image.id)) {
      bgColor = '#d8d8d8';
      fillImg = 1;
      fitoParent = 1;
      colWidth = image.id === 'LC-Image-1' ? [100, 625] : [100];
      imgHeight = image?.id === 'LC-Image-2' ? '70' : imgHeight;
      isChapterHeader = true;
    } else {
      altText = image.alt;
    }
    const source = image?.getAttribute('srcRelative') ?? image?.src;
    if (source) {
      // seybi excluded image
      licitCell = new LicitTableCellImageElement(
        source,
        fillImg,
        fitoParent,
        bgColor,
        imgHeight,
        colWidth,
        altText,
        cellStyleInfo,
      );
    } else {
      licitCell = new LicitTableCellParagraph(
        cell,
        bgColor,
        colWidth,
        verAlign,
        cellStyleInfo,
      );
    }
    return { bgColor, isChapterHeader, licitCell };
  }

  private ParseNestedList(
    _listType: string,
    node: ChildNode,
    licitDocument: LicitDocumentElement,
    indent: number
  ) {
    let list: LicitBulletListElement | LicitOrderedListElement;
    const ulType = 'UL';
    const olType = 'OL';
    if (node.nodeName === ulType) {
      list = new LicitBulletListElement(indent);
    } else if (node.nodeName === olType) {
      list = new LicitOrderedListElement(indent);
    }
    const text = node.textContent;
    if (text && node.childNodes && node.childNodes.length > 0) {
      const childNodes = Array.from(node.childNodes);
      for (const n of childNodes) {
        const ulNode = Array.from(n.childNodes).find(
          (node) => node.nodeName === ulType
        );
        const olNode = Array.from(n.childNodes).find(
          (node) => node.nodeName === olType
        );
        const bulletItem = new LicitBulletListItemElement(n as HTMLElement);
        list.addItem(bulletItem);
        if (ulNode) {
          licitDocument.appendElement(list);
          indent++;
          this.ParseNestedList(ulType, ulNode, licitDocument, indent);
          list = new LicitBulletListElement(indent);
        }
        if (olNode) {
          licitDocument.appendElement(list);
          indent++;
          this.ParseNestedList(olType, olNode, licitDocument, indent);
          list = new LicitOrderedListElement(indent);
        }
      }
      if (list.listItems.length > 0) {
        licitDocument.appendElement(list);
      }
    }
  }

  /**
   * Returns the level of an element as described by the number at the end of its classname
   *
   * @param className - The className of the element
   * @returns The level as a number or zero if the level cannot be determined
   */
  private extractLevel(className: string): number {
    const customStyle = this.getCustomStyle(className);

    if (customStyle) {
      const level = customStyle.styles?.styleLevel;
      return level ? Number.parseInt(String(level), 10) : 0;
    } else {
      const matches = /\d{1,10}$/.exec(className);
      return matches ? Number.parseInt(matches[0], 10) : 0;
    }
  }

  /**
   * Determines if an element is a table or image then calls the appropriate parse method
   */
  private parseTableFigure(element: Element): void {
    if (element.querySelector('img')) {
      this.parseFigure(element);
    }
  }

  /**
   * Parse a table element
   */
  private parseTable(element: Element, useEnhancedTables: boolean): void {
    this.sanitizeElement(element);

    let tableType: ParserElementType = ParserElementType.Table;

    if (useEnhancedTables && !this.isTransparentTable(element)) {
      tableType = ParserElementType.EnhancedTable;
    }

    this.elements.push({
      node: element,
      type: tableType,
      class: '',
      level: 0,
      subText: '',
    });
  }

  /**
   * Parse a table element
   */
  private parseVignet(element: Element): void {
    this.elements.push({
      node: element,
      type: ParserElementType.vignet,
      class: '',
      level: 0,
      subText: '',
    });
  }
  /**
   * Parse a figure (image) element
   */
  private parseFigure(element: Element): void {
    this.elements.push({
      node: element,
      type: ParserElementType.Figure,
      class: '',
      level: 0,
      subText: '',
    });
  }

  /**
   * Parse a note element
   */
  private parseNote(element: Element): void {
    const level = this.extractLevel(element.className);

    this.elements.push({
      node: element,
      type: ParserElementType.Note,
      class: element.className,
      level,
      subText: '',
    });
  }

  /**
   * Parse a hr element
   */
  private parseHR(element: Element): void {
    this.elements.push({
      node: element,
      type: ParserElementType.hr,
      class: element.className,
      level: 0,
      subText: '',
    });
  }
  /**
   * Parse a chapter title element
   */
  private parseChapterTitle(element: Element): void {
    const level = this.extractLevel(element.className);
    this.elements.push({
      node: element,
      type: ParserElementType.ChapterTitle,
      class: element.className,
      level,
      subText: '',
    });
  }

  /**
   * Parse a chapter subtitle element
   */
  private parseChapterSubtitle(element: Element): void {
    const level = this.extractLevel(element.className);

    this.elements.push({
      node: element,
      type: ParserElementType.ChapterSubtitle,
      class: element.className,
      level,
      subText: '',
    });
  }

  /**
   * Parse a header element
   */
  private parseHeader(element: Element, nextElement: Element): void {
    const level = this.extractLevel(element.className);

    function updateTextContent(el: Element) {
      // Create a TreeWalker that only shows TEXT nodes
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          return node.textContent?.trim()
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      });

      let lastTextNode: Text | null = null;

      // Walk through all text nodes
      while (walker.nextNode()) {
        lastTextNode = walker.currentNode as Text;
      }

      // If we found a last text node
      if (lastTextNode) {
        const text = lastTextNode.textContent.trimEnd();

        if (text.endsWith('.')) {
          // Already ends with a period, just add a space
          lastTextNode.textContent = text + ' ';
        } else {
          // No period, add ". "
          lastTextNode.textContent = text + '. ';
        }
      }
    }

    /* Add nextElement as child if it exists instead of passing it as just subtext
       so that we can preserve the marks and apply them later on! */
    if (
      nextElement &&
      !shouldSkipNext(nextElement.className) &&
      nextElement.textContent?.length > 0
    ) {
      updateTextContent(element);
      element.appendChild(nextElement);
    }

    this.elements.push({
      node: element,
      type: ParserElementType.Header,
      class: element.className,
      level,
      subText: '',
    });
  }

  /**
   * Parse a bullet point item element
   */
  private parseBullet(element: Element): void {
    const level = this.extractLevel(element.className);

    this.elements.push({
      node: element,
      type: ParserElementType.BulletListItem,
      class: element.className,
      level,
      subText: '',
    });
  }

  /**
   * Parse a ordered list point item element
   */
  private parseOrdered(element: Element): void {
    const level = this.extractLevel(element.className);

    this.elements.push({
      node: element,
      type: ParserElementType.OrderedListItem,
      class: element.className,
      level,
      subText: '',
    });
  }

  /**
   * Parse a paragraph element
   */
  private parseParagraph(element: Element): void {
    this.sanitizeText(element);
    const level = this.extractLevel(element.className);
    this.elements.push({
      node: element,
      type: ParserElementType.Paragraph,
      class: element.getAttribute('classname') ?? element.className,
      level,
      subText: '',
    });
  }

  private parseDynamicHeader(element: Element): void {
    const level = this.extractLevel(element.className);

    const headerElement = {
      node: element,
      type: ParserElementType.TableTitle,
      class: element.className,
      level,
      subText: '',
    };

    const lastIndex = this.elements.length - 1;
    // Append element as child to the existing TableTitle node
    if (
      lastIndex >= 0 &&
      this.elements[lastIndex]?.type === ParserElementType.EnhancedTable &&
      this.elements[lastIndex - 1]?.type === ParserElementType.TableTitle
    ) {
      const targetNode = this.elements[lastIndex - 1].node as HTMLElement;
      targetNode.style.color = '#000000';
      targetNode.style.textTransform = 'none';

      // Move all children from `element` into `targetNode`
      while (element.firstChild) {
        targetNode.appendChild(element.firstChild);
      }
    } else if (
      lastIndex >= 0 &&
      this.elements[lastIndex]?.type === ParserElementType.EnhancedTable
    ) {
      // Insert header before the last table
      this.elements.splice(lastIndex, 0, headerElement);
    } else {
      // Push normally
      this.elements.push(headerElement);
    }
  }
  /** Sanitize the text content by removing specific characters */

  private sanitizeText(element: Element) {
    for (const node of Array.from(element.childNodes ?? [])) {
      if (
        node.nodeType === 1 &&
        node.textContent?.replaceAll(/\s{1,100}/g, '') === 'µµ'
      ) {
        node.remove();
      }
    }
  }

  /**
   * Parse a figure (image) title element
   */
  private parseFigureTitle(element: Element): void {
    const level = this.extractLevel(element.className);
    const img = element.querySelector('img');
    const isNewFiguretype = img?.width > 200;

    this.elements.push({
      node: element,
      type: isNewFiguretype
        ? ParserElementType.NewFigureTitle
        : ParserElementType.FigureTitle,
      class: element.className,
      level,
      subText: '',
    });
  }

  /**
   * Parse a ChangeBarPara element
   */
  private parseChangeBarPara(element: Element): void {
    const level = this.extractLevel(element.className);

    this.elements.push({
      node: element,
      type: ParserElementType.ChangeBarPara,
      class: element.className,
      level,
      subText: '',
    });
  }

  /**
   * Parse a table title element
   */
  private parseTableTitle(element: Element): void {
    const level = this.extractLevel(element.className);

    this.elements.push({
      node: element,
      type: ParserElementType.TableTitle,
      class: element.className,
      level,
      subText: '',
    });
  }

  /**
   * Parse an unknown element. Currently does nothing besides printing a warning to the console.
   */
  private parseUnknownElement(element: Element, message: string): void {
    console.warn(`Parsing unknown element: ${element.className}.${message}`);
    this.config.messageSink?.(
      'Warning',
      `Unknown element detected: ${element.className}.${message}`
    );
  }

  /**
   * Parse a section title element
   */
  private parseSectionTitle(element: Element): void {
    const level = this.extractLevel(element.className);

    this.elements.push({
      node: element,
      type: ParserElementType.SectionTitle,
      class: element.className,
      level,
      subText: '',
    });
  }

  /**
   * Parses an `Element` as determined by its `className`
   *
   * @param element - The `Element` to be parsed
   */
  private parseElement(element: Element, nextElement: Element): void {
    this.sanitizeElement(element);

    const className = element.className?.trim();

    if (!className) {
      this.elementsParsedMap.set('unknown', false);
      this.parseUnknownElement(element, 'Ignoring element with no class name.');
      return;
    }
    this.elementsParsedMap.set(className, true);

    switch (className) {
      case '_AF_Example':
      case '_AF_Note':
      case '_AF_Caution':
      case '_AF_Warning':
        this.parseNote(element);
        break;

      case 'chapterTitle':
      case 'attachmentTitle':
        this.parseChapterTitle(element);
        break;

      case 'chpara0':
      case 'attpara0':
      case 'chsubpara1':
      case 'attsubpara1':
        this.parseHeader(element, nextElement);
        break;

      case 'chTableTitle':
      case 'attTableTitleCont':
      case 'attTableTitle':
      case 'chTableTitleCont':
        this.parseTableTitle(element);
        break;

      case 'chText':
      case 'attText':
        this.parseChapterSubtitle(element);
        break;

      case 'i_bullet':
      case 'item_0':
      case 'i_bullet_0':
      case 'i_bullet_1':
      case 'i_bullet_2':
      case 'i_bullet_3':
      case 'i_bullet_4':
      case 'i_bullet_5':
      case 'i_bullet_6':
      case 'i_bullet_7':
      case 'i-bullet':
      case 'i-bullet-0':
      case 'i-bullet-1':
      case 'i-bullet-2':
      case 'i-bullet-3':
        this.parseParagraph(element);
        break;

      case 'para':
      case 'para0':
      case 'para1':
      case 'paraleadin':
      case 'paraLeft':
      case 'AFDP Bullet':
      case 'AFDP Sub-bullet':
      case 'acronym':
      case 'chsubpara2':
      case 'chsubpara3':
      case 'attsubpara2':
      case 'attsubpara3':
      case 'attsubpara4':
      case 'attsubpara5':
      case 'attsubpara6':
      case 'chsubpara4':
      case 'chsubpara5':
      case 'chsubpara6':
      case 'FM-AF-Note':
      case 'FM-AF-Example':
      case 'item_1':
      case 'item_2':
      case 'item_3':
      case 'Numbered1start':
      case 'Numbered1':
      case 'Body':
      case 'Level0_Start':
      case 'Level0_Cont':
      case 'Level1_Start':
      case 'Level1_Cont':
      case 'Level2_Start':
      case 'Level2_Cont':
      case 'Level3_Cont':
      case 'Level3_Start':
      case 'Level4_Cont':
      case 'Level4_Start':
        this.parseParagraph(element);
        break;

      case 'dynamicTableHeader':
        this.parseDynamicHeader(element);
        break;

      case 'chFigureTitle':
      case 'chFigureTitleCont':
      case 'attFigureTitle':
      case 'attFigureTitleCont':
        this.parseFigureTitle(element);
        break;

      case 'ChangeBarPara':
        this.parseChangeBarPara(element);
        break;

      case 'sectionTitle':
        this.parseSectionTitle(element);
        break;
      case 'UL':
        this.parseBullet(element);
        break;
      case 'Hidden':
        this.elementsParsedMap.set(className, false);
        this.parseUnknownElement(
          element,
          `Ignoring "${className}" because hidden text is not meant to be displayed.`
        );
        break;

      case 'Cross_Reference':
        this.elementsParsedMap.set(className, false);
        this.parseUnknownElement(
          element,
          `Ignoring "${className}" because cross-references text is not meant to be displayed.`
        );
        break;
      case 'FLOW_A':
        this.elementsParsedMap.set(className, false);
        this.parseUnknownElement(
          element,
          `Ignoring "${className}" the FLOW_A is for framemaker to support columns. There are no columns, so they are ignored`
        );
        break;

      case 'superscript':
      default:
        console.warn(
          `Unknown style detected: ${className}. Treating as paragraph.`
        );
        this.config.messageSink?.(
          'Warning',
          `Unknown style detected: ${className}`
        );
        this.parseParagraph(element);
        break;
    }
  }

  private parseElement_doc(element: Element, nextElement: Element): void {
    // SL-12

    this.elementsParsedMap.set(element.tagName, true);

    switch (
      element.tagName // SL-6
    ) {
      case '_AF_Example':
      case '_AF_Note':
      case '_AF_Caution':
      case '_AF_Warning':
        this.parseNote(element);
        break;
      case 'HR':
        this.parseHR(element);
        break;
      case 'chapterTitle':
      case 'attachmentTitle':
        this.parseChapterTitle(element);
        break;

      case 'H1':
      case 'H2':
      case 'H3':
      case 'H4':
        this.parseHeader(element, nextElement);
        break;

      case 'chTableTitle':
      case 'attTableTitleCont':
      case 'attTableTitle':
        this.parseTableTitle(element);
        break;

      case 'chText':
      case 'attText':
        this.parseChapterSubtitle(element);
        break;

      case 'i_bullet':
      case 'i_bullet_0':
      case 'i_bullet_1':
      case 'i_bullet_2':
      case 'i_bullet_3':
      case 'i_bullet_4':
      case 'i_bullet_5':
      case 'i_bullet_6':
      case 'i_bullet_7':
        this.parseBullet(element);
        break;

      case 'SPAN':
      case 'DIV':
        this.parseVignet(element);
        break;
      case 'P':
      case 'para1':
      case 'paraleadin':
      case 'paraLeft':
      case 'AFDP Bullet':
      case 'AFDP Sub-bullet':
      case 'attsubpara2':
      case 'attsubpara3':
      case 'attsubpara4':
      case 'attsubpara5':
      case 'attsubpara6':
      case 'i-bullet-2':
      case 'chsubpara4':
      case 'chsubpara5':
      case 'chsubpara6':
      case 'sumText':
        this.parseParagraph(element);
        break;

      case 'chFigureTitle':
      case 'attFigureTitle':
      case 'attFigureTitleCont':
        this.parseFigureTitle(element);
        break;

      case 'ChangeBarPara':
        this.parseChangeBarPara(element);
        break;

      case 'sectionTitle':
        this.parseSectionTitle(element);
        break;

      case 'SUP':
      case 'OL':
        this.parseOrdered(element);
        break;
      case 'UL':
      case 'LI':
        this.parseBullet(element);
        break;
      case 'Hidden':
        this.elementsParsedMap.set(element.className, false);
        this.parseUnknownElement(
          element,
          `Ignoring "${element.className}" because hidden text is not meant to be displayed.`
        );
        break;
      case 'Cross_Reference':
        this.elementsParsedMap.set(element.className, false);
        this.parseUnknownElement(
          element,
          `Ignoring "${element.className}" because Cross_Reference text is not meant to be displayed.`
        );
        break;
      case 'superscript':
      default:
        console.warn(
          `Unknown style detected: ${element.className}. Treating as paragraph.`
        );
        this.parseParagraph(element);
    }
  }

  /**
   * Cleans up the HTML by calling certain helper methods
   */
  private sanitizeHTML(html: string): string {
    return this.replaceKeywordsWithLinks(html);
  }

  /**
   * Replaces keywords in the HTML with links, as defined by the `replaceWithLinks` parameter in the config
   */
  private replaceKeywordsWithLinks(html: string): string {
    const arr = this.config.replaceWithLinks;
    for (const e of arr) {
      const regex = new RegExp(String.raw`\b${e.find}\b`, 'gi');
      const link = `<a href="${e.href}">${e.find}</a>`;
      html = html.replace(regex, link);
    }
    return html;
  }
  // For skipping triming inside table, add more classes to the class list for future use
  private matchClassToExcludeNumber(className: string) {
    let trimmedClassName = className.trim();
    trimmedClassName = trimmedClassName.toLowerCase();
    const classList = ['cellbody', 'cellheading', 'bolditalic'];
    return !classList.includes(trimmedClassName);
  }
  private sanitizeElement(element: Element | ChildNode) {
    const stripTextContent = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parentClass =
          (node.parentNode as Element)?.className?.toLowerCase?.() || '';

        if (
          this.config?.stripSectionNumbers &&
          this.matchClassToExcludeNumber(parentClass) &&
          parentClass !== 'acronym' // skip if parent is acronym
        ) {
          //Fix for paras having double sets of numbering
          node.textContent = node.textContent
            .replaceAll(/^[A-Z]?\d{1,5}(?:\.\d{1,5}){0,10}\.?(?=\s)/gm, '')
            .replaceAll('\n', '');
        }
        node.textContent = node.textContent.replace(/•\s{0,10000}/, '');

        node.textContent = node.textContent.replace(/^FM_/, '');

        // remove empty nodes
        if (node.textContent === '') {
          node.remove();
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Remove spacing spans containing only &nbsp; (FrameMaker spacing artifacts)
        if (
          node.tagName === 'SPAN' &&
          node.getAttribute('style')?.includes('letter-spacing') &&
          node.textContent === '\u00A0'
        ) {
          const prev = node.previousSibling;
          if (prev?.nodeType === Node.TEXT_NODE && !prev.textContent.endsWith(' ')) {
            prev.textContent += ' ';
          }
          node.remove();
          return;
        }

        for (const childNode of Array.from(node.childNodes)) {
          stripTextContent(childNode);
        }
      }
    };

    stripTextContent(element);
  }

  private getScaledWidth(width: number): string {
    if (width <= 200) {
      return width.toString();
    } else if (width <= 699) {
      return '624';
    } else {
      return '864';
    }
  }

  private isTransparentTable(element: Element): boolean {
    const firstRow = element.querySelector('tr');
    let isTransparent = false;
    const transparentColors = new Set([
      '#ffffff',
      '#fff',
      'rgb(255, 255, 255)',
      'transparent',
    ]);

    if (!firstRow) {
      return isTransparent;
    }

    const tdElements = firstRow.getElementsByTagName('td');

    for (const td of Array.from(tdElements)) {
      const style = td.getAttribute('style');
      if (style) {
        const borderColor = this.checkCellStyle(style);
        if (borderColor && transparentColors.has(borderColor.toLowerCase())) {
          isTransparent = true;
          break;
        }
      }
    }

    return isTransparent;
  }
  /**
   * Extracts and calculates the column widths from a given HTML table element.
   *
   * This function reads `<col>` elements within a `<colgroup>` of the table and
   * computes the pixel-based width for each column. It handles widths specified
   * in percentages and pixels. If all widths are in pixels, they are scaled using
   * a separate scaling method. If the computed widths are invalid or incomplete,
   * the function returns `undefined`.
   *
   * @param {HTMLTableElement} table - The HTML table element from which column widths are to be extracted.
   * @returns {number[] | undefined} An array of column widths in pixels, or `undefined` if the widths are invalid or missing.
   */
  private getColWidthArray(table: HTMLTableElement): number[] | undefined {
    const colElements: HTMLTableColElement[] = Array.from(
      table.querySelectorAll('colgroup > col')
    );
    if (colElements.length == 0) {
      return;
    }
    let widthArray: number[] = [];
    let totalPixelWidth = 619;
    const rawWidthArray: number[] = [];
    for (const col of colElements) {
      //Added fallback if style attribute is not present
      const width = col.style.width || col.getAttribute('width');
      // Skip this column if width is empty (no inline style set)
      if (!width) {
        return;
      }
      if (width.endsWith('%')) {
        const percent = Number.parseFloat(width);
        widthArray.push(Math.round((percent / 100) * 620));
      } else if (width.endsWith('px')) {
        rawWidthArray.push(Number.parseFloat(width));
      }
      // Skip invalid widths
      else {
        return;
      }
    }
    //Finding scaled widths for individual widths mentioned in px
    if (rawWidthArray.length === colElements.length) {
      widthArray = this.scaleWidthArray(rawWidthArray);
    }
    //Return undefined for any invalid case
    if (widthArray.length !== colElements.length) {
      return;
    }
    const sum = this.getSumOfArray(widthArray);
    if (sum < 200) {
      totalPixelWidth = sum;
    } else if (sum > 700) {
      totalPixelWidth = 861;
    }
    // cut/add excess to meet the size requirement
    widthArray[0] += totalPixelWidth - sum;
    return widthArray;
  }
  private setCellWidth(
    colSpan: number,
    cellIndex: number,
    colWidthArray: number[]
  ): number[] {
    return colWidthArray.slice(cellIndex, cellIndex + colSpan);
  }
  private scaleWidthArray(rawWidthArray: number[]) {
    const sum = this.getSumOfArray(rawWidthArray);
    if (sum < 200) {
      return rawWidthArray;
    } else {
      const newTotal = sum <= 700 ? 619 : 861;
      const scaledWidths = rawWidthArray.map((w) =>
        Math.round((w / sum) * newTotal)
      );
      return scaledWidths;
    }
  }
  private getSumOfArray(array: number[]): number {
    if (array.length == 0) {
      return 0;
    }
    return array.reduce((sum, n) => sum + n, 0);
  }
  /**
   * Determines the orientation (portrait or landscape) based on the total width.
   *
   * @param {number} totalWidth - The total width (in pixels) used to determine orientation.
   * @returns {'portrait' | 'landscape'} Returns 'portrait' if the width is less than 700 pixels; otherwise, returns 'landscape'.
   */
  private findOrientation(totalWidth: number): 'portrait' | 'landscape' {
    return totalWidth < 700 ? 'portrait' : 'landscape';
  }

  /**
   * Extracts image information from an HTMLImageElement.
   *
   * @param {HTMLImageElement} img - The image element to extract information from.
   * @returns {{ src: string; alt: string; width: number; height: number }} An object containing the image's source URL, alt text, width, and height.
   */
  private extractImageInfo(img: HTMLImageElement): ImageInfo {
    return {
      src: img.src,
      alt: img.alt,
      width: img.width,
      height: img.height,
    };
  }
  /**
   * Extracts note paragraphs from the last row of an HTML table if that row
   * contains a note header such as "OVERALL NOTE:" or "NOTES:".
   *
   * This function is designed for tables where the final row may optionally
   * contain a note. If such a note exists, it returns all <p> elements inside
   * the first <td> of that row, excluding the header line itself
   * (e.g., "OVERALL NOTE:" / "NOTES:").
   *
   * The returned <p> elements are kept as HTMLElement nodes so that they can
   * be further converted into structured ProseMirror content
   * (e.g., using NewLicitParagraphElement).
   *
   * If the table doesn't contain a note row, or if the expected structure is missing,
   * the function safely returns null.
   *
   * @param {HTMLTableSectionElement} table - The HTML table section (tbody) to extract the note from.
   * @returns {HTMLElement[] | null} - An array of <p> nodes representing the note paragraphs,
   *                                   or null if no note row was found.
   */

  private extractNote(table: HTMLTableSectionElement): HTMLElement[] | null {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) return null;

    const lastRow = rows.at(-1);
    const td = lastRow.querySelector('td');
    if (!td) return null;

    const paragraphs = Array.from(td.querySelectorAll('p'));
    if (paragraphs.length < 2) return null;

    const firstParaText = (paragraphs[0].textContent || '')
      .replaceAll(/\s{1,100}/g, ' ')
      .trim()
      .toUpperCase();

    if (
      firstParaText.includes('OVERALL NOTE:') ||
      firstParaText.includes('NOTES:')
    ) {
      return paragraphs.slice(1);
    }
    return null;
  }

  /**
   * Determines whether the given DOM element should be treated as a "table figure".
   *
   * Business context:
   * As per mail send on 07 Aug 2025:
   * > "Can we sense when there is an image and a line or two of text – maybe remove the vignette control."
   *
   * This function implements that detection logic by identifying elements that match
   * either of the following patterns:
   *
   * 1. It is **not** a <DIV> element, and its first child element is an <IMG>.
   * 2. It is a <DIV> element that:
   *    - Contains at least one <IMG> element anywhere inside (at any depth),
   *    - Contains exactly one <P> element anywhere inside,
   *    - That <P> element's trimmed text content is less than 100 characters
   *      (representing "a line or two of text").
   *
   * @param {Element} node - The DOM element to check.
   * @returns {boolean} `true` if the element qualifies as a table figure, otherwise `false`.
   */

  private isTableFigureNode(node: Element): boolean {
    const isImage =
      node.tagName !== 'DIV' && node.children.item(0)?.tagName === 'IMG';

    const isShortVignette =
      node.tagName === 'DIV' &&
      node.querySelector('img') &&
      node.querySelectorAll('p').length === 1 &&
      node.querySelector('p').textContent.trim().length < 100;

    return isImage || isShortVignette;
  }
  /**
   * Determines whether the provided class name corresponds to a note-related node.
   *
   * Checks if the given `className` matches any of the predefined note classes,
   * such as examples, notes, cautions, or warnings.
   *
   * @param className - The CSS class name to check.
   * @returns `true` if the class name is a recognized note node; otherwise, `false`.
   */
  private isNoteNode(className: string): boolean {
    const noteClasses = [
      '_AF_Example',
      '_AF_Note',
      '_AF_Caution',
      '_AF_Warning',
      'FM-AF-Note',
      'FM-AF-Example',
    ];
    return noteClasses.includes(className);
  }
}

function extractInfoIconData(
  this: void,
  dom: Document | Element
): HTMLOListElement[] {
  const nodes = dom.querySelectorAll('body > *');
  const filteredArr: HTMLOListElement[] = [];
  for (const node of Array.from(nodes)) {
    if (node.nodeName === 'OL' && node.id === 'infoIcon') {
      filteredArr.push(node as HTMLOListElement);
    }
  }

  return filteredArr;
}
