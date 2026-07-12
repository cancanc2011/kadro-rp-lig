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

// Yardımcı Fonksiyon: Rastgele Oyuncu Seçimi
const oyuncuSec = (takimKey, varsayilanIsim) => {
    const tk = takimlar.get(takimKey);
    if (!tk || !tk.ilk11 || tk.ilk11.length === 0) return varsayilanIsim;
    const secilen = tk.ilk11[Math.floor(Math.random() * tk.ilk11.length)];
    return secilen.isim;
};

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
        const fullKey = `${message.channel.id}_${macKey}`;

        if (aktifMaclar.has(fullKey)) return message.reply('⚠️ Bu kanalda zaten devam eden bir maç var!');

        const embed = new EmbedBuilder()
            .setTitle('🏟️ BÜYÜK DERBİ HEYECANI BAŞLIYOR!')
            .setDescription(`⚽ **${takim1.isim}** vs **${takim2.isim}**\n\nMaç süresi **5 saniyede bir** akacak! VAR, Kırmızı Kart ve Penaltı Fırtınası Başlıyor!`)
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
// 🎛️ POZİSYON OYNATMA VE KAOS MOTORU
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

    const mevcutOyuncu = guncelMac.topSahibi;
    const pasAlacakOyuncu = oyuncuSec(atakYapanTakimKey, `**Takım Arkadaşı**`);
    const defansOyuncusu = oyuncuSec(savunmaTakimKey, `**Rakip Defans**`);

    // --- 🗣️ ÇILGIN TARAFTAR YORUMLARI ---
    const taraftarYorumlari = [
        "🏟️ Stadyum adeta yıkılıyor, izleyiciler bu maça BAYILDI!",
        "🔥 Tribünler ayakta! Müthiş bir seyir zevki var!",
        "👏 Seyirciler harika futbol resitali karşısında avuçları patlayana kadar alkışlıyor!",
        "🤯 Ekran başındakiler ve tribündekiler heyecandan tırnaklarını yiyor!"
    ];
    const anlikTaraftar = taraftarYorumlari[Math.floor(Math.random() * taraftarYorumlari.length)];

    // --- 🩹 SAKATLIK VE DEĞİŞİKLİK (%6 İhtimal) ---
    if (Math.random() < 0.06 && tkAtak && tkAtak.ilk11.length > 0 && tkAtak.yedekler.length > 0) {
        const rIndex = Math.floor(Math.random() * tkAtak.ilk11.length);
        const sakatlanan = tkAtak.ilk11[rIndex];
        const giren = tkAtak.yedekler.shift();

        tkAtak.ilk11[rIndex] = giren;
        guncelMac.topSahibi = giren.isim;

        const sakatlikEmbed = new EmbedBuilder()
            .setTitle(`🏥 SAKATLIK! OYUN DURDU | Dakika: ${displayDakika}`)
            .setDescription(`🚨 **Sakatlık Anı!** **${sakatlanan.isim}** yerde kaldı! Sedye sahada.\n\n🔻 **Çıkan:** ${sakatlanan.isim}\n🔺 **Giren:** ${giren.isim} [${giren.mevki}]`)
            .setColor('#e67e22');
        if (channel) channel.send({ embeds: [sakatlikEmbed] });
        return true;
    }

    // --- 👊 TARAFTAR VE OYUNCU KAVGALARI (%10 İhtimal - BUTONLU DURDURMA) ---
    if (Math.random() < 0.10) {
        clearInterval(guncelMac.intervalId);
        guncelMac.durum = 'KAVGA_VAR';

        const kavgaEmbed = new EmbedBuilder()
            .setTitle(`💥 ORTALIK KARIŞTI! SAHA SAVAŞ ALANI | Dakika: ${displayDakika}`)
            .setDescription(`🥊 **KAVGA!** **${mevcutOyuncu}** ve **${defansOyuncusu}** tekmelerle birbirine girdi! Taraftarlar sahaya atlıyor, maç tamamen durdu! Müdahale gerekiyor!`)
            .setColor('#7f8c8d');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`polis_${guncelMac.key}`).setLabel('👮 Polisleri Sahaya Çağır (Kavgayı Ayır)').setStyle(ButtonStyle.Danger)
        );

        if (channel) channel.send({ embeds: [kavgaEmbed], components: [row] });
        return false;
    }

    // --- ⚽ FUTBOL VARYASYONLARI (PENALTI VE KIRMIZI ABARTILDI) ---
    const aksiyonlar = [
        { tip: "KISA_PAS", metin: `⚽ **${mevcutOyuncu}** pasını yakınındaki **${pasAlacakOyuncu}**'ya aktardı, kısa paslarla çıkıyorlar.`, yeniTopcu: pasAlacakOyuncu, takimDegissinMi: false },
        { tip: "UZUN_PAS", metin: `🚀 **${mevcutOyuncu}** savunmanın arkasına çok **Uzun bir Pas** gönderdi, **${pasAlacakOyuncu}** göğsüyle kontrol etti!`, yeniTopcu: pasAlacakOyuncu, takimDegissinMi: false },
        { tip: "CALIM", metin: `⚡ Muhteşem çalım! **${mevcutOyuncu}**, rakibi **${defansOyuncusu}**'nu enfes bir bacak arası **Çalımla** geçti!`, yeniTopcu: mevcutOyuncu, takimDegissinMi: false },
        { tip: "ORTA_ACTI", metin: `📐 **${mevcutOyuncu}** sağ kanattan ceza sahasına doğru harika bir **Orta Açtı**, içeride karambol var!`, yeniTopcu: pasAlacakOyuncu, takimDegissinMi: false },
        { tip: "AUT", metin: `💨 **${mevcutOyuncu}** sert vurdu ama top üstten **Dışarı (Auta)** gitti. Oyun rakip kaleciden başlayacak.`, yeniTopcu: oyuncuSec(savunmaTakimKey, "Kaleci"), takimDegissinMi: true },
        { tip: "SERBEST_VURUS", metin: `🎯 **DIREKT SERBEST VURUŞ GOLÜ!** Ceza sahası dışından **${mevcutOyuncu}** barajın üstünden muhteşem vurdu ve top çatalda! Seyirciler ayakta alkışlıyor!`, yeniTopcu: oyuncuSec(savunmaTakimKey, "Rakip"), takimDegissinMi: true, gol: true },
        { tip: "EL", metin: `🖐️ Düdük çaldı! **${defansOyuncusu}** topu elle kesti. Hakem **Elle Oynama (El)** kararı verdi!`, yeniTopcu: mevcutOyuncu, takimDegissinMi: false },
        
        // ABARTILI KART VE PENALTI İHTİMALLERİ (Havuzda oranları artsın diye fazla eklendi)
        { tip: "PENALTI", pTipi: "VAR_PENALTI", metin: `🚨 **VAR KONTROLLÜ PENALTI!** **${mevcutOyuncu}** ceza sahasında uçarak indirildi! Hakem ekrana gitti ve **BEYAZ NOKTAYI GÖSTERDİ!**`, yeniTopcu: mevcutOyuncu, takimDegissinMi: false },
        { tip: "PENALTI", pTipi: "DIREKT_PENALTI", metin: `🚨 **BEYAZ NOKTA!** Savunma oyuncusu **${defansOyuncusu}** arkadan çok sert kaydı, Hakem tereddütsüz **PENALTI** noktasını gösterdi!`, yeniTopcu: mevcutOyuncu, takimDegissinMi: false },
        { tip: "KIRMIZI_KART", metin: `🟥 **VAR UYARISIYLA DİREKT KIRMIZI KART!** **${defansOyuncusu}** arkadan bileğe bastı! Hakem VAR ekranını izledi ve tereddütsüz **KIRMIZI KARTINI ÇIKARDI!**`, yeniTopcu: mevcutOyuncu, takimDegissinMi: false },
        { tip: "KIRMIZI_KART", metin: `🟥 **İKİNCİ SARI VE KIRMIZI!** **${defansOyuncusu}** sert müdahale sonrası ikinci sarı karttan **KIRMIZI KART** ile oyun dışı kaldı!`, yeniTopcu: mevcutOyuncu, takimDegissinMi: false },
        { tip: "GOL", metin: `🥅 **GOOOL!** **${mevcutOyuncu}** kaleciyle karşı karşıya pozisyonda topu ağlarla buluşturdu!`, yeniTopcu: oyuncuSec(savunmaTakimKey, "Rakip"), takimDegissinMi: true, gol: true },
        { tip: "KAPTI", metin: `🛑 Araya giren defans! **${mevcutOyuncu}** çalım denerken **${defansOyuncusu}** topu temiz bir müdahaleyle söktü aldı!`, yeniTopcu: defansOyuncusu, takimDegissinMi: true }
    ];

    let secilen = aksiyonlar[Math.floor(Math.random() * aksiyonlar.length)];

     // Penaltı Sonuçlandırması
    if (secilen.tip === "PENALTI") {
        if (Math.random() < 0.85) { // %85 gol
            secilen.metin += `\n\n⚽ **Topun başına geçen ${mevcutOyuncu} kaleciyi ters köşeye yatırdı ve PENALTIDAN GOLÜ ATTI!**`;
            if (guncelMac.topSahibiTakim === "t1") guncelMac.skor1++; else guncelMac.skor2++;
            secilen.yeniTopcu = oyuncuSec(savunmaTakimKey, "Rakip");
            secilen.takimDegissinMi = true;
        } else {
            secilen.metin += `\n\n❌ **KAÇTI! ${mevcutOyuncu} penaltıyı dışarı attı veya Kaleci kurtardı! Kaçan penaltı!**`;
            secilen.yeniTopcu = defansOyuncusu;
            secilen.takimDegissinMi = true;
        }
    }

    // Normal Gol veya Serbest Vuruş Golü
    if (secilen.gol && secilen.tip !== "PENALTI") {
        if (guncelMac.topSahibiTakim === "t1") guncelMac.skor1++; else guncelMac.skor2++;
    }

    // Kırmızı Kart Durumunda Oyuncu Silme
    if (secilen.tip === "KIRMIZI_KART" && tkSavunma && tkSavunma.ilk11.length > 0) {
        tkSavunma.ilk11 = tkSavunma.ilk11.filter(p => p.isim !== defansOyuncusu);
        secilen.metin += `\n\n🔴 **${defansOyuncusu}** takımını 10 kişi bıraktı! Seyirciler çılgına döndü!`;
    }

    // Pozisyon Sonrası Top/Takım Sahipliği Güncellemesi
    guncelMac.topSahibi = secilen.yeniTopcu;
    if (secilen.takimDegissinMi) {
        guncelMac.topSahibiTakim = guncelMac.topSahibiTakim === "t1" ? "t2" : "t1";
    }

    const atakYapanIsim = guncelMac.topSahibiTakim === "t1" ? guncelMac.t1 : guncelMac.t2;

    const pozisyonEmbed = new EmbedBuilder()
        .setTitle(`📊 CANLI ANLATIM | Dakika: ${displayDakika}`)
        .setDescription(
            `🏟️ **Skor:** **${guncelMac.t1} ${guncelMac.skor1} - ${guncelMac.skor2} ${guncelMac.t2}**\n\n` +
            `🎙️ **Spiker:** ${secilen.metin}\n\n` +
            `📣 **İzleyici Reaksiyonu:** *${anlikTaraftar}*\n\n` +
            `⚽ **Topun Durumu:** ${guncelMac.topSahibi} (${atakYapanIsim} ayağında)`
        )
        .setColor(secilen.gol || secilen.tip === "PENALTI" ? '#2ecc71' : (secilen.tip === "KIRMIZI_KART" ? '#e74c3c' : '#3498db'));

    if (channel) channel.send({ embeds: [pozisyonEmbed] });

    // --- 🏁 BİTİŞ KONTROLÜ ---
    if (guncelMac.dakika >= 90 && displayDakika.includes("90+")) {
        const bitisEmbed = new EmbedBuilder()
            .setTitle('🏁 DERBİNİN SON DÜDÜĞÜ GELDİ!')
            .setDescription(`🏆 **Maç Sonucu:** **${guncelMac.t1} ${guncelMac.skor1} - ${guncelMac.skor2} ${guncelMac.t2}**\n\nSeyircilerin unutamayacağı, bol kartlı, penaltılı ultra hızlı derbi bitti!`)
            .setColor('#27ae60');
        if (channel) channel.send({ embeds: [bitisEmbed] });
        clearInterval(guncelMac.intervalId);
        aktifMaclar.delete(fullKey);
        return false;
    }

    return true;
};

