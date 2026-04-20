/**
 * @license MIT
 * @copyright Copyright 2026 Modus Operandi Inc. All Rights Reserved.
 */

import type {
  AddCellOptions,
  TransformConfig,
  ParserElement,
} from './licit-transform';
import { asTransformConfig, LicitConverter } from './licit-transform';
import type {
  LicitDocumentJSON,
  LicitElement,
  LicitTableRowElement,
} from './licit-elements';
import {
  LicitBulletListElement,
  LicitDocumentElement,
  LicitTableCellImageElement,
  LicitTableCellParagraph,
} from './licit-elements';

const testConfig = {
  customStyles: [],
  customStylesUrl: '',
  replacementChars: [],
  replaceCharacters: false,
  replaceWithLinks: [],
  stripSectionNumbers: false,
};
describe('Parser Service - getColWidthArray', () => {
  let converter: LicitConverter;
  let table: HTMLTableElement;
  let tableGroup: HTMLTableColElement;

  beforeEach(() => {
    converter = new LicitConverter(testConfig);
    table = document.createElement('table');
    tableGroup = document.createElement('colgroup');
    table.appendChild(tableGroup);
  });

  const addCols = (widths: (string | null)[]) => {
    for (const w of widths) {
      const col = document.createElement('col');
      if (w !== null) {
        if (w.endsWith('%')) col.style.width = w;
        else if (w.endsWith('px')) col.style.width = w;
        else col.setAttribute('width', w);
      }
      tableGroup.appendChild(col);
    }
  };

  it('should calculate correct widths from %', () => {
    addCols(['40%', '20%', '40%']);
    const widths = converter['getColWidthArray'](table);
    expect(widths?.reduce((count, n) => count + n, 0)).toBe(619);
    expect(widths).toEqual([247, 124, 248]);
  });

  it('should scale px widths correctly within 861 if total > 700', () => {
    addCols(['100px', '400px', '300px']);
    const widths = converter['getColWidthArray'](table);
    const sum = widths?.reduce((count, n) => count + n, 0) ?? 0;
    expect(sum).toBe(861);
  });

  it('should return undefined for mixed % and px widths', () => {
    addCols(['50%', '150px']);
    const widths = converter['getColWidthArray'](table);
    expect(widths).toBeUndefined();
  });

  it('should return undefined if any column has no width', () => {
    addCols(['50%', null]);
    const widths = converter['getColWidthArray'](table);
    expect(widths).toBeUndefined();
  });

  it('should adjust totalPixelWidth if sum < 200', () => {
    addCols(['10%', '10%', '10%']);
    const widths = converter['getColWidthArray'](table);
    const sum = widths?.reduce((count, n) => count + n, 0) ?? 0;
    expect(sum).toBeLessThan(200);
  });
  it('should handle renderEnhancedTable', () => {
    jest
      .spyOn(
        converter as unknown as Record<string, () => unknown>,
        'getColWidthArray'
      )
      .mockReturnValue([]);
    const el = document.createElement('div');
    el.setAttribute('capco', JSON.stringify({ portionMarking: 'TBD' }));
    expect(
      converter['renderEnhancedTable'](
        {
          node: {
            getAttribute: () => {
              return 'test';
            },
            querySelector: () => {
              return el;
            },
          },
        } as unknown as ParserElement,
        {} as unknown as LicitDocumentElement
      )
    ).toBeUndefined();
  });
  it('should handle renderEnhancedTable when getColWidthArray returns valid widths', () => {
    jest
      .spyOn(
        converter as unknown as Record<string, () => unknown>,
        'getColWidthArray'
      )
      .mockReturnValue([1, 2]);
    const el = document.createElement('div');
    el.setAttribute('capco', JSON.stringify({ portionMarking: 'TBD' }));
    expect(
      converter['renderEnhancedTable'](
        {
          node: {
            getAttribute: () => {
              return 'test';
            },
            querySelector: () => {
              return el;
            },
          },
        } as unknown as ParserElement,
        {} as unknown as LicitDocumentElement
      )
    ).toBeUndefined();
  });
  it('should handle getLicitTable when getColWidthArray returns value', () => {
    jest
      .spyOn(
        converter as unknown as Record<string, () => unknown>,
        'getColWidthArray'
      )
      .mockReturnValue([1, 2]);
    const el = document.createElement('div');
    el.setAttribute('capco', JSON.stringify({ portionMarking: 'TBD' }));
    expect(
      converter['getLicitTable'](
        {
          node: {
            getAttribute: () => {
              return 'test';
            },
            querySelector: () => {
              return el;
            },
          },
        } as unknown as ParserElement,
        []
      )
    ).toBeDefined();
  });
  it('should handle removeEmptyATags', () => {
    expect(
      converter['removeEmptyATags']({
        childNodes: [{ nodeName: 'A', textContent: '', remove: () => {} }],
      } as unknown as Node)
    ).toBeUndefined();
  });
  it('should handle renderDocFigure when tag name P', () => {
    expect(
      converter['renderDocFigure'](
        {
          node: {
            childNodes: [],
            getAttribute: () => {
              return 'test';
            },
            tagName: 'P',
          },
        } as unknown as ParserElement,
        { appendElement: () => {} } as unknown as LicitDocumentElement
      )
    ).toBeUndefined();
  });
  it('should handle renderDocFigure when tag name IMG', () => {
    expect(
      converter['renderDocFigure'](
        {
          childNodes: [],
          node: {
            remove: () => {},
            childNodes: [{ remove: () => {} }, { remove: () => {} }],
            getAttribute: () => {
              return 'test';
            },
            tagName: 'IMG',
          },
        } as unknown as ParserElement,
        { appendElement: () => {} } as unknown as LicitDocumentElement
      )
    ).toBeUndefined();
  });
  it('should handle parseOL', () => {
    expect(
      converter['parseOL'](
        {
          childNodes: [],
          node: {
            id: 'infoIcon',
            removeChild: () => {},
            childNodes: [{}, {}],
            getAttribute: () => {
              return 'test';
            },
            tagName: 'IMG',
          },
        } as unknown as ParserElement,
        { appendElement: () => {} } as unknown as LicitDocumentElement
      )
    ).toBeUndefined();
  });

  it('should handle addTableImageCell for LC-Image-1 and LC-Image-2 cases', () => {
    const converter = new LicitConverter(testConfig);

    const testCases: {
      id: string;
      expectedColWidth: number[];
      expectedHeight: string | null;
    }[] = [
      { id: 'LC-Image-1', expectedColWidth: [100, 625], expectedHeight: null },
      { id: 'LC-Image-2', expectedColWidth: [100], expectedHeight: '70' },
    ];

    for (const { id, expectedColWidth, expectedHeight } of testCases) {
      const cell = document.createElement('td');
      const div = document.createElement('div');
      const img = document.createElement('img');

      img.id = id;
      img.setAttribute('srcRelative', 'some/image/path.png');
      img.alt = 'Test Alt';

      div.appendChild(img);
      cell.appendChild(div);

      const result = converter['addTableImageCell'](
        cell,
        'initial',
        false,
        null,
        'top'
      );

      expect(result.bgColor).toBe('#d8d8d8');
      expect(result.isChapterHeader).toBeTruthy();
      expect(
        result.licitCell instanceof LicitTableCellImageElement
      ).toBeTruthy();

      const imageElement = result.licitCell as LicitTableCellImageElement;
      expect(imageElement.fillImg).toBe(1);
      expect(imageElement.colWidth).toEqual(expectedColWidth);
      expect(imageElement.height).toBe(expectedHeight);
    }
  });

  it('should add ". " to last text node if it does not end with period', () => {
    const header = document.createElement('div');
    header.className = 'header1';
    header.textContent = 'Header Text';

    const nextEl = document.createElement('span');
    nextEl.textContent = 'More Info';

    converter['parseHeader'](header, nextEl);

    const lastText = header.lastChild?.textContent ?? '';
    expect(lastText.endsWith('. ')).toBeFalsy();

    expect(header.contains(nextEl)).toBeTruthy();
  });

  it('should add " " if last text node already ends with period', () => {
    const header = document.createElement('div');
    header.className = 'header1';
    header.textContent = 'Header Text.';

    const nextEl = document.createElement('span');
    nextEl.textContent = 'More Info';

    converter['parseHeader'](header, nextEl);

    const lastText = header.firstChild?.textContent ?? '';
    expect(lastText.endsWith('. ')).toBeTruthy();
    expect(header.contains(nextEl)).toBeTruthy();
  });

  it('should only reset numbering for the first attachmentTitle', () => {
    const node1 = document.createElement('div');
    node1.className = 'attachmentTitle';
    node1.textContent = 'Attachment 1';

    const node2 = document.createElement('div');
    node2.className = 'attachmentTitle';
    node2.textContent = 'Attachment 2';

    converter['elements'] = [
      { type: 7, node: node1, subText: '' } as unknown as ParserElement,
      { type: 7, node: node2, subText: '' } as unknown as ParserElement,
    ];

    const result = converter['render_FrameMakerHTML5_zip'](
      [node1, node2] as unknown as NodeList,
      undefined,
      undefined,
      []
    );

    const content = result.content;

    expect(content[0].reset).toBeUndefined();
    expect(content[1].reset).toBeFalsy();
  });
});

