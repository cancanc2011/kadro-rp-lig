const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Oyun Durumu Hafızası
let oyun = {
    aktif: false,
    lobi: [],
    roller: {}, // userId -> 'Vampir', 'Köylü', 'Doktor'
    yasayanlar: [],
    asama: 'lobi', // lobi, gece, gündüz
    vampirOylari: {}, // vampirSeçimi -> oySayısı
    koyOylari: {},
    kanalId: null
};

client.on('ready', () => {
    console.log(`🐺 Vampir Köylü Botu Giriş Yaptı: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('.')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    // 🚪 .vampirköylü - Lobi Başlatma
    if (cmd === 'vampirköylü' || cmd === 'vk') {
        if (oyun.aktif) return message.reply("❌ Zaten devam eden bir oyun var!");

        oyun.aktif = true;
        oyun.lobi = [message.author.id];
        oyun.kanalId = message.channel.id;
        oyun.asama = 'lobi';
        oyun.roller = {};
        oyun.yasayanlar = [];

        const embed = new EmbedBuilder()
            .setTitle("🐺 Vampir Köylü Oyunu Başladı!")
            .setDescription(`**Oyun Kurucu:** <@${message.author.id}>\n\nOyuna katılmak için aşağıdaki **Katıl** butonuna basın. En az 4 kişi gereklidir.`)
            .setColor(0x990000)
            .setFooter({ text: "Oyun kurucu dilediği an '.başlat' yazarak oyunu başlatabilir." });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('vk_katil').setLabel('🚪 Katıl').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('vk_ayril').setLabel('🚶 Ayrıl').setStyle(ButtonStyle.Secondary)
        );

        const lobiMesaj = await message.channel.send({ embeds: [embed], components: [row] });

        // Buton Takibi
        const collector = lobiMesaj.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 }); // 5 dk lobi süresi

        collector.on('collection', async (interaction) => {
            if (interaction.customId === 'vk_katil') {
                if (oyun.lobi.includes(interaction.user.id)) {
                    return interaction.reply({ content: "Zaten lobiye katılmışsın!", ephemeral: true });
                }
                oyun.lobi.push(interaction.user.id);
                embed.setDescription(`**Oyun Kurucu:** <@${oyun.lobi[0]}>\n\n**Katılan Oyuncular (${oyun.lobi.length}):**\n${oyun.lobi.map(id => `<@${id}>`).join('\n')}`);
                await interaction.update({ embeds: [embed] });
            }

            if (interaction.customId === 'vk_ayril') {
                if (!oyun.lobi.includes(interaction.user.id)) {
                    return interaction.reply({ content: "Zaten lobide değilsin!", ephemeral: true });
                }
                if (interaction.user.id === oyun.lobi[0]) {
                    return interaction.reply({ content: "Oyun kurucu lobiden ayrılamaz, oyunu iptal etmek için botu yeniden başlatın.", ephemeral: true });
                }
                oyun.lobi = oyun.lobi.filter(id => id !== interaction.user.id);
                embed.setDescription(`**Oyun Kurucu:** <@${oyun.lobi[0]}>\n\n**Katılan Oyuncular (${oyun.lobi.length}):**\n${oyun.lobi.map(id => `<@${id}>`).join('\n')}`);
                await interaction.update({ embeds: [embed] });
            }
        });
    }

    // 🎮 .başlat - Rol Dağıtımı ve Oyunu Başlatma
    if (cmd === 'başlat' || cmd === 'baslat') {
        if (!oyun.aktif || oyun.asama !== 'lobi') return message.reply("❌ Şu an başlatılacak bir lobi yok!");
        if (message.author.id !== oyun.lobi[0]) return message.reply("❌ Oyunu sadece lobi kurucusu başlatabilir!");
        if (oyun.lobi.length < 4) return message.reply(`❌ Oyunu başlatmak için en az 4 kişi lazım! Şu anki kişi sayısı: \`${oyun.lobi.length}\``);

        oyun.asama = 'gece';
        oyun.yasayanlar = [...oyun.lobi];

        // Karıştır ve Rol Dağıt (Örn 4 kişide: 1 Vampir, 1 Doktor, 2 Köylü)
        let oyuncular = [...oyun.lobi].sort(() => Math.random() - 0.5);
        let vampirSayisi = Math.max(1, Math.floor(oyuncular.length / 4));
        let doktorSayisi = 1;

        for (let i = 0; i < oyuncular.length; i++) {
            let id = oyuncular[i];
            if (i < vampirSayisi) {
                oyun.roller[id] = 'Vampir';
            } else if (i < vampirSayisi + doktorSayisi) {
                oyun.roller[id] = 'Doktor';
            } else {
                oyun.roller[id] = 'Köylü';
            }

            // DM Gönderimi
            try {
                const user = await client.users.fetch(id);
                let rolEmbed = new EmbedBuilder()
                    .setTitle("🎭 Vampir Köylü Rolün Belli Oldu!")
                    .setTimestamp();

                if (oyun.roller[id] === 'Vampir') {
                    rolEmbed.setColor(0xFF0000).setDescription("🔴 Rolün: **VAMPİR**\n\n**Amacın:** Köylüleri gizlice temizlemek. Gece aşamasında kanaldaki butonlardan kurbanını seç!");
                } else if (oyun.roller[id] === 'Doktor') {
                    rolEmbed.setColor(0x00FF00).setDescription("🟢 Rolün: **DOKTOR**\n\n**Amacın:** Vampirlerin öldüreceği kişiyi tahmin edip kurtarmak. Gece aşamasında birini koru!");
                } else {
                    rolEmbed.setColor(0x3498DB).setDescription("🔵 Rolün: **KÖYLÜ**\n\n**Amacın:** Gündüz tartışmalarında ipuçlarını toplayıp vampirleri asmak!");
                }
                await user.send({ embeds: [rolEmbed] });
            } catch (err) {
                message.channel.send(`⚠️ <@${id}> kullanıcısının DM kutusu kapalı olduğu için rolü gönderilemedi!`);
            }
        }

        message.channel.send("✨ **Roller gizlice DM üzerinden dağıtıldı!**\n🌙 **Gece çöküyor...** Herkes gözlerini kapatsın. Vampirler kurbanını seçiyor!");
        geceAsamasi(message.channel);
    }
});

