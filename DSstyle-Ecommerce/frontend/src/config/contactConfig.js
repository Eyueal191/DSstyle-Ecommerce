import { useState, useEffect } from "react";

// Centralized store identity and contact configuration (env first, then admin settings cache)
let rawPhone = import.meta.env.VITE_STORE_PHONE || "0918 10 10 22";
if (typeof window !== "undefined") {
  const cached = localStorage.getItem("dsstyle_phone");
  if (cached) rawPhone = cached;
}

// Smart phone caller formatting: converts 09xxxxxxxx -> +2519xxxxxxxx automatically
export const formatPhoneForCall = (phone) => {
  if (!phone) return "+251918101022";
  // The explicit dial string only applies to the main store number
  const explicitCall = import.meta.env.VITE_STORE_PHONE_CALL;
  if (explicitCall && phone === import.meta.env.VITE_STORE_PHONE) return explicitCall;
  const digits = String(phone).replace(/[^0-9+]/g, "");
  if (digits.startsWith("0")) {
    return "+251" + digits.slice(1);
  }
  return digits.startsWith("+") ? digits : "+" + digits;
};

const building = import.meta.env.VITE_STORE_BUILDING || "Golagole 22";
const cityArea = import.meta.env.VITE_STORE_CITY_AREA || "Golagole";

export const CONTACT_CONFIG = {
  // Store Identity & Titles
  storeName: import.meta.env.VITE_STORE_NAME || "DS Style",
  sectionTitle1: import.meta.env.VITE_STORE_SECTION_TITLE1 || "Our",
  sectionTitle2: import.meta.env.VITE_STORE_SECTION_TITLE2 || "Store",

  // Contact Info (dynamically updated from MongoDB backend)
  phone: rawPhone,
  phoneCall: formatPhoneForCall(rawPhone),

  // Physical Location
  cityArea,
  building,
  fullAddress:
    (typeof window !== "undefined" && localStorage.getItem("dsstyle_address")) ||
    import.meta.env.VITE_STORE_FULL_ADDRESS ||
    "Golagole 22, Addis Ababa",
  amharicAddress: "ጎላጎል 22, አዲስ አበባ",

  // Extra order lines shown on the contact page
  otherPhones: ["0707 18 10 22", "0998 77 73 33"],
  telegramOrderHandle: "@DSstyle2",

  // Customer support (chat widget, contact page)
  supportHandle: "@Dsstyle1",
  supportLink: "https://t.me/Dsstyle1",

  // Working Hours & Delivery
  workingHours: "9:00 AM – 8:00 PM (ከጠዋቱ 03:00 - ምሽቱ 02:00, እሁድን ጨምሮ)",
  deliveryFee: "50 – 150 ETB",

  // Maps
  googleMapLink:
    import.meta.env.VITE_GOOGLE_MAP_LINK ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Golagole 22, Addis Ababa, Ethiopia")}`,
  googleMapEmbedUrl:
    import.meta.env.VITE_GOOGLE_MAP_EMBED_URL ||
    `https://maps.google.com/maps?q=${encodeURIComponent("Golagole 22, Addis Ababa, Ethiopia")}&t=&z=16&ie=UTF8&iwloc=&output=embed`,

  // Social & Channels
  telegramLink: import.meta.env.VITE_TELEGRAM_LINK || "https://t.me/DSstyles",
  telegramHandle: import.meta.env.VITE_TELEGRAM_HANDLE || "@DSstyles",
  tiktokLink: import.meta.env.VITE_TIKTOK_LINK || "https://www.tiktok.com/@dsstyle__",
  instagramLink: import.meta.env.VITE_INSTAGRAM_LINK || "",
  facebookLink: import.meta.env.VITE_FACEBOOK_LINK || "",
};

// Reactive React Hook for database-driven contact and support information
export function useStoreContact() {
  const [contact, setContact] = useState(() => {
    const cachedPhone =
      typeof window !== "undefined" ? localStorage.getItem("dsstyle_phone") : null;
    const phone = cachedPhone || CONTACT_CONFIG.phone;

    const cachedAddress =
      typeof window !== "undefined" ? localStorage.getItem("dsstyle_address") : null;
    const fullAddress = cachedAddress || CONTACT_CONFIG.fullAddress;

    const cachedStoreName =
      typeof window !== "undefined" ? localStorage.getItem("dsstyle_store_name") : null;
    const storeName = cachedStoreName || CONTACT_CONFIG.storeName;

    return {
      phone,
      phoneCall: formatPhoneForCall(phone),
      fullAddress,
      storeName,
      building: CONTACT_CONFIG.building,
      cityArea: CONTACT_CONFIG.cityArea,
      googleMapLink: CONTACT_CONFIG.googleMapLink,
      googleMapEmbedUrl: CONTACT_CONFIG.googleMapEmbedUrl,
      telegramLink: CONTACT_CONFIG.telegramLink,
      supportLink: CONTACT_CONFIG.supportLink,
      tiktokLink: CONTACT_CONFIG.tiktokLink,
      instagramLink: CONTACT_CONFIG.instagramLink,
      facebookLink: CONTACT_CONFIG.facebookLink,
    };
  });

  useEffect(() => {
    const handleUpdate = (e) => {
      const s = e?.detail || {};
      const newPhone =
        s.phoneNumber ||
        (typeof window !== "undefined" ? localStorage.getItem("dsstyle_phone") : null) ||
        CONTACT_CONFIG.phone;

      const newAddress =
        s.address ||
        (typeof window !== "undefined" ? localStorage.getItem("dsstyle_address") : null) ||
        CONTACT_CONFIG.fullAddress;

      const newStoreName =
        s.storeName ||
        (typeof window !== "undefined" ? localStorage.getItem("dsstyle_store_name") : null) ||
        CONTACT_CONFIG.storeName;

      setContact({
        phone: newPhone,
        phoneCall: formatPhoneForCall(newPhone),
        fullAddress: newAddress,
        storeName: newStoreName,
        building: CONTACT_CONFIG.building,
        cityArea: CONTACT_CONFIG.cityArea,
        googleMapLink: CONTACT_CONFIG.googleMapLink,
        googleMapEmbedUrl: CONTACT_CONFIG.googleMapEmbedUrl,
        telegramLink: s.telegramChannel || CONTACT_CONFIG.telegramLink,
        supportLink: s.telegramSupport || CONTACT_CONFIG.supportLink,
        tiktokLink: s.tiktok || CONTACT_CONFIG.tiktokLink,
        instagramLink: s.instagram || CONTACT_CONFIG.instagramLink,
        facebookLink: s.facebook || CONTACT_CONFIG.facebookLink,
      });
    };

    window.addEventListener("dsstyle_settings_changed", handleUpdate);
    return () => window.removeEventListener("dsstyle_settings_changed", handleUpdate);
  }, []);

  return contact;
};
