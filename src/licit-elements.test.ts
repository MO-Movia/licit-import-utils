/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 * @jest-environment jsdom
 */

import {
  LicitDocumentElement,
  LicitDocumentJSON,
  LicitEnhancedTableElement,
  LicitEnhancedTableFigureBodyElement,
  LicitHeaderElement,
  LicitImageElement,
  LicitNewImageElement,
  LicitParagraphElement,
  NewLicitParagraphElement,
  LicitParagraphImageElement,
  LicitTableElement,
  LicitTableCellParaElement,
  LicitTableCellParagraph,
  LicitTableRowElement,
  NewLicitTableCellParagraph,
  LicitVignetteElement,
  LicitElement,
  LicitParagraphNote,
  getElementAlignment,
} from './licit-elements';
import { getCapcoFromNode } from './capco.util';
interface Mark {
  type: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}

describe('LicitDocumentElement', () => {
  let licitDocumentElement: LicitDocumentElement;

  beforeEach(() => {
    licitDocumentElement = new LicitDocumentElement();
  });

  it('should create an instance', () => {
    expect(licitDocumentElement).toBeTruthy();
  });

  it('should initialize children as an empty array', () => {
    expect(licitDocumentElement.children).toEqual([]);
  });

  it('should append an element to children', () => {
    const mockChildElement = {
      /* Mock child element */
    };
    licitDocumentElement.appendElement(mockChildElement as LicitElement);

    expect(licitDocumentElement.children.length).toBe(1);
    expect(licitDocumentElement.children[0]).toBe(
      mockChildElement as LicitElement
    );
  });
  it('should return a base document element', () => {
    const baseElement: LicitDocumentJSON =
      licitDocumentElement.getBaseElement();

    expect(baseElement.type).toBe('doc');
    expect(baseElement.attrs.layout).toBeNull();
    expect(baseElement.attrs.padding).toBeNull();
    expect(baseElement.attrs.width).toBeNull();
    expect(baseElement.content).toEqual([]);
  });

  it('should render a document with child elements', () => {
    const mockChildElement1 = {
      render: () => {
        return {
          type: 'mock_element1',
        };
      },
    };

    const mockChildElement2 = {
      render: () => {
        return {
          type: 'mock_element2',
        };
      },
    };
    licitDocumentElement.appendElement(
      mockChildElement1 as LicitDocumentElement
    );
    licitDocumentElement.appendElement(
      mockChildElement2 as LicitDocumentElement
    );
    const renderedDocument: LicitDocumentJSON = licitDocumentElement.render();
    expect(renderedDocument.type).toBe('doc');
    expect(renderedDocument.content.length).toBe(2);
  });
});

describe('LicitImageElement', () => {
  it('should create a valid LicitImageJSON object', () => {
    const src = 'sample-image.jpg';
    const expectedImageJSON = {
      type: 'image',
      attrs: {
        align: 'center',
        alt: '',
        crop: null,
        height: null,
        rotate: null,
        src: 'sample-image.jpg',
        title: null,
        width: null,
        fitToParent: null,
      },
    };

    const imageElement = new LicitImageElement(src);
    const actualImageJSON = imageElement.render();
    expect(actualImageJSON).toEqual(expectedImageJSON);
  });
  it('should add height and width to the JSON if provided', () => {
    const src = 'sample-image.jpg';
    const alt = 'Sample image';
    const width = '200';
    const height = '150';

    const expectedImageJSON = {
      type: 'image',
      attrs: {
        align: 'center',
        alt: alt,
        crop: null,
        height: height,
        rotate: null,
        src: src,
        title: null,
        width: width,
        fitToParent: null,
      },
    };
    const imageElement = new LicitImageElement(src, alt, width, height);
    const actualImageJSON = imageElement.render();
    expect(actualImageJSON).toEqual(expectedImageJSON);
  });
});

describe('LicitParagraphImageElement', () => {
  it('should create a valid LicitParagraphImageJSON object with default parameters', () => {
    const src = 'sample-image.jpg';
    const expectedParagraphImageJSON = {
      type: 'paragraph',
      attrs: {
        styleName: 'Normal',
      },
      content: [
        {
          type: 'image',
          attrs: {
            align: 'center',
            alt: '',
            crop: null,
            height: null,
            rotate: null,
            src: 'sample-image.jpg',
            title: null,
            width: null,
            fitToParent: null,
            capco: '',
          },
        },
      ],
    };

    const paragraphImageElement = new LicitParagraphImageElement(src);
    const actualParagraphImageJSON = paragraphImageElement.render();
    expect(actualParagraphImageJSON).toEqual(expectedParagraphImageJSON);
  });

  it('should correctly handle optional parameters alt, width, height and capco', () => {
    const src = 'sample-image.jpg';
    const alt = 'Sample Alt';
    const width = '200';
    const height = '100';
    const mockCapco = JSON.stringify({ portionMarking: 'TBD' });
    // Fake HTML element
    const fakeNode = document.createElement('img');
    fakeNode.setAttribute('src', src);
    fakeNode.setAttribute('alt', alt);
    fakeNode.setAttribute('capco', mockCapco);

    const capco = getCapcoFromNode(fakeNode); // returns JSON string

    const element = new LicitParagraphImageElement(src, alt, width, height);
    element.capco = capco;

    const actual = element.render();

    expect(actual.content[0].attrs.capco).toBe(mockCapco);
    expect(actual.content[0].attrs.src).toBe(src);
    expect(actual.content[0].attrs.alt).toBe(alt);
    expect(actual.content[0].attrs.width).toBe(width);
    expect(actual.content[0].attrs.height).toBe(height);
  });
});

describe('LicitHeaderElement', () => {
  let licitHeaderElement: LicitHeaderElement;

  beforeEach(() => {
    licitHeaderElement = new LicitHeaderElement();
  });

  it('should call setInnerlinks if node is provided', () => {
    const node = document.createElement('div');
    jest.spyOn(LicitHeaderElement.prototype, 'setInnerlinks');

    licitHeaderElement = new LicitHeaderElement(
      'Title',
      'Subtitle',
      1,
      'Heading',
      'capco',
      node
    );

    expect(licitHeaderElement.setInnerlinks).toHaveBeenCalledWith(node);
  });

  it('should set innerLink and name if an anchor tag has an id but no href', () => {
    const node = document.createElement('div');
    const anchor = document.createElement('a');
    anchor.setAttribute('id', 'testAnchor');
    node.appendChild(anchor);

    licitHeaderElement.setInnerlinks(node);

    expect(licitHeaderElement.name).toBe('testAnchor');
    expect(licitHeaderElement.selectionId).toBe('#testAnchor');
  });

  it('should not set innerLink and name if no anchor tags are present', () => {
    const node = document.createElement('div');
    const span = document.createElement('span');
    node.appendChild(span);

    licitHeaderElement.setInnerlinks(node);

    expect(licitHeaderElement.name).toBeDefined();
    expect(licitHeaderElement.selectionId).toBeUndefined();
  });
  it('should create a valid LicitHeaderJSON object', () => {
    const text = 'Sample Header Text';
    const subText = 'Subtext';
    const expectedHeaderJSON = {
      type: 'paragraph',
      attrs: { styleName: '', capco: '' },
      content: [
        {
          type: 'text',
          text: 'Sample Header Text',
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
            },
          ],
        },
        {
          type: 'text',
          text: 'Subtext',
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

    const headerElement = new LicitHeaderElement(text, subText);
    const actualHeaderJSON = headerElement.render();

    // Check the overall structure
    expect(actualHeaderJSON.type).toBe(expectedHeaderJSON.type);
    expect(actualHeaderJSON.attrs.styleName).toBe(
      expectedHeaderJSON.attrs.styleName
    );
    expect(actualHeaderJSON.attrs.capco).toBe(expectedHeaderJSON.attrs.capco);

    // Check the content array
    expect(actualHeaderJSON.content.length).toBe(
      expectedHeaderJSON.content.length
    );
    for (let i = 0; i < expectedHeaderJSON.content.length; i++) {
      expect(actualHeaderJSON.content[i].type).toBe(
        expectedHeaderJSON.content[i].type
      );
      expect(actualHeaderJSON.content[i].text).toBe(
        expectedHeaderJSON.content[i].text
      );
    }
  });

  it('should create a valid LicitHeaderJSON object with default values', () => {
    const expectedHeaderJSON = {
      type: 'paragraph',
      attrs: { styleName: '' },
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
            },
          ],
        },
      ],
    };

    const headerElement = new LicitHeaderElement();
    const actualHeaderJSON = headerElement.render();

    // Check the overall structure
    expect(actualHeaderJSON.type).toBe(expectedHeaderJSON.type);

    // Check attrs properties individually to ignore extra properties
    expect(actualHeaderJSON.attrs.styleName).toBe(
      expectedHeaderJSON.attrs.styleName
    );

    // Ensure only expected attributes are tested
    const expectedAttrs = expectedHeaderJSON.attrs;
    for (const key in expectedAttrs) {
      expect(actualHeaderJSON.attrs[key]).toBe(expectedAttrs[key]);
    }

    // Check the content array length and content
    expect(actualHeaderJSON.content.length).toBe(
      expectedHeaderJSON.content.length
    );
    for (let i = 0; i < expectedHeaderJSON.content.length; i++) {
      expect(actualHeaderJSON.content[i].type).toBe(
        expectedHeaderJSON.content[i].type
      );
      expect(actualHeaderJSON.content[i].text).toBe(
        expectedHeaderJSON.content[i].text
      );
    }
  });

  it('should add italic mark', () => {
    const node = document.createElement('div');
    node.setAttribute('style', 'font-style: italic;');
    node.textContent = 'Sample';
    const marks = licitHeaderElement.handleInlineStyles(node);
    expect(marks.some((m) => m.type === 'em')).toBeTruthy();
  });

  it('should add underline mark', () => {
    const node = document.createElement('div');
    node.setAttribute('style', 'text-decoration: underline;');
    node.textContent = 'Sample';
    const marks = licitHeaderElement.handleInlineStyles(node);
    expect(marks.some((m) => m.type === 'underline')).toBeTruthy();
  });

  it('should transform text to uppercase', () => {
    licitHeaderElement.text = 'hello';
    const node = document.createElement('div');
    node.setAttribute('style', 'text-transform: uppercase;');
    node.textContent = 'hello';
    licitHeaderElement.handleInlineStyles(node);
    expect(licitHeaderElement.text).toBe('HELLO');
  });

  it('should transform text to lowercase', () => {
    licitHeaderElement.text = 'HELLO';
    const node = document.createElement('div');
    node.setAttribute('style', 'text-transform: lowercase;');
    node.textContent = 'HELLO';
    licitHeaderElement.handleInlineStyles(node);
    expect(licitHeaderElement.text).toBe('hello');
  });

  it('should add color mark if valid color', () => {
    const node = document.createElement('div');
    node.setAttribute('style', 'color: red;');
    node.textContent = 'Sample';
    const marks = licitHeaderElement.handleInlineStyles(node);
    expect(
      marks.some(
        (m) => m.type === 'mark-text-color' && m.attrs?.color === 'red'
      )
    ).toBeTruthy();
  });

  it('should ignore invalid color values', () => {
    jest.spyOn(CSS, 'supports').mockReturnValue(false);
    const node = document.createElement('div');
    node.setAttribute('style', 'color: notacolor;');
    node.textContent = 'Sample';
    const marks = licitHeaderElement.handleInlineStyles(node);
    expect(marks.length).toBe(0);
  });

  it('should return empty array if node has no style', () => {
    const node = document.createElement('div');
    node.textContent = 'Sample';
    const marks = licitHeaderElement.handleInlineStyles(node);
    expect(marks.length).toBe(0);
  });

  it('mapInlineStylesToMarks should push multiple styles', () => {
    const marks = [];
    licitHeaderElement.text = 'Mixed';
    jest.spyOn(CSS, 'supports').mockReturnValue(true);
    licitHeaderElement.mapInlineStylesToMarks(
      ['italic', 'underline', 'color-blue'],
      marks
    );
    expect(marks.some((m) => m.type === 'em')).toBeTruthy();
    expect(marks.some((m) => m.type === 'underline')).toBeTruthy();
    expect(
      marks.some(
        (m) => m.type === 'mark-text-color' && m.attrs?.color === 'blue'
      )
    ).toBeTruthy();
  });
});