// ==========================================
// 🎛️ ETKİLEŞİM VE BUTON YÖNETİMİ
// ==========================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const tokens = interaction.customId.split('_');
    const islem = tokens[0];
    const macKey = tokens.slice(1).join('_'); // macKey'i güvenli şekilde yakalarız
    const fullKey = `${interaction.channel.id}_${macKey}`;

    const mac = aktifMaclar.get(fullKey);
    if (!mac) return interaction.reply({ content: 'Bu maça ait veri bulunamadı veya maç sonlandı.', ephemeral: true });

    const channel = client.channels.cache.get(interaction.channel.id);

    if (islem === 'baslat') {
        await interaction.update({ content: '🔥 Tribünler alev aldı! Hakem ilk düdüğü çaldı!', components: [] });
        
        mac.intervalId = setInterval(() => {
            const devam = pozisyonOynat(fullKey, channel);
            if (!devam) clearInterval(mac.intervalId);
        }, 5000);
    }

    if (islem === 'devam') {
        await interaction.update({ content: '⚽ İkinci yarı başladı, takımlar sahada!', components: [] });
        
        mac.durum = 'IKINCI_YARI';
        mac.intervalId = setInterval(() => {
            const devam = pozisyonOynat(fullKey, channel);
            if (!devam) clearInterval(mac.intervalId);
        }, 5000);
    }

    if (islem === 'polis') {
        await interaction.update({ content: '👮 Çevik kuvvet sahaya girdi! Tüm saldırgan oyuncular ayrıldı ve tribünler sakinleştirildi. Maç kaldığı yerden devam ediyor!', components: [] });
        
        mac.durum = mac.dakika >= 45 ? 'IKINCI_YARI' : 'ILK_YARI';
        mac.intervalId = setInterval(() => {
            const devam = pozisyonOynat(fullKey, channel);
            if (!devam) clearInterval(mac.intervalId);
        }, 5000);
    }
});

client.login(process.env.TOKEN);
