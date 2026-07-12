const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const http = require('http');

// 7/24 Aktif Kalma Sunucusu
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
const TRANSFER_YETKILI_1 = '1522697217264062656';
const TRANSFER_YETKILI_2 = '1522696820751601685';
const TAKIM_YETKILI = '1522699609506316338';

const takimlar = new Map(); 
const aktifMaclar = new Map(); 

client.once('ready', () => {
    console.log(`${client.user.tag} aktif ve derbiye hazır!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.trim().toLowerCase() === '-yardim' || message.content.trim().toLowerCase() === '-yardım') {
        const embed = new EmbedBuilder()
            .setTitle('📚 SUNUCU SİSTEM REHBERİ')
            .setDescription(`Merhaba **${message.author.username}**, sunucudaki tüm aktif komutlar aşağıda listelenmiştir:`)
            .addFields(
                { name: '⚽ Takım & Kadro Komutları', value: '`.takimkur @kisi Fener` | `.takimlist` | `.takimsil Fener` | `.oyuncual Osimhen Beşiktaş SNT` | `.oyuncucikar Osimhen Beşiktaş` | `.kadro Fener` | `.taktik Fener 4-3-3 Ofansif`', inline: false },
                { name: '🏟️ Maç Sistemi', value: '`.macbaslat Fener vs Cimbom` | `.macdurdur Fener vs Cimbom` (Sadece Maç Yetkilisi)', inline: false }
            ).setColor('#3498db');
        return message.reply({ embeds: [embed] });
    }

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'takimkur') {
        if (!message.member.roles.cache.has(TAKIM_YETKILI)) {
            return message.reply('Bu komutu sadece <@&1522699609506316338> rolündekiler kullanabilir.');
        }
        const hedef = message.mentions.users.first();
        const takimAdi = args.slice(1).join(' ');

        if (!hedef || !takimAdi) return message.reply('Kullanım: `.takimkur @kullanici TakımAdı`');

        takimlar.set(takimAdi.toLowerCase(), {
            isim: takimAdi,
            kurucuId: hedef.id,
            taktik: '4-4-2 Standart',
            ilk11: [],
            yedekler: []
        });
        message.reply(`✅ **${takimAdi}** takımı kuruldu! Sahibi: ${hedef}`);
    }

    if (command === 'taktik') {
        const takimAdi = args[0];
        const taktikYazisi = args.slice(1).join(' ');

        if (!takimAdi || !taktikYazisi) return message.reply('Kullanım: `.taktik Beşiktaş 4-3-3 Ofansif`');
        
        const takim = takimlar.get(takimAdi.toLowerCase());
        if (!takim) return message.reply('Böyle bir takım bulunamadı.');

        takim.taktik = taktikYazisi;
        message.reply(`⚙️ **${takim.isim}** takımının yeni diziliş ve taktiği: **${taktikYazisi}** olarak ayarlandı!`);
    }

    if (command === 'takimlist') {
        if (takimlar.size === 0) {
            const bosEmbed = new EmbedBuilder()
                .setTitle('📋 SUNUCU AKTİF TAKIMLARI')
                .setDescription('⚠️ Henüz sunucuda kurulmuş bir takım bulunmuyor!')
                .setColor('#e74c3c');
            return message.reply({ embeds: [bosEmbed] });
        }

        const embed = new EmbedBuilder()
            .setTitle('🏟️ SUNUCU RESMİ LİGİ | AKTİF TAKIMLAR')
            .setDescription('Sunucuda aktif olarak mücadele eden takımlar:')
            .setColor('#2ecc71')
            .setTimestamp();

        let sayac = 1;
        takimlar.forEach((t) => {
            const i11Sayisi = t.ilk11 ? t.ilk11.length : 0;
            const yedekSayisi = t.yedekler ? t.yedekler.length : 0;
            embed.addFields({
                name: `🏅 ${sayac}. ${t.isim.toUpperCase()}`,
                value: `> 👑 **Kurucu:** <@${t.kurucuId}>\n> ⚙️ **Diziliş:** \`${t.taktik || '4-4-2'}\`\n> 🏃‍♂️ **Kadro:** \`${i11Sayisi + yedekSayisi} Oyuncu\` *(İlk 11: ${i11Sayisi}/11 | Yedek: ${yedekSayisi})*\n> 📋 **Kadro Detayı:** \`.kadro ${t.isim}\``,
                inline: false
            });
            sayac++;
        });

        message.reply({ embeds: [embed] });
    }

    if (command === 'takimsil') {
        if (!message.member.roles.cache.has(TAKIM_YETKILI)) {
            return message.reply('Bu komutu sadece <@&1522699609506316338> rolündekiler kullanabilir.');
        }
        const takimAdi = args.join(' ');
        if (!takimAdi || !takimlar.has(takimAdi.toLowerCase())) return message.reply('Böyle bir takım bulunamadı.');

        takimlar.delete(takimAdi.toLowerCase());
        message.reply(`🗑️ **${takimAdi}** takımı başarıyla silindi.`);
    }

    if (command === 'oyuncual') {
        if (!message.member.roles.cache.has(TRANSFER_YETKILI_1) && !message.member.roles.cache.has(TRANSFER_YETKILI_2)) {
            return message.reply('Bu komutu sadece transfer yetkilileri kullanabilir.');
        }
        
        let oyuncuAdı = args[0];
        const takimAdi = args[1];
        const mevki = args[2];

        if (!oyuncuAdı || !takimAdi || !mevki) {
            return message.reply('Kullanım: `.oyuncual Osimhen Beşiktaş SNT`');
        }

        const takim = takimlar.get(takimAdi.toLowerCase());
        if (!takim) return message.reply('Böyle bir takım bulunamadı.');

        if (message.mentions.users.first()) {
            oyuncuAdı = `<@${message.mentions.users.first().id}>`;
        }

        if (takim.ilk11.length >= 11) {
            takim.yedekler.push({ isim: oyuncuAdı, mevki: mevki.toUpperCase() });
            return message.reply(`⚠️ **${takim.isim}** kadrosu dolu! **${oyuncuAdı}** [${mevki.toUpperCase()}] **Yedekler** kadrosuna eklendi.`);
        }

        takim.ilk11.push({ isim: oyuncuAdı, mevki: mevki.toUpperCase() });
        message.reply(`✅ **${oyuncuAdı}** [${mevki.toUpperCase()}] oyuncusu **${takim.isim}** takımının **İlk 11** kadrosuna başarıyla eklendi!`);
    }

    if (command === 'oyuncucikar') {
        if (!message.member.roles.cache.has(TRANSFER_YETKILI_1) && !message.member.roles.cache.has(TRANSFER_YETKILI_2)) {
            return message.reply('Bu komutu sadece transfer yetkilileri kullanabilir.');
        }
        let hedef = args[0];
        const takimAdi = args.slice(1).join(' ');

        if (!hedef || !takimAdi) return message.reply('Kullanım: `.oyuncucikar Osimhen Beşiktaş`');
        const takim = takimlar.get(takimAdi.toLowerCase());
        if (!takim) return message.reply('Böyle bir takım bulunamadı.');

        if (message.mentions.users.first()) hedef = `<@${message.mentions.users.first().id}>`;

        takim.ilk11 = takim.ilk11.filter(p => p.isim !== hedef);
        takim.yedekler = takim.yedekler.filter(p => p.isim !== hedef);

        message.reply(`❌ **${hedef}**, **${takim.isim}** takımının kadrosundan çıkarıldı.`);
    }

    if (command === 'kadro') {
        const takimAdi = args.join(' ');
        if (!takimAdi) return message.reply('Kullanım: `.kadro Beşiktaş`');
        
        const takim = takimlar.get(takimAdi.toLowerCase());
        if (!takim) return message.reply('Böyle bir takım bulunamadı.');

        const i11 = takim.ilk11.map(p => `• **${p.isim}** [${p.mevki}]`).join('\n') || 'Boş';
        const ydk = takim.yedekler.map(p => `• **${p.isim}** [${p.mevki}]`).join('\n') || 'Boş';

        const embed = new EmbedBuilder()
            .setTitle(`🛡️ ${takim.isim} Resmi Kadrosu`)
            .setDescription(`⚙️ **Takım Dizilişi:** ${takim.taktik || '4-4-2'}`)
            .addFields(
                { name: `👕 İlk 11 (${takim.ilk11.length}/11)`, value: i11, inline: false },
                { name: `🪑 Yedekler (${takim.yedekler.length})`, value: ydk, inline: false }
            )
            .setColor('#f1c40f');
        message.reply({ embeds: [embed] });
    }

    if (command === 'macbaslat') {
        if (!message.member.roles.cache.has(TAKIM_YETKILI)) {
            return message.reply('Maçı sadece maç yetkilileri başlatabilir.');
        }
        
        const yazi = args.join(' ');
        const bol = yazi.split(/vs/i);
        if (bol.length < 2) return message.reply('Kullanım: `.macbaslat Fenerbahçe vs Galatasaray`');

        const t1Isim = bol[0].trim().toLowerCase();
        const t2Isim = bol[1].trim().toLowerCase();

        const takim1 = takimlar.get(t1Isim);
        const takim2 = takimlar.get(t2Isim);

        if (!takim1 || !takim2) return message.reply('Maçı başlatmak için iki takımın da kurulmuş olması gerekir!');

        const macKey = `${t1Isim}_${t2Isim}`;

        for (const [id, m] of aktifMaclar.entries()) {
            if (m.key === macKey) return message.reply('⚠️ Bu iki takım arasında zaten devam eden bir maç var!');
        }

        const embed = new EmbedBuilder()
            .setTitle('🏟️ BÜYÜK DERBİ HEYECANI BAŞLIYOR!')
            .setDescription(`⚽ **${takim1.isim}** vs **${takim2.isim}**\n\nMaç süresi **5 saniyede bir** akacak! VAR incelemeleri, kavgalar ve anlık top kontrolü aktif!`)
            .setColor('#e74c3c');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`baslat_${t1Isim}_${t2Isim}_${message.channel.id}`).setLabel('🚀 Derbiyi Başlat').setStyle(ButtonStyle.Danger)
        );

        aktifMaclar.set(message.channel.id + "_" + macKey, {
            key: macKey,
            t1Key: t1Isim,
            t2Key: t2Isim,
            t1: takim1.isim,
            t2: takim2.isim,
            skor1: 0,
            skor2: 0,
            dakika: 0,
            topSahibi: takim1.ilk11[0] ? takim1.ilk11[0].isim : `**${takim1.isim} Oyuncusu**`,
            topSahibiTakim: "t1",
            durum: 'ILK_YARI',
            intervalId: null,
            kanalId: message.channel.id
        });

        message.reply({ embeds: [embed], components: [row] });
    }

    if (command === 'macdurdur') {
        if (!message.member.roles.cache.has(TAKIM_YETKILI)) {
            return message.reply('Maçı sadece maç yetkilileri durdurabilir.');
        }

        const yazi = args.join(' ');
        const bol = yazi.split(/vs/i);
        if (bol.length < 2) return message.reply('Kullanım: `.macdurdur Deneme1 vs Deneme2`');

        const t1Isim = bol[0].trim().toLowerCase();
        const t2Isim = bol[1].trim().toLowerCase();
        const brassMacKey = `${t1Isim}_${t2Isim}`;

        let bulunanMacId = null;
        let bulunanMac = null;

        aktifMaclar.forEach((mac, id) => {
            if (mac.key === brassMacKey) {
                bulunanMacId = id;
                bulunanMac = mac;
            }
        });

        if (!bulunanMac) return message.reply('⚠️ Aktif maç bulunamadı.');

        if (bulunanMac.intervalId) clearInterval(bulunanMac.intervalId);
        aktifMaclar.delete(bulunanMacId);

        message.reply(`🛑 **${bulunanMac.t1} vs ${bulunanMac.t2}** maçı durduruldu!`);
    }
});

