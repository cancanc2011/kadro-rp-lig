const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

let oyun = {
    aktif: false,
    lobi: [],
    roller: {}, 
    yasayanlar: [],
    asama: 'lobi', 
    vampirSecimi: null,
    doktorSecimi: null,
    serifSecimi: null, 
    serifAtesEtti: false,
    kanalId: null
};

client.on('ready', () => {
    console.log(`👑 PREMIUM VK BOTU AKTİF: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('.')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    // ❌ .iptaloyun - Sadece kuran veya Yönetici
    if (cmd === 'iptaloyun') {
        if (!oyun.aktif) return message.reply("❌ Zaten aktif bir oyun yok!");
        
        const yetkiliMi = message.member.permissions.has('Administrator');
        const baslatanMi = message.author.id === oyun.lobi[0];

        if (!baslatanMi && !yetkiliMi) {
            return message.reply(`❌ Bu oyunu sadece kurucusu (<@${oyun.lobi[0]}>) veya bir Yönetici iptal edebilir!`);
        }
        
        oyun = { aktif: false, lobi: [], roller: {}, yasayanlar: [], asama: 'lobi', vampirSecimi: null, doktorSecimi: null, serifSecimi: null, serifAtesEtti: false, kanalId: null };
        return message.reply("🛑 **Oyun iptal edildi ve hafıza temizlendi!**");
    }

    // 🚪 .vk / .vampirköylü
    if (cmd === 'vampirköylü' || cmd === 'vk') {
        if (oyun.aktif) return message.reply("❌ Zaten devam eden bir oyun var!");
        oyun.aktif = true;
        oyun.lobi = [message.author.id];
        oyun.kanalId = message.channel.id;
        oyun.asama = 'lobi';

        const embed = new EmbedBuilder()
            .setTitle("🐺 Vampir Köylü - Yeni Kasaba Kuruluyor")
            .setDescription(`🎭 **Oyun Kurucu:** <@${message.author.id}>\n\nSinsi gecelere adım atmak için aşağıdaki **Katıl** butonuna tıklayın.\n\n👤 **Katılanlar (1/10):**\n<@${message.author.id}>`)
            .setColor(0x5c0000)
            .setFooter({ text: 'Minimum 3 oyuncu gereklidir.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('vk_katil').setLabel('🚪 Katıl').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('vk_ayril').setLabel('🚶 Ayrıl').setStyle(ButtonStyle.Secondary)
        );

        const lobiMesaj = await message.channel.send({ embeds: [embed], components: [row] });
        const collector = lobiMesaj.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'vk_katil') {
                if (oyun.lobi.length >= 10) return interaction.reply({ content: "❌ Kasaba tamamen dolu! (Max 10)", ephemeral: true });
                if (oyun.lobi.includes(interaction.user.id)) return interaction.reply({ content: "Zaten lobidesin kanka!", ephemeral: true });
                
                oyun.lobi.push(interaction.user.id);
                embed.setDescription(`🎭 **Oyun Kurucu:** <@${oyun.lobi[0]}>\n\nSinsi gecelere adım atmak için aşağıdaki **Katıl** butonuna tıklayın.\n\n👤 **Katılanlar (${oyun.lobi.length}/10):**\n${oyun.lobi.map(id => `<@${id}>`).join('\n')}`);
                await interaction.update({ embeds: [embed] });
            }
            if (interaction.customId === 'vk_ayril') {
                if (!oyun.lobi.includes(interaction.user.id)) return interaction.reply({ content: "Zaten lobide değilsin.", ephemeral: true });
                if (interaction.user.id === oyun.lobi[0]) return interaction.reply({ content: "Kurucu lobiye liderlik etmeli! Oyunu kapatmak için `.iptaloyun` yazabilirsin.", ephemeral: true });
                
                oyun.lobi = oyun.lobi.filter(id => id !== interaction.user.id);
                embed.setDescription(`🎭 **Oyun Kurucu:** <@${oyun.lobi[0]}>\n\n**Katılanlar (${oyun.lobi.length}/10):**\n${oyun.lobi.map(id => `<@${id}>`).join('\n')}`);
                await interaction.update({ embeds: [embed] });
            }
        });
    }

    // 🎮 .başlat
    if (cmd === 'başlat' || cmd === 'baslat') {
        if (!oyun.aktif || oyun.asama !== 'lobi') return message.reply("❌ Ortada başlatılacak bir lobi yok kanka! Önce `.vk` yaz.");
        if (message.author.id !== oyun.lobi[0]) return message.reply("❌ Bu kasabayı sadece oyunu kuran lider başlatabilir!");
        if (oyun.lobi.length < 3) return message.reply(`❌ Hainliklerin başlaması için en az 3 kişi lazım! Şu an: ${oyun.lobi.length}`);

        oyun.asama = 'gece';
        oyun.yasayanlar = [...oyun.lobi];
        oyun.serifAtesEtti = false;
        let oyuncular = [...oyun.lobi].sort(() => Math.random() - 0.5);
        
        // Rolleri adil dağıt
        oyun.roller[oyuncular[0]] = 'Vampir';
        oyun.roller[oyuncular[1]] = 'Doktor';
        oyun.roller[oyuncular[2]] = 'Şerif';
        for (let i = 3; i < oyuncular.length; i++) oyun.roller[oyuncular[i]] = 'Köylü';

        // Kalite Mesajı: DM Rol Bildirimi
        for (const uid of oyun.lobi) {
            try {
                const user = await client.users.fetch(uid);
                const rol = oyun.roller[uid];
                
                let embedRenk = 0x3498db; // Köylü Mavi
                let rolDetay = "Köyün huzurunu korumak için gündüzleri doğru kişiyi asmalısın!";
                let rolGorsel = "🔵";

                if (rol === 'Vampir') { embedRenk = 0xe74c3c; rolDetay = "Sinsice hareket et, geceleri köyü avla ve hayatta kal!"; rolGorsel = "🔴"; }
                else if (rol === 'Doktor') { embedRenk = 0x2ecc71; rolDetay = "Her gece köy halkından (veya kendinden) birini ölümden kurtar!"; rolGorsel = "🩺"; }
                else if (rol === 'Şerif') { embedRenk = 0xf1c40f; rolDetay = "Geceleri insanları sorgula. Eğer çok eminsen tetiği çekip vur!"; rolGorsel = "⭐"; }

                const dmEmbed = new EmbedBuilder()
                    .setTitle(`${rolGorsel} GİZLİ KİMLİĞİNİZ BELİRLENDİ`)
                    .setDescription(`Selam, kaderin çizildi. Bu oyundaki rolün:\n\n👑 **Rolün:** \`${rol.toUpperCase()}\`\n\n📌 **Görevin:** ${rolDetay}`)
                    .setColor(embedRenk)
                    .setFooter({ text: 'Şşş! Bu mesajı kimseye gösterme.' });

                await user.send({ embeds: [dmEmbed] });
            } catch (e) {}
        }

        const basladiEmbed = new EmbedBuilder()
            .setTitle("🌙 Göz Gözü Görmez Oldu - Gece Başladı")
            .setDescription("Roller herkesin DM kutusuna fısıldandı. Hainler ve koruyucular gizlice eyleme geçiyor. Kasaba sessizliğe büründü...")
            .setColor(0x1a1a1a);
            
        message.channel.send({ embeds: [basladiEmbed] });
        geceAsamasi(message.channel);
    }
});

