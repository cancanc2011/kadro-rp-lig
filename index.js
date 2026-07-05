
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Oyun Durumu Hafızası
let oyun = {
    aktif: false,
    lobi: [],
    roller: {}, 
    yasayanlar: [],
    asama: 'lobi', 
    vampirOylari: {}, 
    koyOylari: {},
    kanalId: null
};

client.on('ready', () => {
    console.log(`✅ BOT AKTİF: ${client.user.tag} başarıyla giriş yaptı!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('.')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    // ❌ .iptaloyun (Sadece Başlatan veya Yönetici Silebilir)
    if (cmd === 'iptaloyun') {
        if (!oyun.aktif) return message.reply("❌ Zaten aktif bir oyun yok!");
        
        const yetkiliMi = message.member.permissions.has('Administrator');
        const baslatanMi = message.author.id === oyun.lobi[0];

        if (!baslatanMi && !yetkiliMi) {
            return message.reply(`❌ Bu oyunu sadece kurucusu (<@${oyun.lobi[0]}>) veya bir Yönetici iptal edebilir!`);
        }
        
        oyun = { aktif: false, lobi: [], roller: {}, yasayanlar: [], asama: 'lobi', vampirOylari: {}, koyOylari: {}, kanalId: null };
        return message.reply("🛑 **Vampir Köylü oyunu tamamen iptal edildi ve hafıza sıfırlandı!** Yeni oyun başlatabilirsiniz.");
    }

    // 🚪 .vampirköylü / .vk
    if (cmd === 'vampirköylü' || cmd === 'vk') {
        if (oyun.aktif) return message.reply("❌ Zaten devam eden bir oyun var!");

        oyun.aktif = true;
        oyun.lobi = [message.author.id];
        oyun.kanalId = message.channel.id;
        oyun.asama = 'lobi';

        const embed = new EmbedBuilder()
            .setTitle("🐺 Vampir Köylü Oyunu Başladı!")
            .setDescription(`**Oyun Kurucu:** <@${message.author.id}>\n\nOyuna katılmak için aşağıdaki **Katıl** butonuna basın.`)
            .setColor(0x990000);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('vk_katil').setLabel('🚪 Katıl').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('vk_ayril').setLabel('🚶 Ayrıl').setStyle(ButtonStyle.Secondary)
        );

        const lobiMesaj = await message.channel.send({ embeds: [embed], components: [row] });
        const collector = lobiMesaj.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'vk_katil') {
                if (oyun.lobi.includes(interaction.user.id)) return interaction.reply({ content: "Zaten katılmışsın!", ephemeral: true });
                oyun.lobi.push(interaction.user.id);
                embed.setDescription(`**Oyun Kurucu:** <@${oyun.lobi[0]}>\n\n**Katılanlar (${oyun.lobi.length}):**\n${oyun.lobi.map(id => `<@${id}>`).join('\n')}`);
                await interaction.update({ embeds: [embed] });
            }
            if (interaction.customId === 'vk_ayril') {
                if (!oyun.lobi.includes(interaction.user.id)) return interaction.reply({ content: "Zaten lobide değilsin!", ephemeral: true });
                if (interaction.user.id === oyun.lobi[0]) return interaction.reply({ content: "Kurucu ayrılamaz.", ephemeral: true });
                oyun.lobi = oyun.lobi.filter(id => id !== interaction.user.id);
                embed.setDescription(`**Oyun Kurucu:** <@${oyun.lobi[0]}>\n\n**Katılanlar (${oyun.lobi.length}):**\n${oyun.lobi.map(id => `<@${id}>`).join('\n')}`);
                await interaction.update({ embeds: [embed] });
            }
        });
    }

    // 🎮 .başlat
    if (cmd === 'başlat' || cmd === 'baslat') {
        if (!oyun.aktif || oyun.asama !== 'lobi') return message.reply("❌ Şu an başlatılacak bir lobi yok!");
        if (message.author.id !== oyun.lobi[0]) return message.reply("❌ Sadece kurucu başlatabilir!");
        if (oyun.lobi.length < 4) return message.reply("❌ En az 4 kişi lazım!");

        oyun.asama = 'gece';
        oyun.yasayanlar = [...oyun.lobi];
        let oyuncular = [...oyun.lobi].sort(() => Math.random() - 0.5);
        let vampirSayisi = Math.max(1, Math.floor(oyuncular.length / 4));

        for (let i = 0; i < oyuncular.length; i++) {
            oyun.roller[oyuncular[i]] = (i < vampirSayisi) ? 'Vampir' : 'Köylü';
        }
        message.channel.send("✨ **Roller dağıtıldı! Gece çöküyor...**");
    }
});

const botTokeni = process.env.DISCORD_TOKEN;
if (!botTokeni) {
    console.error("❌ HATA: DISCORD_TOKEN bulunamadı!");
} else {
    client.login(bot
                 Tokeni.trim());
                                          }
