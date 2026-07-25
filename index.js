const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TARGET_GUILD_ID = '1522274201539579934';
const PREFIX = '.';

client.once('ready', () => {
    console.log(`Bot aktif: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    console.log(`Mesaj geldi: ${message.content} - Yazan: ${message.author.tag}`);

    if (message.guild?.id !== TARGET_GUILD_ID) return;
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 🔍 .ara Komutu
    if (command === 'ara') {
        const query = args.join(' ');

        if (!query) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔍 Hata')
                .setDescription('Aramak için bir isim, mevkii veya bayrak girmelisin.\n*Örnek: `.ara M.svilar`, `.ara SNT`, `.ara 🇫🇷`*');
            return message.reply({ embeds: [errorEmbed] });
        }

        try {
            await message.guild.members.fetch();
        } catch (err) {
            console.log('Üyeler çekilemedi:', err);
        }

        const matchedMembers = message.guild.members.cache.filter(member => 
            member.displayName.toLowerCase().includes(query.toLowerCase())
        );

        if (matchedMembers.size === 0) {
            const notFoundEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle(`🔍 Arama Sonuçları: ${query}`)
                .setDescription('Aranan kriterlere uygun futbolcu bulunamadı.');
            return message.reply({ embeds: [notFoundEmbed] });
        }

        let descriptionList = [];
        matchedMembers.forEach(member => {
            descriptionList.push(`${member} \n(${member.displayName})`);
        });

        const resultsText = descriptionList.slice(0, 15).join('\n\n');

        const resultEmbed = new EmbedBuilder()
            .setColor('#1E90FF')
            .setTitle(`🔍 Arama Sonuçları: ${query}`)
            .setDescription(`⚽ **Futbolcular (${matchedMembers.size})**\n\n${resultsText}`)
            .setFooter({ text: `${message.author.tag} tarafından istendi.`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [resultEmbed] });
    }
});

client.login(process.env.TOKEN);
