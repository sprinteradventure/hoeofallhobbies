import Image from 'next/image'

export function HoeWordmark() {
  return (
    <div className="text-center">
      <div className="font-cormorant text-4xl md:text-5xl font-bold text-charcoal mb-2 tracking-wider">
        HOE <span className="italic">of all</span> HOBBIES
      </div>
      <div className="text-sm md:text-base uppercase tracking-widest text-taupe font-lora">
        Sustainable Finds for Creative Minds
      </div>
    </div>
  );
}

export function HoeMonogram() {
  return (
    <div className="flex items-center justify-center">
      <Image
        src="/images/branding-kit.png"
        alt="Hoe of All Hobbies Monogram"
        width={200}
        height={200}
        className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-full"
        style={{ objectPosition: '72% 12%' }}
        priority
      />
    </div>
  );
}

export function HoeBadge() {
  return (
    <div className="flex items-center justify-center">
      <div className="border-2 border-charcoal rounded-full px-8 py-6 text-center">
        <div className="text-sm uppercase tracking-widest text-charcoal mb-1 font-lora">
          Hoe of All Hobbies
        </div>
        <div className="text-3xl mb-1">🎀</div>
        <div className="text-xs uppercase tracking-widest text-charcoal font-lora">
          Sustainable Finds for Creative Minds
        </div>
      </div>
    </div>
  );
}

export function BotanicalDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold to-transparent"></div>
      <Image
        src="/images/H.png"
        alt="Decorative ribbon"
        width={80}
        height={40}
        className="h-8 w-auto object-contain opacity-80"
      />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold to-transparent"></div>
    </div>
  );
}

export function BotanicalElement() {
  return (
    <svg
      className="text-gold"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="80"
      height="80"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7">
        {/* Main stem */}
        <path d="M 100 160 Q 95 130 100 100 Q 105 70 100 40" />

        {/* Left branches */}
        <path d="M 95 140 Q 75 135 70 155" />
        <path d="M 90 110 Q 65 105 55 125" />
        <path d="M 92 80 Q 70 75 60 95" />
        <path d="M 95 50 Q 75 45 65 65" />

        {/* Right branches */}
        <path d="M 105 140 Q 125 135 130 155" />
        <path d="M 110 110 Q 135 105 145 125" />
        <path d="M 108 80 Q 130 75 140 95" />
        <path d="M 105 50 Q 125 45 135 65" />

        {/* Small leaves */}
        <ellipse cx="70" cy="155" rx="3" ry="5" fill="currentColor" opacity="0.4" />
        <ellipse cx="55" cy="125" rx="3" ry="5" fill="currentColor" opacity="0.4" />
        <ellipse cx="60" cy="95" rx="3" ry="5" fill="currentColor" opacity="0.4" />
        <ellipse cx="65" cy="65" rx="3" ry="5" fill="currentColor" opacity="0.4" />
        <ellipse cx="130" cy="155" rx="3" ry="5" fill="currentColor" opacity="0.4" />
        <ellipse cx="145" cy="125" rx="3" ry="5" fill="currentColor" opacity="0.4" />
        <ellipse cx="140" cy="95" rx="3" ry="5" fill="currentColor" opacity="0.4" />
        <ellipse cx="135" cy="65" rx="3" ry="5" fill="currentColor" opacity="0.4" />
      </g>
    </svg>
  );
}

export function BrandHeroImage() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <Image
        src="/images/branding-kit.png"
        alt="Hoe of All Hobbies Branding"
        width={1024}
        height={1536}
        className="w-full h-auto object-contain rounded-2xl"
        priority
      />
    </div>
  );
}

export function RibbonDivider() {
  return (
    <div className="flex items-center justify-center py-4">
      <Image
        src="/images/H.png"
        alt="Decorative ribbon"
        width={200}
        height={100}
        className="h-12 w-auto object-contain opacity-70"
      />
    </div>
  );
}
