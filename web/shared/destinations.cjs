const groups = {
  luzon: "Luzon",
  visayas: "Visayas",
  mindanao: "Mindanao",
};

const entries = [
  // Trip key, slug, name, area, airport name, coordinates, interests, tagline, highlights.
  // Optional trailing fields set the parent destination, airport code, and transfer note.
  ["BAN", "banaue", "Banaue", "luzon", null, [16.912, 121.060], "Nature, Culture, Adventure", "Rice terraces and mountain villages", "Banaue Viewpoint|Banaue Museum|Batad Rice Terraces"],
  ["BSO", "batanes", "Basco, Batanes", "luzon", "Basco Airport", [20.449, 121.970], "Nature, Culture", "Rolling hills and windswept coasts", "Basco Lighthouse|Vayang Rolling Hills|Valugan Boulder Beach"],
  ["CYZ", "isabela", "Cauayan, Isabela", "luzon", "Cauayan Airport", [16.935, 121.774], "Culture, Food", "Market days and Cagayan Valley scenery", "Cauayan City Public Market|Our Lady of the Pillar Parish, Cauayan"],
  ["CRK", "clark", "Clark, Pampanga", "luzon", "Clark International Airport", [15.180, 120.528], "Adventure, Food, Nature", "Pinatubo trails and Kapampangan cooking", "Clark Museum|Clark Parade Grounds|Mount Pinatubo"],
  ["DRP", "legazpi", "Daraga and Legazpi", "luzon", "Bicol International Airport", [13.139, 123.743], "Nature, Culture, Food", "Mayon views and Bicol flavors", "Cagsawa Ruins|Daraga Church|Legazpi Boulevard"],
  ["LAO", "laoag", "Laoag", "luzon", "Laoag International Airport", [18.178, 120.532], "Culture, Adventure", "Old streets and open dunes", "Laoag Sinking Bell Tower|Paoay Church|La Paz Sand Dunes"],
  ["MNL", "manila", "Manila", "luzon", "Ninoy Aquino International Airport", [14.5995, 120.9842], "Culture, Food", "Walk through the city's history", "Fort Santiago|Rizal Park|National Museum of Fine Arts, Manila"],
  ["MBT", "masbate", "Masbate", "luzon", "Moises R. Espinosa Airport", [12.369, 123.624], "Beach, Nature", "Sandbars and mangroves", "Buntod Reef Marine Sanctuary and Sandbar|Rodeo Arena, Masbate City"],
  ["WNP", "naga", "Naga and Pili", "luzon", "Naga Airport", [13.622, 123.194], "Culture, Nature, Adventure", "Pilgrimage sites and mountain trails", "Peñafrancia Basilica Minore|Naga Metropolitan Cathedral|Malabsay Falls"],
  ["TUG", "tuguegarao", "Tuguegarao", "luzon", "Tuguegarao Airport", [17.613, 121.728], "Culture, Food, Adventure", "Cathedral streets and limestone caves", "Tuguegarao Cathedral|Callao Cave|Tuguegarao City Public Market"],
  ["VRC", "catanduanes", "Virac, Catanduanes", "luzon", "Virac Airport", [13.584, 124.232], "Nature, Beach, Adventure", "Pacific headlands and surf breaks", "Virac Cathedral|Maribina Falls|Binurong Point"],
  ["TBH", "tablas", "Tablas, Romblon", "luzon", "Tugdan Airport", [12.388, 122.038], "Beach, Nature", "Quiet coves and clear water", "Binucot Beach|Aglicay Beach|Looc Bay Marine Refuge and Sanctuary"],

  ["PAL", "palawan", "Palawan", "luzon", null, null, "Nature, Beach, Adventure", "Limestone coasts, lagoons and island days", []],
  ["PPS", "puerto-princesa", "Puerto Princesa", "luzon", "Puerto Princesa International Airport", [9.7392, 118.7353], "Nature, Adventure", "An underground river and sheltered bays", "Puerto Princesa Subterranean River National Park|Puerto Princesa City Baywalk Park|Honda Bay", "PAL", "PPS", "Allow a road transfer to Sabang for the Underground River."],
  ["USU", "coron", "Coron", "luzon", "Busuanga Airport", [12.000, 120.204], "Beach, Nature, Adventure", "Lagoons between limestone cliffs", "Coron Town Plaza|Kayangan Lake|Maquinit Hot Spring", "PAL", "USU", "Fly into Busuanga and continue by road to Coron town. Island tours start by boat."],
  ["ENI", "el-nido", "El Nido", "luzon", "Lio Airport", [11.179, 119.390], "Beach, Nature, Adventure", "Lagoons and limestone islands", "El Nido Town Proper|Lio Beach|Big Lagoon, El Nido", "PAL", "ENI", "Fly into Lio Airport for El Nido or travel overland from Puerto Princesa."],

  ["BCD", "bacolod", "Bacolod and Silay", "visayas", "Bacolod–Silay Airport", [10.677, 122.951], "Food, Culture", "Sugar heritage and chicken inasal", "The Ruins, Talisay|Negros Museum|Manokan Country, Bacolod"],
  ["BOH", "bohol", "Bohol", "visayas", "Bohol–Panglao International Airport", [9.850, 124.144], "Nature, Culture, Beach", "Chocolate Hills and Panglao beaches", "Alona Beach|Chocolate Hills Complex|Loboc River Cruise", null, "TAG"],
  ["BOR", "boracay", "Boracay", "visayas", "Caticlan Airport", [11.967, 121.925], "Beach, Nature", "White-sand shores and island sunsets", "White Beach, Boracay|Bulabog Beach|Willy's Rock", null, "MPH", "Continue from Caticlan Airport to the jetty, then take a boat to Boracay. Kalibo is an alternate airport with an added road transfer."],
  ["BPA", "borongan", "Borongan", "visayas", "Borongan Airport", [11.608, 125.432], "Beach, Adventure, Nature", "A Pacific waterfront and surf breaks", "Baybay Boulevard, Borongan|Borongan Cathedral"],
  ["CYP", "calbayog", "Calbayog", "visayas", "Calbayog Airport", [12.067, 124.594], "Nature, Adventure", "Waterfall trails in western Samar", "Tarangban Falls|Bangon Falls|Calbayog Cathedral"],
  ["CRM", "catarman", "Catarman, Northern Samar", "visayas", "Catarman National Airport", [12.498, 124.638], "Culture, Nature", "A starting point for Northern Samar", "Catarman Cathedral|University of Eastern Philippines, Catarman|Biri Rock Formations"],
  ["CEB", "cebu", "Cebu", "visayas", "Mactan–Cebu International Airport", [10.316, 123.885], "Culture, Food, Adventure, Beach", "City heritage, waterfalls and sea views", ["Basilica Minore del Santo Niño", "Magellan’s Cross", "Kawasan Falls, Badian"]],
  ["DGT", "dumaguete", "Dumaguete", "visayas", "Sibulan Airport", [9.307, 123.305], "Culture, Food, Nature", "Seafront walks and nearby mountain trails", "Rizal Boulevard, Dumaguete|Silliman University|Casaroro Falls"],
  ["ILO", "iloilo", "Iloilo", "visayas", "Iloilo International Airport", [10.720, 122.562], "Culture, Food", "River walks, heritage streets and La Paz batchoy", "Iloilo River Esplanade|Calle Real, Iloilo|Miagao Church"],
  ["KLO", "kalibo", "Kalibo", "visayas", "Kalibo International Airport", [11.706, 122.365], "Culture, Nature", "Mangrove boardwalks and Aklan heritage", "Bakhawan Eco-Park|Pastrana Park|Museo it Akean"],
  ["RXS", "roxas", "Roxas, Capiz", "visayas", "Roxas Airport", [11.585, 122.751], "Food, Culture, Beach", "Seafood along the Capiz coast", "Baybay Beach, Roxas City|Roxas City Bridge|Panublion Museum"],
  ["IQR", "siquijor", "Siquijor", "visayas", "Siquijor Airport", [9.214, 123.515], "Beach, Nature, Adventure", "Spring-fed falls and quiet beaches", "Cambugahay Falls|Paliton Beach|Lazi Church"],
  ["TAC", "tacloban", "Tacloban", "visayas", "Daniel Z. Romualdez Airport", [11.245, 125.004], "Culture, Nature", "Waterfront views and Leyte history", "San Juanico Bridge|Santo Niño Shrine and Heritage Museum|MacArthur Landing Memorial National Park"],

  ["BXU", "butuan", "Butuan", "mindanao", "Bancasi Airport", [8.949, 125.543], "Culture, Nature", "Ancient boats and the Agusan River", "Balangay Shrine Museum|Butuan National Museum|Bood Promontory Eco Park"],
  ["CGY", "cagayan-de-oro", "Cagayan de Oro", "mindanao", "Laguindingan Airport", [8.454, 124.632], "Adventure, Food, Culture", "Whitewater and city markets", "Cagayan de Oro River|Gaston Park|Cogon Public Market", null, "CGY", "Laguindingan Airport serves Cagayan de Oro. Allow time for the road transfer into the city."],
  ["CGM", "camiguin", "Camiguin", "mindanao", "Camiguin Airport", [9.173, 124.727], "Nature, Beach, Adventure", "Volcanic landscapes and a white sandbar", "White Island, Camiguin|Katibawasan Falls|Sunken Cemetery, Camiguin"],
  ["CBO", "cotabato", "Cotabato City", "mindanao", "Awang Airport", [7.224, 124.247], "Culture, Food", "River scenery and the Grand Mosque", "Sultan Haji Hassanal Bolkiah Mosque|Kutawato Cave|People’s Palace, Cotabato City"],
  ["DVO", "davao", "Davao", "mindanao", "Francisco Bangoy International Airport", [7.073, 125.613], "Nature, Food, Culture", "Fruit markets and the foothills of Mount Apo", "People's Park, Davao City|Philippine Eagle Center|Bankerohan Public Market"],
  ["DPL", "dipolog", "Dipolog", "mindanao", "Dipolog Airport", [8.588, 123.340], "Culture, Food, Beach", "Seafront sunsets and nearby Dapitan heritage", "Dipolog Sunset Boulevard|Dipolog Cathedral|Rizal Shrine, Dapitan"],
  ["GES", "general-santos", "General Santos", "mindanao", "General Santos International Airport", [6.116, 125.171], "Food, Culture", "Tuna landings and a busy waterfront", "General Santos Fish Port Complex|Plaza Heneral Santos|Queen Tuna Park"],
  ["OZC", "ozamiz", "Ozamiz", "mindanao", "Labo Airport", [8.146, 123.842], "Culture, Nature", "A historic fort on Panguil Bay", "Cotta Fort, Ozamiz|Immaculate Conception Cathedral, Ozamiz|Bukagan Hill"],
  ["PAG", "pagadian", "Pagadian", "mindanao", "Pagadian Airport", [7.824, 123.437], "Culture, Nature", "Hillside streets above Illana Bay", "Plaza Luz, Pagadian|Pagadian Boulevard|Mount Palpalan"],
  ["IAO", "siargao", "Siargao", "mindanao", "Sayak Airport", [9.807, 126.158], "Beach, Adventure, Nature", "Surf breaks, tidal pools and mangroves", "Cloud 9, General Luna|Magpupungko Rock Pools|Sugba Lagoon"],
  ["SUG", "surigao", "Surigao City", "mindanao", "Surigao Airport", [9.784, 125.496], "Beach, Nature", "Pebble beaches and the Surigao Strait", "Mabua Pebble Beach|Luneta Park, Surigao City|Surigao City Boulevard"],
  ["TWT", "tawi-tawi", "Tawi-Tawi", "mindanao", "Sanga-Sanga Airport", [5.029, 119.774], "Nature, Culture, Adventure", "Island views from Bud Bongao", "Bud Bongao|Bongao Public Market|Bongao Wharf"],
  ["ZAM", "zamboanga", "Zamboanga", "mindanao", "Zamboanga International Airport", [6.921, 122.079], "Culture, Food, Beach", "Fort Pilar and the coast of the Zamboanga Peninsula", "Fort Pilar|Paseo del Mar, Zamboanga City|Great Santa Cruz Island"],
];

const destinations = entries.map(([code, slug, name, group, airportName, coordinates, interests, tag, places, parent = null, airport = airportName ? code : null, transfer = null]) => ({
  code, slug, name, group, region: groups[group], airportName, airport, coordinates,
  interests: interests.split(", "), tag, highlights: typeof places === "string" ? places.split("|") : places,
  parent, transfer,
}));

const byCode = new Map(destinations.map((place) => [place.code, place]));
const byAirport = new Map(destinations.filter((place) => place.airport).map((place) => [place.airport, place]));

function findDestination(value) {
  const code = String(value || "").trim().toUpperCase();
  return byCode.get(code) || byAirport.get(code);
}

function destinationLocation(value) {
  const place = findDestination(value);
  return place ? [place.name, place.parent && "Palawan", "Philippines"].filter(Boolean).join(", ") : value;
}

module.exports = { destinations, findDestination, destinationLocation };
