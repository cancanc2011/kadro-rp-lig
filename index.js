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

// Veritabanı simülasyonları
const antrenmanDurumu = new Map(); 
const cooldowns = new Map(); 

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
                { name: '🏟️ Maç Sistemi', value: '`.macbaslat Fener vs Cimbom` (Sadece Maç Yetkilisi başlatabilir)', inline: false },
                { name: '🏃‍♂️ Eğlence', value: '`.ant` | `.pen`', inline: false }
            ).setColor('#3498db');
        return message.reply({ embeds: [embed] });
    }

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;

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
            kurucuId: hedef.id,
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
        message.reply(`📋 **Kurulan Takımlar ve Sahipleri:**\n${liste}`);
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
    // ⚽ 25 DAKİKALIK GERÇEK ZAMANLI MAÇ SİSTEMİ
    // ==========================================

    // --- .macbaslat <Takım1> vs <Takım2> ---
    if (command === 'macbaslat') {
        if (!message.member.roles.cache.has(TAKIM_YETKILI)) {
            return message.reply('Maçı sadece <@&1522699609506316338> başlatabilir.');
        }
        
        const yazi = args.join(' ');
        const bol = yazi.split(/vs/i);
        if (bol.length < 2) return message.reply('Kullanım: `.macbaslat Fenerbahçe vs Galatasaray`');

        const t1Isim = bol[0].trim();
        const t2Isim = bol[1].trim();

        const takim1 = takimlar.get(t1Isim.toLowerCase());
        const takim2 = takimlar.get(t2Isim.toLowerCase());

        if (!takim1 || !takim2) return message.reply('Maçı başlatmak için iki takımın da kurulmuş olması gerekir!');

        const embed = new EmbedBuilder()
            .setTitle('🏟️ DEV DERBİ BAŞLIYOR!')
            .setDescription(`**${takim1.isim}** vs **${takim2.isim}**\n\nMaç birazdan gerçek zamanlı (25 dakika) olarak başlayacak!`)
            .setColor('#e74c3c');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`ilkYari_15_${message.channel.id}`).setLabel('⏱️ İlk Yarıyı Başlat (15 Dk)').setStyle(ButtonStyle.Danger)
        );

        aktifMaclar.set(message.channel.id, {
            t1: takim1.isim,
            t2: takim2.isim,
            skor1: 0,
            skor2: 0,
            dakika: 0,
            durum: 'bekliyor'
        });

        message.reply({ embeds: [embed], components: [row] });
    }

    // --- .ant Komutu ---
    if (command === 'ant') {
        const simdi = Date.now();
        const cd = cooldowns.get(`${userId}-ant`) || 0;
        if (simdi < cd) return message.reply('⏱️ Beklemelisin.');
        let mevcutSkor = antrenmanDurumu.get(userId) || 0;
        mevcutSkor += 1;
        if (mevcutSkor >= 10) { antrenmanDurumu.set(userId, 0); message.reply("🏋️ **10/10 Sıfırlandı!**"); } 
        else { antrenmanDurumu.set(userId, mevcutSkor); message.reply(`🏋️ Gelişim: **${mevcutSkor}/10**`); }
        cooldowns.set(`${userId}-ant`, simdi + (60 * 60 * 1000));
    }

    // --- .pen Komutu ---
    if (command === 'pen') {
        const sonuclar = ["🧤 **Kurtarış!**", "🛡️ **Defans!**", "⚽ **GOOOL!**", "📐 **Direkt!**", "🏃‍♂️ **Dışarı!**"];
        message.reply(sonuclar[Math.floor(Math.random() * sonuclar.length)]);
    }
});

