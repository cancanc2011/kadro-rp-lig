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
    roller: {}, // userId -> 'Vampir', 'Köylü', 'Doktor', 'Gözcü'
    yasayanlar: [],
    asama: 'lobi', 
    vampirSecimi: null,
    doktorSecimi: null,
    kanalId: null
};

client.on('ready', () => {
    console.log(`✅ GİZLİ DM MODLU VK BOTU AKTİF: ${client.user.tag}`);
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
            .setTitle("🐺 Gerçekçi Vampir Köylü Oyunu Başladı!")
            .setDescription(`**Oyun Kurucu:** <@${message.author.id}>\n\nOyuna katılmak için aşağıdaki **Katıl** butonuna basın. (En az 4-5 kişi tavsiye edilir)`)
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
        
        // Rol Dağıtım Algoritması
        oyun.roller[oyuncular[0]] = 'Vampir';
        if (oyuncular.length >= 5) {
            oyun.roller[oyuncular[1]] = 'Doktor';
            oyun.roller[oyuncular[2]] = 'Gözcü';
            for (let i = 3; i < oyuncular.length; i++) oyun.roller[oyuncular[i]] = 'Köylü';
        } else {
            oyun.roller[oyuncular[1]] = 'Doktor';
            for (let i = 2; i < oyuncular.length; i++) oyun.roller[oyuncular[i]] = 'Köylü';
        }

        // DM'den Özel Rolleri Gönderme
        for (const uid of oyun.lobi) {
            try {
                const targetUser = await client.users.fetch(uid);
                const rol = oyun.roller[uid];
                if (rol === 'Vampir') {
                    await targetUser.send("🔴 Rolün: **VAMPİR**!\nAmacın köyü yok etmek. Gece kanaldaki butonlardan kurbanını seç.");
                } else if (rol === 'Doktor') {
                    await targetUser.send("🩺 Rolün: **DOKTOR**!\nAmacın her gece birini korumak. Kendini de koruyabilirsin.");
                } else if (rol === 'Gözcü') {
                    await targetUser.send("👁️ Rolün: **GÖZCÜ (POLİS)**!\nAmacın her gece birini sorgulamak. Kimin ne olduğunu öğreneceksin.");
                } else {
                    await targetUser.send("🔵 Rolün: **KÖYLÜ**!\nÖzel bir gücün yok, gündüz tartışmalarında vampirleri bulup asmalısın!");
                }
            } catch (e) {
                message.channel.send(`⚠️ <@${uid}> kullanıcısının DM'si kapalı, rolünü gizlice alamadı!`);
            }
        }

        message.channel.send("✨ **Tüm roller gizlice DM'den dağıtıldı!**\n🌙 **Gece çöküyor...** Özel rollere sahip kişilere DM'den butonlar gönderiliyor.");
        setTimeout(() => { geceAsamasi(message.channel); }, 3000);
    }
});

// 🌙 GECE SÜRECİ (TAMAMEN DM'DEN MESAJLI)
async function geceAsamasi(channel) {
    oyun.asama = 'gece';
    oyun.vampirSecimi = null;
    oyun.doktorSecimi = null;
    
    // Ana kanala sadece bilgilendirme geçiyoruz, buton falan yok
    channel.send("🌙 **Gece yarısı oldu.** Özel rolleri olanlar şu an DM'den hamlelerini yapıyor...");

    // Yaşayan oyuncuları buton haline getirmek için hazırla (En fazla 5 kişi)
    const generateButtons = () => {
        const row = new ActionRowBuilder();
        let count = 0;
        oyun.yasayanlar.forEach(id => {
            if (count < 5) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`dm_act_${id}`)
                        .setLabel(`${client.users.cache.get(id)?.username || 'Oyuncu'}`)
                        .setStyle(ButtonStyle.Secondary)
                );
                count++;
            }
        });
        return row.components.length > 0 ? [row] : [];
    };

    // Gece aksiyonu olan herkese DM'den butonları gönderiyoruz
    for (const uid of oyun.yasayanlar) {
        const rol = oyun.roller[uid];
        if (rol === 'Köylü') continue; // Düz köylüye gece mesajı atmıyoruz

        try {
            const user = await client.users.fetch(uid);
            let embed = new EmbedBuilder().setColor(0x1F2023);
            
            if (rol === 'Vampir') {
                embed.setTitle("🔴 Vampir Eylemi").setDescription("Bu gece kimi kan uykusuna yatırmak istiyorsun? Aşağıdan seç:");
            } else if (rol === 'Doktor') {
                embed.setTitle("🩺 Doktor Eylemi").setDescription("Bu gece kimi koruma altına almak istiyorsun? Kendini de seçebilirsin:");
            } else if (rol === 'Gözcü') {
                embed.setTitle("👁️ Gözcü Eylemi").setDescription("Bu gece kimin kimliğini gizlice sorgulamak istiyorsun?:");
            }

            const dmComponents = generateButtons();
            if (dmComponents.length === 0) continue;

            const dmMessage = await user.send({ embeds: [embed], components: dmComponents });
            const collector = dmMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 35000 });

            collector.on('collect', async (interaction) => {
                const targetId = interaction.customId.replace('dm_act_', '');
                
                if (rol === 'Vampir') {
                    if (oyun.roller[targetId] === 'Vampir') return interaction.reply({ content: "❌ Kendi takımından bir vampiri seçemezsin!", ephemeral: true });
                    oyun.vampirSecimi = targetId;
                    await interaction.reply({ content: `✅ Kurban tercihin başarıyla kaydedildi.` });
                } 
                else if (rol === 'Doktor') {
                    oyun.doktorSecimi = targetId;
                    await interaction.reply({ content: `✅ Seçilen kişi bu gece koruma altına alındı.` });
                } 
                else if (rol === 'Gözcü') {
                    const targetRol = oyun.roller[targetId];
                    const sonuc = (targetRol === 'Vampir') ? "🔴 DIKKAT: O BİR VAMPİR!" : "🔵 TEMİZ: O bir köylü veya koruyucu.";
                    await interaction.reply({ content: `👁️ **Sorgulama Raporu:** <@${targetId}> -> **${sonuc}**` });
                }
                collector.stop();
            });

            collector.on('end', () => {
                dmMessage.delete().catch(() => {});
            });

        } catch (e) {
            console.log(`${uid} kullanıcısına DM üzerinden gece eylemi gönderilemedi.`);
        }
    }

    // 40 saniye sonra gece biter ve gündüze geçer
    setTimeout(() => {
        let ölenKimse = oyun.vampirSecimi;
        if (oyun.vampirSecimi && oyun.vampirSecimi === oyun.doktorSecimi) {
            ölenKimse = null; // Doktor kurtardı!
        }
        gunduzAsamasi(channel, ölenKimse);
    }, 40000);
}

