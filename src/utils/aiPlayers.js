// Meloni — the only bot. Writes convincing bluffs, votes randomly.
export const MELONI = {
  id:    'meloni',
  name:  'Meloni',
  emoji: '🤖',
  color: '#06b6d4',
  bio:   'Your AI bluffer. Surprisingly convincing.',
  // Per-category fake answer pools — designed to sound plausible
  bluffs: {
    '📱 Tech Origins':       ['Cybernet','WebSpace','iConnect','Netify','DigiHub','Syncra','ByteLink','HyperBase'],
    '🐾 Animal Kingdom':     ['About 14 hours','Through vibrations','8 total','True — completely','Every 3 days','They simply cannot','Twice a year'],
    '🎬 Movie Secrets':      ['Real ocean water','A retired magician','Cornstarch syrup','Filmed entirely backwards','CGI replaced the original'],
    '🤯 Weird Facts':        ['147 total','Around 5 seconds','The Netherlands','3.7 billion years','Roughly 30%','Technically zero'],
    '🌍 Geography':          ['Brazil','Norway','New Zealand','South Korea','The Philippines','Argentina','Iceland'],
    '🎭 Celebrity Oddities': ['Piano','Architecture','Marine biology','Teaching high school','Competitive chess','Accounting'],
    '🍕 Food Fails':         ['Vinegar and herbs','Ancient Rome','The Dutch invented it','Originally blue','Made from tree bark','Fermented for 3 years'],
  },
  // Random timing so Meloni feels human
  bluffDelay: () => 9000  + Math.random() * 18000,
  voteDelay:  () => 4000  + Math.random() * 12000,
}

export function meloniBluff(cat) {
  const pool = MELONI.bluffs[cat] || ['Probably not what you think','Around 47','It was invented in Denmark','The second one, actually']
  return pool[Math.floor(Math.random() * pool.length)]
}
