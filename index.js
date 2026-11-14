const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline-sync');
const chalk = require('chalk');
const fs = require('fs');

function showBanner() {
    console.clear();
    console.log(chalk.cyan(`
██╗  ██╗ █████╗  █████╗  ██████╗██████╗  █████╗ ███████╗██╗  ██╗
██║ ██╔╝██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝██║  ██║
█████╔╝ ███████║███████║██║     ██████╔╝███████║███████╗███████║
██╔═██╗ ██╔══██║██╔══██║██║     ██╔══██╗██╔══██║╚════██║██╔══██║
██║  ██╗██║  ██║██║  ██║╚██████╗██║  ██║██║  ██║███████║██║  ██║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
    `));
    console.log(chalk.green('--------------------------------------------------'));
    console.log(chalk.yellow(' 🤖 KAACRASH BOT | Original Baileys'));
    console.log(chalk.white(' 👤 Creator: kaastr26'));
    console.log(chalk.green('--------------------------------------------------\n'));
}

function showMenu() {
    console.log(chalk.blue('[ CONSOLE MENU ]'));
    console.log(chalk.white('1. ') + chalk.green('Mulai Bot (Connect WhatsApp)'));
    console.log(chalk.white('2. ') + chalk.red('Hapus Session (Logout)'));
    console.log(chalk.white('3. ') + chalk.yellow('Keluar Console'));
    
    const pilihan = readline.question(chalk.cyan('\n>> Type a command... (1/2/3): '));
    
    if (pilihan === '1') {
        console.log(chalk.yellow('\nMenghubungkan ke WhatsApp...'));
        startBot();
    } else if (pilihan === '2') {
        if (fs.existsSync('./session')) {
            fs.rmSync('./session', { recursive: true, force: true });
            console.log(chalk.green('✅ Session berhasil dihapus.'));
        } else {
            console.log(chalk.red('❌ Folder session tidak ditemukan.'));
        }
        showMenu();
    } else if (pilihan === '3') {
        process.exit(0);
    } else {
        showMenu();
    }
}

async function startBot() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('session');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            browser: ["Ubuntu", "Chrome", "20.0.0"]
        });

        if (!sock.authState.creds.registered) {
            const phoneNumber = readline.question(chalk.yellow('Masukkan nomor WhatsApp (contoh: 628xxx): '));
            const code = await sock.requestPairingCode(phoneNumber);
            console.log(chalk.green(`\n🔑 Kode Pairing: ${code}\n`));
        }

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) startBot(); 
            } else if (connection === 'open') {
                console.log(chalk.green('\n✅ Bot berhasil terhubung!\n'));
            }
        });
    } catch (error) {
        console.error(error);
        showMenu();
    }
}

showBanner();
showMenu();
