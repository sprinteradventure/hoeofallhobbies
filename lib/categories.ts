export interface CategoryGroup {
  name: string
  slug: string
  subcategories: string[]
  icon?: string
  description?: string
}

// Name of the category that supports user-created custom subcategories
export const COLLECTIBLES_CATEGORY_NAME = 'Collectibles'

// ── HOBBIES CATEGORIES (hoeofallhobbies.com) ───────────────────────────────
// All craft and hobby supplies EXCEPT seasonal decor and party supplies

export const HOBBIES_CATEGORIES: CategoryGroup[] = [
  {
    name: 'Fabric & Sewing',
    slug: 'fabric-sewing',
    description: 'Quilting cotton, apparel fabric, patterns, thread & notions',
    subcategories: [
      'Quilting Cotton', 'Apparel Fabric', 'Flannel', 'Fleece', 'Upholstery',
      'Specialty Fabrics', 'Fabric Bundles', 'Commercial Patterns',
      'PDF Patterns', 'Thread', 'Zippers', 'Elastic', 'Bias Tape', 'Ribbon',
      'Trim & Lace', 'Sergers', 'Cutting Tools', 'Pressing Tools', 'Misc'
    ]
  },
  {
    name: 'Yarn & Fiber Arts',
    slug: 'yarn-fiber-arts',
    description: 'Yarn, knitting needles, crochet hooks, spinning wheels',
    subcategories: [
      'Acrylic Yarn', 'Wool Yarn', 'Cotton Yarn', 'Alpaca Yarn', 'Luxury Fibers',
      'Yarn Lots', 'Knitting Needles', 'Stitch Markers', 'Knitting Kits',
      'Crochet Hooks', 'Crochet Patterns', 'Crochet Kits', 'Roving',
      'Spinning Wheels', 'Drop Spindles', 'Cross Stitch', 'Needlepoint',
      'Embroidery', 'Punch Needle', 'Misc'
    ]
  },
  {
    name: 'Paper Crafts',
    slug: 'paper-crafts',
    description: 'Scrapbooking, card making, journaling, stickers',
    subcategories: [
      'Scrapbooking', 'Card Making', 'Journaling', 'Stickers', 'Rubber Stamps',
      'Dies & Embossing Folders', 'Cutting Machines', 'Craft Punches', 'Misc'
    ]
  },
  {
    name: 'Cricut & Cutting Machines',
    slug: 'cricut-cutting',
    description: 'Cricut, Silhouette, vinyl, transfer tape & blanks',
    subcategories: [
      'Cricut Supplies', 'Silhouette Supplies', 'Vinyl', 'Transfer Tape',
      'Blanks', 'Tools & Accessories', 'Misc'
    ]
  },
  {
    name: 'Art Supplies',
    slug: 'art-supplies',
    description: 'Paint, brushes, canvas, drawing supplies & easels',
    subcategories: [
      'Paint', 'Brushes', 'Canvas', 'Drawing Supplies', 'Easels', 'Art Storage', 'Misc'
    ]
  },
  {
    name: 'Jewelry Making',
    slug: 'jewelry-making',
    description: 'Beads, findings, wire, resin jewelry & metal stamping',
    subcategories: [
      'Beads', 'Findings', 'Wire', 'Resin Jewelry Supplies', 'Metal Stamping',
      'Jewelry Tools', 'Jewelry Kits', 'Misc'
    ]
  },
  {
    name: 'Resin & Molds',
    slug: 'resin-molds',
    description: 'Epoxy resin, UV resin, silicone molds, pigments & tumblers',
    subcategories: [
      'Epoxy Resin', 'UV Resin', 'Silicone Molds', 'Pigments', 'Glitter',
      'Tumblers', 'Casting Supplies', 'Misc'
    ]
  },
  {
    name: 'Clay & Pottery',
    slug: 'clay-pottery',
    description: 'Polymer clay, air dry clay, ceramic supplies & glazes',
    subcategories: [
      'Polymer Clay', 'Air Dry Clay', 'Ceramic Supplies', 'Pottery Tools',
      'Glazes', 'Clay Molds', 'Misc'
    ]
  },
  {
    name: 'Candle & Soap Making',
    slug: 'candle-soap',
    description: 'Wax, wicks, fragrance oils, soap bases & colorants',
    subcategories: [
      'Wax', 'Wicks', 'Fragrance Oils', 'Candle Molds', 'Soap Bases',
      'Colorants', 'Packaging', 'Misc'
    ]
  },
  {
    name: 'Stained Glass Making',
    slug: 'stained-glass',
    description: 'Glass sheets, copper foil, lead came, solder, grinders & patterns',
    subcategories: [
      'Glass Sheets & Panels', 'Copper Foil', 'Lead Came', 'Solder & Flux',
      'Glass Grinders', 'Glass Cutters & Tools', 'Patterns & Kits', 'Finishing Supplies', 'Misc'
    ]
  },
  {
    name: 'Floral & Nature Crafts',
    slug: 'floral-nature',
    description: 'Artificial flowers, dried flowers, wreath supplies & pressed flowers',
    subcategories: [
      'Artificial Flowers', 'Dried Flowers', 'Wreath Supplies', 'Floral Foam',
      'Pressed Flowers', 'Terrarium Supplies', 'Misc'
    ]
  },
  {
    name: 'Woodworking & DIY',
    slug: 'woodworking-diy',
    description: 'Wood blanks, wood burning, signs, paint & hardware',
    subcategories: [
      'Wood Blanks', 'Wood Burning', 'Signs', 'Paint & Finishes', 'Hardware', 'DIY Kits', 'Misc'
    ]
  },
  {
    name: 'Miniatures & Models',
    slug: 'miniatures-models',
    description: 'Dollhouse miniatures, terrain building, model railroads & gaming scenery',
    subcategories: [
      'Dollhouse Miniatures', 'Terrain Building', 'Model Railroads', 'Plastic Models',
      'Miniature Painting', 'Gaming Scenery', 'Misc'
    ]
  },
  {
    name: 'Cosplay & Costume Making',
    slug: 'cosplay-costume',
    description: 'Foam, Worbla, costume fabrics, props, wigs & accessories',
    subcategories: [
      'Foam', 'Worbla', 'Costume Fabrics', 'Props', 'Costume Patterns',
      'Wigs & Accessories', 'Misc'
    ]
  },
  {
    name: 'Sublimation & Printing',
    slug: 'sublimation-printing',
    description: 'Sublimation paper, ink, blanks, heat presses & accessories',
    subcategories: [
      'Sublimation Paper', 'Sublimation Ink', 'Sublimation Blanks', 'Heat Presses',
      'Printing Accessories', 'Misc'
    ]
  },
  {
    name: '3D Printing',
    slug: '3d-printing',
    description: 'Filament, resin, printers, parts & tools',
    subcategories: [
      'Filament', '3D Resin', '3D Printers', 'Printer Parts', '3D Printing Tools', 'Misc'
    ]
  },
  // ── Collectibles: user-created subcategories ─────────────────────────────
  {
    name: COLLECTIBLES_CATEGORY_NAME,
    slug: 'collectibles',
    description: 'Trading cards, figurines, memorabilia, and collectible items — create your own subcategory',
    subcategories: [
      'Trading Cards', 'Figurines', 'Memorabilia', 'Coins & Currency',
      'Stamps', 'Comics', 'Action Figures', 'Dolls',
      'Vinyl Records', 'Autographs', 'Other'
    ]
  },
  {
    name: 'Vintage & Collectible Supplies',
    slug: 'vintage-collectible',
    description: 'Vintage buttons, fabric, patterns, retired scrapbooking & rare supplies',
    subcategories: [
      'Vintage Buttons', 'Vintage Fabric', 'Vintage Patterns', 'Retired Scrapbooking',
      'Antique Sewing Items', 'Rare Supplies', 'Misc'
    ]
  },
  {
    name: 'Unfinished Projects (UFOs)',
    slug: 'ufos',
    description: 'Sewing projects, quilt tops, knitting WIPs, scrapbook kits & more',
    subcategories: [
      'Sewing Projects', 'Quilt Tops', 'Knitting WIPs', 'Crochet WIPs',
      'Scrapbook Kits', 'Model Kits', 'Mixed Media Projects', 'Misc'
    ]
  },
  {
    name: 'Estate & Destash Sales',
    slug: 'estate-destash',
    description: 'Entire craft rooms, estate collections, bulk lots & mystery boxes',
    subcategories: [
      'Entire Craft Rooms', 'Estate Collections', 'Bulk Fabric Lots', 'Bulk Yarn Lots',
      'Business Liquidations', 'Mystery Boxes', 'Misc'
    ]
  },
  {
    name: 'Bulk Supplies',
    slug: 'bulk-supplies',
    description: 'Surplus t-shirts, apparel blanks, drinkware, tote bags & wholesale lots',
    subcategories: [
      'T-Shirt Blanks', 'Apparel Blanks', 'Tote & Bag Blanks', 'Hat & Cap Blanks',
      'Drinkware Blanks', 'Surplus & Overstock Lots', 'Wholesale Packs', 'Misc'
    ]
  },
  {
    name: 'Tools & Equipment',
    slug: 'tools-equipment',
    description: 'Sewing machines, heat presses, pottery wheels, looms & craft storage',
    subcategories: [
      'Sewing Machines', 'Heat Presses', 'Pottery Wheels',
      'Looms', 'Embroidery Machines', 'Craft Storage', 'Misc'
    ]
  },
  {
    name: 'Handmade Supplies',
    slug: 'handmade-supplies',
    description: 'Hand-dyed yarn, handmade beads, custom molds & artisan fabric',
    subcategories: [
      'Hand-Dyed Yarn', 'Handmade Beads', 'Custom Molds', 'Handcrafted Findings',
      'Artisan Fabric', 'Misc'
    ]
  },
  {
    name: 'Free & Trade',
    slug: 'free-trade',
    description: 'Free supplies, swap & trade, local pickup only',
    subcategories: [
      'Free Supplies', 'Swap & Trade', 'Local Pickup Only', 'Misc'
    ]
  }
]

