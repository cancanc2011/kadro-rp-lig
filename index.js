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

// --- VERİ YAPILARI ---
const takimlar = new Map(); 
const aktifMaclar = new Map(); 

client.once('ready', () => {
    console.log(`${client.user.tag} aktif!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // --- 📚 Yardım Komutu ---
    if (message.content.trim().toLowerCase() === '-yardim' || message.content.trim().toLowerCase() === '-yardım') {
        const embed = new EmbedBuilder()
            .setTitle('📚 SUNUCU SİSTEM REHBERİ')
            .setDescription(`Merhaba **${message.author.username}**, sunucudaki tüm aktif komutlar aşağıda listelenmiştir:`)
            .addFields(
                { name: '⚽ Takım & Kadro Komutları', value: '`.takimkur @kisi Fener` | `.takimlist` | `.takimsil Fener` | `.oyuncual Osimhen Beşiktaş SNT` | `.oyuncucikar @kisi Fener` | `.kadro Fener` | `.taktik Fener 4-3-3 Ofansif`', inline: false },
                { name: '🏟️ Maç Sistemi', value: '`.macbaslat Fener vs Cimbom` | `.macdurdur Fener vs Cimbom` (Sadece Maç Yetkilisi)', inline: false }
            ).setColor('#3498db');
        return message.reply({ embeds: [embed] });
    }

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ==========================================
    // 📊 TAKIM, KADRO VE TAKTİK YÖNETİMİ
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
            kurucuId: hedef.id,
            taktik: '4-4-2 Standart',
            ilk11: [],
            yedekler: []
        });
        message.reply(`✅ **${takimAdi}** takımı kuruldu! Sahibi: ${hedef}`);
    }

    // --- .taktik <Takım Adı> <Diziliş ve Taktik> ---
    if (command === 'taktik') {
        const takimAdi = args[0];
        const taktikYazisi = args.slice(1).join(' ');

        if (!takimAdi || !taktikYazisi) return message.reply('Kullanım: `.taktik Beşiktaş 4-3-3 Ofansif`');
        
        const takim = takimlar.get(takimAdi.toLowerCase());
        if (!takim) return message.reply('Böyle bir takım bulunamadı.');

        takim.taktik = taktikYazisi;
        message.reply(`⚙️ **${takim.isim}** takımının yeni diziliş ve taktiği: **${taktikYazisi}** olarak ayarlandı!`);
    }

    // --- .takimlist (Kaliteli Embed) ---
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

    // --- .oyuncual <İsim/Etiket> <Takım Adı> <Mevki> ---
    if (command === 'oyuncual') {
        if (!message.member.roles.cache.has(TRANSFER_YETKILI_1) && !message.member.roles.cache.has(TRANSFER_YETKILI_2)) {
            return message.reply('Bu komutu sadece transfer yetkilileri kullanabilir.');
        }
        
        let oyuncuAdı = args[0];
        const takimAdi = args[1];
        const mevki = args[2];

        if (!oyuncuAdı || !takimAdi || !mevki) {
            return message.reply('Kullanım: `.oyuncual Osimhen Beşiktaş SNT` veya `.oyuncual @kullanici Beşiktaş SNT`');
        }

        const takim = takimlar.get(takimAdi.toLowerCase());
        if (!takim) return message.reply('Böyle bir takım bulunamadı.');

        if (message.mentions.users.first()) {
            oyuncuAdı = `<@${message.mentions.users.first().id}>`;
        }

        if (takim.ilk11.length >= 11) {
            takim.yedekler.push({ isim: oyuncuAdı, mevki: mevki.toUpperCase() });
            return message.reply(`⚠️ **${takim.isim}** takımının İlk 11 kadrosu dolu (**11/11**)! **${oyuncuAdı}** [${mevki.toUpperCase()}] otomatik olarak **Yedekler** kadrosuna eklendi.`);
        }

        takim.ilk11.push({ isim: oyuncuAdı, mevki: mevki.toUpperCase() });
        message.reply(`✅ **${oyuncuAdı}** [${mevki.toUpperCase()}] oyuncusu **${takim.isim}** takımının **İlk 11** kadrosuna başarıyla eklendi!`);
    }

    // --- .oyuncucikar <@kullanici/İsim> <Takım Adı> ---
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

    // --- .kadro <Takım Adı> ---
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

    // ==========================================
    // ⚽ MAÇ MOTORU SİSTEMİ (40 SANİYE TEMPOLU)
    // ==========================================

    // --- .macbaslat <Takım1> vs <Takım2> ---
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
            .setTitle('🏟️ BÜYÜK MAÇ BAŞLIYOR!')
            .setDescription(`⚽ **${takim1.isim}** [${takim1.taktik}] **vs** **${takim2.isim}** [${takim2.taktik}]\n\nButona basıldığı an ilk pozisyon ekrana düşer ve **40 saniyede bir** canlı anlatım başlar!`)
            .setColor('#e74c3c');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`baslat_${t1Isim}_${t2Isim}_${message.channel.id}`).setLabel('🚀 Maçı Başlat').setStyle(ButtonStyle.Danger)
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
            intervalId: null,
            kanalId: message.channel.id
        });

        message.reply({ embeds: [embed], components: [row] });
    }

    // --- .macdurdur <Takım1> vs <Takım2> ---
    if (command === 'macdurdur') {
        if (!message.member.roles.cache.has(TAKIM_YETKILI)) {
            return message.reply('Maçı sadece maç yetkilileri durdurabilir.');
        }

        const yazi = args.join(' ');
        const bol = yazi.split(/vs/i);
        if (bol.length < 2) return message.reply('Kullanım: `.macdurdur Deneme1 vs Deneme2`');

        const t1Isim = bol[0].trim().toLowerCase();
        const t2Isim = bol[1].trim().toLowerCase();
        const hedefMacKey = `${t1Isim}_${t2Isim}`;

        let bulunanMacId = null;
        let bulunanMac = null;

        aktifMaclar.forEach((mac, id) => {
            if (mac.key === hedefMacKey) {
                bulunanMacId = id;
                bulunanMac = mac;
            }
        });

        if (!bulunanMac) return message.reply('⚠️ Belirtilen takımlar arasında oynanan aktif bir maç bulunamadı.');

        if (bulunanMac.intervalId) clearInterval(bulunanMac.intervalId);
        aktifMaclar.delete(bulunanMacId);

        message.reply(`🛑 **${bulunanMac.t1} vs ${bulunanMac.t2}** maçı yetkili kararıyla tamamen **iptal edildi ve durduruldu!**`);
    }
});

// ==========================================
// 🎛️ ETKİLEŞİM VE CANLI SİMÜLASYON MOTORU
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
        if (!mac) return interaction.reply({ content: 'Maç verisi bulunamadı veya süresi doldu.', ephemeral: true });

        await interaction.update({ content: '⚽ Hakem düdüğü çaldı, takımlar sahada! Maç başladı!', components: [] });

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

            guncelMac.dakika += 4;

            const atakYapan = Math.random() > 0.5 ? "t1" : "t2";
            const savunma = atakYapan === "t1" ? "t2" : "t1";

            const aKey = atakYapan === "t1" ? guncelMac.t1Key : guncelMac.t2Key;
            const sKey = savunma === "t1" ? guncelMac.t1Key : guncelMac.t2Key;

            const tkAtak = takimlar.get(aKey);

            const pasor = oyuncuSec(aKey, `**${atakYapan === "t1" ? guncelMac.t1 : guncelMac.t2} Orta Sahası**`);
            const hucumcu = oyuncuSec(aKey, `**${atakYapan === "t1" ? guncelMac.t1 : guncelMac.t2} Forveti**`);
            const defans = oyuncuSec(sKey, `**${savunma === "t1" ? guncelMac.t1 : guncelMac.t2} Defansı**`);

            const aksiyonlar = [
                { tip: "KISA_PAS", metin: `🏃‍♂️ ${pasor} orta alanda harika bir **Kısa Pas** çıkarttı, topu alan ${hucumcu} ileri fırladı!`, topKimde: hucumcu },
                { tip: "UZUN_PAS", metin: `🚀 Savunmadan ileriye doğru **Uzun Pas**! ${pasor} topu doğrudan ${hucumcu} indirdi.`, topKimde: hucumcu },
                { tip: "ARA_PAS", metin: `🎯 Harika vizyon! ${pasor} defansın arkasına milimetrik bir **Ara Pas** yolladı, ${hucumcu} karşı karşıya!`, topKimde: hucumcu },
                { tip: "KISA_ARA_PAS", metin: `⚡ Ceza sahası kalabalık! ${pasor} şık bir **Kısa Ara Pas** ile ${hucumcu} buluşturdu.`, topKimde: hucumcu },
                { tip: "UZUN_ARA_PAS", metin: `📐 Muazzam bir kontra atak! ${pasor} kendi sahasından harika bir **Uzun Ara Pas** attı, ${hucumcu} kaleye koşuyor!`, topKimde: hucumcu },
                { tip: "KALECI_PAS", metin: `🧤 Kaleci kalesinde güven veriyor. ${defans} geriye döndü, **Kaleci Pası** ile oyun yeniden kuruluyor.`, topKimde: defans },
                { tip: "SUT", metin: `💥 ${hucumcu} ceza sahası dışından sert bir **ŞUT** çekti! Kaleci son anda topu tokatladı!`, topKimde: "Rakip Kalecide" },
                { tip: "HATA", metin: `⚠️ **HATA GELDİ!** ${pasor} baskı altındayken hatalı bir pas attı, savunmada ${defans} topu kaparak tehlikeyi büyümeden önledi!`, topKimde: defans },
                { tip: "DISARI", metin: `❌ ${pasor} uzun oynamak istedi fakat top doğrudan taca, yani **Dışarı Çıktı!**`, topKimde: "Top Oyun Dışında" },
                { 
                    tip: "GOL", 
                    metin: `⚽ **GOOOL!** ${pasor} harika taşıdı, içeri bıraktı ve **Asist** yaptı! Gelen topa gelişine muhteşem vuran ${hucumcu} topu ağlara yolladı!`, 
                    asist: pasor, 
                    golcu: hucumcu,
                    topKimde: "Top Ağlarda! (Santra)"
                },
                { tip: "DEGISIKLIK", metin: `🔄 **Oyuncu Değişikliği!** ${atakYapan === "t1" ? guncelMac.t1 : guncelMac.t2} takımında teknik direktör taktiksel bir hamle yapıyor!`, topKimde: pasor }
            ];

            let secilenAksiyon = aksiyonlar[Math.floor(Math.random() * aksiyonlar.length)];

            if (secilenAksiyon.tip === "DEGISIKLIK" && tkAtak && tkAtak.yedekler.length > 0 && tkAtak.ilk11.length > 0) {
                const rIndexIlk11 = Math.floor(Math.random() * tkAtak.ilk11.length);
                const rIndexYedek = Math.floor(Math.random() * tkAtak.yedekler.length);

                const cikanOyuncu = tkAtak.ilk11[rIndexIlk11];
                const girenOyuncu = tkAtak.yedekler[rIndexYedek];

                tkAtak.ilk11[rIndexIlk11] = girenOyuncu;
                tkAtak.yedekler[rIndexYedek] = cikanOyuncu;

                secilenAksiyon.metin = `🔄 **OYUNCU DEĞİŞİKLİĞİ!** **${tkAtak.isim}** takımında kenara tabela kalktı.\n🔻 Çıkan Oyuncu: **${cikanOyuncu.isim}** [${cikanOyuncu.mevki}]\n🔺 Giren Oyuncu: **${girenOyuncu.isim}** [${girenOyuncu.mevki}]`;
                secilenAksiyon.topKimde = girenOyuncu.isim;
            }

            if (secilenAksiyon.tip === "GOL") {
                if (atakYapan === "t1") guncelMac.skor1 += 1;
                else guncelMac.skor2 += 1;
            }

            const pozisyonEmbed = new EmbedBuilder()
                .setTitle(`📊 CANLI ANLATIM | Dakika: ${guncelMac.dakika}'`)
                .setDescription(
                    `🏟️ **Skor:** **${guncelMac.t1} ${guncelMac.skor1} - ${guncelMac.skor2} ${guncelMac.t2}**\n\n` +
                    `🎙️ **Spiker:** ${secilenAksiyon.metin}\n\n` +
                    `🏃‍♂️ **Topu Kimde:** ${secilenAksiyon.topKimde}`
                )
                .setColor(atakYapan === "t1" ? '#3498db' : '#e67e22');

            if (secilenAksiyon.tip === "GOL") {
                pozisyonEmbed.addFields({ name: '🎯 Gol Raporu', value: `⚽ Golü Atan: ${secilenAksiyon.golcu}\n👟 Asist: ${secilenAksiyon.asist}` });
            }

            if (channel) channel.send({ embeds: [pozisyonEmbed] });

            if (guncelMac.dakika >= 90) {
                const bitisEmbed = new EmbedBuilder()
                    .setTitle('🏁 MAÇ SONUCU / HAKEM MAÇI BİTİRDİ')
                    .setDescription(`🏆 **Maç Skoru:** **${guncelMac.t1} ${guncelMac.skor1} - ${guncelMac.skor2} ${guncelMac.t2}**\n\n40 saniyelik nefes kesici futbol resitali sona erdi!`)
                    .setColor('#2ecc71');
                if (channel) channel.send({ embeds: [bitisEmbed] });
                aktifMaclar.delete(fullKey);
                return false;
            }
            return true;
        };

        const devamEdiyor = pozisyonOynat();

        if (devamEdiyor) {
            const interval = setInterval(() => {
                const d = pozisyonOynat();
                if (!d) clearInterval(interval);
            }, 40000);

            mac.intervalId = interval;
        }
    }
});

client.login(process.env.TOKEN);
            
