import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t bg-neutral-900 text-white mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold mb-4">About</h3>
            <Link href="#" className="block text-neutral-400 hover:text-white text-sm mb-2">
              About Us
            </Link>
            <Link href="#" className="block text-neutral-400 hover:text-white text-sm mb-2">
              Contact
            </Link>
            <Link href="#" className="block text-neutral-400 hover:text-white text-sm">
              Blog
            </Link>
          </div>
          <div>
            <h3 className="font-bold mb-4">Support</h3>
            <Link href="#" className="block text-neutral-400 hover:text-white text-sm mb-2">
              Help Center
            </Link>
            <Link href="#" className="block text-neutral-400 hover:text-white text-sm mb-2">
              Safety Tips
            </Link>
            <Link href="#" className="block text-neutral-400 hover:text-white text-sm">
              Report Item
            </Link>
          </div>
          <div>
            <h3 className="font-bold mb-4">Policies</h3>
            <Link href="#" className="block text-neutral-400 hover:text-white text-sm mb-2">
              Terms of Service
            </Link>
            <Link href="#" className="block text-neutral-400 hover:text-white text-sm mb-2">
              Privacy Policy
            </Link>
            <Link href="#" className="block text-neutral-400 hover:text-white text-sm">
              Cookie Policy
            </Link>
          </div>
          <div>
            <h3 className="font-bold mb-4">Connect</h3>
            <Link href="#" className="block text-neutral-400 hover:text-white text-sm mb-2">
              Twitter
            </Link>
            <Link href="#" className="block text-neutral-400 hover:text-white text-sm mb-2">
              Instagram
            </Link>
            <Link href="#" className="block text-neutral-400 hover:text-white text-sm">
              Facebook
            </Link>
          </div>
        </div>
        <div className="border-t border-neutral-700 pt-8 text-center text-neutral-400">
          <p>&copy; 2026 Hoe of All Hobbies. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