// 🌙 GECE SÜRECİ VE ÖZEL DM BUTONLARI
async function geceAsamasi(channel) {
    oyun.asama = 'gece';
    oyun.vampirSecimi = null;
    oyun.doktorSecimi = null;
    oyun.serifSecimi = null;

    // Discord Limitlerini Aşmayan 5'li Buton Yapıcı
    const generateButtons = (kullaniciRol) => {
        const rows = [];
        let currentRow = new ActionRowBuilder();
        let sayac = 0;
        
        oyun.yasayanlar.forEach((id) => {
            if (sayac > 0 && sayac % 4 === 0) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }
            currentRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`dm_act_${id}`)
                    .setLabel(`${client.users.cache.get(id)?.username || 'Oyuncu'}`)
                    .setStyle(ButtonStyle.Secondary)
            );
            sayac++;
        });
        
        if (currentRow.components.length >= 5) { rows.push(currentRow); currentRow = new ActionRowBuilder(); }
        currentRow.addComponents(new ButtonBuilder().setCustomId(`dm_act_skip`).setLabel('⏭️ Pas Geç').setStyle(ButtonStyle.Danger));
        rows.push(currentRow);
        return rows;
    };

    // Şerif İçin Tetik Çekme Butonları
    const generateSerifShootButtons = () => {
        const rows = [];
        let currentRow = new ActionRowBuilder();
        let count = 0;

        oyun.yasayanlar.forEach((id) => {
            if (oyun.roller[id] !== 'Şerif') {
                if (count > 0 && count % 4 === 0) {
                    rows.push(currentRow);
                    currentRow = new ActionRowBuilder();
                }
                currentRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`dm_shoot_${id}`)
                        .setLabel(`🔥 VUR: ${client.users.cache.get(id)?.username}`)
                        .setStyle(ButtonStyle.Danger)
                );
                count++;
            }
        });
        if (currentRow.components.length > 0) rows.push(currentRow);
        return rows;
    };

    for (const uid of oyun.yasayanlar) {
        const rol = oyun.roller[uid];
        if (rol === 'Köylü') continue;

        try {
            const user = await client.users.fetch(uid);
            let embed = new EmbedBuilder().setColor(0x2f3136);
            
            if (rol === 'Vampir') embed.setTitle("🩸 Gecenin Avı").setDescription("Bu gece hangi masum köylünün kanını emmek istersin?").setColor(0x990000);
            if (rol === 'Doktor') embed.setTitle("🩺 Şifa Zamanı").setDescription("Bu gece ölümün kıyısından kimi kurtaracaksın?").setColor(0x2ecc71);
            if (rol === 'Şerif') embed.setTitle("🔍 Adalet Arayışı").setDescription("Kimin maskesini düşürmek, kimliğini öğrenmek istersin?").setColor(0xf1c40f);

            const dmMessage = await user.send({ embeds: [embed], components: generateButtons(rol) });
            const collector = dmMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 35000 });

            collector.on('collect', async (interaction) => {
                const customId = interaction.customId;

                if (customId === 'dm_act_skip') {
                    if (rol === 'Vampir') oyun.vampirSecimi = 'skip';
                    if (rol === 'Doktor') oyun.doktorSecimi = 'skip';
                    if (rol === 'Şerif') oyun.serifSecimi = 'skip';
                    await interaction.reply({ content: "⏭️ Bu geceyi pas geçmeyi tercih ettin." });
                    collector.stop();
                    return;
                }

                const targetId = customId.replace('dm_act_', '');

                if (rol === 'Vampir') {
                    if (oyun.roller[targetId] === 'Vampir') return interaction.reply({ content: "❌ Kendi yoldaşını ısıramazsın!", ephemeral: true });
                    oyun.vampirSecimi = targetId;
                    await interaction.reply({ content: "🎯 Hedef sinsice işaretlendi." });
                    collector.stop();
                } 
                else if (rol === 'Doktor') {
                    oyun.doktorSecimi = targetId;
                    await interaction.reply({ content: "🛡️ Bu kişiye koruyucu şifa uygulandı." });
                    collector.stop();
                } 
                else if (rol === 'Şerif') {
                    const targetRol = oyun.roller[targetId];
                    const sonuc = (targetRol === 'Vampir') ? "🔴 TEHLİKELİ: O BİR VAMPİR!" : "🔵 TEMİZ: Masum bir köylü.";
                    oyun.serifSecimi = 'sorguladi';

                    let sEmbed = new EmbedBuilder().setTitle("🔍 Gizli Soruşturma Raporu").setDescription(`<@${targetId}> analiz edildi:\n\n**Durum:** ${sonuc}`).setColor(0x34495e);
                    
                    if (!oyun.serifAtesEtti) {
                        sEmbed.setDescription(`<@${targetId}> analiz edildi:\n\n**Durum:** ${sonuc}\n\n⚠️ **DİKKAT:** Namluda merminiz var. Bu el tetiği çekip bu kişiyi **SİLAHLA VURMAK** ister misiniz?\n*(Eğer masum birini vurursanız siz de ölürsünüz!)*`);
                        await interaction.reply({ embeds: [sEmbed], components: generateSerifShootButtons() });
                    } else {
                        await interaction.reply({ embeds: [sEmbed] });
                        collector.stop();
                    }
                }
            });

            if (rol === 'Şerif') {
                const shootCollector = dmMessage.createMessageComponentCollector({ filter: i => i.customId.startsWith('dm_shoot_'), time: 35000 });
                shootCollector.on('collect', async (sInteraction) => {
                    oyun.serifSecimi = sInteraction.customId.replace('dm_shoot_', '');
                    oyun.serifAtesEtti = true;
                    await sInteraction.reply({ content: "🔥 TAYFALAR! Silah ateşlendi, sabaha her şey belli olacak." });
                    shootCollector.stop();
                    collector.stop();
                });
            }

            collector.on('end', () => { dmMessage.delete().catch(() => {}); });
        } catch (e) {
            channel.send(`⚠️ <@${uid}> oyuncusunun DM kutusu kapalı olduğu için eylem gönderilemedi!`);
        }
    }

    // Gece Sonu Hesaplaşmaları (40 Saniye Sonra)
    setTimeout(() => {
        let ölenler = [];

        if (oyun.serifSecimi && oyun.serifSecimi !== 'skip' && oyun.serifSecimi !== 'sorguladi') {
            const vurulan = oyun.serifSecimi;
            if (oyun.roller[vurulan] === 'Vampir') {
                ölenler.push({ id: vurulan, sebep: "⭐ Şerif (Şef) karanlıkta sinsi bir siluet gördü ve mermiyi kafasına sıktı! Ölen bir Vampirdi." });
                oyun.vampirSecimi = null; 
            } else {
                const serifId = oyun.lobi.find(id => oyun.roller[id] === 'Şerif');
                if (serifId) ölenler.push({ id: serifId, sebep: "🚨 Şerif (Şef) masum bir köylüyü vurduğu için vicdan azabından can verdi!" });
            }
        }

        if (oyun.vampirSecimi && oyun.vampirSecimi !== 'skip') {
            if (oyun.vampirSecimi !== oyun.doktorSecimi) {
                if (!ölenler.some(p => p.id === oyun.vampirSecimi)) {
                    ölenler.push({ id: oyun.vampirSecimi, sebep: "🩸 Vampir sinsice pencerelerden sızdı ve avını kalbinden dişledi!" });
                }
            }
        }

        gunduzAsamasi(channel, ölenler);
    }, 40000);
}