// ── HOLIDAY CATEGORIES (hoeofallholidays.com) ──────────────────────────────
// Holiday decor, party supplies, and celebration essentials for every culture

export const HOLIDAY_CATEGORIES: CategoryGroup[] = [
  {
    name: 'Christmas & Winter Holidays',
    slug: 'christmas-winter',
    description: 'Ornaments, trees, lights, nativity scenes, wreaths, garlands & winter decor',
    subcategories: [
      'Ornaments', 'Christmas Trees', 'Tree Toppers', 'Lights & LEDs',
      'Nativity Scenes', 'Wreaths', 'Garlands', 'Stockings',
      'Advent Calendars', 'Village Displays', 'Snow Globes',
      'Wrapping Paper & Bags', 'Christmas Cards', 'Outdoor Decor', 'Misc'
    ]
  },
  {
    name: 'Halloween & Fall',
    slug: 'halloween-fall',
    description: 'Costumes, decorations, pumpkins, spooky decor & autumn harvest',
    subcategories: [
      'Costumes & Masks', 'Indoor Decorations', 'Outdoor Decorations',
      'Pumpkins & Gourds', 'Spooky Lighting', 'Party Props',
      'Fall Wreaths', 'Harvest Decor', 'Thanksgiving Supplies', 'Misc'
    ]
  },
  {
    name: 'Easter & Spring',
    slug: 'easter-spring',
    description: 'Baskets, eggs, bunny decor, pastel tableware & spring florals',
    subcategories: [
      'Easter Baskets', 'Decorative Eggs', 'Bunny Decor', 'Pastel Tableware',
      'Spring Wreaths', 'Floral Arrangements', 'Garden Party Decor', 'Misc'
    ]
  },
  {
    name: "Valentine's Day & Romance",
    slug: 'valentines-romance',
    description: 'Hearts, roses, romantic gifts, date night decor & love-themed party supplies',
    subcategories: [
      'Heart Decorations', 'Rose Arrangements', 'Romantic Lighting',
      'Date Night Kits', 'Love Cards', 'Gift Boxes & Wrap', 'Misc'
    ]
  },
  {
    name: 'St. Patrick\'s Day & Irish',
    slug: 'st-patricks-irish',
    description: 'Shamrocks, green decor, Irish-themed party supplies & pub decorations',
    subcategories: [
      'Shamrock Decor', 'Green Lighting', 'Irish Banners', 'Pub Party Supplies',
      'Leprechaun Props', 'Clover Wreaths', 'Misc'
    ]
  },
  {
    name: 'Independence Day & Patriotic',
    slug: 'patriotic',
    description: 'Flags, red-white-blue decor, fireworks accessories & patriotic party supplies',
    subcategories: [
      'Flags & Bunting', 'Red-White-Blue Tableware', 'Patriotic Banners',
      'Fireworks Accessories', 'Military Tribute Decor', 'Memorial Day Supplies', 'Misc'
    ]
  },
  {
    name: 'Diwali & Hindu Celebrations',
    slug: 'diwali-hindu',
    description: 'Diyas, rangoli, lanterns, Lakshmi decor & festival lights',
    subcategories: [
      'Diyas & Candles', 'Rangoli Supplies', 'Festival Lanterns',
      'Lakshmi & Ganesh Decor', 'Marigold Garlands', 'Torans',
      'Puja Supplies', 'Festive Sweets Boxes', 'Misc'
    ]
  },
  {
    name: 'Lunar New Year',
    slug: 'lunar-new-year',
    description: 'Red envelopes, lanterns, couplets, zodiac decor & traditional ornaments',
    subcategories: [
      'Red Envelopes', 'Paper Lanterns', 'Door Couplets', 'Zodiac Decor',
      'Firecrackers (Decorative)', 'Peach Blossoms', 'Kumquat Trees',
      'Festive Tableware', 'Misc'
    ]
  },
  {
    name: 'Eid & Islamic Celebrations',
    slug: 'eid-islamic',
    description: 'Eid Mubarak banners, crescent moons, henna supplies & Ramadan decor',
    subcategories: [
      'Eid Mubarak Banners', 'Crescent Moon Decor', 'Ramadan Lanterns (Fanous)',
      'Henna Supplies', 'Islamic Calligraphy Art', 'Eid Gift Wrap',
      'Prayer Mats (Decorative)', 'Iftar Tableware', 'Misc'
    ]
  },
  {
    name: 'Hanukkah & Jewish Celebrations',
    slug: 'hanukkah-jewish',
    description: 'Menorahs, dreidels, blue-silver decor, Star of David ornaments & Passover supplies',
    subcategories: [
      'Menorahs', 'Dreidels', 'Blue & Silver Decor', 'Star of David Ornaments',
      'Hanukkah Cards', 'Gelt & Chocolate', 'Passover Tableware',
      'Seder Plates', 'Misc'
    ]
  },
  {
    name: 'Kwanzaa',
    slug: 'kwanzaa',
    description: 'Kinara candles, mkeka mats, kente cloth decor & unity cup sets',
    subcategories: [
      'Kinara & Candles', 'Mkeka Mats', 'Kente Cloth Decor',
      'Unity Cups (Kikombe)', 'Fruit Baskets (Mazao)', 'Corn Displays (Muhindi)',
      'Kwanzaa Cards', 'African Fabric Banners', 'Misc'
    ]
  },
  {
    name: 'Day of the Dead (Día de los Muertos)',
    slug: 'dia-de-los-muertos',
    description: 'Sugar skulls, marigolds, papel picado, ofrenda supplies & Catrina decor',
    subcategories: [
      'Sugar Skulls & Molds', 'Marigold Garlands', 'Papel Picado',
      'Ofrenda Supplies', 'Catrina Figures', 'Candle Holders',
      'Pan de Muerto Supplies', 'Face Paint Kits', 'Misc'
    ]
  },
  {
    name: 'Oktoberfest & German',
    slug: 'oktoberfest-german',
    description: 'Beer steins, Bavarian banners, checkered decor & pretzel-themed supplies',
    subcategories: [
      'Beer Steins & Mugs', 'Bavarian Banners', 'Blue-White Checkered Decor',
      'Pretzel Decorations', 'LED String Lights', 'German Tableware', 'Misc'
    ]
  },
  {
    name: 'Cinco de Mayo',
    slug: 'cinco-de-mayo',
    description: 'Piñatas, papel picado, sombrero decor, maracas & fiesta supplies',
    subcategories: [
      'Piñatas', 'Papel Picado', 'Sombrero Decor', 'Maracas',
      'Fiesta Banners', 'Mexican Blankets (Serapes)', 'Margarita Glass Sets', 'Misc'
    ]
  },
  {
    name: 'Chinese Mid-Autumn Festival',
    slug: 'mid-autumn-festival',
    description: 'Mooncake molds, rabbit decor, paper lanterns & full moon themed items',
    subcategories: [
      'Mooncake Molds', 'Jade Rabbit Decor', 'Round Paper Lanterns',
      'Full Moon Backdrops', 'Osmanthus Flower Decor', 'Festival Tea Sets', 'Misc'
    ]
  },
  {
    name: 'Japanese Festivals',
    slug: 'japanese-festivals',
    description: 'Cherry blossom decor, origami supplies, kimono accessories & festival fans',
    subcategories: [
      'Cherry Blossom (Sakura) Decor', 'Origami Paper & Kits', 'Festival Fans (Uchiwa)',
      'Kimono & Yukata Accessories', 'Paper Lanterns (Chochin)', 'Tanabata Bamboo Decor',
      'Obon Lanterns', 'Koinobori Windsocks', 'Misc'
    ]
  },
  {
    name: 'Indigenous & Native Celebrations',
    slug: 'indigenous-native',
    description: 'Native American craft supplies, powwow regalia materials & cultural decor',
    subcategories: [
      'Beadwork Supplies', 'Feather Decor', 'Powwow Regalia Materials',
      'Drum Making Supplies', 'Smudge Supplies', 'Dreamcatcher Kits',
      'Leather & Hide', 'Ribbon Work Supplies', 'Misc'
    ]
  },
  {
    name: 'Holi & Color Festivals',
    slug: 'holi-color',
    description: 'Color powders (gulal), water balloons, festival clothing & rainbow decor',
    subcategories: [
      'Color Powders (Gulal)', 'Water Balloons', 'Festival Clothing',
      'Rainbow Banners', 'Pichkaris (Water Guns)', 'Organic Colors',
      'Thandai Supplies', 'Color Run Supplies', 'Misc'
    ]
  },
  {
    name: 'Quinceañera & Sweet 16',
    slug: 'quinceanera-sweet16',
    description: 'Tiaras, sashes, themed centerpieces, photo backdrops & celebration kits',
    subcategories: [
      'Tiaras & Crowns', 'Sashes & Scepters', 'Themed Centerpieces',
      'Photo Backdrops', 'Balloon Arches', 'Candy Buffets',
      'Table Numbers', 'Entryway Decor', 'Misc'
    ]
  },
  {
    name: 'Weddings & Anniversaries',
    slug: 'weddings-anniversaries',
    description: 'Bridal shower decor, anniversary banners, table settings & romantic lighting',
    subcategories: [
      'Bridal Shower Decor', 'Anniversary Banners', 'Table Centerpieces',
      'Romantic Lighting', 'Aisle Runners', 'Flower Arrangements',
      'Ring Bearer Supplies', 'Send-Off Supplies', 'Misc'
    ]
  },
  {
    name: 'Baby Showers',
    slug: 'baby-showers',
    description: 'Gender reveal supplies, diaper cakes, nursery decor & welcome baby banners',
    subcategories: [
      'Gender Reveal Supplies', 'Diaper Cakes', 'Nursery Decor',
      'Welcome Baby Banners', 'Baby Photo Props', 'Onesie Decorating',
      'Baby Shower Games', 'Favor Bags', 'Misc'
    ]
  },
  {
    name: 'Birthdays',
    slug: 'birthdays',
    description: 'Age number decor, cake toppers, themed banners, party hats & goodie bags',
    subcategories: [
      'Age Number Decor', 'Cake Toppers', 'Themed Banners',
      'Party Hats & Crowns', 'Goodie Bags', 'Confetti & Streamers',
      'Birthday Candles', 'Pin the Tail Games', 'Misc'
    ]
  },
  {
    name: 'Graduation',
    slug: 'graduation',
    description: 'Cap & gown accessories, congratulation banners, photo props & party supplies',
    subcategories: [
      'Cap & Gown Accessories', 'Congratulation Banners', 'Graduation Photo Props',
      'Class Year Decor', 'Diploma Frames', 'Graduation Balloons',
      'Senior Party Supplies', 'School Color Decor', 'Misc'
    ]
  },
  {
    name: 'Retirement & Milestones',
    slug: 'retirement-milestones',
    description: 'Retirement banners, memory boards, gold watch themed decor & celebration kits',
    subcategories: [
      'Retirement Banners', 'Memory Boards', 'Gold Themed Decor',
      'Time to Relax Signs', 'Travel Theme Decor', 'Hobby Themed Parties',
      'Milestone Numbers', 'Toast Supplies', 'Misc'
    ]
  },
  {
    name: 'Housewarming',
    slug: 'housewarming',
    description: 'Welcome home signs, new home ornaments, plant gifts & hostess supplies',
    subcategories: [
      'Welcome Home Signs', 'New Home Ornaments', 'Plant Gifts',
      'Hostess Supplies', 'Cozy Home Decor', 'Key-shaped Decor',
      'Home Sweet Home Signs', 'Scented Candles', 'Misc'
    ]
  },
  {
    name: 'Backdrops & Photo Props',
    slug: 'backdrops-photo-props',
    description: 'Step & repeat banners, balloon walls, photo booth props & scene setters',
    subcategories: [
      'Step & Repeat Banners', 'Balloon Walls', 'Photo Booth Props',
      'Scene Setters', 'Fabric Backdrops', 'Flower Walls',
      'Neon Signs', 'Sequin Curtains', 'Misc'
    ]
  },
  {
    name: 'Party Supplies & Tableware',
    slug: 'party-tableware',
    description: 'Plates, cups, napkins, utensils, tablecloths & servingware for every occasion',
    subcategories: [
      'Plates & Bowls', 'Cups & Glasses', 'Napkins', 'Utensils',
      'Tablecloths & Runners', 'Serving Trays', 'Drink Dispensers',
      'Cake Stands', 'Candy Dishes', 'Buffet Supplies', 'Misc'
    ]
  },
  {
    name: 'Balloons & Banners',
    slug: 'balloons-banners',
    description: 'Latex & foil balloons, balloon arches, letter banners, garlands & streamers',
    subcategories: [
      'Latex Balloons', 'Foil Balloons', 'Balloon Arches & Columns',
      'Letter & Number Balloons', 'Streamers', 'Pennant Banners',
      'Confetti Balloons', 'Balloon Weights', 'Helium Tanks', 'Misc'
    ]
  },
  {
    name: 'Themed Party Kits',
    slug: 'themed-party-kits',
    description: 'Complete party packages by theme — superheroes, princesses, decades, movies & more',
    subcategories: [
      'Superhero Themes', 'Princess & Fairy Themes', 'Decade Themes (70s, 80s, 90s)',
      'Movie & TV Themes', 'Sports Themes', 'Under the Sea',
      'Safari & Jungle', 'Space & Galaxy', 'Unicorn & Rainbow',
      'Pirate & Adventure', 'Masquerade & Formal', 'Misc'
    ]
  }
]