// 🌙 GECE AŞAMASI (Vampirler Kurban Seçiyor)
async function geceAsamasi(channel) {
    oyun.asama = 'gece';
    oyun.vampirOylari = {};
    
    const embed = new EmbedBuilder()
        .setTitle("🌙 Gece Oldu")
        .setDescription("Vampirler gizlice kurbanını seçiyor. Yaşayan oyuncular aşağıda listelenmiştir. Vampirseniz gizlice kurbanınızı oylayın!")
        .setColor(0x1F2023);

    const row = new ActionRowBuilder();
    let count = 0;

    oyun.yasayanlar.forEach(id => {
        if (oyun.roller[id] !== 'Vampir' && count < 5) { // Buton sınırı 5'tir, ilk 5 köylüyü listeler
            row.addComponents(
                new ButtonBuilder().setCustomId(`v_kill_${id}`).setLabel(`Öldür: ${client.users.cache.get(id)?.username || id}`).setStyle(ButtonStyle.Danger)
            );
            count++;
        }
    });

    const geceMesaj = await channel.send({ embeds: [embed], components: row.components.length > 0 ? [row] : [] });

    if (row.components.length === 0) {
        return oyunBittiKontrol(channel);
    }

    const collector = geceMesaj.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 }); // 30 saniye gece süresi

    let secilenKurban = null;

    collector.on('collection', async (interaction) => {
        if (oyun.roller[interaction.user.id] !== 'Vampir') {
            return interaction.reply({ content: "❌ Sen vampir değilsin, gece eylemi yapamazsın!", ephemeral: true });
        }
        
        const kurbanId = interaction.customId.replace('v_kill_', '');
        secilenKurban = kurbanId;
        
        await interaction.reply({ content: `Kurban olarak <@${kurbanId}> seçildi!`, ephemeral: true });
        collector.stop();
    });

    collector.on('end', () => {
        geceMesaj.delete().catch(() => {});
        gunduzAsamasi(channel, secilenKurban);
    });
}

