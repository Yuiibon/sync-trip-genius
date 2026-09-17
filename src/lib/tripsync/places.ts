/**
 * Destination place book.
 *
 * Real, searchable venue names per destination so the generated day-by-day
 * itinerary names actual places (sights, cafes, restaurants, markets, viewpoints)
 * instead of generic filler like "Lunch in Ooty".
 */

export type CityGuide = {
  city: string;
  railway?: string;
  airport?: string;
  busStand?: string;
  stays: string[];
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  cafes: string[];
  sights: string[];
  viewpoints: string[];
  markets: string[];
  hidden: string[];
};

const GUIDES: Record<string, CityGuide> = {
  ooty: {
    city: "Ooty",
    railway: "Udagamandalam Railway Station, Ooty",
    airport: "Coimbatore International Airport",
    busStand: "Ooty Bus Stand, Udhagamandalam",
    stays: ["Sterling Ooty Fern Hill", "Hotel Darshan Ooty", "Savoy IHCL SeleQtions Ooty"],
    breakfast: ["Hotel Sadhana, Ooty", "Adyar Ananda Bhavan, Ooty", "Willy's Coffee Pub, Ooty"],
    lunch: ["Hotel Nahar Nilgiris, Ooty", "Junior Kuppanna, Ooty", "Shinkow's Chinese Restaurant, Ooty"],
    dinner: ["Earl's Secret, Ooty", "Place To Bee, Ooty", "Hotel Nahar Nilgiris, Ooty"],
    cafes: ["Cafe Coffee Day Charring Cross, Ooty", "King Star Chocolate Factory, Ooty"],
    sights: [
      "Doddabetta Peak, Ooty",
      "Government Botanical Garden, Ooty",
      "Ooty Lake Boat House",
      "The Tea Factory and Tea Museum, Ooty",
      "Rose Garden, Ooty",
      "Pykara Falls, Ooty",
      "St. Stephen's Church, Ooty",
      "Nilgiri Mountain Railway, Udagamandalam",
    ],
    viewpoints: ["Pykara Lake, Ooty", "Ninth Mile Shooting Point, Ooty", "Wenlock Downs 9th Mile"],
    markets: ["Ooty Municipal Market", "Charring Cross Market, Ooty", "Tibetan Market, Ooty"],
    hidden: ["Emerald Lake, Ooty", "Avalanche Lake, Ooty", "Kalhatty Waterfalls, Ooty"],
  },
  goa: {
    city: "Goa",
    railway: "Madgaon Railway Station, Goa",
    airport: "Goa International Airport, Dabolim",
    busStand: "Panjim Kadamba Bus Stand, Goa",
    stays: ["Hotel Fidalgo Panjim", "Resort Rio Arpora", "Novotel Goa Candolim"],
    breakfast: ["Cafe Bodega, Panjim", "Infantaria, Calangute", "German Bakery, Anjuna"],
    lunch: ["Fisherman's Wharf, Panjim", "Britto's, Baga Beach", "Mum's Kitchen, Panjim"],
    dinner: ["Thalassa, Vagator", "Souza Lobo, Calangute", "Antares, Vagator"],
    cafes: ["Cafe Chocolatti, Candolim", "Artjuna Cafe, Anjuna"],
    sights: [
      "Basilica of Bom Jesus, Old Goa",
      "Fort Aguada, Candolim",
      "Chapora Fort, Vagator",
      "Dudhsagar Falls, Goa",
      "Se Cathedral, Old Goa",
      "Baga Beach Water Sports, Goa",
    ],
    viewpoints: ["Cabo de Rama Fort, Goa", "Chapora Fort Sunset Point, Goa"],
    markets: ["Anjuna Flea Market, Goa", "Saturday Night Market Arpora, Goa", "Mapusa Market, Goa"],
    hidden: ["Butterfly Beach, Goa", "Divar Island, Goa", "Netravali Bubble Lake, Goa"],
  },
  pondicherry: {
    city: "Pondicherry",
    railway: "Puducherry Railway Station",
    airport: "Chennai International Airport",
    busStand: "Puducherry New Bus Stand",
    stays: ["Villa Shanti Pondicherry", "Hotel Atithi Pondicherry", "Palais de Mahe Pondicherry"],
    breakfast: ["Baker Street, Pondicherry", "Cafe des Arts, Pondicherry", "Surguru Restaurant, Pondicherry"],
    lunch: ["Villa Shanti Restaurant, Pondicherry", "Kasha Ki Aasha, Pondicherry", "Coromandel Cafe, Pondicherry"],
    dinner: ["Le Dupleix, Pondicherry", "Tanto Pizzeria, Pondicherry", "The Promenade Rooftop, Pondicherry"],
    cafes: ["Cafe Xtasi, Pondicherry", "Zuka Choco-la, Pondicherry"],
    sights: [
      "Promenade Beach, Pondicherry",
      "Sri Aurobindo Ashram, Pondicherry",
      "Auroville Matrimandir, Pondicherry",
      "French Quarter White Town, Pondicherry",
      "Basilica of the Sacred Heart of Jesus, Pondicherry",
      "Paradise Beach, Pondicherry",
    ],
    viewpoints: ["Rock Beach Promenade, Pondicherry", "Serenity Beach, Pondicherry"],
    markets: ["Goubert Market, Pondicherry", "Sunday Market Mission Street, Pondicherry"],
    hidden: ["Auroville Botanical Gardens", "Chunnambar Boat House, Pondicherry"],
  },
  manali: {
    city: "Manali",
    railway: "Joginder Nagar Railway Station",
    airport: "Bhuntar Airport, Kullu",
    busStand: "Manali Bus Stand",
    stays: ["Hotel Snow Princess Manali", "Larisa Resort Manali", "Apple Country Resort Manali"],
    breakfast: ["Cafe 1947, Old Manali", "Drifters' Cafe, Old Manali", "Rocky's Cafe, Manali"],
    lunch: ["Johnson's Cafe, Manali", "Chopsticks Restaurant, Manali", "Casa Bella Vista, Manali"],
    dinner: ["The Lazy Dog, Old Manali", "Renaissance Restaurant, Manali", "Il Forno, Manali"],
    cafes: ["Cafe Shiva Garden, Old Manali", "Evergreen Cafe, Manali"],
    sights: [
      "Hadimba Devi Temple, Manali",
      "Solang Valley, Manali",
      "Atal Tunnel, Rohtang",
      "Vashisht Hot Water Springs, Manali",
      "Jogini Waterfall, Manali",
      "Manu Temple, Old Manali",
    ],
    viewpoints: ["Rohtang Pass, Manali", "Sissu Viewpoint, Lahaul"],
    markets: ["Mall Road, Manali", "Tibetan Market, Manali"],
    hidden: ["Naggar Castle, Manali", "Beas Kund Trail, Manali"],
  },
  jaipur: {
    city: "Jaipur",
    railway: "Jaipur Junction Railway Station",
    airport: "Jaipur International Airport",
    busStand: "Sindhi Camp Bus Stand, Jaipur",
    stays: ["Hotel Pearl Palace Jaipur", "Alsisar Haveli Jaipur", "Trident Jaipur"],
    breakfast: ["Rawat Mishtan Bhandar, Jaipur", "Sanjay Omelette, Jaipur", "Tapri Central, Jaipur"],
    lunch: ["Laxmi Mishthan Bhandar, Jaipur", "Handi Restaurant, Jaipur", "Spice Court, Jaipur"],
    dinner: ["1135 AD Amer Fort, Jaipur", "Chokhi Dhani, Jaipur", "Peacock Rooftop Restaurant, Jaipur"],
    cafes: ["Curious Life Coffee Roasters, Jaipur", "Bar Palladio, Jaipur"],
    sights: [
      "Amber Fort, Jaipur",
      "Hawa Mahal, Jaipur",
      "City Palace, Jaipur",
      "Jantar Mantar, Jaipur",
      "Jal Mahal, Jaipur",
      "Albert Hall Museum, Jaipur",
    ],
    viewpoints: ["Nahargarh Fort, Jaipur", "Panna Meena Ka Kund, Jaipur"],
    markets: ["Johari Bazaar, Jaipur", "Bapu Bazaar, Jaipur"],
    hidden: ["Patrika Gate, Jaipur", "Galtaji Monkey Temple, Jaipur"],
  },
  rishikesh: {
    city: "Rishikesh",
    railway: "Rishikesh Railway Station",
    airport: "Jolly Grant Airport, Dehradun",
    busStand: "Rishikesh Bus Stand",
    stays: ["Aloha on the Ganges, Rishikesh", "Zostel Rishikesh", "Ganga Kinare Rishikesh"],
    breakfast: ["Little Buddha Cafe, Rishikesh", "Beatles Cafe, Rishikesh", "Pyramid Cafe, Rishikesh"],
    lunch: ["Chotiwala Restaurant, Rishikesh", "Ramana's Organic Cafe, Rishikesh", "Tat Wale Cafe, Rishikesh"],
    dinner: ["The Sitting Elephant, Rishikesh", "Bistro Nirvana, Rishikesh", "60's Cafe Delmar, Rishikesh"],
    cafes: ["Freedom Cafe, Rishikesh", "Cafe De Goa, Rishikesh"],
    sights: [
      "Laxman Jhula, Rishikesh",
      "Ram Jhula, Rishikesh",
      "Triveni Ghat Ganga Aarti, Rishikesh",
      "Parmarth Niketan Ashram, Rishikesh",
      "Neer Garh Waterfall, Rishikesh",
      "Shivpuri River Rafting Point, Rishikesh",
    ],
    viewpoints: ["Kunjapuri Devi Temple Sunrise Point, Rishikesh", "Beatles Ashram, Rishikesh"],
    markets: ["Tapovan Market, Rishikesh", "Lakshman Jhula Market, Rishikesh"],
    hidden: ["Patna Waterfall, Rishikesh", "Garud Chatti Waterfall, Rishikesh"],
  },
  munnar: {
    city: "Munnar",
    railway: "Aluva Railway Station",
    airport: "Cochin International Airport",
    busStand: "Munnar Bus Stand",
    stays: ["Tea County Munnar", "Blanket Hotel & Spa, Munnar", "Munnar Tea Country Resort"],
    breakfast: ["Rapsy Restaurant, Munnar", "Hotel Saravana Bhavan, Munnar", "Cafe Arabia, Munnar"],
    lunch: ["SN Restaurant, Munnar", "Sree Mahaveer Bhojanalaya, Munnar", "Al Amer Restaurant, Munnar"],
    dinner: ["The Lakeview Restaurant, Munnar", "Silver Spoon, Munnar", "Grandma's Restaurant, Munnar"],
    cafes: ["Coffee Shop Munnar", "Bakers Junction, Munnar"],
    sights: [
      "Eravikulam National Park, Munnar",
      "Mattupetty Dam, Munnar",
      "Tea Museum, Munnar",
      "Attukad Waterfalls, Munnar",
      "Echo Point, Munnar",
      "Kundala Lake, Munnar",
    ],
    viewpoints: ["Top Station, Munnar", "Photo Point, Munnar"],
    markets: ["Munnar Town Market", "Spice Market, Munnar"],
    hidden: ["Lakkam Waterfalls, Munnar", "Anayirankal Dam, Munnar"],
  },
  kodaikanal: {
    city: "Kodaikanal",
    railway: "Kodai Road Railway Station",
    airport: "Madurai Airport",
    busStand: "Kodaikanal Bus Stand",
    stays: ["The Carlton Kodaikanal", "Hotel Kodai International", "Sterling Kodai Lake"],
    breakfast: ["Cloud Street Cafe, Kodaikanal", "Hotel Astoria, Kodaikanal", "Pastry Corner, Kodaikanal"],
    lunch: ["Muncheez Kodaikanal", "Hotel Punjab, Kodaikanal", "Tava Restaurant, Kodaikanal"],
    dinner: ["Ten Degrees Restaurant, Kodaikanal", "Altaf's Cafe, Kodaikanal", "Royal Tibet Restaurant, Kodaikanal"],
    cafes: ["Cafe Cariappa, Kodaikanal", "Hilltop Towers Cafe, Kodaikanal"],
    sights: [
      "Kodaikanal Lake",
      "Coaker's Walk, Kodaikanal",
      "Bryant Park, Kodaikanal",
      "Silver Cascade Falls, Kodaikanal",
      "Pillar Rocks, Kodaikanal",
      "Bear Shola Falls, Kodaikanal",
    ],
    viewpoints: ["Dolphin's Nose, Kodaikanal", "Green Valley View, Kodaikanal"],
    markets: ["Kodaikanal Market Road", "Tibetan Market, Kodaikanal"],
    hidden: ["Mannavanur Lake, Kodaikanal", "Poombarai Village View, Kodaikanal"],
  },
  coorg: {
    city: "Coorg",
    railway: "Mysuru Junction Railway Station",
    airport: "Mangaluru International Airport",
    busStand: "Madikeri Bus Stand, Coorg",
    stays: ["Club Mahindra Madikeri Coorg", "Amanvana Spa Resort, Coorg", "Hotel Mayura Valley View, Madikeri"],
    breakfast: ["Coorg Cuisine, Madikeri", "Hotel Capitol, Madikeri", "Tiger Tiger Cafe, Madikeri"],
    lunch: ["East End Hotel, Madikeri", "Raintree Restaurant, Coorg", "Coorg Food Court, Madikeri"],
    dinner: ["Tyagaraja Restaurant, Madikeri", "Athithi Restaurant, Coorg", "The Piano Bar, Coorg"],
    cafes: ["Coorg Coffee House, Madikeri", "Cafe Kokum, Coorg"],
    sights: [
      "Abbey Falls, Madikeri",
      "Raja's Seat, Madikeri",
      "Dubare Elephant Camp, Coorg",
      "Namdroling Monastery, Bylakuppe",
      "Talacauvery, Coorg",
      "Iruppu Falls, Coorg",
    ],
    viewpoints: ["Mandalpatti Viewpoint, Coorg", "Raja's Seat Sunset Point, Madikeri"],
    markets: ["Madikeri Main Market", "Coorg Spice Market, Madikeri"],
    hidden: ["Chelavara Falls, Coorg", "Kotebetta Trek, Coorg"],
  },
  mumbai: {
    city: "Mumbai",
    railway: "Chhatrapati Shivaji Maharaj Terminus, Mumbai",
    airport: "Chhatrapati Shivaji Maharaj International Airport, Mumbai",
    busStand: "Mumbai Central Bus Depot",
    stays: ["Hotel Sea Palace Colaba", "Trident Nariman Point", "Abode Bombay, Colaba"],
    breakfast: ["Kyani & Co., Mumbai", "Britannia & Co., Ballard Estate", "Cafe Madras, Matunga"],
    lunch: ["Bademiya, Colaba", "Leopold Cafe, Colaba", "Gajalee, Vile Parle"],
    dinner: ["Trishna, Fort Mumbai", "The Table, Colaba", "Cafe Mondegar, Colaba"],
    cafes: ["Blue Tokai Coffee, Mumbai", "Prithvi Cafe, Juhu"],
    sights: [
      "Gateway of India, Mumbai",
      "Marine Drive, Mumbai",
      "Elephanta Caves, Mumbai",
      "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya, Mumbai",
      "Haji Ali Dargah, Mumbai",
      "Sanjay Gandhi National Park, Mumbai",
    ],
    viewpoints: ["Bandra Worli Sea Link Viewpoint, Mumbai", "Bandra Bandstand, Mumbai"],
    markets: ["Colaba Causeway Market, Mumbai", "Crawford Market, Mumbai"],
    hidden: ["Banganga Tank, Mumbai", "Global Vipassana Pagoda, Mumbai"],
  },
};

