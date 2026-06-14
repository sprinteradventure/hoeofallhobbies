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
      <svg
        viewBox="0 0 200 140"
        xmlns="http://www.w3.org/2000/svg"
        className="w-20 h-28 md:w-24 md:h-32"
      >
        {/* Main bow center */}
        <ellipse cx="100" cy="70" rx="20" ry="25" fill="#ead6ce" />

        {/* Left bow loop */}
        <path
          d="M 80 70 Q 40 50 35 70 Q 40 90 60 85 Q 75 82 80 70"
          fill="#ead6ce"
        />

        {/* Right bow loop */}
        <path
          d="M 120 70 Q 160 50 165 70 Q 160 90 140 85 Q 125 82 120 70"
          fill="#ead6ce"
        />

        {/* Left ribbon tail */}
        <path
          d="M 50 85 Q 35 100 40 125 L 55 120"
          fill="#ead6ce"
          strokeWidth="1"
          stroke="#ead6ce"
        />

        {/* Right ribbon tail */}
        <path
          d="M 150 85 Q 165 100 160 125 L 145 120"
          fill="#ead6ce"
          strokeWidth="1"
          stroke="#ead6ce"
        />

        {/* Bow knot detail */}
        <circle cx="100" cy="70" r="8" fill="#c9a876" opacity="0.6" />
      </svg>
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
          Restunable Finds for Creative Vendors
        </div>
      </div>
    </div>
  );
}

export function BotanicalDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <div className="text-4xl text-gold">🌿</div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold to-transparent"></div>
      <div className="text-4xl text-gold">🌿</div>
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
        <path d="M 110 110 Q 13