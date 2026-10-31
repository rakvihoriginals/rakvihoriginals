export interface Brand {
  id: string;
  name: string;
  slug: string;
  tier: "Haute Couture" | "Heritage Maison" | "Contemporary Atelier";
  country: string;
  founded: number;
  productsCount: number;
  status: "Active" | "Archived";
  logoUrl?: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
  featured: boolean;
  status: "Active" | "Draft";
  image: string;
  subcategories: {
    id: string;
    name: string;
    slug: string;
    itemCount: number;
    subsubcategories: string[];
  }[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  originalPrice?: number;
  stock: number;
  status: "In Stock" | "Low Stock" | "Sold Out" | "Draft";
  image: string;
  rating: number;
  reviewsCount: number;
  attributes: {
    material: string;
    color: string;
    hardware: string;
    edition?: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  items: {
    productName: string;
    sku: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  totalAmount: number;
  paymentMethod: "UPI Direct" | "Luxury Concierge Card" | "Wire Transfer" | "POS Terminal";
  paymentStatus: "Verified" | "Pending Approval" | "Failed";
  orderStatus: "Pending" | "Confirmed" | "Crafting" | "Dispatched" | "Delivered" | "Cancelled";
  trackingNumber?: string;
  shippingAddress: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "Percentage" | "Fixed";
  discountValue: number;
  minSpend: number;
  maxDiscount?: number;
  usageCount: number;
  usageLimit: number;
  expiryDate: string;
  status: "Active" | "Expired" | "Paused";
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: "VIP Noir" | "Platinum Maison" | "Gold Atelier";
  totalSpent: number;
  ordersCount: number;
  lastOrderDate: string;
  city: string;
  status: "Active" | "Flagged";
}

export interface Review {
  id: string;
  customerName: string;
  productName: string;
  rating: number;
  comment: string;
  date: string;
  status: "Approved" | "Pending" | "Rejected";
  verifiedBuyer: boolean;
  reply?: string;
}

export interface InboundMessage {
  id: string;
  sender: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
  priority: "High" | "Medium" | "Routine";
  status: "Unread" | "Replied" | "Archived";
  assignedTo?: string;
}

export interface PaymentApproval {
  id: string;
  transactionRef: string;
  orderId: string;
  customerName: string;
  amount: number;
  method: "UPI QR" | "Bank IMPS" | "Concierge Wire";
  timestamp: string;
  screenshotUrl: string;
  status: "Pending" | "Approved" | "Rejected";
  notes?: string;
}

// ================= INITIAL MOCK DATA =================

export const initialBrands: Brand[] = [
  {
    id: "b-1",
    name: "RAKVIH Haute Maison",
    slug: "rakvih-haute",
    tier: "Haute Couture",
    country: "Italy",
    founded: 1988,
    productsCount: 42,
    status: "Active",
    description: "Flagship artisanal atelier creating handcrafted exotic leather masterpieces.",
  },
  {
    id: "b-2",
    name: "Maison Bellagio",
    slug: "maison-bellagio",
    tier: "Heritage Maison",
    country: "France",
    founded: 1994,
    productsCount: 28,
    status: "Active",
    description: "Historic Parisian leathercraft combining architectural symmetry and 24K gold hardware.",
  },
  {
    id: "b-3",
    name: "Aethelgard Firenze",
    slug: "aethelgard-firenze",
    tier: "Contemporary Atelier",
    country: "Italy",
    founded: 2012,
    productsCount: 19,
    status: "Active",
    description: "Avant-garde Tuscan footwear and precision eyewear sculpted for modern collectors.",
  },
  {
    id: "b-4",
    name: "Vittoria Monogram",
    slug: "vittoria-monogram",
    tier: "Heritage Maison",
    country: "Switzerland",
    founded: 2005,
    productsCount: 15,
    status: "Active",
    description: "Bespoke silk stoles and hand-tooled calfskin belts.",
  },
];

export const initialCategories: Category[] = [
  {
    id: "c-1",
    name: "Handbags & Clutches",
    slug: "handbags",
    itemCount: 48,
    featured: true,
    status: "Active",
    image: "/handbag.webp",
    subcategories: [
      {
        id: "sc-1",
        name: "Structured Totes",
        slug: "structured-totes",
        itemCount: 16,
        subsubcategories: ["Top Handle", "Trapeze Silhouette", "Architectural Lock"],
      },
      {
        id: "sc-2",
        name: "Evening Minaudières",
        slug: "evening-minaudières",
        itemCount: 14,
        subsubcategories: ["Gold Inlay", "Jeweled Clasp", "Velvet Box"],
      },
      {
        id: "sc-3",
        name: "Crossbody Satchels",
        slug: "crossbody-satchels",
        itemCount: 18,
        subsubcategories: ["Chain Strap", "Micro Trunk", "Pouch Bag"],
      },
    ],
  },
  {
    id: "c-2",
    name: "Artisanal Footwear",
    slug: "footwear",
    itemCount: 32,
    featured: true,
    status: "Active",
    image: "/shoe.webp",
    subcategories: [
      {
        id: "sc-4",
        name: "Leather Loafers & Oxfords",
        slug: "loafers-oxfords",
        itemCount: 12,
        subsubcategories: ["Horsebit Detail", "Patent Gloss", "Monk Strap"],
      },
      {
        id: "sc-5",
        name: "Stiletto & Sculptural Heels",
        slug: "sculptural-heels",
        itemCount: 20,
        subsubcategories: ["Gold Fluted Heel", "Satin Pump", "Ankle Strap"],
      },
    ],
  },
  {
    id: "c-3",
    name: "Bespoke Belts",
    slug: "belts",
    itemCount: 24,
    featured: false,
    status: "Active",
    image: "/belt 1.jpg",
    subcategories: [
      {
        id: "sc-6",
        name: "Reversible Calfskin",
        slug: "reversible-calfskin",
        itemCount: 14,
        subsubcategories: ["35mm Width", "40mm Width", "Embossed Monogram"],
      },
      {
        id: "sc-7",
        name: "Corset & Statement Belts",
        slug: "statement-belts",
        itemCount: 10,
        subsubcategories: ["Double Buckle", "Gold Chain Link", "Wide Cinch"],
      },
    ],
  },
  {
    id: "c-4",
    name: "Silk & Cashmere Stoles",
    slug: "stoles",
    itemCount: 29,
    featured: true,
    status: "Active",
    image: "/stoles.webp",
    subcategories: [
      {
        id: "sc-8",
        name: "Mulberry Silk Scarves",
        slug: "mulberry-silk",
        itemCount: 15,
        subsubcategories: ["90x90cm Carré", "Twilly Ribbon", "Hand-Rolled Hem"],
      },
      {
        id: "sc-9",
        name: "Himalayan Cashmere Wraps",
        slug: "cashmere-wraps",
        itemCount: 14,
        subsubcategories: ["Ombre Weave", "Fringed Pashmina", "Monogram Jacquard"],
      },
    ],
  },
  {
    id: "c-5",
    name: "Eyewear & Optical",
    slug: "eyewear",
    itemCount: 22,
    featured: false,
    status: "Active",
    image: "/sunglasses.webp",
    subcategories: [
      {
        id: "sc-10",
        name: "Aviator & Square Sunglasses",
        slug: "sunglasses-luxury",
        itemCount: 16,
        subsubcategories: ["Titanium Frame", "Gradient Lens", "Gold Temples"],
      },
      {
        id: "sc-11",
        name: "Cat-Eye & Statement Frames",
        slug: "cat-eye-frames",
        itemCount: 6,
        subsubcategories: ["Acetate Thick Rim", "Crystal Embellished"],
      },
    ],
  },
];

export const initialProducts: Product[] = [
  {
    id: "prod-001",
    sku: "RAK-HB-001",
    name: "Aura Royale Crocodile Handbag",
    category: "Handbags & Clutches",
    subcategory: "Structured Totes",
    brand: "RAKVIH Haute Maison",
    price: 34500,
    originalPrice: 38000,
    stock: 8,
    status: "In Stock",
    image: "/handbag.webp",
    rating: 4.9,
    reviewsCount: 34,
    attributes: {
      material: "Exotic Niloticus Leather",
      color: "Emerald Obsidian",
      hardware: "24K Champagne Gold Plated",
      edition: "Limited Edition No. 12/50",
    },
  },
  {
    id: "prod-002",
    sku: "RAK-HB-002",
    name: "Vendôme Sculpted Minaudière",
    category: "Handbags & Clutches",
    subcategory: "Evening Minaudières",
    brand: "Maison Bellagio",
    price: 28900,
    stock: 4,
    status: "Low Stock",
    image: "/handbag 2.webp",
    rating: 5.0,
    reviewsCount: 18,
    attributes: {
      material: "Satin Silk & Brass Cage",
      color: "Midnight Gold",
      hardware: "Polished Palladium",
      edition: "Runway Showcase",
    },
  },
  {
    id: "prod-003",
    sku: "RAK-SH-001",
    name: "Duchess Fluted Stiletto Heel",
    category: "Artisanal Footwear",
    subcategory: "Stiletto & Sculptural Heels",
    brand: "Aethelgard Firenze",
    price: 18500,
    stock: 12,
    status: "In Stock",
    image: "/shoe.webp",
    rating: 4.8,
    reviewsCount: 22,
    attributes: {
      material: "Italian Patent Leather",
      color: "Crimson Noir",
      hardware: "Gold Fluted Spire",
    },
  },
  {
    id: "prod-004",
    sku: "RAK-BL-001",
    name: "Imperium Reversible Signature Belt",
    category: "Bespoke Belts",
    subcategory: "Reversible Calfskin",
    brand: "Vittoria Monogram",
    price: 8900,
    originalPrice: 9900,
    stock: 19,
    status: "In Stock",
    image: "/belt 1.jpg",
    rating: 4.7,
    reviewsCount: 45,
    attributes: {
      material: "Full-Grain Calfskin",
      color: "Cognac / Noir Dual Tone",
      hardware: "Brushed Brass Monogram",
    },
  },
  {
    id: "prod-005",
    sku: "RAK-ST-001",
    name: "Celestial Garden Mulberry Silk Scarf",
    category: "Silk & Cashmere Stoles",
    subcategory: "Mulberry Silk Scarves",
    brand: "RAKVIH Haute Maison",
    price: 6400,
    stock: 2,
    status: "Low Stock",
    image: "/stoles.webp",
    rating: 4.9,
    reviewsCount: 29,
    attributes: {
      material: "100% 18-Momme Mulberry Silk",
      color: "Royal Azure & Ochre",
      hardware: "Hand-rolled French Hems",
    },
  },
  {
    id: "prod-006",
    sku: "RAK-EY-001",
    name: "Monolith Titanium Polarized Aviators",
    category: "Eyewear & Optical",
    subcategory: "Aviator & Square Sunglasses",
    brand: "Aethelgard Firenze",
    price: 12800,
    stock: 0,
    status: "Sold Out",
    image: "/sunglasses.webp",
    rating: 4.6,
    reviewsCount: 16,
    attributes: {
      material: "Japanese Beta-Titanium",
      color: "Smoky Gradient Obsidian",
      hardware: "24K Gold Inlaid Hinges",
    },
  },
  {
    id: "prod-007",
    sku: "RAK-HB-003",
    name: "Palazzo Quilted Chain Bag",
    category: "Handbags & Clutches",
    subcategory: "Crossbody Satchels",
    brand: "Maison Bellagio",
    price: 24500,
    stock: 15,
    status: "In Stock",
    image: "/handbag 3.webp",
    rating: 4.9,
    reviewsCount: 39,
    attributes: {
      material: "Glove-Tanned Lambskin",
      color: "Ivory Pearl",
      hardware: "Gold Interlocking Chain",
    },
  },
  {
    id: "prod-008",
    sku: "RAK-SH-002",
    name: "Firenze Tassel Loafer",
    category: "Artisanal Footwear",
    subcategory: "Leather Loafers & Oxfords",
    brand: "Aethelgard Firenze",
    price: 16200,
    stock: 7,
    status: "In Stock",
    image: "/shoe 2.webp",
    rating: 4.8,
    reviewsCount: 14,
    attributes: {
      material: "Hand-Burnished Calfskin",
      color: "Chestnut Patina",
      hardware: "Antiqued Brass Aglets",
    },
  },
];

export const initialOrders: Order[] = [
  {
    id: "ord-1001",
    orderNumber: "RAK-90481",
    customerName: "Countess Victoria Sterling",
    customerEmail: "v.sterling@mayfairclub.co.uk",
    customerPhone: "+44 20 7946 0912",
    date: "2026-09-02 15:42",
    items: [
      {
        productName: "Aura Royale Crocodile Handbag",
        sku: "RAK-HB-001",
        quantity: 1,
        price: 34500,
        image: "/handbag.webp",
      },
      {
        productName: "Celestial Garden Mulberry Silk Scarf",
        sku: "RAK-ST-001",
        quantity: 2,
        price: 6400,
        image: "/stoles.webp",
      },
    ],
    totalAmount: 47300,
    paymentMethod: "Luxury Concierge Card",
    paymentStatus: "Verified",
    orderStatus: "Crafting",
    trackingNumber: "DHL-EXPRESS-9920194",
    shippingAddress: "Villa 14, The Bishops Avenue, London N2 0BN, United Kingdom",
  },
  {
    id: "ord-1002",
    orderNumber: "RAK-90482",
    customerName: "Rajiv Singhania",
    customerEmail: "rajiv@singhaniacapital.com",
    customerPhone: "+91 98200 12890",
    date: "2026-09-02 14:15",
    items: [
      {
        productName: "Vendôme Sculpted Minaudière",
        sku: "RAK-HB-002",
        quantity: 1,
        price: 28900,
        image: "/handbag 2.webp",
      },
      {
        productName: "Imperium Reversible Signature Belt",
        sku: "RAK-BL-001",
        quantity: 1,
        price: 8900,
        image: "/belt 1.jpg",
      },
    ],
    totalAmount: 37800,
    paymentMethod: "UPI Direct",
    paymentStatus: "Verified",
    orderStatus: "Confirmed",
    trackingNumber: "BLUEDART-PRIORITY-44812",
    shippingAddress: "Penthouse B, Altamount Road, Cumballa Hill, Mumbai 400026",
  },
  {
    id: "ord-1003",
    orderNumber: "RAK-90483",
    customerName: "Elena Rostova",
    customerEmail: "elena.r@genevaprivate.ch",
    customerPhone: "+41 22 819 4400",
    date: "2026-09-02 11:30",
    items: [
      {
        productName: "Duchess Fluted Stiletto Heel",
        sku: "RAK-SH-001",
        quantity: 1,
        price: 18500,
        image: "/shoe.webp",
      },
    ],
    totalAmount: 18500,
    paymentMethod: "Wire Transfer",
    paymentStatus: "Pending Approval",
    orderStatus: "Pending",
    shippingAddress: "Rue du Rhône 42, 1204 Genève, Switzerland",
  },
  {
    id: "ord-1004",
    orderNumber: "RAK-90484",
    customerName: "Alexander Vance",
    customerEmail: "avance@tribecapartners.com",
    customerPhone: "+1 212 555 0199",
    date: "2026-09-01 18:20",
    items: [
      {
        productName: "Palazzo Quilted Chain Bag",
        sku: "RAK-HB-003",
        quantity: 1,
        price: 24500,
        image: "/handbag 3.webp",
      },
    ],
    totalAmount: 24500,
    paymentMethod: "POS Terminal",
    paymentStatus: "Verified",
    orderStatus: "Dispatched",
    trackingNumber: "FEDEX-CUSTOM-CRITICAL-882194",
    shippingAddress: "72 Franklin St, Tribeca, New York, NY 10013, USA",
  },
  {
    id: "ord-1005",
    orderNumber: "RAK-90485",
    customerName: "Lady Sarah Beaumont",
    customerEmail: "s.beaumont@beaumontholdings.fr",
    customerPhone: "+33 1 42 68 55 00",
    date: "2026-08-31 09:40",
    items: [
      {
        productName: "Aura Royale Crocodile Handbag",
        sku: "RAK-HB-001",
        quantity: 1,
        price: 34500,
        image: "/handbag.webp",
      },
    ],
    totalAmount: 34500,
    paymentMethod: "Luxury Concierge Card",
    paymentStatus: "Verified",
    orderStatus: "Delivered",
    trackingNumber: "DHL-VIP-110298",
    shippingAddress: "Avenue Montaigne 18, 75008 Paris, France",
  },
];

export const initialCoupons: Coupon[] = [
  {
    id: "cp-1",
    code: "ROYALE15",
    discountType: "Percentage",
    discountValue: 15,
    minSpend: 25000,
    maxDiscount: 10000,
    usageCount: 64,
    usageLimit: 100,
    expiryDate: "2026-12-31",
    status: "Active",
  },
  {
    id: "cp-2",
    code: "MAISONVIP",
    discountType: "Fixed",
    discountValue: 5000,
    minSpend: 30000,
    usageCount: 142,
    usageLimit: 200,
    expiryDate: "2026-10-15",
    status: "Active",
  },
  {
    id: "cp-3",
    code: "PRIVATEPREVIEW",
    discountType: "Percentage",
    discountValue: 20,
    minSpend: 50000,
    maxDiscount: 25000,
    usageCount: 18,
    usageLimit: 30,
    expiryDate: "2026-09-30",
    status: "Active",
  },
  {
    id: "cp-4",
    code: "SUMMEREDITION",
    discountType: "Percentage",
    discountValue: 10,
    minSpend: 15000,
    usageCount: 300,
    usageLimit: 300,
    expiryDate: "2026-08-31",
    status: "Expired",
  },
];

export const initialCustomers: Customer[] = [
  {
    id: "cust-01",
    name: "Countess Victoria Sterling",
    email: "v.sterling@mayfairclub.co.uk",
    phone: "+44 20 7946 0912",
    tier: "VIP Noir",
    totalSpent: 186400,
    ordersCount: 8,
    lastOrderDate: "2026-09-02",
    city: "London",
    status: "Active",
  },
  {
    id: "cust-02",
    name: "Rajiv Singhania",
    email: "rajiv@singhaniacapital.com",
    phone: "+91 98200 12890",
    tier: "Platinum Maison",
    totalSpent: 94200,
    ordersCount: 4,
    lastOrderDate: "2026-09-02",
    city: "Mumbai",
    status: "Active",
  },
  {
    id: "cust-03",
    name: "Elena Rostova",
    email: "elena.r@genevaprivate.ch",
    phone: "+41 22 819 4400",
    tier: "Gold Atelier",
    totalSpent: 48900,
    ordersCount: 2,
    lastOrderDate: "2026-09-02",
    city: "Geneva",
    status: "Active",
  },
  {
    id: "cust-04",
    name: "Alexander Vance",
    email: "avance@tribecapartners.com",
    phone: "+1 212 555 0199",
    tier: "VIP Noir",
    totalSpent: 142000,
    ordersCount: 6,
    lastOrderDate: "2026-09-01",
    city: "New York",
    status: "Active",
  },
  {
    id: "cust-05",
    name: "Lady Sarah Beaumont",
    email: "s.beaumont@beaumontholdings.fr",
    phone: "+33 1 42 68 55 00",
    tier: "VIP Noir",
    totalSpent: 215000,
    ordersCount: 9,
    lastOrderDate: "2026-08-31",
    city: "Paris",
    status: "Active",
  },
];

export const initialReviews: Review[] = [
  {
    id: "rev-1",
    customerName: "Countess Victoria Sterling",
    productName: "Aura Royale Crocodile Handbag",
    rating: 5,
    comment: "The precision in every stitch is unmatched. Truly an heirloom item worthy of family heritage.",
    date: "2026-09-01",
    status: "Approved",
    verifiedBuyer: true,
    reply: "We are deeply honored by your esteem, Countess. May it grace your signature occasions.",
  },
  {
    id: "rev-2",
    customerName: "Jean-Paul Delacroix",
    productName: "Vendôme Sculpted Minaudière",
    rating: 5,
    comment: "The 24K gold fluted cage catches the salon candlelight majestically. Exquisite craftsmanship.",
    date: "2026-08-28",
    status: "Approved",
    verifiedBuyer: true,
  },
  {
    id: "rev-3",
    customerName: "Ananya Mehra",
    productName: "Celestial Garden Mulberry Silk Scarf",
    rating: 4,
    comment: "Lustrous fabric drape and hand-rolled borders. Would love a slightly larger 110cm format.",
    date: "2026-08-25",
    status: "Pending",
    verifiedBuyer: true,
  },
];

export const initialMessages: InboundMessage[] = [
  {
    id: "msg-101",
    sender: "Princess Al-Sabah Concierge",
    email: "vipdesk@alsabahfamilyoffice.kw",
    phone: "+965 2200 8899",
    subject: "Bespoke Monogramming for 6 Private Editions",
    message: "Requesting a private showing and bespoke diamond pavé crest embossing for the upcoming royal gala.",
    date: "2026-09-02 14:10",
    priority: "High",
    status: "Unread",
  },
  {
    id: "msg-102",
    sender: "Arthur Pendelton",
    email: "a.pendelton@sothebys-advisory.com",
    phone: "+1 415 882 1092",
    subject: "Private Archive Exhibition Inquiry",
    message: "Inquiring if RAKVIH Originals would showcase historical archival pieces at our upcoming luxury design retrospective.",
    date: "2026-09-01 16:45",
    priority: "Medium",
    status: "Replied",
    assignedTo: "Chief Curator",
  },
];

export const initialApprovals: PaymentApproval[] = [
  {
    id: "appr-1",
    transactionRef: "UPI-AXIS-992019481",
    orderId: "RAK-90482",
    customerName: "Rajiv Singhania",
    amount: 37800,
    method: "UPI QR",
    timestamp: "2026-09-02 14:18",
    screenshotUrl: "/ban.png",
    status: "Approved",
    notes: "Axis Bank UTR verified against merchant statement.",
  },
  {
    id: "appr-2",
    transactionRef: "WIRE-UBS-8841920",
    orderId: "RAK-90483",
    customerName: "Elena Rostova",
    amount: 18500,
    method: "Concierge Wire",
    timestamp: "2026-09-02 11:35",
    screenshotUrl: "/banner01.jpg",
    status: "Pending",
    notes: "SWIFT MT103 copy received. Awaiting forex clearance.",
  },
  {
    id: "appr-3",
    transactionRef: "UPI-HDFC-3391829",
    orderId: "RAK-90486",
    customerName: "Kavita Krishnamurthy",
    amount: 14500,
    method: "UPI QR",
    timestamp: "2026-09-02 10:12",
    screenshotUrl: "/banner.png",
    status: "Pending",
  },
];
