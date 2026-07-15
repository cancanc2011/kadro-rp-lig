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
    console.log(`${client.user.tag} aktif ve gerçekçi derbi motoru hazır!`);
});

// Yardımcı Fonksiyon: Mevkisine Göre Rastgele Oyuncu Seçimi
const oyuncuSecMevki = (takimKey, bolge, varsayilanIsim) => {
    const tk = takimlar.get(takimKey);
    if (!tk || !tk.ilk11 || tk.ilk11.length === 0) return varsayilanIsim;
    
    // Bölgelere göre mevkileri filtrele
    let filtrelenmis = [];
    if (bolge === "DEFANS") {
        filtrelenmis = tk.ilk11.filter(p => ["DEF", "STP", "OSB", "SLB"].includes(p.mevki));
    } else if (bolge === "ORTASAHA") {
        filtrelenmis = tk.ilk11.filter(p => ["OS", "DOS", "MOS", "OOS", "KANAT"].includes(p.mevki));
    } else if (bolge === "HUCUM") {
        filtrelenmis = tk.ilk11.filter(p => ["SNT", "FOR", "FW", "KANAT"].includes(p.mevki));
    } else if (bolge === "KALECI") {
        filtrelenmis = tk.ilk11.filter(p => ["KL", "KLV", "KALECI"].includes(p.mevki));
    }

    if (filtrelenmis.length === 0) {
        return tk.ilk11[Math.floor(Math.random() * tk.ilk11.length)].isim;
    }
    return filtrelenmis[Math.floor(Math.random() * filtrelenmis.length)].isim;
};

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.trim().toLowerCase() === '-yardim' || message.content.trim().toLowerCase() === '-yardım') {
        const embed = new EmbedBuilder()
            .setTitle('📚 SUNUCU SİSTEM REHBERİ')
            .setDescription(`Merhaba **${message.author.username}**, sunucudaki tüm aktif komutlar aşağıda listelenmiştir:`)
            .addFields(
                { name: '⚽ Takım & Kadro Komutları', value: '`.takimkur @kisi Fener` | `.takimlist` | `.takimsil Fener`  | `.taktikekle Fener` | `.oyuncual Osimhen Beşiktaş SNT` | `.oyuncucikar Osimhen Beşiktaş` | `.kadro Fener` | `.taktik Fener 4-3-3 Ofansif`', inline: false },
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
        const fullKey = `${message.channel.id}_${macKey}`;

        if (aktifMaclar.has(fullKey)) return message.reply('⚠️ Bu kanalda zaten devam eden bir maç var!');

        const embed = new EmbedBuilder()
            .setTitle('🏟️ BÜYÜK DERBİ HEYECANI BAŞLIYOR!')
            .setDescription(`⚽ **${takim1.isim}** vs **${takim2.isim}**\n\nMaç süresi **15 saniyede bir** akacak! Gerçekçi saha bölgeleri ve taktiksel atak motoru devrede!`)
            .setColor('#e74c3c');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`baslat_${macKey}`).setLabel('🚀 Derbiyi Başlat').setStyle(ButtonStyle.Danger)
        );

        aktifMaclar.set(fullKey, {
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
            sahaBolgesi: "ORTASAHA", // DEFANS, ORTASAHA, HUCUM
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
        const fullKey = `${message.channel.id}_${t1Isim}_${t2Isim}`;

        const bulunanMac = aktifMaclar.get(fullKey);
        if (!bulunanMac) return message.reply('⚠️ Bu kanalda aktif maç bulunamadı.');

        if (bulunanMac.intervalId) clearInterval(bulunanMac.intervalId);
        aktifMaclar.delete(fullKey);

        message.reply(`🛑 **${bulunanMac.t1} vs ${bulunanMac.t2}** maçı durduruldu!`);
    }
});

