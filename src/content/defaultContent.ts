import type { SiteContent } from './types'

export const DEFAULT_SITE_CONTENT: SiteContent = {
  news: [
    {
      id: 'news-featured-1',
      featured: true,
      pinned: true,
      badge: 'BREAKING',
      date: '2023-10-15',
      dateText: 'October 15, 2023',
      title: 'India Secures Historic Gold at Asian Sepak Takraw Championship',
      imageUrl:
        'https://cdn.sanity.io/images/nxpteyfv/goguides/a7ce97b06684118585d4cc17233e90956db57b37-1600x1066.jpg',
    },
    {
      id: 'news-card-1',
      featured: false,
      pinned: false,
      badge: 'TRIALS',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateText: '2 days ago',
      title: 'Selection Trials for Upcoming Junior World Cup',
      excerpt:
        'The federation invites all qualified state athletes to report to the Delhi center for final selection trials.',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCF1I3OdsBVk8Ob5hVQXATeOWkiBQabBzYlNeBFPGzcY7DkaR_AJCHYUvWpc80fOee3qV4tC7eF7WozOf_yoKoe8YBOblKxW7AKb2vxQO2TuccvelOfPb-hgGav3FqPP5zktuEdCwaAznMXkhSTDSt1iWHEilKYDXnCgVBSuqdVRvucU4Ulm2WWZH4b-2ycuqt9FVR11aNuTcNj2JnWP4nPwFG38uWSFKhnBJTdY6k56SNtHa4s125zgmCHidnl2YII9FUmcHRd5IE',
    },
    {
      id: 'news-card-2',
      featured: false,
      pinned: false,
      badge: 'INITIATIVE',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateText: '1 week ago',
      title: 'New "Grassroots to Gold" Program Launched in Rohtak',
      excerpt:
        'A focused initiative to scout young talent from rural areas has been kicked off by the sports minister.',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD1XnIzwVStL8fo84uivXenDK7SRq_q7RH4pwB1GQnuaxPgLY1cmwUVE2c1PZjbtfvVk3Z0YWAjI2zo5WImpOHFgXMI5mIdbOnWGxxwmgGRAjEmCi-veBh6s1Y1pcbx0-jMn86bKlAXoCPJQtVWnmq0NKrrfstP7ZJmCEy6HRgx6t8JJD-SYLSPWZvrAowPOlVaV14M-IKhwRR9xHfUvloPi6tBgqIhP8jtE5ekQtkLO16JuZ9fqMzbePaVRvU-MUR6cwInkBEsQ28',
    },
  ],
  tournaments: [
    {
      id: 'tourn-1',
      pinned: true,
      month: 'NOV',
      day: '12',
      title: '34th Senior National Championship',
      location: 'Indira Gandhi Stadium, Delhi',
      status: 'CONFIRMED',
    },
    {
      id: 'tourn-2',
      pinned: false,
      month: 'DEC',
      day: '05',
      title: 'North Zone Federation Cup',
      location: 'Chandigarh Sports Complex',
      status: 'REGISTRATION OPEN',
    },
    {
      id: 'tourn-3',
      pinned: false,
      month: 'JAN',
      day: '18',
      title: 'All India Inter-University Meet',
      location: 'Chennai, TN',
      status: 'TENTATIVE',
    },
  ],
}
