/**
 * Mapping of Indian States and Union Territories to their GST State Codes
 * Handles common variations and misspellings for robust matching.
 */
export const stateToCode = {
  // Union Territories
  'puducherry': '34',
  'pondicherry': '34',
  'andaman and nicobar islands': '35',
  'chandigarh': '04',
  'dadra and nagar haveli and daman and diu': '26',
  'delhi': '07',
  'jammu and kashmir': '01',
  'ladakh': '38',
  'lakshadweep': '31',

  // States
  'andhra pradesh': '37',
  'arunachal pradesh': '12',
  'assam': '18',
  'bihar': '10',
  'chhattisgarh': '22',
  'goa': '30',
  'gujarat': '24',
  'haryana': '06',
  'himachal pradesh': '02',
  'jharkhand': '20',
  'karnataka': '29',
  'kerala': '32',
  'madhya pradesh': '23',
  'maharashtra': '27',
  'manipur': '14',
  'meghalaya': '17',
  'mizoram': '15',
  'nagaland': '13',
  'odisha': '21',
  'punjab': '03',
  'rajasthan': '08',
  'sikkim': '11',
  'tamil nadu': '33',
  'telangana': '36',
  'tripura': '16',
  'uttar pradesh': '09',
  'uttarakhand': '05',
  'west bengal': '19'
};

/**
 * Get normalized state code from state name or GSTIN
 * @param {string} stateName - Name of the state
 * @param {string} gstin - GSTIN string
 * @returns {string|null}
 */
export function getStateCode(stateName, gstin = '') {
  // Try to extract from GSTIN first (first 2 digits)
  if (gstin && typeof gstin === 'string') {
    const code = gstin.trim().substring(0, 2);
    if (/^\d{2}$/.test(code)) {
      return code;
    }
  }

  if (!stateName) return null;
  const normalized = stateName.toLowerCase().trim();
  return stateToCode[normalized] || null;
}

/**
 * Compare two states to see if they are the same
 * @param {string} state1 - State 1 name
 * @param {string} state2 - State 2 name
 * @param {string} code1 - State 1 code
 * @param {string} code2 - State 2 code
 * @param {string} gstin1 - GSTIN 1
 * @param {string} gstin2 - GSTIN 2
 * @returns {boolean}
 */
export function areStatesSame(state1, state2, code1, code2, gstin1 = '', gstin2 = '') {
  const c1 = (code1 || '').toString().trim();
  const c2 = (code2 || '').toString().trim();

  // If both codes are provided and match, it's intra-state
  if (c1 !== '' && c2 !== '' && c1 === c2) {
    return true;
  }

  // Fallback to normalized name matching
  const n1 = (state1 || '').toLowerCase().trim();
  const n2 = (state2 || '').toLowerCase().trim();
  
  if (n1 !== '' && n2 !== '' && n1 === n2) return true;

  // Use mapping or GSTIN extraction to check if they map to the same code
  const mc1 = c1 || getStateCode(n1, gstin1);
  const mc2 = c2 || getStateCode(n2, gstin2);

  return mc1 !== null && mc2 !== null && mc1 === mc2;
}
