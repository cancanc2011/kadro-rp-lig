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
    roller: {}, 
    yasayanlar: [],
    asama: 'lobi', 
    vampirOylari: {}, 
    koyOylari: {},
    kanalId: null
};

client.on('ready', () => {
    console.log(`✅ BOT AKTİF: ${client.user.tag} başarıyla giriş yaptı!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('.')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    // 🚪 .vampirköylü / .vk
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
        const collector = lobiMesaj.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async (interaction) => {
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
                    return interaction.reply({ content: "Oyun kurucu lobiden ayrılamaz.", ephemeral: true });
                }
                oyun.lobi = oyun.lobi.filter(id => id !== interaction.user.id);
                embed.setDescription(`**Oyun Kurucu:** <@${oyun.lobi[0]}>\n\n**Katılan Oyuncular (${oyun.lobi.length}):**\n${oyun.lobi.map(id => `<@${id}>`).join('\n')}`);
                await interaction.update({ embeds: [embed] });
            }
        });
    }

    // 🎮 .başlat
    if (cmd === 'başlat' || cmd === 'baslat') {
        if (!oyun.aktif || oyun.asama !== 'lobi') return message.reply("❌ Şu an başlatılacak bir lobi yok!");
        if (message.author.id !== oyun.lobi[0]) return message.reply("❌ Oyunu sadece lobi kurucusu başlatabilir!");
        if (oyun.lobi.length < 4) return message.reply(`❌ En az 4 kişi lazım! Şu an: \`${oyun.lobi.length}\``);

        oyun.asama = 'gece';
        oyun.yasayanlar = [...oyun.lobi];

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

            try {
                const user = await client.users.fetch(id);
                let rolEmbed = new EmbedBuilder().setTitle("🎭 Rolün Belli Oldu!").setTimestamp();

                if (oyun.roller[id] === 'Vampir') {
                    rolEmbed.setColor(0xFF0000).setDescription("🔴 Rolün: **VAMPİR**\n\nGece kanaldaki butonlardan kurbanını seç!");
                } else if (oyun.roller[id] === 'Doktor') {
                    rolEmbed.setColor(0x00FF00).setDescription("🟢 Rolün: **DOKTOR**\n\nGece birini koru!");
                } else {
                    rolEmbed.setColor(0x3498DB).setDescription("🔵 Rolün: **KÖYLÜ**\n\nVampirleri bul ve as!");
                }
                await user.send({ embeds: [rolEmbed] });
            } catch (err) {
                message.channel.send(`⚠️ <@${id}> kullanıcısının DM'si kapalı!`);
            }
        }

        message.channel.send("✨ **Roller dağıtıldı!**\n🌙 **Gece çöküyor...** Vampirler kurbanını seçiyor!");
        geceAsamasi(message.channel);
    }
});

async function geceAsamasi(channel) {
    oyun.asama = 'gece';
    oyun.vampirOylari = {};
    
    const embed = new EmbedBuilder()
        .setTitle("🌙 Gece Oldu")
        .setDescription("Vampirler kurbanını oylasın.")
        .setColor(0x1F2023);

    const row = new ActionRowBuilder();
    let count = 0;

    oyun.yasayanlar.forEach(id => {
        if (oyun.roller[id] !== 'Vampir' && count < 5) {
            row.addComponents(
                new ButtonBuilder().setCustomId(`v_kill_${id}`).setLabel(`Öldür: ${client.users.cache.get(id)?.username || id}`).setStyle(ButtonStyle.Danger)
            );
            count++;
        }
    });

    const geceMesaj = await channel.send({ embeds: [embed], components: row.components.length > 0 ? [row] : [] });
    if (row.components.length === 0) return oyunBittiKontrol(channel);

    const collector = geceMesaj.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });
    let secilenKurban = null;

    collector.on('collect', async (interaction) => {
        if (oyun.roller[interaction.user.id] !== 'Vampir') {
            return interaction.reply({ content: "❌ Vampir değilsin!", ephemeral: true });
        }
        secilenKurban = interaction.customId.replace('v_kill_', '');
        await interaction.reply({ content: "Kurban seçildi!", ephemeral: true });
        collector.stop();
    });

    collector.on('end', () => {
        geceMesaj.delete().catch(() => {});
        gunduzAsamasi(channel, secilenKurban);
    });
}

async function gunduzAsamasi(channel, kurbanId) {
    oyun.asama = 'gunduz';
    if (kurbanId) {
        oyun.yasayanlar = oyun.yasayanlar.filter(id => id !== kurbanId);
        channel.send(`☀️ **Gündüz oldu!**\n\n💀 <@${kurbanId}> öldürüldü!`);
    } else {
        channel.send(`☀️ **Gündüz oldu!**\n\n🕊️ Kimse ölmedi.`);
    }

    if (oyunBittiKontrol(channel)) return;

    channel.send("🗣️ **Tartışma ve Oylama Başladı!** 45 saniye sonra köy karar verecek.");
    
    setTimeout(async () => {
        const embed = new EmbedBuilder().setTitle("⚖️ Köy Oylaması").setDescription("Asılacak kişiyi seçin.").setColor(0xF1C40F);
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

        collector.on('collect', async (interaction) => {
            if (!oyun.yasayanlar.includes(interaction.user.id)) return interaction.reply({ content: "Ölüler oy kullanamaz!", ephemeral: true });
            const asilacakId = interaction.customId.replace('k_as_', '');
            oylar[asilacakId] = (oylar[asilacakId] || 0) + 1;
            await interaction.reply({ content: "Oy kaydedildi!", ephemeral: true });
        });

        collector.on('end', () => {
            oyMesaj.delete().catch(() => {});
            let enCokOyAlan = null;
            let maxOy = 0;
            
            for (const [id, oy] of Object.entries(oylar)) {
                if (oy > maxOy) { maxOy = oy; enCokOyAlan = id; }
            }

            if (enCokOyAlan) {
                oyun.yasayanlar = oyun.yasayanlar.filter(id => id !== enCokOyAlan);
                channel.send(`⚖️ Köy kararıyla <@${enCokOyAlan}> asıldı! Rolü: **${oyun.roller[enCokOyAlan]}**`);
            } else {
                channel.send("⚖️ Kimse asılmadı.");
            }

            if (oyunBittiKontrol(channel)) return;
            channel.send("🌙 Yeniden gece oluyor...");
            setTimeout(() => geceAsamasi(channel), 5000);
        });
    }, 45000);
}

function oyunBittiKontrol(channel) {
    const vampirler = oyun.yasayanlar.filter(id => oyun.roller[id] === 'Vampir');
    const koyuler = oyun.yasayanlar.filter(id => oyun.roller[id] !== 'Vampir');

    if (vampirler.length === 0) {
        channel.send("🎉 **KÖYLÜLER KAZANDI!**");
        oyun.aktif = false;
        return true;
    }
    if (vampirler.length >= koyuler.length) {
        channel.send("🩸 **VAMPİRLER KAZANDI!**");
        oyun.aktif = false;
        return true;
    }
    return false;
}

const botTokeni = process.env.DISCORD_TOKEN;
if (!botTokeni || botTokeni.trim() === "") {
    console.error("❌ HATA: Railway Variables paneline 'DISCORD_TOKEN' eklenmemiş!");
} else {
    client.login(botTokeni.trim()).catch(err => {
        console.error("❌ HATA: Yapıştırılan token kesinlikle GEÇERSİZ!", err.message);
    });
}