// ==========================================
// 🎛️ GERÇEKÇİ MAÇ VE TAKTİK MOTORU (15 SN)
// ==========================================
const pozisyonOynat = (fullKey, channel) => {
    const guncelMac = aktifMaclar.get(fullKey);
    if (!guncelMac) return false;

    let displayDakika = "";

    // --- SÜRE VE DEVRE ARASI KONTROLÜ ---
    if (guncelMac.durum === 'ILK_YARI') {
        guncelMac.dakika += 3;
        if (guncelMac.dakika >= 45) {
            guncelMac.dakika = 45;
            guncelMac.durum = 'DEVRE_ARASI';
            clearInterval(guncelMac.intervalId);

            const devreEmbed = new EmbedBuilder()
                .setTitle('⏸️ İLK YARI SONA ERDİ')
                .setDescription(`🏟️ **Skor:** **${guncelMac.t1} ${guncelMac.skor1} - ${guncelMac.skor2} ${guncelMac.t2}**\n\nİlk yarı bitti! İkinci yarıyı başlatmak için aşağıdaki butona basın!`)
                .setColor('#34495e');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`devam_${guncelMac.key}`).setLabel('▶️ 2. Yarıyı Başlat').setStyle(ButtonStyle.Success)
            );

            if (channel) channel.send({ embeds: [devreEmbed], components: [row] });
            return false;
        }
        displayDakika = `${guncelMac.dakika}'`;
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

    // Mevkisel Oyuncu Seçimleri
    const mevcutOyuncu = guncelMac.topSahibi;
    const defansOyuncusu = oyuncuSecMevki(atakYapanTakimKey, "DEFANS", "Savunma Oyuncusu");
    const ortaSahaOyuncusu = oyuncuSecMevki(atakYapanTakimKey, "ORTASAHA", "Orta Saha Oyuncusu");
    const hucumOyuncusu = oyuncuSecMevki(atakYapanTakimKey, "HUCUM", "Forvet Oyuncusu");
    
    const rakipDefans = oyuncuSecMevki(savunmaTakimKey, "DEFANS", "Rakip Defans");
    const rakipKaleci = oyuncuSecMevki(savunmaTakimKey, "KALECI", "Rakip Kaleci");

    // --- 🗣️ GERÇEKÇİ TARAFTAR YORUMLARI ---
    const taraftarYorumlari = [
        "🏟️ Tribünler adeta tek ses, stadyumda inanılmaz bir uğultu var!",
        "🔥 Meşaleler yakıldı, taraftarlar takımlarını ileri itiyor!",
        "👏 Müthiş pas trafiği sonrası tüm tribünler ayağa kalktı!",
        "🤯 Tırnaklar yeniyor, herkes nefesini tutmuş durumda!"
    ];
    const anlikTaraftar = taraftarYorumlari[Math.floor(Math.random() * taraftarYorumlari.length)];

    // --- 🩹 SAKATLIK (%5 İhtimal) ---
    if (Math.random() < 0.05 && tkAtak && tkAtak.ilk11.length > 0 && tkAtak.yedekler.length > 0) {
        const rIndex = Math.floor(Math.random() * tkAtak.ilk11.length);
        const sakatlanan = tkAtak.ilk11[rIndex];
        const giren = tkAtak.yedekler.shift();

        tkAtak.ilk11[rIndex] = giren;
        guncelMac.topSahibi = giren.isim;

        const sakatlikEmbed = new EmbedBuilder()
            .setTitle(`🏥 SAKATLIK VE OYUNCU DEĞİŞİKLİĞİ | Dakika: ${displayDakika}`)
            .setDescription(`🚨 **Oyun Durdu!** **${sakatlanan.isim}** acı içinde yerde kaldı. Sağlık ekibi sedyeyle sahada.\n\n🔻 **Çıkan:** ${sakatlanan.isim}\n🔺 **Giren:** ${giren.isim} [${giren.mevki}]`)
            .setColor('#e67e22');
        if (channel) channel.send({ embeds: [sakatlikEmbed] });
        return true;
    }

    // --- 👊 KAOTİK KAVGA (%8 İhtimal - MAÇI DURDURUR) ---
    if (Math.random() < 0.08) {
        clearInterval(guncelMac.intervalId);
        guncelMac.durum = 'KAVGA_VAR';

        const kavgaEmbed = new EmbedBuilder()
            .setTitle(`💥 ORTALIK KARIŞTI! SAHADA ARBEDE | Dakika: ${displayDakika}`)
            .setDescription(`🥊 **KAVGA!** **${mevcutOyuncu}** ve **${rakipDefans}** sert müdahale sonrası birbirinin boğazına sarıldı! Yedek kulübeleri ve taraftarlar sahaya koşuyor. Hakem çaresiz kaldı!`)
            .setColor('#7f8c8d');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`polis_${guncelMac.key}`).setLabel('👮 Polis Müdahalesi İsteyin').setStyle(ButtonStyle.Danger)
        );

        if (channel) channel.send({ embeds: [kavgaEmbed], components: [row] });
        return false;
    }

    // --- ⚽ GERÇEKÇİ BÖLGESEL AKSİYON MOTORU ---
    let secilen = { metin: "", yeniTopcu: mevcutOyuncu, takimDegissinMi: false, yeniBolge: guncelMac.sahaBolgesi, gol: false, kart: false, penalti: false };

    if (guncelMac.sahaBolgesi === "DEFANS") {
        const defansAksiyonlari = [
            { metin: `🛡️ **${mevcutOyuncu}** kendi ceza sahası çevresinde topu kontrol etti ve pasını garanti oynayarak **${defansOyuncusu}**'na verdi.`, yeniTopcu: defansOyuncusu, takimDegissinMi: false, yeniBolge: "DEFANS" },
            { metin: `⚙️ Kendi yarı alanından organize çıkıyorlar. **${mevcutOyuncu}** kısa pasla orta sahadaki **${ortaSahaOyuncusu}**'nu gördü.`, yeniTopcu: ortaSahaOyuncusu, takimDegissinMi: false, yeniBolge: "ORTASAHA" },
            { metin: `🚀 Savunmadan uzun top! **${mevcutOyuncu}** ileri uçtaki **${hucumOyuncusu}**'na doğru **Uzun bir Pas** attı, top tehlikeli bölgede!`, yeniTopcu: hucumOyuncusu, takimDegissinMi: false, yeniBolge: "HUCUM" },
            { metin: `🛑 Hatalı pas! **${mevcutOyuncu}** pası çıkarırken araya rakip girdi! **${rakipDefans}** topu kaptı!`, yeniTopcu: rakipDefans, takimDegissinMi: true, yeniBolge: "ORTASAHA" }
        ];
        secilen = defansAksiyonlari[Math.floor(Math.random() * defansAksiyonlari.length)];

    } else if (guncelMac.sahaBolgesi === "ORTASAHA") {
        const ortaSahaAksiyonlari = [
            { metin: `⚽ **${mevcutOyuncu}** orta alanda oyunun yönünü değiştirdi, **Kısa Pasla** topu **${ortaSahaOyuncusu}** ile buluşturdu.`, yeniTopcu: ortaSahaOyuncusu, takimDegissinMi: false, yeniBolge: "ORTASAHA" },
            { metin: `⚡ Harika hareket! **${mevcutOyuncu}**, şık bir **Çalımla** rakibi **${rakipDefans}**'ı bakkala gönderdi ve takımını ileri taşıdı!`, yeniTopcu: mevcutOyuncu, takimDegissinMi: false, yeniBolge: "ORTASAHA" },
            { metin: `📐 Oyun şimdi hareketlendi! **${mevcutOyuncu}** dikine oynadı, hücum bölgesindeki **${hucumOyuncusu}** topu aldı!`, yeniTopcu: hucumOyuncusu, takimDegissinMi: false, yeniBolge: "HUCUM" },
            { metin: `🛑 Pres sonuç verdi! **${mevcutOyuncu}** orta sahada topu saklamaya çalışırken **${rakipDefans}** ayak koydu ve topu kaptı.`, yeniTopcu: rakipDefans, takimDegissinMi: true, yeniBolge: "ORTASAHA" },
            { metin: `🟨 **SERT MÜDAHALE!** **${rakipDefans}** orta alanda kontratağı kesmek için **${mevcutOyuncu}**'yu çekip düşürdü. Hakem oyunu durdurdu, Sarı Kart!`, yeniTopcu: mevcutOyuncu, takimDegissinMi: false, yeniBolge: "ORTASAHA" }
        ];
        secilen = ortaSahaAksiyonlari[Math.floor(Math.random() * ortaSahaAksiyonlari.length)];

    } else if (guncelMac.sahaBolgesi === "HUCUM") {
        const hucumAksiyonlari = [
            { metin: `📐 **${mevcutOyuncu}** sol kanattan ceza sahasına doğru harika bir **Orta Açtı**, arka direkte büyük tehlike!`, yeniTopcu: hucumOyuncusu, takimDegissinMi: false, yeniBolge: "HUCUM" },
            { metin: `💥 **${mevcutOyuncu}** ceza sahası çizgisinden kaleyi düşündü! Sert şut! Ama top üstten dışarı gitti, **Aut**.`, yeniTopcu: rakipKaleci, takimDegissinMi: true, yeniBolge: "DEFANS" },
            { metin: `🎯 **ENFES SERBEST VURUŞ GOLÜ!** Ceza sahası yayının hemen dışından **${mevcutOyuncu}** topun başına geçti, barajın üstünden kalecinin uzanamayacağı köşeye: **GOOOL!**`, yeniTopcu: rakipKaleci, takimDegissinMi: true, yeniBolge: "ORTASAHA", gol: true },
            { metin: `🥅 **GOOOL! HARİKA HÜCUM ORGANİZASYONU!** **${mevcutOyuncu}** savunmanın arasına sızdı, kaleciyle karşı karşıya plase ve top ağlarda!`, yeniTopcu: rakipKaleci, takimDegissinMi: true, yeniBolge: "ORTASAHA", gol: true },
            
            // ABARTILI PENALTI VE KIRMIZI KARTLAR (Sadece Hücum bölgesinde tetiklenir)
            { metin: `🚨 **VAR İNCELEMESİ VE PENALTI!** **${mevcutOyuncu}** ceza sahası içinde dönmek isterken yerde kaldı. Hakem VAR ekranını izledi ve **BEYAZ NOKTAYI GÖSTERDİ!**`, yeniTopcu: mevcutOyuncu, takimDegissinMi: false, yeniBolge: "HUCUM", penalti: true },
            { metin: `🟥 **DİREKT KIRMIZI KART! KATLİAM GİBİ MÜDAHALE!** **${rakipDefans}**, gole giden **${mevcutOyuncu}**'yu ceza sahası dışında arkadan biçti! Hakem direkt kırmızı kartı çıkardı!`, yeniTopcu: mevcutOyuncu, takimDegissinMi: false, yeniBolge: "HUCUM", kart: true, cezaAlan: rakipDefans }
        ];
        secilen = hucumAksiyonlari[Math.floor(Math.random() * hucumAksiyonlari.length)];
    }

    // --- ÖZEL KOŞUL KONTROLLERİ ---

    // 1. Penaltı Atışı Değerlendirmesi
    if (secilen.penalti) {
        if (Math.random() < 0.85) { // %85 Gol ihtimali
            secilen.metin += `\n\n⚽ **Topun başına geçen ${mevcutOyuncu} kaleciyi ve topu ayrı köşelere gönderdi, PENALTIDAN GOL!**`;
            if (guncelMac.topSahibiTakim === "t1") guncelMac.skor1++; else guncelMac.skor2++;
            secilen.yeniTopcu = rakipKaleci;
            secilen.takimDegissinMi = true;
            secilen.newBolge = "ORTASAHA"; // Gol sonrası santra olur orta sahaya geçer
        } else {
            secilen.metin += `\n\n❌ **KAÇTI! ${mevcutOyuncu} penaltıyı direğe nişanladı! Dönen topu savunma uzaklaştırıyor!**`;
            secilen.yeniTopcu = rakipDefans;
            secilen.takimDegissinMi = true;
            secilen.newBolge = "DEFANS";
        }
    }

    // 2. Normal Gol ve Serbest Vuruş Golü
    if (secilen.gol) {
        if (guncelMac.topSahibiTakim === "t1") guncelMac.skor1++; else guncelMac.skor2++;
        secilen.yeniBolge = "ORTASAHA"; // Santra için
    }

    // 3. Kırmızı Kart Durumunda Oyuncu Eksiltme
