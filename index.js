const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Veritabanı veya Oyuncu Listesi Örneği
const db = {
    "1522274201539579934": {
        players: [
            { id: "688410703866101795", name: "J.P-Mateta", pos: "SNT", flag: "🇫🇷", value: "50M" },
            { id: "1207655717612421161", name: "F.Torres", pos: "SNT", flag: "🇪🇸", value: "50G" },
            { id: "1082675732049829960", name: "D.Upamecano", pos: "STP", flag: "🇫🇷", value: "50G" }
        ]
    }
};

client.once('ready', () => {
    console.log(`Bot aktif: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.guild && message.guild.id !== "1522274201539579934") return;

    const prefix = '.';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 🔍 .ara Komutu
    if (command === 'ara') {
        const query = args.join(' ').trim();
        if (!query) {
            return message.reply('🔍 **Hata:** Aramak için bir isim, mevki veya bayrak girmelisin.');
        }

        const guildId = message.guild.id;
        const market = db[guildId] || { players: [] };

        // İsme, mevkiye veya bayrağa göre filtreleme
        const results = market.players.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.pos.toLowerCase().includes(query.toLowerCase()) ||
            p.flag.includes(query)
        );

        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle(`🔍 Arama Sonuçları: ${query}`);

        if (results.length === 0) {
            embed.setDescription('❌ Aranan kriterlere uygun futbolcu bulunamadı.');
        } else {
            const listText = results.map(p => `<@${p.id}>\n(${p.name} | ${p.flag} | ${p.pos} | ${p.value})`).join('\n\n');
            embed.addFields({ name: `⚽ Futbolcular (${results.length})`, value: listText });
        }

        return message.reply({ embeds: [embed] });
    }
});

client.login(process.env.DI
             SCORD_TOKEN);
