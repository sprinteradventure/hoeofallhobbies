import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-blush bg-ivory text-charcoal mt-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 overflow-hidden rounded-full border border-gold/30">
                <Image
                  src="/images/branding-kit.png"
                  alt="Hoe of All Hobbies"
                  width={60}
                  height={60}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: '72% 12%' }}
                />
              </div>
              <span className="font-cormorant font-bold text-lg tracking-wide">Hoe of All Hobbies</span>
            </div>
            <p className="text-sm text-taupe font-lora leading-relaxed">
              Sustainable finds for creative minds. A curated marketplace for craft and hobby supplies.
            </p>
          </div>
          <div>
            <h3 className="font-cormorant font-bold text-lg mb-4 tracking-wide">About</h3>
            <Link href="#" className="block text-taupe hover:text-gold text-sm mb-2 font-lora transition-colors">
              About Us
            </Link>
            <Link href="#" className="block text-taupe hover:text-gold text-sm mb-2 font-lora transition-colors">
              Contact
            </Link>
            <Link href="#" className="block text-taupe hover:text-gold text-sm font-lora transition-colors">
              Blog
            </Link>
          </div>
          <div>
            <h3 className="font-cormorant font-bold text-lg mb-4 tracking-wide">Support</h3>
            <Link href="#" className="block text-taupe hover:text-gold text-sm mb-2 font-lora transition-colors">
              Help Center
            </Link>
            <Link href="#" className="block text-taupe hover:text-gold text-sm mb-2 font-lora transition-colors">
              Safety Tips
            </Link>
            <Link href="#" className="block text-taupe hover:text-gold text-sm font-lora transition-colors">
              Report Item
            </Link>
          </div>
          <div>
            <h3 className="font-cormorant font-bold text-lg mb-4 tracking-wide">Policies</h3>
            <Link href="#" className="block text-taupe hover:text-gold text-sm mb-2 font-lora transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="block text-taupe hover:text-gold text-sm mb-2 font-lora transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="block text-taupe hover:text-gold text-sm font-lora transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
        <div className="border-t border-blush pt-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image
              src="/images/H.png"
              alt="Decorative ribbon"
              width={60}
              height={30}
              className="h-5 w-auto object-contain opacity-50"
            />
          </div>
          <p className="text-taupe text-sm font-lora">
            &copy; 2026 Hoe of All Hobbies. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
