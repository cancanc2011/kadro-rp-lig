const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`⚽ Arama Botu Hazır Kanka!`);
});

client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot || !message.guild) return;

        const icerik = message.content.trim();
        const icerikKucuk = icerik.toLowerCase();

        // --- .ara OYUNCU ARAMA KOMUTU ---
        if (icerikKucuk.startsWith('.ara')) {
            const arananKelime = icerik.substring(4).trim();
            if (!arananKelime) return message.reply('❌ Lütfen aramak istediğin oyuncunun ismini yaz kanka! Örn: `.ara C.Ronaldo`');

            // Sunucudaki üyeleri çekip filtreliyoruz
            const uyeler = await message.guild.members.fetch();
            const bulunanUye = uyeler.find(m => m.displayName.toLowerCase().includes(arananKelime.toLowerCase()) || m.user.username.toLowerCase().includes(arananKelime.toLowerCase()));

            if (!bulunanUye) return message.reply('🔍 Aradığın kriterlere uygun bir oyuncu lisansı bulunamadı kanka.');

            const displayName = bulunanUye.displayName;
            // İsim formatını parçalara ayırıyoruz: İsim | Mevki | 🇫🇷 | 100M tarzı yapılar için
            const parcalar = displayName.split('|').map(p => p.trim());

            let oyuncuAdi = parcalar[0] || bulunanUye.user.username;
            let mevki = 'Belirtilmemiş';
            let bayrak = '🏳️';
            let piyasaDegeri = 'Belirtilmemiş';

            if (parcalar.length >= 2) mevki = parcalar[1];
            if (parcalar.length >= 3) bayrak = parcalar[2];
            if (parcalar.length >= 4) {
                piyasaDegeri = parcalar[3];
            } else if (parcalar.length === 3 && (parcalar[2].includes('M') || parcalar[2].includes('K') || parcalar[2].includes('B') || parcalar[2].includes('€'))) {
                // Eğer bayrak girilmediyse ve 3. parça direkt değerse
                piyasaDegeri = parcalar[2];
                bayrak = '🏳️';
            }

            const araEmbed = new EmbedBuilder()
                .setTitle(`🪪 REALITY LEAGUE - OYUNCU LİSANS KART`)
                .setThumbnail(bulunanUye.user.displayAvatarURL({ dynamic: true }))
                .setColor(0x2F3136)
                .setDescription(`⚽ **Kullanıcı Bilgisi:** <@${bulunanUye.id}>`)
                .addFields(
                    { name: '👤 Oyuncu Adı', value: `\`\`\`${oyuncuAdi}\`\`\``, inline: true },
                    { name: '🏃‍♂️ Mevki / Pozisyon', value: `\`\`\`${mevki}\`\`\``, inline: true },
                    { name: '🌍 Ülke / Uyruk', value: ` ${bayrak}`, inline: true },
                    { name: '💰 Piyasa Değeri', value: `\`\`\`${piyasaDegeri}\`\`\``, inline: true }
                )
                .setFooter({ text: `Sorgulayan: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            return message.reply({ embeds: [araEmbed] });
        }

    } catch (err) { console.error(err); }
});

client.login(process.env.TOKEN);