if (secilen.kart && secilen.cezaAlan && tkSavunma && ...
    tkSavunma.ilk11 = tkSavunma.ilk11.filter(p => p.is...
    secilen.metin += `\n\n🔴 **${secilen.cezaAlan}**...
}


    // Değerleri Güncelle
    guncelMac.topSahibi = secilen.yeniTopcu;
    guncelMac.sahaBolgesi = secilen.yeniBolge;
    if (secilen.takimDegissinMi) {
        guncelMac.topSahibiTakim = guncelMac.topSahibiTakim === "t1" ? "t2" : "t1";
    }

    const atakYapanIsim = guncelMac.topSahibiTakim === "t1" ? guncelMac.t1 : guncelMac.t2;

    // --- GÖRSEL SPIKER EMBED ---
    const pozisyonEmbed = new EmbedBuilder()
        .setTitle(`📊 CANLI ANLATIM | Dakika: ${displayDakika}`)
        .setDescription(
            `🏟️ **Skor:** **${guncelMac.t1} ${guncelMac.skor1} - ${guncelMac.skor2} ${guncelMac.t2}**\n\n` +
            `🎙️ **Spiker:** ${secilen.metin}\n\n` +
            `📣 **İzleyici:** *${anlikTaraftar}*\n\n` +
            `📍 **Saha Bölgesi:** \`[ ${guncelMac.sahaBolgesi} ]\`\n` +
            `⚽ **Topun Durumu:** ${guncelMac.topSahibi} (${atakYapanIsim} kontrolünde)`
        )
        .setColor(secilen.gol || secilen.penalti ? '#2ecc71' : (secilen.kart ? '#e74c3c' : '#3498db'));

    if (channel) channel.send({ embeds: [pozisyonEmbed] });

    // --- 🏁 BİTİŞ KONTROLÜ ---
    if (guncelMac.dakika >= 90 && displayDakika.includes("90+")) {
        const bitisEmbed = new EmbedBuilder()
            .setTitle('🏁 DERBİNİN SON DÜDÜĞÜ GELDİ!')
            .setDescription(`🏆 **Maç Sonucu:** **${guncelMac.t1} ${guncelMac.skor1} - ${guncelMac.skor2} ${guncelMac.t2}**\n\nTaktik savaşlarının, organize atakların ve kaotik kartların havada uçuştuğu dev derbi bitti!`)
            .setColor('#27ae60');
        if (channel) channel.send({ embeds: [bitisEmbed] });
        clearInterval(guncelMac.intervalId);
        aktifMaclar.delete(fullKey);
        return false;
    }

    return true;
};

