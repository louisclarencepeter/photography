import galleryEntries from "./galleryEntries.json";

const imagePictureModules = import.meta.glob("../../images/*.{jpg,JPG,jpeg,png}", {
  query: { w: "160;320;480;960;1600", format: "avif;webp;jpg", as: "picture" },
  eager: true,
  import: "default"
});

const productPictureModules = import.meta.glob("../../Products/*.{jpg,JPG,jpeg,png}", {
  query: { w: "160;320;480;960;1600", format: "avif;webp;jpg", as: "picture" },
  eager: true,
  import: "default"
});

function resolveAsset(modules, folder, fileName) {
  const match = Object.entries(modules).find(([path]) => path.endsWith(`/${folder}/${fileName}`));

  if (!match) {
    throw new Error(`Missing asset: ${folder}/${fileName}`);
  }

  return match[1];
}

const imagePicture = (fileName) => resolveAsset(imagePictureModules, "images", fileName);
const productPicture = (fileName) => resolveAsset(productPictureModules, "Products", fileName);

export const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/louisclarencepeter",
    icon: "facebook"
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/louispeterphotography/",
    icon: "instagram"
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@louispeterphotography",
    icon: "youtube"
  },
  {
    label: "500px",
    href: "https://500px.com/p/louisclarencepeters",
    icon: "fiveHundredPx"
  }
];

export const mobileMenuThumbs = {
  work: imagePicture("gallery-052.jpg"),
  services: imagePicture("gallery-060.jpg"),
  about: imagePicture("louis-peter-portrait.jpg"),
  words: imagePicture("gallery-022.jpg"),
  contact: imagePicture("gallery-010.jpg")
};

export const aboutDetails = {
  logo: imagePicture("louis-peter-logo.jpg"),
  portrait: imagePicture("louis-peter-portrait.jpg"),
  bio: [
    "I'm Louis — based in Frankfurt am Main, photographing weddings, portraits, and the occasional pet who steals the show. My approach is calm and unhurried; I look for real moments and the small details that give them their feeling.",
    "I work mostly with natural light, edit warmly and honestly, and deliver in plenty of time. Whether it's a quiet portrait or a full wedding day, my goal is the same: pictures you'll want to live with."
  ]
};

export const heroCards = [
  { picture: imagePicture("gallery-052.jpg"), tag: "Wedding · Frankfurt", role: "main" },
  { picture: imagePicture("gallery-022.jpg"), tag: "Portrait · Editorial", role: "side" },
  { picture: imagePicture("gallery-010.jpg"), tag: "Couple · Golden hour", role: "foot" }
];

export const heroAvatars = [
  imagePicture("gallery-052.jpg"),
  imagePicture("gallery-061.jpg"),
  imagePicture("gallery-010.jpg")
];

export const watchShorts = [
  { id: "f4-afh2mrSQ", title: "Behind the lens — short" },
  { id: "wITnkoRfJ0A", title: "Studio test shoot" },
  { id: "nCt4dJEv2wk", title: "Editorial portrait session" },
  { id: "S6SS3_H1fmc", title: "On set — quick cut" }
];

export const watchFeatures = [
  { id: "2ilqZoJ20cU", title: "Feature film" },
  { id: "XfJwStmbtlo", title: "Feature film" },
  { id: "R_iFypx9Zmc", title: "Feature film" }
];

export const btsVideo = {
  id: "Sld2NaX5J2c",
  title: "Behind the scenes — full reel"
};

export const btsImages = [
  {
    picture: imagePicture("bts-01.jpg"),
    caption: "Behind the lens — studio test shoot",
    cls: "bts-a"
  },
  {
    picture: imagePicture("bts-03.jpg"),
    caption: "Last touches before the first frame",
    cls: "bts-b"
  },
  {
    picture: imagePicture("bts-04.jpg"),
    caption: "Ring light, soft hands, quiet focus",
    cls: "bts-c"
  },
  {
    picture: imagePicture("bts-02.jpg"),
    caption: "Low angle, monitor on, candid",
    cls: "bts-d"
  }
];

