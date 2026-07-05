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
    roller: {}, // userId -> 'Vampir', 'Köylü', 'Doktor', 'Şerif'
    yasayanlar: [],
    asama: 'lobi', 
    vampirSecimi: null,
    doktorSecimi: null,
    kanalId: null
};

client.on('ready', () => {
    console.log(`✅ ŞERİFLİ & SKİPLİ VK BOTU AKTİF: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('.')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    // ❌ .iptaloyun
    if (cmd === 'iptaloyun') {
        if (!oyun.aktif) return message.reply("❌ Zaten aktif bir oyun yok!");
        
        const yetkiliMi = message.member.permissions.has('Administrator');
        const baslatanMi = message.author.id === oyun.lobi[0];

        if (!baslatanMi && !yetkiliMi) {
            return message.reply(`❌ Bu oyunu sadece kurucusu (<@${oyun.lobi[0]}>) veya bir Yönetici iptal edebilir!`);
        }
        
        oyun = { aktif: false, lobi: [], roller: {}, yasayanlar: [], asama: 'lobi', vampirSecimi: null, doktorSecimi: null, kanalId: null };
        return message.reply("🛑 **Oyun tamamen iptal edildi ve hafıza sıfırlandı!**");
    }

    // 🚪 .vampirköylü / .vk
    if (cmd === 'vampirköylü' || cmd === 'vk') {
        if (oyun.aktif) return message.reply("❌ Zaten devam eden bir oyun var!");

        oyun.aktif = true;
        oyun.lobi = [message.author.id];
        oyun.kanalId = message.channel.id;
        oyun.asama = 'lobi';

        const embed = new EmbedBuilder()
            .setTitle("🐺 Vampir Köylü Oyunu Başladı!")
            .setDescription(`**Oyun Kurucu:** <@${message.author.id}>\n\nOyuna katılmak için aşağıdaki **Katıl** butonuna basın.`)
            .setColor(0x990000);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('vk_katil').setLabel('🚪 Katıl').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('vk_ayril').setLabel('🚶 Ayrıl').setStyle(ButtonStyle.Secondary)
        );

        const lobiMesaj = await message.channel.send({ embeds: [embed], components: [row] });
        const collector = lobiMesaj.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'vk_katil') {
                if (oyun.lobi.includes(interaction.user.id)) return interaction.reply({ content: "Zaten katılmışsın!", ephemeral: true });
                oyun.lobi.push(interaction.user.id);
                embed.setDescription(`**Oyun Kurucu:** <@${oyun.lobi[0]}>\n\n**Katılanlar (${oyun.lobi.length}):**\n${oyun.lobi.map(id => `<@${id}>`).join('\n')}`);
                await interaction.update({ embeds: [embed] });
            }
            if (interaction.customId === 'vk_ayril') {
                if (!oyun.lobi.includes(interaction.user.id)) return interaction.reply({ content: "Zaten lobide değilsin!", ephemeral: true });
                if (interaction.user.id === oyun.lobi[0]) return interaction.reply({ content: "Kurucu ayrılamaz.", ephemeral: true });
                oyun.lobi = oyun.lobi.filter(id => id !== interaction.user.id);
                embed.setDescription(`**Oyun Kurucu:** <@${oyun.lobi[0]}>\n\n**Katılanlar (${oyun.lobi.length}):**\n${oyun.lobi.map(id => `<@${id}>`).join('\n')}`);
                await interaction.update({ embeds: [embed] });
            }
        });
    }

    // 🎮 .başlat
    if (cmd === 'başlat' || cmd === 'baslat') {
        if (!oyun.aktif || oyun.asama !== 'lobi') return message.reply("❌ Şu an başlatılacak bir lobi yok!");
        if (message.author.id !== oyun.lobi[0]) return message.reply("❌ Sadece kurucu başlatabilir!");
        if (oyun.lobi.length < 4) return message.reply("❌ En az 4 kişi lazım!");

        oyun.asama = 'gece';
        oyun.yasayanlar = [...oyun.lobi];
        let oyuncular = [...oyun.lobi].sort(() => Math.random() - 0.5);
        
        // 4 Kişilik ve üzeri için net rol dağılımı
        oyun.roller[oyuncular[0]] = 'Vampir';
        if (oyuncular.length >= 4) {
            oyun.roller[oyuncular[1]] = 'Doktor';
            oyun.roller[oyuncular[2]] = 'Şerif';
            for (let i = 3; i < oyuncular.length; i++) oyun.roller[oyuncular[i]] = 'Köylü';
        } else {
            oyun.roller[oyuncular[1]] = 'Doktor';
            for (let i = 2; i < oyuncular.length; i++) oyun.roller[oyuncular[i]] = 'Köylü';
        }

        // DM'den Rolleri Gönderme
        for (const uid of oyun.lobi) {
            try {
                const targetUser = await client.users.fetch(uid);
                const rol = oyun.roller[uid];
                if (rol === 'Vampir') {
                    await targetUser.send("🔴 Rolün: **VAMPİR (KATIL)**!\nKöyü temizle. Gece DM'den birini öldürebilir ya da Pas Geçebilirsin.");
                } else if (rol === 'Doktor') {
                    await targetUser.send("🩺 Rolün: **DOKTOR**!\nHer gece birini koru veya pas geç.");
                } else if (rol === 'Şerif') {
                    await targetUser.send("⭐ Rolün: **ŞERİF**!\nHer gece birini gizlice sorgula veya pas geç.");
                } else {
                    await targetUser.send("🔵 Rolün: **KÖYLÜ**!\nÖzel gücün yok, gündüz tartışıp suçluyu bulmalısın.");
                }
            } catch (e) {
                message.channel.send(`⚠️ <@${uid}> kullanıcısının DM'si kapalı!`);
            }
        }

        message.channel.send("✨ **Roller gizlice DM'den dağıtıldı!**\n🌙 **Gece çöküyor...** Özel rolleri olanlar DM kutularını kontrol etsin.");
        setTimeout(() => { geceAsamasi(message.channel); }, 3000);
    }
});

