import { openStore } from './store';

describe('sqlite persistence', () => {
  it('migra y siembra plantilla y categorías', () => {
    const store = openStore(':memory:');
    const categories = store.repos.categories.list(false);
    expect(categories.map((item) => item.name)).toEqual(
      expect.arrayContaining([
        'Warpcom',
        'Five',
        'Proyectos vendibles',
        'Proyectos personales',
      ]),
    );
    const template = store.repos.templates.default();
    expect(template).toBeTruthy();
    expect(store.repos.templates.slots(template?.id ?? '')).toHaveLength(15);
    store.close();
  });
});
