const EcommerceAttributeSet = require('../models/ecommerceAttributeSetModel');

/**
 * Old schema: attributeSet.attributes = [{ title, slug, color, image, isDefault }]
 *   (the set's title, e.g. "Color", IS the attribute; each row was one of its VALUES)
 * New schema: attributeSet.groups = [{ name, slug, order,
 *   attributes: [{ title, slug, values: [{ title, slug, color, image, isDefault }] }] }]
 * Migrates any pre-existing flat documents into a single "General" group containing
 * one attribute (named after the set's own title) holding the old value rows.
 */
async function migrateAttributeSetGroups() {
  const raw = EcommerceAttributeSet.collection;
  const legacyDocs = await raw.find({ attributes: { $exists: true }, groups: { $exists: false } }).toArray();
  if (!legacyDocs.length) return;

  await Promise.all(
    legacyDocs.map((doc) =>
      raw.updateOne(
        { _id: doc._id },
        {
          $set: {
            groups: [
              {
                name: 'General',
                slug: 'general',
                order: 0,
                attributes: [
                  {
                    title: doc.title || 'Attribute',
                    slug: doc.slug || '',
                    values: (doc.attributes || []).map((a) => ({
                      title: a.title || '',
                      slug: a.slug || '',
                      color: a.color || '',
                      image: a.image || '',
                      isDefault: Boolean(a.isDefault),
                    })),
                  },
                ],
              },
            ],
          },
          $unset: { attributes: '' },
        }
      )
    )
  );
  console.log(`Migrated ${legacyDocs.length} attribute set(s) to grouped layout.`);
}

module.exports = migrateAttributeSetGroups;