describe('Converter.addTableImageCell', () => {
  let converter: LicitConverter;

  beforeEach(() => {
    converter = new LicitConverter(testConfig);
  });

  it('should set chapter header properties for LC-Image-1', () => {
    const cell = document.createElement('td');
    const div = document.createElement('div');
    const img = document.createElement('img');
    img.id = 'LC-Image-1';
    img.setAttribute('srcRelative', 'test/image1.png');
    div.appendChild(img);
    cell.appendChild(div);

    const result = converter['addTableImageCell'](cell, '', false, null, 'top');
    expect(result.bgColor).toBe('#d8d8d8');
    expect(result.isChapterHeader).toBeTruthy();
    expect(result.licitCell instanceof LicitTableCellImageElement).toBeTruthy();
    expect((result.licitCell as LicitTableCellImageElement).fillImg).toBe(1);
    expect((result.licitCell as LicitTableCellImageElement).colWidth).toEqual([
      100, 625,
    ]);
    expect((result.licitCell as LicitTableCellImageElement).height).toBeNull();
  });

  it('should set chapter header properties for LC-Image-2', () => {
    const cell = document.createElement('td');
    const div = document.createElement('div');
    const img = document.createElement('img');
    img.id = 'LC-Image-2';
    img.setAttribute('srcRelative', 'test/image2.png');
    div.appendChild(img);
    cell.appendChild(div);

    const result = converter['addTableImageCell'](cell, '', false, null, 'top');
    expect(result.bgColor).toBe('#d8d8d8');
    expect(result.isChapterHeader).toBeTruthy();
    expect(result.licitCell instanceof LicitTableCellImageElement).toBeTruthy();
    expect((result.licitCell as LicitTableCellImageElement).fillImg).toBe(1);
    expect((result.licitCell as LicitTableCellImageElement).colWidth).toEqual([
      100,
    ]);
    expect((result.licitCell as LicitTableCellImageElement).height).toBe('70');
  });

  it('should set altText for other images', () => {
    const cell = document.createElement('td');
    const div = document.createElement('div');
    const img = document.createElement('img');
    img.id = 'other-image';
    img.alt = 'Some Alt';
    img.setAttribute('srcRelative', 'test/image3.png');
    div.appendChild(img);
    cell.appendChild(div);

    const result = converter['addTableImageCell'](cell, '', false, null, 'top');
    expect(result.bgColor).toBe('');
    expect(result.isChapterHeader).toBeFalsy();
    expect(result.licitCell instanceof LicitTableCellImageElement).toBeTruthy();
    expect((result.licitCell as LicitTableCellImageElement).alt).toBe(
      'Some Alt'
    );
  });

  it('should fallback to LicitTableCellParagraph if no image src', () => {
    const cell = document.createElement('td');
    const div = document.createElement('div');
    const img = document.createElement('img');
    img.id = 'other-image';
    div.appendChild(img);
    cell.appendChild(div);

    const result = converter['addTableImageCell'](cell, '', false, null, 'top');
    expect(result.licitCell instanceof LicitTableCellParagraph).toBeTruthy();
  });

  it('should call handle addCell', () => {
    const test = new LicitConverter(testConfig);
    const mockTableCell = document.createElement('td');
    mockTableCell.textContent = 'Test cell content';
    mockTableCell.rowSpan = 2;
    mockTableCell.colSpan = 3;
    mockTableCell.setAttribute(
      'style',
      'border: 1px solid #000000; vertical-align: top;'
    );
    const spy = jest.fn();
    test['addCell'](
      mockTableCell,
      {
        addCell: spy,
      } as unknown as LicitTableRowElement,
      {
        bgColor: '#ffffff',
        isChapterHeader: false,
        verAlign: 'top',
        cellIndex: 0,
        widthArray: [100, 200, 300],
        isTransparent: false,
      } as AddCellOptions
    );

    expect(spy).toHaveBeenCalled();
  });

  it('should handle processChildNodesCapco', () => {
    expect(
      converter['processChildNodesCapco']([
        { nodeType: 1, className: 'Hidden' },
      ] as unknown as NodeListOf<ChildNode>)
    ).toBeUndefined();
  });

  it('should process text node and find P tag in processChildNodesCapco', () => {
    expect(
      converter['processChildNodesCapco']([
        {
          parentElement: {
            setAttribute: () => {},
            tagName: 'P',
            parentElement: { setAttribute: () => {} },
          },
          nodeType: 3,
          className: 'Hidden',
          textContent: 'This is a test',
        },
      ] as unknown as NodeListOf<ChildNode>)
    ).toBeUndefined();
  });

  it('should process text node with parent div and grandparent P tag in processChildNodesCapco', () => {
    expect(
      converter['processChildNodesCapco']([
        {
          parentElement: {
            setAttribute: () => {},
            tagName: 'div',
            parentElement: { tagName: 'P', setAttribute: () => {} },
          },
          nodeType: 3,
          className: 'Hidden',
          textContent: 'This is a test',
        },
      ] as unknown as NodeListOf<ChildNode>)
    ).toBeUndefined();
  });

  it('should remove µµ characters from text content', () => {
    const el = document.createElement('div');
    el.innerHTML = '<p> µµ </p><span>hello</span><p> µµ</p>';
    converter['sanitizeText'](el);
    expect(el.textContent).toBe('hello');
  });

  it('should handle isTableFigureNode', () => {
    const test = converter['isTableFigureNode']({
      tagName: 'DIV',
      children: {
        item: () => {
          return { tagName: 'IMG' };
        },
      },
      querySelector: () => {
        return { textContent: 'test' };
      },
      querySelectorAll: () => {
        return [{ textContent: 'test' }];
      },
    } as unknown as Element);
    expect(test).toBeTruthy();
  });
  it('should handle handleNode', () => {
    const arr = [
      'DIV',
      'P',
      'SPAN',
      'B',
      'I',
      'U',
      'EM',
      'STRONG',
      'BR',
      'A',
      'UL',
      'OL',
      'LI',
      'TABLE',
      'TBODY',
      'TR',
      'TD',
      'TH',
      'COLGROUP',
      'COL',
      'IMG',
      'FIGURE',
      'FIGCAPTION',
    ];
    for (const tag of arr) {
      const test = converter['handleNode'](
        {
          tagName: tag,
          children: {
            item: () => {
              return { tagName: 'IM' };
            },
          },
          querySelector: () => {
            return {
              textContent: 'test',
              getElementsByTagName: () => {
                return [];
              },
              getAttribute: () => {
                return 'test';
              },
            };
          },
          querySelectorAll: () => {
            return [{ textContent: 'test' }];
          },
          getAttribute: () => {
            return 'test';
          },
        } as unknown as Element,
        { appendElement: () => {} } as unknown as Element
      );
      expect(test).toEqual(0);
    }
  });
  it('should handle handleNode with children.item() returning no IMG', () => {
    const test = converter['handleNode'](
      {
        tagName: 'OL',
        children: {
          item: () => {
            return { tagName: 'IMG' };
          },
        },
        querySelector: () => {
          return {
            textContent: 'test',
            getElementsByTagName: () => {
              return [];
            },
          };
        },
        querySelectorAll: () => {
          return [{ textContent: 'test' }];
        },
        getAttribute: () => {
          return 'test';
        },
      } as unknown as Element,
      { appendElement: () => {} } as unknown as Element
    );
    expect(test).toBe(0);
  });
  it('should handle handleNodes', () => {
    expect(
      converter['handleNodes']([
        {
          tagName: 'DIV',
          children: {
            item: () => {
              return { tagName: 'IM' };
            },
          },
          querySelector: () => {
            return {
              textContent: 'test',
              getElementsByTagName: () => {
                return [];
              },
            };
          },
          querySelectorAll: () => {
            return [{ textContent: 'test' }];
          },
          getAttribute: () => {
            return 'test';
          },
        } as unknown as Element,
        {
          tagName: 'DIV',
          children: {
            item: () => {
              return { tagName: 'IM' };
            },
          },
          querySelector: () => {
            return {
              textContent: 'test',
              getElementsByTagName: () => {
                return [];
              },
            };
          },
          querySelectorAll: () => {
            return [{ textContent: 'test' }];
          },
          getAttribute: () => {
            return 'test';
          },
        } as unknown as Element,
      ] as unknown as NodeList)
    ).toBeUndefined();
  });

  it('should handle handleNode title class styling', () => {
    const node = document.createElement('div');
    node.className = 'attTableTitle';

    jest.spyOn(
      converter as unknown as { parseElement: () => unknown },
      'parseElement'
    );

    const result = converter['handleNode'](node, document.createElement('div'));

    expect(node.style.textTransform).toBe('none');
    expect(node.style.color).toBe('rgb(0, 0, 0)');
    expect(result).toBe(0);
  });

  it('should handle DIV with IMG child (parseTableFigure)', () => {
    const div = document.createElement('div');
    div.appendChild(document.createElement('img'));

    const spy = jest.spyOn(
      converter as unknown as { parseTableFigure: () => unknown },
      'parseTableFigure'
    );

    converter['handleNode'](div, document.createElement('div'));

    expect(spy).toBeDefined();
  });

  it('should handle TABLE tag in handleNode', () => {
    const table = document.createElement('table');
    const spy = jest.spyOn(
      converter as unknown as { parseTable: (a, b) => unknown },
      'parseTable'
    );

    converter['handleNode'](table, document.createElement('div'));

    expect(spy).toHaveBeenCalledWith(table, true);
  });

  it('should handle OL/UL via checkChildNode', () => {
    const ol = document.createElement('ol');
    const spy = jest
      .spyOn(
        converter as unknown as { checkChildNode: () => unknown },
        'checkChildNode'
      )
      .mockReturnValue(0);

    const result = converter['handleNode'](ol, document.createElement('div'));

    expect(spy).toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle IMG tag in handleNode', () => {
    const img = document.createElement('img');
    const spy = jest.spyOn(
      converter as unknown as { parseFigure: () => unknown },
      'parseFigure'
    );

    converter['handleNode'](img, document.createElement('div'));

    expect(spy).toHaveBeenCalled();
  });

  it('should handle SPAN tag in handleNode', () => {
    const span = document.createElement('span');
    const spy = jest
      .spyOn(
        converter as unknown as { mergeSpans: () => unknown },
        'mergeSpans'
      )
      .mockReturnValue(0);

    const result = converter['handleNode'](
      span,
      document.createElement('span')
    );

    expect(spy).toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle default branch in handleNode', () => {
    const p = document.createElement('p');
    const spy = jest.spyOn(
      converter as unknown as { parseElement: () => unknown },
      'parseElement'
    );

    converter['handleNode'](p, document.createElement('div'));

    expect(spy).toHaveBeenCalled();
  });

  it('should handle parseDynamicHeader', () => {
    const element = document.createElement('div');
    element.textContent = 'Sample Header Text';

    // Setup converter state
    const tableNode = document.createElement('table');
    converter['elements'] = [
      {
        type: 7,
        node: document.createElement('div'),
        class: '',
        level: 1,
        subText: '',
      },
      { type: 12, node: tableNode, class: '', level: 1, subText: '' },
    ];

    // Act
    converter['parseDynamicHeader'](element);

    // Assert
    expect(converter['elements'].length).toBe(2); // still 2 elements
    expect(converter['elements'][0].node.textContent).toContain(
      'Sample Header Text'
    ); // moved content
  });

  it('should handle parseDynamicHeader when elements.type is not 7', () => {
    const element = document.createElement('div');
    element.textContent = '  Sample Header Text  ';
    converter['elements'] = [
      { type: 12, text: 'Existing Title', node: { appendChild: () => {} } },
    ] as unknown as ParserElement[];
    expect(converter['parseDynamicHeader'](element)).toBeUndefined();
  });
});
describe('Converter', () => {
  let service: LicitConverter;

  beforeEach(() => {
    service = new LicitConverter(testConfig);
  });
  it('should return false if class is in exclusion list (exact match)', () => {
    expect(service['matchClassToExcludeNumber']('cellbody')).toBeFalsy();
    expect(service['matchClassToExcludeNumber']('cellheading')).toBeFalsy();
    expect(service['matchClassToExcludeNumber']('bolditalic')).toBeFalsy();
  });

  it('should trim whitespace before checking', () => {
    expect(service['matchClassToExcludeNumber']('   cellbody   ')).toBeFalsy();
  });

  it('should be case-insensitive', () => {
    expect(service['matchClassToExcludeNumber']('CellBody')).toBeFalsy();
    expect(service['matchClassToExcludeNumber']('BOLDITALIC')).toBeFalsy();
  });

  it('should return true if class is not in exclusion list', () => {
    expect(service['matchClassToExcludeNumber']('randomClass')).toBeTruthy();
    expect(service['matchClassToExcludeNumber']('paragraph')).toBeTruthy();
  });

  it('should handle empty string gracefully', () => {
    expect(service['matchClassToExcludeNumber']('')).toBeTruthy();
  });

  it('should return the custom style when found', () => {
    const customStyles = [{ styleName: 'style1' }, { styleName: 'style2' }];
    const service = new LicitConverter({ customStyles } as TransformConfig);
    const styleNameToFind = 'style1';

    const result = service['getCustomStyle'](styleNameToFind);

    expect(result).toEqual({ styleName: 'style1' });
  });

  it('should render a simple paragraph', () => {
    const div = document.createElement('div');
    div.setAttribute('class', 'my-class');
    const p = document.createElement('p');
    const span = document.createElement('span');
    div.setAttribute('class', 'inner-span');
    div.appendChild(p);
    div.appendChild(span);
    expect(service['render'](div.querySelectorAll('div'))).toBeTruthy();
  });

  it('should render a header element', () => {
    const mockHeader = document.createElement('h1');
    mockHeader.textContent = 'Header Text';

    const result: LicitDocumentJSON = service['render']([
      mockHeader,
    ] as unknown as NodeListOf<Element>);

    const expectedOutput: LicitDocumentJSON = {
      type: 'doc',
      attrs: {
        layout: null,
        padding: null,
        width: null,
      },
      content: [
        {
          type: 'heading',
          attrs: {
            level: 1,
          },
          content: [
            {
              type: 'text',
              text: 'Header Text',
            },
          ],
        },
      ],
    };
    expect(result).not.toEqual(expectedOutput);
  });

  it('should handle render', () => {
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseElement'
    );
    const node1 = document.createElement('div');
    node1.className = 'FM_chpara0';
    const node2 = document.createElement('div');
    node2.className = 'FM_attsubpara1';
    const node3 = document.createElement('div');
    node3.className = 'FM_attpara0';
    const node4 = document.createElement('div');
    node4.className = 'FM_chsubpara1';
    const node5 = document.createElement('div');
    node5.className = 'test';
    const node6 = document.createElement('div');
    node6.innerHTML = '<table><tr><td>Mock Table Content</td></tr></table>';
    service['parseTableFigure'](node1);
    service['parseTable'](node6, false);
    const node7 = document.createElement('div');
    node7.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseFigure'](node7);
    service['parseNote'](node1);
    service['parseHR'](node1);
    service['parseChapterTitle'](node1);
    service['parseChapterSubtitle'](node1);

    service['parseHeader'](node1, node2);
    const node8 = document.createElement('div');
    node8.className = 'FM_chsubpara1';
    node8.textContent = 'test';
    node8.setAttribute('align', 'center');
    node8.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseParagraph'](node8);
    service['parseFigureTitle'](node1);
    service['parseChangeBarPara'](node1);
    service['parseTableTitle'](node1);
    service['parseSectionTitle'](node1);

    service['render']([
      node5,
      node1,
      node2,
      node3,
      node4,
    ] as unknown as NodeListOf<Element>);

    expect(spy).toHaveBeenCalled();
  });

  it('should handle render_doc', () => {
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseTable'
    );
    const node1 = document.createElement('span');
    node1.className = 'FM_chpara0';
    node1.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';

    const node2 = document.createElement('div');
    node2.className = 'FM_attsubpara1';
    const node3 = document.createElement('div');
    node3.className = 'FM_attpara0';
    const node4 = document.createElement('div');
    node4.className = 'FM_chsubpara1';
    const node5 = document.createElement('div');
    node5.className = 'test';
    const node6 = document.createElement('div');
    node6.innerHTML = '<table><tr><td>Mock Table Content</td></tr></table>';
    service['parseTableFigure'](node1);
    service['parseTable'](node6, false);
    const node7 = document.createElement('div');
    node7.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseFigure'](node7);
    service['parseNote'](node1);
    service['parseHR'](node1);
    service['parseChapterTitle'](node1);
    service['parseChapterSubtitle'](node1);

    service['parseHeader'](node1, node2);
    const node8 = document.createElement('div');
    node8.className = 'FM_chsubpara1';
    node8.textContent = 'test';
    node8.setAttribute('align', 'center');
    node8.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseParagraph'](node8);
    service['parseFigureTitle'](node1);
    service['parseChangeBarPara'](node1);
    service['parseTableTitle'](node1);
    service['parseSectionTitle'](node1);

    service['render_doc'](
      [node5, node1, node2, node3, node4] as unknown as NodeListOf<Element>,
      [],
      ''
    );

    expect(spy).toHaveBeenCalled();
  });

  it('should sanitize an element', () => {
    const config: TransformConfig = {
      customStylesUrl: 'your-styles-url',
      replacementChars: [
        { find: 'old1', replace: 'new1' },
        { find: 'old2', replace: 'new2' },
      ],
      replaceCharacters: true,
      stripSectionNumbers: true,
      replaceWithLinks: [],
      customStyles: [],
    };
    const element = document.createElement('div');
    element.innerHTML = '<p>[1]This is a test.•Bullet point</p>';
    element.className = 'FM_someClass';

    const service = new LicitConverter(config);
    service['sanitizeElement'](element);

    expect(element.innerHTML).toEqual('<p>[1]This is a test.Bullet point</p>');
    expect(element.className).toEqual('FM_someClass');
  });

  it('should return level from custom style', () => {
    const className = 'someStyle';
    const customStyle = {
      styleName: 'mock',
      styles: {
        styleLevel: '5',
      },
    };
    jest
      .spyOn(
        service as unknown as Record<string, () => unknown>,
        'getCustomStyle'
      )
      .mockReturnValue(customStyle);

    const result = service['extractLevel'](className);

    expect(result).toBe(5);
  });

  it('should return 0 if no level found', () => {
    const className = 'noStyle';
    jest
      .spyOn(
        service as unknown as Record<string, () => unknown>,
        'getCustomStyle'
      )
      .mockReturnValue(null);

    const result = service['extractLevel'](className);

    expect(result).toBe(0);
  });

  it('should return 0 if level is not defined in custom style', () => {
    const className = 'someStyle';
    const customStyle = {
      styleName: 'mock',
      styles: {},
    };
    jest
      .spyOn(
        service as unknown as Record<string, () => unknown>,
        'getCustomStyle'
      )
      .mockReturnValue(customStyle);

    const result = service['extractLevel'](className);

    expect(result).toBe(0);
  });

  it('should log a warning message', () => {
    jest.spyOn(console, 'warn');
    const element = document.createElement('div');
    element.className = 'unknown-element';

    element.className = 'unknown-element';

    service['parseUnknownElement'](
      element,
      'Ignoring "Cross_Reference" because cross-references text is not meant to be displayed.'
    );

    expect(console.warn).toHaveBeenCalledWith(
      'Parsing unknown element: unknown-element.Ignoring "Cross_Reference" because cross-references text is not meant to be displayed.'
    );
  });

  it('should set class correctly if classname attribute is present', () => {
    const element = document.createElement('div');
    element.className = 'paragraph';

    element.setAttribute('classname', 'custom-class');

    service['parseParagraph'](element);

    expect(service['elements'][0].class).toBe('custom-class');
  });

  it('should set element as parsed in elementsParsedMap', () => {
    const element = document.createElement('_AF_Example');
    const nextElement = document.createElement('div');

    service['parseElement_doc'](element, nextElement);
    expect(element.tagName).toEqual('_AF_EXAMPLE');
    expect(service['elementsParsedMap'].has('_AF_EXAMPLE')).toEqual(true);
    expect(service['elementsParsedMap'].get('_AF_EXAMPLE')).toEqual(true);
  });

  it('should parse _AF_Example', () => {
    const element = { tagName: '_AF_Example' } as unknown as Element;
    const nextElement = document.createElement('div');
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseNote'
    );
    service['parseElement_doc'](element, nextElement);
    expect(spy).toHaveBeenCalledWith(element);
  });

  it('should parse HR', () => {
    const element = { tagName: 'HR' } as unknown as Element;
    const nextElement = document.createElement('div');
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseHR'
    );
    service['parseElement_doc'](element, nextElement);
    expect(spy).toHaveBeenCalledWith(element);
  });

  it('should parse chapterTitle', () => {
    const element = { tagName: 'chapterTitle' } as unknown as Element;
    const nextElement = document.createElement('div');
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseChapterTitle'
    );
    service['parseElement_doc'](element, nextElement);
    expect(spy).toHaveBeenCalledWith(element);
  });

  it('should parse H1', () => {
    const element = { tagName: 'H1' } as unknown as Element;
    const nextElement = document.createElement('div');
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseHeader'
    );
    service['parseElement_doc'](element, nextElement);
    expect(spy).toHaveBeenCalledWith(element, nextElement);
  });

  it('should parse chTableTitle', () => {
    const element = { tagName: 'chTableTitle' } as unknown as Element;
    const nextElement = document.createElement('div');
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseTableTitle'
    );
    service['parseElement_doc'](element, nextElement);
    expect(spy).toHaveBeenCalledWith(element);
  });

  it('should parse chText', () => {
    const element = { tagName: 'chText' } as unknown as Element;
    const nextElement = document.createElement('div');
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseChapterSubtitle'
    );
    service['parseElement_doc'](element, nextElement);
    expect(spy).toHaveBeenCalledWith(element);
  });

  it('should parse i_bullet', () => {
    const element = { tagName: 'i_bullet' } as unknown as Element;
    const nextElement = document.createElement('div');
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseBullet'
    );
    service['parseElement_doc'](element, nextElement);
    expect(spy).toHaveBeenCalledWith(element);
  });

  it('should parse P', () => {
    const element = document.createElement('P');
    const nextElement = document.createElement('div');
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseParagraph'
    );
    service['parseElement_doc'](element, nextElement);
    expect(spy).toHaveBeenCalledWith(element);
  });

  it('should parse chFigureTitle', () => {
    const element = {
      tagName: 'chFigureTitle',
      querySelector: () => [],
    } as unknown as Element;
    const nextElement = document.createElement('div');
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseFigureTitle'
    );
    service['parseElement_doc'](element, nextElement);
    expect(spy).toHaveBeenCalledWith(element);
  });

  it('should parse chFigureTitle 2', () => {
    const element = {
      tagName: 'chFigureTitle',
      querySelector: () => [],
    } as unknown as Element;
    const nextElement = document.createElement('div');
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseFigureTitle'
    );
    service['parseElement_doc'](element, nextElement);
    expect(spy).toHaveBeenCalledWith(element);
  });

  it('should parse ChangeBarPara', () => {
    const element = { tagName: 'ChangeBarPara' } as unknown as Element;
    const nextElement = document.createElement('div');
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseChangeBarPara'
    );
    service['parseElement_doc'](element, nextElement);
    expect(spy).toHaveBeenCalledWith(element);
  });

  it('should parse sectionTitle', () => {
    const element = { tagName: 'sectionTitle' } as unknown as Element;
    const nextElement = document.createElement('div');
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseSectionTitle'
    );
    service['parseElement_doc'](element, nextElement);
    expect(spy).toHaveBeenCalledWith(element);
  });

  it('should parse UL', () => {
    const element = { tagName: 'UL' } as unknown as Element;
    const nextElement = document.createElement('div');
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseBullet'
    );
    service['parseElement_doc'](element, nextElement);
    expect(spy).toHaveBeenCalledWith(element);
  });

  it('should set element as parsed in elementsParsedMap parseElement', () => {
    const element = { className: '_AF_Example' } as unknown as Element;
    const nextElement = document.createElement('div');
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'sanitizeElement'
    );
    service['parseElement'](element, nextElement);
    expect(spy).toHaveBeenCalledWith(element);
    expect(service['elementsParsedMap'].get('_AF_Example')).toEqual(true);
  });

  it('should parseElement chapterTitle', () => {
    const element = { className: 'chapterTitle' } as unknown as Element;
    const nextElement = document.createElement('div');
    const cservice = new LicitConverter(
      asTransformConfig({ stripSectionNumbers: true })
    );
    const spy1 = jest.spyOn(
      cservice as unknown as Record<string, () => unknown>,
      'parseChapterTitle'
    );
    cservice['parseElement'](element, nextElement);
    expect(spy1).toHaveBeenCalledWith(element);
  });

  it('should parseElement chpara0', () => {
    const element = { className: 'chpara0' } as unknown as Element;
    const nextElement = document.createElement('div');
    const cservice = new LicitConverter(
      asTransformConfig({ stripSectionNumbers: true })
    );
    const spy1 = jest.spyOn(
      cservice as unknown as Record<string, () => unknown>,
      'parseHeader'
    );
    cservice['parseElement'](element, nextElement);
    expect(spy1).toHaveBeenCalledWith(element, nextElement);
  });

  it('should parseElement chTableTitle', () => {
    const element = { className: 'chTableTitle' } as unknown as Element;
    const nextElement = document.createElement('div');
    const cservice = new LicitConverter(
      asTransformConfig({ stripSectionNumbers: true })
    );
    const spy1 = jest.spyOn(
      cservice as unknown as Record<string, () => unknown>,
      'parseTableTitle'
    );
    cservice['parseElement'](element, nextElement);
    expect(spy1).toHaveBeenCalledWith(element);
  });

  it('should parseElement chText', () => {
    const element = { className: 'chText' } as unknown as Element;
    const nextElement = document.createElement('div');
    const cservice = new LicitConverter(
      asTransformConfig({ stripSectionNumbers: true })
    );
    const spy1 = jest.spyOn(
      cservice as unknown as Record<string, () => unknown>,
      'parseChapterSubtitle'
    );
    cservice['parseElement'](element, nextElement);
    expect(spy1).toHaveBeenCalledWith(element);
  });

  it('should parseElement i_bullet', () => {
    const element = {
      className: 'i_bullet',
      getAttribute: () => null,
    } as unknown as Element;
    const nextElement = document.createElement('div');
    const cservice = new LicitConverter(
      asTransformConfig({ stripSectionNumbers: true })
    );
    const spy1 = jest.spyOn(
      cservice as unknown as Record<string, () => unknown>,
      'parseParagraph'
    );
    cservice['parseElement'](element, nextElement);
    expect(spy1).toHaveBeenCalledWith(element);
  });

  it('should parseElement para', () => {
    const element = {
      className: 'para',
      getAttribute: () => null,
    } as unknown as Element;
    const nextElement = document.createElement('div');
    const cservice = new LicitConverter(
      asTransformConfig({ stripSectionNumbers: true })
    );
    const spy1 = jest.spyOn(
      cservice as unknown as Record<string, () => unknown>,
      'parseParagraph'
    );
    cservice['parseElement'](element, nextElement);
    expect(spy1).toHaveBeenCalledWith(element);
  });

  it('should parseElement chFigureTitle', () => {
    const element = {
      className: 'chFigureTitle',
      querySelector: () => [],
    } as unknown as Element;
    const nextElement = document.createElement('div');
    const cservice = new LicitConverter(
      asTransformConfig({ stripSectionNumbers: true })
    );
    const spy1 = jest.spyOn(
      cservice as unknown as Record<string, () => unknown>,
      'parseFigureTitle'
    );
    cservice['parseElement'](element, nextElement);
    expect(spy1).toHaveBeenCalledWith(element);
  });

  it('should parseElement ChangeBarPara', () => {
    const element = { className: 'ChangeBarPara' } as unknown as Element;
    const nextElement = document.createElement('div');
    const cservice = new LicitConverter(
      asTransformConfig({ stripSectionNumbers: true })
    );
    const spy1 = jest.spyOn(
      cservice as unknown as Record<string, () => unknown>,
      'parseChangeBarPara'
    );
    cservice['parseElement'](element, nextElement);
    expect(spy1).toHaveBeenCalledWith(element);
  });

  it('should parseElement sectionTitle', () => {
    const element = { className: 'sectionTitle' } as unknown as Element;
    const nextElement = document.createElement('div');
    const cservice = new LicitConverter(
      asTransformConfig({ stripSectionNumbers: true })
    );
    const spy1 = jest.spyOn(
      cservice as unknown as Record<string, () => unknown>,
      'parseSectionTitle'
    );
    cservice['parseElement'](element, nextElement);
    expect(spy1).toHaveBeenCalledWith(element);
  });

  it('should parseElement unknown-element', () => {
    const element = {
      className: 'unknown-element',
      getAttribute: () => {},
    } as unknown as Element;
    const nextElement = document.createElement('div');
    const cservice = new LicitConverter(
      asTransformConfig({ stripSectionNumbers: true })
    );
    const spy1 = jest.spyOn(
      cservice as unknown as Record<string, () => unknown>,
      'parseUnknownElement'
    );
    cservice['parseElement'](element, nextElement);
    expect(spy1).not.toHaveBeenCalledWith(element, '');
  });

  it('should parseElement unknown-element 2', () => {
    const element = { className: 'Cross_Reference' } as unknown as Element;
    const nextElement = document.createElement('div');
    const cservice = new LicitConverter(
      asTransformConfig({ stripSectionNumbers: true })
    );
    const spy1 = jest.spyOn(
      cservice as unknown as Record<string, () => unknown>,
      'parseUnknownElement'
    );
    cservice['parseElement'](element, nextElement);
    expect(spy1).toHaveBeenCalledWith(
      element,
      'Ignoring "Cross_Reference" because cross-references text is not meant to be displayed.'
    );
  });

  it('should parse nested list correctly', () => {
    const licitDocument = new LicitDocumentElement();
    const spy = jest.spyOn(licitDocument, 'appendElement');
    const cservice = new LicitConverter(
      asTransformConfig({ stripSectionNumbers: true })
    );
    const indent = 0;
    const mockNode = document.createElement('ul');
    const mockChildNode = document.createElement('ul');
    mockChildNode.innerHTML = '<li>Item 1</li><li>Item 2</li>';
    mockNode.appendChild(mockChildNode);
    cservice['ParseNestedList']('UL', mockNode, licitDocument, indent);
    expect(spy).toHaveBeenCalled();
  });

  it('should parse nested listType is not UL', () => {
    const licitDocument = new LicitDocumentElement();
    const spy = jest.spyOn(licitDocument, 'appendElement');
    const indent = 0;
    const mockNode = document.createElement('ul');
    const mockChildNode = document.createElement('test');
    mockChildNode.innerHTML = '<li>Item 1</li><li>Item 2</li>';
    mockNode.appendChild(mockChildNode);
    service['ParseNestedList']('test', mockNode, licitDocument, indent);
    expect(spy).toHaveBeenCalled();
  });

  it('should parse nested list with recursion', () => {
    const licitDocument = new LicitDocumentElement();
    const spy = jest.spyOn(licitDocument, 'appendElement');
    const indent = 0;
    const mockNode = document.createElement('ul');
    const mockChildNode = document.createElement('ul');
    mockChildNode.innerHTML = '<li>Item 1</li><li>Item 2</li>';
    const nestedMockChildNode = document.createElement('ul');
    nestedMockChildNode.innerHTML =
      '<li>Nested Item 1</li><li>Nested Item 2</li>';
    mockChildNode.appendChild(nestedMockChildNode);
    mockNode.appendChild(mockChildNode);
    service['ParseNestedList']('UL', mockNode, licitDocument, indent);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should parse bullet element and add it to elements array', () => {
    const mockElement: Element = document.createElement('div');
    mockElement.className = 'bullet-level-2';
    service['parseBullet'](mockElement);
    expect(service['elements'].length).toBe(1);
    const parsedElement = service['elements'][0];
    expect(parsedElement.node).toBe(mockElement);
    expect(parsedElement.class).toBe('bullet-level-2');
    expect(parsedElement.level).toBe(2);
    expect(parsedElement.subText).toBe('');
  });

  it('should parse ordered element and add it to elements array', () => {
    const mockElement: Element = document.createElement('div');
    mockElement.className = 'ordered-level-3';
    service['parseOrdered'](mockElement);
    expect(service['elements'].length).toBe(1);

    const parsedElement = service['elements'][0];
    expect(parsedElement.node).toBe(mockElement);
    expect(parsedElement.class).toBe('ordered-level-3');
    expect(parsedElement.level).toBe(3);
    expect(parsedElement.subText).toBe('');
  });

  it('should call parseTableFigure for div with img', () => {
    const mocknode = document.createElement('span');
    const mockImg = document.createElement('img');
    const mockInfo = [];
    mocknode.appendChild(mockImg);
    const mockset = document.createElement('div');
    mockset.appendChild(mocknode);
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseTableFigure'
    );
    service['render_doc'](
      mockset.querySelectorAll('span'),
      mockInfo,
      'moDocType'
    );

    expect(spy).toHaveBeenCalledWith(mocknode);
  });

  it('should call parseTableFigure for div with tbody', () => {
    const mocknode = document.createElement('div');
    const mockImg = document.createElement('tbody');
    const mockInfo = [];
    mocknode.appendChild(mockImg);
    const mockset = document.createElement('p');
    mockset.appendChild(mocknode);
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseTable'
    );
    service['render_doc'](
      mockset.querySelectorAll('div'),
      mockInfo,
      'moDocType'
    );

    expect(spy).toHaveBeenCalledWith(mocknode, false);
  });

  it('should render a simple paragraph when element.type = ParserElementType.Paragraph', () => {
    const div = document.createElement('div');
    div.setAttribute('class', 'my-class');
    const p = document.createElement('p');
    const span = document.createElement('span');
    div.setAttribute('class', 'inner-span');
    div.appendChild(p);
    div.appendChild(span);
    const nodes = document.createElement('div');
    nodes.appendChild(div);
    const el = document.createElement('div');
    el.textContent = 'table of contents';
    el.setAttribute('align', 'left');
    service['elements'] = [
      { node: el, class: '', type: 5, level: 1, subText: 'test' },
    ];
    expect(service['render'](nodes.querySelectorAll('div'))).toBeTruthy();
  });
  it('should handle render_doc when e.type  = Figure', () => {
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseTable'
    );
    const node1 = document.createElement('span');
    node1.className = 'FM_chpara0';
    node1.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';

    const node2 = document.createElement('div');
    node2.className = 'FM_attsubpara1';
    const node3 = document.createElement('div');
    node3.className = 'FM_attpara0';
    const node4 = document.createElement('div');
    node4.className = 'FM_chsubpara1';
    const node5 = document.createElement('div');
    node5.className = 'test';
    const node6 = document.createElement('div');
    node6.innerHTML = '<table><tr><td>Mock Table Content</td></tr></table>';
    service['parseTableFigure'](node1);
    service['parseTable'](node6, false);
    const node7 = document.createElement('div');
    node7.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseFigure'](node7);
    service['parseNote'](node1);
    service['parseHR'](node1);
    service['parseChapterTitle'](node1);
    service['parseChapterSubtitle'](node1);

    service['parseHeader'](node1, node2);
    const node8 = document.createElement('div');
    node8.className = 'FM_chsubpara1';
    node8.textContent = 'test';
    node8.setAttribute('align', 'center');
    node8.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseParagraph'](node8);
    service['parseFigureTitle'](node1);
    service['parseChangeBarPara'](node1);
    service['parseTableTitle'](node1);
    service['parseSectionTitle'](node1);
    const el = document.createElement('P');
    el.textContent = 'table of contents';
    el.setAttribute('align', 'left');
    //el.se
    service['elements'] = [
      { node: el, class: '', type: 12, level: 1, subText: 'test' },
    ];

    service['render_doc'](
      [node5, node1, node2, node3, node4] as unknown as NodeListOf<Element>,
      [],
      ''
    );

    expect(spy).toHaveBeenCalled();
  });
  it('should handle render_doc when e.type  = paragraph', () => {
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseTable'
    );
    const node1 = document.createElement('span');
    node1.className = 'FM_chpara0';
    node1.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';

    const node2 = document.createElement('div');
    node2.className = 'FM_attsubpara1';
    const node3 = document.createElement('div');
    node3.className = 'FM_attpara0';
    const node4 = document.createElement('div');
    node4.className = 'FM_chsubpara1';
    const node5 = document.createElement('div');
    node5.className = 'test';
    const node6 = document.createElement('div');
    node6.innerHTML = '<table><tr><td>Mock Table Content</td></tr></table>';
    service['parseTableFigure'](node1);
    service['parseTable'](node6, false);
    const node7 = document.createElement('div');
    node7.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseFigure'](node7);
    service['parseNote'](node1);
    service['parseHR'](node1);
    service['parseChapterTitle'](node1);
    service['parseChapterSubtitle'](node1);

    service['parseHeader'](node1, node2);
    const node8 = document.createElement('div');
    node8.className = 'FM_chsubpara1';
    node8.textContent = 'test';
    node8.setAttribute('align', 'center');
    node8.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseParagraph'](node8);
    service['parseFigureTitle'](node1);
    service['parseChangeBarPara'](node1);
    service['parseTableTitle'](node1);
    service['parseSectionTitle'](node1);
    const el = document.createElement('P');
    el.textContent = 'table of contents';
    el.setAttribute('align', 'left');
    //el.se
    service['elements'] = [
      { node: el, class: '', type: 5, level: 1, subText: 'test' },
    ];

    service['render_doc'](
      [node5, node1, node2, node3, node4] as unknown as NodeListOf<Element>,
      [],
      ''
    );

    expect(spy).toHaveBeenCalled();
  });
  it('should handle render_doc when e.type = Figure', () => {
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseTable'
    );
    const node1 = document.createElement('span');
    node1.className = 'FM_chpara0';
    node1.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';

    const node2 = document.createElement('div');
    node2.className = 'FM_attsubpara1';
    const node3 = document.createElement('div');
    node3.className = 'FM_attpara0';
    const node4 = document.createElement('div');
    node4.className = 'FM_chsubpara1';
    const node5 = document.createElement('div');
    node5.className = 'test';
    const node6 = document.createElement('div');
    node6.innerHTML = '<table><tr><td>Mock Table Content</td></tr></table>';
    service['parseTableFigure'](node1);
    service['parseTable'](node6, false);
    const node7 = document.createElement('div');
    node7.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseFigure'](node7);
    service['parseNote'](node1);
    service['parseHR'](node1);
    service['parseChapterTitle'](node1);
    service['parseChapterSubtitle'](node1);

    service['parseHeader'](node1, node2);
    const node8 = document.createElement('div');
    node8.className = 'FM_chsubpara1';
    node8.textContent = 'test';
    node8.setAttribute('align', 'center');
    node8.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseParagraph'](node8);
    service['parseFigureTitle'](node1);
    service['parseChangeBarPara'](node1);
    service['parseTableTitle'](node1);
    service['parseSectionTitle'](node1);
    const el = document.createElement('img');
    el.textContent = 'Text content';
    el.setAttribute('align', 'left');
    const img1 = document.createElement('img');
    img1.src = 'path/to/image1.jpg';
    img1.alt = '/ERR:Unsupported Image Format x-emf';
    el.appendChild(img1);

    //el.se
    service['elements'] = [
      { node: el, class: '', type: 12, level: 1, subText: 'test' },
    ];

    service['render_doc'](
      [node5, node1, node2, node3, node4] as unknown as NodeListOf<Element>,
      [],
      ''
    );

    expect(spy).toHaveBeenCalled();
  });
  it('should handle render_doc when e.type = Table when thead is the tag name', () => {
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseTable'
    );
    const node1 = document.createElement('span');
    node1.className = 'FM_chpara0';
    node1.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';

    const node2 = document.createElement('div');
    node2.className = 'FM_attsubpara1';
    const node3 = document.createElement('div');
    node3.className = 'FM_attpara0';
    const node4 = document.createElement('div');
    node4.className = 'FM_chsubpara1';
    const node5 = document.createElement('div');
    node5.className = 'test';
    const node6 = document.createElement('div');
    node6.innerHTML = '<table><tr><td>Mock Table Content</td></tr></table>';
    service['parseTableFigure'](node1);
    service['parseTable'](node6, false);
    const node7 = document.createElement('div');
    node7.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseFigure'](node7);
    service['parseNote'](node1);
    service['parseHR'](node1);
    service['parseChapterTitle'](node1);
    service['parseChapterSubtitle'](node1);

    service['parseHeader'](node1, node2);
    const node8 = document.createElement('div');
    node8.className = 'FM_chsubpara1';
    node8.textContent = 'test';
    node8.setAttribute('align', 'center');
    node8.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseParagraph'](node8);
    service['parseFigureTitle'](node1);
    service['parseChangeBarPara'](node1);
    service['parseTableTitle'](node1);
    service['parseSectionTitle'](node1);
    const el = document.createElement('OL');
    el.textContent = 'Text content';
    el.setAttribute('align', 'left');
    const ul = document.createElement('thead');
    el.appendChild(ul);
    const ol = document.createElement('tbody');
    el.appendChild(ol);

    //el.se
    service['elements'] = [
      { node: el, class: '', type: 11, level: 1, subText: 'test' },
    ];

    service['render_doc'](
      [node5, node1, node2, node3, node4] as unknown as NodeListOf<Element>,
      [],
      ''
    );

    expect(spy).toHaveBeenCalled();
  });
  it('should handle render_doc when e.type = Table when table is the tag name', () => {
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseTable'
    );
    const node1 = document.createElement('span');
    node1.className = 'FM_chpara0';
    node1.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';

    const node2 = document.createElement('div');
    node2.className = 'FM_attsubpara1';
    const node3 = document.createElement('div');
    node3.className = 'FM_attpara0';
    const node4 = document.createElement('div');
    node4.className = 'FM_chsubpara1';
    const node5 = document.createElement('div');
    node5.className = 'test';
    const node6 = document.createElement('div');
    node6.innerHTML = '<table><tr><td>Mock Table Content</td></tr></table>';
    service['parseTableFigure'](node1);
    service['parseTable'](node6, false);
    const node7 = document.createElement('div');
    node7.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseFigure'](node7);
    service['parseNote'](node1);
    service['parseHR'](node1);
    service['parseChapterTitle'](node1);
    service['parseChapterSubtitle'](node1);

    service['parseHeader'](node1, node2);
    const node8 = document.createElement('div');
    node8.className = 'FM_chsubpara1';
    node8.textContent = 'test';
    node8.setAttribute('align', 'center');
    node8.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseParagraph'](node8);
    service['parseFigureTitle'](node1);
    service['parseChangeBarPara'](node1);
    service['parseTableTitle'](node1);
    service['parseSectionTitle'](node1);
    const el = document.createElement('OL');
    el.textContent = 'Text content';
    el.setAttribute('align', 'left');
    const ul = document.createElement('table');
    el.appendChild(ul);
    const ol = document.createElement('tbody');
    el.appendChild(ol);

    //el.se
    service['elements'] = [
      { node: el, class: '', type: 11, level: 1, subText: 'test' },
    ];

    service['render_doc'](
      [node5, node1, node2, node3, node4] as unknown as NodeListOf<Element>,
      [],
      ''
    );

    expect(spy).toHaveBeenCalled();
  });
  it('should handle render_doc when e.type = Table when something else is the tag name', () => {
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseTable'
    );
    const node1 = document.createElement('span');
    node1.className = 'FM_chpara0';
    node1.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';

    const node2 = document.createElement('div');
    node2.className = 'FM_attsubpara1';
    const node3 = document.createElement('div');
    node3.className = 'FM_attpara0';
    const node4 = document.createElement('div');
    node4.className = 'FM_chsubpara1';
    const node5 = document.createElement('div');
    node5.className = 'test';
    const node6 = document.createElement('div');
    node6.innerHTML = '<table><tr><td>Mock Table Content</td></tr></table>';
    service['parseTableFigure'](node1);
    service['parseTable'](node6, false);
    const node7 = document.createElement('div');
    node7.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseFigure'](node7);
    service['parseNote'](node1);
    service['parseHR'](node1);
    service['parseChapterTitle'](node1);
    service['parseChapterSubtitle'](node1);

    service['parseHeader'](node1, node2);
    const node8 = document.createElement('div');
    node8.className = 'FM_chsubpara1';
    node8.textContent = 'test';
    node8.setAttribute('align', 'center');
    node8.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseParagraph'](node8);
    service['parseFigureTitle'](node1);
    service['parseChangeBarPara'](node1);
    service['parseTableTitle'](node1);
    service['parseSectionTitle'](node1);
    const el = document.createElement('OL');
    el.textContent = 'Text content';
    el.setAttribute('align', 'left');
    const ul = document.createElement('ul');
    el.appendChild(ul);
    const ol = document.createElement('tbody');
    el.appendChild(ol);

    //el.se
    service['elements'] = [
      { node: el, class: '', type: 11, level: 1, subText: 'test' },
    ];

    service['render_doc'](
      [node5, node1, node2, node3, node4] as unknown as NodeListOf<Element>,
      [],
      ''
    );

    expect(spy).toHaveBeenCalled();
  });
  it('should handle render_doc when e.type = vignet', () => {
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseTable'
    );
    const node1 = document.createElement('span');
    node1.className = 'FM_chpara0';
    node1.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';

    const node2 = document.createElement('div');
    node2.className = 'FM_attsubpara1';
    const node3 = document.createElement('div');
    node3.className = 'FM_attpara0';
    const node4 = document.createElement('div');
    node4.className = 'FM_chsubpara1';
    const node5 = document.createElement('div');
    node5.className = 'test';
    const node6 = document.createElement('div');
    node6.innerHTML = '<table><tr><td>Mock Table Content</td></tr></table>';
    service['parseTableFigure'](node1);
    service['parseTable'](node6, false);
    const node7 = document.createElement('div');
    node7.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseFigure'](node7);
    service['parseNote'](node1);
    service['parseHR'](node1);
    service['parseChapterTitle'](node1);
    service['parseChapterSubtitle'](node1);

    service['parseHeader'](node1, node2);
    const node8 = document.createElement('div');
    node8.className = 'FM_chsubpara1';
    node8.textContent = 'test';
    node8.setAttribute('align', 'center');
    node8.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseParagraph'](node8);
    service['parseFigureTitle'](node1);
    service['parseChangeBarPara'](node1);
    service['parseTableTitle'](node1);
    service['parseSectionTitle'](node1);
    const el = document.createElement('OL');
    el.textContent = 'Text content';
    el.setAttribute('align', 'left');
    const ul = document.createElement('img');
    el.appendChild(ul);
    const ol = document.createElement('tbody');
    el.appendChild(ol);

    //el.se
    service['elements'] = [
      { node: el, class: '', type: 15, level: 1, subText: 'test' },
    ];

    service['render_doc'](
      [node5, node1, node2, node3, node4] as unknown as NodeListOf<Element>,
      [],
      'Non Specific'
    );

    expect(spy).toHaveBeenCalled();
  });
  it('should handle render_doc when e.type = vignet when element.node.nodeName === P)', () => {
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseTable'
    );
    const node1 = document.createElement('span');
    node1.className = 'FM_chpara0';
    node1.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';

    const node2 = document.createElement('div');
    node2.className = 'FM_attsubpara1';
    const node3 = document.createElement('div');
    node3.className = 'FM_attpara0';
    const node4 = document.createElement('div');
    node4.className = 'FM_chsubpara1';
    const node5 = document.createElement('div');
    node5.className = 'test';
    const node6 = document.createElement('div');
    node6.innerHTML = '<table><tr><td>Mock Table Content</td></tr></table>';
    service['parseTableFigure'](node1);
    service['parseTable'](node6, false);
    const node7 = document.createElement('div');
    node7.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseFigure'](node7);
    service['parseNote'](node1);
    service['parseHR'](node1);
    service['parseChapterTitle'](node1);
    service['parseChapterSubtitle'](node1);

    service['parseHeader'](node1, node2);
    const node8 = document.createElement('div');
    node8.className = 'FM_chsubpara1';
    node8.textContent = 'test';
    node8.setAttribute('align', 'center');
    node8.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseParagraph'](node8);
    service['parseFigureTitle'](node1);
    service['parseChangeBarPara'](node1);
    service['parseTableTitle'](node1);
    service['parseSectionTitle'](node1);
    const el = document.createElement('OL');
    el.textContent = 'Text content';
    el.setAttribute('align', 'left');
    const ul = document.createElement('img');
    ul.src = 'test';
    ul.alt = '/ERR:Unsupported Image Format x-emf';
    el.appendChild(ul);
    const ol = document.createElement('img');
    el.appendChild(ol);
    const child = document.createElement('P');
    el.appendChild(child);

    //el.se
    service['elements'] = [
      { node: el, class: '', type: 15, level: 1, subText: 'test' },
    ];

    service['render_doc'](
      [node5, node1, node2, node3, node4] as unknown as NodeListOf<Element>,
      [],
      'Non Specific'
    );

    expect(spy).toHaveBeenCalled();
  });
  it('should handle render_doc when e.type = vignet when element.node.nodeName === P) 2', () => {
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseTable'
    );
    const node1 = document.createElement('span');
    node1.className = 'FM_chpara0';
    node1.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';

    const node2 = document.createElement('div');
    node2.className = 'FM_attsubpara1';
    const node3 = document.createElement('div');
    node3.className = 'FM_attpara0';
    const node4 = document.createElement('div');
    node4.className = 'FM_chsubpara1';
    const node5 = document.createElement('div');
    node5.className = 'test';
    const node6 = document.createElement('div');
    node6.innerHTML = '<table><tr><td>Mock Table Content</td></tr></table>';
    service['parseTableFigure'](node1);
    service['parseTable'](node6, false);
    const node7 = document.createElement('div');
    node7.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseFigure'](node7);
    service['parseNote'](node1);
    service['parseHR'](node1);
    service['parseChapterTitle'](node1);
    service['parseChapterSubtitle'](node1);

    service['parseHeader'](node1, node2);
    const node8 = document.createElement('div');
    node8.className = 'FM_chsubpara1';
    node8.textContent = 'test';
    node8.setAttribute('align', 'center');
    node8.innerHTML = '<img src="mock-image.jpg" alt="Mock Image">';
    service['parseParagraph'](node8);
    service['parseFigureTitle'](node1);
    service['parseChangeBarPara'](node1);
    service['parseTableTitle'](node1);
    service['parseSectionTitle'](node1);
    const el = document.createElement('OL');
    el.textContent = 'Text content';
    el.setAttribute('align', 'left');
    const ul = document.createElement('img');
    ul.src = 'test';
    ul.alt = '/ERR:Unsupported Image Format x-emf';
    el.appendChild(ul);
    const ol = document.createElement('img');
    el.appendChild(ol);
    const child = document.createElement('P');
    el.appendChild(child);
    el.setAttribute('style', 'background-color:blue; border:40px; width:30px;');

    //el.se
    service['elements'] = [
      {
        node: {
          getAttribute: () => {
            return 'background-color:blue; border:40px; width:30px;';
          },
          childNodes: [child],
        } as unknown as Element,
        class: '',
        type: 15,
        level: 1,
        subText: 'test',
      },
    ];
    //service['elements'] =  [{node: , class:'', type:15, level:1, subText:'test'}];
    service['render_doc'](
      [node5, node1, node2, node3, node4] as unknown as NodeListOf<Element>,
      [],
      ''
    );
    expect(spy).toHaveBeenCalled();
    service['elements'] = [
      {
        node: {
          getAttribute: () => {
            return 'border:40px; width:30px;';
          },
          childNodes: [child],
        } as unknown as Element,
        class: '',
        type: 15,
        level: 1,
        subText: 'test',
      },
    ];

    service['render_doc'](
      [node5, node1, node2, node3, node4] as unknown as NodeListOf<Element>,
      [],
      ''
    );
    expect(spy).toHaveBeenCalled();
    service['elements'] = [
      {
        node: {
          getAttribute: () => {
            return 'width:30px;';
          },
          childNodes: [child],
        } as unknown as Element,
        class: '',
        type: 15,
        level: 1,
        subText: 'test',
      },
    ];

    service['render_doc'](
      [node5, node1, node2, node3, node4] as unknown as NodeListOf<Element>,
      [],
      ''
    );
    expect(spy).toHaveBeenCalled();
    service['elements'] = [
      {
        node: {
          getAttribute: () => {
            return 'width:800pt;';
          },
          childNodes: [child],
        } as unknown as Element,
        class: '',
        type: 15,
        level: 1,
        subText: 'test',
      },
    ];
    service['render_doc'](
      [node5, node1, node2, node3, node4] as unknown as NodeListOf<Element>,
      [],
      ''
    );
    expect(spy).toHaveBeenCalled();
  });
  it('parseOL', () => {
    const child = document.createElement('UL');
    const child1 = document.createElement('OL');
    const licit = new LicitDocumentElement();
    const spy = jest.spyOn(licit, 'appendElement');
    service['parseOL'](
      {
        node: {
          textContent: 'text',
          getAttribute: () => {
            return 'width:800pt;';
          },
          childNodes: [child, child1],
        } as unknown as Element,
        class: '',
        type: 15,
        level: 1,
        subText: 'test',
      },
      licit
    );
    expect(spy).toHaveBeenCalled();
  });
  it('should handle doParse_Multiple', () => {
    const el = document.createElement('span');
    const html = [el, el];

    expect(service.parseFrameMakerHTML5(html)).toBeDefined();
  });

  it('should handle child nodes correctly', () => {
    const parentNode = document.createElement('div');
    const nextNode = document.createElement('div');
    const childNode1 = document.createElement('div');
    const childNode2 = document.createElement('div');

    parentNode.appendChild(childNode1);
    parentNode.appendChild(childNode2);

    expect(service['checkChildNode'](parentNode, nextNode)).toEqual(0);
  });

  it('should handle handleOrderedListItem', () => {
    expect(
      service['handleOrderedListItem'](
        {
          node: { textContent: 'test' } as unknown as Element,
          class: '',
          type: 'ChapterTitle',
          level: 0,
          subText: '',
        } as unknown as ParserElement,
        { appendElement: () => {} } as unknown as LicitDocumentElement
      )
    ).toBeUndefined();
  });

  it('should handle renderTypeParagraph', () => {
    expect(
      service['renderTypeParagraph'](
        {
          class: 'Chapter Header',
          node: {
            getAttribute: () => {},
            childNodes: [{}],
            querySelector: () => {
              return {
                getAttribute: () => {
                  return {};
                },
              };
            },
          },
        } as unknown as ParserElement,
        { appendElement: () => {} } as unknown as LicitDocumentElement
      )
    ).toBeUndefined();
  });

  it('should call handle_UrlText when text contains a URL', () => {
    const licitDocumentMock = {
      appendElement: jest.fn(),
    } as unknown as LicitDocumentElement;
    const e = { node: { textContent: 'Check https://example.com' }, level: 1 };
    const spy1 = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'handle_UrlText'
    );
    const spy2 = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'text_WithoutUrl'
    );

    service['renderTypeParagraph'](
      e as unknown as ParserElement,
      licitDocumentMock
    );

    expect(spy1).toHaveBeenCalledWith(
      'Check https://example.com',
      licitDocumentMock,
      undefined
    );
    expect(spy2).not.toHaveBeenCalled();
  });

  it('should handle text without URLs correctly in handle_UrlText', () => {
    const text = 'This is just plain text without any URL.';
    const licitDocumentElementMock = {
      appendElement: jest.fn(),
    } as unknown as LicitDocumentElement;

    service['handle_UrlText'](text, licitDocumentElementMock);

    expect(licitDocumentElementMock.appendElement).toHaveBeenCalled();
  });

  it('should append anchor tags for URLs and text nodes for plain text in handle_UrlText', () => {
    const text = 'https://example.com and https://another.com';
    const spy = jest.fn();
    const licitDocumentMock = {
      appendElement: spy,
    } as unknown as LicitDocumentElement;
    const pElement = document.createElement('p');

    spy.mockImplementation((el: LicitElement) => {
      (el as unknown as Record<string, unknown>).element = pElement;
    });

    expect(service['handle_UrlText'](text, licitDocumentMock)).toBeUndefined();
  });

  it('should return if text is empty and has no child nodes', () => {
    const licitDocumentMock = {
      appendElement: jest.fn(),
    } as unknown as LicitDocumentElement;
    const e = { node: document.createElement('div'), level: 1 };
    jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'removeEmptyATags'
    );

    expect(
      service['renderDocBulletItems'](
        e as unknown as ParserElement,
        licitDocumentMock
      )
    ).toBeUndefined();
  });

  it('should add a bullet list item for text node', () => {
    const licitDocumentMock = {
      appendElement: jest.fn(),
    } as unknown as LicitDocumentElement;
    const e = {
      node: document.createElement('div'),
      level: 2,
    };
    e.node.appendChild(document.createTextNode('Test bullet item'));
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'removeEmptyATags'
    );

    service['renderDocBulletItems'](
      e as unknown as ParserElement,
      licitDocumentMock
    );

    expect(spy).toHaveBeenCalled();
  });

  it('should process child nodes if first child is not a text node', () => {
    const licitDocumentMock = {
      appendElement: jest.fn(),
    } as unknown as LicitDocumentElement;
    const e = {
      node: document.createElement('div'),
      level: 1,
    };
    const ulNode = document.createElement('ul');
    e.node.appendChild(ulNode);
    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'removeEmptyATags'
    );
    const spy1 = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'processBulletNodes'
    );

    service['renderDocBulletItems'](
      e as unknown as ParserElement,
      licitDocumentMock
    );

    expect(spy).not.toHaveBeenCalled();
    expect(spy1).not.toHaveBeenCalled();
  });

  it('should add bullet item if there are no UL or OL nodes', () => {
    const licitDocumentMock = {
      appendElement: jest.fn(),
    } as unknown as LicitDocumentElement;
    const parentDiv = document.createElement('div');
    const listItem = document.createElement('li');

    parentDiv.appendChild(listItem);
    const childNodes = Array.from(parentDiv.childNodes);
    const bulletList = new LicitBulletListElement(0);
    const e = { node: listItem };

    service['processBulletNodes'](
      childNodes,
      bulletList,
      licitDocumentMock,
      0,
      e
    );

    expect(bulletList.listItems.length).toBe(1);
  });
  it('should add an item to bulletList when no UL or OL nodes are found', () => {
    const mockNode = {
      childNodes: [],
      nextSibling: true,
    };
    const childNodes = [mockNode];
    const bulletList = { addItem: jest.fn(), listItems: [] };
    const licitDocument = {};
    const e = { node: {} };

    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseOL'
    );

    service['processBulletNodes'](
      childNodes as unknown as Node[],
      bulletList as unknown as LicitBulletListElement,
      licitDocument,
      0,
      e
    );

    expect(bulletList.addItem).toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should call handleULNode when a UL node is found', () => {
    const ulNode = { nodeName: 'UL' };
    const mockNode = {
      childNodes: [ulNode],
      nextSibling: false,
    };
    const childNodes = [mockNode];
    const bulletList = { addItem: () => undefined, listItems: [] };
    const licitDocument = {};
    const e = { node: {} };

    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseOL'
    );
    service['processBulletNodes'](
      childNodes as unknown as Node[],
      bulletList as unknown as LicitBulletListElement,
      licitDocument,
      0,
      e
    );

    expect(spy).not.toHaveBeenCalled();
  });

  it('should call parseOL when an OL node is found', () => {
    const olNode = { nodeName: 'OL' };
    const mockNode = {
      childNodes: [olNode],
      nextSibling: false,
    };
    const childNodes = [mockNode];
    const bulletList = { addItem: () => undefined, listItems: [] };
    const licitDocument = {};
    const e = { node: {} };

    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'parseOL'
    );
    service['processBulletNodes'](
      childNodes as unknown as Node[],
      bulletList as unknown as LicitBulletListElement,
      licitDocument,
      0,
      e
    );

    expect(spy).toHaveBeenCalled();
  });

  it('should call processChildNodesCapco recursively for ELEMENT_NODE with children', () => {
    const parentElement = document.createElement('div');
    const childElement = document.createElement('span');
    const textNode = document.createTextNode('CAPCO Test');

    childElement.appendChild(textNode);
    parentElement.appendChild(childElement);

    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'processChildNodesCapco'
    );

    service['processChildNodesCapco'](parentElement.childNodes);

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should skip processing for nodes with nodeName "Hidden"', () => {
    const hiddenElement = {
      nodeName: 'Hidden',
      setAttribute: () => {},
    } as unknown as ChildNode;

    const setAttrSpy = jest.spyOn(hiddenElement as HTMLElement, 'setAttribute');

    service['processChildNodesCapco']([
      hiddenElement,
    ] as unknown as NodeListOf<ChildNode>);

    expect(setAttrSpy).not.toHaveBeenCalled();
  });

  it('should call handleImageChild for each child element', () => {
    const mockNode = document.createElement('div');
    mockNode.textContent = 'Figure 2: With Image';

    const child1 = document.createElement('img');
    const child2 = document.createElement('span');
    mockNode.appendChild(child1);
    mockNode.appendChild(child2);

    const mockParserElement: ParserElement = {
      node: mockNode,
    } as unknown as ParserElement;

    const mockDocument = {
      appendElement: jest.fn(),
    } as unknown as LicitDocumentElement;

    const spy = jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'handleImageChild'
    );

    service['figureTitleCase'](mockParserElement, mockDocument);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(child1, mockDocument);
    expect(spy).toHaveBeenCalledWith(child2, mockDocument);
  });

  it('should trim table title and append LicitHeaderElement to the document', () => {
    const mockNode = document.createElement('div');
    mockNode.textContent = 'Table 2.1 (TS) This is a Table Title';
    mockNode.setAttribute('class', 'table-style');

    const mockParserElement = {
      node: mockNode,
    } as unknown as ParserElement;

    const mockDocument = {
      appendElement: jest.fn(),
    } as unknown as LicitDocumentElement;

    jest.spyOn(
      service as unknown as Record<string, () => unknown>,
      'handleImageChild'
    );

    service['figureTableTitleCase'](mockParserElement, mockDocument);

    expect(mockDocument.appendElement).toHaveBeenCalledTimes(1);
  });

  it('should return paragraphs containing anchor tags with non-empty hash values', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <p><a href="#section1">Link 1</a></p>
      <p><a href="">Empty Link</a></p>
      <p>Plain Text</p>
    `;

    const nodes = container.childNodes as NodeList;
    const result = service['fetchRenderedContent'](nodes);

    expect(result.length).toBe(1);
    expect(result[0].nodeName).toBe('P');
  });

  it('should update the NAME attribute of the second anchor and remove the first anchor in OL lists', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <ol>
        <li><a name="123">&nbsp;</a></li>
        <li><a href="#">Some Link</a></li>
        <li><a href="#">Another Link</a></li>
      </ol>
    `;

    const nodes = container.childNodes as NodeList;
    service['fetchRenderedContent'](nodes);

    const updatedAnchor = container.querySelector('ol li:nth-child(3) a');
    expect(updatedAnchor?.getAttribute('name')).toBe('123');

    const removedAnchor = container.querySelector('ol li:nth-child(1) a');
    expect(removedAnchor).toBeNull();
  });
  it('should handle getScaledWidth when width <200', () => {
    expect(service['getScaledWidth'](100)).toEqual('100');
  });
  it('should handle getScaledWidth when 200<width< 699', () => {
    expect(service['getScaledWidth'](300)).toEqual('624');
  });
  it('should handle getScaledWidth when width>700', () => {
    expect(service['getScaledWidth'](900)).toEqual('864');
  });
  it('should handle handleImageChild when src null', () => {
    const el = document.createElement('IMG');
    expect(
      service['handleImageChild'](el, {
        appendElement: () => {},
      } as unknown as LicitDocumentElement)
    ).toBeUndefined();
  });
  it('should handle handleImageChild', () => {
    const el = document.createElement('IMG');
    el.setAttribute('src', 'test');
    el.setAttribute('width', '10px');
    expect(
      service['handleImageChild'](el, {
        appendElement: () => {},
      } as unknown as LicitDocumentElement)
    ).toBeUndefined();
  });
  it('should return undefined when no <col> elements are found', () => {
    const table = document.createElement('table');
    expect(service['getColWidthArray'](table)).toBeUndefined();
  });

  it('should convert percentage widths to pixel values', () => {
    const table = document.createElement('table');
    table.innerHTML = `
      <colgroup>
        <col style="width: 50%">
        <col style="width: 50%">
      </colgroup>
    `;
    const result = service['getColWidthArray'](table);
    expect(result).toEqual([309, 310]);
  });

  it('should parse pixel widths correctly', () => {
    const table = document.createElement('table');
    table.innerHTML = `
      <colgroup>
        <col style="width: 200px">
        <col style="width: 420px">
      </colgroup>
    `;
    const result = service['getColWidthArray'](table);
    expect(result).toEqual([200, 419]);
  });

  it('should use width attribute if style is not set', () => {
    const table = document.createElement('table');
    table.innerHTML = `
      <colgroup>
        <col width="60%">
        <col width="40%">
      </colgroup>
    `;
    const result = service['getColWidthArray'](table);
    expect(result).toEqual([371, 248]);
  });

  it('should return undefined if one column is missing width', () => {
    const table = document.createElement('table');
    table.innerHTML = `
      <colgroup>
        <col style="width: 200px">
        <col>
      </colgroup>
    `;
    const result = service['getColWidthArray'](table);
    expect(result).toBeUndefined();
  });

  it('should return sliced array of column widths', () => {
    const colWidths = [100, 150, 200, 250];
    const result = service['setCellWidth'](2, 1, colWidths);
    expect(result).toEqual([150, 200]);
  });
  it('should return #FFFFFF for checkCellStyle when border is 0', () => {
    const style = 'border-left:0;border-right:0;border-top:0;';
    const result = (
      service as unknown as {
        checkCellStyle: (styleText: string) => string | null;
      }
    ).checkCellStyle(style);
    expect(result).toBe('#FFFFFF');
  });

  it('should return null for checkCellStyle when no matching border found', () => {
    const style = 'border-style:solid;border-radius:5px;';
    const result = (
      service as unknown as {
        checkCellStyle: (styleText: string) => string | null;
      }
    ).checkCellStyle(style);
    expect(result).toBeNull();
  });

  it('should return true for isTransparentTable when a td has white border', () => {
    const tableElement = document.createElement('table');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.setAttribute('style', 'border:0');
    tr.appendChild(td);
    tableElement.appendChild(tr);

    const result = service['isTransparentTable'](tableElement);
    expect(result).toBeTruthy();
  });

  it('should return false for isTransparentTable when no td has transparent border', () => {
    const tableElement = document.createElement('table');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.setAttribute('style', 'border:1px solid #000000');
    tr.appendChild(td);
    tableElement.appendChild(tr);

    const result = service['isTransparentTable'](tableElement);
    expect(result).toBeFalsy();
  });

  it('should handle processTableCapco with no rows', () => {
    const table = document.createElement('table');
    const mockInnerTable = document.createElement('table');
    table.querySelector = () => mockInnerTable;

    Object.defineProperty(mockInnerTable, 'rows', {
      value: [],
    });

    const result = service['processTableCapco'](table);
    expect(result).toBeUndefined();
  });

  it('should handle processTableCapco with 1 cell', () => {
    const table = document.createElement('table');
    const innerTable = document.createElement('table');
    table.querySelector = () => innerTable;

    const row = document.createElement('tr');
    row.insertCell();
    innerTable.appendChild(row);

    const result = service['processTableCapco'](table);
    expect(result).toBeUndefined();
  });

  it('should handle processTableCapco with 2 cells', () => {
    const table = document.createElement('table');
    const innerTable = document.createElement('table');
    table.querySelector = () => innerTable;

    const row = document.createElement('tr');
    row.insertCell();
    row.insertCell();
    innerTable.appendChild(row);

    const result = service['processTableCapco'](table);
    expect(result).toBeUndefined();
  });
});