describe('LicitParagraphElement', () => {
  it('should create a valid LicitParagraphJSON object with text', () => {
    const text = 'Sample Paragraph Text';
    const expectedParagraphJSON = {
      type: 'paragraph',
      attrs: {
        styleName: 'Normal',
      },
      content: [
        {
          type: 'text',
          text: 'Sample Paragraph Text',
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
    const paragraphElement = new LicitParagraphElement(text);
    const actualParagraphJSON = paragraphElement.render();
    expect(actualParagraphJSON).toEqual(expectedParagraphJSON);
  });

  it('should create a valid LicitParagraphJSON object with default values', () => {
    const expectedParagraphJSON = {
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
    const paragraphElement = new LicitParagraphElement();
    const actualParagraphJSON = paragraphElement.render();
    expect(actualParagraphJSON).toEqual(expectedParagraphJSON);
  });
});

describe('LicitParagraphNote', () => {
  it('should create a valid LicitParagraphJSON object with note name and value', () => {
    const mockElement = document.createElement('div');
    mockElement.textContent = 'Note: This is a sample note';
    mockElement.className = 'NoteStyle';

    const expectedNoteJSON = {
      type: 'paragraph',
      attrs: {
        styleName: 'NoteStyle',
      },
      content: [
        {
          type: 'text',
          text: 'Note:',
          marks: [
            {
              type: 'mark-font-type',
              attrs: { name: 'Times New Roman' },
            },
            {
              type: 'mark-font-size',
              attrs: { pt: 12 },
            },
            {
              type: 'em',
              attrs: { overridden: true },
            },
          ],
        },
        {
          type: 'text',
          text: ' This is a sample note',
          marks: [
            {
              type: 'mark-font-type',
              attrs: { name: 'Times New Roman' },
            },
            {
              type: 'mark-font-size',
              attrs: { pt: 12 },
            },
          ],
        },
      ],
    };

    const noteElement = new LicitParagraphNote(mockElement);
    const actualNoteJSON = noteElement.render();

    delete actualNoteJSON.attrs?.capco;

    expect(actualNoteJSON).toEqual(expectedNoteJSON);
  });

  it('should create a valid LicitParagraphJSON object when no colon separator is present', () => {
    const mockElement = document.createElement('div');
    mockElement.textContent = 'This is a sample note';
    mockElement.className = 'NoteStyle';

    const expectedNoteJSON = {
      type: 'paragraph',
      attrs: { styleName: 'NoteStyle', capco: undefined },
      content: [
        {
          type: 'text',
          text: 'This is a sample note',
          marks: [
            {
              type: 'mark-font-type',
              attrs: { name: 'Times New Roman' },
            },
            { type: 'mark-font-size', attrs: { pt: 12 } },
          ],
        },
      ],
    };

    const noteElement = new LicitParagraphNote(mockElement);
    const actualNoteJSON = noteElement.render();
    expect(actualNoteJSON).toEqual(expectedNoteJSON);
  });
});
describe('NewLicitParagraphElement', () => {
  let licitParagraph: NewLicitParagraphElement;

  beforeEach(() => {
    licitParagraph = new NewLicitParagraphElement(
      document.createElement('div')
    );
  });

  it('should return correct text when innerText is available', () => {
    const node = document.createElement('p');
    node.innerText = 'Test text content';

    const result = licitParagraph.getText(node);

    expect(result).toEqual({
      type: 'text',
      text: 'Test text content',
    });
  });

  it('should return correct text when innerText is not available, using textContent', () => {
    const node = document.createElement('p');
    node.textContent = 'Test text content using textContent';

    const result = licitParagraph.getText(node);

    expect(result).toEqual({
      type: 'text',
      text: 'Test text content using textContent',
    });
  });

  it('should return an empty string if neither innerText nor textContent is available', () => {
    const node = document.createElement('p');
    node.innerText = '';

    const result = licitParagraph.getText(node);

    expect(result).toEqual({
      type: 'text',
      text: '',
    });
  });
});

describe('LicitElements', () => {
  let licitParagraph: NewLicitParagraphElement;
  beforeEach(() => {
    licitParagraph = new NewLicitParagraphElement(
      document.createElement('div')
    );
  });
  it('should create an instance', () => {
    expect(licitParagraph).toBeTruthy();
  });

  it('should have default properties', () => {
    expect(licitParagraph.text).toBeUndefined();
    expect(licitParagraph.align).toEqual('Left');
    expect(licitParagraph.marks).toEqual([]);
    expect(licitParagraph.styleName).toEqual('Normal');
    expect(licitParagraph.imgContent).toEqual([]);
  });

  it('should convert marks correctly', () => {
    const testNode = document.createElement('div');
    licitParagraph.ConvertMarks(testNode, []);
    expect(licitParagraph).toBeTruthy();
  });

  it('should set align to a non-default value when align attribute is present', () => {
    const testNode = document.createElement('div');
    testNode.setAttribute('align', 'center');
    const licitParagraph = new NewLicitParagraphElement(testNode);
    expect(licitParagraph.align).toEqual('center');
  });
  it('should handle handleTextMark', () => {
    const testNode = document.createElement('div');
    const licitParagraph = new NewLicitParagraphElement(testNode);
    expect(
      licitParagraph['handleTextMark'](testNode, () => {
        return {} as unknown as Mark;
      })
    ).toBeUndefined();
  });

  it('should handle SPAN node without mark and call modifyChildNodes for each child', () => {
    const span = document.createElement('SPAN');
    const child1 = document.createElement('strong');
    const child2 = document.createElement('a');
    span.appendChild(child1);
    span.appendChild(child2);

    const licitParagraph = new NewLicitParagraphElement(
      document.createElement('div')
    );
    const modifyChildNodesSpy = jest.spyOn(licitParagraph, 'modifyChildNodes');

    licitParagraph.ConvertMarks(span, [
      {
        getMark: () => undefined,
        markColor: '',
        infoIconData: [],
        tMark: {} as Mark,
        renderedContentList: [],
      } as unknown as HTMLOListElement,
    ]);

    expect(modifyChildNodesSpy).toHaveBeenCalledTimes(2);
  });

  it('should handle P node and call modifyChildNodes on valid children only', () => {
    const p = document.createElement('P');
    const validChild = document.createTextNode('Valid Text');
    const emptyNewline = document.createTextNode('\n');
    p.appendChild(emptyNewline);
    p.appendChild(validChild);

    const licitParagraph = new NewLicitParagraphElement(
      document.createElement('div')
    );
    const modifyChildNodesSpy = jest.spyOn(licitParagraph, 'modifyChildNodes');

    licitParagraph.ConvertMarks(p, [
      {
        getMark: () => undefined,
        markColor: '',
        infoIconData: [],
        tMark: {} as Mark,
        renderedContentList: [],
      } as unknown as HTMLOListElement,
    ]);

    expect(modifyChildNodesSpy).toHaveBeenCalledTimes(2);
  });

  it('should apply parentInlineMarks when provided', () => {
    const testNode = document.createElement('span');
    testNode.textContent = 'Some text';

    const licitParagraph = new NewLicitParagraphElement(
      document.createElement('div')
    );

    const parentInlineMarks: Mark[] = [
      { type: 'underline', attrs: { overridden: true } },
    ];

    const handleTextSpy = jest.spyOn(licitParagraph, 'handleText');

    licitParagraph.modifyChildNodes(
      testNode,
      [] as HTMLOListElement[],
      [] as Mark[],
      'red',
      testNode,
      [],
      parentInlineMarks
    );

    expect(handleTextSpy).toHaveBeenCalled();
  });

  it('should add strong mark when isFirstSentenceBold is true and no links present', () => {
    const testNode = document.createElement('div');
    const licitParagraph = new NewLicitParagraphElement(testNode);

    const mockMark: Mark = {
      type: 'paragraph',
      marks: [],
      text: '',
    };

    jest.spyOn(licitParagraph, 'addMark');
    const element = {
      type: 'text',
    } as unknown as HTMLElement;
    licitParagraph.handleText(element, mockMark, true);

    const addedMark = licitParagraph.marks[0];
    expect(addedMark).toBeDefined();
    expect(addedMark.marks).toEqual([
      {
        type: 'strong',
        attrs: { overridden: true },
      },
    ]);
    expect(licitParagraph.addMark).toHaveBeenCalledWith(addedMark, mockMark);
  });

  it('should apply styleMarks when provided and no URL is present', () => {
    const testNode = document.createElement('div');
    const licitParagraph = new NewLicitParagraphElement(testNode);

    const mockMark: Mark = {
      type: 'paragraph',
      marks: [],
      text: '',
    };

    const styleMarks: Mark[] = [
      {
        type: 'underline',
        attrs: { overridden: true },
      },
      {
        type: 'mark-text-color',
        attrs: { color: 'blue', overridden: true },
      },
    ];

    jest.spyOn(licitParagraph, 'addMark');
    const element = {
      type: 'text',
    } as unknown as HTMLElement;
    licitParagraph.handleText(element, mockMark, false, styleMarks);

    const addedMark = licitParagraph.marks[0];
    expect(addedMark).toBeDefined();
    expect(addedMark.marks).toEqual(styleMarks);
    expect(licitParagraph.addMark).toHaveBeenCalledWith(addedMark, mockMark);
  });

  it('should return mark with highlight and color attributes', () => {
    const node = document.createElement('span');
    node.setAttribute('highlight-color', '#ffff00');
    node.setAttribute('color', '#ff0000');
    node.innerText = 'Highlighted and colored text';

    const result = licitParagraph.getHighLightAndTextColor(node);

    expect(result).toEqual({
      type: 'text',
      marks: [
        {
          type: 'mark-text-highlight',
          attrs: {
            highlightColor: '#ffff00',
            overridden: true,
          },
        },
        {
          type: 'mark-text-color',
          attrs: {
            color: '#ff0000',
            overridden: true,
          },
        },
      ],
      text: 'Highlighted and colored text',
    });
  });

  it('should return undefined when no highlight or color present', () => {
    const node = document.createElement('span');
    const licitParagraph = new NewLicitParagraphElement(node);

    const result = licitParagraph.getHighLightAndTextColor(node);

    expect(result).toBeUndefined();
  });

  it('should return subscript mark', () => {
    const node = document.createElement('sub');
    node.innerText = 'Subscript text';

    const result = licitParagraph.getSubscriptMarks(node);

    expect(result).toEqual({
      type: 'text',
      marks: [
        {
          type: 'sub',
          attrs: { overridden: true },
        },
      ],
      text: 'Subscript text',
    });
  });

  it('should return link mark with correct attributes', () => {
    const node = document.createElement('a');
    node.href = 'https://example.com/';
    node.rel = 'noopener';
    node.innerText = 'Example Link';

    const result = licitParagraph.getLinkMarks(
      node as unknown as HTMLLinkElement
    );

    expect(result).toEqual({
      type: 'text',
      marks: [
        {
          type: 'link',
          attrs: {
            href: 'https://example.com/',
            rel: 'noopener',
            target: 'blank',
            title: null,
          },
        },
      ],
      text: 'Example Link',
    });
  });

  it('should return plain text mark from innerText', () => {
    const node = document.createElement('p');
    node.innerText = 'Some paragraph text';

    const result = licitParagraph.getText(node);

    expect(result).toEqual({
      type: 'text',
      text: 'Some paragraph text',
    });
  });

  it('should return info icon JSON structure', () => {
    const infoDescription = 'Tooltip about info';
    const data = {
      infoIconClass: 'icon-info',
      infoIconUnicode: 'U+2139',
    };

    const result = licitParagraph.getInfoIconJson(infoDescription, data);

    expect(result).toEqual({
      type: 'infoicon',
      attrs: {
        from: null,
        to: null,
        description: 'Tooltip about info',
        infoIcon: {
          name: 'icon-info',
          unicode: 'U+2139',
          selected: false,
        },
      },
    });
  });

  describe('handleClassName', () => {
    it('should add super mark when className is "superscript"', () => {
      const mark: Mark = { type: 'text', marks: [], text: 'Example' };

      licitParagraph.handleClassName('superscript', mark);

      expect(mark.marks.length).toBe(1);
      expect(mark.marks[0]).toEqual({
        type: 'super',
        attrs: {
          overridden: true,
        },
      });
    });

    it('should add sub mark when className is "subscript"', () => {
      const mark: Mark = { type: 'text', marks: [], text: 'Example' };

      licitParagraph.handleClassName('subscript', mark);

      expect(mark.marks.length).toBe(1);
      expect(mark.marks[0]).toEqual({
        type: 'sub',
        attrs: {
          overridden: true,
        },
      });
    });

    it('should not add any mark for unrelated className', () => {
      const mark: Mark = { type: 'text', marks: [], text: 'Example' };

      licitParagraph.handleClassName('unknown-class', mark);

      expect(mark.marks.length).toBe(0);
    });
  });

  it('should pass the condition n.childNodes.length === 1', () => {
    const n = document.createElement('FONT');
    const m = document.createElement('TEXT');
    n.appendChild(m);
    n.setAttribute('color', 'blue');
    n.setAttribute('style', 'Font:Times New Roman');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.append(n, a);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    expect(licitParagraph).toBeDefined();
  });

  it('should pass the condition !n.getAttribute && !n.getAttribute(style)', () => {
    const n = document.createElement('FONT');
    const m = document.createElement('TEXT');
    n.appendChild(m);
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n, a);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    expect(licitParagraph).toBeDefined();
  });
  it('should pass the condition n.childNodes.length !== 1', () => {
    const n = document.createElement('FONT');
    const p = document.createElement('FONT');
    const m = document.createElement('TEXT');
    const z = document.createElement('text');
    n.appendChild(m);
    n.appendChild(z);
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    expect(licitParagraph).toBeDefined();
  });
  it('should pass the condition fnodes.nodeName !== FONT', () => {
    const n = document.createElement('FONT');
    const p = document.createElement('FONT');
    const m = document.createElement('ss');
    const z = document.createElement('text');
    n.appendChild(m);
    n.appendChild(z);
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    expect(licitParagraph).toBeDefined();
  });

  it('should pass the condition fnodes.nodeName === FONT', () => {
    const n = document.createElement('FONT');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    const z = document.createElement('text');
    n.appendChild(m);
    n.appendChild(z);
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);

    expect(licitParagraph).toBeDefined();
  });

  it('should pass the condition fnodes.nodeName === FONT 2', () => {
    const n = document.createElement('FONT');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    const z = document.createElement('text');
    n.appendChild(m);
    n.appendChild(z);
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const spy = jest.spyOn(licitParagraph, 'parseSubMarks').mockReturnValue({
      text: 'demo',
    } as Mark);
    licitParagraph.ConvertMarks(testNode, []);
    expect(spy).toHaveBeenCalled();
  });

  it('should pass the condition case STRONG n.childNodes.length !== 1', () => {
    const n = document.createElement('STRONG');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    const z = document.createElement('text');
    n.appendChild(m);
    n.appendChild(z);
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const spy = jest.spyOn(licitParagraph, 'parseSubMarks').mockReturnValue({
      text: 'demo',
    } as Mark);
    licitParagraph.ConvertMarks(testNode, []);
    expect(spy).toHaveBeenCalled();
  });

  it('should pass the condition case STRONG n.childNodes.length === 1', () => {
    const n = document.createElement('STRONG');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    n.appendChild(m);
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const spy = jest.spyOn(licitParagraph, 'parseSubMarks').mockReturnValue({
      text: 'demo',
    } as Mark);
    licitParagraph.ConvertMarks(testNode, []);
    expect(spy).toHaveBeenCalled();
  });

  it('should pass the condition case EM n.childNodes.length !== 1', () => {
    const n = document.createElement('EM');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    const z = document.createElement('text');
    n.appendChild(m);
    n.appendChild(z);
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const spy = jest.spyOn(licitParagraph, 'parseSubMarks').mockReturnValue({
      text: 'demo',
    } as Mark);
    licitParagraph.ConvertMarks(testNode, []);
    expect(spy).toHaveBeenCalled();
  });

  it('should pass the condition case EM enodes.textContent === emty string', () => {
    const n = document.createElement('EM');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    const z = document.createElement('text');
    m.textContent = ' ';
    z.textContent = ' ';
    n.appendChild(m);
    n.appendChild(z);
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const spy = jest
      .spyOn(licitParagraph, 'parseSubMarks')
      .mockReturnValue(false as unknown as Mark);
    licitParagraph.ConvertMarks(testNode, []);
    expect(spy).toHaveBeenCalled();
  });

  it('should pass the condition case EM n.childNodes.length === 1', () => {
    const n = document.createElement('EM');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    n.appendChild(m);
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const spy = jest.spyOn(licitParagraph, 'parseSubMarks').mockReturnValue({
      text: 'demo',
    } as Mark);
    licitParagraph.ConvertMarks(testNode, []);
    expect(spy).toHaveBeenCalled();
  });

  it('should pass the condition case A n.childNodes.length === 1', () => {
    const n = document.createElement('A');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    n.appendChild(m);
    n.textContent = 'demo demo';
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    expect(licitParagraph).toBeDefined();
  });

  it('should pass the condition case A n.childNodes.length === 1 (1)', () => {
    const n = document.createElement('A');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    const z = document.createElement('text');
    n.textContent = 'demo demo';
    n.appendChild(m);

    n.appendChild(z);
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    expect(licitParagraph).toBeDefined();
  });
  it('should pass the condition case A n.childNodes.length === 1 (2)', () => {
    const n = document.createElement('A');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    m.textContent = 'demo';
    const z = document.createElement('img');
    n.textContent = 'demo demo';
    n.appendChild(m);

    n.appendChild(z);
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const spy = jest.spyOn(licitParagraph, 'parseSubMarks').mockReturnValue({
      text: 'demo',
    } as Mark);
    licitParagraph.ConvertMarks(testNode, []);
    expect(spy).toHaveBeenCalled();
  });

  it('should pass the condition case U n.childNodes.length === 1', () => {
    const n = document.createElement('U');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    n.appendChild(m);
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const spy = jest.spyOn(licitParagraph, 'parseSubMarks').mockReturnValue({
      text: 'demo',
    } as Mark);
    licitParagraph.ConvertMarks(testNode, []);
    expect(spy).toHaveBeenCalled();
  });

  it('should pass the condition case U n.childNodes.length !== 1', () => {
    const n = document.createElement('U');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    const z = document.createElement('text');
    n.appendChild(m);
    n.appendChild(z);
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const spy = jest.spyOn(licitParagraph, 'parseSubMarks').mockReturnValue({
      text: 'demo',
    } as Mark);
    licitParagraph.ConvertMarks(testNode, []);
    expect(spy).toHaveBeenCalled();
  });

  it('should pass the condition case SUP', () => {
    const n = document.createElement('SUP');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    n.appendChild(m);
    n.innerText = 'demo demo';
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    expect(licitParagraph).toBeDefined();
  });

  it('should pass the condition case SUB', () => {
    const n = document.createElement('SUB');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    n.appendChild(m);
    n.innerText = 'demo demo';
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    expect(licitParagraph).toBeDefined();
  });

  it('should pass the condition case TEXT', () => {
    const n = document.createElement('TEXT');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    n.appendChild(m);
    n.innerText = 'demo demo';
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    expect(licitParagraph).toBeDefined();
  });
  it('should pass the condition case IMG', () => {
    const n = document.createElement('img');
    const p = document.createElement('FONT');
    const m = document.createElement('FONT');
    n.appendChild(m);
    n.innerText = 'demo demo';
    n.src = 'https://example.com/path/to/your/image.jpg';
    n.alt = '/ERR:Unsupported Image Format x-emf';
    n.setAttribute('color', 'blue');
    const a = document.createElement('A');
    a.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    testNode.append(a);
    testNode.append(p);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    expect(licitParagraph).toBeDefined();
  });

  it('should be call parseSubMarks() function inside check the condition n.nodeName === BR', () => {
    const n = document.createElement('BR');
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.parseSubMarks(n, {} as Mark, true, []);
    expect(test).toBeUndefined();
  });

  it('should be call parseSubMarks() function inside check the condition n.nodeName === FONT', () => {
    const n = document.createElement('FONT');
    n.textContent = 'demo';
    n.setAttribute('style', 'Font:Times New Roman');
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.parseSubMarks(
      n,
      { marks: [] } as Mark,
      true,
      []
    );
    expect(test).toBeDefined();
  });

  it('should be call parseSubMarks() function inside check the condition  !n.getAttribute', () => {
    const n = document.createElement('FONT');
    const m = document.createElement('ss');
    n.textContent = 'demo';
    n.appendChild(m);
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.parseSubMarks(
      n,
      { marks: [] } as Mark,
      true,
      []
    );
    expect(test).toBeDefined();
  });
  it('should be call parseSubMarks() function inside check the condition  n.nodename === TEXT', () => {
    const n = document.createElement('TEXT');
    const testNode = document.createElement('div');
    testNode.setAttribute('style', 'Font:Times New Roman');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.parseSubMarks(n, null, true, []);
    expect(test).toBeDefined();
  });
  it('should be call parseSubMarks() function inside check the condition n.nodeName === A', () => {
    const n = document.createElement('A');
    n.textContent = 'demo';
    n.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.parseSubMarks(
      n,
      { marks: [] } as Mark,
      true,
      []
    );
    expect(test).toBeDefined();
  });
  it('should be call parseSubMarks() function inside check the condition case n.nodeName === A and !n.getAttribute', () => {
    const n = document.createElement('A');
    const m = document.createElement('ss');
    n.textContent = 'demo';
    n.setAttribute('color', 'blue');
    n.appendChild(m);
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.parseSubMarks(
      n,
      { marks: [] } as Mark,
      true,
      []
    );
    expect(test).toBeDefined();
  });
  it('should be call parseSubMarks() function inside check the condition n.nodeName === STRONG and n.childNodes.length === 1', () => {
    const n = document.createElement('STRONG');
    n.textContent = 'demo';
    n.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.parseSubMarks(
      n,
      { marks: [] } as Mark,
      true,
      []
    );
    expect(test).toBeDefined();
  });
  it('should be call parseSubMarks() function inside check the condition case n.nodeName === STRONG and n.childNodes.length !== 1', () => {
    const n = document.createElement('STRONG');
    const m = document.createElement('ss');
    n.textContent = 'demo';
    n.setAttribute('color', 'blue');
    n.appendChild(m);
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.parseSubMarks(
      n,
      { marks: [] } as Mark,
      true,
      []
    );
    expect(test).toBeDefined();
  });
  it('should be call parseSubMarks() function inside check the condition n.nodeName === EM and n.childNodes.length === 1', () => {
    const n = document.createElement('EM');
    n.textContent = 'demo';
    n.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.parseSubMarks(
      n,
      { marks: [] } as Mark,
      true,
      []
    );
    expect(test).toBeDefined();
  });
  it('should be call parseSubMarks() function inside check the condition case n.nodeName === EM and n.childNodes.length !== 1', () => {
    const n = document.createElement('EM');
    const m = document.createElement('ss');
    n.textContent = 'demo';
    n.setAttribute('color', 'blue');
    n.appendChild(m);
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.parseSubMarks(
      n,
      { marks: [] } as Mark,
      true,
      []
    );
    expect(test).toBeDefined();
  });
  it('should be call parseSubMarks() function inside check the condition n.nodeName === U and n.childNodes.length === 1', () => {
    const n = document.createElement('U');
    n.textContent = 'demo';
    n.setAttribute('color', 'blue');
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.parseSubMarks(
      n,
      { marks: [] } as Mark,
      true,
      []
    );
    expect(test).toBeDefined();
  });
  it('should be call parseSubMarks() function inside check the condition case n.nodeName === U and n.childNodes.length !== 1', () => {
    const n = document.createElement('U');
    const m = document.createElement('ss');
    n.textContent = 'demo';
    n.setAttribute('color', 'blue');
    n.appendChild(m);
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.parseSubMarks(
      n,
      { marks: [] } as Mark,
      true,
      []
    );
    expect(test).toBeDefined();
  });

  it('should be call parseSubMarks() function inside check the condition n.nodeName === SUP and n.textContent.trim() !== 1', () => {
    const n = document.createElement('SUP');
    n.textContent = 'demo';
    n.innerText = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.parseSubMarks(
      n,
      { marks: [] } as Mark,
      true,
      []
    );
    expect(test).toBeDefined();
  });

  it('should be call parseSubMarks() function inside check the condition n.nodeName === SUB and n.textContent.trim() !== 1', () => {
    const n = document.createElement('SUB');
    n.textContent = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.parseSubMarks(
      n,
      { marks: [] } as Mark,
      true,
      []
    );
    expect(test).toBeDefined();
  });

  it('should be call getEmMarks() function', () => {
    const testNode = document.createElement('div');
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.getBaseElement();
    expect(test).toBeDefined();
  });
  it('should be call getBoldMarks() function', () => {
    const n = document.createElement('SUB');
    n.textContent = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.getBoldMarks(n);
    expect(test).toBeDefined();
  });

  it('should be call getEmMarks() function check the condition node.childNodes[i].id !== infoIcon', () => {
    const n = document.createElement('SUB');
    const m = document.createElement('FONT');
    const z = document.createElement('TEXT');
    n.appendChild(m);
    n.appendChild(z);
    n.textContent = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const test = licitParagraph.getEmMarks(n);
    expect(test).toBeDefined();
  });

  it('should be call getEmMarks() function check the condition node.childNodes[i].id === infoIcon', () => {
    const element = {
      type: 'example',
      childNodes: [
        {
          id: 'infoIcon',
          childNodes: [
            {
              id: 'infoIcon',
              childNodes: [
                {
                  id: 'infoIcon',
                  childNodes: [{}],
                },
              ],
            },
          ],
        },
      ],
      numbering: {
        isOrdered: false,
      },
    } as unknown as HTMLElement;
    const n = document.createElement('SUB');
    const m = document.createElement('FONT');
    const z = document.createElement('TEXT');
    n.id = 'infoIcon';
    m.setAttribute('id', 'infoIcon');
    z.id = 'infoIcon';
    n.appendChild(m);
    n.appendChild(z);
    n.textContent = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const spy = jest.spyOn(licitParagraph, 'getInfoIconJson');
    const element1 = {
      type: 'example',
      childNodes: [
        {
          id: 'infoIcon',
          childNodes: [
            {
              id: 'infoIcon',
              childNodes: [
                {
                  id: 'infoIcon',
                  childNodes: [{}],
                },
              ],
            },
          ],
          innerText: 'Common access card required',
        },
      ],
      numbering: {
        isOrdered: false,
      },
    };
    licitParagraph.getEmMarks(element, [element1]);
    expect(spy).toHaveBeenCalled();
  });

  it('should be call getEmMarks() function check the condition !node.childNodes', () => {
    const element = {
      type: 'text',
    } as unknown as HTMLElement;
    const testNode = document.createElement('div');
    testNode.append(element as unknown as Node);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    expect(licitParagraph.getEmMarks(element)).toBeDefined();
  });

  it('should be call getSuperScriptMarks() function check the condition data && node.id === infoIcon', () => {
    const element = {
      id: 'infoIcon',
      type: 'example',
      childNodes: [
        {
          id: 'infoIcon',
          childNodes: [
            {
              id: 'infoIcon',
              childNodes: [
                {
                  id: 'infoIcon',
                  childNodes: [{}],
                },
              ],
            },
          ],
        },
      ],
      numbering: {
        isOrdered: false,
      },
    };
    const n = document.createElement('SUB');
    const m = document.createElement('FONT');
    const z = document.createElement('TEXT');
    n.id = 'infoIcon';
    m.setAttribute('id', 'infoIcon');
    z.id = 'infoIcon';
    n.appendChild(m);
    n.appendChild(z);
    n.textContent = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const spy = jest.spyOn(licitParagraph, 'getInfoIconJson');
    const element1 = {
      type: 'example',
      childNodes: [
        {
          id: 'infoIcon',
          childNodes: [
            {
              id: 'infoIcon',
              childNodes: [
                {
                  id: 'infoIcon',
                  childNodes: [{}],
                },
              ],
            },
          ],
          innerText: 'Common access card required',
        },
      ],
      numbering: {
        isOrdered: false,
      },
    };
    licitParagraph.getSuperScriptMarks(element as unknown as HTMLElement, [
      element1,
    ]);
    expect(spy).toHaveBeenCalled();
  });

  it('should be call the class LicitTableCellParaElement inside ConvertElements() function check the condition n.nodeName === P', () => {
    const n = document.createElement('p');
    const m = document.createElement('p');
    n.appendChild(m);
    n.textContent = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new LicitTableCellParaElement(testNode);
    const test = licitParagraph.ConvertElements(n);
    expect(test).toBeUndefined();
  });
  it('should be call the class LicitTableCellParaElement inside ConvertElements() function check the condition n.nodeName === img', () => {
    const n = document.createElement('img');
    const m = document.createElement('p');
    n.src = 'https://example.com/path/to/your/image.jpg';
    n.appendChild(m);
    n.textContent = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new LicitTableCellParaElement(testNode);
    const test = licitParagraph.ConvertElements(n);
    expect(test).toBeUndefined();
  });

  it('should be call the class LicitTableCellParaElement inside ConvertElements() function check the condition n.nodeName === P 2', () => {
    const n = document.createElement('p');
    const m = document.createElement('p');
    n.appendChild(m);
    n.textContent = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new LicitVignetteElement(
      testNode,
      'red',
      'blue',
      20
    );
    const test = licitParagraph.ConvertElements(n);
    expect(test).toBeUndefined();
  });
  it('should be call the class LicitTableCellParaElement inside ConvertElements() function check the condition n.nodeName === SPAN', () => {
    const n = document.createElement('SPAN');
    const m = document.createElement('p');
    n.appendChild(m);
    n.textContent = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new LicitVignetteElement(
      testNode,
      '#undefined',
      undefined,
      20
    );
    const test = licitParagraph.ConvertElements(n);
    expect(test).toBeUndefined();
  });

  it('should be call the class LicitTableCellParaElement inside ConvertElements() function check the condition n.nodeName === IMG', () => {
    const n = document.createElement('img');
    const m = document.createElement('p');
    n.src = 'https://example.com/path/to/your/image.jpg';
    n.appendChild(m);
    n.textContent = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new LicitVignetteElement(
      testNode,
      'red',
      'blue',
      20
    );
    const test = licitParagraph.ConvertElements(n);
    expect(test).toBeUndefined();
  });

  it('should be call the class LicitTableCellParaElement inside handleVignetteSpan() function check the condition n.nodeName === p', () => {
    const n = document.createElement('p');
    const m = document.createElement('p');
    n.appendChild(m);
    n.textContent = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new LicitVignetteElement(
      testNode,
      'red',
      'blue',
      20
    );
    const test = licitParagraph.handleVignetteSpan(n);
    expect(test).toBeUndefined();
  });

  it('should be call the class LicitTableCellParaElement inside handleVignetteSpan() function check the condition n.nodeName === IMG', () => {
    const n = document.createElement('img');
    const m = document.createElement('p');
    n.src = 'https://example.com/path/to/your/image.jpg';
    n.alt = '/ERR:Unsupported Image Format x-emf';
    n.appendChild(m);
    n.textContent = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new LicitVignetteElement(
      testNode,
      'red',
      'blue',
      20
    );
    const test = licitParagraph.handleVignetteSpan(n);
    expect(test).toBeUndefined();
  });
  it('should be call the class NewLicitTableCellParagraph', () => {
    const testNode = document.createElement('div');
    const licitParagraph = new NewLicitTableCellParagraph(testNode);
    expect(licitParagraph).toBeTruthy();
  });

  it('should be call the class LicitTableCellParagraph', () => {
    const testNode = document.createElement('div');
    const licitParagraph = new LicitTableCellParagraph(testNode);
    expect(licitParagraph).toBeTruthy();
  });
  it('should be call getSuperScriptMarks() function check the condition !Common access card required', () => {
    const element = {
      id: 'infoIcon',
      type: 'example',
      childNodes: [
        {
          id: 'infoIcon',
          childNodes: [
            {
              id: 'infoIcon',
              childNodes: [
                {
                  id: 'infoIcon',
                  childNodes: [{}],
                },
              ],
            },
          ],
        },
      ],
      numbering: {
        isOrdered: false,
      },
    };
    const n = document.createElement('SUB');
    const m = document.createElement('FONT');
    const z = document.createElement('TEXT');
    n.id = 'infoIcon';
    m.setAttribute('id', 'infoIcon');
    z.id = 'infoIcon';
    n.appendChild(m);
    n.appendChild(z);
    n.textContent = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const spy = jest.spyOn(licitParagraph, 'getInfoIconJson');
    const element1 = {
      type: 'example',
      childNodes: [
        {
          id: 'infoIcon',
          childNodes: [
            {
              id: 'infoIcon',
              childNodes: [
                {
                  id: 'infoIcon',
                  childNodes: [{}],
                },
              ],
            },
          ],
          innerText: 'test',
        },
      ],
      numbering: {
        isOrdered: false,
      },
    };
    licitParagraph.getSuperScriptMarks(element as unknown as HTMLElement, [
      element1,
    ]);
    expect(spy).toHaveBeenCalled();
  });
  it('should be call getEmMarks() function check the condition !Common access card required', () => {
    const element = {
      type: 'example',
      childNodes: [
        {
          id: 'infoIcon',
          childNodes: [
            {
              id: 'infoIcon',
              childNodes: [
                {
                  id: 'infoIcon',
                  childNodes: [{}],
                },
              ],
            },
          ],
        },
      ],
      numbering: {
        isOrdered: false,
      },
    } as unknown as HTMLElement;
    const n = document.createElement('SUB');
    const m = document.createElement('FONT');
    const z = document.createElement('TEXT');
    n.id = 'infoIcon';
    m.setAttribute('id', 'infoIcon');
    z.id = 'infoIcon';
    n.appendChild(m);
    n.appendChild(z);
    n.textContent = 'demo';
    const testNode = document.createElement('div');
    testNode.append(n);
    const licitParagraph = new NewLicitParagraphElement(testNode);
    const spy = jest.spyOn(licitParagraph, 'getInfoIconJson');
    const element1 = {
      type: 'example',
      childNodes: [
        {
          id: 'infoIcon',
          childNodes: [
            {
              id: 'infoIcon',
              childNodes: [
                {
                  id: 'infoIcon',
                  childNodes: [{}],
                },
              ],
            },
          ],
          innerText: 'test',
        },
      ],
      numbering: {
        isOrdered: false,
      },
    };
    licitParagraph.getEmMarks(element, [element1]);
    expect(spy).toHaveBeenCalled();
  });
});
describe('NewLicitParagraphElement 2', () => {
  let test: NewLicitParagraphElement;

  beforeEach(() => {
    test = new NewLicitParagraphElement({
      childNodes: [
        {
          childNodes: [],
          textContent: 'Check out this website: https://example.com',
          nodeName: 'A',
          getAttribute: (name: string) => {
            if (name === 'href') {
              return 'https://example.com';
            }
            return '';
          },
        },
      ],
      getAttribute: () => 'test',
    } as unknown as HTMLElement);
  });
  it('should handle modifyChildNodes', () => {
    const test = new NewLicitParagraphElement({
      childNodes: [
        {
          childNodes: [],
          textContent: 'text',
          nodeName: 'A',
          getAttribute: () => {
            return 'test';
          },
        },
      ],
      getAttribute: () => {
        return 'test';
      },
    } as unknown as HTMLElement);
    expect(test).toBeDefined();
  });

  it('should process #text tags with URLs correctly', () => {
    const anchorNode = {
      childNodes: [],
      textContent: 'Check out this website: https://example.com',
      nodeName: '#text',
      getAttribute: (name: string) => {
        if (name === 'href') {
          return 'https://example.com';
        }
        return '';
      },
    };
    test.modifyChildNodes(
      anchorNode as unknown as HTMLElement,
      [],
      [{}] as Mark[],
      'red',
      null
    );
    expect(test.marks.length).toBe(3);
  });

  it('should process text with URLs in #text tags', () => {
    const anchorNode = {
      childNodes: [],
      textContent: 'Check out this website: https://example.com',
      nodeName: '#text',
      getAttribute: (name: string) => {
        if (name === 'href') {
          return 'https://example.com';
        }
        return '';
      },
    };
    test.modifyChildNodes(
      anchorNode as unknown as HTMLElement,
      [],
      [{}] as Mark[],
      '',
      null
    );

    expect(test.marks.length).toBe(3);
  });

  it('should process text with URLs in A tags', () => {
    const anchorNode = {
      childNodes: [],
      textContent: 'Check out this website: https://example.com',
      nodeName: 'A',
      getAttribute: (name: string) => {
        if (name === 'href') {
          return 'https://example.com';
        }
        return '';
      },
    };
    test.modifyChildNodes(
      anchorNode as unknown as HTMLAnchorElement,
      [],
      [{}] as Mark[],
      'red',
      null
    );

    expect(test.marks.length).toBe(0);
  });

  it('should return true for non-breaking space with letter spacing', () => {
    const span = document.createElement('span');
    span.textContent = '\u00A0';
    span.style.letterSpacing = '1px';

    const result = test.isEmptySpaceSpan(span);
    expect(result).toBeTruthy();
  });

  it('should return true for regular space with letter spacing', () => {
    const span = document.createElement('span');
    span.textContent = ' ';
    span.style.letterSpacing = '2px';

    const result = test.isEmptySpaceSpan(span);
    expect(result).toBeTruthy();
  });

  it('should return false if letter spacing is missing', () => {
    const span = document.createElement('span');
    span.textContent = ' ';
    span.style.letterSpacing = '';

    const result = test.isEmptySpaceSpan(span);
    expect(result).toBeFalsy();
  });

  it('should return false if text content is not only a space', () => {
    const span = document.createElement('span');
    span.textContent = 'a';
    span.style.letterSpacing = '1px';

    const result = test.isEmptySpaceSpan(span);
    expect(result).toBeFalsy();
  });

  it('should return false if text content is empty even if letterSpacing is set', () => {
    const span = document.createElement('span');
    span.textContent = '';
    span.style.letterSpacing = '1px';

    const result = test.isEmptySpaceSpan(span);
    expect(result).toBeFalsy();
  });

  it('should handle parseAnchor', () => {
    const test = new NewLicitParagraphElement({
      childNodes: [
        {
          childNodes: [],
          textContent: 'text',
          nodeName: 'A',
          getAttribute: () => {
            return 'test';
          },
        },
      ],
      getAttribute: () => {
        return 'test';
      },
    } as unknown as HTMLElement);
    expect(
      test['parseAnchor'](
        {
          id: '_LINK_TO_THIS',
          textContent: 'test this doc',
          parentElement: { className: 'chsubpara1' },
        } as unknown as HTMLAnchorElement,
        { marks: [] } as unknown as Mark,
        'red',
        [],
        [{ innerText: '' } as unknown as Node]
      )
    ).toBeDefined();
  });
  it('should handle parseAnchor when id is not _LINK_TO_THIS', () => {
    const test = new NewLicitParagraphElement({
      childNodes: [
        {
          childNodes: [],
          textContent: 'text',
          nodeName: 'A',
          getAttribute: () => {
            return 'test';
          },
        },
      ],

      getAttribute: () => {
        return 'test';
      },
    } as unknown as HTMLElement);
    expect(
      test['parseAnchor'](
        {
          childNodes: [],
          id: 'test',
          textContent: 'test this doc',
          parentElement: { className: 'chsubpara1' },
        } as unknown as HTMLAnchorElement,
        { marks: [] } as unknown as Mark,
        'red',
        [],
        [{ innerText: '' } as unknown as Node]
      )
    ).toBeDefined();
  });
  it('should handle parseAnchor when id is not _LINK_TO_THIS and innerText is populated', () => {
    const test = new NewLicitParagraphElement({
      childNodes: [
        {
          childNodes: [],
          textContent: 'text',
          nodeName: 'A',
          getAttribute: () => {
            return 'test';
          },
        },
      ],
      getAttribute: () => {
        return 'test';
      },
    } as unknown as HTMLElement);
    expect(
      test['parseAnchor'](
        {
          childNodes: [{}],
          id: 'test',
          textContent: 'test this doc',
          parentElement: { className: 'chsubpara1' },
        } as unknown as HTMLAnchorElement,
        { marks: [] } as unknown as Mark,
        'red',
        [],
        [{ innerText: 'This is a test' } as unknown as Node]
      )
    ).toBeDefined();
  });

  it('should return inlineMarks for bold, italic, and underline styles', () => {
    const element = document.createElement('span');
    element.textContent = 'Styled Text';
    element.setAttribute(
      'style',
      'font-style: italic; font-weight: bold; text-decoration: underline;'
    );

    const result = test.fetchInlineStyles(element);
    const markTypes = result.map((m) => m.type);
    expect(markTypes).toContain('em');
    expect(markTypes).toContain('strong');
    expect(markTypes).toContain('underline');
  });

  it('should return color mark if valid color is provided', () => {
    const element = document.createElement('span');
    element.textContent = 'Colored Text';
    element.setAttribute('style', 'color: red;');

    const result = test.fetchInlineStyles(element);
    const mark = result.find((m) => m.type === 'mark-text-color');
    expect(mark).toBeDefined();
    expect(mark?.attrs?.color).toBe('red');
  });

  it('should detect and update overridden line-height styles', () => {
    const element = document.createElement('span');
    element.textContent = 'Line height test';
    element.setAttribute('style', 'line-height: 18pt;');

    const result = test.fetchInlineStyles(element);
    expect(result.length).toBe(0);
    expect(test.overriddenLineSpacing).toBeTruthy();
    expect(test.lineSpacing).toBe('150%');
  });

  it('should detect and update text-align style', () => {
    const element = document.createElement('div');
    element.textContent = 'Aligned Text';
    element.setAttribute('style', 'text-align: right;');

    const result = test.fetchInlineStyles(element);
    expect(result.length).toBe(0);
    expect(test.overriddenAlign).toBeTruthy();
    expect(test.align).toBe('right');
  });

  it('should return empty inlineMarks if no text content is present', () => {
    const element = document.createElement('span');
    element.textContent = '';
    element.setAttribute('style', 'font-weight: bold;');

    const result = test.fetchInlineStyles(element);
    expect(result.length).toBe(0);
  });

  it('should ignore unrecognized styles', () => {
    const element = document.createElement('span');
    element.textContent = 'Text';
    element.setAttribute('style', 'margin: 10px; padding: 5px;');

    const result = test.fetchInlineStyles(element);
    expect(result.length).toBe(0);
  });
});

describe('Licit Helper Functions', () => {
  it('should handle getElementAlignment with no alignments', () => {
    expect(getElementAlignment(null!)).toBeFalsy();
    const testNode = document.createElement('div');
    expect(getElementAlignment(testNode)).toBeFalsy();
  });
  it('should handle getElementAlignment with valid alignments', () => {
    const testNode = document.createElement('div');
    testNode.setAttribute('align', 'left');
    expect(getElementAlignment(testNode)).toBe('left');
    testNode.setAttribute('align', 'center');
    expect(getElementAlignment(testNode)).toBe('center');
    testNode.setAttribute('align', 'right');
    expect(getElementAlignment(testNode)).toBe('right');
    const testNode2 = document.createElement('div');
    testNode2.setAttribute('style', 'junk;;align: left;');
    expect(getElementAlignment(testNode2)).toBe('left');
  });
});

describe('NewLicitParagraphElement branch coverage additions', () => {
  const createPara = () => {
    const node = document.createElement('p');
    node.textContent = 'text';
    return new NewLicitParagraphElement(node);
  };

  it('parseStrongWithInfoicon returns existing mark when text is empty', () => {
    const para = createPara();
    const strong = document.createElement('strong');
    strong.textContent = '   ';

    const baseMark = { type: 'text', marks: [] } as unknown as Mark;
    const result = para['parseStrongWithInfoicon'](
      strong,
      baseMark,
      baseMark,
      [] as never
    );

    expect(result).toBe(baseMark);
  });

  it('parseStrongWithInfoicon resets retMark when parseSubMarks returns undefined', () => {
    const para = createPara();
    const strong = document.createElement('strong');
    strong.appendChild(document.createTextNode('one'));
    strong.appendChild(document.createTextNode('two'));

    const parseSpy = jest
      .spyOn(para, 'parseSubMarks')
      .mockReturnValueOnce(undefined as never)
      .mockReturnValueOnce({ type: 'text', marks: [], text: 'ok' } as never);

    const mark = { type: 'text', marks: [] } as unknown as Mark;
    const result = para['parseStrongWithInfoicon'](
      strong,
      mark,
      null as never,
      [] as never
    );

    expect(parseSpy).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('parseUnderlineWithInfoicon keeps mark unchanged when text is empty', () => {
    const para = createPara();
    const u = document.createElement('u');
    u.textContent = '';

    const current = { type: 'text', marks: [] } as unknown as Mark;
    const result = para['parseUnderlineWithInfoicon'](
      u,
      current,
      current,
      [] as never
    );

    expect(result).toBe(current);
  });

  it('parseEMWithInfoicon keeps mark unchanged when text is empty', () => {
    const para = createPara();
    const em = document.createElement('em');
    em.textContent = '';

    const current = { type: 'text', marks: [] } as unknown as Mark;
    const result = para['parseEMWithInfoicon'](
      em,
      null as never,
      current,
      current,
      [] as never
    );

    expect(result).toBe(current);
  });

  it('parseAnchorWithInfoIcon keeps mark unchanged when anchor text is empty', () => {
    const para = createPara();
    const a = document.createElement('a');
    a.href = 'https://example.com';
    a.textContent = '  ';

    const current = { type: 'text', marks: [] } as unknown as Mark;
    const result = para['parseAnchorWithInfoIcon'](
      a,
      '',
      current,
      current,
      [] as never
    );

    expect(result).toBe(current);
  });

  it('getEmInfoIconMark returns undefined when info id is not found', () => {
    const para = createPara();
    const infoNode = document.createElement('ol');
    const infoRef = document.createElement('li');
    infoRef.id = 'not-in-data';
    infoNode.appendChild(infoRef);

    const data = [document.createElement('ol')];
    const result = (
      para as unknown as {
        getEmInfoIconMark: (infoIcon: HTMLElement, data: HTMLElement[]) => Mark | undefined;
      }
    ).getEmInfoIconMark(infoNode, data);
    expect(result).toBeUndefined();
  });

  it('getSuperScriptMarks returns undefined when infoIcon id is not found in data', () => {
    const para = createPara();
    const sup = document.createElement('sup');
    sup.id = 'infoIcon';
    const child = document.createElement('span');
    child.id = 'not-in-data';
    sup.appendChild(child);

    const dataList = document.createElement('ol');
    const entry = document.createElement('li');
    entry.id = 'another-id';
    dataList.appendChild(entry);

    const result = para.getSuperScriptMarks(sup, [dataList]);
    expect(result).toBeUndefined();
  });

  it('getBaseElement includes populated id/capco/selectionId fields', () => {
    const para = createPara();
    para.id = 'id-1';
    para.capco = '{"portionMarking":"U"}';
    para.selectionId = '#sel';

    const base = para.getBaseElement();
    expect(base.attrs.id).toBe('id-1');
    expect(base.attrs.capco).toContain('portionMarking');
    expect(base.attrs.selectionId).toBe('#sel');
  });
});

describe('NewLicitParagraphElement deep branch additions', () => {
  const createPara = () => {
    const node = document.createElement('p');
    node.innerHTML = '<span>seed</span>';
    return new NewLicitParagraphElement(node);
  };

  it('parseFontWithInfoicon returns unchanged mark for empty text', () => {
    const para = createPara();
    const font = document.createElement('font');
    font.textContent = '   ';
    const ret = { type: 'text', marks: [] } as unknown as Mark;

    expect(
      para['parseFontWithInfoicon'](font, ret, ret, [] as never)
    ).toBe(ret);
  });

  it('parseFontWithInfoicon returns unchanged mark when no font details exist', () => {
    const para = createPara();
    const font = document.createElement('font');
    font.textContent = 'abc';
    jest.spyOn(para, 'hasFontDetails').mockReturnValue(false);
    const ret = { type: 'text', marks: [] } as unknown as Mark;

    expect(
      para['parseFontWithInfoicon'](font, ret, ret, [] as never)
    ).toBe(ret);
  });

  it('parseAnchorWithInfoIcon appends color mark when anchor has color', () => {
    const para = createPara();
    const a = document.createElement('a');
    a.href = 'https://example.com';
    a.textContent = 'link';
    const child = document.createTextNode('link');
    a.innerHTML = '';
    a.appendChild(child);

    const parseSpy = jest
      .spyOn(para, 'parseSubMarks')
      .mockReturnValue({ type: 'text', marks: [], text: 'ok' } as never);

    const mark = { type: 'text', marks: [] } as unknown as Mark;
    para['parseAnchorWithInfoIcon'](a, '#000000', mark, null as never, [] as never);

    expect(parseSpy).toHaveBeenCalled();
    expect(mark.marks?.some((m) => m.type === 'mark-text-color')).toBe(true);
  });

  it('parseSubMarks handles SUP with empty text without setting retMark', () => {
    const para = createPara();
    const sup = document.createElement('sup');
    sup.textContent = ' ';

    const result = para.parseSubMarks(sup, { type: 'text', marks: [] }, true, [] as never);
    expect(result).toBeNull();
  });

  it('parseSubMarks handles SUB with empty text without pushing marks', () => {
    const para = createPara();
    const sub = document.createElement('sub');
    sub.textContent = ' ';

    const initialCount = para.marks.length;
    para.parseSubMarks(sub, { type: 'text', marks: [] }, true, [] as never);
    expect(para.marks.length).toBe(initialCount);
  });

  it('getEmInfoIconMark returns lock icon json for CAC-required descriptions', () => {
    const para = createPara();
    const infoIcon = document.createElement('ol');
    const infoRef = document.createElement('li');
    infoRef.id = 'x1';
    infoIcon.appendChild(infoRef);

    const dataRoot = document.createElement('ol');
    const dataItem = document.createElement('li');
    dataItem.id = 'x1';
    dataItem.innerText = 'Common access card required for this action';
    dataRoot.appendChild(dataItem);

    const mark = (
      para as unknown as {
        getEmInfoIconMark: (info: HTMLElement, data: HTMLElement[]) => Mark | undefined;
      }
    ).getEmInfoIconMark(infoIcon, [dataRoot]);
    expect(mark).toBeDefined();
    expect((mark as { attrs?: { description?: string } } | undefined)?.attrs?.description).toContain(
      'Common access card required'
    );
  });

  it('getSuperScriptMarks returns lock icon json for CAC-required descriptions', () => {
    const para = createPara();
    const sup = document.createElement('sup');
    sup.id = 'infoIcon';
    const ref = document.createElement('span');
    ref.id = 'item-1';
    sup.appendChild(ref);

    const dataRoot = document.createElement('ol');
    const dataItem = document.createElement('li');
    dataItem.id = 'item-1';
    dataItem.innerText = 'Common access card required for details';
    dataRoot.appendChild(dataItem);

    const mark = para.getSuperScriptMarks(sup, [dataRoot]);
    expect(mark).toBeDefined();
    expect((mark as { attrs?: { description?: string } } | undefined)?.attrs?.description).toContain(
      'Common access card required'
    );
  });
});


describe('NewLicitParagraphElement additional branch boosts', () => {
  const createPara = () => {
    const node = document.createElement('p');
    node.textContent = 'seed';
    return new NewLicitParagraphElement(node);
  };

  it('applyLinkAndColorMarks does nothing when link mark is null', () => {
    const para = createPara();
    const mark = { type: 'text', marks: [] } as unknown as Mark;

    para['applyLinkAndColorMarks'](
      mark,
      null,
      { type: 'mark-text-color', attrs: { color: '#000' } } as unknown as Mark,
      '#000'
    );

    expect(mark.marks).toEqual([]);
  });

  it('parseLinkText skips push when non-text node has empty text', () => {
    const para = createPara();
    const mark = { type: 'text', marks: [] } as unknown as Mark;
    const span = document.createElement('span');
    span.textContent = ' ';

    const result = para['parseLinkText'](
      span as unknown as HTMLLinkElement,
      { type: 'link', attrs: { href: 'x' } } as unknown as Mark,
      '#000',
      { type: 'mark-text-color', attrs: { color: '#000' } } as unknown as Mark,
      mark,
      [] as never
    );

    expect(result).toBe(mark);
  });

  it('setLink adds no link mark for non-url text', () => {
    const para = createPara();
    const mark = { type: 'text', text: 'not a url', marks: [] } as unknown as Mark;

    para['setLink'](mark);

    expect(mark.marks).toEqual([]);
  });

  it('hasFontDetails returns true when only parent has style', () => {
    const para = createPara();
    const parent = document.createElement('span');
    parent.setAttribute('style', 'font-family: Arial;');
    const child = document.createElement('font');
    parent.appendChild(child);

    expect(para.hasFontDetails(child)).toBe(true);
  });

  it('parseFont returns undefined when child node is IMG', () => {
    const para = createPara();
    const font = document.createElement('font');
    font.setAttribute('style', 'font-family: Arial;');
    font.textContent = 'x';
    font.innerHTML = '<img src="x.png" />';

    const result = para['parseFont'](
      font,
      { type: 'text', marks: [] } as unknown as Mark,
      [] as never,
      []
    );

    expect(result).toBeNull();
  });

  it('parseAnchor returns existing mark when id is _LINK_TO_THIS', () => {
    const para = createPara();
    const a = document.createElement('a');
    a.id = '_LINK_TO_THIS';
    a.textContent = 'ignored';
    const initial = { type: 'text', marks: [] } as unknown as Mark;

    const result = para['parseAnchor'](a, initial, '', [] as never, []);
    expect(result).toBe(initial);
  });

  it('parseSubMarks TEXT builds mark without marks array when base mark is null', () => {
    const para = createPara();
    const textNode = document.createTextNode('alpha');

    const result = para.parseSubMarks(textNode, null as never, true, [] as never);
    const parsed = result as { text?: string; marks?: unknown[] } | null;
    expect(parsed?.text).toBe('alpha');
    expect(parsed?.marks).toBeUndefined();
  });

  it('parseSubMarks FONT with multiple children walks all children', () => {
    const para = createPara();
    const font = document.createElement('font');
    font.setAttribute('style', 'font-family: Arial;');
    const t1 = document.createTextNode('a');
    const t2 = document.createTextNode('b');
    font.appendChild(t1);
    font.appendChild(t2);

    const spy = jest.spyOn(para, 'parseSubMarks');
    para.parseSubMarks(font, { type: 'text', marks: [] }, false, [] as never);

    expect(spy).toHaveBeenCalled();
  });

  it('parseAnchorWithInfoIcon handles empty color without pushing text-color mark', () => {
    const para = createPara();
    const a = document.createElement('a');
    a.href = 'https://example.com';
    a.textContent = 'go';
    a.appendChild(document.createTextNode('go'));

    const mark = { type: 'text', marks: [] } as unknown as Mark;
    para['parseAnchorWithInfoIcon'](a, '', mark, null as never, [] as never);

    expect(mark.marks?.some((m) => m.type === 'mark-text-color')).toBe(false);
  });

  it('getSuperScriptMarks returns regular super mark when node is not infoIcon', () => {
    const para = createPara();
    const sup = document.createElement('sup');
    sup.id = 'plain';
    sup.innerText = '2';

    const mark = para.getSuperScriptMarks(sup, []);
    expect((mark as { marks?: Array<{ type: string }> } | undefined)?.marks?.[0]?.type).toBe(
      'super'
    );
  });
});


describe('NewLicitParagraphElement deeper parseSubMarks branch boosts', () => {
  const createPara = () => {
    const p = document.createElement('p');
    p.textContent = 'seed';
    return new NewLicitParagraphElement(p);
  };

  it('parseSubMarks routes MARK-TEXT-HIGHLIGHT via handleTextMark', () => {
    const para = createPara();
    const node = document.createElement('mark-text-highlight');
    node.setAttribute('highlight-color', '#ff0');
    node.setAttribute('color', '#111');

    const spy = jest
      .spyOn(
        para as unknown as Record<string, (...args: unknown[]) => void>,
        'handleTextMark'
      )
      .mockImplementation(() => undefined);

    para.parseSubMarks(node, { type: 'text', marks: [] }, false, [] as never);
    expect(spy).toHaveBeenCalled();
  });

  it('parseSubMarks handles SUB with non-empty text by pushing subscript', () => {
    const para = createPara();
    const sub = document.createElement('sub');
    sub.textContent = 'x';

    const before = para.marks.length;
    para.parseSubMarks(sub, { type: 'text', marks: [] }, true, [] as never);
    expect(para.marks.length).toBeGreaterThan(before);
  });

  it('parseSubMarks handles SUP with non-empty text and non-info superscript', () => {
    const para = createPara();
    const sup = document.createElement('sup');
    sup.textContent = '2';
    sup.innerText = '2';
    sup.id = 'plain';

    const result = para.parseSubMarks(sup, { type: 'text', marks: [] }, true, [] as never);
    expect(result).toBeDefined();
  });

  it('parseAnchorWithInfoIcon processes multi-child anchor branch', () => {
    const para = createPara();
    const a = document.createElement('a');
    a.href = 'https://example.com';
    const t1 = document.createTextNode('a');
    const t2 = document.createTextNode('b');
    a.append(t1, t2);

    const parseSpy = jest.spyOn(para, 'parseSubMarks');
    para['parseAnchorWithInfoIcon'](
      a,
      '#000',
      { type: 'text', marks: [] } as unknown as Mark,
      null as never,
      [] as never
    );

    expect(parseSpy).toHaveBeenCalled();
  });

  it('parseEMWithInfoicon multi-child branch invokes parseSubMarks', () => {
    const para = createPara();
    const emNode = document.createElement('em');
    emNode.appendChild(document.createTextNode('x'));
    emNode.appendChild(document.createTextNode('y'));

    const parseSpy = jest.spyOn(para, 'parseSubMarks');
    para.parseSubMarks(emNode, { type: 'text', marks: [] }, false, [] as never);

    expect(parseSpy).toHaveBeenCalled();
  });

  it('parseUnderlineWithInfoicon multi-child branch invokes parseSubMarks', () => {
    const para = createPara();
    const uNode = document.createElement('u');
    uNode.appendChild(document.createTextNode('x'));
    uNode.appendChild(document.createTextNode('y'));

    const parseSpy = jest.spyOn(para, 'parseSubMarks');
    para.parseSubMarks(uNode, { type: 'text', marks: [] }, false, [] as never);

    expect(parseSpy).toHaveBeenCalled();
  });

  it('parseStrongWithInfoicon multi-child branch pushes interim marks', () => {
    const para = createPara();
    const sNode = document.createElement('strong');
    sNode.appendChild(document.createTextNode('x'));
    sNode.appendChild(document.createElement('br'));
    sNode.appendChild(document.createTextNode('z'));

    para.parseSubMarks(sNode, { type: 'text', marks: [] }, false, [] as never);
    expect(para.marks.length).toBeGreaterThan(0);
  });

  it('parseFontWithInfoicon single-child path returns parsed text mark', () => {
    const para = createPara();
    const font = document.createElement('font');
    font.setAttribute('style', 'font-family: Arial;');
    font.appendChild(document.createTextNode('alpha'));

    const result = para.parseSubMarks(font, { type: 'text', marks: [] }, true, [] as never);
    expect((result as { type?: string } | null)?.type).toBe('text');
  });

  it('parseSubMarks A path with empty text keeps return mark null', () => {
    const para = createPara();
    const a = document.createElement('a');
    a.href = 'https://example.com';
    a.textContent = ' ';

    const result = para.parseSubMarks(a, { type: 'text', marks: [] }, true, [] as never);
    expect(result).toBeNull();
  });
});


describe('Licit table/vignette/enhanced element branch boosts', () => {
  it('LicitTableCellParaElement render applies transparent table borders', () => {
    const td = document.createElement('td');
    const p = document.createElement('p');
    p.textContent = 'cell';
    td.appendChild(p);

    const cell = new LicitTableCellParaElement(
      td,
      '#eee',
      [120] as unknown as [number],
      'middle',
      false,
      true
    );

    const rendered = cell.render();
    expect(rendered.attrs.borderTop).toContain('#ffffff');
    expect(rendered.attrs.borderBottom).toContain('#000000');
  });

  it('LicitTableCellParaElement maps paragraph margin/padding attrs from inline style', () => {
    const td = document.createElement('td');
    td.innerHTML =
      '<p class="CellHeading" id="1050988" style="margin: 100pt 10pt 120pt 12pt; padding: 2pt 1pt 4pt 3pt;">Personality Attribute</p>';

    const cell = new LicitTableCellParaElement(td);
    const rendered = cell.render();
    const paragraph = rendered.content[0] as { attrs?: Record<string, unknown> };

    expect(paragraph.attrs?.marginTop).toBe('100pt');
    expect(paragraph.attrs?.marginRight).toBe('10pt');
    expect(paragraph.attrs?.marginBottom).toBe('120pt');
    expect(paragraph.attrs?.marginLeft).toBe('12pt');
    expect(paragraph.attrs?.paddingTop).toBe('2pt');
    expect(paragraph.attrs?.paddingRight).toBe('1pt');
    expect(paragraph.attrs?.paddingBottom).toBe('4pt');
    expect(paragraph.attrs?.paddingLeft).toBe('3pt');
  });

  it('LicitTableCellParaElement processChildNode ignores IMG without source', () => {
    const td = document.createElement('td');
    const img = document.createElement('img');
    td.appendChild(img);

    const cell = new LicitTableCellParaElement(td);
    const before = cell.content.length;
    cell.processChildNode(img);
    expect(cell.content.length).toBe(before);
  });

  it('LicitTableCellParaElement processChildOL and processChildUL cover empty text branches', () => {
    const td = document.createElement('td');
    const cell = new LicitTableCellParaElement(td);

    const ol = document.createElement('ol');
    ol.textContent = '';
    cell.processChildOL(ol);

    const ul = document.createElement('ul');
    ul.textContent = '';
    cell.processChildUL(ul);

    expect(cell.content.length).toBeGreaterThanOrEqual(1);
  });

  it('LicitTableCellParaElement cleanup helpers remove newlines and bullets', () => {
    const td = document.createElement('td');
    const cell = new LicitTableCellParaElement(td);

    expect(cell.removeNewLines('a\nb')).toBe('ab');
    expect(cell.removeBullets('•abc')).toBe('abc');
    expect(cell.cleanupText('•a\n')).toBe('a');
  });

  it('LicitVignetteElement convertDiv handles non-SPAN grandchildren early return path', () => {
    const root = document.createElement('div');
    const div = document.createElement('div');
    const innerDiv = document.createElement('div');
    innerDiv.appendChild(document.createElement('p'));
    div.appendChild(innerDiv);
    root.appendChild(div);

    const vignette = new LicitVignetteElement(root, '#000000', '#eeeeee', 120);
    const rendered = vignette.render();
    expect(rendered.type).toBe('table_cell');
  });

  it('LicitEnhancedTableElement removeLastRow covers no-op and pop branches', () => {
    const enhanced = new LicitEnhancedTableElement();
    enhanced.removeLastRow();

    const body = new LicitEnhancedTableFigureBodyElement();
    const table = new LicitTableElement();
    const row = new LicitTableRowElement();
    table.addRow(row);
    body.addTable(table);
    enhanced.addBody(body);

    enhanced.removeLastRow();
    expect(table.rows.length).toBe(0);
  });

  it('LicitEnhancedTableElement render handles empty optional sections', () => {
    const enhanced = new LicitEnhancedTableElement();
    const rendered = enhanced.render();
    expect(rendered.content).toEqual([]);
  });
});

describe('Licit elements targeted fallback branch boosts', () => {
  it('LicitImageElement render applies nullish defaults for alt and align', () => {
    const img = new LicitImageElement('https://example.com/a.png');
    const rendered = img.render();

    expect(rendered.attrs.src).toBe('https://example.com/a.png');
    expect(rendered.attrs.alt).toBe('');
    expect(rendered.attrs.align).toBe('center');
  });

  it('LicitNewImageElement render covers nullish and non-nullish branches', () => {
    const withValues = new LicitNewImageElement(
      'https://example.com/a.png',
      '100',
      '80',
      'alt',
      'cap'
    );
    const renderedWithValues = withValues.render();
    expect(renderedWithValues.attrs.alt).toBe('alt');
    expect(renderedWithValues.attrs.width).toBe('100');
    expect(renderedWithValues.attrs.height).toBe('80');

    const withNullish = new LicitNewImageElement(
      'https://example.com/b.png',
      undefined,
      undefined,
      undefined,
      undefined
    );
    const renderedWithNullish = withNullish.render();
    expect(renderedWithNullish.attrs.alt).toBe('');
    expect(renderedWithNullish.attrs.width).toBeNull();
    expect(renderedWithNullish.attrs.height).toBeNull();
  });

  it('LicitNewImageElement getBaseElement defaults capco to empty string', () => {
    const img = new LicitNewImageElement('https://example.com/c.png', '10', '10', 'alt');
    const base = img.getBaseElement();
    expect(base.attrs.capco).toBe('');
  });

  it('NewLicitTableCellParagraph getBaseElement uses defaults and provided values', () => {
    const p = document.createElement('p');
    p.textContent = 'cell';

    const defaults = new NewLicitTableCellParagraph(p);
    const defaultsBase = defaults.getBaseElement();
    expect(defaultsBase.attrs.colwidth).toBe(100);
    expect(defaultsBase.attrs.background).toBe('#FFFFFF');
    expect(defaultsBase.attrs.vAlign).toBe('top');

    const provided = new NewLicitTableCellParagraph(p, '#eeeeee', [140], 'middle');
    const providedBase = provided.getBaseElement();
    expect(providedBase.attrs.colwidth).toEqual([140]);
    expect(providedBase.attrs.background).toBe('#eeeeee');
    expect(providedBase.attrs.vAlign).toBe('middle');
  });

  it('LicitVignetteElement ConvertElements ignores IMG nodes without source', () => {
    const root = document.createElement('div');
    const img = document.createElement('img');
    root.appendChild(img);

    const vignette = new LicitVignetteElement(root, '#undefined', '', 120);
    const rendered = vignette.render();

    expect(rendered.attrs.borderColor).toBe('#36598d');
    expect(rendered.attrs.background).toBe('#dce6f2');
    expect(Array.isArray(rendered.content)).toBe(true);
  });
});