export const heroStats = [
  { n: "120", suffix: "+", label: "Sessions" },
  { n: "9", suffix: "yrs", label: "Behind the lens" },
  { n: "2", suffix: "continents", label: "Have hosted us" }
];

export const marqueeItems = [
  { text: "Weddings", italic: false },
  { text: "portraits", italic: true },
  { text: "Families", italic: false },
  { text: "travel", italic: true },
  { text: "Events", italic: false },
  { text: "aerial", italic: true }
];

export const serviceCategories = [
  { id: "all", label: "All" },
  { id: "people", label: "People" },
  { id: "events", label: "Events" },
  { id: "space", label: "Spaces" }
];

export const offerings = [
  {
    num: "01",
    title: "Weddings",
    flourish: "— full day",
    price: "from €2 400",
    category: "events",
    description:
      "Story-led coverage from morning prep to the last dance. Emotion, atmosphere, the in-between.",
    image: productPicture("service-weddings.jpg")
  },
  {
    num: "02",
    title: "Portraits",
    flourish: "— editorial",
    price: "from €280",
    category: "people",
    description:
      "Natural, polished portraits for personal or professional use. 60–90 minutes, two looks.",
    image: productPicture("service-portraits.jpg")
  },
  {
    num: "03",
    title: "Family",
    flourish: "— at home",
    price: "from €320",
    category: "people",
    description:
      "Relaxed sessions in your favorite places. We move, play, and let things happen.",
    image: productPicture("service-family-photos.jpg")
  },
  {
    num: "04",
    title: "Couples",
    flourish: "— intimate",
    price: "from €260",
    category: "people",
    description:
      "Engagements, anniversaries, this chapter together. A walk, a hand, golden light.",
    image: productPicture("service-couples.jpg")
  },
  {
    num: "05",
    title: "Events",
    flourish: "— editorial",
    price: "from €480",
    category: "events",
    description:
      "Brands, parties, and gatherings — mood, candor, and the quiet space between toasts.",
    image: productPicture("service-events.jpg")
  },
  {
    num: "06",
    title: "Aerial",
    flourish: "— drone",
    price: "from €380",
    category: "space",
    description:
      "Scale, perspective, and striking aerial context for venues, travel, and properties.",
    image: productPicture("service-drone-photography.jpg")
  },
  {
    num: "07",
    title: "Children",
    flourish: "— tender",
    price: "from €260",
    category: "people",
    description:
      "Warm, playful sessions that capture childhood with honesty, energy, and tenderness.",
    image: productPicture("service-babies-and-children.jpg")
  },
  {
    num: "08",
    title: "Pets",
    flourish: "— character",
    price: "from €220",
    category: "people",
    description:
      "Characterful pet portraits that celebrate personality and the bond you share.",
    image: productPicture("service-pets.jpg")
  },
  {
    num: "09",
    title: "Property",
    flourish: "— spaces",
    price: "from €340",
    category: "space",
    description:
      "Clean, well-composed imagery that highlights space, light, and architectural detail.",
    image: productPicture("service-property-photography.jpg")
  }
];

export const bentoImages = [
  { picture: imagePicture("gallery-007.jpg"), caption: "Festival night · 2024", cls: "b1" },
  { picture: imagePicture("gallery-052.jpg"), caption: "Wedding · Frankfurt", cls: "b2" },
  { picture: imagePicture("gallery-060.jpg"), caption: "Editorial portrait", cls: "b3" },
  { picture: imagePicture("gallery-003.jpg"), caption: "Aerial · reef", cls: "b4" },
  { picture: imagePicture("gallery-010.jpg"), caption: "Couple · golden hour", cls: "b5" },
  { picture: imagePicture("gallery-053.jpg"), caption: "Wedding moment · 2024", cls: "b6" },
  { picture: imagePicture("gallery-030.jpg"), caption: "Architecture", cls: "b7" },
  { picture: imagePicture("gallery-048.jpg"), caption: "Editorial · sand", cls: "b8" },
  { picture: imagePicture("gallery-032.jpg"), caption: "Family · at home", cls: "b9" },
  { picture: imagePicture("gallery-059.jpg"), caption: "Wedding · town hall", cls: "b10" }
];

