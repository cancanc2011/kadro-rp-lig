const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- AYARLAR VE KLASÖR KONTROLLERİ ---
const PREFIX = ".";
const YETKILI_ROL_ID = "YETKILI_ROL_IDSINI_BURAYA_YAZ"; // Buraya yetkili rol ID'sini yapıştır kanka

// JSON dosyalarının varlığını kontrol et, yoksa boş oluştur
const dosyaKontrol = (dosyaYolu) => {
    if (!fs.existsSync(dosyaYolu)) {
        fs.writeFileSync(dosyaYolu, JSON.stringify({}, null, 4));
    }
};
dosyaKontrol('./takimlar.json');
dosyaKontrol('./cezalar.json');

// Bellek içi aktif takımlar ve maçlar
const takimlar = new Map();

// --- 📂 BOT AÇILIŞINDA TAKIMLARI GERİ YÜKLEME ---
client.once('ready', () => {
    console.log(`🤖 Bot ${client.user.tag} olarak giriş yaptı!`);
    
    try {
        const kayitliTakimlar = JSON.parse(fs.readFileSync('./takimlar.json', 'utf8'));
        for (let key in kayitliTakimlar) {
            takimlar.set(key, kayitliTakimlar[key]);
        }
        console.log("📂 Kayıtlı tüm takımlar başarıyla dosyadan yüklendi!");
    } catch (e) {
        console.error("Takımlar dosyadan yüklenirken hata oluştu:", e);
    }
});

