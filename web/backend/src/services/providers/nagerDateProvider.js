
const { z } = require("zod");

const holidaySchema = z.object({
  date: z.string(),
  localName: z.string(),
  name: z.string(),
  countryCode: z.string(),
  global: z.boolean(),
  types: z.array(z.string()),
});

async function getPublicHolidays(year, countryCode) {
  const validYear = z.number().int()
    .min(1900).max(2200).parse(year);

  const validCountry = z.string()
    .regex(/^[A-Z]{2}$/)
    .parse(countryCode);

  const url =
    `https://date.nager.at/api/v3/PublicHolidays/` +
    `${validYear}/${validCountry}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(
      `Nager.Date API error: ${response.status}`
    );
  }

  const data = await response.json();

  return z.array(holidaySchema).parse(data);
}

module.exports = { getPublicHolidays };
