const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

// Load environment variables manually since we might run outside of Next.js context
const envPath = path.resolve(__dirname, '../.env.production');
if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    // Try .env
    const localEnvPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(localEnvPath)) {
        const envConfig = require('dotenv').parse(fs.readFileSync(localEnvPath));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
    }
}

// Configuration
const CONFIG = {
    backupDir: path.resolve(__dirname, '../backups'),
    retainDays: 7,
    s3: {
        endpoint: process.env.BACKUP_S3_ENDPOINT,
        accessKeyId: process.env.BACKUP_S3_ACCESS_KEY,
        secretAccessKey: process.env.BACKUP_S3_SECRET_KEY,
        bucket: process.env.BACKUP_S3_BUCKET,
        region: process.env.BACKUP_S3_REGION || 'auto',
    },
    telegram: {
        token: process.env.BACKUP_TELEGRAM_TOKEN,
        chatId: process.env.BACKUP_TELEGRAM_CHAT_ID,
    },
    discord: {
        webhookUrl: process.env.DISCORD_WEBHOOK_URL, // Reuse existing if available
    }
};

// Ensure backup directory exists
if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
}

// Logger
function log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
}

async function sendNotification(message, success = true) {
    const emoji = success ? '✅' : '❌';
    const text = `${emoji} **Backup Status**\n${message}`;

    // Telegram
    if (CONFIG.telegram.token && CONFIG.telegram.chatId) {
        try {
            await fetch(`https://api.telegram.org/bot${CONFIG.telegram.token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CONFIG.telegram.chatId,
                    text: text,
                    parse_mode: 'Markdown',
                }),
            });
        } catch (error) {
            log(`Failed to send Telegram notification: ${error.message}`, 'ERROR');
        }
    }

    // Discord
    if (CONFIG.discord.webhookUrl) {
        try {
            await fetch(CONFIG.discord.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: text,
                }),
            });
        } catch (error) {
            log(`Failed to send Discord notification: ${error.message}`, 'ERROR');
        }
    }
}

async function uploadToS3(filePath, fileName) {
    if (!CONFIG.s3.endpoint || !CONFIG.s3.bucket) {
        log('S3 configuration missing, skipping upload.', 'WARN');
        return;
    }

    const s3Client = new S3Client({
        region: CONFIG.s3.region,
        endpoint: CONFIG.s3.endpoint,
        credentials: {
            accessKeyId: CONFIG.s3.accessKeyId,
            secretAccessKey: CONFIG.s3.secretAccessKey,
        },
        forcePathStyle: true, // Needed for MinIO/R2 sometimes
    });

    const fileStream = fs.createReadStream(filePath);

    try {
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: CONFIG.s3.bucket,
                Key: `backups/${fileName}`,
                Body: fileStream,
            },
        });

        await upload.done();
        log(`Successfully uploaded ${fileName} to S3.`);

        // Cleanup old S3 files
        await cleanupS3(s3Client);

        return true;
    } catch (error) {
        log(`S3 Upload Error: ${error.message}`, 'ERROR');
        throw error;
    }
}

async function cleanupS3(s3Client) {
    try {
        const command = new ListObjectsV2Command({
            Bucket: CONFIG.s3.bucket,
            Prefix: 'backups/',
        });

        const data = await s3Client.send(command);
        if (!data.Contents) return;

        const now = new Date();
        const retentionTime = CONFIG.retainDays * 24 * 60 * 60 * 1000;

        for (const obj of data.Contents) {
            const lastModified = new Date(obj.LastModified);
            if (now - lastModified > retentionTime) {
                log(`Deleting old backup from S3: ${obj.Key}`);
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: CONFIG.s3.bucket,
                    Key: obj.Key,
                }));
            }
        }
    } catch (error) {
        log(`S3 Cleanup Error: ${error.message}`, 'WARN');
    }
}

async function runBackup() {
    const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupName = `backup_${date}`;
    const dbPath = path.resolve(__dirname, '../prisma/dev.db');
    const backupFile = path.join(CONFIG.backupDir, `${backupName}.db`);
    const compressedFile = `${backupFile}.gz`;

    try {
        log(`Starting backup: ${backupName}`);

        // 1. Backup SQLite
        if (fs.existsSync(dbPath)) {
            // Simple file copy for SQLite (locks might be an issue under heavy load, but acceptable for <20 users)
            // ideally use sqlite3 .backup command but keeping it simple nodejs
            fs.copyFileSync(dbPath, backupFile);

            // 2. Compress
            execSync(`gzip "${backupFile}"`);
            log(`Database backed up and compressed: ${compressedFile}`);

            // 3. Upload to S3
            await uploadToS3(compressedFile, `${backupName}.db.gz`);

            // 4. Notify Success
            await sendNotification(`Database backup successful!\nFile: ${backupName}.db.gz`);

        } else {
            log('Database file not found!', 'ERROR');
            throw new Error('Database file not found');
        }

        // 5. Local Cleanup
        const files = fs.readdirSync(CONFIG.backupDir);
        const now = new Date();
        const retentionTime = CONFIG.retainDays * 24 * 60 * 60 * 1000;

        for (const file of files) {
            const filePath = path.join(CONFIG.backupDir, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > retentionTime) {
                fs.unlinkSync(filePath);
                log(`Deleted old local backup: ${file}`);
            }
        }

    } catch (error) {
        log(`Backup Failed: ${error.message}`, 'ERROR');
        await sendNotification(`Backup Failed!\nError: ${error.message}`, false);
        process.exit(1);
    }
}

// Install dotenv if missing (helper for first run)
try {
    require('dotenv');
} catch (e) {
    console.log('Installing dotenv...');
    execSync('npm install dotenv --no-save');
}

runBackup();
