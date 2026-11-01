export const siteConfig = {
  brandName: "NTM Fabrics",
  brandTagline: "Fabric That Defines Your Presence",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ntm.com").replace(/\/+$/, ""),
  currency: "PKR",
  currencySymbol: "PKR",
  whatsappNumber: "923187006295",
  phone: "+92 318 7006295",
  email: "hello@noorfabrics.pk",
  city: "Faisalabad, Pakistan",
  address: "Susan Road, Faisalabad, Punjab, Pakistan",
  mapCoordinates: undefined as { lat: number; lng: number } | undefined,
  social: {
    instagram: "https://instagram.com/noorfabrics",
    facebook: "https://facebook.com/noorfabrics"
  },
  businessHours: [
    { day: "Monday - Thursday", hours: "10:00 AM - 9:00 PM" },
    { day: "Friday", hours: "CLOSED" },
    { day: "Saturday", hours: "11:00 AM - 9:00 PM" },
    { day: "Sunday", hours: "1:00 PM - 7:00 PM" }
  ]
};