// ==========================================
// 🎛️ ETKİLEŞİM VE BUTON YÖNETİMİ (15 SN)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const tokens = interaction.customId.split('_');
    const islem = tokens[0];
    const macKey = tokens.slice(1).join('_');
    const fullKey = `${interaction.channel.id}_${macKey}`;

    const mac = aktifMaclar.get(fullKey);
    if (!mac) return interaction.reply({ content: 'Bu maça ait veri bulunamadı veya maç sonlandı.', ephemeral: true });

    const channel = client.channels.cache.get(interaction.channel.id);

    if (islem === 'baslat') {
        await interaction.update({ content: '🔥 Tribünler alev aldı! Hakem ilk düdüğü çaldı!', components: [] });
        
        mac.intervalId = setInterval(() => {
            const devam = pozisyonOynat(fullKey, channel);
            if (!devam) clearInterval(mac.intervalId);
        }, 15000); // 15 saniye ayarlandı
    }

    if (islem === 'devam') {
        await interaction.update({ content: '⚽ İkinci yarı başladı, takımlar sahada!', components: [] });
        
        mac.durum = 'IKINCI_YARI';
        mac.intervalId = setInterval(() => {
            const devam = pozisyonOynat(fullKey, channel);
            if (!devam) clearInterval(mac.intervalId);
        }, 15000); // 15 saniye ayarlandı
    }

    if (islem === 'polis') {
        await interaction.update({ content: '👮 Çevik kuvvet sahaya girdi! Tüm saldırgan oyuncular ayrıldı ve tribünler sakinleştirildi. Maç kaldığı yerden devam ediyor!', components: [] });
        
        mac.durum = mac.dakika >= 45 ? 'IKINCI_YARI' : 'ILK_YARI';
        mac.intervalId = setInterval(() => {
            const devam = pozisyonOynat(fullKey, channel);
            if (!devam) clearInterval(mac.intervalId);
        }, 15000); // 15 saniye ayarlandı
    }
    // --- .taktikekle [Takım Adı] - [Taktik Detayı] ---
