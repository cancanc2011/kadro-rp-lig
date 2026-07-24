const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Sunucu bazlı sabit veritabanı (Belirtilen Sunucu ID: 1522274201539579934)
const db = {
    "1522274201539579934": {
        maxVal: 200,
        slots: 10,
        players: [] // Profil oluşturan veya kayıt olanlar buraya eklendikçe otomatik güncellenir
    }
};

client.once('ready', () => {
    console.log(`Bot aktif: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Sadece belirtilen sunucu id kontrolü
    if (message.guild && message.guild.id !== "1522274201539579934") return;

    const prefix = '.';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 📊 .degersiralama Komutu
    if (command === 'degersiralama') {
        const guildId = message.guild ? message.guild.id : "1522274201539579934";
        const market = db[guildId] || { maxVal: 200, slots: 10, players: [] };

        const embed = new EmbedBuilder()
            .setColor('#00FF7F')
            .setTitle('📈 Oyuncu Değer Sıralaması')
            .setDescription(`Maksimum Sınır: **${market.maxVal}M€** | Maksimum Kişi: **${market.slots}**`);

        if (market.players.length === 0) {
            embed.addFields(
                { 
                    name: 'Oyuncu | Mevki | Bayrak | Değer', 
                    value: '*Henüz kayıtlı oyuncu yok. Profiller eklendikçe otomatik sıralanacaktır.*\n\nÖrnek:\nOyuncu | Mevki | Bayrak | 100M€\nOyuncu | Mevki | Bayrak | 99M€' 
                }
            );
        } else {
            const sorted = market.players.sort((a, b) => b.value - a.value).slice(0, market.slots);
            const listText = sorted.map((p, index) => `${index + 1}. ${p.name} | ${p.pos} | ${p.flag} | ${p.value}M€`).join('\n');
            embed.addFields({ name: 'Oyuncu | Mevki | Bayrak | Değer', value: listText });
        }

        return message.reply({ embeds: [embed] });
    }
});

client.login(process.env.DISC
             ORD_TOKEN);