// ☀️ GÜNDÜZ SÜRECİ VE HATASIZ 5'Lİ BUTONLU OYLAMA
async function gunduzAsamasi(channel, ölenler) {
    oyun.asama = 'gunduz';
    
    let sabahEmbed = new EmbedBuilder().setTitle("☀️ Güneş Doğdu - Kasaba Meydanı").setColor(0xf1c40f);

    if (ölenler.length > 0) {
        let metin = "";
        ölenler.forEach(k => {
            oyun.yasayanlar = oyun.yasayanlar.filter(id => id !== k.id);
            metin += `💀 <@${k.id}> hayatını kaybetti!\n🎭 **Gerçek Rolü:** \`${oyun.roller[k.id]}\`\n📝 **Olay:** ${k.sebep}\n\n`;
        });
        sabahEmbed.setDescription(`Kabus gibi bir gecenin ardından kayıplarımız var:\n\n${metin}`).setColor(0x95a5a6);
        channel.send({ embeds: [sabahEmbed] });
    } else {
        sabahEmbed.setDescription("🕊️ **Mucizevi bir gece!** Tüm kasaba halkı yataklarından sağ salim uyandı. Kimse eksilmedi.").setColor(0x2ecc71);
        channel.send({ embeds: [sabahEmbed] });
    }

    if (oyunBittiKontrol(channel)) return;

    const tartismaEmbed = new EmbedBuilder()
        .setTitle("🗣️ Tartışma Zamanı")
        .setDescription("Şüphelerinizi dile getirin, ipuçlarını tartışın.\n⏱️ **Süre:** 45 Saniye sonra oylama sandığı kurulacak.")
        .setColor(0xe67e22);
    channel.send({ embeds: [tartismaEmbed] });
    
    setTimeout(async () => {
        if (!oyun.aktif || oyun.asama !== 'gunduz') return;

        const oyEmbed = new EmbedBuilder()
            .setTitle("⚖️ Büyük İdam Sandığı Kuruldu")
            .setDescription("Aşağıdaki butonları kullanarak şüphelendiğiniz kişiye dar ağacını gösterin ya da risk almayıp pas geçin.")
            .setColor(0x962d22);
        
        // Tam Kesin Çözüm: Oylama Butonlarını 4'erli gruplayarak hata payını sıfırlıyoruz
        const rows = [];
        let currentRow = new ActionRowBuilder();
        let sayac = 0;
        
        oyun.yasayanlar.forEach((id) => {
            if (sayac > 0 && sayac % 4 === 0) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }
            currentRow.addComponents(
                new ButtonBuilder().setCustomId(`k_as_${id}`).setLabel(`As: ${client.users.cache.get(id)?.username || 'Oyuncu'}`).setStyle(ButtonStyle.Primary)
            );
            sayac++;
        });

        if (currentRow.components.length >= 5) { rows.push(currentRow); currentRow = new ActionRowBuilder(); }
        currentRow.addComponents(new ButtonBuilder().setCustomId('k_as_skip').setLabel('⏭️ Pas Geç (Oy Kullanma)').setStyle(ButtonStyle.Danger));
        rows.push(currentRow);

        const oyMesaj = await channel.send({ embeds: [oyEmbed], components: rows });
        const oylar = {};
        const collector = oyMesaj.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

        collector.on('collect', async (interaction) => {
            if (!oyun.yasayanlar.includes(interaction.user.id)) {
                return interaction.reply({ content: "❌ Mezardakiler kasaba siyasetine karışamaz (Ölüler oy kullanamaz)!", ephemeral: true });
            }
            const secilen = interaction.customId.replace('k_as_', '');
            oylar[secilen] = (oylar[secilen] || 0) + 1;
            await interaction.reply({ content: "📥 Oyunuz gizli sandığa başarıyla atıldı.", ephemeral: true });
        });

        collector.on('end', () => {
            oyMesaj.delete().catch(() => {});
            let lider = null;
            let max = 0;
            
            for (const [id, oy] of Object.entries(oylar)) {
                if (oy > max) { max = oy; lider = id; }
            }

            const sonucEmbed = new EmbedBuilder().setTitle("⚖️ Sandıklar Açıldı - Karar Vakti").setColor(0x130f40);

            if (lider && lider !== 'skip') {
                oyun.yasayanlar = oyun.yasayanlar.filter(id => id !== lider);
                sonucEmbed.setDescription(`🏛️ Kasaba halkının çoğunluk oyuyla <@${lider}> ipe gönderildi!\n\n🎭 **Kefeni Açıldığında Rolü Görüldü:** \`${oyun.roller[lider]}\``);
                channel.send({ embeds: [sonucEmbed] });
            } else {
                sonucEmbed.setDescription("⚖️ Kasabada ortak bir karara varılamadı veya çoğunluk pas geçilmesini istedi. Bu el kimse asılmadı.").setColor(0x7f8c8d);
                channel.send({ embeds: [sonucEmbed] });
            }

            if (oyunBittiKontrol(channel)) return;
            channel.send("🌙 Gün batıyor, karanlık sinsice yeniden çöküyor...");
            setTimeout(() => { geceAsamasi(channel); }, 5000);
        });
    }, 45000);
}

