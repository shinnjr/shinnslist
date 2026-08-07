import { InterestCategory, InterestGrouping, OnboardingCard } from '@/types';

// Complete interest taxonomy.
// Groupings are pre-built bundles; categories are atomic interests; cards are onboarding prompts.

export const INTEREST_GROUPINGS: InterestGrouping[] = [
  {
    id: 'having-baby', emoji: '🍼', label: 'Having a Baby',
    description: 'Nursery furniture, baby gear, maternity clothes, toys',
    categories: ['baby-kids', 'furniture', 'clothing', 'toys-games'],
  },
  {
    id: 'furnishing-home', emoji: '🏠', label: 'Furnishing a New Place',
    description: 'Couches, tables, kitchenware, decor, appliances',
    categories: ['furniture', 'home-decor', 'kitchen', 'appliances'],
  },
  {
    id: 'family-bikes', emoji: '🚲', label: 'Family Bikes',
    description: 'Bikes, trailers, helmets, racks for the whole family',
    categories: ['bikes-cycling', 'outdoor-recreation', 'sports-equipment'],
  },
  {
    id: 'starting-band', emoji: '🎸', label: 'Starting a Band',
    description: 'Instruments, amps, PA systems, recording gear',
    categories: ['musical-instruments', 'electronics', 'furniture'],
  },
  {
    id: 'camping-gear', emoji: '🏕️', label: 'Camping Gear',
    description: 'Tents, sleeping bags, stoves, coolers, packs',
    categories: ['camping-outdoors', 'sports-equipment', 'automotive'],
  },
  {
    id: 'new-dog', emoji: '🐕', label: 'New Dog',
    description: 'Crates, beds, bowls, leashes, toys, gates',
    categories: ['pet-supplies', 'home-decor', 'outdoor-recreation'],
  },
  {
    id: 'college-dorm', emoji: '🎓', label: 'College Dorm',
    description: 'Mini-fridge, microwave, bedding, storage, desk stuff',
    categories: ['furniture', 'appliances', 'home-decor', 'electronics'],
  },
  {
    id: 'home-office', emoji: '🖥️', label: 'Home Office',
    description: 'Desks, chairs, monitors, keyboards, lighting',
    categories: ['furniture', 'electronics', 'home-decor'],
  },
];

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'furniture', emoji: '🪑', label: 'Furniture',
    subcategories: ['Sofas', 'Tables', 'Chairs', 'Beds', 'Dressers', 'Shelves', 'Desks', 'Bookcases'],
    keywords: ['couch', 'sofa', 'table', 'chair', 'desk', 'bed', 'dresser', 'shelf', 'nightstand', 'coffee table', 'dining', 'mattress', 'frame', 'futon', 'ottoman', 'bench', 'armoire', 'wardrobe'],
    msrpCategories: ['Furniture', 'Home & Garden > Furniture'],
  },
  {
    id: 'electronics', emoji: '📱', label: 'Electronics',
    subcategories: ['Phones', 'Laptops', 'Tablets', 'Monitors', 'TVs', 'Speakers', 'Headphones', 'Cameras', 'Game Consoles'],
    keywords: ['iphone', 'samsung', 'laptop', 'macbook', 'ipad', 'monitor', 'tv', 'television', 'speaker', 'headphone', 'airpod', 'camera', 'playstation', 'xbox', 'nintendo', 'switch', 'kindle', 'drone'],
    msrpCategories: ['Electronics', 'Cell Phones & Accessories', 'Computers/Tablets & Networking'],
  },
  {
    id: 'appliances', emoji: '🔌', label: 'Appliances',
    subcategories: ['Washers', 'Dryers', 'Refrigerators', 'Dishwashers', 'Microwaves', 'Stoves', 'Vacuums', 'Air Conditioners'],
    keywords: ['washer', 'dryer', 'fridge', 'refrigerator', 'dishwasher', 'microwave', 'stove', 'oven', 'range', 'vacuum', 'ac', 'air conditioner', 'freezer', 'dehumidifier', 'heater', 'water heater'],
    msrpCategories: ['Home Appliances', 'Major Appliances', 'Small Kitchen Appliances'],
  },
  {
    id: 'baby-kids', emoji: '👶', label: 'Baby & Kids',
    subcategories: ['Strollers', 'Car Seats', 'Cribs', 'High Chairs', 'Clothes', 'Toys', 'Diapers', 'Bouncers'],
    keywords: ['stroller', 'car seat', 'crib', 'high chair', 'baby', 'toddler', 'onesie', 'diaper', 'bouncer', 'swing', 'changing table', 'bassinet', 'playpen', 'pack n play', 'baby clothes', 'maternity'],
    msrpCategories: ['Baby', 'Baby Essentials', 'Strollers & Accessories'],
  },
  {
    id: 'clothing', emoji: '👗', label: 'Clothing & Accessories',
    subcategories: ['Women', 'Men', 'Kids', 'Shoes', 'Bags', 'Jewelry', 'Watches'],
    keywords: ['shirt', 'dress', 'jacket', 'shoes', 'boots', 'sneakers', 'handbag', 'purse', 'wallet', 'watch', 'necklace', 'ring', 'bracelet', 'coat', 'jeans', 'sweater', 'hoodie', 'hat', 'sunglasses'],
    msrpCategories: ['Clothing, Shoes & Accessories', 'Jewelry & Watches'],
  },
  {
    id: 'home-decor', emoji: '🖼️', label: 'Home Decor',
    subcategories: ['Rugs', 'Lamps', 'Art', 'Mirrors', 'Plants', 'Curtains', 'Pillows', 'Vases'],
    keywords: ['rug', 'lamp', 'painting', 'art', 'mirror', 'plant', 'curtain', 'pillow', 'vase', 'candle', 'clock', 'frame', 'tapestry', 'figurine', 'basket', 'throw blanket'],
    msrpCategories: ['Home & Garden > Home Décor', 'Crafts > Home Decor'],
  },
  {
    id: 'kitchen', emoji: '🍳', label: 'Kitchen & Dining',
    subcategories: ['Cookware', 'Small Appliances', 'Dinnerware', 'Cutlery', 'Glassware', 'Bakeware'],
    keywords: ['pot', 'pan', 'knife', 'blender', 'mixer', 'toaster', 'air fryer', 'instant pot', 'plate', 'bowl', 'cup', 'mug', 'utensil', 'cutting board', 'coffee maker', 'espresso', 'food processor'],
    msrpCategories: ['Home & Garden > Kitchen, Dining & Bar', 'Consumer Electronics > Small Kitchen Appliances'],
  },
  {
    id: 'sports-equipment', emoji: '⚽', label: 'Sports Equipment',
    subcategories: ['Gym', 'Yoga', 'Golf', 'Skiing', 'Team Sports', 'Water Sports', 'Fitness Tech'],
    keywords: ['treadmill', 'dumbbell', 'weights', 'barbell', 'yoga mat', 'exercise bike', 'peloton', 'golf club', 'skis', 'snowboard', 'tent', 'sleeping bag', 'kayak', 'paddleboard', 'surfboard', 'basketball', 'football'],
    msrpCategories: ['Sporting Goods', 'Sports Mem, Cards & Fan Shop'],
  },
  {
    id: 'bikes-cycling', emoji: '🚴', label: 'Bikes & Cycling',
    subcategories: ['Road Bikes', 'Mountain Bikes', 'E-Bikes', 'Kids Bikes', 'Accessories', 'Racks'],
    keywords: ['bike', 'bicycle', 'mountain bike', 'road bike', 'ebike', 'helmet', 'bike rack', 'trainer', 'pedal', 'cyclocross', 'fixie', 'bmx', 'tricycle'],
    msrpCategories: ['Sporting Goods > Cycling', 'eBay Motors > Scooters & Mopeds'],
  },
  {
    id: 'camping-outdoors', emoji: '⛺', label: 'Camping & Outdoors',
    subcategories: ['Tents', 'Sleeping Bags', 'Camp Stoves', 'Coolers', 'Backpacks', 'Hiking Gear', 'Fishing'],
    keywords: ['tent', 'sleeping bag', 'camp stove', 'cooler', 'yeti', 'backpack', 'hiking', 'fishing rod', 'lantern', 'hammock', 'tarp', 'camp chair', 'headlamp', 'compass', 'binoculars'],
    msrpCategories: ['Sporting Goods > Outdoor Sports', 'Camping & Hiking'],
  },
  {
    id: 'outdoor-recreation', emoji: '🏂', label: 'Outdoor Recreation',
    subcategories: ['Snow Sports', 'Water Sports', 'Climbing', 'Skateboarding', 'Hunting'],
    keywords: ['snowboard', 'skis', 'wakeboard', 'surfboard', 'climbing', 'skateboard', 'hunting', 'bow', 'crossbow', 'wetsuit', 'paddle', 'life jacket', 'goggles', 'boots'],
    msrpCategories: ['Sporting Goods > Winter Sports', 'Sporting Goods > Water Sports'],
  },
  {
    id: 'musical-instruments', emoji: '🎹', label: 'Musical Instruments',
    subcategories: ['Guitars', 'Drums', 'Keyboards', 'Amps', 'Recording Gear', 'DJ Equipment', 'Band Instruments'],
    keywords: ['guitar', 'drum', 'keyboard', 'piano', 'amp', 'amplifier', 'microphone', 'mixer', 'audio interface', 'midi', 'saxophone', 'violin', 'trumpet', 'flute', 'cello', 'bass', 'ukelele', 'synthesizer'],
    msrpCategories: ['Musical Instruments & Gear', 'Musical Instruments > Guitars & Basses'],
  },
  {
    id: 'tools-diy', emoji: '🔧', label: 'Tools & DIY',
    subcategories: ['Power Tools', 'Hand Tools', 'Woodworking', 'Gardening Tools', 'Workshop Equipment'],
    keywords: ['drill', 'saw', 'hammer', 'screwdriver', 'wrench', 'sander', 'router', 'miter', 'table saw', 'compressor', 'nail gun', 'lawn mower', 'weed eater', 'chainsaw', 'ladder', 'toolbox'],
    msrpCategories: ['Home & Garden > Tools & Workshop Equipment', 'Business & Industrial > CNC, Metalworking & Manufacturing'],
  },
  {
    id: 'automotive', emoji: '🚗', label: 'Automotive',
    subcategories: ['Car Parts', 'Tires', 'Tools', 'Accessories', 'Motorcycle', 'Car Audio'],
    keywords: ['tire', 'rim', 'wheel', 'exhaust', 'intake', 'bumper', 'headlight', 'tail light', 'seat', 'steering wheel', 'roof rack', 'bike rack', 'motorcycle', 'helmet', 'jack', 'jack stand', 'oil', 'filter'],
    msrpCategories: ['eBay Motors', 'eBay Motors > Parts & Accessories'],
  },
  {
    id: 'toys-games', emoji: '🎲', label: 'Toys & Games',
    subcategories: ['Board Games', 'Lego', 'Action Figures', 'Puzzles', 'RC Vehicles', 'Dolls', 'Collectibles'],
    keywords: ['lego', 'board game', 'puzzle', 'action figure', 'funko', 'hot wheels', 'barbie', 'nerf', 'rc car', 'drone', 'trading card', 'pokemon', 'magic', 'd&d', 'dungeons', 'dragon', 'warhammer'],
    msrpCategories: ['Toys & Hobbies', 'Toys & Hobbies > Collectible Card Games'],
  },
  {
    id: 'books-media', emoji: '📚', label: 'Books & Media',
    subcategories: ['Books', 'Textbooks', 'Vinyl Records', 'CDs', 'DVDs', 'Blu-rays', 'Comics'],
    keywords: ['book', 'textbook', 'vinyl', 'record', 'cd', 'dvd', 'bluray', 'comic', 'graphic novel', 'manga', 'magazine', 'cookbook'],
    msrpCategories: ['Books & Magazines', 'Music > Vinyl Records', 'Movies & TV > DVDs & Blu-ray'],
  },
  {
    id: 'pet-supplies', emoji: '🐾', label: 'Pet Supplies',
    subcategories: ['Dog', 'Cat', 'Fish', 'Reptile', 'Small Animal', 'Bird'],
    keywords: ['dog crate', 'cat tree', 'litter box', 'aquarium', 'fish tank', 'bird cage', 'leash', 'harness', 'dog bed', 'pet carrier', 'dog house', 'scratching post', 'reptile tank', 'hamster cage'],
    msrpCategories: ['Pet Supplies', 'Pet Supplies > Dog', 'Pet Supplies > Cat'],
  },
  {
    id: 'garden-outdoor', emoji: '🌻', label: 'Garden & Outdoor',
    subcategories: ['Plants', 'Seeds', 'Pots', 'Patio Furniture', 'Grills', 'Fencing', 'Outdoor Decor'],
    keywords: ['plant', 'flower', 'pot', 'planter', 'patio', 'grill', 'bbq', 'smoker', 'fire pit', 'umbrella', 'hose', 'sprinkler', 'fence', 'gazebo', 'hammock', 'bird feeder', 'compost'],
    msrpCategories: ['Home & Garden > Yard, Garden & Outdoor Living', 'Home & Garden > Plants & Seedlings'],
  },
  {
    id: 'antiques-collectibles', emoji: '🏺', label: 'Antiques & Collectibles',
    subcategories: ['Coins', 'Stamps', 'Vintage', 'Art', 'Pottery', 'Memorabilia', 'Trading Cards'],
    keywords: ['antique', 'vintage', 'coin', 'stamp', 'pottery', 'silver', 'gold', 'collectible', 'memorabilia', 'autograph', 'signed', 'limited edition', 'rare'],
    msrpCategories: ['Antiques', 'Collectibles', 'Coins & Paper Money', 'Stamps'],
  },
  {
    id: 'free-events', emoji: '🎪', label: 'Free Events',
    subcategories: ['Concerts', 'Festivals', 'Workshops', 'Classes', 'Community', 'Giveaways'],
    keywords: ['free event', 'concert', 'festival', 'workshop', 'class', 'community', 'giveaway', 'raffle', 'seminar', 'meetup', 'open house', 'block party', 'farmers market'],
    msrpCategories: [],
  },
];

