const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const logDir = path.join(__dirname, '../logs/price_failures');
const today = new Date().toISOString().split('T')[0];
const logFile = path.join(logDir, `price_failures_${today}.jsonl`);

console.log(chalk.blue(`Tailing price failures log: ${logFile}`));
console.log(chalk.yellow('Waiting for new entries...\n'));

// Create directory if it doesn't exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Create file if it doesn't exist
if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '');
}

let lastSize = fs.statSync(logFile).size;

// Watch for changes
fs.watch(logFile, (eventType) => {
    if (eventType === 'change') {
        const currentSize = fs.statSync(logFile).size;
        if (currentSize > lastSize) {
            const stream = fs.createReadStream(logFile, {
                start: lastSize,
                end: currentSize
            });

            stream.on('data', (data) => {
                const entries = data.toString().trim().split('\n');
                entries.forEach(entry => {
                    if (entry) {
                        const failure = JSON.parse(entry);
                        printFailure(failure);
                    }
                });
            });

            lastSize = currentSize;
        }
    }
});

function printFailure(failure) {
    const timestamp = chalk.gray(failure.timestamp);
    const token = chalk.yellow(failure.token);
    const fiat = chalk.cyan(failure.fiat);
    const type = chalk.magenta(failure.type);
    const reason = chalk.red(failure.reason);

    console.log(`${timestamp} ${token}/${fiat} ${type}`);
    console.log(`Reason: ${reason}`);

    if (failure.details) {
        console.log(chalk.dim('Details:'), failure.details);
    }

    if (failure.cache_state) {
        console.log(chalk.dim('Cache State:'));
        Object.entries(failure.cache_state).forEach(([key, state]) => {
            console.log(`  ${key}: ${state.exists ? chalk.green('✓') : chalk.red('✗')} ${state.value || ''}`);
        });
    }

    if (failure.error) {
        console.log(chalk.red('Error:'), failure.error);
    }

    console.log(''); // Empty line for readability
}

// Also read and print existing entries on startup
const existingContent = fs.readFileSync(logFile, 'utf8');
const existingEntries = existingContent.trim().split('\n');
if (existingEntries[0]) {
    console.log(chalk.yellow('Existing failures:\n'));
    existingEntries.forEach(entry => {
        if (entry) {
            const failure = JSON.parse(entry);
            printFailure(failure);
        }
    });
    console.log(chalk.yellow('\nNow watching for new failures...\n'));
} 