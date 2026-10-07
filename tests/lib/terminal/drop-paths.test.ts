import { afterEach, describe, expect, it, vi } from 'vitest';

import { droppedPaths, quoteDroppedPaths } from '@lib/terminal/drop-paths';

describe('quoteDroppedPaths', () => {
  it('single-quotes a path and ends with one space, ready for the next word', () => {
    expect(quoteDroppedPaths(['/Users/me/shot.png'])).toBe("'/Users/me/shot.png' ");
  });

  it('keeps spaces inside the quotes rather than escaping them', () => {
    expect(quoteDroppedPaths(['/Users/me/My Shot.png'])).toBe("'/Users/me/My Shot.png' ");
  });

  it("closes, escapes and reopens around a ' inside the path", () => {
    expect(quoteDroppedPaths(["/Users/me/it's.txt"])).toBe("'/Users/me/it'\\''s.txt' ");
  });

  it('leaves every other shell character inert inside the quotes', () => {
    expect(quoteDroppedPaths(['/tmp/$HOME `x` "y" !z\\'])).toBe("'/tmp/$HOME `x` \"y\" !z\\' ");
  });

  it('joins several files with single spaces, in drop order', () => {
    expect(quoteDroppedPaths(['/a/one', '/b/two'])).toBe("'/a/one' '/b/two' ");
  });

  it('answers null for nothing, so the caller pastes nothing', () => {
    expect(quoteDroppedPaths([])).toBeNull();
  });
});

describe('droppedPaths', () => {
  afterEach(() => {
    delete window.hive;
  });

  it('asks the bridge for each file and keeps only the real paths', () => {
    const droppedPath = vi.fn((file: File) => (file.name === 'fake' ? null : `/real/${file.name}`));
    window.hive = { pty: { droppedPath } } as unknown as NonNullable<Window['hive']>;

    const files = [new File(['a'], 'one'), new File(['b'], 'fake'), new File(['c'], 'two')];

    expect(droppedPaths(files)).toEqual(['/real/one', '/real/two']);
    expect(droppedPath).toHaveBeenCalledTimes(3);
  });

  it('answers nothing in the browser build, which has no bridge', () => {
    expect(droppedPaths([new File(['a'], 'one')])).toEqual([]);
  });
});
