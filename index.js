const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  PermissionsBitField, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const PREFIX = '.';

// 🎯 YETKİLİ ROL ID'Sİ
const YETKILI_ROL_ID = '1532424266690203769';

// Veri Haritaları
const afkMap = new Map();
const activeGiveaways = new Map();
const warnMap = new Map(); // Kullanıcı uyarıları

client.on('ready', () => {
  console.log(`Bot aktif: ${client.user.tag}`);
});

// Yetki Kontrol Fonksiyonu
function hasAuth(member) {
  if (!member) return false;
  return (
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    member.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
    member.roles.cache.has(YETKILI_ROL_ID)
  );
}

// Süre Dönüştürücü
function parseDuration(durationStr) {
  if (!durationStr) return null;
  const match = durationStr.match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // ==========================================
  // 1. AFK KONTROL
  // ==========================================
  if (afkMap.has(message.author.id)) {
    const afkData = afkMap.get(message.author.id);
    afkMap.delete(message.author.id);

    const afkOlmaZamani = Math.floor(afkData.timestamp / 1000);
    const donusZamani = Math.floor(Date.now() / 1000);

    message.reply(
      `👋 Hoş geldin **${message.author.username}**! AFK modundan çıkarıldın.\n` +
      `🕒 **AFK Olma Saati:** <t:${afkOlmaZamani}:t> (<t:${afkOlmaZamani}:R>)\n` +
      `⏰ **Geri Dönüş Saati:** <t:${donusZamani}:t>\n` +
      `💬 **Sebep:** ${afkData.reason}`
    );
  }

  if (message.mentions.members.size > 0) {
    message.mentions.members.forEach((member) => {
      if (afkMap.has(member.id)) {
        const afkData = afkMap.get(member.id);
        const afkOlmaZamani = Math.floor(afkData.timestamp / 1000);

        message.reply(
          `💤 **${member.user.username}** şu anda AFK!\n` +
          `💬 **Sebep:** ${afkData.reason}\n` +
          `🕒 **Ne Zaman AFK Oldu:** <t:${afkOlmaZamani}:t> (<t:${afkOlmaZamani}:R>)`
        );
      }
    });
  }

  // Nokta (.) kontrolü
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ==========================================
  // 2. KANAL BİLDİRİMİ KOMUTU
  // ==========================================
  if (command === 'kanalbildir' || command === 'kanalbildirim' || command === 'duyuru') {
    if (!hasAuth(message.member)) {
      return message.reply('❌ Uyarı kanka, bu komut için yetkin yok!');
    }

    const channel = message.mentions.channels.first();
    const notificationText = args.slice(1).join(' ');

    if (!channel || !notificationText) {
      return message.reply('⚠️ **Uyarı kanka!** Lütfen bir kanal etiketle ve göndereceğin mesajı yaz.\n**Doğru Kullanım:** `.kanalbildir #kanal <mesajınız>`');
    }

    const notifyEmbed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('📢 RP LİGİ BİLDİRİMİ')
      .setDescription(notificationText)
      .setFooter({ text: `Yönetim Bildirimi | Gönderen: ${message.author.tag}` })
      .setTimestamp();

    await channel.send({ embeds: [notifyEmbed] });
    return message.reply(`✅ Bildirim başarıyla ${channel} kanalına gönderildi.`);
  }

  // ==========================================
  // 3. UYARI SİSTEMİ KOMUTLARI
  // ==========================================

  // .uyari @kullanici [sebep]
  if (command === 'uyari' || command === 'warn') {
    if (!hasAuth(message.member)) {
      return message.reply('❌ Uyarı kanka, bu komut için yetkin yok!');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('⚠️ **Uyarı kanka!** Kimi uyaracağını etiketlemelisin.\n**Doğru Kullanım:** `.uyari @kullanici <sebep>`');
    }

    if (member.id === message.author.id) {
      return message.reply('⚠️ Uyarı kanka, kendini uyaramazsın!');
    }

    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    if (!warnMap.has(member.id)) {
      warnMap.set(member.id, []);
    }

    const userWarns = warnMap.get(member.id);
    const warnObj = {
      id: userWarns.length + 1,
      reason: reason,
      moderator: message.author.tag,
      date: Math.floor(Date.now() / 1000)
    };

    userWarns.push(warnObj);

    try {
      await member.send(`⚠️ **${message.guild.name}** sunucusunda uyarıldın!\n💬 **Sebep:** ${reason}\n👮‍♂️ **Yetkili:** ${message.author.tag}`);
    } catch (e) {}

    const embed = new EmbedBuilder()
      .setColor('#e67e22')
      .setTitle('⚠️ Üye Uyarıldı')
      .addFields(
        { name: '👤 Uyarılan Üye', value: `${member} (\`${member.id}\`)`, inline: true },
        { name: '👮‍♂️ Yetkili', value: `${message.author}`, inline: true },
        { name: '📊 Toplam Uyarı', value: `\`${userWarns.length}\``, inline: true },
        { name: '💬 Sebep', value: reason, inline: false }
      )
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }

  // .uyarisil @kullanici [uyari_id]
  if (command === 'uyarisil' || command === 'unwarn') {
    if (!hasAuth(message.member)) {
      return message.reply('❌ Uyarı kanka, bu komut için yetkin yok!');
    }

    const member = message.mentions.members.first();
    const warnId = parseInt(args[1]);

    if (!member || isNaN(warnId)) {
      return message.reply('⚠️ **Uyarı kanka!** Lütfen bir kullanıcı etiketle ve silinecek uyarı ID\'sini gir.\n**Doğru Kullanım:** `.uyarisil @kullanici <uyari_id>`');
    }

    const userWarns = warnMap.get(member.id);
    if (!userWarns || userWarns.length === 0) {
      return message.reply('❌ Uyarı kanka, bu kullanıcının silinecek hiç uyarısı yok ki!');
    }

    const index = userWarns.findIndex(w => w.id === warnId);
    if (index === -1) {
      return message.reply(`❌ Uyarı kanka, bu kullanıcının **#${warnId}** ID'li bir uyarısı bulunamadı.`);
    }

    userWarns.splice(index, 1);
    return message.channel.send(`✅ **${member.user.tag}** kullanıcısının **#${warnId}** numaralı uyarısı silindi.`);
  }

  // .uyarilar (Kullanıcının kendi uyarılarını veya etiketlenen kişinin uyarılarını görmesi için)
  if (command === 'uyarilar' || command === 'uyarim') {
    const targetMember = message.mentions.members.first() || message.member;
    const userWarns = warnMap.get(targetMember.id);

    if (!userWarns || userWarns.length === 0) {
      return message.reply(`✅ ${targetMember.id === message.author.id ? 'Hiç uyarın yok!' : 'Bu kullanıcının hiç uyarısı yok.'}`);
    }

    const description = userWarns.map(w => {
      return `🆔 **Uyarı ID:** #${w.id}\n💬 **Sebep:** ${w.reason}\n👮‍♂️ **Yetkili:** \`${w.moderator}\` (<t:${w.date}:R>)`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle(`📜 ${targetMember.user.username} - Uyarı Listesi`)
      .setDescription(description)
      .setFooter({ text: `Toplam Uyarı: ${userWarns.length}` })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // .uyarilist / .uyarilistesi (Tüm sunucu uyarıları - Yetkili komutu)
  if (command === 'uyarilist' || command === 'uyarilistesi') {
    if (!hasAuth(message.member)) {
      return message.reply('❌ Uyarı kanka, bu komut için yetkin yok!');
    }

    let allWarns = [];
    warnMap.forEach((warns, userId) => {
      warns.forEach(w => {
        allWarns.push({
          userId: userId,
          ...w
        });
      });
    });

    if (allWarns.length === 0) {
      return message.reply('✅ Sunucuda kayıtlı aktif uyarı bulunmuyor.');
    }

    const pageSize = 5;
    const totalPages = Math.ceil(allWarns.length / pageSize);
    let currentPage = 0;

    const generateEmbed = (page) => {
      const start = page * pageSize;
      const currentWarns = allWarns.slice(start, start + pageSize);

      const description = currentWarns.map((w, index) => {
        return `**${start + index + 1}.** <@${w.userId}> (\`${w.userId}\`)\n` +
               `┗ 🆔 **Uyarı ID:** #${w.id} | 💬 **Sebep:** ${w.reason}\n` +
               `┗ 👮‍♂️ **Yetkili:** \`${w.moderator}\` (<t:${w.date}:R>)`;
      }).join('\n\n');

      return new EmbedBuilder()
        .setColor('#f1c40f')
        .setTitle(`📜 Sunucu Uyarı Listesi`)
        .setDescription(description)
        .setFooter({ text: `Sayfa ${page + 1} / ${totalPages} | Toplam Uyarı: ${allWarns.length}` })
        .setTimestamp();
    };

    const getRow = (page) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('◀️ Geri')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('İleri ▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1)
      );
    };

    const listMessage = await message.channel.send({
      embeds: [generateEmbed(currentPage)],
      components: [getRow(currentPage)]
    });

    const collector = listMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: '❌ Bu butonları sadece komutu yazan kullanabilir.', ephemeral: true });
      }

      if (interaction.customId === 'prev_page') {
        currentPage--;
      } else if (interaction.customId === 'next_page') {
        currentPage++;
      }

      await interaction.update({
        embeds: [generateEmbed(currentPage)],
        components: [getRow(currentPage)]
      });
    });

    collector.on('end', () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prev').setLabel('◀️ Geri').setStyle(ButtonStyle.Primary).setDisabled(true),
        new ButtonBuilder().setCustomId('next').setLabel('İleri ▶️').setStyle(ButtonStyle.Primary).setDisabled(true)
      );
      listMessage.edit({ components: [disabledRow] }).catch(() => {});
    });

    return;
  }

  // .cekilis
  if (command === 'cekilis' || command === 'çekiliş') {
    if (!hasAuth(message.member)) {
      return message.reply('❌ Uyarı kanka, bu komut için yetkin yok!');
    }

    const sureStr = args[0];
    const kazananSayisi = parseInt(args[1]);
    const odul = args.slice(2).join(' ');

    if (!sureStr || !kazananSayisi || isNaN(kazananSayisi) || !odul) {
      return message.reply('⚠️ **Uyarı kanka!** Çekiliş başlatmak için tüm alanları doldurmalısın.\n**Örnek:** `.cekilis 10m 1 VIP Rolü`');
    }

    const sureMs = parseDuration(sureStr);
    if (!sureMs) return message.reply('❌ Geçersiz süre! Örnekler: `10s`, `15m`, `2h`, `1d`');

    const bitisZamani = Math.floor((Date.now() + sureMs) / 1000);

    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle(`🎉 ÇEKİLİŞ: ${odul}`)
      .setDescription(
        `Çekilişe katılmak için aşağıdaki **🎉** tepkisine tıklayın!\n\n` +
        `🎁 **Ödül:** ${odul}\n` +
        `👑 **Düzenleyen:** ${message.author}\n` +
        `🏆 **Kazanan Sayısı:** ${kazananSayisi}\n` +
        `⏰ **Bitiş:** <t:${bitisZamani}:R>`
      );

    const giveawayMsg = await message.channel.send({ embeds: [embed] });
    await giveawayMsg.react('🎉');

    const timeout = setTimeout(async () => {
      activeGiveaways.delete(giveawayMsg.id);

      try {
        const fetchedMsg = await message.channel.messages.fetch(giveawayMsg.id);
        const reaction = fetchedMsg.reactions.cache.get('🎉');

        if (!reaction) return;

        const users = await reaction.users.fetch();
        const katilanlar = users.filter(u => !u.bot);

        if (katilanlar.size === 0) {
          const bittiEmbed = EmbedBuilder.from(embed).setColor('#e74c3c').setDescription('❌ Yeterli katılım olmadığı için çekiliş iptal edildi.');
          return fetchedMsg.edit({ embeds: [bittiEmbed] });
        }

        const katilanArray = Array.from(katilanlar.values());
        const kazananlar = [];

        for (let i = 0; i < Math.min(kazananSayisi, katilanArray.length); i++) {
          const randomIndex = Math.floor(Math.random() * katilanArray.length);
          kazananlar.push(katilanArray.splice(randomIndex, 1)[0]);
        }

        const kazananMetni = kazananlar.map(k => `${k}`).join(', ');
        const bittiEmbed = EmbedBuilder.from(embed).setColor('#2ecc71').setDescription(`🎉 **KAZANAN(LAR):** ${kazananMetni}`);

        await fetchedMsg.edit({ embeds: [bittiEmbed] });
        await message.channel.send(`🎊 Tebrikler ${kazananMetni}! **${odul}** kazandınız!`);
      } catch (e) {
        console.error(e);
      }
    }, sureMs);

    activeGiveaways.set(giveawayMsg.id, timeout);
  }

  // .afk
  if (command === 'afk') {
    const reason = args.join(' ') || 'Sebep belirtilmedi';
    afkMap.set(message.author.id, { reason, timestamp: Date.now() });
    return message.reply(`💤 AFK moduna geçtin. Sebep: **${reason}**`);
  }
}); 

client.login(process.env.TOKEN);
