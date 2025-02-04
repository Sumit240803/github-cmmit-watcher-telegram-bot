require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TOKEN, { polling: true });
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/commits`;
let lastCommitSha = null;

// Start command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "GitHub Watcher Bot Started!\nUse /watch to monitor the repository.");
});

// Watch GitHub Repo
bot.onText(/\/watch/, async (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, `🔍 Watching repository: ${GITHUB_REPO}`);

    setInterval(async () => {
        try {
            const response = await axios.get(GITHUB_API_URL);

            if (!response.data || response.data.length === 0) {
                bot.sendMessage(chatId, `⚠️ No commits found for ${GITHUB_REPO}.`);
                return;
            }

            const latestCommit = response.data[0];

            if (!latestCommit || !latestCommit.sha || !latestCommit.commit) {
                console.log("⚠️ Unexpected API response:", response.data);
                bot.sendMessage(chatId, `⚠️ Unexpected response format from GitHub API.`);
                return;
            }

            if (latestCommit.sha !== lastCommitSha) {
                lastCommitSha = latestCommit.sha;
                bot.sendMessage(chatId, `🚀 New commit in ${GITHUB_REPO}:\n\n${latestCommit.commit.message}\n🔗 ${latestCommit.html_url} \n\n Committer - ${latestCommit.commit.committer.name}  Email - ${latestCommit.commit.committer.email}`);
            }
        } catch (error) {
            console.error("❌ Error fetching commits:", error.response ? error.response.data : error.message);
            bot.sendMessage(chatId, `❌ Error fetching commits. Check if the repository exists and is public.`);
        }
    }, 30000); // Check every 30 seconds
});

console.log("GitHub Watcher Bot is running...");