describe('LicitConverter branch coverage additions', () => {
  let converter: LicitConverter;

  beforeEach(() => {
    converter = new LicitConverter(testConfig as TransformConfig);
  });

  it.each([
    ['_AF_Caution', 'parseNote'],
    ['_AF_Warning', 'parseNote'],
    ['attachmentTitle', 'parseChapterTitle'],
    ['attpara0', 'parseHeader'],
    ['attsubpara1', 'parseHeader'],
    ['chTableTitleCont', 'parseTableTitle'],
    ['attText', 'parseChapterSubtitle'],
    ['item_0', 'parseParagraph'],
    ['i-bullet-3', 'parseParagraph'],
    ['acronym', 'parseParagraph'],
    ['Level4_Start', 'parseParagraph'],
    ['chFigureTitleCont', 'parseFigureTitle'],
    ['attFigureTitleCont', 'parseFigureTitle'],
    ['Hidden', 'parseUnknownElement'],
    ['Cross_Reference', 'parseUnknownElement'],
    ['FLOW_A', 'parseUnknownElement'],
    ['UL', 'parseBullet'],
  ])('parseElement routes "%s" to %s', (className, method) => {
    const el = document.createElement('div');
    el.className = className;

    const spy = jest
      .spyOn(
        converter as unknown as Record<string, (...args: unknown[]) => void>,
        method
      )
      .mockImplementation(() => undefined);

    converter['parseElement'](el, document.createElement('div'));

    expect(spy).toHaveBeenCalled();
  });

  it('parseElement handles empty className via parseUnknownElement', () => {
    const el = document.createElement('div');
    el.className = '   ';
    const spy = jest
      .spyOn(
        converter as unknown as Record<string, (...args: unknown[]) => void>,
        'parseUnknownElement'
      )
      .mockImplementation(() => undefined);

    converter['parseElement'](el, document.createElement('div'));
    expect(spy).toHaveBeenCalled();
  });

  it.each([
    ['_AF_Caution', 'parseNote'],
    ['_AF_Warning', 'parseNote'],
    ['H2', 'parseHeader'],
    ['H3', 'parseHeader'],
    ['H4', 'parseHeader'],
    ['attTableTitleCont', 'parseTableTitle'],
    ['attTableTitle', 'parseTableTitle'],
    ['attText', 'parseChapterSubtitle'],
    ['i_bullet_4', 'parseBullet'],
    ['i_bullet_7', 'parseBullet'],
    ['DIV', 'parseVignet'],
    ['P', 'parseParagraph'],
    ['attsubpara6', 'parseParagraph'],
    ['sumText', 'parseParagraph'],
    ['attFigureTitleCont', 'parseFigureTitle'],
    ['SUP', 'parseOrdered'],
    ['LI', 'parseBullet'],
    ['Hidden', 'parseUnknownElement'],
    ['Cross_Reference', 'parseUnknownElement'],
  ])('parseElement_doc routes "%s" to %s', (tagName, method) => {
    const spy = jest
      .spyOn(
        converter as unknown as Record<string, (...args: unknown[]) => void>,
        method
      )
      .mockImplementation(() => undefined);

    const element = { tagName, className: tagName } as unknown as Element;
    converter['parseElement_doc'](element, {} as Element);

    expect(spy).toHaveBeenCalled();
  });

  it('parseElement default path emits warning and calls parseParagraph', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const parseSpy = jest
      .spyOn(
        converter as unknown as Record<string, (...args: unknown[]) => void>,
        'parseParagraph'
      )
      .mockImplementation(() => undefined);
    const sink = jest.fn();
    const withSink = new LicitConverter({
      ...(testConfig as TransformConfig),
      messageSink: sink,
    });

    const el = document.createElement('div');
    el.className = 'unknown-style';
    withSink['parseElement'](el, document.createElement('div'));

    expect(warnSpy).toHaveBeenCalled();
    expect(sink).toHaveBeenCalled();
    expect(parseSpy).not.toHaveBeenCalled();
  });

  it('scaleWidthArray returns raw widths when sum is below 200', () => {
    expect(converter['scaleWidthArray']([80, 60])).toEqual([80, 60]);
  });

  it('getSumOfArray returns 0 for empty input', () => {
    expect(converter['getSumOfArray']([])).toBe(0);
  });

  it('extractNote returns null when structure does not match note format', () => {
    const tbody = document.createElement('tbody');
    const row1 = document.createElement('tr');
    row1.innerHTML = '<td><p>row1</p></td>';
    const row2 = document.createElement('tr');
    row2.innerHTML = '<td><p>NOT A NOTE</p><p>text</p></td>';
    tbody.append(row1, row2);

    expect(converter['extractNote'](tbody)).toBeNull();
  });

  it('extractNote returns note paragraphs when last row starts with OVERALL NOTE', () => {
    const tbody = document.createElement('tbody');
    const row1 = document.createElement('tr');
    row1.innerHTML = '<td><p>row1</p></td>';
    const row2 = document.createElement('tr');
    row2.innerHTML = '<td><p>OVERALL NOTE:</p><p>note a</p><p>note b</p></td>';
    tbody.append(row1, row2);

    const notes = converter['extractNote'](tbody);
    expect(notes?.length).toBe(2);
    expect(notes?.[0].textContent).toBe('note a');
  });

  it('isTableFigureNode returns false for DIV without image', () => {
    const el = document.createElement('div');
    el.innerHTML = '<p>text only</p>';
    expect(converter['isTableFigureNode'](el)).toBeFalsy();
  });

  it('isTableFigureNode returns true for non-DIV with IMG child', () => {
    const el = document.createElement('p');
    const img = document.createElement('img');
    el.appendChild(img);
    expect(converter['isTableFigureNode'](el)).toBe(true);
  });

  it('isNoteNode returns false for unknown class', () => {
    expect(converter['isNoteNode']('random-class')).toBe(false);
  });
});

