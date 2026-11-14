import { getLayoutCardBox } from './layout-geometry';

it('reuses card measurements while reacting to in-place text and font changes', () => {
  const style = { text: 'label', textConfig: { fontSize: 10 } };
  const initial = getLayoutCardBox(style)!;
  expect(getLayoutCardBox(style)).toBe(initial);
  style.text = 'a much longer label';
  const text = getLayoutCardBox(style)!;
  expect(text.width).toBeGreaterThan(initial.width);
  style.textConfig.fontSize = 20;
  expect(getLayoutCardBox(style)!.height).toBeGreaterThan(text.height);
  style.text = ' ';
  expect(getLayoutCardBox(style)).toBeUndefined();
  style.text = 'restored';
  expect(getLayoutCardBox(style)).toBeDefined();
});
