export function FeatureStoryPage() {
  return (
    <main id="page-content" className="flex-1 py-6 sm:py-10">
      <style>{`
        .article-content p { margin-bottom: 1.5rem; line-height: 1.8; color: #374151; }
        .dark .article-content p { color: #d1d5db; }
        .article-content h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #111827; }
        .dark .article-content h2 { color: #f3f4f6; }
        .article-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; }
        .article-content li { margin-bottom: 0.5rem; color: #374151; }
        .dark .article-content li { color: #d1d5db; }
      `}</style>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex mb-6">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                href={import.meta.env.BASE_URL}
              >
                <span className="material-symbols-outlined mr-2 text-base">home</span>
                Home
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-gray-400 mx-1">chevron_right</span>
                <a
                  className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                  href={`${import.meta.env.BASE_URL}news`}
                >
                  News &amp; Media
                </a>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="material-symbols-outlined text-gray-400 mx-1">chevron_right</span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">India Wins Historic Gold</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="rounded-2xl bg-surface-light dark:bg-surface-dark shadow-xl overflow-hidden">
          <div className="relative h-[300px] sm:h-[450px] w-full">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBOi9m2ynbseSa-qeomWU9V4mzWH9JudxULMTCaMqa1UwjTsRRX1gl_MhDQAtigqU_F9oOGVmXVr8tdoYaZgfpNSM_95VbBZcXZUudrak2WJ4mDNMOBwcNJT-mpfduJS5k5DYaV05JwEJ0Sz-ThT7c0Hf8jWlh9twNAG1zIslj-4riIK8Y4-S_Uqt_NYSxyjqn9sRImszlnFEf8lN3Cy_BT1KsICXV_qyAKrRiA4fVMuwN2xZnDL4BCo9LZ8TT_FPmiaEtl36naG2w")',
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 text-white">
              <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider uppercase bg-secondary rounded-full">
                Championship News
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4">
                India Wins Historic Gold at Asian Championship Finals
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base text-gray-200">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent" style={{ fontSize: 20 }}>
                    account_circle
                  </span>
                  <span>By Aditi Sharma</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent" style={{ fontSize: 20 }}>
                    calendar_today
                  </span>
                  <span>October 24, 2023</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent" style={{ fontSize: 20 }}>
                    schedule
                  </span>
                  <span>5 min read</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-0 lg:gap-12">
            <div className="p-6 sm:p-10">
              <p className="text-xl font-medium leading-relaxed text-gray-900 dark:text-gray-100 mb-8 border-l-4 border-primary pl-4">
                In a stunning display of agility and teamwork that will be remembered for generations, the national
                team secured the top spot in a thrilling final against longtime rivals Thailand. The victory marks a
                new era for Indian Sepak Takraw on the international stage.
              </p>
              <div className="article-content text-base sm:text-lg">
                <p>
                  The atmosphere at the indoor stadium was electric as the Indian squad stepped onto the court. Having
                  trained rigorously for the past 18 months under the new coaching staff, the team's coordination was
                  visibly superior from the very first serve. The match, which extended to a nail-biting third set,
                  showcased not just physical prowess but immense mental fortitude.
                </p>
                <h2>Turning the Tide</h2>
                <p>
                  The first set saw Thailand dominating with their signature roll spikes, taking the lead 21-17.
                  However, the Indian team, led by captain Rajesh Kumar, regrouped quickly. "We knew we had the skills,
                  we just needed to control the tempo," Kumar said in the post-match interview. And control it they
                  did.
                </p>
                <p>
                  The second set was a masterclass in defense. The Indian 'tekong' (server) delivered consistent,
                  high-speed serves that disrupted Thailand's formation, allowing India's strikers to capitalize on
                  weak returns. They took the second set 21-19, pushing the game to a decider.
                </p>
                <figure className="my-8">
                  <img
                    alt="Action shot of the winning moment"
                    className="w-full rounded-xl shadow-md"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJs3mEF9UHnamtvV7tArgtxURMeI0CwAA2TTzjFkxbaLdLndNBK1LR6tnrAF8j5Ie1QhvHhcGY9wgL1eOcH6xAjYPFk6mVUR1XFf-ZYrrS2FmQRyFmB8wJaTJ-v4HRExSU0xf4u7uQl7Zd1nPlJ-qy6lz1NSwRcNWlU1l7G2uNz0ycwzdBNv2TFZSujf5nKqJXD5h7bTju8T37nfOo73ooc7r0Mq6UhzYK51LTaKht9X-M6aLKBw3mrMKUYSf6x9YdUPZtWjD3fxQ"
                  />
                  <figcaption className="mt-3 text-sm text-center text-gray-500 dark:text-gray-400 italic">
                    The decisive spike that sealed the victory for India in the final set.
                  </figcaption>
                </figure>
                <h2>A Historic Moment</h2>
                <p>
                  The final set was point-for-point until 19-19. It was then that young striker Amit Singh executed a
                  perfect sunback spike to gain the match point. The final whistle blew with India winning 21-19,
                  erupting the stadium into cheers.
                </p>
                <ul>
                  <li>
                    <strong>Gold Medal:</strong> India (First time in this category)
                  </li>
                  <li>
                    <strong>Silver Medal:</strong> Thailand
                  </li>
                  <li>
                    <strong>Bronze Medal:</strong> Malaysia &amp; South Korea
                  </li>
                </ul>
                <p>
                  This victory ensures India's automatic qualification for the upcoming World Cup, a goal the
                  federation has been chasing for over a decade. The Sports Ministry has announced cash rewards for the
                  entire squad and promised increased funding for grassroots Sepak Takraw programs.
                </p>
                <blockquote className="my-8 p-6 bg-background-light/30 dark:bg-background-dark rounded-xl border-l-4 border-accent">
                  <p className="mb-2 text-xl italic font-serif text-gray-800 dark:text-gray-200">
                    "This isn't just a win for the team; it's a win for every young kid in India picking up a rattan
                    ball. We have arrived on the world stage."
                  </p>
                  <footer className="text-sm font-bold text-primary">— Head Coach, Vikram Rathore</footer>
                </blockquote>
                <p>
                  The team will return to New Delhi on Monday, where a grand reception is planned at the Indira Gandhi
                  International Airport.
                </p>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full dark:bg-gray-700 dark:text-gray-300">
                    #SepakTakraw
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full dark:bg-gray-700 dark:text-gray-300">
                    #TeamIndia
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full dark:bg-gray-700 dark:text-gray-300">
                    #AsianChampionship
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full dark:bg-gray-700 dark:text-gray-300">
                    #GoldMedal
                  </span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                  Share this story:
                </span>
                <div className="flex gap-2">
                  <button className="size-10 flex items-center justify-center rounded-full bg-[#1877F2] text-white hover:opacity-90 transition-opacity">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                    </svg>
                  </button>
                  <button className="size-10 flex items-center justify-center rounded-full bg-[#1DA1F2] text-white hover:opacity-90 transition-opacity">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path>
                    </svg>
                  </button>
                  <button className="size-10 flex items-center justify-center rounded-full bg-[#0A66C2] text-white hover:opacity-90 transition-opacity">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
