const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

// Update RouteItem type
content = content.replace(
  /type RouteItem = {[\s\S]*?}/,
  `type DropdownItem = { name: string; to?: string; subDropdown?: { name: string; to: string }[] }\n` +
  `type RouteItem = {\n  name: string\n  to: string\n  dropdown?: DropdownItem[]\n}`
);

// Update dropdown data
content = content.replace(
  /const nationalTeamDropdown = \[[\s\S]*?\]\n/,
  `const playersDropdown = [
        {
          name: 'National Players',
          subDropdown: [
            { name: content.nationalTeamPage.mensTeam.title || "Men's Team", to: '/national-team/mens-team' },
            { name: content.nationalTeamPage.juniorMensTeam.title || "Junior Men's Team", to: '/national-team/junior-mens-team' },
            { name: content.nationalTeamPage.womensTeam.title || "Women's Team", to: '/national-team/womens-team' },
            { name: content.nationalTeamPage.juniorWomensTeam.title || "Junior Women's Team", to: '/national-team/junior-womens-team' },
          ]
        },
        {
          name: 'International Players',
          subDropdown: [
            { name: content.internationalTeamPage?.mensTeam.title || "Men's Team", to: '/international-team/mens-team' },
            { name: content.internationalTeamPage?.juniorMensTeam.title || "Junior Men's Team", to: '/international-team/junior-mens-team' },
            { name: content.internationalTeamPage?.womensTeam.title || "Women's Team", to: '/international-team/womens-team' },
            { name: content.internationalTeamPage?.juniorWomensTeam.title || "Junior Women's Team", to: '/international-team/junior-womens-team' },
          ]
        }
      ]\n`
);

content = content.replace(
  /\{\n\s*name: 'National Team',[\s\S]*?dropdown: nationalTeamDropdown,[\s\S]*?\},/,
  `{\n          name: 'Players',\n          to: '/players',\n          dropdown: playersDropdown,\n        },`
);

content = content.replace(
  /\[content.aboutPage\?.customPages, content.nationalTeamPage\],/,
  `[content.aboutPage?.customPages, content.nationalTeamPage, content.internationalTeamPage],`
);

// Desktop Subdropdown
const newDesktopDropdown = `                    <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-56 flex flex-col">
                        {r.dropdown.map((drop, idx) => (
                          <div key={idx} className="relative group/sub">
                            {drop.to ? (
                              <Link
                                to={drop.to}
                                onClick={() => setMobileOpen(false)}
                                className={\`px-4 py-2 text-sm font-semibold transition-colors flex justify-between items-center \${pathname === drop.to.split('#')[0] ? 'text-[#5a0a8f] bg-purple-50' : 'text-gray-700 hover:text-[#5a0a8f] hover:bg-gray-50'}\`}
                              >
                                {drop.name}
                              </Link>
                            ) : (
                              <div className="px-4 py-2 text-sm font-semibold transition-colors flex justify-between items-center text-gray-700 hover:text-[#5a0a8f] hover:bg-gray-50 cursor-pointer">
                                {drop.name}
                                {drop.subDropdown && <span className="material-symbols-outlined text-[16px]">chevron_right</span>}
                              </div>
                            )}
                            {drop.subDropdown && (
                              <div className="absolute left-full top-0 pl-2 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 z-50">
                                <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-48 flex flex-col">
                                  {drop.subDropdown.map(sub => (
                                    <Link
                                      key={sub.to}
                                      to={sub.to}
                                      onClick={() => setMobileOpen(false)}
                                      className={\`px-4 py-2 text-sm font-semibold transition-colors \${pathname === sub.to.split('#')[0] ? 'text-[#5a0a8f] bg-purple-50' : 'text-gray-700 hover:text-[#5a0a8f] hover:bg-gray-50'}\`}
                                    >
                                      {sub.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>`;

content = content.replace(
  /<div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">[\s\S]*?<\/div>\n\s*<\/div>/,
  newDesktopDropdown
);

// Mobile Subdropdown
const newMobileDropdown = `<div className="pl-4 mt-1 space-y-1 border-l-2 border-gray-100 ml-4 mb-2">
                      {r.dropdown.map((drop, idx) => (
                        <div key={idx}>
                          {drop.to ? (
                            <Link
                              to={drop.to}
                              onClick={() => setMobileOpen(false)}
                              className={\`block px-4 py-2 rounded-lg text-sm font-semibold transition-colors \${pathname === drop.to.split('#')[0] ? 'text-[#5a0a8f] bg-primary/5' : 'text-gray-600 hover:bg-primary/5 hover:text-primary'}\`}
                            >
                              {drop.name}
                            </Link>
                          ) : (
                            <div className="block px-4 py-2 rounded-lg text-sm font-bold text-[#5a0a8f]">
                              {drop.name}
                            </div>
                          )}
                          {drop.subDropdown && (
                            <div className="pl-4 mt-1 space-y-1 border-l-2 border-gray-100 ml-2 mb-2">
                              {drop.subDropdown.map(sub => (
                                <Link
                                  key={sub.to}
                                  to={sub.to}
                                  onClick={() => setMobileOpen(false)}
                                  className={\`block px-4 py-2 rounded-lg text-sm font-semibold transition-colors \${pathname === sub.to.split('#')[0] ? 'text-[#5a0a8f] bg-primary/5' : 'text-gray-600 hover:bg-primary/5 hover:text-primary'}\`}
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>`;

content = content.replace(
  /<div className="pl-4 mt-1 space-y-1 border-l-2 border-gray-100 ml-4 mb-2">[\s\S]*?<\/div>/,
  newMobileDropdown
);

fs.writeFileSync('src/components/Header.tsx', content);
