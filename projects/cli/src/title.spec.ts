import { describe, expect, it } from 'vitest';
import { renderTitle } from './title';

describe('renderTitle', () => {
  it('renders the cli title as ASCII art with the Standard figlet font', () => {
    const title = renderTitle();

    expect(title.split('\n').length).toBeGreaterThan(3);
    expect(title).toContain(String.raw`  / /_ >  <_____| | (_| |  __/`);
  });
});
