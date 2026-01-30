/**
 * Test Tournament Schedule Generators
 * Quick verification that the algorithms work correctly
 */

import { singleKnockout, doubleElimination, roundRobin } from '../lib/matchScheduleGenerator';

// Test data
const testTeams4 = ['Team A', 'Team B', 'Team C', 'Team D'];
const testTeams5 = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'];

console.log('=== Single Knockout Test (4 teams) ===');
console.log(JSON.stringify(singleKnockout(testTeams4), null, 2));

console.log('\n=== Single Knockout Test (5 teams - should add BYE) ===');
console.log(JSON.stringify(singleKnockout(testTeams5), null, 2));

console.log('\n=== Double Elimination Test (4 teams) ===');
console.log(JSON.stringify(doubleElimination(testTeams4), null, 2));

console.log('\n=== Round Robin Test (4 teams) ===');
console.log(JSON.stringify(roundRobin(testTeams4), null, 2));

console.log('\n=== Round Robin Test (5 teams - should add BYE) ===');
console.log(JSON.stringify(roundRobin(testTeams5), null, 2));
