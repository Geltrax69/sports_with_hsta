// Run: npx tsx scripts/eventFormat.test.ts   (or read it as the spec for the map)
import assert from 'node:assert/strict'

import { roundsForEvent, roundNamesForEvent, eventTypeLabel } from '../src/lib/eventFormat'

assert.equal(roundsForEvent('regu'), 1)
assert.equal(roundsForEvent('double'), 2)
assert.equal(roundsForEvent('quad'), 3)
assert.equal(roundsForEvent(undefined), 1)
assert.equal(roundsForEvent('trio'), 1)
assert.equal(eventTypeLabel('quad'), 'Quad')
assert.deepEqual(roundNamesForEvent('double'), ['Double 1', 'Double 2'])

// The score modal reuses saved rounds by index and fills the rest.
const saved = [{ reguName: 'Regu 1', sets: [1] }]
const reconciled = roundNamesForEvent('quad').map(
  (reguName, i) => saved[i] || { reguName, sets: [] },
)
assert.equal(reconciled.length, 3)
assert.deepEqual(reconciled[0], saved[0])
assert.equal(reconciled[2].reguName, 'Quad 3')

console.log('eventFormat (web): all checks passed')