export const testimonials = [
  {
    quote:
      "Louis disappeared into the day and came back with photographs that feel <em>exactly</em> like how we remember it — soft, warm, and ours.",
    name: "Mara & Tomás",
    role: "Wedding · Frankfurt, 2024",
    avatar: imagePicture("gallery-052.jpg")
  },
  {
    quote:
      "I usually feel awkward in front of a camera, but Louis made the whole portrait session feel calm and easy. The photos feel polished without losing me.",
    name: "Hanna",
    role: "Portrait session · Frankfurt, 2024",
    avatar: imagePicture("gallery-061.jpg")
  },
  {
    quote:
      "Our portraits feel like <em>us</em> — not posed, not stiff, just two people who like each other. We could not be happier.",
    name: "Lukas & Sarah",
    role: "Engagement · Berlin, 2024",
    avatar: imagePicture("gallery-010.jpg")
  }
];

export const galleryCategories = [
  { id: "all", label: "All" },
  { id: "portraits", label: "Portraits" },
  { id: "weddings", label: "Weddings" },
  { id: "family", label: "Family" },
  { id: "events", label: "Events" },
  { id: "aerial", label: "Aerial" },
  { id: "animals", label: "Animals" },
  { id: "architecture", label: "Architecture" },
  { id: "travel", label: "Travel" }
];


export const galleryImages = galleryEntries.map((entry) => ({
  picture: imagePicture(entry.file),
  alt: entry.alt,
  category: entry.category
}));

export const legalSections = [
  {
    heading: "Angaben gemäß § 5 TMG",
    paragraphs: [
      "Louis Peter, Ludwig-Landmann-Straße 190, 60488 Frankfurt am Main",
      "Vertreten durch: Louis Peter",
      "Kontakt: Telefon 0176-82113705, E-Mail louisclarencepeters@gmail.com"
    ]
  },
  {
    heading: "Haftung für Inhalte",
    paragraphs: [
      "Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden.",
      "Als Diensteanbieter ist Louis Peter gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich."
    ]
  },
  {
    heading: "Haftung für Links",
    paragraphs: [
      "Dieses Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte kein Einfluss besteht. Deshalb kann für diese fremden Inhalte auch keine Gewähr übernommen werden.",
      "Bei Bekanntwerden von Rechtsverletzungen werden derartige Links umgehend entfernt."
    ]
  },
  {
    heading: "Urheberrecht",
    paragraphs: [
      "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.",
      "Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet."
    ]
  },
  {
    heading: "Datenschutz",
    paragraphs: [
      "Die Nutzung dieser Website ist in der Regel ohne Angabe personenbezogener Daten möglich. Soweit personenbezogene Daten erhoben werden, erfolgt dies möglichst auf freiwilliger Basis.",
      "Es wird darauf hingewiesen, dass die Datenübertragung im Internet Sicherheitslücken aufweisen kann und ein vollständiger Schutz vor dem Zugriff durch Dritte nicht möglich ist."
    ]
  },
  {
    heading: "Cookies",
    paragraphs: [
      "Diese React-Version der Website verwendet derzeit nur lokalen Browser-Speicher, um Ihre Cookie-Auswahl auf diesem Gerät zu merken.",
      "Es werden aktuell keine Analyse- oder Marketing-Cookies durch die von uns bereitgestellte Banner-Funktion gesetzt."
    ]
  },
  {
    heading: "Quelle",
    paragraphs: [
      "Website Impressum erstellt durch impressum-generator.de von der Kanzlei Hasselbach."
    ]
  }
];