// 🌙 GECE SÜRECİ (DM BUTONLARI VE PAS GEÇMELER)
async function geceAsamasi(channel) {
    oyun.asama = 'gece';
    oyun.vampirSecimi = null;
    oyun.doktorSecimi = null;
    
    channel.send("🌙 **Gece yarısı oldu.** Özel rollere sahip olanlar şu an gizlice DM'den eylemlerini seçiyor...");

    const generateButtons = (rol) => {
        const row = new ActionRowBuilder();
        let count = 0;
        
        oyun.yasayanlar.forEach(id => {
            if (count < 4) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`dm_act_${id}`)
                        .setLabel(`${client.users.cache.get(id)?.username || 'Oyuncu'}`)
                        .setStyle(ButtonStyle.Secondary)
                );
                count++;
            }
        });

        // Skip (Pas Geç) Butonu
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`dm_act_skip`)
                .setLabel(rol === 'Vampir' ? '⏭️ Pas Geç (Öldürme)' : '⏭️ Pas Geç')
                .setStyle(ButtonStyle.Danger)
        );

        return [row];
    };

    for (const uid of oyun.yasayanlar) {
        const rol = oyun.roller[uid];
        if (rol === 'Köylü') continue;

        try {
            const user = await client.users.fetch(uid);
            let embed = new EmbedBuilder().setColor(0x1F2023);
            
            if (rol === 'Vampir') {
                embed.setTitle("🔴 Vampir (Katil) Eylemi").setDescription("Bu gece kimi öldüreceksin? Pas geçmek için kırmızı butona bas:");
            } else if (rol === 'Doktor') {
                embed.setTitle("🩺 Doktor Eylemi").setDescription("Bu gece kimi koruyacaksın? Pas geçmek için kırmızı butona bas:");
            } else if (rol === 'Şerif') {
                embed.setTitle("⭐ Şerif Eylemi").setDescription("Bu gece kimin kimliğini sorgulayacaksın? Pas geçmek için kırmızı butona bas:");
            }

            const dmMessage = await user.send({ embeds: [embed], components: generateButtons(rol) });
            const collector = dmMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 35000 });

            collector.on('collect', async (interaction) => {
                const targetId = interaction.customId.replace('dm_act_', '');
                
                if (targetId === 'skip') {
                    if (rol === 'Vampir') oyun.vampirSecimi = 'skip';
                    if (rol === 'Doktor') oyun.doktorSecimi = 'skip';
                    await interaction.reply({ content: `⏭️ Bu geceki hakkını pas geçtin.` });
                } else {
                    if (rol === 'Vampir') {
                        if (oyun.roller[targetId] === 'Vampir') return interaction.reply({ content: "❌ Kendini veya başka bir katili seçemezsin!", ephemeral: true });
                        oyun.vampirSecimi = targetId;
                        await interaction.reply({ content: `✅ Hedef seçildi.` });
                    } 
                    else if (rol === 'Doktor') {
                        oyun.doktorSecimi = targetId;
                        await interaction.reply({ content: `✅ Seçtiğin kişi bu gece koruma altında.` });
                    } 
                    else if (rol === 'Şerif') {
                        const targetRol = oyun.roller[targetId];
                        const sonuc = (targetRol === 'Vampir') ? "🔴 TEHLİKELİ: O BİR VAMPİR!" : "🔵 TEMİZ: O bir köylü veya koruyucu.";
                        await interaction.reply({ content: `⭐ **Şerif Raporu:** <@${targetId}> -> **${sonuc}**` });
                    }
                }
                collector.stop();
            });

            collector.on('end', () => {
                dmMessage.delete().catch(() => {});
            });

        } catch (e) {
            console.log(`${uid} kullanıcısına DM ile ulaşılamadı.`);
        }
    }

    // 40 saniye sonra geceyi bitir
    setTimeout(() => {
        let ölenKimse = oyun.vampirSecimi;
        if (oyun.vampirSecimi === 'skip' || !oyun.vampirSecimi) ölenKimse = null;
        if (oyun.vampirSecimi && oyun.vampirSecimi === oyun.doktorSecimi) ölenKimse = null;

        gunduzAsamasi(channel, ölenKimse);
    }, 40000);
}

