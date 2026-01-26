/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 * @jest-environment jsdom
 */

import {
  LicitDocumentElement,
  LicitDocumentJSON,
  LicitHeaderElement,
  LicitImageElement,
  LicitParagraphElement,
  NewLicitParagraphElement,
  LicitParagraphImageElement,
  LicitTableCellParaElement,
  LicitTableCellParagraph,
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
    node.innerText = 'No style';

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
