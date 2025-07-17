import minimist from 'minimist';

function main() {
  const args = minimist(process.argv.slice(2), {
    string: ['locale', 'limit'],
    default: { limit: 10 },
  });
  console.log(`Locale: ${args.locale}, limit: ${args.limit}`);
}

main();
