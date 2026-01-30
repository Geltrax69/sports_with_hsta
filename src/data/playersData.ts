export type Player = {
  id: string
  name: string
  role: string
  state: string
  rank: string
  rankNumber: number
  age: number
  category: string
  image: string
  lastActive: string
  badge: string
  // Detail page fields
  dob?: string
  height?: string
  weight?: string
  skills?: string[]
  biography?: string
  matchesPlayed?: number
  goldMedals?: number
  winRate?: number
  mvpAwards?: number
  tournaments?: Array<{
    eventName: string
    year: number
    category: string
    team: string
    result: 'GOLD' | 'SILVER' | 'BRONZE'
  }>
  rankChange?: number
  rankDescription?: string
}

export const playersData: Player[] = [
  {
    id: 'STFI-2023-042',
    name: 'Amit Sharma',
    role: 'Striker',
    state: 'Delhi',
    rank: '#4',
    rankNumber: 4,
    age: 24,
    category: 'MEN',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA2ncxeYUyPpqET6NmAisc5cWT6_28oeM216RdlgEzkDnVJnpaho9CvSymHDS7GoEo52021Y6-Tf5z2oMXFflJ4k-ye1nGC6EhTRtqYZM6J_ct4fRc3XXus0sD0MPuLZIHEs960LU5gIh8B9ONKX7w96VQCi3tbXe6PV3U_IUyWexTnCf32yyY2ZsnhPef3_G1X_6eIbu6Q_27_eWBQwg6ZcBpSDoPEFa0NL2S_uZEhxADRRA_G7rYn1AVfjyUc_a7Pmwwy3naYcmE',
    lastActive: '2d ago',
    badge: 'NATIONAL TEAM',
    dob: '14 May 1999',
    height: '178 cm',
    weight: '72 kg',
    skills: ['Sunback Spike', 'Agility', 'Team Leadership', 'Defense'],
    biography:
      'Amit Sharma has been a key member of the Delhi state Sepak Takraw team since 2018. Known for his exceptional "Sunback Spike" technique and excellent court coverage, he has consistently been one of the top performers in national competitions. His journey from junior level to representing the national team showcases his dedication and skill. Amit made his breakthrough at the 2021 Federation Cup, where he led Delhi to victory. Beyond playing, he is actively involved in coaching underprivileged youth in his hometown.',
    matchesPlayed: 42,
    goldMedals: 12,
    winRate: 78,
    mvpAwards: 5,
    rankChange: 2,
    rankDescription: 'Top 2% of registered Senior Men players',
    tournaments: [
      {
        eventName: '33rd Senior National Championship',
        year: 2023,
        category: 'Regu',
        team: 'Delhi State',
        result: 'GOLD',
      },
      {
        eventName: 'Federation Cup',
        year: 2023,
        category: 'Doubles',
        team: 'Delhi State',
        result: 'SILVER',
      },
      {
        eventName: 'North Zone Championship',
        year: 2022,
        category: 'Team Event',
        team: 'Delhi State',
        result: 'GOLD',
      },
      {
        eventName: 'Inter-State Challenge',
        year: 2022,
        category: 'Regu',
        team: 'Delhi State',
        result: 'BRONZE',
      },
    ],
  },
  {
    id: 'STFI-2023-118',
    name: 'Priya Singh',
    role: 'Tekong',
    state: 'Maharashtra',
    rank: '#12',
    rankNumber: 12,
    age: 22,
    category: 'WOMEN',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDj4ysVWFrEy44G68XUVyWE05Rvhxb06NeJrzSzWAhbWW1xpZ8Wq20G096gev4nzpwIa4rmt-om6OIJH60tPP7s26CBRrAm8ADm09HhnAkpdIetW4eSuOxF0LOk5L3QcALB21IcIqT1rePol74x98qA4H0_buMwJD72bCoWkL_mVZdA4eHgf6LQOGH6KWXmOOqYBfoQLUGZ9B_uaTJwdPi04MvdLS7gPNVePtg3hTozzZjkfpVFx00C6YAqZvST3sZwOZr7KuaA',
    lastActive: '1w ago',
    badge: '',
    dob: '22 Aug 2001',
    height: '165 cm',
    weight: '58 kg',
    skills: ['Power Serve', 'Accuracy', 'Quick Reflexes'],
    biography:
      'Priya Singh has been representing Maharashtra in Sepak Takraw since 2019. Her powerful serves and exceptional accuracy make her one of the most reliable Tekong players in the women\'s circuit.',
    matchesPlayed: 28,
    goldMedals: 8,
    winRate: 71,
    mvpAwards: 2,
    tournaments: [
      {
        eventName: 'Women\'s National Championship',
        year: 2023,
        category: 'Regu',
        team: 'Maharashtra',
        result: 'GOLD',
      },
    ],
  },
  {
    id: 'STFI-2023-089',
    name: 'Rahul Verma',
    role: 'Feeder',
    state: 'Kerala',
    rank: '#7',
    rankNumber: 7,
    age: 27,
    category: 'MEN',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDI-nIpAKsfK7fouNdh2x1AiqlBZ9co-35EW3_G2FYjViXf7MOYCev5vE2jk6kvk3Vqb5zIgwNdWU1TJZ5tkx7gUliKD0K49FSVJn2SjepwXeXEyojWglm4jcYJPPhjlFAnTFFWS80qOAfiX0bR4Q7mdsdkgTV19K7i--th-mwDYqusS1yBFgJ6Tog6z8w5nlWE0ViBqw7jsceNHKZhEL5xehFpdInUHnS_bpIIyEGwUDGVri0MAiDdazL5LsQt8jtYYVpgUzHNM4M',
    lastActive: '5h ago',
    badge: 'NATIONAL TEAM',
    dob: '10 Mar 1996',
    height: '182 cm',
    weight: '75 kg',
    skills: ['Precision Passing', 'Court Vision', 'Endurance'],
    biography:
      'Rahul Verma is a veteran Feeder from Kerala with over 10 years of competitive experience. His precise passing and excellent court vision make him a valuable asset to any team.',
    matchesPlayed: 65,
    goldMedals: 18,
    winRate: 82,
    mvpAwards: 8,
    tournaments: [
      {
        eventName: 'Asian Games Qualifiers',
        year: 2023,
        category: 'Regu',
        team: 'India National',
        result: 'GOLD',
      },
    ],
  },
  {
    id: 'STFI-2023-102',
    name: 'Sneha Patel',
    role: 'Striker',
    state: 'Gujarat',
    rank: '#22',
    rankNumber: 22,
    age: 19,
    category: 'JUNIOR',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA5vraIynNuKw9b4_9O1GeYj9pR5InkrMpfKY7eVzqO1qp8A3inaRLcTd3cnFCbUjPVi2L-FYU6Ho7iy4WCT_4DuMumz6Qjay6tpQR_rb6JZ80jiLuZUxuRCk7BCLpZfJpxIwZrCQI4iiGbdT8Nh3wR9QISE5nr9VWBQWgUToZFYk1PGzBdUsyfscvgKrmi5uyC5Onx1_uoa2lGIW46vNLL868eznHnhVhavL2xzsl4S_bMhDPUwUsiZBtPl0DmlZp2rBtRelEkZy4',
    lastActive: '1d ago',
    badge: '',
    dob: '15 Nov 2004',
    height: '170 cm',
    weight: '65 kg',
    skills: ['Speed', 'Jumping Ability', 'Attack'],
    biography:
      'Sneha Patel is a rising star in the junior circuit. Her exceptional speed and jumping ability have caught the attention of national selectors.',
    matchesPlayed: 15,
    goldMedals: 3,
    winRate: 67,
    mvpAwards: 1,
    tournaments: [],
  },
  {
    id: 'STFI-2023-011',
    name: 'Vikram Rathore',
    role: 'Tekong',
    state: 'Rajasthan',
    rank: '#15',
    rankNumber: 15,
    age: 28,
    category: 'MEN',
    image:
      'https://ui-avatars.com/api/?name=Vikram+Rathore&background=random&size=128&bold=true',
    lastActive: '3d ago',
    badge: '',
    dob: '5 Jan 1995',
    height: '180 cm',
    weight: '74 kg',
    skills: ['Power Serve', 'Accuracy', 'Strategic Play'],
    biography:
      'Vikram Rathore has been a consistent performer for Rajasthan in national competitions. His powerful serves and strategic gameplay make him a formidable opponent.',
    matchesPlayed: 38,
    goldMedals: 10,
    winRate: 74,
    mvpAwards: 3,
    tournaments: [],
  },
  {
    id: 'STFI-2023-220',
    name: 'Anjali Devi',
    role: 'Feeder',
    state: 'Manipur',
    rank: '#3',
    rankNumber: 3,
    age: 25,
    category: 'WOMEN',
    image:
      'https://ui-avatars.com/api/?name=Anjali+Devi&background=random&size=128&bold=true',
    lastActive: '12h ago',
    badge: 'NATIONAL TEAM',
    dob: '18 Feb 1998',
    height: '162 cm',
    weight: '55 kg',
    skills: ['Precision', 'Quick Reflexes', 'Team Coordination'],
    biography:
      'Anjali Devi from Manipur has been a key member of the national women\'s team. Her precise feeding and excellent coordination with teammates have led to numerous victories.',
    matchesPlayed: 55,
    goldMedals: 20,
    winRate: 85,
    mvpAwards: 12,
    rankChange: 1,
    rankDescription: 'Top 1% of registered Senior Women players',
    tournaments: [
      {
        eventName: 'Women\'s Asian Championship',
        year: 2023,
        category: 'Regu',
        team: 'India National',
        result: 'GOLD',
      },
      {
        eventName: 'National Games',
        year: 2022,
        category: 'Doubles',
        team: 'Manipur',
        result: 'GOLD',
      },
    ],
  },
  {
    id: 'STFI-2023-145',
    name: 'David John',
    role: 'Striker',
    state: 'Goa',
    rank: '#31',
    rankNumber: 31,
    age: 20,
    category: 'JUNIOR',
    image:
      'https://ui-avatars.com/api/?name=David+John&background=random&size=128&bold=true',
    lastActive: '1w ago',
    badge: '',
    dob: '30 Jul 2003',
    height: '175 cm',
    weight: '68 kg',
    skills: ['Attack', 'Speed', 'Jumping'],
    biography:
      'David John is an emerging talent from Goa with exceptional attacking skills. His speed and jumping ability have made him a standout in junior competitions.',
    matchesPlayed: 22,
    goldMedals: 5,
    winRate: 68,
    mvpAwards: 2,
    tournaments: [],
  },
  {
    id: 'STFI-2023-066',
    name: 'Neha Gupta',
    role: 'Feeder',
    state: 'Haryana',
    rank: '#9',
    rankNumber: 9,
    age: 23,
    category: 'WOMEN',
    image:
      'https://ui-avatars.com/api/?name=Neha+Gupta&background=random&size=128&bold=true',
    lastActive: '2d ago',
    badge: '',
    dob: '12 Apr 2000',
    height: '168 cm',
    weight: '60 kg',
    skills: ['Court Vision', 'Precision Passing', 'Endurance'],
    biography:
      'Neha Gupta from Haryana has consistently performed at the national level. Her excellent court vision and precision passing make her a valuable team player.',
    matchesPlayed: 35,
    goldMedals: 11,
    winRate: 76,
    mvpAwards: 4,
    tournaments: [
      {
        eventName: 'North Zone Women\'s Championship',
        year: 2023,
        category: 'Regu',
        team: 'Haryana',
        result: 'GOLD',
      },
    ],
  },
]

export function getPlayerById(id: string): Player | undefined {
  return playersData.find((player) => player.id === id)
}
