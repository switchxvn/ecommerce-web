import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { AdvertisingPopup } from './advertising-popup.entity';

describe('AdvertisingPopup entity', () => {
  it('maps the campaign fields to advertising_popups', () => {
    const metadata = getMetadataArgsStorage();
    const table = metadata.tables.find(({ target }) => target === AdvertisingPopup);
    const columns = metadata.columns.filter(({ target }) => target === AdvertisingPopup);

    expect(table?.name).toBe('advertising_popups');
    expect(
      Object.fromEntries(
        columns.map(({ propertyName, options }) => [
          propertyName,
          options.name ?? propertyName,
        ]),
      ),
    ).toEqual({
      id: 'id',
      name: 'name',
      title: 'title',
      content: 'content',
      ctaLabel: 'cta_label',
      ctaUrl: 'cta_url',
      isActive: 'is_active',
      startsAt: 'starts_at',
      endsAt: 'ends_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });

    const columnTypes = Object.fromEntries(
      columns.map(({ propertyName, options }) => [propertyName, options.type]),
    );
    expect(columnTypes).toMatchObject({
      startsAt: 'timestamptz',
      endsAt: 'timestamptz',
      createdAt: 'timestamptz',
      updatedAt: 'timestamptz',
    });
  });
});