export const CATEGORY_MAP: Record<string, InterestCategory> = {};
INTEREST_CATEGORIES.forEach(c => { CATEGORY_MAP[c.id] = c; });

export const ONBOARDING_CARDS: OnboardingCard[] = [
  // Furniture & Home
  { id: 'mid-century', emoji: '🪑', label: 'Mid-century furniture', imageHint: 'mid-century modern living room with teak furniture', categories: ['furniture'], weight: 1 },
  { id: 'diy-furniture', emoji: '🪚', label: 'DIY & upcycling furniture', imageHint: 'person sanding and refinishing an old wooden dresser', categories: ['furniture', 'tools-diy'], weight: 0.7 },
  { id: 'minimalist-home', emoji: '🏡', label: 'Minimalist home decor', imageHint: 'clean minimalist living room with neutral tones', categories: ['home-decor', 'furniture'], weight: 0.8 },
  // Electronics & Tech
  { id: 'retro-tech', emoji: '📻', label: 'Vintage electronics & retro tech', imageHint: 'vintage record player and old radio collection', categories: ['electronics', 'antiques-collectibles'], weight: 0.8 },
  { id: 'gaming-setup', emoji: '🎮', label: 'Gaming & streaming setup', imageHint: 'gaming desk with multiple monitors and RGB lighting', categories: ['electronics', 'furniture'], weight: 0.8 },
  { id: 'home-theater', emoji: '🎬', label: 'Home theater & audio gear', imageHint: 'home theater projector setup with surround sound speakers', categories: ['electronics', 'furniture'], weight: 0.7 },
  // Outdoors & Recreation
  { id: 'camping-gear', emoji: '⛺', label: 'Camping & backpacking gear', imageHint: 'tent setup at mountain campsite with sleeping bags and stove', categories: ['camping-outdoors', 'sports-equipment'], weight: 1 },
  { id: 'mountain-biking', emoji: '🚵', label: 'Mountain biking', imageHint: 'mountain biker on a forest trail with full suspension bike', categories: ['bikes-cycling', 'outdoor-recreation'], weight: 1 },
  { id: 'snow-sports', emoji: '🏂', label: 'Skiing & snowboarding', imageHint: 'snowboarder going down a powder slope', categories: ['outdoor-recreation', 'sports-equipment'], weight: 1 },
  { id: 'water-sports', emoji: '🏄', label: 'Surfing & water sports', imageHint: 'surfer paddling out with surfboard at sunrise', categories: ['outdoor-recreation', 'sports-equipment'], weight: 0.9 },
  { id: 'climbing', emoji: '🧗', label: 'Rock climbing', imageHint: 'climber on an indoor bouldering wall with chalk bag', categories: ['outdoor-recreation', 'sports-equipment'], weight: 0.9 },
  { id: 'fishing', emoji: '🎣', label: 'Fishing gear', imageHint: 'fishing rod and tackle box on a dock at lake', categories: ['camping-outdoors', 'sports-equipment'], weight: 0.8 },
  // Sports & Fitness
  { id: 'home-gym', emoji: '🏋️', label: 'Home gym & weights', imageHint: 'home garage gym with squat rack and dumbbells', categories: ['sports-equipment'], weight: 1 },
  { id: 'yoga', emoji: '🧘', label: 'Yoga & wellness', imageHint: 'yoga mat and meditation cushion in sunlit room', categories: ['sports-equipment', 'home-decor'], weight: 0.7 },
  { id: 'golf', emoji: '⛳', label: 'Golf clubs & gear', imageHint: 'golf bag with clubs on a green fairway', categories: ['sports-equipment'], weight: 0.8 },
  // Creative & Music
  { id: 'guitar', emoji: '🎸', label: 'Guitars & string instruments', imageHint: 'acoustic and electric guitars on wall mounts', categories: ['musical-instruments'], weight: 1 },
  { id: 'drums', emoji: '🥁', label: 'Drums & percussion', imageHint: 'full drum kit setup in a rehearsal space', categories: ['musical-instruments'], weight: 0.9 },
  { id: 'synth-production', emoji: '🎛️', label: 'Music production & synths', imageHint: 'desk with synthesizers, MIDI controllers, and studio monitors', categories: ['musical-instruments', 'electronics'], weight: 0.8 },
  { id: 'dj-gear', emoji: '🎧', label: 'DJ & mixing equipment', imageHint: 'DJ controller and mixer with headphones', categories: ['musical-instruments', 'electronics'], weight: 0.7 },
  { id: 'photography', emoji: '📷', label: 'Photography & cameras', imageHint: 'DSLR camera with multiple lenses on a table', categories: ['electronics'], weight: 0.8 },
  { id: 'art-supplies', emoji: '🎨', label: 'Art & craft supplies', imageHint: 'easel with paints, brushes, and canvas in an art studio', categories: ['home-decor', 'toys-games'], weight: 0.7 },
  // Kids & Family
  { id: 'baby-gear', emoji: '🍼', label: 'Baby essentials & gear', imageHint: 'stroller, crib, and baby supplies in a nursery', categories: ['baby-kids', 'furniture'], weight: 1 },
  { id: 'kids-toys', emoji: '🧸', label: 'Kids toys & play sets', imageHint: 'colorful playroom with toy kitchen and building blocks', categories: ['baby-kids', 'toys-games'], weight: 0.9 },
  { id: 'kids-bikes', emoji: '🚲', label: 'Kids bikes & scooters', imageHint: 'row of colorful kids bikes and scooters in a driveway', categories: ['baby-kids', 'bikes-cycling'], weight: 0.8 },
  { id: 'lego', emoji: '🧱', label: 'Lego & building blocks', imageHint: 'massive LEGO collection sorted by color in bins', categories: ['toys-games', 'antiques-collectibles'], weight: 0.8 },
  // Tools & Making
  { id: 'woodworking', emoji: '🪚', label: 'Woodworking & carpentry', imageHint: 'woodworking workshop with table saw and finished furniture', categories: ['tools-diy', 'furniture'], weight: 1 },
  { id: 'power-tools', emoji: '🔩', label: 'Power tools & workshop', imageHint: 'pegboard with organized power tools and workbench', categories: ['tools-diy'], weight: 0.9 },
  { id: 'gardening', emoji: '🌱', label: 'Gardening & plants', imageHint: 'backyard garden with raised beds and gardening tools', categories: ['garden-outdoor', 'tools-diy'], weight: 0.9 },
  { id: 'car-repair', emoji: '🔧', label: 'Car repair & modding', imageHint: 'car with hood open and tools on a garage floor', categories: ['automotive', 'tools-diy'], weight: 0.8 },
  { id: 'metalworking', emoji: '⚙️', label: 'Metalworking & welding', imageHint: 'welding mask and metal fabrication tools in a shop', categories: ['tools-diy'], weight: 0.7 },
  // Collecting
  { id: 'vinyl-records', emoji: '💿', label: 'Vinyl records & turntables', imageHint: 'large vinyl record collection in shelves with turntable', categories: ['books-media', 'electronics'], weight: 0.8 },
  { id: 'trading-cards', emoji: '🃏', label: 'Trading cards (Pokemon, MTG)', imageHint: 'binder of rare Pokemon and Magic cards spread on table', categories: ['toys-games', 'antiques-collectibles'], weight: 0.8 },
  { id: 'sneakers', emoji: '👟', label: 'Sneakers & streetwear', imageHint: 'collection of rare sneakers on display shelves', categories: ['clothing', 'antiques-collectibles'], weight: 0.8 },
  { id: 'antiquing', emoji: '🏺', label: 'Antiques & vintage finds', imageHint: 'antique store aisle with vintage furniture and collectibles', categories: ['antiques-collectibles', 'furniture', 'home-decor'], weight: 0.8 },
  { id: 'coins', emoji: '🪙', label: 'Coin collecting', imageHint: 'rare coins in protective cases on a velvet mat', categories: ['antiques-collectibles'], weight: 0.7 },
  // Lifestyle
  { id: 'cooking', emoji: '👨‍🍳', label: 'Cooking & kitchen gear', imageHint: 'professional kitchen with cookware and chef knife set', categories: ['kitchen', 'appliances'], weight: 0.8 },
  { id: 'coffee', emoji: '☕', label: 'Coffee & espresso gear', imageHint: 'espresso machine and coffee grinder with pour-over setup', categories: ['kitchen', 'appliances'], weight: 0.7 },
  { id: 'bbq-grilling', emoji: '🥩', label: 'BBQ & grilling', imageHint: 'large smoker and grill on a backyard patio', categories: ['garden-outdoor', 'kitchen'], weight: 0.7 },
  { id: 'pet-dog', emoji: '🐕', label: 'Dog supplies & gear', imageHint: 'dog crate, bed, and toys in a cozy corner', categories: ['pet-supplies'], weight: 0.8 },
  { id: 'pet-cat', emoji: '🐈', label: 'Cat trees & supplies', imageHint: 'large cat tree and scratching posts by a window', categories: ['pet-supplies'], weight: 0.7 },
  { id: 'books-reading', emoji: '📖', label: 'Books & reading', imageHint: 'floor-to-ceiling bookshelves packed with books', categories: ['books-media', 'furniture'], weight: 0.7 },
  // Events
  { id: 'free-events', emoji: '🎉', label: 'Free events & giveaways', imageHint: 'community festival with booths and food trucks', categories: ['free-events'], weight: 0.6 },
];
