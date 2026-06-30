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
    console.log(`⚽ Gelişmiş Arama Botu Hazır Kanka!`);
});

client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot || !message.guild) return;

        const icerik = message.content.trim();
        const icerikKucuk = icerik.toLowerCase();

        // --- .ara GELİŞMİŞ ARAMA KOMUTU ---
        if (icerikKucuk.startsWith('.ara')) {
            const arananKelime = icerik.substring(4).trim();
            if (!arananKelime) return message.reply('❌ Lütfen aramak istediğin ismi, mevkiyi veya bayrağı yaz kanka! Örn: `.ara SNT`, `.ara 🇫🇷` veya `.ara Icardi`');

            // Sunucudaki tüm üyeleri çekiyoruz
            const uyeler = await message.guild.members.fetch();
            
            // Aranan kelimeye uyan üyeleri toplayacağımız liste
            let bulunanlar = [];

            uyeler.forEach(uye => {
                if (uye.user.bot) return; // Botları atla

                const displayName = uye.displayName;
                const parcalar = displayName.split('|').map(p => p.trim());
                
                // İsim formatı parçalama: İsim (0) | Mevki (1) | Bayrak (2) | Değer (3)
                let oyuncuAdi = parcalar[0] || '';
                let mevki = parcalar[1] || '';
                let bayrak = parcalar[2] || '';
                let piyasaDegeri = parcalar[3] || 'Belirtilmemiş';

                // Eğer bayrak girilmeyip direkt değer yazıldıysa düzeltme yap
                if (parcalar.length === 3 && (parcalar[2].includes('M') || parcalar[2].includes('K') || parcalar[2].includes('B') || parcalar[2].includes('€'))) {
                    piyasaDegeri = parcalar[2];
                    bayrak = '';
                }

                // Arama eşleşme kontrolü (İsimde, mevkide veya bayrakta geçiyor mu?)
                if (
                    oyuncuAdi.toLowerCase().includes(arananKelime.toLowerCase()) ||
                    mevki.toLowerCase() === arananKelime.toLowerCase() ||
                    (bayrak && bayrak.includes(arananKelime)) ||
                    uye.user.username.toLowerCase().includes(arananKelime.toLowerCase())
                ) {
                    bulunanlar.push({
                        mention: `<@${uye.id}>`,
                        ad: oyuncuAdi,
                        mevki: mevki || 'Belirtilmemiş',
                        bayrak: bayrak || '🏳️',
                        deger: piyasaDegeri
                    });
                }
            });

            if (bulunanlar.length === 0) {
                return message.reply('🔍 Aradığın kritere uygun hiçbir oyuncu lisansı bulunamadı kanka.');
            }

            // --- SENARYO 1: TEK BİR OYUNCU BULUNDUYSA (DETAYLI LİSANS KARTI) ---
            if (bulunanlar.length === 1) {
                const o = bulunanlar[0];
                const hedefUye = uyeler.get(o.mention.replace(/[<@!>]/g, ''));

                const tekEmbed = new EmbedBuilder()
                    .setTitle(`🪪 REALITY LEAGUE - OYUNCU LİSANS KARTI`)
                    .setThumbnail(hedefUye ? hedefUye.user.displayAvatarURL({ dynamic: true }) : null)
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

            // --- SENARYO 2: BİRDEN FAZLA OYUNCU BULUNDUYSA (MEVKİ VEYA BAYRAK LİSTELEME) ---
            if (bulunanlar.length > 1) {
                let listeMetni = '';
                bulunanlar.forEach((o, index) => {
                    listeMetni += `${index + 1}. ${o.mention} | **${o.ad}** | \`${o.mevki}\` | ${o.bayrak} | \`${o.deger}\`\n`;
                });

                // Discord 2000 karakter sınırını aşmamak için parça kontrolü
                if (listeMetni.length > 3000) listeMetni = listeMetni.substring(0, 2900) + '\n...ve daha fazlası';

                const listeEmbed = new EmbedBuilder()
                    .setTitle(`🔍 ARAMA SONUÇLARI (${bulunanlar.length} Oyuncu Bulundu)`)
                    .setDescription(`Sunucuda **"${arananKelime}"** kriterine uyan tüm lisanslar aşağıda listelenmiştir:\n\n${listeMetni}`)
                    .setColor(0x00A2E8)
                    .setFooter({ text: `Sorgulayan: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                    .setTimestamp();

                return message.reply({ embeds: [listeEmbed] });
            }
        }

    } catch (err) { console.error(err); }
});

client.login
    (process.env.TOKEN);
