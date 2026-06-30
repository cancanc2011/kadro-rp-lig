const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Botun ön eki (Prefix)
const PREFIX = ".";

// Oyuncu verilerini geçici olarak tutacağımız hafıza (Map)
// Sunucu kapansa da silinmemesini istersen ileride veritabanı (db) ekleyebiliriz.
const oyuncuVeritabanı = new Map();

client.once('ready', () => {
    console.log(`[BOT] ${client.user.tag} olarak giriş yapıldı!`);
});

// --- KOMUT SİSTEMİ ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // .ara komutu
    if (command === 'ara') {
        // Kullanıcının yazdığı metni "/" işaretlerine göre bölüyoruz
        const girdi = args.join(" ");
        const parcalar = girdi.split("/");

        if (parcalar.length < 3) {
            const hataEmbed = new EmbedBuilder()
                .setColor('#FF3333')
                .setTitle('❌ Hatalı Kullanım!')
                .setDescription(`Lütfen komutu şu formatta yazın:\n\`${PREFIX}ara SNT/bayrak_emoji/oyuncu_isim\``)
                .setFooter({ text: 'Örnek: .ara SNT/🇹🇷/Çağatay' });
            
            return message.reply({ embeds: [hataEmbed] });
        }

        const snt = parcalar[0].trim();
        const bayrak = parcalar[1].trim();
        const oyuncuIsim = parcalar[2].trim();
        const userId = message.author.id;

        // Oyuncuyu hafızaya kaydet/güncelle
        oyuncuVeritabanı.set(userId, {
            snt: snt,
            bayrak: bayrak,
            isim: oyuncuIsim,
            KayıtTarihi: new Date().toLocaleDateString('tr-TR')
        });

        // Kaliteli ve Şık Embed Tasarımı
        const basariliEmbed = new EmbedBuilder()
            .setColor('#2F3136') // Discord koyu tema rengi, çok asil durur
            .setTitle('🔍 Oyuncu Arama Kaydı Oluşturuldu')
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Oyuncu', value: `> ${message.author} (${oyuncuIsim})`, inline: false },
                { name: '🏷️ SNT', value: `\`\`\`📊 ${snt}\`\`\``, inline: true },
                { name: '🏳️ Bölge / Bayrak', value: `\`\`\` ${bayrak} \`\`\``, inline: true },
            )
            .setImage('https://i.ibb.co/v3mNn7n/divider.png') // İsteğe bağlı: Araya şık bir çizgi görseli (varsa)
            .setDescription('**Durum:** Oyuncu başarıyla listeye eklendi. Sunucudan çıkış yaparsa kaydı otomatik olarak silinecektir.')
            .setTimestamp()
            .setFooter({ text: `${message.guild.name} • Sistem`, iconURL: message.guild.iconURL() });

        return message.reply({ embeds: [basariliEmbed] });
    }
});

// --- SUNUCUDAN ÇIKANLARI SİLME SİSTEMİ ---
client.on('guildMemberRemove', (member) => {
    // Eğer çıkan kişinin ID'si hafızada varsa siler
    if (oyuncuVeritabanı.has(member.id)) {
        oyuncuVeritabanı.delete(member.id);
        console.log(`[SİSTEM] ${member.user.tag} sunucudan çıktı, arama kaydı silindi.`);
    }
});

client.login(process.env.TOKEN);