// --- 📩 MESAJ GELİNCE ÇALIŞACAK KOMUTLAR ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

    // ==========================================
    // ⚔️ KOMUT 1: .takimkur @kullanici Takım Adı
    // ==========================================
    if (command === 'takimkur') {
        if (!message.member.roles.cache.has(YETKILI_ROL_ID)) {
            return message.reply('❌ Bu komutu kullanmak için yetkiniz yok.');
        }
        
        const hedef = message.mentions.users.first();
        const takimAdi = args.slice(1).join(' ');
        
        if (!hedef || !takimAdi) {
            return message.reply('👉 Kullanım: `.takimkur @kullanici TakımAdı`');
        }

        const takimKey = takimAdi.toLowerCase();
        let kayitliTakimlar = JSON.parse(fs.readFileSync('./takimlar.json', 'utf8'));

        if (kayitliTakimlar[takimKey]) {
            return message.reply('⚠️ Bu isimde bir takım zaten kurulmuş!');
        }

        // Yeni takım şablonu (11 adet varsayılan oyuncu)
        const yeniTakim = { 
            isim: takimAdi, 
            kurucuId: hedef.id, 
            taktik: 'Belirlenmedi', 
            oyuncular: [
                "Oyuncu 1", "Oyuncu 2", "Oyuncu 3", "Oyuncu 4", "Oyuncu 5", 
                "Oyuncu 6", "Oyuncu 7", "Oyuncu 8", "Oyuncu 9", "Oyuncu 10", "Kaleci"
            ] 
        };

        takimlar.set(takimKey, yeniTakim);
        kayitliTakimlar[takimKey] = yeniTakim;
        fs.writeFileSync('./takimlar.json', JSON.stringify(kayitliTakimlar, null, 4));

        return message.reply(`✅ **${takimAdi}** takımı kuruldu! Takım Sahibi (Başkan): ${hedef}`);
    }

    // ==========================================
    // 📋 KOMUT 2: .taktikekle Takım Adı - Taktik Detayı
    // ==========================================
    if (command === 'taktikekle') {
        const girdi = args.join(' ').split('-');
        if (girdi.length < 2) {
            return message.reply('👉 Kullanım: `.taktikekle [Takım Adı] - [Taktik Detayı]`\nÖrn: `.taktikekle Real Madrid - 4-3-3 Ofansif / Kısa Pas`');
        }

        const arananTakimAdi = girdi[0].trim().toLowerCase();
        const yeniTaktik = girdi[1].trim();

        let kayitliTakimlar = JSON.parse(fs.readFileSync('./takimlar.json', 'utf8'));
        const takim = kayitliTakimlar[arananTakimAdi];

        if (!takim) {
            return message.reply('❌ Böyle bir takım bulunamadı! Takım adını doğru yazdığınızdan emin olun.');
        }

        const yetkiliMi = message.member.roles.cache.has(YETKILI_ROL_ID);
        const takiminSahibiMi = takim.kurucuId === userId;

        if (!takiminSahibiMi && !yetkiliMi) {
            return message.reply('❌ Bu takımın sahibi veya teknik direktörü değilsiniz!');
        }

        takim.taktik = yeniTaktik;
        kayitliTakimlar[arananTakimAdi] = takim;
        takimlar.set(arananTakimAdi, takim);

        fs.writeFileSync('./takimlar.json', JSON.stringify(kayitliTakimlar, null, 4));

        const taktikEmbed = new EmbedBuilder()
            .setTitle('📋 TAKTİK GÜNCELLENDİ')
            .setDescription(`⚽ **Takım:** \`${takim.isim}\`\n👤 **Güncelleyen:** ${message.author}\n⚙️ **Yeni Belirlenen Taktik:** \`${yeniTaktik}\``)
            .setFooter({ text: 'Taktik başarıyla takım şablonuna işlendi!' })
            .setColor('#2ecc71');

        return message.reply({ embeds: [taktikEmbed] });
    }

    // ==========================================
    // ⚽ KOMUT 3: .mac Takım1 - Takım2 (Maç Başlatma)
    // ==========================================
    if (command === 'mac') {
        const girdi = args.join(' ').split('-');
        if (girdi.length < 2) return message.reply('👉 Kullanım: `.mac Takım1 - Takım2`');

        const t1Key = girdi[0].trim().toLowerCase();
        const t2Key = girdi[1].trim().toLowerCase();

        let kayitliTakimlar = JSON.parse(fs.readFileSync('./takimlar.json', 'utf8'));
        let takim1 = kayitliTakimlar[t1Key];
        let takim2 = kayitliTakimlar[t2Key];

        if (!takim1 || !takim2) return message.reply('❌ Girdiğiniz takımlardan biri veya ikisi bulunamadı!');

        // --- 🛡️ CEZALI OYUNCU KONTROLLERİ ---
        let cezalar = JSON.parse(fs.readFileSync('./cezalar.json', 'utf8'));

        let t1Oyuncular = [...takim1.oyuncular];
        let t2Oyuncular = [...takim2.oyuncular];

        t1Oyuncular = t1Oyuncular.filter(oyuncu => {
            if (cezalar[oyuncu] && cezalar[oyuncu].cezaliMi) {
                message.channel.send(`🚨 **${oyuncu}** cezalı olduğu için bu maçta kadrodan çıkarıldı! (Cezası şimdi bitti)`);
                delete cezalar[oyuncu];
                return false;
            }
            return true;
        });

        t2Oyuncular = t2Oyuncular.filter(oyuncu => {
            if (cezalar[oyuncu] && cezalar[oyuncu].cezaliMi) {
                message.channel.send(`🚨 **${oyuncu}** cezalı olduğu için bu maçta kadrodan çıkarıldı! (Cezası şimdi bitti)`);
                delete cezalar[oyuncu];
                return false;
            }
            return true;
        });

        fs.writeFileSync('./cezalar.json', JSON.stringify(cezalar, null, 4));

        // Maç Verisi Başlangıcı
        const guncelMac = {
            t1: takim1.isim,
            t2: takim2.isim,
            t1Oyuncular: t1Oyuncular,
            t2Oyuncular: t2Oyuncular,
            skor1: 0,
            skor2: 0,
            dakika: 0,
            topSahibiTakim: Math.random() > 0.5 ? "t1" : "t2",
            sahaBolgesi: "ORTASAHA",
            kartlar: {}, 
            goller: []
        };

        const baslangicEmbed = new EmbedBuilder()
            .setTitle('🏟️ DEV MAÇ BAŞLIYOR!')
            .setDescription(`⚽ **${takim1.isim}** vs **${takim2.isim}**\n\n🟢 Hakem düdüğünü çaldı ve maç başladı! Başarılar!`)
            .setColor('#3498db');
        
        message.channel.send({ embeds: [baslangicEmbed] });

        // --- 🔄 MAÇ DÖNGÜSÜ (15 SANİYEDE BİR ÇALIŞIR) ---
        const interval = setInterval(() => {
            guncelMac.dakika += Math.floor(Math.random() * 5) + 3; // Dakika her adımda 3-8 dk arası ilerler

            if (guncelMac.dakika >= 90) {
                clearInterval(interval);
                
                // Maç Bitti Embed
                const bitisEmbed = new EmbedBuilder()
                    .setTitle('🏁 MAÇ SONA ERDİ!')
                    .setDescription(`🏆 **Skor:** ${guncelMac.t1} **${guncelMac.skor1} - ${guncelMac.skor2}** ${guncelMac.t2}\n\n⚽ **Goller ve İstatistikler:**\n` + 
                        (guncelMac.goller.length > 0 
                            ? guncelMac.goller.map(g => `• Dakika ${g.dakika}': **${g.golcu}** (Asist: _${g.asistci}_)`).join('\n')
                            : "Maçta gol sesi çıkmadı."))
                    .setColor('#2c3e50');

                return message.channel.send({ embeds: [bitisEmbed] });
            }

            // Pozisyon bazlı parametreler
            const saldiranTakimKey = guncelMac.topSahibiTakim;
            const savunanTakimKey = saldiranTakimKey === "t1" ? "t2" : "t1";

            const saldiranKadro = saldiranTakimKey === "t1" ? guncelMac.t1Oyuncular : guncelMac.t2Oyuncular;
            const savunanKadro = savunanTakimKey === "t1" ? guncelMac.t1Oyuncular : guncelMac.t2Oyuncular;

            const t1Kaleci = "T1 Kalecisi";
            const t2Kaleci = "T2 Kalecisi";
            const rakipKaleci = saldiranTakimKey === "t1" ? t2Kaleci : t1Kaleci;

            // ==========================================
            // 🎲 OYUNCULAR HER POZİSYONDA TAMAMEN RANDOM SEÇİLİR!
            // ==========================================
            const mevcutOyuncu = saldiranKadro[Math.floor(Math.random() * saldiranKadro.length)];

            // Pas/asist alacak oyuncu (mevcut oyuncu hariç)
            const pasAlabilecekler = saldiranKadro.filter(p => p !== mevcutOyuncu);
            const pasAlacak = pasAlabilecekler.length > 0 
                ? pasAlabilecekler[Math.floor(Math.random() * pasAlabilecekler.length)] 
                : mevcutOyuncu;

            // Defans yapan takımdan rastgele bir oyuncu (Kart veya blok için)
            const savunanOyuncu = savunanKadro[Math.floor(Math.random() * savunanKadro.length)];

            let pozisyonMetni = "";
            const rastgeleAksiyon = Math.random();

            // --- 🟨 🟥 KART DURUMLARI (%12 Şans) ---
            const kartSansi = Math.random();
            if (kartSansi < 0.12 && savunanKadro.length > 1) {
                const kartGorenOyuncu = savunanOyuncu; // Rastgele seçilen savunan oyuncu kart görüyor

                if (!guncelMac.kartlar[kartGorenOyuncu]) {
                    guncelMac.kartlar[kartGorenOyuncu] = { sari: 0, kirmizi: false };
                }

                const kartTipi = Math.random() > 0.85 ? "kirmizi" : "sari";

                if (kartTipi === "sari") {
                    guncelMac.kartlar[kartGorenOyuncu].sari += 1;

                    if (guncelMac.kartlar[kartGorenOyuncu].sari === 1) {
                        pozisyonMetni = `🟨 **SARI KART!** [${guncelMac.dakika}'] **${kartGorenOyuncu}** yaptığı sert müdahale sonrası sarı kart gördü!`;
                    } else if (guncelMac.kartlar[kartGorenOyuncu].sari === 2) {
                        guncelMac.kartlar[kartGorenOyuncu].kirmizi = true;
                        
                        // Kadrodan silerek 10 kişi kalmasını sağlıyoruz
                        const oyuncuIndex = savunanKadro.indexOf(kartGorenOyuncu);
                        if (oyuncuIndex > -1) savunanKadro.splice(oyuncuIndex, 1);

                        pozisyonMetni = `🟨🟥 **ÇİFT SARIDAN KIRMIZI!** [${guncelMac.dakika}'] **${kartGorenOyuncu}** ikinci sarı kartını görerek oyundan atıldı! Takımı **10 kişi** kaldı!`;
                        
                        YazCezayi(kartGorenOyuncu, "İkinci Sarı Kart");
                    }
                } else {
                    guncelMac.kartlar[kartGorenOyuncu].kirmizi = true;

                    const oyuncuIndex = savunanKadro.indexOf(kartGorenOyuncu);
                    if (oyuncuIndex > -1) savunanKadro.splice(oyuncuIndex, 1);

                    pozisyonMetni = `🟥 **DOĞRUDAN KIRMIZI KART!** [${guncelMac.dakika}'] **${kartGorenOyuncu}** doğrudan kırmızı kartla oyundan atıldı! Takımı **10 kişi** kaldı!`;
                    
                    YazCezayi(kartGorenOyuncu, "Doğrudan Kırmızı Kart");
                }

            } else if (rastgeleAksiyon < 0.30) {
                // --- 👟 PAS SİSTEMİ (Kısa, Uzun, Ara Pas) ---
                const pasSansi = Math.random();
                if (pasSansi < 0.75) {
                    const pasMetinleri = [
                        `👟 **${mevcutOyuncu}** orta sahada kısa pasla topu **${pasAlacak}**'a aktardı.`,
                        `🚀 **${mevcutOyuncu}** savunmadan uzun bir pasla topu ileri uçtaki **${pasAlacak}** ile buluşturdu!`,
                        `⚡ **Müthiş ara pas!** **${mevcutOyuncu}** savunmanın arkasına nefis bir ara pası bıraktı, **${pasAlacak}** topla buluştu!`
                    ];
                    pozisyonMetni = pasMetinleri[Math.floor(Math.random() * pasMetinleri.length)];
                    guncelMac.sahaBolgesi = "FORVET";
                } else {
                    pozisyonMetni = `❌ **Pas Arası!** **${mevcutOyuncu}** pas atmak istedi ama savunmada **${savunanOyuncu}** araya girdi ve topu kaptı!`;
                    guncelMac.topSahibiTakim = savunanTakimKey; // Top rakibe geçti
                    guncelMac.sahaBolgesi = "DEFANS";
                }

            } else if (rastgeleAksiyon < 0.50) {
                // --- 🏃‍♂️ ÇALIM VE DEPAR ---
                const calimSansi = Math.random();
                if (calimSansi < 0.65) {
                    const calimMetinleri = [
                        `🏃‍♂️ **${mevcutOyuncu}** depar atarak çizgiden hızla sıyrıldı!`,
                        `⚡ **Harika çalım!** **${mevcutOyuncu}** şık bir vücut çalımıyla rakibini ekarte etti!`
                    ];
                    pozisyonMetni = calimMetinleri[Math.floor(Math.random() * calimMetinleri.length)];
                    guncelMac.sahaBolgesi = "FORVET";
                } else {
                    pozisyonMetni = `🛡️ **Top Kaybı!** **${mevcutOyuncu}** depar atmak isterken savunmada **${savunanOyuncu}** zamanında müdahale etti!`;
                    guncelMac.topSahibiTakim = savunanTakimKey;
                    guncelMac.sahaBolgesi = "ORTASAHA";
                }

            } else if (rastgeleAksiyon < 0.75) {
                // --- ⚽ ŞUT SİSTEMİ (GOL / ASİST) ---
                const sutSansi = Math.random();
                if (sutSansi < 0.25) {
                    pozisyonMetni = `🏃‍♂️ **Dışarı!** **${mevcutOyuncu}** kaleciyle karşı karşıya kaldı ama vuruşunda top doğrudan auta gitti!`;
                    guncelMac.topSahibiTakim = savunanTakimKey;
                    guncelMac.sahaBolgesi = "DEFANS";
                } else if (sutSansi < 0.55) {
                    if (saldiranTakimKey === "t1") guncelMac.skor1++; else guncelMac.skor2++;
                    const asistci = pasAlacak !== mevcutOyuncu ? pasAlacak : "Asist Yok";
                    
                    pozisyonMetni = `🥅 **GOOOL!** [${guncelMac.dakika}'] **${mevcutOyuncu}** karşı karşıya pozisyonda nefis vurdu ve topu ağlara yolladı! \n⚽ **Golü Atan:** ${mevcutOyuncu} | 🅰️ **Asist:** ${asistci}`;
                    
                    guncelMac.goller.push({ golcu: mevcutOyuncu, asistci: asistci, dakika: guncelMac.dakika });
                    guncelMac.topSahibiTakim = savunanTakimKey; // Santra için top rakibe geçer
                    guncelMac.sahaBolgesi = "ORTASAHA";
                } else if (sutSansi < 0.75) {
                    pozisyonMetni = `🧤 **Kurtarış!** **${mevcutOyuncu}** karşı karşıya sert vurdu ama kaleci **${rakipKaleci}** devleşti ve golü önledi!`;
                    guncelMac.topSahibiTakim = savunanTakimKey;
                    guncelMac.sahaBolgesi = "DEFANS";
                } else {
                    pozisyonMetni = `📐 **Direkten Döndü!** **${mevcutOyuncu}** vurdu, direğe çarpan top oyun alanına geri döndü! Savunma tehlikeyi uzaklaştırıyor!`;
                    if (Math.random() > 0.5) guncelMac.topSahibiTakim = savunanTakimKey;
                    guncelMac.sahaBolgesi = "ORTASAHA";
                }

            } else {
                // --- 🔀 FAUL / SERBEST VURUŞ ---
                const faulSansi = Math.random();
                if (faulSansi < 0.30) {
                    if (saldiranTakimKey === "t1") guncelMac.skor1++; else guncelMac.skor2++;
                    pozisyonMetni = `🥅 **GOOOL!** [${guncelMac.dakika}'] **${mevcutOyuncu}** serbest vuruştan harika bir plaseyle barajın üstünden topu doksana yolladı!`;
                    
                    guncelMac.goller.push({ golcu: mevcutOyuncu, asistci: "Asist Yok (Frikik)", dakika: guncelMac.dakika });
                    guncelMac.topSahibiTakim = savunanTakimKey;
                    guncelMac.sahaBolgesi = "ORTASAHA";
                } else {
                    pozisyonMetni = `❌ **Serbest vuruş kaçtı!** **${mevcutOyuncu}** frikikten kaleyi denedi ama top barajdan sekerek dışarı çıktı.`;
                    guncelMac.topSahibiTakim = savunanTakimKey;
                    guncelMac.sahaBolgesi = "DEFANS";
                }
            }

            // Her 15 saniyede bir yeni mesaj olarak kanala atılan embed:
            const anlikEmbed = new EmbedBuilder()
                .setTitle(`🕒 Dakika: ${guncelMac.dakika}'`)
                .setDescription(pozisyonMetni)
                .setFooter({ text: `Bölge: ${guncelMac.sahaBolgesi} | Skor: ${guncelMac.skor1} - ${guncelMac.skor2}` })
                .setColor('#f39c12');

            message.channel.send({ embeds: [anlikEmbed] });

        }, 15000); // Maç aksiyon süresi: Tam olarak 15 saniye!
    }
});

// --- CEZA KAYDETME YARDIMCI FONKSİYONU ---
function YazCezayi(oyuncuIsmi, sebep) {
    let cezalar = {};
    if (fs.existsSync('./cezalar.json')) {
        try { cezalar = JSON.parse(fs.readFileSync('./cezalar.json', 'utf8')); } catch (e) { cezalar = {}; }
    }
    cezalar[oyuncuIsmi] = { cezaliMi: true, sebep: sebep };
    fs.writeFileSync('./cezalar.json', JSON.stringify(cezalar, null, 4));
}


client.login(process.env.DISCORD_TOKEN);

