const Country = require('../models/countryModel');
const State = require('../models/stateModel');
const City = require('../models/cityModel');
const ensureStates = require('../scripts/ensureStates');
const ensureCities = require('../scripts/ensureCities');

const slugify = (v = '') =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Countries we ship a bundled states+cities preset for (matches ensureStates/ensureCities datasets).
const PRESET_COUNTRY_CODES = ['US', 'IN'];

// @desc  Bulk import countries/states/cities from a parsed CSV/Excel row set.
// @route POST /api/location-tools/import
const bulkImportLocations = async (req, res) => {
  try {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    let imported = 0;
    let skipped = 0;
    const errors = [];

    const countryCache = new Map();
    const stateCache = new Map();

    const getCountryByName = async (name) => {
      const key = String(name || '').trim().toLowerCase();
      if (!key) return null;
      if (countryCache.has(key)) return countryCache.get(key);
      const doc = await Country.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
      if (doc) countryCache.set(key, doc);
      return doc;
    };

    const getStateByName = async (name, countryId) => {
      const key = `${String(name || '').trim().toLowerCase()}|${countryId}`;
      if (!key) return null;
      if (stateCache.has(key)) return stateCache.get(key);
      const doc = await State.findOne({ name: new RegExp(`^${name.trim()}$`, 'i'), country: countryId });
      if (doc) stateCache.set(key, doc);
      return doc;
    };

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const name = String(row.name || '').trim();
      const importType = String(row.importType || row.import_type || '').trim().toLowerCase();

      if (!name || !importType) {
        skipped += 1;
        errors.push(`Row ${i + 1}: name and import type are required.`);
        continue;
      }

      try {
        if (importType === 'country') {
          const existing = await Country.findOne({ name: new RegExp(`^${name}$`, 'i') });
          if (existing) {
            skipped += 1;
            continue;
          }
          const doc = await Country.create({
            name,
            code: (row.abbreviation || '').toUpperCase().slice(0, 2),
            nationality: row.nationality || '',
            sortOrder: Number(row.order) || 0,
            status: (row.status || 'Published').toLowerCase() === 'published' ? 'Published' : 'Draft',
          });
          countryCache.set(name.toLowerCase(), doc);
          imported += 1;
        } else if (importType === 'state') {
          const country = await getCountryByName(row.country);
          if (!country) {
            skipped += 1;
            errors.push(`Row ${i + 1}: country "${row.country}" not found for state "${name}".`);
            continue;
          }
          const existing = await State.findOne({ name: new RegExp(`^${name}$`, 'i'), country: country._id });
          if (existing) {
            skipped += 1;
            continue;
          }
          const doc = await State.create({
            name,
            slug: slugify(name),
            abbreviation: row.abbreviation || '',
            country: country._id,
            countryName: country.name,
            sortOrder: Number(row.order) || 0,
            status: (row.status || 'Published').toLowerCase() === 'published' ? 'Published' : 'Draft',
          });
          stateCache.set(`${name.toLowerCase()}|${country._id}`, doc);
          imported += 1;
        } else if (importType === 'city') {
          const country = await getCountryByName(row.country);
          if (!country) {
            skipped += 1;
            errors.push(`Row ${i + 1}: country "${row.country}" not found for city "${name}".`);
            continue;
          }
          const state = await getStateByName(row.state, country._id);
          if (!state) {
            skipped += 1;
            errors.push(`Row ${i + 1}: state "${row.state}" not found for city "${name}".`);
            continue;
          }
          const existing = await City.findOne({ name: new RegExp(`^${name}$`, 'i'), state: state._id });
          if (existing) {
            skipped += 1;
            continue;
          }
          await City.create({
            name,
            slug: row.slug || slugify(name),
            state: state._id,
            stateName: state.name,
            country: country._id,
            countryName: country.name,
            sortOrder: Number(row.order) || 0,
            status: (row.status || 'Published').toLowerCase() === 'published' ? 'Published' : 'Draft',
          });
          imported += 1;
        } else {
          skipped += 1;
          errors.push(`Row ${i + 1}: unknown import type "${importType}".`);
        }
      } catch (rowError) {
        skipped += 1;
        errors.push(`Row ${i + 1}: ${rowError.message}`);
      }
    }

    res.status(200).json({
      success: true,
      data: { imported, skipped, total: rows.length, errors: errors.slice(0, 20) },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc  Import a single country + its bundled states/cities preset (if we have one).
// @route POST /api/location-tools/import-country-preset
const importCountryPreset = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Country name is required' });

    let country = await Country.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (!country) {
      country = await Country.create({ name: name.trim(), code: (code || '').toUpperCase() });
    }

    const hasPreset = PRESET_COUNTRY_CODES.includes((code || '').toUpperCase());
    if (hasPreset) {
      await ensureStates();
      await ensureCities();
    }

    const [statesCount, citiesCount] = await Promise.all([
      State.countDocuments({ country: country._id }),
      City.countDocuments({ country: country._id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        country: { id: country._id, name: country.name },
        hasPreset,
        statesImported: statesCount,
        citiesImported: citiesCount,
        message: hasPreset
          ? `Imported ${country.name} with ${statesCount} state(s) and ${citiesCount} cit(y/ies).`
          : `Imported ${country.name}. No bundled states/cities preset is available for this country yet — add them manually from States/Cities.`,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc  Flat export of all countries/states/cities for the Export Locations page.
// @route GET /api/location-tools/export-data
const getExportData = async (req, res) => {
  try {
    const [countries, states, cities] = await Promise.all([
      Country.find({}).sort({ sortOrder: 1, name: 1 }).lean(),
      State.find({}).sort({ sortOrder: 1, name: 1 }).lean(),
      City.find({}).sort({ sortOrder: 1, name: 1 }).lean(),
    ]);

    const rows = [
      ...countries.map((c) => ({
        name: c.name,
        slug: '',
        importType: 'country',
        order: c.sortOrder || 0,
        abbreviation: c.code || '',
        status: (c.status || 'Published').toLowerCase(),
        country: '',
        state: '',
        nationality: c.nationality || '',
      })),
      ...states.map((s) => ({
        name: s.name,
        slug: s.slug || '',
        importType: 'state',
        order: s.sortOrder || 0,
        abbreviation: s.abbreviation || '',
        status: (s.status || 'Published').toLowerCase(),
        country: s.countryName || '',
        state: '',
        nationality: '',
      })),
      ...cities.map((c) => ({
        name: c.name,
        slug: c.slug || '',
        importType: 'city',
        order: c.sortOrder || 0,
        abbreviation: '',
        status: (c.status || 'Published').toLowerCase(),
        country: c.countryName || '',
        state: c.stateName || '',
        nationality: '',
      })),
    ];

    res.status(200).json({
      success: true,
      data: {
        rows,
        totals: {
          locations: rows.length,
          countries: countries.length,
          states: states.length,
          cities: cities.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { bulkImportLocations, importCountryPreset, getExportData };
