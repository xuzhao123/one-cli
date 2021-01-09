module.exports = core;

const path = require('path');
const fs = require('fs');
const semver = require('semver');
const colors = require('colors');
const commander = require('commander');
const userHome = require('user-home');
const log = require('@one-cli/log');
const exec = require('@one-cli/exec');
const pkg = require('../package.json');
const constant = require('./const');

function pathExist(path) {
    try {
        fs.accessSync(path);
        return true;
    } catch (e) {
        return false;
    }
}

async function core() {
    try {
        prepare();
        registerCommander();
    } catch (e) {
        log.error(e.message);
        if (process.env.LOG_LEVEL === 'verbose') {
            console.log(e);
        }
    }
}

function registerCommander() {
    const program = new commander.Command();
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug', 'debug', false)
        .option('-tp, --targetPath <targetePath>', 'target path');

    program
        .command('init [projectName]')
        .option('-f, --force', 'force init project')
        .action(exec)

    program.on('option:debug', () => {
        if (program.debug) {
            process.env.LOG_LEVEL = 'verbose';
        } else {
            process.env.LOG_LEVEL = 'info';
        }
        log.level = process.env.LOG_LEVEL;
    });

    program.on('option:targetPath', () => {
        process.env.CLI_TARGET_PATH = program.targetPath;
    });

    program.on('command:*', (obj) => {
        log.error(colors.red('unknow command: ' + obj[0]));
        const availableCommands = program.commands.map(cmd => cmd.name());
        if (availableCommands.length > 0) {
            log.error(colors.red('enable command: ' + availableCommands.join(',')));
        }
    });

    program.parse(process.argv);

    if (program.args && program.args.length === 0) {
        program.outputHelp();
    }
}

async function prepare() {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    checkEnv();
    await checkGlobalUpdate();
}

async function checkGlobalUpdate() {
    const { version: currentVersion, name: npmName } = pkg;
    const { getNpmSemverVersion } = require('@one-cli/get-npm-info');
    const lastVersion = await getNpmSemverVersion(currentVersion, npmName);
    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
        log.warn(colors.yellow(`please update ${npmName}, current version: ${currentVersion}, last version: ${lastVersion}`));
    }
}

function checkEnv() {
    const dotenv = require('dotenv');
    const dotenvPath = path.resolve(userHome, '.env');
    if (pathExist(dotenvPath)) {
        dotenv.config({
            path: dotenvPath,
        });
    }
    const cliConfig = {
        home: userHome,
    };
    if (process.env.CLI_HOME) {
        cliConfig.cliHome = path.join(userHome, process.env.CLI_HOME)
    } else {
        cliConfig.cliHome = path.join(userHome, constant.DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome;
    log.verbose('env', process.env.CLI_HOME_PATH);
}

function checkInputArgs() {
    const minimist = require('minimist');
    const args = minimist(process.argv.slice(2));
    if (args.debug) {
        process.env.LOG_LEVEL = 'verbose';
    } else {
        process.env.LOG_LEVEL = 'info';
    }

    log.level = process.env.LOG_LEVEL;
}

function checkUserHome() {
    if (!userHome || !pathExist(userHome)) {
        throw new Error(colors.red('user home is not exists'));
    }
}

function checkRoot() {
    const isRoot = () => process.getuid && process.getuid() === 0;
    if (!isRoot()) {
        return;
    }

    if (process.setgid) {
        const gid = parseInt(process.env.SUDO_GID, 10);
        if (gid) {
            process.setgid(gid);
        }
    }

    if (process.setuid) {
        const DEFAULT_UIDS = {
            darwin: 501,
            freebsd: 1000,
            linux: 1000,
            sunos: 100
        };
        const uid = parseInt(process.env.SUDO_UID, 10) || DEFAULT_UIDS[process.platform];
        if (uid) {
            process.setuid(uid);
        }
    }

    if (isRoot()) {
        // 降权未成功提示
        log.error(colors.red(`You are not allowed to run this app with root permissions.`))
    }
}

function checkNodeVersion() {
    // 获取最低版本号
    const currentVersion = process.version;
    // 比对版本号
    const lowestVersion = constant.LOWEST_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
        throw new Error(colors.red(`one-cli need v${lowestVersion} node`));
    }
}

function checkPkgVersion() {
    log.notice(pkg.version);
}