// ==========================================
// 🎛️ 5 SANİYELİK ULTRA HEYECAN HIZ MOTORU
// ==========================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const tokens = interaction.customId.split('_');
    const islem = tokens[0];

    if (islem === 'baslat') {
        const t1Key = tokens[1];
        const t2Key = tokens[2];
        const kanalId = tokens[3];
        const fullKey = `${kanalId}_${t1Key}_${t2Key}`;

        const mac = aktifMaclar.get(fullKey);
        if (!mac) return interaction.reply({ content: 'Maç bulunamadı.', ephemeral: true });

        await interaction.update({ content: '🔥 Tribünlerde meşaleler yakıldı! Hakem maçı başlattı!', components: [] });

        const channel = client.channels.cache.get(kanalId);

        const oyuncuSec = (takimKey, varsayilanIsim) => {
            const tk = takimlar.get(takimKey);
            if (!tk || tk.ilk11.length === 0) return varsayilanIsim;
            const secilen = tk.ilk11[Math.floor(Math.random() * tk.ilk11.length)];
            return secilen.isim;
        };

        const pozisyonOynat = () => {
            const guncelMac = aktifMaclar.get(fullKey);
            if (!guncelMac) return false;

            let displayDakika = "";

            if (guncelMac.durum === 'ILK_YARI') {
                guncelMac.dakika += 3;
                if (guncelMac.dakika >= 45) {
                    guncelMac.dakika = 45;
                    guncelMac.durum = 'DEVRE_ARASI';
                    displayDakika = "45+2'";
                } else {
                    displayDakika = `${guncelMac.dakika}'`;
                }
            } else if (guncelMac.durum === 'DEVRE_ARASI') {
                const devreEmbed = new EmbedBuilder()
                    .setTitle('⏸️ İLK YARI SONA ERDİ | TARAFTAR ÇILGINA DÖNDÜ')
                    .setDescription(`🏟️ **Skor:** **${guncelMac.t1} ${guncelMac.skor1} - ${guncelMac.skor2} ${guncelMac.t2}**\n\nİlk yarı nefesleri kesti! Takımlar taktik almak için soyunma odasında.`)
                    .setColor('#34495e');
                if (channel) channel.send({ embeds: [devreEmbed] });
                
                guncelMac.dakika = 45;
                guncelMac.durum = 'IKINCI_YARI';
                return true; 
            } else if (guncelMac.durum === 'IKINCI_YARI') {
                guncelMac.dakika += 3;
                if (guncelMac.dakika >= 90) {
                    guncelMac.dakika = 90;
                    displayDakika = "90+4'";
                } else {
                    displayDakika = `${guncelMac.dakika}'`;
                }
            }

            const atakYapanTakimKey = guncelMac.topSahibiTakim === "t1" ? guncelMac.t1Key : guncelMac.t2Key;
            const savunmaTakimKey = guncelMac.topSahibiTakim === "t1" ? guncelMac.t2Key : guncelMac.t1Key;

            const tkAtak = takimlar.get(atakYapanTakimKey);
            const tkSavunma = takimlar.get(savunmaTakimKey);

            const mevcutOyuncu = guncelMac.topSahibi;
            const pasAlacakOyuncu = oyuncuSec(atakYapanTakimKey, `**Pas Alacak Oyuncu**`);
            const defansOyuncusu = oyuncuSec(savunmaTakimKey, `**Rakip Defans**`);

            // --- 🗣️ ÇILGIN TARAFTAR YORUMLARI ---
            const taraftarYorumlari = [
                "🏟️ Stadyum adeta kulakları sağır ediyor, izleyiciler bu maça BAYILDI!",
                "🔥 Tribünler ayakta! Müthiş tekmeye kafa uzatılan bir derbi!",
                "👏 Seyirciler harika futbol resitali karşısında avuçları patlayana kadar alkışlıyor!",
                "📣 'Ooo Şampiyon!' sesleri tüm şehri inletiyor!",
                "🤯 İzleyiciler ekran başında ve tribünde tırnaklarını yiyor!"
            ];
            const anlikTaraftar = taraftarYorumlari[Math.floor(Math.random() * taraftarYorumlari.length)];

            // --- 🩹 1. SAKATLIK VE ZORUNLU OYUNCU DEĞİŞİKLİĞİ (%8 ihtimal) ---
            if (Math.random() < 0.08 && tkAtak && tkAtak.ilk11.length > 0 && tkAtak.yedekler.length > 0) {
                const rIndex = Math.floor(Math.random() * tkAtak.ilk11.length);
                const sakatlanan = tkAtak.ilk11[rIndex];
                const giren = tkAtak.yedekler.shift();

                tkAtak.ilk11[rIndex] = giren;
                guncelMac.topSahibi = giren.isim;

                const sakatlikEmbed = new EmbedBuilder()
                    .setTitle(`🏥 SAKATLIK! OYUN DURDU! | Dakika: ${displayDakika}`)
                    .setDescription(`🚨 **Tansiyon Yüksek!** **${sakatlanan.isim}** ikili mücadelede acı içinde yerde kaldı! Sağlık görevlileri sedyeyle oyuna girdi.\n\n🔻 **Sakatlanan:** ${sakatlanan.isim}\n🔺 **Zorunlu Değişiklik:** ${giren.isim} [${giren.mevki}] topu devraldı!`)
                    .setColor('#e67e22');
                if (channel) channel.send({ embeds: [sakatlikEmbed] });
                return true;
            }

            // --- 👊 2. OYUNCU VE TARAFTAR KAVGALARI (%8 ihtimal) ---
            if (Math.random() < 0.08) {
                const kavgalar = [
                    `🥊 **ORTALIK KARIŞTI!** **${mevcutOyuncu}** ile **${defansOyuncusu}** kafa kafaya geldi, birbirlerini ittiriyorlar! Hakem ve diğer oyuncular araya girmeye çalışıyor!`,
                    `🎆 **TARAFTARLAR SAHADA!** Gol pozisyonu sonrası tribünler çıldırdı, sahaya yabancı maddeler yağıyor! Güvenlik görevlileri kırmızı alarmda!`
                ];
                const secilenKavga = kavgalar[Math.floor(Math.random() * kavgalar.length)];
                const kavgaEmbed = new EmbedBuilder()
                    .setTitle(`💥 MAÇTA KAOS VE GERGİNLİK ANLARI | Dakika: ${displayDakika}`)
                    .setDescription(`${secilenKavga}\n\nİzleyiciler heyecanla olan biteni izliyor, atmosfer kıvılcım alıyor!`)
                    .setColor('#7f8c8d');
                if (channel) channel.send({ embeds: [kavgaEmbed] });
                return true;
            }

            // --- ⚽ 3. HIZLI PASLAŞMA AKSİYONLARI ---
            const aksiyonlar = [
                { tip: "PAS", metin: `⚽ **${mevcutOyuncu}** orta yuvarlakta kafasını kaldırdı ve takım arkadaşı **${pasAlacakOyuncu}**'ya şık bir **Pas** aktardı.`, yeniTopcu: pasAlacakOyuncu, takimDegissinMi: false },
                { tip: "ARA_PAS", metin: `⚡ Müthiş bir vizyon! **${mevcutOyuncu}** savunma arasına öldürücü bir **Ara Pası** bıraktı, **${pasAlacakOyuncu}** hareketlendi!`, yeniTopcu: pasAlacakOyuncu, takimDegissinMi: false },
                { tip: "EL", metin: `🖐️ **DÜDÜK ÇALDI!** **${defansOyuncusu}** topu elle kesti! Hakem pozisyonu yakaladı, **Elle Oynama (El)** gerekçesiyle durdurdu. Top serbest vuruşla tekrar oyunda!`, yeniTopcu: mevcutOyuncu, takimDegissinMi: false },
                { tip: "KIRMIZI_KART", metin: `🟥 **VAR İNCELEMESİ VE KIRMIZI KART!** **${defansOyuncusu}**, **${mevcutOyuncu}**'ya arkadan sert daldı. Hakem **VAR ekranına** gitti... Karar: **DİREKT KIRMIZI KART!**`, yeniTopcu: mevcutOyuncu, takimDegissinMi: false },
                { tip: "PENALTI", metin: `🚨 **VAR İNCELEMESİ: PENALTI!** **${mevcutOyuncu}** ceza sahasında yerde kalmıştı. Hakem oyunu durdurup VAR incelemesi yaptı ve **PENALTI** noktasını gösterdi!`, yeniTopcu: mevcutOyuncu, takimDegissinMi: false },
                { tip: "GOL", metin: `🥅 **VAR KONTROLLÜ GOOOL!** **${mevcutOyuncu}** köşeye mermi gibi zımbaladı! Hakem VAR odasını dinledi, ofsayt yok, **GOL GEÇERLİ!**`, yeniTopcu: oyuncuSec(savunmaTakimKey, "Rakip"), takimDegissinMi: true },
                { tip: "KAPTI", metin: `🛑 **Araya giren savunma!** **${mevcutOyuncu}** pası atmak isterken **${defansOyuncusu}** ayak koydu ve topu takımına kazandırdı!`, yeniTopcu: defansOyuncusu, takimDegissinMi: true }
            ];

            let secilen = aksiyonlar[Math.floor(Math.random() * aksiyonlar.length)];

// --- AKSİYON MANTIKSAL KONTROLLERİ ---
            
            // Penaltı Atışı Değerlendirmesi
            if (secilen.tip === "PENALTI") {
                if (Math.random() < 0.75) {
                    secilen.metin += `\n\n⚽ **Topun başına geçen ${mevcutOyuncu} kaleciyi ve topu ayrı köşelere gönderdi, PENALTIDAN GOL!**`;
                    if (guncelMac.topSahibiTakim === "t1") guncelMac.skor1++; else guncelMac.skor2++;
                    secilen.yeniTopcu = oyuncuSec(savunmaTakimKey, "Rakip");
                    secilen.takimDegissinMi = true;
                } else {
                    secilen.metin += `\n\n❌ **KAÇTI! ${mevcutOyuncu} penaltıyı direğe nişanladı! Top oyun alanına geri dönüyor!**`;
                    secilen.yeniTopcu = defansOyuncusu;
                    secilen.takimDegissinMi = true;
                }
            }

            // Normal Gol Değerlendirmesi
            if (secilen.tip === "GOL") {
                if (guncelMac.topSahibiTakim === "t1") guncelMac.skor1++; else guncelMac.skor2++;
            }

            // Kırmızı Kart Cezası Takım Eksiltme
            if (secilen.tip === "KIRMIZI_KART" && tkSavunma && tkSavunma.ilk11.length > 0) {
                tkSavunma.ilk11 = tkSavunma.ilk11.filter(p => p.isim !== defansOyuncusu);
                secilen.metin += `\n\n🔴 **${defansOyuncusu}** takımını 10 kişi bıraktı! Seyirciler ıslıklıyor!`;
                secilen.yeniTopcu = mevcutOyuncu;
                secilen.takimDegissinMi = false;
            }

            // Topun ve Takımın Sahibi Güncellemesi
            guncelMac.topSahibi = secilen.yeniTopcu;
            if (secilen.takimDegissinMi) {
                guncelMac.topSahibiTakim = guncelMac.topSahibiTakim === "t1" ? "t2" : "t1";
            }

            const atakYapanIsim = guncelMac.topSahibiTakim === "t1" ? guncelMac.t1 : guncelMac.t2;

            // --- GÖRSEL SPIKER EMBED ---
            const pozisyonEmbed = new EmbedBuilder()
                .setTitle(`📊 SPIKER CANLI ANLATIM | Dakika: ${displayDakika}`)
                .setDescription(
                    `🏟️ **Skor:** **${guncelMac.t1} ${guncelMac.skor1} - ${guncelMac.skor2} ${guncelMac.t2}**\n\n` +
                    `🎙️ **Spiker:** ${secilen.metin}\n\n` +
                    `📣 **İzleyici Reaksiyonu:** *${anlikTaraftar}*\n\n` +
                    `⚽ **Topun Durumu:** ${guncelMac.topSahibi} (${atakYapanIsim} kontrolünde)`
                )
                .setColor(secilen.tip === "GOL" ? '#2ecc71' : (secilen.tip === "KIRMIZI_KART" || secilen.tip === "PENALTI" ? '#e74c3c' : '#3498db'));

            if (channel) channel.send({ embeds: [pozisyonEmbed] });

            // --- 🏁 DERBİ BİTİŞ KONTROLÜ ---
            if (guncelMac.dakika >= 90 && displayDakika.includes("90+")) {
                const bitisEmbed = new EmbedBuilder()
                    .setTitle('🏁 DERBİNİN SON DÜDÜĞÜ GELDİ!')
                    .setDescription(`🏆 **Maç Sonucu:** **${guncelMac.t1} ${guncelMac.skor1} - ${guncelMac.skor2} ${guncelMac.t2}**\n\nSeyircilerin ayakta alkışladığı, unutulmaz 5 saniyelik ultra hızlı derbi sona erdi!`)
                    .setColor('#27ae60');
                if (channel) channel.send({ embeds: [bitisEmbed] });
                aktifMaclar.delete(fullKey);
                return false;
            }
            return true;
        };

        const devamEdiyor = pozisyonOynat();

        if (devamEdiyor) {
            // Tam 5 saniyede bir (5000 ms) tetiklenecek şekilde ayarlandı
            const interval = setInterval(() => {
                const d = pozisyonOynat();
                if (!d) clearInterval(interval);
            }, 5000);

            mac.intervalId = interval;
        }
    }
});

client.login(process.env.TOKEN);