if (command === 'taktikekle') {
    // Mesaj içeriğini '-' işaretine göre bölüyoruz (Örn: .taktikekle Real Madrid - 4-3-3 Ofansif)
    const girdi = args.join(' ').split('-');
    if (girdi.length < 2) return message.reply('Kullanım: `.taktikekle [Takım Adı] - [Taktik Detayı]`\nÖrnek: `.taktikekle Real Madrid - 4-3-3 Ofansif`');

    const arananTakimAdi = girdi[0].trim().toLowerCase();
    const yeniTaktik = girdi[1].trim();

    const dosyaYolu = './takimlar.json';
    let kayitliTakimlar = {};

    if (fs.existsSync(dosyaYolu)) {
        try { kayitliTakimlar = JSON.parse(fs.readFileSync(dosyaYolu, 'utf8')); } catch (e) { kayitliTakimlar = {}; }
    }

    const takim = kayitliTakimlar[arananTakimAdi];
    if (!takim) return message.reply('Böyle bir takım bulunamadı! Lütfen takım adını doğru yazdığınızdan emin olun.');

    // GÜVENLİK KONTROLÜ: Komutu yazan kişi takımın sahibi mi? VEYA Yetkili Rol ID'sine sahip mi?
    const yetkiliMi = message.member.roles.cache.has(YETKILI_ROL_ID);
    const takiminSahibiMi = takim.kurucuId === userId;

    if (!takiminSahibiMi && !yetkiliMi) {
        return message.reply('❌ Bu takımın başkanı veya yetkilisi değilsiniz! Başka bir takımın taktiğini değiştiremezsiniz.');
    }

    // Taktiği güncelle
    takim.taktik = yeniTaktik;
    kayitliTakimlar[arananTakimAdi] = takim;
    
    // Map yapısını da güncel tutalım
    takimlar.set(arananTakimAdi, takim);

    // Dosyaya kaydet
    fs.writeFileSync(dosyaYolu, JSON.stringify(kayitliTakimlar, null, 4));

    const taktikEmbed = new EmbedBuilder()
        .setTitle('📋 TAKTİK GÜNCELLENDİ')
        .setDescription(`⚽ **Takım:** \`${takim.isim}\`\n👤 **Güncelleyen:** ${message.author}\n⚙️ **Yeni Belirlenen Taktik:** \`${yeniTaktik}\``)
        .setFooter({ text: 'Taktik başarıyla takım şablonuna işlendi!' })
        .setColor('#2ecc71');

    return message.reply({ embeds: [taktikEmbed] });
                                    
                    
}
});

client.login(process.env.TOKEN);
