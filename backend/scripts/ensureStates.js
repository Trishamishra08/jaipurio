const State = require('../models/stateModel');
const Country = require('../models/countryModel');

// [name, abbreviation]
const US_STATES = [
  ['Alabama', 'AL'], ['Alaska', 'AK'], ['Arizona', 'AZ'], ['Arkansas', 'AR'], ['California', 'CA'],
  ['Colorado', 'CO'], ['Connecticut', 'CT'], ['Delaware', 'DE'], ['District of Columbia', 'DC'],
  ['Florida', 'FL'], ['Georgia', 'GA'], ['Hawaii', 'HI'], ['Idaho', 'ID'], ['Illinois', 'IL'],
  ['Indiana', 'IN'], ['Iowa', 'IA'], ['Kansas', 'KS'], ['Kentucky', 'KY'], ['Louisiana', 'LA'],
  ['Maine', 'ME'], ['Maryland', 'MD'], ['Massachusetts', 'MA'], ['Michigan', 'MI'], ['Minnesota', 'MN'],
  ['Mississippi', 'MS'], ['Missouri', 'MO'], ['Montana', 'MT'], ['Nebraska', 'NE'], ['Nevada', 'NV'],
  ['New Hampshire', 'NH'], ['New Jersey', 'NJ'], ['New Mexico', 'NM'], ['New York', 'NY'],
  ['North Carolina', 'NC'], ['North Dakota', 'ND'], ['Ohio', 'OH'], ['Oklahoma', 'OK'], ['Oregon', 'OR'],
  ['Pennsylvania', 'PA'], ['Rhode Island', 'RI'], ['South Carolina', 'SC'], ['South Dakota', 'SD'],
  ['Tennessee', 'TN'], ['Texas', 'TX'], ['Utah', 'UT'], ['Vermont', 'VT'], ['Virginia', 'VA'],
  ['Virgin Islands', 'VI'], ['Washington', 'WA'], ['West Virginia', 'WV'], ['Wisconsin', 'WI'], ['Wyoming', 'WY'],
];

// [name, abbreviation]
const INDIA_STATES = [
  ['Andhra Pradesh', 'AP'], ['Arunachal Pradesh', 'AR'], ['Assam', 'AS'], ['Bihar', 'BR'],
  ['Chhattisgarh', 'CG'], ['Goa', 'GA'], ['Gujarat', 'GJ'], ['Haryana', 'HR'], ['Himachal Pradesh', 'HP'],
  ['Jharkhand', 'JH'], ['Karnataka', 'KA'], ['Kerala', 'KL'], ['Madhya Pradesh', 'MP'], ['Maharashtra', 'MH'],
  ['Manipur', 'MN'], ['Meghalaya', 'ML'], ['Mizoram', 'MZ'], ['Nagaland', 'NL'], ['Odisha', 'OD'],
  ['Punjab', 'PB'], ['Rajasthan', 'RJ'], ['Sikkim', 'SK'], ['Tamil Nadu', 'TN'], ['Telangana', 'TG'],
  ['Tripura', 'TR'], ['Uttar Pradesh', 'UP'], ['Uttarakhand', 'UK'], ['West Bengal', 'WB'],
  ['Delhi', 'DL'], ['Jammu and Kashmir', 'JK'], ['Ladakh', 'LA'], ['Chandigarh', 'CH'],
  ['Puducherry', 'PY'],
];

/** Seeds State collection (US + India) once, on first boot, linked to existing Country docs. */
async function ensureStates() {
  const count = await State.countDocuments();
  if (count > 0) return;

  const [us, india] = await Promise.all([
    Country.findOne({ code: 'US' }).lean(),
    Country.findOne({ code: 'IN' }).lean(),
  ]);

  const docs = [];
  if (us) {
    US_STATES.forEach(([name, abbreviation], index) => {
      docs.push({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        abbreviation,
        country: us._id,
        countryName: us.name,
        sortOrder: index,
        status: 'Published',
      });
    });
  }
  if (india) {
    INDIA_STATES.forEach(([name, abbreviation], index) => {
      docs.push({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        abbreviation,
        country: india._id,
        countryName: india.name,
        sortOrder: index,
        status: 'Published',
      });
    });
  }

  if (docs.length) {
    await State.insertMany(docs);
    console.log(`Seeded ${docs.length} states.`);
  }
}

module.exports = ensureStates;
