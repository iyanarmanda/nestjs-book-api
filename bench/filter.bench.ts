import { runBench } from './run';

console.log('start filter benchmark');

runBench(`bookCategoryFilter=Programming&limit=20`);
