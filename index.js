const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const http = require('http');

// Railway 7/24 Aktiflik Sunucusu
http.createServer((req, res) => {
    res.write("Bot 7/24 Aktif!");
    res.end();
}).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const PREFIX = '.';
// --- ROL ID'LERİ ---
const TRANSFER_YETKILI_1 = '1522697217264062656';
const TRANSFER_YETKILI_2 = '1522696820751601685';
const TAKIM_YETKILI = '1522699609506316338';

// --- TAKIM VE MAÇ SİSTEMİ VERİLERİ ---
const takimlar = new Map(); 
const aktifMaclar = new Map(); 

client.once('ready', () => {
    console.log(`${client.user.tag} aktif!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // --- 📚 Sadece -yardim Komutu ---
    if (message.content.trim().toLowerCase() === '-yardim' || message.content.trim().toLowerCase() === '-yardım') {
        const embed = new EmbedBuilder()
            .setTitle('📚 SUNUCU SİSTEM REHBERİ')
            .setDescription(`Merhaba **${message.author.username}**, sunucudaki tüm aktif komutlar aşağıda listelenmiştir:`)
            .addFields(
                { name: '⚽ Futbol / Takım Komutları', value: '`.takimkur @kisi Fener` | `.takimlist` | `.takimsil Fener` | `.oyuncual @kisi Fener SNT` | `.oyuncucikar @kisi Fener` | `.kadro Fener`', inline: false },
                { name: '🏟️ Maç Sistemi', value: '`.macbaslat Fener vs Cimbom` | `.macdurdur` (Sadece Maç Yetkilisi kullanabilir)', inline: false }
            ).setColor('#3498db');
        return message.reply({ embeds: [embed] });
    }

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ==========================================
    // 📊 TAKIM VE KADRO YÖNETİMİ KOMUTLARI
    // ==========================================

    // --- .takimkur <@kullanici> <Takım Adı> ---
    if (command === 'takimkur') {
        if (!message.member.roles.cache.has(TAKIM_YETKILI)) {
            return message.reply('Bu komutu sadece <@&1522699609506316338> rolündekiler kullanabilir.');
        }
        const hedef = message.mentions.users.first();
        const takimAdi = args.slice(1).join(' ');

        if (!hedef || !takimAdi) return message.reply('Kullanım: `.takimkur @kullanici TakımAdı`');

        takimlar.set(takimAdi.toLowerCase(), {
            isim: takimAdi,
            kurucuId: parseInt(hedef.id),
            ilk11: [],
            yedekler: []
        });
        message.reply(`✅ **${takimAdi}** takımı kuruldu! Sahibi: ${hedef}`);
    }

    // --- .takimlist ---
    if (command === 'takimlist') {
        if (takimlar.size === 0) return message.reply('Henüz kurulmuş bir takım yok.');
        let liste = '';
        takimlar.forEach((t) => {
            liste += `• **${t.isim}** - Sahibi: <@${t.kurucuId}>\n`;
        });
        
        message.reply({ 
            content: `📋 **Kurulan Takımlar ve Sahipleri:**\n${liste}`, 
            allowedMentions: { parse: [] } 
        });
    }

    // --- .takimsil <Takım Adı> ---
    if (command === 'takimsil') {
        if (!message.member.roles.cache.has(TAKIM_YETKILI)) {
            return message.reply('Bu komutu sadece <@&1522699609506316338> rolündekiler kullanabilir.');
        }
        const takimAdi = args.join(' ');
        if (!takimAdi || !takimlar.has(takimAdi.toLowerCase())) return message.reply('Böyle bir takım bulunamadı.');

        takimlar.delete(takimAdi.toLowerCase());
        message.reply(`🗑️ **${takimAdi}** takımı başarıyla silindi.`);
    }

    // --- .oyuncual @kullanici <Takım Adı> <Mevki> ---
    if (command === 'oyuncual') {
        if (!message.member.roles.cache.has(TRANSFER_YETKILI_1) && !message.member.roles.cache.has(TRANSFER_YETKILI_2)) {
            return message.reply('Bu komutu sadece transfer yetkilileri kullanabilir.');
        }
        const hedef = message.mentions.users.first();
        const takimAdi = args[1];
        const mevki = args[2];

        if (!hedef || !takimAdi || !mevki) return message.reply('Kullanım: `.oyuncual @kullanici Fenerbahçe SNT`');
        const takim = takimlar.get(takimAdi.toLowerCase());
        if (!takim) return message.reply('Böyle bir takım bulunamadı. Önce takımı kurmalısınız.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`ilk11_${takimAdi.toLowerCase()}_${hedef.id}_${mevki}`).setLabel('İlk 11\'e Ekle').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`yedek_${takimAdi.toLowerCase()}_${hedef.id}_${mevki}`).setLabel('Yedeklere Ekle').setStyle(ButtonStyle.Primary)
        );

        message.reply({ content: `🏃‍♂️ ${hedef} oyuncusu **${takim.isim}** takımına hangi statüyle eklensin?`, components: [row] });
    }

    // --- .oyuncucikar @kullanici <Takım Adı> ---
    if (command === 'oyuncucikar') {
        if (!message.member.roles.cache.has(TRANSFER_YETKILI_1) && !message.member.roles.cache.has(TRANSFER_YETKILI_2)) {
            return message.reply('Bu komutu sadece transfer yetkilileri kullanabilir.');
        }
        const hedef = message.mentions.users.first();
        const takimAdi = args.slice(1).join(' ');

        if (!hedef || !takimAdi) return message.reply('Kullanım: `.oyuncucikar @kullanici Fenerbahçe`');
        const takim = takimlar.get(takimAdi.toLowerCase());
        if (!takim) return message.reply('Böyle bir takım bulunamadı.');

        takim.ilk11 = takim.ilk11.filter(p => p.id !== hedef.id);
        takim.yedekler = takim.yedekler.filter(p => p.id !== hedef.id);

        message.reply(`❌ ${hedef}, **${takim.isim}** takımının kadrosundan çıkarıldı.`);
    }

    // --- .kadro <Takım Adı> ---
    if (command === 'kadro') {
        const takimAdi = args.join(' ');
        if (!takimAdi) return message.reply('Kullanım: `.kadro Fenerbahçe`');
        
        const takim = takimlar.get(takimAdi.toLowerCase());
        if (!takim) return message.reply('Böyle bir takım bulunamadı.');

        const i11 = takim.ilk11.map(p => `• <@${p.id}> [${p.mevki}]`).join('\n') || 'Boş';
        const ydk = takim.yedekler.map(p => `• <@${p.id}> [${p.mevki}]`).join('\n') || 'Boş';

        const embed = new EmbedBuilder()
            .setTitle(`🛡️ ${takim.isim} Resmi Kadrosu`)
            .addFields(
                { name: '👕 İlk 11', value: i11, inline: false },
                { name: '🪑 Yedekler', value: ydk, inline: false }
            )
            .setColor('#f1c40f');
        message.reply({ embeds: [embed] });
    }

    // ==========================================
    // ⚽ GERÇEK ZAMANLI MAÇ SİSTEMİ KOMUTLARI
    // ==========================================

    // --- .macbaslat <Takım1> vs <Takım2> ---
    if (command === 'macbaslat') {
        if (!message.member.roles.cache.has(TAKIM_YETKILI)) {
            return message.reply('Maçı sadece <@&1522699609506316338> başlatabilir.');
        }
        
        const yazi = args.join(' ');
        const bol = yazi.split(/vs/i);
        if (bol.length < 2) return message.reply('Kullanım: `.macbaslat Fenerbahçe vs Galatasaray`');

        const t1Isim = bol[0].trim().toLowerCase();
        const t2Isim = bol[1].trim().toLowerCase();

        const takim1 = takimlar.get(t1Isim);
        const takim2 = takimlar.get(t2Isim);

        if (!takim1 || !takim2) return message.reply('Maçı başlatmak için iki takımın da kurulmuş olması gerekir!');

        const embed = new EmbedBuilder()
            .setTitle('🏟️ DEV DERBİ BAŞLIYOR!')
            .setDescription(`**${takim1.isim}** vs **${takim2.isim}**\n\nButona basıldığı an ilk pozisyon ekrana düşer ve **10 saniyede bir** canlı anlatım başlar!`)
            .setColor('#e74c3c');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`ilkYari_${t1Isim}_${t2Isim}_${message.channel.id}`).setLabel('⏱️ Maçı Başlat').setStyle(ButtonStyle.Danger)
        );

        aktifMaclar.set(message.channel.id, {
            t1Key: t1Isim,
            t2Key: t2Isim,
            t1: takim1.isim,
            t2: takim2.isim,
            skor1: 0,
            skor2: 0,
            dakika: 0,
            durum: 'bekliyor',
            intervalId: null
        });

        message.reply({ embeds: [embed], components: [row] });
    }

    // --- .macdurdur ---
    if (command === 'macdurdur') {
        if (!message.member.roles.cache.has(TAKIM_YETKILI)) {
            return message.reply('Maçı sadece <@&1522699609506316338> durdurabilir.');
        }

        const mac = aktifMaclar.get(message.channel.id);
        if (!mac) return message.reply('⚠️ Bu kanalda şu an aktif olarak oynanan bir maç bulunmuyor.');

        if (mac.intervalId) clearInterval(mac.intervalId);

        aktifMaclar.delete(message.channel.id);
        message.reply(`🛑 **${mac.t1} vs ${mac.t2}** maçı yetkili tarafından durduruldu!`);
    }
});

// ==========================================
// 🎛️ BUTTON INTERACTION YÖNETİMİ
// ==========================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const tokens = interaction.customId.split('_');
    const islem = tokens[0];

    // Oyuncu Ekleme Etkileşimleri
    if (islem === 'ilk11' || islem === 'yedek') {
        const takim = takimlar.get(tokens[1]);
        if (!takim) return interaction.reply({ content: 'Takım verisi kayboldu.', ephemeral: true });

        const oyuncuVeri = { id: tokens[2], mevki: tokens[3].toUpperCase() };

        if (islem === 'ilk11') {
            takim.ilk11.push(oyuncuVeri);
            await interaction.update({ content: `✅ <@${tokens[2]}> oyuncusu [${tokens[3]}] mevkisiyle **${takim.isim}** takımının **İlk 11** kadrosuna eklendi!`, components: [] });
        } else {
            takim.yedekler.push(oyuncuVeri);
            await interaction.update({ content: `✅ <@${tokens[2]}> oyuncusu [${tokens[3]}] mevkisiyle **${takim.isim}** takımının **Yedekler** kadrosuna eklendi!`, components: [] });
        }
    }

    // Canlı Maç Başlatma Etkileşimi
    if (islem === 'ilkYari') {
        const t1Key = tokens[1];
        const t2Key = tokens[2];
        const kanalId = tokens[3];

        const mac = aktifMaclar.get(kanalId);
        if (!mac || mac.durum !== 'bekliyor') return interaction.reply({ content: 'Bu maç zaten başlamış veya iptal edilmiş.', ephemeral: true });

        mac.durum = 'oyun-ici';
        await interaction.update({ content: '⚽ Hakem düdüğünü çaldı ve büyük heyecan başladı!', components: [] });

        // Oyuncu seçici yardımcı fonksiyon
        const sutcuSec = (takimKey, varsayilanIsim) => {
            const tk = takimlar.get(takimKey);
            if (!tk) return varsayilanIsim;
            const tumKadro = [...tk.ilk11, ...tk.yedekler];
            const hucumcular = tumKadro.filter(p => p.mevki !== 'GK' && p.mevki !== 'KL');
            
            if (hucumcular.length > 0) {
                const secilen = hucumcular[Math.floor(Math.random() * hucumcular.length)];
                return `<@${secilen.id}>`;
            }
            return varsayilanIsim;
        };

        // --- Pozisyon Üretici Fonksiyon ---
        const pozisyonOynat = () => {
            const guncelMac = aktifMaclar.get(kanalId);
            if (!guncelMac) return false;

            const channel = client.channels.cache.get(kanalId);
            if (!channel) return false;

            guncelMac.dakika += 1;

            // Atak yapan ve savunan takımları belirle
            const atakYapanTakim = Math.random() > 0.5 ? "t1" : "t2";
            const savunmaTakimi = atakYapanTakim === "t1" ? "t2" : "t1";

            const atakTakimIsmi = atakYapanTakim === "t1" ? guncelMac.t1 : guncelMac.t2;
            const savunmaTakimIsmi = savunmaTakimi === "t1" ? guncelMac.t1 : guncelMac.t2;

            const aKey = atakYapanTakim === "t1" ? t1Key : t2Key;
            const sKey = savunmaTakimi === "t1" ? t1Key : t2Key;

            // Dinamik Oyuncu Seçimleri
            const oyuncu = sutcuSec(aKey, `**${atakTakimIsmi} Oyuncusu**`);
            const alanOyuncu = sutcuSec(aKey, `**${atakTakimIsmi} Takım Arkadaşı**`);
            const rakipOyuncu = sutcuSec(sKey, `**${savunmaTakimIsmi} Defans Oyuncusu**`);

            // Genişletilmiş Canlı Anlatım Havuzu
            const aksiyonlar = [
                { tip: "PAS", metin: `${oyuncu} orta alanda kusursuz bir **Kısa Pas** ile ${alanOyuncu} gördü.` },
                { tip: "PAS", metin: `${oyuncu} savunmanın arkasına havadan nefis bir **Uzun Pas** yolladı, ${alanOyuncu} göğsüyle kontrol etti.` },
                { tip: "ARA_PAS", metin: `${oyuncu} defans bloklarının arasına ince bir **Ara Pas** bıraktı, ${alanOyuncu} depar attı!` },
                { tip: "KISA_ARA_PAS", metin: `${oyuncu} ceza sahası çizgisi üzerinde muazzam bir **Kısa Ara Pas** ile ${alanOyuncu} buluşturdu!` },
                { tip: "UZUN_ARA_PAS", metin: `${oyuncu} kendi yarı sahasından derinlemesine mükemmel bir **Uzun Ara Pas** gönderdi, ${alanOyuncu} topla buluştu!` },
                { tip: "SUT", metin: `${oyuncu} ceza sahası dışından kaleyi gördüğü an çok sert bir **ŞUT** çekti! Kaleci topu son anda kornere çeldi.` },
                { tip: "GOL", metin: `⚽ **GOOOL!** ${oyuncu} yay üzerinden jeneriklik bir **ŞUT** çıkardı ve top çataldan ağlarla buluştu!` },
                { tip: "KALECI_PAS", metin: `${oyuncu} (Kaleci) eliyle arkadaşına doğru temiz bir **Kaleci Pası** atarak atağı başlattı.` },
                { tip: "HATA", metin: `💥 **HATA GELDİ!** ${oyuncu} geri pas verirken büyük bir hata yaptı! Araya giren ${rakipOyuncu} topu kaptı!` },
                { tip: "DISARI", metin: `❌ ${oyuncu} pası ulaştırmak istedi ama şiddetini ayarlayamadı, top doğrudan **Dışarı Çıktı!**` }
            ];

            const rastgeleAksiyon = aksiyonlar[Math.floor(Math.random() * aksiyonlar.length)];
            
            // Skor Güncelleme
            if (rastgeleAksiyon.tip === "GOL") {
                if (atakYapanTakim === "t1") guncelMac.skor1 += 1;
                else guncelMac.skor2 += 1;
            }

            // Top Kimde Alanının Dinamik Durumu
            let topKimdeDurumu = alanOyuncu;
            if (rastgeleAksiyon.tip === "GOL") topKimdeDurumu = "Top ağlarda! (Santra Yapılacak)";
            if (rastgeleAksiyon.tip === "DISARI") topKimdeDurumu = "Top oyun alanı dışında (Taç/Aut)";
            if (rastgeleAksiyon.tip === "HATA") topKimdeDurumu = rakipOyuncu; // Hata olunca top rakibe geçer
            if (rastgeleAksiyon.tip === "SUT") topKimdeDurumu = "Rakip Kalecide";

            const pozisyonEmbed = new EmbedBuilder()
                .setTitle(`📊 CANLI ANLATIM | Dakika: ${guncelMac.dakika}'`)
                .setDescription(
                    `🏟️ **Skor:** ${guncelMac.t1} ${guncelMac.skor1} - ${guncelMac.skor2} ${guncelMac.t2}\n\n` +
                    `🎙️ **Spiker:** ${rastgeleAksiyon.metin}\n\n` +
                    `🏃‍♂️ **Topu Kimde:** ${topKimdeDurumu}`
                )
                .setColor(atakYapanTakim === "t1" ? '#3498db' : '#e67e22');

            channel.send({ embeds: [pozisyonEmbed] });

            // Maç bitiş kontrolü (25. pozisyon)
            if (guncelMac.dakika >= 25) {
                const bitisEmbed = new EmbedBuilder()
                    .setTitle('🏁 MAÇ SONUCU / BÜYÜK DÜDÜK ÇALDI')
                    .setDescription(`🏆 **Maç Skoru:** ${guncelMac.t1} ${guncelMac.skor1} - ${guncelMac.skor2} ${guncelMac.t2}\n\nNefesleri kesen 10 saniyelik seri canlı anlatım fırtınası sona erdi!`)
                    .setColor('#2ecc71');
                channel.send({ embeds: [bitisEmbed] });
                aktifMaclar.delete(kanalId);
                return false;
            }
            return true;
        };

        // 🚀 İLK MESAJ/POZİSYON ANINDA (0. Saniyede) GELSİN
        const macDevamEdiyorMu = pozisyonOynat();

        if (macDevamEdiyorMu) {
            // ⏱️ Sonraki her mesaj tam 10 saniyede bir (10000 ms) tetiklenir
            const macInterval = setInterval(() => {
                const devam = pozisyonOynat();
                if (!devam) {
                    clearInterval(macInterval);
                }
            }, 10000); 

            mac.intervalId = macInterval;
        }
    }
});

client.login(process.env.TOKEN);
            
