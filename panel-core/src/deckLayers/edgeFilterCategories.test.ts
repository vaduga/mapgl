import { edgeFilterProps } from './edgeFilterCategories';
it('encodes endpoint eligibility and independent skip visibility in one bounded category', () => {
  const effective = { key: 'test', edge: (feature: any) => feature.eligible } as any;
  const filter = edgeFilterProps(effective, true);
  expect(filter.filterCategories).toEqual([1]);
  expect(filter.getFilterCategory({ eligible: true })).toBe(1);
  expect(filter.getFilterCategory({ eligible: false })).toBe(0);
  expect(filter.getFilterCategory({ eligible: true, skip: true })).toBe(0);
  expect(edgeFilterProps(effective).getFilterCategory({ feature: { eligible: true, skip: true } })).toBe(1);
});