// ☀️ GÜNDÜZ TARTIŞMA VE ASMA SÜRECİ
async function gunduzAsamasi(channel, kurbanId) {
    oyun.asama = 'gunduz';
    
    if (kurbanId) {
        oyun.yasayanlar = oyun.yasayanlar.filter(id => id !== kurbanId);
        channel.send(`☀️ **Gündüz oldu!**\n\n💀 Maalesef, bu gece <@${kurbanId}> yatağında ölü bulundu! Rolü: **${oyun.roller[kurbanId]}**`);
    } else {
        channel.send(`☀️ **Gündüz oldu!**\n\n🕊️ Harika bir gece! Doktor görevini başarıyla yaptı, bu gece kimse ölmedi!`);
    }

    if (oyunBittiKontrol(channel)) return;

    channel.send("🗣️ **Tartışma Süresi Başladı!** İpuçlarını değerlendirin. 45 saniye sonra oylama paneli açılacak.");
    
    setTimeout(async () => {
        if (!oyun.aktif || oyun.asama !== 'gunduz') return;

        const embed = new EmbedBuilder().setTitle("⚖️ Köy Meydanı - Oylama").setDescription("Köyden temizlenmesini (asılmasını) istediğiniz şüpheliyi oylayın!").setColor(0xF1C40F);
        const row = new ActionRowBuilder();
        
        let count = 0;
        oyun.yasayanlar.forEach(id => {
            if (count < 5) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`k_as_${id}`)
                        .setLabel(`As: ${client.users.cache.get(id)?.username || 'Oyuncu'}`)
                        .setStyle(ButtonStyle.Primary)
                );
                count++;
            }
        });

        const oyMesaj = await channel.send({ embeds: [embed], components: [row] });
        const oylar = {};
        const collector = oyMesaj.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

        collector.on('collect', async (interaction) => {
            if (!oyun.yasayanlar.includes(interaction.user.id)) return interaction.reply({ content: "Ölüler köy oylamasına katılamaz!", ephemeral: true });
            const asilacakId = interaction.customId.replace('k_as_', '');
            oylar[asilacakId] = (oylar[asilacakId] || 0) + 1;
            await interaction.reply({ content: "Oyunuz köy heyetine iletildi!", ephemeral: true });
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
                channel.send(`⚖️ Köy halkının çoğunluk oyuyla <@${enCokOyAlan}> ipe gönderildi! Rolü: **${oyun.roller[enCokOyAlan]}** idi.`);
            } else {
                channel.send("⚖️ Oylarda eşitlik var veya kimse oy vermedi, bugün kimse asılmadı.");
            }

            if (oyunBittiKontrol(channel)) return;
            channel.send("🌙 Yeniden sisli bir gece çöküyor...");
            setTimeout(() => { geceAsamasi(channel); }, 5000);
        });
    }, 45000);
}

// 🏆 KAZANMA DURUMU KONTROLLERİ
function oyunBittiKontrol(channel) {
    const vampirler = oyun.yasayanlar.filter(id => oyun.roller[id] === 'Vampir');
    const koyuler = oyun.yasayanlar.filter(id => oyun.roller[id] !== 'Vampir');

    if (vampirler.length === 0) {
        channel.send("🎉 🏆 **KÖYLÜLER KAZANDI!** Köyü tehdit eden tüm sinsi vampirler asıldı!");
        oyun.aktif = false;
        return true;
    }
    if (vampirler.length >= koyuler.length) {
        channel.send("🩸 🏆 **VAMPİRLER KAZANDI!** Vampirler sayıca üstünlüğü ele geçirip köyü kana buladı!");
        oyun.aktif = false;
        return true;
    }
    return false;
}

const botTokeni = process.env.DISCORD_TOKEN;
if (!botTokeni) {
    console.error("❌ HATA: DISCORD_TOKEN bulunamadı!");
} else {
    client.login(botTokeni.trim());
                }
                        
