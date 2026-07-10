import { siteConfig } from "@/lib/site";

function resolveWhatsAppDigits(): string {
  const envVal = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const fromEnv = typeof envVal === "string" ? envVal.replace(/\D/g, "") : "";
  if (fromEnv && fromEnv.length >= 8) return fromEnv;
  return siteConfig.boutiquePhoneWhatsApp;
}

const WHATSAPP_NUMBER = resolveWhatsAppDigits();

export function isWhatsAppConfigured(): boolean {
  return WHATSAPP_NUMBER.length >= 8;
}

export function getBoutiquePhoneDisplay(): string {
  return siteConfig.boutiquePhoneDisplay;
}

export function buildWhatsAppInquiryUrl(
  productTitle?: string,
  customization?: {
    body: string;
    stone: string;
    price: string;
  }
): string | null {
  if (!isWhatsAppConfigured()) return null;

  let message = productTitle
    ? `Hello, I would like to inquire about the ${productTitle} from MAJ Boutique.`
    : "Hello, I would like to inquire about a piece from MAJ Boutique.";

  if (customization) {
    message += `\n\nCustomized Options:\n- Metal: ${customization.body.toUpperCase()}\n- Stone/Accent: ${customization.stone.toUpperCase()}\n- Price: ${customization.price}`;
  }

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppInquiry(
  productTitle?: string,
  customization?: {
    body: string;
    stone: string;
    price: string;
  }
): void {
  const url = buildWhatsAppInquiryUrl(productTitle, customization);
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}
