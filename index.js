const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const PREFIX = ".";
const oyuncuVeritabanı = new Map();

client.once('ready', () => {
    console.log(`[BOT] ${client.user.tag} aktif!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ara') {
        const arananIcerik = args.join(" ");

        if (!arananIcerik) {
            return message.reply("❌ **Hatalı Kullanım!** Lütfen aradığınız şeyi yazın.\nÖrnek: `.ara SNT` veya `.ara 🇳🇬` veya `.ara Oyuncuİsmi`");
        }

        const userId = message.author.id;

        oyuncuVeritabanı.set(userId, {
            arama: arananIcerik,
            tarih: new Date().toLocaleDateString('tr-TR')
        });

        const araEmbed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('🔍 Aktif Arama İlanı')
            .setDescription(`Arama kaydı başarıyla oluşturuldu. Sunucudan çıkış yaparsanız ilan otomatik silinir.`)
            .addFields(
                { name: '👤 İlan Sahibi', value: `${message.author}`, inline: true },
                { name: '📝 Aranan / Detay', value: `\`\`\` ${arananIcerik} \`\`\``, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `${message.guild.name} • Oyuncu Arama` });

        return message.reply({ embeds: [araEmbed] });
    }
});

client.on('guildMemberRemove', (member) => {
    if (oyuncuVeritabanı.has(member.id)) {
        oyuncuVeritabanı.delete(member.id);
        console.log(`[SİSTEM] ${member.user.tag} çıktı, ilanı silindi.`);
    }
});

client.login("BURAYA_DİSKORD_BOT_TOKENİNİ_YAZ");