// ==========================================
// 🎛️ BUTTON INTERACTION YÖNETİMİ
// ==========================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const [islem, veri1, veri2, veri3] = interaction.customId.split('_');

    // Oyuncu Ekleme Etkileşimleri
    if (islem === 'ilk11' || islem === 'yedek') {
        const takim = takimlar.get(veri1);
        if (!takim) return interaction.reply({ content: 'Takım verisi kayboldu.', ephemeral: true });

        const oyuncuVeri = { id: veri2, mevki: veri3 };

        if (islem === 'ilk11') {
            takim.ilk11.push(oyuncuVeri);
            await interaction.update({ content: `✅ <@${veri2}> oyuncusu [${veri3}] mevkisiyle **${takim.isim}** takımının **İlk 11** kadrosuna eklendi!`, components: [] });
        } else {
            takim.yedekler.push(oyuncuVeri);
            await interaction.update({ content: `✅ <@${veri2}> oyuncusu [${veri3}] mevkisiyle **${takim.isim}** takımının **Yedekler** kadrosuna eklendi!`, components: [] });
        }
    }

    // Canlı Maç Başlatma Etkileşimi
    if (islem === 'ilkYari') {
        const mac = aktifMaclar.get(veri2);
        if (!mac || mac.durum !== 'bekliyor') return interaction.reply({ content: 'Bu maç zaten başlamış veya iptal edilmiş.', ephemeral: true });

        mac.durum = 'oyun-ici';
        await interaction.update({ content: '⚽ İlk yarı başladı! Her 60 saniyede bir yeni pozisyon gelecek (Toplam 25 dakika sürer).', components: [] });

        const pozisyonlar = [
            "⚽ **GOOOL!** Harika bir şut ve top ağlarda!",
            "🏃‍♂️ **Dışarı!** Top az farkla auta çıkıyor.",
            "📐 **Direkt!** Top direkte patladı!",
            "🧤 **Kaleci!** Kaleci son anda topu kornere çeldi.",
            "🛡️ **Defense!** Savunma son anda araya girdi ve tehlikeyi önledi.",
            "🚩 **Korner!** Paslaşarak kullanılan korner savunmadan döndü.",
            "🥅 **Aut!** Karşı takım oyunu aut atışıyla başlatıyor.",
            "🏳️ **Tac!** Top taç çizgisine çıktı.",
            "🎯 **Penalti!** Hakem beyaz noktayı gösterdi!",
            "⚠️ **Faul!** Sert müdahale sonrası oyun durdu.",
            "🩹 **Yerden kalk!** Sakatlanan oyuncu tedavi sonrası yerden kalktı.",
            "🟥 **Kırmızı Kart!** Hakem cebinden kırmızı kart çıkardı!",
            "🟨 **Sarı Kart!** Hakem sert faule sarı kart gösterdi."
        ];

        const macInterval = setInterval(async () => {
            mac.dakika += 1;
            
            const olay = pozisyonlar[Math.floor(Math.random() * pozisyonlar.length)];
            
            if (olay.includes("GOOOL")) {
                if (Math.random() > 0.5) mac.skor1 += 1;
                else mac.skor2 += 1;
            }

            const pozisyonEmbed = new EmbedBuilder()
                .setTitle(`📊 MAÇ DEVAM EDİYOR | Dakika: ${mac.dakika}'`)
                .setDescription(`🏟️ **${mac.t1} ${mac.skor1} - ${mac.skor2} ${mac.t2}**\n\n**Gelişen Pozisyon:**\n${olay}`)
                .setColor('#34495e');

            const channel = client.channels.cache.get(veri2);
            if (channel) channel.send({ embeds: [pozisyonEmbed] });

            if (mac.dakika >= 25) {
                clearInterval(macInterval);
                const bitisEmbed = new EmbedBuilder()
                    .setTitle('🏁 MAÇ BİTTİ / MAÇ SONUCU')
                    .setDescription(`🏆 **${mac.t1} ${mac.skor1} - ${mac.skor2} ${mac.t2}**\n\n90 Dakikalık harika simülasyon tamamlandı! Katılan tüm takımlara teşekkürler.`)
                    .setColor('#2ecc71');
                if (channel) channel.send({ embeds: [bitisEmbed] });
                aktifMaclar.delete(veri2);
            }

        }, 60000); 
    }
});

client.login(process.env.TOKEN);