// ── LEGACY EXPORT ──────────────────────────────────────────────────────────
// Backward compatibility: ALL categories for admin pages, search, etc.
export const ALL_CATEGORIES: CategoryGroup[] = [
  ...HOBBIES_CATEGORIES,
  ...HOLIDAY_CATEGORIES,
]

// Default export still points to ALL for any code that hasn't migrated yet.
// New code should import HOBBIES_CATEGORIES or HOLIDAY_CATEGORIES directly,
// or use getCategories() / getSiteCategories().
export const CATEGORIES = ALL_CATEGORIES

// ── HELPERS ────────────────────────────────────────────────────────────────

export function getCategoryNames(categories?: CategoryGroup[]): string[] {
  return (categories || CATEGORIES).map(c => c.name)
}

export function getAllSubcategories(categories?: CategoryGroup[]): string[] {
  return (categories || CATEGORIES).flatMap(c => c.subcategories)
}

export function getSubcategoriesForCategory(
  categoryName: string,
  categories?: CategoryGroup[]
): string[] {
  const cat = (categories || CATEGORIES).find(
    c => c.name === categoryName || c.slug === categoryName
  )
  return cat?.subcategories || []
}

export function getCategoryBySlug(
  slug: string,
  categories?: CategoryGroup[]
): CategoryGroup | undefined {
  return (categories || CATEGORIES).find(c => c.slug === slug)
}

export function getCategoryByName(
  name: string,
  categories?: CategoryGroup[]
): CategoryGroup | undefined {
  return (categories || CATEGORIES).find(c => c.name === name)
}

// Check if a category supports user-created custom subcategories
export function isCollectiblesCategory(name: string): boolean {
  return name === COLLECTIBLES_CATEGORY_NAME
}

// Commission rate: 5% platform fee, 95% to seller
export const PLATFORM_FEE_PERCENT = 5
export const SELLER_KEEP_PERCENT = 95

export function calculateSellerRevenue(totalPrice: number): number {
  return totalPrice * (SELLER_KEEP_PERCENT / 100)
}

export function calculatePlatformFee(totalPrice: number): number {
  return totalPrice * (PLATFORM_FEE_PERCENT / 100)
}