// ☀️ GÜNDÜZ TARTIŞMA VE ASMA SÜRECİ (OYLAMA SKIP DAHİL)
async function gunduzAsamasi(channel, kurbanId) {
    oyun.asama = 'gunduz';
    
    if (kurbanId) {
        oyun.yasayanlar = oyun.yasayanlar.filter(id => id !== kurbanId);
        channel.send(`☀️ **Gündüz oldu!**\n\n💀 Maalesef, bu gece <@${kurbanId}> aramızdan ayrıldı. Rolü: **${oyun.roller[kurbanId]}**`);
    } else {
        channel.send(`☀️ **Gündüz oldu!**\n\n🕊️ Sakin bir geceydi, kimse hayatını kaybetmedi.`);
    }

    if (oyunBittiKontrol(channel)) return;

    channel.send("🗣️ **Tartışma Süresi Başladı!** Şerif istiyorsa kanıtlarını sunsun. 45 saniye sonra oylama açılacak.");
    
    setTimeout(async () => {
        if (!oyun.aktif || oyun.asama !== 'gunduz') return;

        const embed = new EmbedBuilder().setTitle("⚖️ Köy Meydanı - Oylama").setDescription("Köyden asılmasını istediğiniz kişiyi seçin veya oylamayı pas geçin.").setColor(0xF1C40F);
        const row = new ActionRowBuilder();
        
        let count = 0;
        oyun.yasayanlar.forEach(id => {
            if (count < 4) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`k_as_${id}`)
                        .setLabel(`As: ${client.users.cache.get(id)?.username || 'Oyuncu'}`)
                        .setStyle(ButtonStyle.Primary)
                );
                count++;
            }
        });

        // Oylama Skip Butonu
        row.addComponents(
            new ButtonBuilder().setCustomId('k_as_skip').setLabel('⏭️ Pas Geç (Kimseyi Asma)').setStyle(ButtonStyle.Danger)
        );

        const oyMesaj = await channel.send({ embeds: [embed], components: [row] });
        const oylar = {};
        const collector = oyMesaj.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

        collector.on('collect', async (interaction) => {
            if (!oyun.yasayanlar.includes(interaction.user.id)) return interaction.reply({ content: "Ölüler oy kullanamaz!", ephemeral: true });
            const asilacakId = interaction.customId.replace('k_as_', '');
            oylar[asilacakId] = (oylar[asilacakId] || 0) + 1;
            await interaction.reply({ content: "Oyun başarıyla kaydedildi!", ephemeral: true });
        });

        collector.on('end', () => {
            oyMesaj.delete().catch(() => {});
            let enCokOyAlan = null;
            let maxOy = 0;
            
            for (const [id, oy] of Object.entries(oylar)) {
                if (oy > maxOy) { maxOy = oy; enCokOyAlan = id; }
            }

            if (enCokOyAlan && enCokOyAlan !== 'skip') {
                oyun.yasayanlar = oyun.yasayanlar.filter(id => id !== enCokOyAlan);
                channel.send(`⚖️ Çoğunluğun kararıyla <@${enCokOyAlan}> asıldı! Rolü: **${oyun.roller[enCokOyAlan]}** idi.`);
            } else {
                channel.send("⚖️ Köy halkı bu tur kimseyi asmamaya karar verdi ve oylama pas geçildi.");
            }

            if (oyunBittiKontrol(channel)) return;
            channel.send("🌙 Yeniden sisli bir gece çöküyor...");
            setTimeout(() => { geceAsamasi(channel); }, 5000);
        });
    }, 45000);
}

// 🏆 KAZANMA KONTROLÜ
function oyunBittiKontrol(channel) {
    const vampirler = oyun.yasayanlar.filter(id => oyun.roller[id] === 'Vampir');
    const koyuler = oyun.yasayanlar.filter(id => oyun.roller[id] !== 'Vampir');

    if (vampirler.length === 0) {
        channel.send("🎉 🏆 **KÖYLÜLER KAZANDI!** Bütün vampirler infaz edildi!");
        oyun.aktif = false;
        return true;
    }
    if (vampirler.length >= koyuler.length) {
        channel.send("🩸 🏆 **VAMPİRLER KAZANDI!** Köyde kontrolü tamamen ele geçirdiler!");
        oyun.aktif = false;
        return true;
    }
    return false;
}

const botTokeni = process.env.DISCORD_TOKEN;
if (!botTokeni) {
    console.error("❌ HATA: DISCORD_TOKEN tanımlanmamış!");
} else {
    client.login(botTokeni.trim());
                        }