// ☀️ GÜNDÜZ AŞAMASI (Tartışma ve Oylama)
async function gunduzAsamasi(channel, kurbanId) {
    oyun.asama = 'gunduz';
    
    if (kurbanId) {
        oyun.yasayanlar = oyun.yasayanlar.filter(id => id !== kurbanId);
        channel.send(`☀️ **Gündüz oldu!**\n\n💀 Maalesef, bu gece <@${kurbanId}> vampirler tarafından hunharca katledildi!`);
    } else {
        channel.send(`☀️ **Gündüz oldu!**\n\n🕊️ Şanslı bir gece! Dün gece kimse ölmedi.`);
    }

    if (oyunBittiKontrol(channel)) return;

    channel.send("🗣️ **Tartışma Süresi Başladı!** Kimin vampir olduğunu tartışın. 45 saniye sonra oylama başlayacak.");
    
    setTimeout(async () => {
        channel.send("⚖️ **Oylama Zamanı!** Köyden asılmasını istediğiniz şüpheliyi seçin!");
        
        const embed = new EmbedBuilder().setTitle("⚖️ Köy Oylaması").setDescription("Aşağıdaki butonlardan şüphelendiğiniz kişiyi seçin!").setColor(0xF1C40F);
        const row = new ActionRowBuilder();
        
        let count = 0;
        oyun.yasayanlar.forEach(id => {
            if (count < 5) {
                row.addComponents(new ButtonBuilder().setCustomId(`k_as_${id}`).setLabel(`As: ${client.users.cache.get(id)?.username || id}`).setStyle(ButtonStyle.Primary));
                count++;
            }
        });

        const oyMesaj = await channel.send({ embeds: [embed], components: [row] });
        const oylar = {};

        const collector = oyMesaj.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

        collector.on('collection', async (interaction) => {
            if (!oyun.yasayanlar.includes(interaction.user.id)) {
                return interaction.reply({ content: "Ölüler veya oyunda olmayanlar oy kullanamaz!", ephemeral: true });
            }
            const asilacakId = interaction.customId.replace('k_as_', '');
            oylar[asilacakId] = (oylar[asilacakId] || 0) + 1;
            await interaction.reply({ content: `<@${asilacakId}> kişisine oy verdiniz!`, ephemeral: true });
        });

        collector.on('end', () => {
            oyMesaj.delete().catch(() => {});
            
            let enCokOyAlan = null;
            let maxOy = 0;
            
            for (const [id, oy] of Object.entries(oylar)) {
                if (oy > maxOy) {
                    maxOy = oy;
                    enCokOyAlan = id;
                }
            }

            if (enCokOyAlan) {
                oyun.yasayanlar = oyun.yasayanlar.filter(id => id !== enCokOyAlan);
                channel.send(`⚖️ Köy kararıyla <@${enCokOyAlan}> asıldı! Rolü: **${oyun.roller[enCokOyAlan]}** idi.`);
            } else {
                channel.send("⚖️ Beraberlik sağlandı veya kimse oy kullanmadı! Bugün kimse asılmadı.");
            }

            if (oyunBittiKontrol(channel)) return;

            channel.send("🌙 Yeniden gece oluyor...");
            setTimeout(() => geceAsamasi(channel), 5000);
        });

    }, 45000);
}

// 🏆 OYUN BİTTİ KONTROLÜ
function oyunBittiKontrol(channel) {
    const vampirler = oyun.yasayanlar.filter(id => oyun.roller[id] === 'Vampir');
    const koyuler = oyun.yasayanlar.filter(id => oyun.roller[id] !== 'Vampir');

    if (vampirler.length === 0) {
        channel.send("🎉 🏆 **KÖYLÜLER KAZANDI!** Tüm vampirler temizlendi!");
        oyun.aktif = false;
        return true;
    }
    if (vampirler.length >= koyuler.length) {
        channel.send("🩸 🏆 **VAMPİRLER KAZANDI!** Köyü tamamen ele geçirdiler!");
        oyun.aktif = false;
        return true;
    }
    return false;
}

client.login(process.env.DISCORD_TOKEN);
