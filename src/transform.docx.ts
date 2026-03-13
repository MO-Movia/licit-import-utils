/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import type { Message, MessageSink } from './types';

interface DocumentElement {
  type: string;
  children?: DocumentElement[];
  value?: string;
  numbering?: {
    isOrdered: boolean;
    symbol?: string;
  } | null;
  indent?: null;
  styleId?: string;
  styleName?: string;
}

const SpecialCharacters =
  /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;

export class DocxTransformer {
  constructor(
    private readonly docType: string,
    public readonly messagesSink?: MessageSink
  ) {}

  public async transform(arrayBuffer: ArrayBuffer): Promise<Document> {
    const styleMapArray = [
      'u => u',
      "p[style-name='toc 1'] => !",
      "p[style-name='toc 2'] => !",
      "p[style-name='TOC 1'] => !",
      "p[style-name='TOC 2'] => !",
      "p[style-name='TOC 3'] => !",
      "p[style-name='TOC Heading'] => !",
      "p[style-name='Default'] => p.Normal:fresh",
      "p[style-name='List Paragraph'] => p.List-style:fresh",
    ];
    if ('Non Specific' !== this.docType) {
      styleMapArray.push(
        "p[style-name='List Paragraph'] => p.List-style:fresh"
      );
    }
    const options = {
      styleMap: styleMapArray,
      transformDocument: this.transformElement.bind(this),
      ignoreEmptyParagraphs: true,
    };
    // Mammoth is big, so we load it only when needed
    const mammoth = await import('@modusoperandi/mammoth');
    const result = (await mammoth.default.convertToHtml(
      { arrayBuffer },
      options
    )) as {
      value: string;
      messages?: Message[];
    };
    result.messages?.forEach((m) => {
      this.messagesSink?.(m.type, m.message);
    });
    return new DOMParser().parseFromString(result.value, 'text/html');
  }

  private transformElement(element: DocumentElement): DocumentElement {
    if (
      element.numbering &&
      'isOrdered' in element.numbering &&
      !element.numbering.isOrdered
    ) {
      if ('Non Specific' === this.docType) {
        element = this.transformNonAFDPBullets(element);
      } else {
        element = this.transformBullets(element);
      }
    }

    if (element.type === 'paragraph') {
      if ('Non Specific' !== this.docType) {
        element = this.transSubBullets(element);
      }
    }

    if (element?.children?.length > 0) {
      const docElements = element.children.filter(
        (c): c is DocumentElement => 'type' in c
      );
      if (docElements.length > 0) {
        const children = docElements.map((c) => this.transformElement(c));
        element = { ...element, children: children };
      }
    }

    return element;
  }

  /* Method to transform bullets */
  private transformBullets(element: DocumentElement): DocumentElement {
    const undefinedCharacter = '?';

    element = {
      ...element,
      indent: null,
      numbering: null,
      styleId: 'AFDP Bullet',
      styleName: 'AFDP Bullet',
    };

    if (
      element.children?.length > 0 &&
      'type' in element.children[0] &&
      element.children[0].children?.length > 0
    ) {
      const childCharcter = element.children[0].children[0];
      if (
        'value' in childCharcter &&
        childCharcter.value &&
        (SpecialCharacters.test(childCharcter.value) ||
          undefinedCharacter === childCharcter.value.trim())
      ) {
        element.children.splice(0, 1);
        element = {
          ...element,
          indent: null,
          numbering: null,
          styleId: 'AFDP Sub-bullet',
          styleName: 'AFDP Sub-bullet',
        };
      }
    }

    return element;
  }

  /* Method to transform Non AFDP bullets */
  private transformNonAFDPBullets(element: DocumentElement): DocumentElement {
    const undefinedCharacter = '?';

    element = {
      ...element,
      numbering: { ...element.numbering, symbol: '' },
    };

    if (element?.children?.[0]?.children?.[0]) {
      const childCharcter = element.children[0].children[0];
      if (
        childCharcter?.value &&
        (SpecialCharacters.test(childCharcter.value) ||
          undefinedCharacter === childCharcter.value.trim())
      ) {
        element.children.splice(0, 1);
        element = {
          ...element,
          numbering: { ...element.numbering, symbol: '' },
        };
      }
    }

    return element;
  }

  /* Method to transform Sub bullets */
  private transSubBullets(element: DocumentElement): DocumentElement {
    element.children ??= [];
    for (const child of element.children) {
      if ('type' in child && child.type === 'run') {
        child.children ??= [];
        for (const textChild of child.children) {
          if ('value' in textChild) {
            // Ensure it's a TextElement
            this.getElement(element, textChild);
          }
        }
      }
    }

    return element;
  }

  private getElement(
    element: DocumentElement,
    textChild: DocumentElement
  ): void {
    const undefinedCharacters = ['✪', '', '', '✪✪'];
    const bulletLimit = element.numbering ? 1 : 2;
    let bulletsCount = 0;

    const trimmedValue = textChild.value.trim();
    if (undefinedCharacters.includes(trimmedValue)) {
      bulletsCount += trimmedValue.length;
      element.styleId =
        element.styleId === 'AFDP Bullet' ||
        element.styleId === 'AFDP Sub-bullet' ||
        trimmedValue.length === 2
          ? 'AFDP Sub-bullet'
          : 'AFDP Bullet';
      element.styleName = element.styleId;
      textChild.value = '';
      if (bulletsCount > bulletLimit) {
        element.styleId = 'Normal';
        this.messagesSink?.('Warning', 'More than 2 bullet format detected.');
      }
    }
  }
}
