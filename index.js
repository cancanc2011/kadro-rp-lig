const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- OYUNCU DEĞER SİSTEMİ VERİ TABANI ---
const db = {
    markets: {} // guildId -> { maxVal, slots, active, players: [{ name, pos, flag, value }] }
};

client.once('ready', async () => {
    console.log(`Bot aktif: ${client.user.tag}`);

    // Slash Komutlarını Kaydetme
    const commands = [
        new SlashCommandBuilder()
            .setName('degerkurulumbaslat')
            .setDescription('Sunucu için oyuncu değer sıralama sistemini başlatır.')
            .addIntegerOption(option =>
                option.setName('maksimum_deger')
                .setDescription('Maksimum oyuncu değeri (Örn: 200)')
                .setRequired(true))
            .addIntegerOption(option =>
                option.setName('kisi_sayisi')
                .setDescription('Listede yer alacak kişi/slot kapasitesi (Örn: 10)')
                .setRequired(true))
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Slash (/) komutları başarıyla yüklendi.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'degerkurulumbaslat') {
        // Yetki veya rol kontrolü (<@&1522274570986586172> rolü için)
        const requiredRoleId = '1522274570986586172';
        if (!interaction.member.roles.cache.has(requiredRoleId)) {
            return interaction.reply({ content: '❌ Bu komutu başlatmak için gerekli yetkiye sahip değilsin!', ephemeral: true });
        }

        const maxVal = interaction.options.getInteger('maksimum_deger');
        const slots = interaction.options.getInteger('kisi_sayisi');
        const guildId = interaction.guild.id;

        db.markets[guildId] = {
            maxVal: maxVal,
            slots: slots,
            players: []
        };

        // Örnek başlangıç verileri veya boş liste oluşturma
        return interaction.reply(`🚀 **Değer Sıralama Sistemi** başlatıldı!\n💰 Maksimum Değer: **${maxVal}M€**\n👥 Kişi/Slot Kapasitesi: **${slots}**\n\nHerkes `.degersiralama` komutuyla güncel listeyi görüntüleyebilir.`);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const prefix = '.';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 📊 .degersiralama Komutu
    if (command === 'degersiralama') {
        const guildId = message.guild.id;
        const market = db.markets[guildId];

        if (!market) {
            return message.reply('❌ Bu sunucuda henüz değer sıralama sistemi başlatılmamış! Yetkili `/degerkurulumbaslat` komutunu kullanmalıdır.');
        }

        const embed = new EmbedBuilder()
            .setColor('#00FF7F')
            .setTitle('📈 Sunucu Oyuncu Değer Sıralaması')
            .setDescription(`Maksimum Sınır: **${market.maxVal}M€** | Toplam Slot: **${market.slots}**`);

        if (market.players.length === 0) {
            // Örnek format gösterimi (Profil verileri otomatik veya kayıtlı oyuncular eklendikçe burası dolar)
            embed.addFields(
                { name: '📋 Sıralama Tablosu', value: 'Oyuncu | Mevki | Bayrak | Değer\n*Örnek:\nArda Güler | OOS | 🇹🇷 | 100M€\nFerdi Kadıoğlu | LB | 🇹🇷 | 99M€*' }
            );
        } else {
            // Değere göre büyükten küçüğe sıralama
            const sorted = market.players.sort((a, b) => b.value - a.value).slice(0, market.slots);
            const listText = sorted.map((p, index) => `**${index + 1}.** ${p.name} | ${p.pos} | ${p.flag} | **${p.value}M€**`).join('\n');
            embed.addFields({ name: '🏆 Güncel Sıralama', value: listText });
        }

        return message.reply({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
