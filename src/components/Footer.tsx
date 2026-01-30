import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="bg-[#1a0f24] text-white pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <img
                src={`${import.meta.env.BASE_URL}assets/images/logo.png`}
                alt="STFI Logo"
                className="size-10 rounded-full object-contain bg-white"
              />
              <div className="flex flex-col">
                <span className="text-sm font-black text-white leading-tight uppercase">
                  HARYANA SEPAK TAKRAW ASSOCIATION
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              The governing body for Sepak Takraw in India. Dedicated to promoting the sport, nurturing talent, and
              organizing world-class competitions across the nation.
            </p>
            <div className="flex gap-4 pt-2">
              <a
                className="size-8 rounded bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                href="#"
              >
                <span className="text-xs font-bold">FB</span>
              </a>
              <a
                className="size-8 rounded bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                href="#"
              >
                <span className="text-xs font-bold">X</span>
              </a>
              <a
                className="size-8 rounded bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                href="#"
              >
                <span className="text-xs font-bold">IG</span>
              </a>
              <a
                className="size-8 rounded bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                href="#"
              >
                <span className="text-xs font-bold">YT</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 text-white">Quick Links</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link className="hover:text-primary transition-colors" to="/about">
                  About Us
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/news">
                  News
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/documents">
                  Documents
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/players">
                  Players
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/contact">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 text-white">Contact Us</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
                <span>
                  Room No. 12, Gate 14,
                  <br />
                  Indira Gandhi Stadium Complex,
                  <br />
                  New Delhi - 110002
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">call</span>
                <span>+91 11 2345 6789</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">mail</span>
                <span>contact@stfi.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>&copy; 2024 Haryana Sepak Takraw Association. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