// 🏆 KAZANMA DURUMU VE KİMLİK DEŞİFRE SİSTEMİ
function oyunBittiKontrol(channel) {
    const vampirler = oyun.yasayanlar.filter(id => oyun.roller[id] === 'Vampir');
    const koyuler = oyun.yasayanlar.filter(id => oyun.roller[id] !== 'Vampir');

    // Mükemmel Rol Listesi Çıktısı
    let rolOzeti = `\n\n🎭 **KASABADAKİ TÜM KİMLİKLERİN MASKESİ DÜŞTÜ:**\n`;
    oyun.lobi.forEach(id => {
        let durum = oyun.yasayanlar.includes(id) ? "🟢 Yaşıyor" : "💀 Ölmüş";
        let emoji = oyun.roller[id] === 'Vampir' ? "🔴" : oyun.roller[id] === 'Şerif' ? "⭐" : oyun.roller[id] === 'Doktor' ? "🩺" : "🔵";
        rolOzeti += `${emoji} <@${id}> -> **${oyun.roller[id].toUpperCase()}** (${durum})\n`;
    });

    const bitisEmbed = new EmbedBuilder();

    if (vampirler.length === 0) {
        bitisEmbed.setTitle("🎉 🏆 KÖYLÜLER KAZANDI!")
  