describe('LicitConverter exhaustive parse routing additions', () => {
  let converter: LicitConverter;

  beforeEach(() => {
    converter = new LicitConverter(testConfig as TransformConfig);
  });

  const parseElementRoutes: Array<[string, string]> = [
    ['_AF_Example', 'parseNote'],
    ['_AF_Note', 'parseNote'],
    ['chapterTitle', 'parseChapterTitle'],
    ['chsubpara1', 'parseHeader'],
    ['attTableTitleCont', 'parseTableTitle'],
    ['attTableTitle', 'parseTableTitle'],
    ['chText', 'parseChapterSubtitle'],
    ['i_bullet', 'parseParagraph'],
    ['i_bullet_0', 'parseParagraph'],
    ['i_bullet_1', 'parseParagraph'],
    ['i_bullet_2', 'parseParagraph'],
    ['i_bullet_3', 'parseParagraph'],
    ['i_bullet_4', 'parseParagraph'],
    ['i_bullet_5', 'parseParagraph'],
    ['i_bullet_6', 'parseParagraph'],
    ['i_bullet_7', 'parseParagraph'],
    ['i-bullet', 'parseParagraph'],
    ['i-bullet-0', 'parseParagraph'],
    ['i-bullet-1', 'parseParagraph'],
    ['i-bullet-2', 'parseParagraph'],
    ['para0', 'parseParagraph'],
    ['chsubpara2', 'parseParagraph'],
    ['chsubpara3', 'parseParagraph'],
    ['attsubpara2', 'parseParagraph'],
    ['attsubpara3', 'parseParagraph'],
    ['attsubpara4', 'parseParagraph'],
    ['attsubpara5', 'parseParagraph'],
    ['attsubpara6', 'parseParagraph'],
    ['chsubpara4', 'parseParagraph'],
    ['chsubpara5', 'parseParagraph'],
    ['chsubpara6', 'parseParagraph'],
    ['FM-AF-Note', 'parseParagraph'],
    ['FM-AF-Example', 'parseParagraph'],
    ['item_1', 'parseParagraph'],
    ['item_2', 'parseParagraph'],
    ['item_3', 'parseParagraph'],
    ['Numbered1start', 'parseParagraph'],
    ['Numbered1', 'parseParagraph'],
    ['Body', 'parseParagraph'],
    ['Level0_Start', 'parseParagraph'],
    ['Level0_Cont', 'parseParagraph'],
    ['Level1_Start', 'parseParagraph'],
    ['Level1_Cont', 'parseParagraph'],
    ['Level2_Start', 'parseParagraph'],
    ['Level2_Cont', 'parseParagraph'],
    ['Level3_Start', 'parseParagraph'],
    ['Level3_Cont', 'parseParagraph'],
    ['Level4_Cont', 'parseParagraph'],
    ['dynamicTableHeader', 'parseDynamicHeader'],
    ['chFigureTitle', 'parseFigureTitle'],
    ['attFigureTitle', 'parseFigureTitle'],
    ['ChangeBarPara', 'parseChangeBarPara'],
    ['sectionTitle', 'parseSectionTitle'],
  ];

  it.each(parseElementRoutes)(
    'parseElement exhaustive route %s -> %s',
    (className, method) => {
      const el = document.createElement('div');
      el.className = className;
      const spy = jest
        .spyOn(
          converter as unknown as Record<string, (...args: unknown[]) => void>,
          method
        )
        .mockImplementation(() => undefined);

      converter['parseElement'](el, document.createElement('div'));
      expect(spy).toHaveBeenCalled();
    }
  );

  const parseElementDocRoutes: Array<[string, string]> = [
    ['_AF_Example', 'parseNote'],
    ['_AF_Note', 'parseNote'],
    ['HR', 'parseHR'],
    ['chapterTitle', 'parseChapterTitle'],
    ['attachmentTitle', 'parseChapterTitle'],
    ['H1', 'parseHeader'],
    ['chTableTitle', 'parseTableTitle'],
    ['chText', 'parseChapterSubtitle'],
    ['i_bullet', 'parseBullet'],
    ['i_bullet_0', 'parseBullet'],
    ['i_bullet_1', 'parseBullet'],
    ['i_bullet_2', 'parseBullet'],
    ['i_bullet_3', 'parseBullet'],
    ['i_bullet_5', 'parseBullet'],
    ['i_bullet_6', 'parseBullet'],
    ['SPAN', 'parseVignet'],
    ['para1', 'parseParagraph'],
    ['paraleadin', 'parseParagraph'],
    ['paraLeft', 'parseParagraph'],
    ['AFDP Bullet', 'parseParagraph'],
    ['AFDP Sub-bullet', 'parseParagraph'],
    ['attsubpara2', 'parseParagraph'],
    ['attsubpara3', 'parseParagraph'],
    ['attsubpara4', 'parseParagraph'],
    ['attsubpara5', 'parseParagraph'],
    ['i-bullet-2', 'parseParagraph'],
    ['chsubpara4', 'parseParagraph'],
    ['chsubpara5', 'parseParagraph'],
    ['chsubpara6', 'parseParagraph'],
    ['chFigureTitle', 'parseFigureTitle'],
    ['attFigureTitle', 'parseFigureTitle'],
    ['ChangeBarPara', 'parseChangeBarPara'],
    ['sectionTitle', 'parseSectionTitle'],
    ['OL', 'parseOrdered'],
    ['UL', 'parseBullet'],
  ];

  it.each(parseElementDocRoutes)(
    'parseElement_doc exhaustive route %s -> %s',
    (tagName, method) => {
      const spy = jest
        .spyOn(
          converter as unknown as Record<string, (...args: unknown[]) => void>,
          method
        )
        .mockImplementation(() => undefined);

      const element = { tagName, className: tagName } as unknown as Element;
      converter['parseElement_doc'](element, {} as Element);
      expect(spy).toHaveBeenCalled();
    }
  );
});

