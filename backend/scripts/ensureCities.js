const City = require('../models/cityModel');
const State = require('../models/stateModel');

// A representative set of well-known cities per state (kept small — not exhaustive).
const US_CITIES = {
  Alabama: ['Birmingham', 'Montgomery'],
  Alaska: ['Anchorage', 'Fairbanks'],
  Arizona: ['Phoenix', 'Tucson'],
  Arkansas: ['Little Rock', 'Fayetteville'],
  California: ['Los Angeles', 'San Francisco', 'San Diego'],
  Colorado: ['Denver', 'Boulder'],
  Connecticut: ['Hartford', 'New Haven'],
  Delaware: ['Wilmington', 'Dover'],
  'District of Columbia': ['Washington'],
  Florida: ['Miami', 'Orlando', 'Tampa'],
  Georgia: ['Atlanta', 'Savannah'],
  Hawaii: ['Honolulu', 'Hilo'],
  Idaho: ['Boise', 'Idaho Falls'],
  Illinois: ['Chicago', 'Springfield'],
  Indiana: ['Indianapolis', 'Fort Wayne'],
  Iowa: ['Des Moines', 'Cedar Rapids'],
  Kansas: ['Wichita', 'Topeka'],
  Kentucky: ['Louisville', 'Lexington'],
  Louisiana: ['New Orleans', 'Baton Rouge'],
  Maine: ['Portland', 'Augusta'],
  Maryland: ['Baltimore', 'Annapolis'],
  Massachusetts: ['Boston', 'Cambridge'],
  Michigan: ['Detroit', 'Ann Arbor'],
  Minnesota: ['Minneapolis', 'Saint Paul'],
  Mississippi: ['Jackson', 'Gulfport'],
  Missouri: ['Kansas City', 'St. Louis'],
  Montana: ['Billings', 'Missoula'],
  Nebraska: ['Omaha', 'Lincoln'],
  Nevada: ['Las Vegas', 'Reno'],
  'New Hampshire': ['Manchester', 'Concord'],
  'New Jersey': ['Newark', 'Jersey City'],
  'New Mexico': ['Albuquerque', 'Santa Fe'],
  'New York': ['New York City', 'Buffalo', 'Albany'],
  'North Carolina': ['Charlotte', 'Raleigh'],
  'North Dakota': ['Fargo', 'Bismarck'],
  Ohio: ['Columbus', 'Cleveland', 'Cincinnati'],
  Oklahoma: ['Oklahoma City', 'Tulsa'],
  Oregon: ['Portland', 'Eugene'],
  Pennsylvania: ['Philadelphia', 'Pittsburgh'],
  'Rhode Island': ['Providence', 'Newport'],
  'South Carolina': ['Charleston', 'Columbia'],
  'South Dakota': ['Sioux Falls', 'Rapid City'],
  Tennessee: ['Nashville', 'Memphis'],
  Texas: ['Houston', 'Dallas', 'Austin'],
  Utah: ['Salt Lake City', 'Provo'],
  Vermont: ['Burlington', 'Montpelier'],
  Virginia: ['Richmond', 'Virginia Beach'],
  'Virgin Islands': ['Charlotte Amalie'],
  Washington: ['Seattle', 'Spokane'],
  'West Virginia': ['Charleston', 'Huntington'],
  Wisconsin: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton', 'Waukesha', 'Oshkosh', 'Eau Claire'],
  Wyoming: ['Cheyenne', 'Casper'],
};

const INDIA_CITIES = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada'],
  'Arunachal Pradesh': ['Itanagar'],
  Assam: ['Guwahati', 'Dibrugarh'],
  Bihar: ['Patna', 'Gaya'],
  Chhattisgarh: ['Raipur', 'Bilaspur'],
  Goa: ['Panaji', 'Margao'],
  Gujarat: ['Ahmedabad', 'Surat'],
  Haryana: ['Gurugram', 'Faridabad'],
  'Himachal Pradesh': ['Shimla', 'Manali'],
  Jharkhand: ['Ranchi', 'Jamshedpur'],
  Karnataka: ['Bengaluru', 'Mysuru'],
  Kerala: ['Kochi', 'Thiruvananthapuram'],
  'Madhya Pradesh': ['Bhopal', 'Indore'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur'],
  Manipur: ['Imphal'],
  Meghalaya: ['Shillong'],
  Mizoram: ['Aizawl'],
  Nagaland: ['Kohima'],
  Odisha: ['Bhubaneswar', 'Cuttack'],
  Punjab: ['Amritsar', 'Ludhiana'],
  Rajasthan: ['Jaipur', 'Udaipur', 'Jodhpur'],
  Sikkim: ['Gangtok'],
  'Tamil Nadu': ['Chennai', 'Coimbatore'],
  Telangana: ['Hyderabad', 'Warangal'],
  Tripura: ['Agartala'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur'],
  Uttarakhand: ['Dehradun', 'Haridwar'],
  'West Bengal': ['Kolkata', 'Darjeeling'],
  Delhi: ['New Delhi'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu'],
  Ladakh: ['Leh'],
  Chandigarh: ['Chandigarh'],
  Puducherry: ['Puducherry'],
};

const slugifyName = (v) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Seeds City collection (US + India), linked to existing State docs, once on first boot. */
async function ensureCities() {
  const count = await City.countDocuments();
  if (count > 0) return;

  const states = await State.find({}).lean();
  const stateByName = Object.fromEntries(states.map((s) => [s.name, s]));

  const docs = [];
  const addFrom = (cityMap) => {
    Object.entries(cityMap).forEach(([stateName, cities]) => {
      const state = stateByName[stateName];
      if (!state) return;
      cities.forEach((name, index) => {
        docs.push({
          name,
          slug: slugifyName(name),
          state: state._id,
          stateName: state.name,
          country: state.country,
          countryName: state.countryName,
          sortOrder: index,
          status: 'Published',
        });
      });
    });
  };

  addFrom(US_CITIES);
  addFrom(INDIA_CITIES);

  if (docs.length) {
    await City.insertMany(docs);
    console.log(`Seeded ${docs.length} cities.`);
  }
}

module.exports = ensureCities;
