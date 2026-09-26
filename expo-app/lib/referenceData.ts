/**
 * Constrained options and validation for the free-text profile fields.
 *
 * These were open text boxes that accepted anything, so a tester was able to
 * save "La la land" as an address and "Somali pirate" as a nationality. Lists
 * also make the data analysable later, which free text never is.
 */

/** Broad occupation categories. Deliberately short -- a long taxonomy is worse
 *  than "Other" for a field nobody wants to spend time on. */
export const OCCUPATIONS = [
  "Accounting & Finance",
  "Administration & Office Support",
  "Architecture & Construction",
  "Arts, Media & Design",
  "Charity & Voluntary",
  "Customer Service",
  "Education & Teaching",
  "Emergency Services",
  "Engineering",
  "Government & Public Sector",
  "Healthcare & Medicine",
  "Hospitality & Catering",
  "Human Resources",
  "Information Technology",
  "Legal",
  "Manufacturing & Production",
  "Marketing & Advertising",
  "Property & Real Estate",
  "Retail",
  "Sales",
  "Science & Research",
  "Skilled Trades",
  "Sport & Fitness",
  "Transport & Logistics",
  "Self-employed / Business Owner",
  "Student",
  "Retired",
  "Not currently working",
  "Other",
] as const;

/** Nationalities as demonyms, since the field asks what someone *is*, not where
 *  they live. */
export const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Antiguan", "Argentine",
  "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi",
  "Barbadian", "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese", "Bolivian",
  "Bosnian", "Botswanan", "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe",
  "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean",
  "Central African", "Chadian", "Chilean", "Chinese", "Colombian", "Comoran", "Congolese",
  "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djiboutian", "Dominican",
  "Dutch", "East Timorese", "Ecuadorean", "Egyptian", "Emirati", "Equatorial Guinean",
  "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish", "French", "Gabonese",
  "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinean",
  "Guyanese", "Haitian", "Honduran", "Hungarian", "Icelandic", "Indian", "Indonesian",
  "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese",
  "Jordanian", "Kazakh", "Kenyan", "Kiribati", "Kosovan", "Kuwaiti", "Kyrgyz", "Laotian",
  "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtensteiner", "Lithuanian",
  "Luxembourgish", "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivian", "Malian",
  "Maltese", "Marshallese", "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan",
  "Monacan", "Mongolian", "Montenegrin", "Moroccan", "Mozambican", "Namibian", "Nauruan",
  "Nepalese", "New Zealander", "Nicaraguan", "Nigerian", "Nigerien", "North Korean",
  "Norwegian", "Omani", "Pakistani", "Palauan", "Palestinian", "Panamanian",
  "Papua New Guinean", "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian",
  "Russian", "Rwandan", "Saint Lucian", "Salvadoran", "Samoan", "San Marinese",
  "Sao Tomean", "Saudi", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean",
  "Singaporean", "Slovak", "Slovenian", "Solomon Islander", "Somali", "South African",
  "South Korean", "South Sudanese", "Spanish", "Sri Lankan", "Sudanese", "Surinamese",
  "Swazi", "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese",
  "Tongan", "Trinidadian", "Tunisian", "Turkish", "Turkmen", "Tuvaluan", "Ugandan",
  "Ukrainian", "Uruguayan", "Uzbek", "Vanuatuan", "Vatican", "Venezuelan", "Vietnamese",
  "Yemeni", "Zambian", "Zimbabwean",
] as const;

/**
 * UK postcode, per the government's published pattern.
 * Matches "SW1A 1AA", "sw1a1aa", "M1 1AE".
 */
const UK_POSTCODE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;

/**
 * Addresses stay free text -- verifying one properly needs a paid lookup API.
 * Requiring a postcode is the cheap check that still rejects "La la land",
 * and the postcode is the part actually worth having.
 *
 * Returns an error string, or null when the address is acceptable.
 */
export function validateAddress(address: string): string | null {
  const trimmed = address.trim();
  if (!trimmed) return null; // optional field
  if (!UK_POSTCODE.test(trimmed)) return 'Include a valid UK postcode, e.g. SW1A 1AA';
  if (trimmed.replace(UK_POSTCODE, '').trim().length < 5) {
    return 'Add the street and town as well as the postcode';
  }
  return null;
}
