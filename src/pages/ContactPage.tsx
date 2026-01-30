export function ContactPage() {
  return (
    <main id="page-content" className="w-full overflow-x-hidden relative">
      <section className="relative w-full min-h-[400px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          data-alt="Athletic action shot of players in a stadium"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBQkZ3uNiS3toCeitYMgI3en60sbHGrCFfS_mrSJR_zBr25ZEpm3jApXKID8GmpUBbzhJGl3Rlpwm0TnepehtJcUJ-zfEx3ky6DecBLi6sXU4qbvE8n_TewEKhZBFUqp28mnYd_FWOSl9pdfv-Df3FEkrwCka2vaLflSvMhRjbQfsc8vbcockhtk-wV1GBDI5oYK_gIYb8YmUbBBr0LJTsSHf5x-ow8cJ-6tozDP1aDYmSNn6NJFUZiZqCbftjCQlDZ18Nk1PaopU0")',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#5a0a8f]/90 via-[#be185d]/80 to-transparent z-10"></div>
        <div className="relative z-20 max-w-[1280px] w-full px-4 sm:px-6 lg:px-8 py-20 flex flex-col justify-center h-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
              <span className="material-symbols-outlined text-sm text-white">support_agent</span>
              <span className="text-white text-[10px] font-bold uppercase tracking-wider">GET IN TOUCH</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              Contact Us
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 font-light leading-relaxed max-w-lg">
              Have questions about tournaments, membership, or general inquiries? We are here to help grow the sport of
              Sepak Takraw in India.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-30 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8 border border-gray-700">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Send us a message</h2>
                <p className="text-gray-300 text-sm">
                  Fill out the form below and our team will get back to you within 24 hours.
                </p>
              </div>
              <form className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <label className="flex flex-col flex-1">
                    <span className="text-white text-sm font-medium leading-normal pb-2">
                      Full Name
                    </span>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-[#5a0a8f] border border-gray-300 bg-white focus:border-[#5a0a8f] h-12 placeholder:text-gray-400 p-4 text-base font-normal leading-normal transition-all"
                      placeholder="Enter your full name"
                      type="text"
                    />
                  </label>
                  <label className="flex flex-col flex-1">
                    <span className="text-white text-sm font-medium leading-normal pb-2">
                      Email Address
                    </span>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-[#5a0a8f] border border-gray-300 bg-white focus:border-[#5a0a8f] h-12 placeholder:text-gray-400 p-4 text-base font-normal leading-normal transition-all"
                      placeholder="name@example.com"
                      type="email"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <label className="flex flex-col flex-1">
                    <span className="text-white text-sm font-medium leading-normal pb-2">
                      Phone Number
                    </span>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-[#5a0a8f] border border-gray-300 bg-white focus:border-[#5a0a8f] h-12 placeholder:text-gray-400 p-4 text-base font-normal leading-normal transition-all"
                      placeholder="+91 98765 43210"
                      type="tel"
                      defaultValue="+91 98765 43210"
                    />
                  </label>
                  <label className="flex flex-col flex-1">
                    <span className="text-white text-sm font-medium leading-normal pb-2">
                      Subject
                    </span>
                    <div className="relative">
                      <select className="form-select flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-[#5a0a8f] border border-gray-300 bg-white focus:border-[#5a0a8f] h-12 px-4 text-base font-normal leading-normal appearance-none cursor-pointer transition-all">
                        <option>General Inquiry</option>
                        <option>Membership</option>
                        <option>Tournaments</option>
                        <option>Press &amp; Media</option>
                      </select>
                    </div>
                  </label>
                </div>
                <label className="flex flex-col flex-1">
                  <span className="text-white text-sm font-medium leading-normal pb-2">
                    Message
                  </span>
                  <textarea
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-[#5a0a8f] border border-gray-300 bg-white focus:border-[#5a0a8f] placeholder:text-gray-400 p-4 text-base font-normal leading-normal transition-all"
                    placeholder="How can we help you?"
                    rows={4}
                  ></textarea>
                </label>
                <div className="pt-2">
                  <button
                    className="w-full sm:w-auto px-8 h-12 bg-[#5a0a8f] hover:bg-[#400466] text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    type="button"
                  >
                    <span>Send Message</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-[#5a0a8f] text-white rounded-xl shadow-lg p-6 sm:p-8 relative overflow-hidden">
              <h3 className="text-xl font-bold mb-6">Contact Information</h3>
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white">location_on</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">HEADQUARTERS</p>
                    <p className="text-sm font-medium leading-relaxed">
                      Room No. 12, Gate 14, Indira Gandhi Stadium Complex, New Delhi - 110002
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white">mail</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">EMAIL US</p>
                    <a
                      className="text-sm font-medium hover:text-yellow-300 transition-colors"
                      href="mailto:info@sepaktakraw.in"
                    >
                      info@sepaktakraw.in
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white">call</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">PHONE</p>
                    <a className="text-sm font-medium hover:text-yellow-300 transition-colors" href="tel:+911123456789">
                      +91 11 2345 6789
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/20">
                <p className="text-sm font-medium mb-3">Follow us</p>
                <div className="flex gap-4">
                  <a
                    aria-label="Facebook"
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-600 transition-colors"
                    href="#"
                  >
                    <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                    </svg>
                  </a>
                  <a
                    aria-label="Twitter"
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-600 transition-colors"
                    href="#"
                  >
                    <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path>
                    </svg>
                  </a>
                  <a
                    aria-label="Instagram"
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-600 transition-colors"
                    href="#"
                  >
                    <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-2 border border-gray-200 h-64 overflow-hidden relative">
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center relative">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-50"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuALh-nrLfC_pRFwgFdLQwTT6W2gkw1CbEpC51gOqJHJpOac9EivLTr6wdtEBfktrUjTeZdO94HmgpOxFaK9B7L-Nad7HrRc4vfMchY_8s4vcr-eUnzn8wYrisUUyo58oJNtK4Pm89Whq2Gm0mb2mwshnYssdpfz7I3Ed2svf5K3OmNMXzRWTopXXmsTLIc5L9idXw9JvU_jaIamA87S4Dh24RZ5_sPAliG9t_XKGwo14a4UwW4J8pgNWvEGbwQ6rfK0plqBLbqAXPE")',
                  }}
                ></div>
                <div className="relative z-10 flex flex-col items-center">
                  <span className="material-symbols-outlined text-red-600 text-5xl drop-shadow-lg">location_on</span>
                  <span className="bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded shadow-lg mt-2">
                    We are here
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="grid gap-4 text-left">
            <details className="group bg-white rounded-lg shadow-sm border border-gray-200 open:shadow-md transition-all">
              <summary className="flex cursor-pointer list-none items-center justify-between p-6 font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                <span>How do I register for the upcoming national tournament?</span>
                <span className="transition group-open:rotate-180">
                  <span className="material-symbols-outlined text-gray-500">expand_more</span>
                </span>
              </summary>
              <div className="group-open:animate-fadeIn px-6 pb-6 text-gray-600">
                Registration details are available on our 'Events' page. You can register through your respective
                state association.
              </div>
            </details>
            <details className="group bg-white rounded-lg shadow-sm border border-gray-200 open:shadow-md transition-all">
              <summary className="flex cursor-pointer list-none items-center justify-between p-6 font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                <span>How can I affiliate my local club?</span>
                <span className="transition group-open:rotate-180">
                  <span className="material-symbols-outlined text-gray-500">expand_more</span>
                </span>
              </summary>
              <div className="group-open:animate-fadeIn px-6 pb-6 text-gray-600">
                Please download the affiliation form from the footer link below and submit it to the Federation office
                via email.
              </div>
            </details>
          </div>
        </div>
      </div>
    </main>
  )
}
