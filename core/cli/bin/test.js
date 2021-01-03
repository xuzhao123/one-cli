
const yargs = require('yargs/yargs');
const dedent = require('dedent');
const pkg = require("../package.json");

const cli = yargs();
const argv = process.argv.slice(2);

const context = {
    oneVersion: pkg.version,
};

cli
    .usage('Usage: $0 <command>')
    .demandCommand(1, 'A command is required. Pass --help to see all available commands and options.')
    .recommendCommands()
    .fail(err => {
        console.log(err);
    })
    .strict()
    .alias('h', 'help')
    .alias('v', 'version')
    .wrap(cli.terminalWidth())
    .epilogue(dedent`
      When a command fails, all logs are written to lerna-debug.log in the current working directory.

      For more information, find our manual at https://github.com/lerna/lerna
    `)
    .options({
        debug: {
            type: 'boolean',
            describe: 'bootstrap debug mode',
            alias: 'd'
        }
    })
    .option('registry', {
        type: 'string',
        describe: 'define global registry',
        // hidden: true
        alias: 'r'
    })
    .group('debug', 'Dev Options:')
    .command('init [name]', 'init project', yargs => {
        yargs.option('name', {
            type: 'string',
            describe: 'Name of a project'
        })
    }, argv => {
        console.log(argv)
    })
    .parse(argv, context);