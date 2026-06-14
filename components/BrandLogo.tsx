import Image from 'next/image'

export function HoeWordmark() {
  return (
    <div className="text-center space-y-2">
      <div className="font-cormorant text-4xl md:text-5xl font-bold text-charcoal tracking-wider">
        HOE
      </div>
      <div className="mx-auto max-w-xs md:max-w-sm">
        <Image
          src="/images/logo-of-all.png"
          alt="of all"
          width={400}
          height={125}
          className="w-full h-auto object-contain"
          priority
        />
      </div>
      <div className="font-cormorant text-4xl md:text-5xl font-bold text-charcoal tracking-wider">
        HOBBIES
      </div>
      <div className="text-sm md:text-base uppercase tracking-widest text-taupe font-lora pt-2">
        Sustainable Finds for Creative Minds
      </div>
    </div>
  );
}

export function HoeMonogram() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-charcoal/90 flex items-center justify-center shadow-lg border-2 border-gold/40">
        <Image
          src="/images/H.png"
          alt="Hoe of All Hobbies Monogram"
          width={200}
          height={200}
          className="w-16 h-16 md:w-20 md:h-20 object-contain"
          priority
        />
      </div>
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
      <div className="w-10 h-10 flex items-center justify-center">
        <Image
          src="/images/H.png"
          alt="Decorative bow"
          width={40}
          height={40}
          className="w-8 h-8 object-contain"
        />
      </div>
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
        <path d="M 100 160 Q 95 130 100 100 Q 105 70 100 40" />
        <path d="M 95 140 Q 75 135 70 155" />
        <path d="M 90 110 Q 65 105 55 125" />
        <path d="M 92 80 Q 70 75 60 95" />
        <path d="M 95 50 Q 75 45 65 65" />
        <path d="M 105 140 Q 125 135 130 155" />
        <path d="M 110 110 Q 135 105 145 125" />
        <path d="M 108 80 Q 130 75 140 95" />
        <path d="M 105 50 Q 125 45 135 65" />
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
      <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto rounded-full bg-charcoal/90 flex items-center justify-center shadow-xl border-2 border-gold/40">
        <Image
          src="/images/H.png"
          alt="Hoe of All Hobbies Monogram"
          width={300}
          height={300}
          className="w-32 h-32 md:w-40 md:h-40 object-contain"
          priority
        />
      </div>
    </div>
  );
}

export function RibbonDivider() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="w-24 h-10 flex items-center justify-center">
        <Image
          src="/images/logo-of-all.png"
          alt="of all"
          width={200}
          height={62}
          className="w-full h-full object-contain opacity-80"
        />
      </div>
    </div>
  );
}

export function SmallMonogram() {
  return (
    <div className="w-8 h-8 rounded-full bg-charcoal/90 flex items-center justify-center border border-gold/30">
      <Image
        src="/images/H.png"
        alt="Monogram"
        width={32}
        height={32}
        className="w-5 h-5 object-contain"
      />
    </div>
  );
}
