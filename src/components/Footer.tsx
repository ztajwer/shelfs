"use client";

import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import { siteConfig } from "@/lib/site";
import { buildWhatsAppInquiryUrl } from "@/lib/whatsapp";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export default function Footer() {
  const whatsappNumber = siteConfig.boutiquePhoneDisplay;
  const whatsappLink = buildWhatsAppInquiryUrl() || `https://wa.me/${siteConfig.boutiquePhoneWhatsApp}`;

  return (
    <footer className="w-full bg-[#FAF6F1] border-t border-[#D4AF37]/20 pt-20 pb-10 px-8 relative z-50 pointer-events-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
        
        {/* Brand Section */}
        <div className="flex flex-col space-y-6">
          <h2 className={`${cormorant.className} text-3xl font-medium text-[#3E2723]`}>
            MAJ Boutique
          </h2>
          <p className="text-sm text-[#3E2723]/70 leading-relaxed font-sans max-w-sm">
            Discover the epitome of luxury and elegance. We craft timeless pieces that celebrate your unique beauty and style.
          </p>
          <div className="flex space-x-4 pt-2">
            {/* Social Icons */}
            <a href="#" className="w-8 h-8 rounded-full border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-colors">
              <span className="sr-only">Instagram</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="w-8 h-8 rounded-full border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-colors">
              <span className="sr-only">Facebook</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>

        {/* Collections Section */}
        <div className="flex flex-col space-y-5">
          <h3 className={`${cormorant.className} text-xl font-medium text-[#3E2723]`}>Collections</h3>
          <ul className="space-y-3 font-sans text-sm text-[#3E2723]/70">
            <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">Fine Jewelry</Link></li>
            <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">Bridal Collection</Link></li>
            <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">Luxury Watches</Link></li>
            <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">Exclusive Perfumes</Link></li>
          </ul>
        </div>

        {/* Customer Care Section */}
        <div className="flex flex-col space-y-5">
          <h3 className={`${cormorant.className} text-xl font-medium text-[#3E2723]`}>Customer Care</h3>
          <ul className="space-y-3 font-sans text-sm text-[#3E2723]/70">
            <li><Link href="/contact" className="hover:text-[#D4AF37] transition-colors">Contact Us</Link></li>
            <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">Shipping & Returns</Link></li>
            <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">Size Guide</Link></li>
            <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">FAQ</Link></li>
          </ul>
        </div>

        {/* Get In Touch Section */}
        <div className="flex flex-col space-y-5">
          <h3 className={`${cormorant.className} text-xl font-medium text-[#3E2723]`}>Get in Touch</h3>
          <div className="flex flex-col space-y-4 font-sans text-sm text-[#3E2723]/70">
            <p>
              Available Monday to Friday, <br/>
              9:00 AM - 6:00 PM (EST)
            </p>
            <a 
              href={whatsappLink}
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center space-x-2 text-[#3E2723] hover:text-[#D4AF37] transition-colors w-fit"
            >
              <svg className="w-5 h-5 text-[#25D366] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M11.964 2c-5.525 0-10 4.475-10 10 0 1.942.556 3.754 1.504 5.29L2 22l4.856-1.258A9.96 9.96 0 0011.964 22c5.525 0 10-4.475 10-10 0-5.525-4.475-10-10-10zm5.419 14.394c-.23.649-1.326 1.25-1.848 1.344-.523.094-1.196.264-3.414-.658-2.677-1.115-4.385-3.844-4.516-4.019-.131-.174-1.077-1.436-1.077-2.738 0-1.303.682-1.944.922-2.203.24-.258.523-.323.697-.323.174 0 .348.006.496.013.158.007.371-.059.58.441.218.522.74 1.81.806 1.943.065.134.108.29.021.464-.087.174-.131.282-.261.434-.13.152-.275.32-.392.441-.131.134-.268.282-.12.538.148.256.662 1.096 1.428 1.782.986.883 1.808 1.155 2.069 1.288.261.133.414.111.565-.062.152-.173.652-.756.826-1.016.174-.26.348-.217.587-.13.24.086 1.524.717 1.785.847.261.13.435.195.499.303.065.109.065.632-.165 1.281z" />
              </svg>
              <span className="font-medium">{whatsappNumber}</span>
            </a>
            <a href="mailto:info@majboutique.com" className="hover:text-[#D4AF37] transition-colors">
              info@majboutique.com
            </a>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-6 border-t border-[#3E2723]/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 pb-16 lg:pb-0">
        <p className="text-xs text-[#3E2723]/50 font-sans uppercase tracking-widest">
          &copy; {new Date().getFullYear()} MAJ Boutique. All rights reserved.
        </p>
        <div className="flex space-x-6 text-xs text-[#3E2723]/50 font-sans uppercase tracking-widest">
          <Link href="#" className="hover:text-[#D4AF37] transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-[#D4AF37] transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
