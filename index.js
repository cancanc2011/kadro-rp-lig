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
    console.log(`⚽ Gelişmiş Arama Botu Aktif Kanka!`);
});

client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot || !message.guild) return;

        const icerik = message.content.trim();
        
        // Sadece .ara ile başlayan mesajları gör, diğer mesajları direkt engelle!
        if (!icerik.toLowerCase().startsWith('.ara')) return;

        const arananKelime = icerik.substring(4).trim();
        if (!arananKelime) {
            return message.reply('❌ Lütfen aramak istediğin ismi, mevkiyi veya bayrağı yaz kanka! Örn: `.ara SNT`, `.ara 🇫🇷` veya `.ara Icardi`');
        }

        // Sunucudaki üyeleri zorlayarak çekiyoruz
        const uyeler = await message.guild.members.fetch({ force: true });
        let bulunanlar = [];

        uyeler.forEach(uye => {
            if (uye.user.bot) return;

            const displayName = uye.displayName;
            const parcalar = displayName.split('|').map(p => p.trim());
            
            let oyuncuAdi = parcalar[0] || '';
            let mevki = parcalar[1] || '';
            let bayrak = parcalar[2] || '';
            let piyasaDegeri = parcalar[3] || 'Belirtilmemiş';

            if (parcalar.length === 3 && (parcalar[2].includes('M') || parcalar[2].includes('K') || parcalar[2].includes('B') || parcalar[2].includes('€'))) {
                piyasaDegeri = parcalar[2];
                bayrak = '';
            }

            const arananKucuk = arananKelime.toLowerCase();
            
            if (
                oyuncuAdi.toLowerCase().includes(arananKucuk) ||
                mevki.toLowerCase() === arananKucuk ||
                (bayrak && bayrak.includes(arananKelime)) || 
                uye.user.username.toLowerCase().includes(arananKucuk)
            ) {
                bulunanlar.push({
                    id: uye.id,
                    mention: `<@${uye.id}>`,
                    ad: oyuncuAdi,
                    mevki: mevki || 'Belirtilmemiş',
                    bayrak: bayrak || '🏳️',
                    deger: piyasaDegeri,
                    avatar: uye.user.displayAvatarURL({ dynamic: true })
                });
            }
        });

        if (bulunanlar.length === 0) {
            return message.reply(`🔍 Sunucuda **"${arananKelime}"** kriterine uygun hiçbir oyuncu bulunamadı kanka.`);
        }

        // --- DURUM 1: SADECE TEK BİR OYUNCU BULUNDUYSA ---
        if (bulunanlar.length === 1) {
            const o = bulunanlar[0];
            const tekEmbed = new EmbedBuilder()
                .setTitle(`🪪 REALITY LEAGUE - OYUNCU LİSANS KARTI`)
                .setThumbnail(o.avatar)
                .setColor(0x2F3136)
                .setDescription(`⚽ **Kullanıcı Bilgisi:** ${o.mention}`)
                .addFields(
                    { name: '👤 Oyuncu Adı', value: `\`\`\`${o.ad}\`\`\``, inline: true },
                    { name: '🏃‍♂️ Mevki / Pozisyon', value: `\`\`\`${o.mevki}\`\`\``, inline: true },
                    { name: '🌍 Ülke / Uyruk', value: ` ${o.bayrak}`, inline: true },
                    { name: '💰 Piyasa Değeri', value: `\`\`\`${o.deger}\`\`\``, inline: true }
                )
                .setFooter({ text: `Sorgulayan: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            return message.reply({ embeds: [tekEmbed] });
        }

        // --- DURUM 2: BİRDEN FAZLA OYUNCU BULUNDUYSA ---
        if (bulunanlar.length > 1) {
            let listeMetni = '';
            bulunanlar.forEach((o, index) => {
                listeMetni += `${index + 1}. ${o.mention} | **${o.ad}** | \`${o.mevki}\` | ${o.bayrak} | \`${o.deger}\`\n`;
            });

            if (listeMetni.length > 3500) listeMetni = listeMetni.substring(0, 3500) + '\n...ve daha fazlası';

            const listeEmbed = new EmbedBuilder()
                .setTitle(`🔍 ARAMA SONUÇLARI (${bulunanlar.length} Oyuncu Bulundu)`)
                .setDescription(`Sunucuda **"${arananKelime}"** kriterine uyan tüm lisanslar:\n\n${listeMetni}`)
                .setColor(0x00A2E8)
                .setFooter({ text: `Sorgulayan: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            return message.reply({ embeds: [listeEmbed] });
        }

    } catch (err) { 
        console.error(err); 
    }
});

client.login(
    process.env.TOKEN);
