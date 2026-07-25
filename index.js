const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const KURUCU_ROL = "1522274570986586172";
const TD_ROL = "<@&1522696820751601685>";
constBASKAN_ROL = "<@&1522697217264062656>";

const takimlar = new Map(); // Takım Adı -> { sahip, ad, oyuncular: [], td, baskan, dizilis }
const maclar = new Map();

client.on('ready', () => {
    console.log(`Bot aktif: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('.')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const komut = args.shift().toLowerCase();

    // .yardim komutu
    if (komut === 'yardim' || komut === 'yardım') {
        const embed = new EmbedBuilder()
            .setTitle("🛠️ Futbol Ligi Botu - Yardım & Komutlar")
            .setDescription("Aşağıdaki komutları kullanarak ligi, takımları ve maçları yönetebilirsiniz.")
            .setColor("Blue")
            .addFields(
                {
                    name: "👑 Kurucu & Yetkili Komutları",
                    value: "`.takimkur @kullanici TakımAdı` - Yeni takım kurar.\n`.takimsil @kullanici TakımAdı` - Takımı siler.\n`.macbaslat Takım1 vs Takım2` - Maçı başlatır.\n`.macdurdur` - Maçı durdurur.\n`.macterkarbaslat` - Maçı devam ettirir."
                },
                {
                    name: "📋 Genel & Kadro Komutları",
                    value: "`.takimlist` - Kayıtlı tüm takımları listeler.\n`.kadro TakımAdı` - Belirtilen takımın kadrosunu, TD'sini, Başkanını ve oyuncularını gösterir.\n`.oyuncual @kullanici Takım Mevki İlk11/Yedek` - Takıma oyuncu ekler (Transfer).\n`.oyuncucikar @kullanici TakımAdı` - Oyuncuyu kadrodan çıkarır.\n`.dizilisdegistir 4-3-3` - Takım dizilişini günceller."
                }
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    // .takimkur @kullanci Beşiktaş
    if (komut === 'takimkur') {
        if (!message.member.roles.cache.has(KURUCU_ROL)) {
            return message.reply("Bu komutu sadece Kurucu kişi kullanabilir!");
        }
        const hedefUser = message.mentions.users.first();
        const takimAdi = args.slice(1).join(' ');

        if (!hedefUser || !takimAdi) return message.reply("Kullanım: `.takimkur @kullanıcı TakımAdı`");

        takimlar.set(takimAdi.toLowerCase(), {
            sahip: hedefUser.id,
            ad: takimAdi,
            oyuncular: [],
            teknikDirektor: "<@&1522696820751601685>",
            baskan: "<@&1522697217264062656>",
            dizilis: "4-3-3"
        });

        return message.reply(`✅ **${takimAdi}** başarıyla kuruldu! Sahibi: <@${hedefUser.id}>\n📌 Teknik Direktör: <@&1522696820751601685> | Başkan: <@&1522697217264062656>`);
    }

    // .takimsil @kullanci Beşiktaş
    if (komut === 'takimsil') {
        if (!message.member.roles.cache.has(KURUCU_ROL)) {
            return message.reply("Bu komutu sadece Kurucu kişi kullanabilir!");
        }
        const takimAdi = args.slice(1).join(' ');
        if (!takimlar.has(takimAdi.toLowerCase())) return message.reply("Böyle bir takım bulunamadı!");

        takimlar.delete(takimAdi.toLowerCase());
        return message.reply(`🗑️ **${takimAdi}** silindi.`);
    }

    // .takimlist
    if (komut === 'takimlist') {
        if (takimlar.size === 0) return message.reply("Kayıtlı takım bulunmuyor.");
        
        let liste = "";
        takimlar.forEach((t) => {
            liste += `⚽ **${t.ad}** - Kurucu/Sahip: <@${t.sahip}>\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle("🏆 Kayıtlı Takımlar")
            .setDescription(liste)
            .setColor("Gold");

        return message.reply({ embeds: [embed] });
    }

    // .Kadro Beşiktaş
    if (komut === 'kadro') {
        const takimAdi = args.join(' ').toLowerCase();
        const takim = takimlar.get(takimAdi);

        if (!takim) return message.reply("Böyle bir takım bulunamadı! Kullanım: `.Kadro Beşiktaş`");

        const embed = new EmbedBuilder()
            .setTitle(`📌 ${takim.ad} Kadrosu`)
            .addFields(
                { name: "👔 Yönetim", value: `Teknik Direktör: ${takim.teknikDirektor}\nBaşkan: ${takim.baskan}` },
                { name: "📋 Diziliş", value: `\`${takim.dizilis}\``, inline: true },
                { name: "👥 Oyuncular & Mevkiler", value: takim.oyuncular.length > 0 ? takim.oyuncular.join('\n') : "Henüz oyuncu eklenmemiş." }
            )
            .setColor("Blue");

        return message.reply({ embeds: [embed] });
    }

    // .oyuncual @kullanci Beşiktaş Mevki İlk11/yedek (Transfer / Oyuncu Ekleme)
    if (komut === 'oyuncual') {
        const hedefUser = message.mentions.users.first();
        const takimAdi = args[1];
        const mevki = args[2];
        const durum = args[3] || "İlk 11";

        if (!hedefUser || !takimAdi || !mevki) return message.reply("Kullanım: `.oyuncual @kullanıcı TakımAdı Mevki İlk11/Yedek`");
        
        const takim = takimlar.get(takimAdi.toLowerCase());
        if (!takim) return message.reply("Belirtilen isimde bir takım bulunamadı!");

        takim.oyuncular.push(`<@${hedefUser.id}> - **${mevki}** (${durum})`);
        return message.reply(`✅ <@${hedefUser.id}>, **${takim.ad}** takımına **${mevki}** mevkiinde (${durum}) transfer edildi!`);
    }

    // .oyuncucikar @kullanci Beşiktaş
    if (komut === 'oyuncucikar') {
        const hedefUser = message.mentions.users.first();
        const takimAdi = args.slice(1).join(' ');
        
        if (!hedefUser || !takimAdi) return message.reply("Kullanım: `.oyuncucikar @kullanıcı TakımAdı`");

        const takim = takimlar.get(takimAdi.toLowerCase());
        if (!takim) return message.reply("Takım bulunamadı.");
        
        const oncekiBoyut = takim.oyuncular.length;
        takim.oyuncular = takim.oyuncular.filter(o => !o.includes(hedefUser.id));

        if(takim.oyuncular.length === oncekiBoyut) {
            return message.reply("Bu kullanıcı bu takımın kadrosunda bulunamadı.");
        }

        return message.reply(`❌ Oyuncu <@${hedefUser.id}>, **${takim.ad}** kadrosundan çıkarıldı.`);
    }

    // .dizilisdegistir 4-3-3
    if (komut === 'dizilisdegistir') {
        const dizilis = args[0];
        if (!dizilis) return message.reply("Lütfen bir diziliş belirtin (Örn: `4-3-3` veya `4-4-2`)");
        return message.reply(`📋 Takım dizilişi **${dizilis}** olarak güncellendi.`);
    }

    // .macbaslat Beşiktaş vs Fenerbahçe
    if (komut === 'macbaslat') {
        if (!message.member.roles.cache.has(KURUCU_ROL)) {
            return message.reply("Bu maç sadece kurucu veya yetkili kişiler tarafından başlatılabilir!");
        }

        const macMetni = args.join(' ');
        if (!macMetni.includes('vs')) return message.reply("Kullanım: `.macbaslat Takim1 vs Takim2`");

        const [t1, t2] = macMetni.split('vs').map(s => s.trim());
        
        const embed = new EmbedBuilder()
            .setTitle("⚽ Maç Başladı!")
            .setDescription(`**${t1}** vs **${t2}** karşılaşması hakem düdüğüyle başladı!\n\nDakika: ` + "`0'`")
            .setColor("Green");

        const msg = await message.channel.send({ embeds: [embed] });
        maclar.set(msg.id, { t1, t2, dakika: 0 });

        setTimeout(async () => {
            const golEden = "Ahmet (NPC)";
            const asistEden = "Mehmet (NPC)";
            
            const ozetEmbed = new EmbedBuilder()
                .setTitle("📢 Maç Özeti & Gelişme")
                .setDescription(`⚽ **GOL!** Dakika **24'**\nGol Atan: **${golEden}**\nAsist: **${asistEden}**\n\n📌 *Ceza sahası içinde 1v1 kaldı! Kaleci vs Oyuncu etkileşimi gerçekleşti.*`)
                .setColor("Orange");

            await message.channel.send({ embeds: [ozetEmbed] });
        }, 5000);
    }

    // .macdurdur
    if (komut === 'macdurdur') {
        return message.reply("⏸️ Maç durduruldu.");
    }
    
    // .macterkarbaslat
    if (komut === 'macterkarbaslat') {
        return message.reply("▶️ Maç kaldığı yerden devam ediyor.");
    }
});

client.login(process.env.TOKEN);

