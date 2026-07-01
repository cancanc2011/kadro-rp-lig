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
        
        // Sadece .ara ile başlayan komutları kontrol et
        if (!icerik.toLowerCase().startsWith('.ara')) return;

        const arananOrijinal = icerik.substring(4).trim();
        const arananKucuk = arananOrijinal.toLowerCase();

        if (!arananOrijinal) {
            return message.reply('❌ Lütfen aramak istediğin mevkiyi veya oyuncu adını yaz kanka! Örn: `.ara SNT` veya `.ara snt`');
        }

        // Sunucudaki tüm üyeleri zorlayarak çekiyoruz
        const sunucu = client.guilds.cache.get('1511859511634301059') || message.guild;
        const uyeler = await sunucu.members.fetch({ force: true });
        
        let bulunanlar = [];

        uyeler.forEach(uye => {
            if (uye.user.bot) return;

            const displayName = uye.displayName;
            // İsim formatını parçalıyoruz ve boşlukları temizliyoruz
            const parcalar = displayName.split('|').map(p => p.trim());
            
            let oyuncuAdi = parcalar[0] || uye.user.username;
            let mevki = 'Belirtilmemiş';
            let bayrak = '🏳️';
            let piyasaDegeri = 'Belirtilmemiş';

            if (parcalar.length >= 2) mevki = parcalar[1];
            if (parcalar.length >= 3) bayrak = parcalar[2];
            if (parcalar.length >= 4) {
                piyasaDegeri = parcalar[3];
            } else if (parcalar.length === 3 && (parcalar[2].includes('M') || parcalar[2].includes('K') || parcalar[2].includes('B') || parcalar[2].includes('€'))) {
                piyasaDegeri = parcalar[2];
                bayrak = '🏳️';
            }

            // Arama Kontrolleri (Küçük/Büyük Harf Duyarsız)
            const temizMevki = mevki.toLowerCase();
            const temizOyuncuAdi = oyuncuAdi.toLowerCase();
            const temizUsername = uye.user.username.toLowerCase();

            if (
                temizMevki === arananKucuk || // Mevki tam eşleşme (.ara snt veya .ara SNT)
                temizOyuncuAdi.includes(arananKucuk) || // Oyuncu ismi içeriyor mu
                temizUsername.includes(arananKucuk) || // Discord kullanıcı adı içeriyor mu
                (bayrak && bayrak.includes(arananOrijinal)) // Emoji/Bayrak araması
            ) {
                bulunanlar.push({
                    id: uye.id,
                    mention: `<@${uye.id}>`,
                    ad: oyuncuAdi,
                    mevki: mevki,
                    bayrak: bayrak,
                    deger: piyasaDegeri,
                    avatar: uye.user.displayAvatarURL({ dynamic: true })
                });
            }
        });

        // Oyuncu veya mevki bulunamadıysa
        if (bulunanlar.length === 0) {
            return message.reply(`🔍 Sunucuda **"${arananOrijinal}"** kriterine uygun hiçbir oyuncu veya mevki bulunamadı kanka.`);
        }

        // --- DURUM 1: SADECE TEK BİR OYUNCU BULUNDUYSA (İSİM ARAMASI) ---
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

        // --- DURUM 2: BİRDEN FAZLA OYUNCU BULUNDUYSA (MEVKİ LİSTELEME) ---
        if (bulunanlar.length > 1) {
            let listeMetni = '';
            bulunanlar.forEach((o, index) => {
                listeMetni += `${index + 1}. ${o.mention} | **${o.ad}** | \`${o.mevki}\` | ${o.bayrak} | \`${o.deger}\`\n`;
            });

            if (listeMetni.length > 3500) listeMetni = listeMetni.substring(0, 3500) + '\n...ve daha fazlası';

            const listeEmbed = new EmbedBuilder()
                .setTitle(`🔍 ARAMA SONUÇLARI (${bulunanlar.length} Oyuncu Bulundu)`)
                .setDescription(`Sunucuda **"${arananOrijinal}"** kriterine uyan lisanslar:\n\n${listeMetni}`)
                .setColor(0x00A2E8)
                .setFooter({ text: `Sorgulayan: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            return message.reply({ embeds: [listeEmbed] });
        }

    } catch (err) { 
        console.error("Hata oluştu kanka:", err); 
    }
});

client.login(process.env.TOKEN);

