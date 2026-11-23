export type ServiceItem = {
  title: string;
  description: string;
};

export type ServicePackage = {
  name: string;
  price: string;
  description: string;
  inclusions: string[];
};

export type SampleWork = {
  title: string;
  category: string;
  image: string;
  alt: string;
};

export type ServicesConfig = {
  businessName: string;
  tagline: string;
  whatsappNumber: string;
  whatsappMessage: string;
  content: {
    heroEyebrow: string;
    heroDescription: string;
    exploreServices: string;
    brandSnapshot: string;
    servicesEyebrow: string;
    servicesHeading: string;
    servicesDescription: string;
    worksEyebrow: string;
    worksHeading: string;
    worksDescription: string;
    packagesEyebrow: string;
    packagesHeading: string;
    packagesDescription: string;
    packageButton: string;
    contactHeading: string;
    contactDescription: string;
    contactButton: string;
    copyLinkButton: string;
    copiedMessage: string;
    samplePlaceholder: string;
    footerLine: string;
  };
  services: ServiceItem[];
  packages: ServicePackage[];
  sampleWorks: SampleWork[];
};

// Add the business WhatsApp number and replace the sample copy, prices, and image paths before publishing.
export const servicesConfig: ServicesConfig = {
  businessName: "BrandVibe Studio",
  tagline: "Make your food brand impossible to forget.",
  whatsappNumber: "",
  whatsappMessage: "Assalamu alaikum! I would like to know more about your design services.",
  content: {
    heroEyebrow: "Creative studio for food businesses",
    heroDescription:
      "Thoughtful branding and digital design for restaurants, cafes, bakeries, and the people behind them.",
    exploreServices: "Explore services",
    brandSnapshot: "Brand snapshot",
    servicesEyebrow: "What we do",
    servicesHeading: "Services for your next step",
    servicesDescription: "Pick one focused service or bring the whole brand together.",
    worksEyebrow: "Selected projects",
    worksHeading: "A few sample works",
    worksDescription: "Replace these sample cards with your own completed projects.",
    packagesEyebrow: "Ways to work together",
    packagesHeading: "Simple packages",
    packagesDescription: "Starting points that can be adjusted to fit your business.",
    packageButton: "Ask about this package",
    contactHeading: "Ready to bring your idea to life?",
    contactDescription: "Tell us what you are building and we will help you choose a good next step.",
    contactButton: "WhatsApp us",
    copyLinkButton: "Copy link",
    copiedMessage: "Link copied",
    samplePlaceholder: "Add a project image in public/samples",
    footerLine: "Made with care.",
  },
  services: [
    {
      title: "Logo design",
      description: "A distinctive logo and a flexible visual starting point for your food brand.",
    },
    {
      title: "Menu design",
      description: "Clear, appetizing menus designed for print, screens, and social sharing.",
    },
    {
      title: "Instagram posts",
      description: "On-brand post designs to make offers, launches, and everyday updates stand out.",
    },
    {
      title: "Google Business profile setup",
      description: "A polished business profile setup to help nearby customers find your location.",
    },
    {
      title: "Food photo editing",
      description: "Careful edits that make your food photography look consistent and inviting.",
    },
    {
      title: "Packaging and stickers for bakeries",
      description: "Packaging details and stickers that make every bakery order feel considered.",
    },
  ],
  packages: [
    {
      name: "Starter",
      price: "PKR 8,000",
      description: "A polished first impression for a new or refreshed brand.",
      inclusions: ["Logo design", "Color palette", "Two revision rounds"],
    },
    {
      name: "Growth",
      price: "PKR 18,000",
      description: "A coordinated look across your menu and social channels.",
      inclusions: ["Logo design", "Menu design", "Six Instagram post designs", "Three revision rounds"],
    },
    {
      name: "Complete",
      price: "PKR 32,000",
      description: "A joined-up brand experience from discovery to packaging.",
      inclusions: ["Logo and mini brand guide", "Menu design", "Packaging and stickers", "Ten Instagram post designs"],
    },
  ],
  sampleWorks: [
    {
      title: "Cafe identity",
      category: "Logo and brand colors",
      image: "/samples/cafe-identity.jpg",
      alt: "Sample cafe logo and color palette",
    },
    {
      title: "Bakery menu",
      category: "Menu design",
      image: "/samples/bakery-menu.jpg",
      alt: "Sample bakery menu design",
    },
    {
      title: "Dessert launch",
      category: "Instagram campaign",
      image: "/samples/dessert-campaign.jpg",
      alt: "Sample dessert launch social media design",
    },
  ],
};

export function getWhatsAppUrl(config: ServicesConfig): string {
  const phone = config.whatsappNumber.replace(/\D/g, "");
  const recipient = phone ? `/${phone}` : "/";
  return `https://wa.me${recipient}?text=${encodeURIComponent(config.whatsappMessage)}`;
}
