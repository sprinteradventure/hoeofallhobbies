export interface CategoryGroup {
  name: string
  slug: string
  subcategories: string[]
  icon?: string
  description?: string
}

export const CATEGORIES: CategoryGroup[] = [
  {
    name: 'Fabric & Sewing',
    slug: 'fabric-sewing',
    description: 'Quilting cotton, apparel fabric, sewing machines & more',
    subcategories: [
      'Quilting Cotton', 'Apparel Fabric', 'Flannel', 'Fleece', 'Upholstery',
      'Specialty Fabrics', 'Fabric Bundles', 'Commercial Patterns', 'Vintage Patterns',
      'PDF Patterns', 'Thread', 'Zippers', 'Elastic', 'Bias Tape', 'Ribbon',
      'Trim & Lace', 'Sewing Machines', 'Sergers', 'Cutting Tools', 'Pressing Tools'
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
      'Embroidery', 'Punch Needle'
    ]
  },
  {
    name: 'Paper Crafts',
    slug: 'paper-crafts',
    description: 'Scrapbooking, card making, journaling, stickers',
    subcategories: [
      'Scrapbooking', 'Card Making', 'Journaling', 'Stickers', 'Rubber Stamps',
      'Dies & Embossing Folders', 'Cutting Machines', 'Craft Punches'
    ]
  },
  {
    name: 'Cricut & Cutting Machines',
    slug: 'cricut-cutting',
    description: 'Cricut, Silhouette, vinyl, transfer tape & blanks',
    subcategories: [
      'Cricut Supplies', 'Silhouette Supplies', 'Vinyl', 'Transfer Tape',
      'Blanks', 'Tools & Accessories'
    ]
  },
  {
    name: 'Art Supplies',
    slug: 'art-supplies',
    description: 'Paint, brushes, canvas, drawing supplies & easels',
    subcategories: [
      'Paint', 'Brushes', 'Canvas', 'Drawing Supplies', 'Easels', 'Art Storage'
    ]
  },
  {
    name: 'Jewelry Making',
    slug: 'jewelry-making',
    description: 'Beads, findings, wire, resin jewelry & metal stamping',
    subcategories: [
      'Beads', 'Findings', 'Wire', 'Resin Jewelry Supplies', 'Metal Stamping',
      'Jewelry Tools', 'Jewelry Kits'
    ]
  },
  {
    name: 'Resin & Molds',
    slug: 'resin-molds',
    description: 'Epoxy resin, UV resin, silicone molds, pigments & tumblers',
    subcategories: [
      'Epoxy Resin', 'UV Resin', 'Silicone Molds', 'Pigments', 'Glitter',
      'Tumblers', 'Casting Supplies'
    ]
  },
  {
    name: 'Clay & Pottery',
    slug: 'clay-pottery',
    description: 'Polymer clay, air dry clay, ceramic supplies & glazes',
    subcategories: [
      'Polymer Clay', 'Air Dry Clay', 'Ceramic Supplies', 'Pottery Tools',
      'Glazes', 'Clay Molds'
    ]
  },
  {
    name: 'Candle & Soap Making',
    slug: 'candle-soap',
    description: 'Wax, wicks, fragrance oils, soap bases & colorants',
    subcategories: [
      'Wax', 'Wicks', 'Fragrance Oils', 'Candle Molds', 'Soap Bases',
      'Colorants', 'Packaging'
    ]
  },
  {
    name: 'Floral & Nature Crafts',
    slug: 'floral-nature',
    description: 'Artificial flowers, dried flowers, wreath supplies & pressed flowers',
    subcategories: [
      'Artificial Flowers', 'Dried Flowers', 'Wreath Supplies', 'Floral Foam',
      'Pressed Flowers', 'Terrarium Supplies'
    ]
  },
  {
    name: 'Woodworking & DIY',
    slug: 'woodworking-diy',
    description: 'Wood blanks, wood burning, signs, paint & hardware',
    subcategories: [
      'Wood Blanks', 'Wood Burning', 'Signs', 'Paint & Finishes', 'Hardware', 'DIY Kits'
    ]
  },
  {
    name: 'Miniatures & Models',
    slug: 'miniatures-models',
    description: 'Dollhouse miniatures, terrain building, model railroads & gaming scenery',
    subcategories: [
      'Dollhouse Miniatures', 'Terrain Building', 'Model Railroads', 'Plastic Models',
      'Miniature Painting', 'Gaming Scenery'
    ]
  },
  {
    name: 'Cosplay & Costume Making',
    slug: 'cosplay-costume',
    description: 'Foam, Worbla, costume fabrics, props, wigs & accessories',
    subcategories: [
      'Foam', 'Worbla', 'Costume Fabrics', 'Props', 'Costume Patterns',
      'Wigs & Accessories'
    ]
  },
  {
    name: 'Sublimation & Printing',
    slug: 'sublimation-printing',
    description: 'Sublimation paper, ink, blanks, heat presses & accessories',
    subcategories: [
      'Sublimation Paper', 'Sublimation Ink', 'Sublimation Blanks', 'Heat Presses',
      'Printing Accessories'
    ]
  },
  {
    name: '3D Printing',
    slug: '3d-printing',
    description: 'Filament, resin, printers, parts & tools',
    subcategories: [
      'Filament', '3D Resin', '3D Printers', 'Printer Parts', '3D Printing Tools'
    ]
  },
  {
    name: 'Seasonal Crafts',
    slug: 'seasonal',
    description: 'Christmas, Halloween, Easter, fall harvest & patriotic',
    subcategories: [
      'Christmas', 'Halloween', 'Easter', 'Fall Harvest', "Valentine's Day", 'Patriotic'
    ]
  },
  {
    name: 'Vintage & Collectible Supplies',
    slug: 'vintage-collectible',
    description: 'Vintage buttons, fabric, patterns, retired scrapbooking & rare supplies',
    subcategories: [
      'Vintage Buttons', 'Vintage Fabric', 'Vintage Patterns', 'Retired Scrapbooking',
      'Antique Sewing Items', 'Rare Supplies'
    ]
  },
  {
    name: 'Unfinished Projects (UFOs)',
    slug: 'ufos',
    description: 'Sewing projects, quilt tops, knitting WIPs, scrapbook kits & more',
    subcategories: [
      'Sewing Projects', 'Quilt Tops', 'Knitting WIPs', 'Crochet WIPs',
      'Scrapbook Kits', 'Model Kits', 'Mixed Media Projects'
    ]
  },
  {
    name: 'Estate & Destash Sales',
    slug: 'estate-destash',
    description: 'Entire craft rooms, estate collections, bulk lots & mystery boxes',
    subcategories: [
      'Entire Craft Rooms', 'Estate Collections', 'Bulk Fabric Lots', 'Bulk Yarn Lots',
      'Business Liquidations', 'Mystery Boxes'
    ]
  },
  {
    name: 'Tools & Equipment',
    slug: 'tools-equipment',
    description: 'Sewing machines, Cricut machines, heat presses, looms & craft storage',
    subcategories: [
      'Sewing Machines', 'Cricut Machines', 'Heat Presses', 'Pottery Wheels',
      'Looms', 'Embroidery Machines', 'Craft Storage'
    ]
  },
  {
    name: 'Handmade Supplies',
    slug: 'handmade-supplies',
    description: 'Hand-dyed yarn, handmade beads, custom molds & artisan fabric',
    subcategories: [
      'Hand-Dyed Yarn', 'Handmade Beads', 'Custom Molds', 'Handcrafted Findings',
      'Artisan Fabric'
    ]
  },
  {
    name: 'Party',
    slug: 'party',
    description: 'Party supplies, balloons, decorations, tableware, favors & themed kits',
    subcategories: [
      'Party Supplies', 'Balloons', 'Decorations', 'Tableware', 'Party Favors',
      'Backdrops', 'Invitations', 'Cake Supplies', 'Piñatas', 'Streamers & Banners',
      'Themed Party Kits', 'Gift Bags & Wrap', 'Centerpieces'
    ]
  },
  {
    name: 'Free & Trade',
    slug: 'free-trade',
    description: 'Free supplies, swap & trade, local pickup only',
    subcategories: [
      'Free Supplies', 'Swap & Trade', 'Local Pickup Only'
    ]
  }
]

export function getCategoryNames(): string[] {
  return CATEGORIES.map(c => c.name)
}

export function getAllSubcategories(): string[] {
  return CATEGORIES.flatMap(c => c.subcategories)
}

export function getSubcategoriesForCategory(categoryName: string): string[] {
  const cat = CATEGORIES.find(c => c.name === categoryName || c.slug === categoryName)
  return cat?.subcategories || []
}

export function getCategoryBySlug(slug: string): CategoryGroup | undefined {
  return CATEGORIES.find(c => c.slug === slug)
}

export function getCategoryByName(name: string): CategoryGroup | undefined {
  return CATEGORIES.find(c => c.name === name)
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
