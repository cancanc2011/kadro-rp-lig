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
    console.log(`✅ TEMİZ VK BOTU AKTİF: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('.')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    // ❌ .iptaloyun
    if (cmd === 'iptaloyun') {
        if (!oyun.aktif) return message.reply("❌ Zaten aktif bir oyun yok!");
        oyun = { aktif: false, lobi: [], roller: {}, yasayanlar: [], asama: 'lobi', vampirSecimi: null, doktorSecimi: null, serifSecimi: null, serifAtesEtti: false, kanalId: null };
        return message.reply("🛑 **Oyun iptal edildi ve tüm hafıza temizlendi!**");
    }

    // 🚪 .vk
    if (cmd === 'vk') {
        if (oyun.aktif) return message.reply("❌ Zaten devam eden bir oyun var!");
        oyun.aktif = true;
        oyun.lobi = [message.author.id];
        oyun.kanalId = message.channel.id;
        oyun.asama = 'lobi';

        const embed = new EmbedBuilder()
            .setTitle("🐺 Vampir Köylü")
            .setDescription(`**Oyun Kurucu:** <@${message.author.id}>\n\nKatılmak için butona bas.\n*(3-10 Kişi)*`)
            .setColor(0x990000);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('vk_katil').setLabel('🚪 Katıl').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('vk_ayril').setLabel('🚶 Ayrıl').setStyle(ButtonStyle.Secondary)
        );

        const lobiMesaj = await message.channel.send({ embeds: [embed], components: [row] });
        const collector = lobiMesaj.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'vk_katil') {
                if (oyun.lobi.length >= 10) return interaction.reply({ content: "❌ Dolu!", ephemeral: true });
                if (oyun.lobi.includes(interaction.user.id)) return interaction.reply({ content: "Zaten lobidesin!", ephemeral: true });
                oyun.lobi.push(interaction.user.id);
                embed.setDescription(`**Oyun Kurucu:** <@${oyun.lobi[0]}>\n\n**Katılanlar (${oyun.lobi.length}/10):**\n${oyun.lobi.map(id => `<@${id}>`).join('\n')}`);
                await interaction.update({ embeds: [embed] });
            }
            if (interaction.customId === 'vk_ayril') {
                if (!oyun.lobi.includes(interaction.user.id)) return interaction.reply({ content: "Lobide değilsin!", ephemeral: true });
                if (interaction.user.id === oyun.lobi[0]) return interaction.reply({ content: "Kurucu ayrılamaz.", ephemeral: true });
                oyun.lobi = oyun.lobi.filter(id => id !== interaction.user.id);
                embed.setDescription(`**Oyun Kurucu:** <@${oyun.lobi[0]}>\n\n**Katılanlar (${oyun.lobi.length}/10):**\n${oyun.lobi.map(id => `<@${id}>`).join('\n')}`);
                await interaction.update({ embeds: [embed] });
            }
        });
    }

    // 🎮 .başlat
    if (cmd === 'başlat' || cmd === 'baslat') {
        if (!oyun.aktif || oyun.lobi.length < 3) return message.reply("❌ En az 3 kişi lazım!");
        oyun.asama = 'gece';
        oyun.yasayanlar = [...oyun.lobi];
        let oyuncular = [...oyun.lobi].sort(() => Math.random() - 0.5);
        
        oyun.roller[oyuncular[0]] = 'Vampir';
        oyun.roller[oyuncular[1]] = 'Doktor';
        oyun.roller[oyuncular[2]] = 'Şerif';
        for (let i = 3; i < oyuncular.length; i++) oyun.roller[oyuncular[i]] = 'Köylü';

        for (const uid of oyun.lobi) {
            try {
                const targetUser = await client.users.fetch(uid);
                await targetUser.send(`Senin rolün: **${oyun.roller[uid]}**`);
            } catch (e) {}
        }
        message.channel.send("✨ **Roller DM'den dağıtıldı!**");
        geceAsamasi(message.channel);
    }
});

async function geceAsamasi(channel) {
    channel.send("🌙 **Gece oldu...**");
    
    // Basit DM eylem simülasyonu
    setTimeout(() => {
        gunduzAsamasi(channel);
    }, 15000);
}

async function gunduzAsamasi(channel) {
    channel.send("☀️ **Gündüz oldu!** Oylama zamanı.");
    const row = new ActionRowBuilder();
    oyun.yasayanlar.forEach(id => {
        row.addComponents(new ButtonBuilder().setCustomId(`v_${id}`).setLabel(client.users.cache.get(id)?.username).setStyle(ButtonStyle.Primary));
    });
    row.addComponents(new ButtonBuilder().setCustomId('v_skip').setLabel('⏭️ Pas Geç').setStyle(ButtonStyle.Danger));
    
    const msg = await channel.send({ content: "Kimi asalım?", components: [row] });
    const col = msg.createMessageComponentCollector({ time: 20000 });
    
    col.on('end', () => {
        channel.send("⚖️ Oylama bitti.");
        if (oyunBittiKontrol(channel)) return;
        geceAsamasi(channel);
    });
}

function oyunBittiKontrol(channel) {
    const vampirler = oyun.yasayanlar.filter(id => oyun.roller[id] === 'Vampir');
    const koyuler = oyun.yasayanlar.filter(id => oyun.roller[id] !== 'Vampir');

    if (vampirler.length === 0 || vampirler.length >= koyuler.length) {
        let ozet = `\n\n🎭 **KİMLİKLER:**\n${oyun.lobi.map(id => `${oyun.roller[id]} -> <@${id}>`).join('\n')}`;
        channel.send(`🏁 **Oyun Bitti!**${ozet}`);
        oyun.aktif = false;
        return true;
    }
    return false;
}

client.login(process.env.DISCORD_TOKEN);
