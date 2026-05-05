import { runBench } from './run';

console.log('start pagination benchmark');

runBench(`page=100&limit=50`);