function genericGuide(city: string): CityGuide {
  return {
    city,
    stays: [`Hotel in central ${city}`],
    breakfast: [`Popular breakfast spot in ${city} town centre`],
    lunch: [`Well-rated local restaurant in ${city}`],
    dinner: [`Top-rated dinner restaurant in ${city}`],
    cafes: [`Popular cafe in ${city}`],
    sights: [
      `Main tourist attraction in ${city}`,
      `Famous temple or heritage site in ${city}`,
      `Lake or waterfall near ${city}`,
      `Museum in ${city}`,
    ],
    viewpoints: [`Best sunset viewpoint in ${city}`],
    markets: [`Main market in ${city}`],
    hidden: [`Offbeat spot near ${city}`],
  };
}

/** Looks up a real place book for the destination, falling back to descriptive searches. */
export function getCityGuide(destination: string): CityGuide {
  const city = destination.split(",")[0]?.trim() || destination.trim();
  const key = city.toLowerCase().replace(/\s+/g, "");
  const aliases: Record<string, string> = {
    udhagamandalam: "ooty",
    udagamandalam: "ooty",
    puducherry: "pondicherry",
    panaji: "goa",
    panjim: "goa",
    madikeri: "coorg",
    kodagu: "coorg",
    bombay: "mumbai",
  };
  const hit = GUIDES[key] ?? GUIDES[aliases[key] ?? ""];
  if (hit) return hit;
  for (const [guideKey, guide] of Object.entries(GUIDES)) {
    if (key.includes(guideKey)) return guide;
  }
  return genericGuide(city);
}

/** Cycles a list so repeated days never reuse the same venue back to back. */
export function pick<T>(list: T[], index: number, fallback: T): T {
  if (!list.length) return fallback;
  return list[((index % list.length) + list.length) % list.length] ?? fallback;
}