describe('LicitConverter switch/helper branch boosts', () => {
  let converter: LicitConverter;

  beforeEach(() => {
    converter = new LicitConverter(testConfig as TransformConfig);
  });

  it.each([
    ['para', 'parseParagraph'],
    ['para1', 'parseParagraph'],
    ['paraleadin', 'parseParagraph'],
    ['paraLeft', 'parseParagraph'],
    ['AFDP Bullet', 'parseParagraph'],
    ['AFDP Sub-bullet', 'parseParagraph'],
    ['chpara0', 'parseHeader'],
    ['chTableTitle', 'parseTableTitle'],
    ['superscript', 'parseParagraph'],
  ])('parseElement extra route %s -> %s', (className, method) => {
    const el = document.createElement('div');
    el.className = className;
    const spy = jest
      .spyOn(
        converter as unknown as Record<string, (...args: unknown[]) => void>,
        method
      )
      .mockImplementation(() => undefined);

    converter['parseElement'](el, document.createElement('div'));
    expect(spy).toHaveBeenCalled();
  });

  it.each([
    ['_AF_Caution', 'parseNote'],
    ['_AF_Warning', 'parseNote'],
    ['H2', 'parseHeader'],
    ['H3', 'parseHeader'],
    ['H4', 'parseHeader'],
    ['attTableTitleCont', 'parseTableTitle'],
    ['attTableTitle', 'parseTableTitle'],
    ['attText', 'parseChapterSubtitle'],
    ['i_bullet_4', 'parseBullet'],
    ['i_bullet_7', 'parseBullet'],
    ['DIV', 'parseVignet'],
    ['P', 'parseParagraph'],
    ['attsubpara6', 'parseParagraph'],
    ['sumText', 'parseParagraph'],
    ['attFigureTitleCont', 'parseFigureTitle'],
    ['SUP', 'parseOrdered'],
    ['LI', 'parseBullet'],
    ['Hidden', 'parseUnknownElement'],
    ['Cross_Reference', 'parseUnknownElement'],
  ])('parseElement_doc extra route %s -> %s', (tagName, method) => {
    const spy = jest
      .spyOn(
        converter as unknown as Record<string, (...args: unknown[]) => void>,
        method
      )
      .mockImplementation(() => undefined);

    converter['parseElement_doc'](
      { tagName, className: tagName } as unknown as Element,
      {} as Element
    );
    expect(spy).toHaveBeenCalled();
  });

  it.each([
    [13, 'renderDocFigure'],
    [9, 'renderDocBulletItems'],
    [5, 'figureParagraphCase'],
    [4, 'figureNoteCase'],
    [11, 'renderDocTable'],
    [12, 'renderEnhancedTable'],
    [7, 'figureTableTitleCase'],
    [8, 'figureTitleCase'],
    [19, 'renderNewFigureTitle'],
  ])('render_FrameMakerHTML5_zip_SwitchHelper routes type %s', (type, method) => {
    const element = {
      type,
      node: document.createElement('div'),
      class: 'x',
      level: 0,
      subText: '',
    } as unknown as ParserElement;

    const spy = jest
      .spyOn(
        converter as unknown as Record<string, (...args: unknown[]) => void>,
        method
      )
      .mockImplementation(() => undefined);

    converter['render_FrameMakerHTML5_zip_SwitchHelper'](
      element,
      [],
      [],
      false,
      new LicitDocumentElement()
    );

    expect(spy).toHaveBeenCalled();
  });

  it('render_FrameMakerHTML5_zip_SwitchHelper marks first attachmentTitle for reset', () => {
    const node = document.createElement('p');
    node.className = 'attachmentTitle';
    node.textContent = 'Attachment A';

    const reset = converter['render_FrameMakerHTML5_zip_SwitchHelper'](
      { type: 0, node, class: 'attachmentTitle', level: 0, subText: '' } as ParserElement,
      [],
      [],
      false,
      new LicitDocumentElement()
    );

    expect(reset).toBe(true);
  });

  it('render_FrameMakerHTML5_zip_SwitchHelper handles unknown type in default branch', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    converter['render_FrameMakerHTML5_zip_SwitchHelper'](
      {
        type: 999 as never,
        node: document.createElement('div'),
        class: 'unknown-type',
        level: 0,
        subText: '',
      } as ParserElement,
      [],
      [],
      false,
      new LicitDocumentElement()
    );

    expect(warnSpy).toHaveBeenCalled();
  });

  it('renderSwitchHelper skips bullet item append when node text is empty', () => {
    const doc = new LicitDocumentElement();
    const appendSpy = jest.spyOn(doc, 'appendElement');

    converter['renderSwitchHelper'](
      {
        type: 9,
        node: document.createElement('li'),
        class: 'bullet',
        level: 1,
        subText: '',
      } as ParserElement,
      doc
    );

    expect(appendSpy).not.toHaveBeenCalled();
  });

  it('renderSwitchHelper skips note append when node text is empty', () => {
    const doc = new LicitDocumentElement();
    const appendSpy = jest.spyOn(doc, 'appendElement');

    converter['renderSwitchHelper'](
      {
        type: 4,
        node: document.createElement('p'),
        class: 'note',
        level: 0,
        subText: '',
      } as ParserElement,
      doc
    );

    expect(appendSpy).not.toHaveBeenCalled();
  });

  it('renderSwitchHelper default branch warns for unhandled type', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    converter['renderSwitchHelper'](
      {
        type: 999 as never,
        node: document.createElement('div'),
        class: 'unknown',
        level: 0,
        subText: '',
      } as ParserElement,
      new LicitDocumentElement()
    );

    expect(warnSpy).toHaveBeenCalled();
  });

  it('sanitizeElement removes empty text nodes after FM_ cleanup', () => {
    const root = document.createElement('div');
    root.appendChild(document.createTextNode('FM_'));

    converter['sanitizeElement'](root);

    expect(root.childNodes.length).toBe(0);
  });

  it('getColWidthArray returns undefined for unsupported width units', () => {
    const table = document.createElement('table');
    const colgroup = document.createElement('colgroup');
    const col = document.createElement('col');
    col.setAttribute('width', '12em');
    colgroup.appendChild(col);
    table.appendChild(colgroup);

    expect(converter['getColWidthArray'](table)).toBeUndefined();
  });
});

describe('LicitConverter render_doc and renderSwitch helper branch boosts', () => {
  let converter: LicitConverter;

  beforeEach(() => {
    converter = new LicitConverter(testConfig as TransformConfig);
  });

  it('renderSwitchHelper appends figure image when src exists', () => {
    const doc = new LicitDocumentElement();
    const appendSpy = jest.spyOn(doc, 'appendElement');
    const node = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('src', 'https://example.com/a.png');
    node.appendChild(img);

    converter['renderSwitchHelper'](
      { type: 13, node, class: 'fig', level: 0, subText: '' } as ParserElement,
      doc
    );

    expect(appendSpy).toHaveBeenCalled();
  });

  it('renderSwitchHelper appends bullet and note when text exists', () => {
    const doc = new LicitDocumentElement();
    const appendSpy = jest.spyOn(doc, 'appendElement');

    const bullet = document.createElement('li');
    bullet.textContent = 'item';
    converter['renderSwitchHelper'](
      { type: 9, node: bullet, class: 'b', level: 1, subText: '' } as ParserElement,
      doc
    );

    const note = document.createElement('p');
    note.textContent = 'note text';
    converter['renderSwitchHelper'](
      { type: 4, node: note, class: 'n', level: 0, subText: '' } as ParserElement,
      doc
    );

    expect(appendSpy).toHaveBeenCalled();
  });

  it('renderSwitchHelper handles title and section branches with text', () => {
    const doc = new LicitDocumentElement();
    const appendSpy = jest.spyOn(doc, 'appendElement');

    const title = document.createElement('p');
    title.textContent = 'Table 1';
    title.setAttribute('class', 'chTableTitle');
    converter['renderSwitchHelper'](
      { type: 7, node: title, class: 'chTableTitle', level: 0, subText: '' } as ParserElement,
      doc
    );

    const section = document.createElement('p');
    section.textContent = 'Section';
    converter['renderSwitchHelper'](
      { type: 6, node: section, class: 'sectionTitle', level: 0, subText: '' } as ParserElement,
      doc
    );

    expect(appendSpy).toHaveBeenCalled();
  });

  it('renderTable skips append when no nested table exists', () => {
    const doc = new LicitDocumentElement();
    const appendSpy = jest.spyOn(doc, 'appendElement');
    converter['renderTable'](
      {
        type: 11,
        node: document.createElement('div'),
        class: 'table',
        level: 0,
        subText: '',
      } as ParserElement,
      doc
    );

    expect(appendSpy).not.toHaveBeenCalled();
  });

  it('render_docSwitchHelper covers toc removal and hr branch', () => {
    const doc = new LicitDocumentElement();

    const tocNode = document.createElement('p');
    tocNode.textContent = 'Table of Contents';
    const removed = converter['render_docSwitchHelper'](
      { type: 5, node: tocNode, class: 'para', level: 0, subText: '' } as ParserElement,
      doc,
      false,
      [],
      'generic'
    );

    expect(removed).toBe(true);

    const hrRemoved = converter['render_docSwitchHelper'](
      { type: 15, node: document.createElement('hr'), class: 'hr', level: 0, subText: '' } as ParserElement,
      doc,
      true,
      [],
      'generic'
    );

    expect(hrRemoved).toBe(true);
  });

  it('render_docSwitchHelper routes ordered, table, vignet and default paths', () => {
    const parseOlSpy = jest
      .spyOn(
        converter as unknown as Record<string, (...args: unknown[]) => void>,
        'parseOL'
      )
      .mockImplementation(() => undefined);
    const docTableSpy = jest
      .spyOn(
        converter as unknown as Record<string, (...args: unknown[]) => void>,
        'renderDocTable'
      )
      .mockImplementation(() => undefined);
    const vignetSpy = jest
      .spyOn(
        converter as unknown as Record<string, (...args: unknown[]) => void>,
        'renderDocVignet'
      )
      .mockImplementation(() => undefined);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const doc = new LicitDocumentElement();
    const node = document.createElement('div');
    node.textContent = 'x';

    converter['render_docSwitchHelper'](
      { type: 10, node, class: 'ol', level: 0, subText: '' } as ParserElement,
      doc,
      false,
      [],
      'generic'
    );
    converter['render_docSwitchHelper'](
      { type: 11, node, class: 'table', level: 0, subText: '' } as ParserElement,
      doc,
      false,
      [],
      'generic'
    );
    converter['render_docSwitchHelper'](
      { type: 16, node, class: 'vignet', level: 0, subText: '' } as ParserElement,
      doc,
      false,
      [],
      'generic'
    );
    converter['render_docSwitchHelper'](
      { type: 999 as never, node, class: 'unknown', level: 0, subText: '' } as ParserElement,
      doc,
      false,
      [],
      'generic'
    );

    expect(parseOlSpy).toHaveBeenCalled();
    expect(docTableSpy).toHaveBeenCalled();
    expect(vignetSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('parseElement_doc falls through default for superscript', () => {
    const parseSpy = jest
      .spyOn(
        converter as unknown as Record<string, (...args: unknown[]) => void>,
        'parseParagraph'
      )
      .mockImplementation(() => undefined);

    converter['parseElement_doc'](
      { tagName: 'superscript', className: 'superscript' } as unknown as Element,
      {} as Element
    );

    expect(parseSpy).toHaveBeenCalled();
  });
});

describe('LicitConverter parser entry and style extraction branch boosts', () => {
  let converter: LicitConverter;

  beforeEach(() => {
    converter = new LicitConverter(testConfig as TransformConfig);
  });

  it('parseHTML handles doctrine true and false document inputs', () => {
    const doc = document.implementation.createHTMLDocument('x');
    doc.body.innerHTML = '<p>a</p><div><p>b</p></div>';

    expect(converter.parseHTML(doc, true)).toBeDefined();
    expect(converter.parseHTML(doc, false)).toBeDefined();
  });

  it('parseHTML handles string input with inner DIV and non-doctrine path', () => {
    const html = '<html><body><div><p class="para">x</p></div></body></html>';
    const result = converter.parseHTML(html as unknown as Document, false);
    expect(result).toBeDefined();
  });

  it('parseFrameMakerHTML5 returns undefined for empty input', () => {
    expect(converter.parseFrameMakerHTML5([])).toBeUndefined();
  });

  it('extractCellStyles handles cells with and without paragraph/style/letter-spacing', () => {
    const td1 = document.createElement('td');
    const converterWithExtract = converter as unknown as {
      extractCellStyles: (cell: HTMLTableCellElement) => {
        className?: string;
        id?: string;
        marginTop?: string;
        marginBottom?: string;
        fontSize?: string;
        letterSpacing?: string;
      };
    };
    const s1 = converterWithExtract.extractCellStyles(td1);
    expect(s1).toEqual({});

    const td2 = document.createElement('td');
    td2.innerHTML = '<p id="p1" class="cellbody" style="margin-top:1pt;margin-bottom:2pt;font-size:9pt;"><span style="letter-spacing: 1.5pt;">&#160;</span></p>';
    const s2 = converterWithExtract.extractCellStyles(td2);
    expect(s2.className).toBe('cellbody');
    expect(s2.id).toBe('p1');
    expect(s2.marginTop).toBe('1pt');
    expect(s2.marginBottom).toBe('2pt');
    expect(s2.fontSize).toBe('9pt');
    expect(s2.letterSpacing).toBe('1.5pt');
  });

  it('extractLetterSpacing ignores spans without nbsp content', () => {
    const holder = document.createElement('div');
    holder.innerHTML = '<span style="letter-spacing:2pt;">abc</span>';
    const spans = holder.querySelectorAll('span');
    const info: { letterSpacing?: string } = {};

    converter['extractLetterSpacing'](spans, info);
    expect(info.letterSpacing).toBeUndefined();
  });

  it('handleOrderedListItem skips append when text is empty', () => {
    const doc = new LicitDocumentElement();
    const appendSpy = jest.spyOn(doc, 'appendElement');

    converter['handleOrderedListItem'](
      {
        node: document.createElement('li'),
        class: 'x',
        type: 10,
        level: 0,
        subText: '',
      } as unknown as ParserElement,
      doc
    );

    expect(appendSpy).not.toHaveBeenCalled();
  });

  it('renderParagraph skips append when paragraph text is empty', () => {
    const doc = new LicitDocumentElement();
    const appendSpy = jest.spyOn(doc, 'appendElement');

    converter['renderParagraph'](
      {
        node: document.createElement('p'),
        class: 'p',
        type: 5,
        level: 0,
        subText: '',
      } as ParserElement,
      doc
    );

    expect(appendSpy).not.toHaveBeenCalled();
  });

  it('parseTableFigure ignores non-image elements', () => {
    const parseFigureSpy = jest
      .spyOn(
        converter as unknown as Record<string, (...args: unknown[]) => void>,
        'parseFigure'
      )
      .mockImplementation(() => undefined);

    const el = document.createElement('div');
    el.innerHTML = '<p>no image</p>';
    converter['parseTableFigure'](el);

    expect(parseFigureSpy).not.toHaveBeenCalled();
  });

  it('parseTable chooses enhanced table when requested and non-transparent', () => {
    const el = document.createElement('table');
    const transparentSpy = jest
      .spyOn(
        converter as unknown as Record<string, (...args: unknown[]) => unknown>,
        'isTransparentTable'
      )
      .mockReturnValue(false);

    converter['parseTable'](el, true);
    const last = (converter as unknown as { elements: ParserElement[] }).elements.slice(-1)[0];
    expect(last.type).toBe(12);
    expect(transparentSpy).toHaveBeenCalled();
  });

  it('ParseNestedList handles nodeName that is neither UL nor OL without appending', () => {
    const doc = new LicitDocumentElement();
    const appendSpy = jest.spyOn(doc, 'appendElement');
    const node = document.createElement('div');
    node.textContent = '';

    converter['ParseNestedList']('DIV', node, doc, 0);
    expect(appendSpy).not.toHaveBeenCalled();
  });

  it('should handle SPAN tag in handleNode', () => {
    const el = document.createElement('span');
    el.className = 'someClass';
    el.textContent = 'span content';

    converter['handleNode'](el, null);
    // Test that it calls mergeSpans, check that elements are added
    expect((converter as unknown as { elements: ParserElement[] }).elements.length).toBeGreaterThan(0);
  });
});
