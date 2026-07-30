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

// YETKİLİ ROL VE LOG KANAL ID'LERİ
const YETKILI_ROL_ID = '1532424266690203769';
const UYARI_LOG_KANAL_ID = '1532424266690203769'; 

// Veri Haritaları
const afkMap = new Map();
const activeGiveaways = new Map();
const warnMap = new Map();

client.on('ready', () => {
  console.log(`Bot basariyla aktif oldu: ${client.user.tag}`);
});

// Yetki Kontrolü
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

  // AFK Kontrol
  if (afkMap.has(message.author.id)) {
    const afkData = afkMap.get(message.author.id);
    afkMap.delete(message.author.id);
    message.reply(`Hos geldin **${message.author.username}**! AFK modundan cikarildin. (Sebep: ${afkData.reason})`);
  }

  if (message.mentions.members.size > 0) {
    message.mentions.members.forEach((member) => {
      if (afkMap.has(member.id)) {
        const afkData = afkMap.get(member.id);
        message.reply(`**${member.user.username}** su anda AFK! Sebep: ${afkData.reason}`);
      }
    });
  }

  // ==========================================
  // YARDIM MENÜSÜ (-yardim veya .yardim)
  // ==========================================
  if (
    message.content.toLowerCase() === '-yardim' || 
    message.content.toLowerCase() === '.yardim' || 
    message.content.toLowerCase() === '-help'
  ) {
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('RP Lig Bot Komutlari')
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { 
          name: 'Moderasyon Komutlari', 
          value: 
            '`.ban @kullanici [sebep]` - Engeller\n' +
            '`.banlist` - Numarali engel listesi\n' +
            '`.unban <id>` - Engeli kaldirir\n' +
            '`.kick @kullanici` - Sunucudan atar\n' +
            '`.mute @kullanici [dk]` - Susturur\n' +
            '`.unmute @kullanici` - Susturmayi kaldirir\n' +
            '`.afk [sebep]` - AFK moduna gecer\n' +
            '`.mvp @kullanici` - MVP secer\n' +
            '`.sunucu` - Sunucu bilgilerini gosterir', 
          inline: false 
        },
        { 
          name: 'Bildirim & Uyari Komutlari', 
          value: 
            '`.kanalbildir #kanal <mesaj>` - Belirtilen kanala duyuru atar (Yetkili)\n' +
            '`.uyari @kullanici [sebep]` - Uyari verir (Yetkili)\n' +
            '`.uyarilar (@kullanici)` - Kullanicinin uyarilarini gosterir\n' +
            '`.uyarisil @kullanici [id]` - Uyari siler (Yetkili)\n' +
            '`.uyarilist` - Tum sunucu uyarilarini butonlu listeler (Yetkili)', 
          inline: false 
        },
        { 
          name: 'Cekilis Komutlari', 
          value: 
            '`.cekilis <sure> <kazanan> <odul>` - Cekilis baslatir (Yetkili)\n' +
            '`.cekilisiptal <mesaj_id>` - Cekilisi iptal eder (Yetkili)', 
          inline: false 
        },
        { 
          name: 'Ekonomi', 
          value: 
            '`.bal (@kullanici)` - Bakiye goruntule\n' +
            '`.send @kullanici miktar` - Para gonder', 
          inline: false 
        },
        { 
          name: 'Yetkili - Para', 
          value: 
            '`.paraekle @kullanici miktar` - Cash ekle\n' +
            '`.paracikar @kullanici miktar` - Cash cikar', 
          inline: false 
        },
        { 
          name: 'Yetkili - Deger', 
          value: 
            '`.degerekle (@kullanici) miktar` - Deger ekle/ayarla', 
          inline: false 
        },
        { 
          name: 'Mini Oyunlar', 
          value: 
            '`.pen` - Penalti at\n' +
            '`.ant` - Antrenman yap\n' +
            '`.kaleant` - Kaleci antrenmani', 
          inline: false 
        },
        { 
          name: 'Sistemler', 
          value: 
            '`.kramponal` - Krampon Satin al\n' +
            '`.eldivenal` - Eldiven Satin al', 
          inline: false 
        },
        { 
          name: 'Profil', 
          value: 
            '`.profil (@kullanici)` - Tum istatistikleri gor', 
          inline: false 
        }
      )
      .setFooter({ text: 'RP Lig Sistemi | Miktarlarda k/m/b kisaltmalari kullanilabilir' });

    return message.channel.send({ embeds: [embed] });
  }

  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ==========================================
  // KANAL BİLDİRİMİ KOMUTU
  // ==========================================
  if (command === 'kanalbildir' || command === 'duyuru') {
    if (!hasAuth(message.member)) return message.reply('Uyari kanka, bu komut icin yetkin yok!');

    const channel = message.mentions.channels.first();
    const notificationText = args.slice(1).join(' ');

    if (!channel || !notificationText) {
      return message.reply('Uyari kanka! Lutfen bir kanal etiketle ve gonderecegin mesaji yaz.\nDogru Kullanim: `.kanalbildir #kanal <mesajiniz>`');
    }

    const notifyEmbed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('RP LIGI BILDIRIMI')
      .setDescription(notificationText)
      .setFooter({ text: `Yonetim Bildirimi | Gonderen: ${message.author.tag}` })
      .setTimestamp();

    await channel.send({ embeds: [notifyEmbed] });
    return message.reply(`Bildirim basariyla ${channel} kanalina gonderildi.`);
  }

  // ==========================================
  // UYARI SİSTEMİ (LOGOSUZ VE EMOJİSİZ)
  // ==========================================

  // .uyari @kullanici [sebep]
  if (command === 'uyari' || command === 'warn') {
    if (!hasAuth(message.member)) return message.reply('Uyari kanka, bu komut icin yetkin yok!');

    const member = message.mentions.members.first();
    if (!member) return message.reply('Uyari kanka! Kimi uyaracagini etiketlemelisin.\nDogru Kullanim: `.uyari @kullanici <sebep>`');
    if (member.id === message.author.id) return message.reply('Uyari kanka, kendini uyaramazsin!');

    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    if (!warnMap.has(member.id)) warnMap.set(member.id, []);
    const userWarns = warnMap.get(member.id);

    const warnObj = {
      id: userWarns.length + 1,
      reason: reason,
      moderator: message.author.tag,
      date: Math.floor(Date.now() / 1000)
    };

    userWarns.push(warnObj);

    // Kullanıcıya DM
    try {
      await member.send(`${message.guild.name} sunucusunda uyarildin!\nSebep: ${reason}\nYetkili: ${message.author.tag}`);
    } catch (e) {}

    const embed = new EmbedBuilder()
      .setColor('#e67e22')
      .setTitle('Uye Uyarildi')
      .addFields(
        { name: 'Uyarilan Uye', value: `${member} (${member.id})`, inline: true },
        { name: 'Yetkili', value: `${message.author}`, inline: true },
        { name: 'Toplam Uyari', value: `${userWarns.length}`, inline: true },
        { name: 'Sebep', value: reason, inline: false }
      )
      .setTimestamp();

    // Log Kanalına Gönder
    const logChannel = message.guild.channels.cache.get(UYARI_LOG_KANAL_ID);
    if (logChannel) {
      logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    return message.channel.send({ embeds: [embed] });
  }

  // .uyarilar @kullanici
  if (command === 'uyarilar' || command === 'uyarim') {
    const targetMember = message.mentions.members.first() || message.member;
    const userWarns = warnMap.get(targetMember.id);

    if (!userWarns || userWarns.length === 0) {
      return message.reply(`${targetMember.id === message.author.id ? 'Hic uyarin yok!' : 'Bu kullanicinin hic uyarisi yok.'}`);
    }

    const description = userWarns.map(w => `Uyari ID: #${w.id}\nSebep: ${w.reason}\nYetkili: ${w.moderator} (<t:${w.date}:R>)`).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle(`${targetMember.user.username} - Uyari Listesi`)
      .setDescription(description)
      .setFooter({ text: `Toplam Uyari: ${userWarns.length}` });

    return message.reply({ embeds: [embed] });
  }

  // .uyarisil @kullanici [id]
  if (command === 'uyarisil' || command === 'unwarn') {
    if (!hasAuth(message.member)) return message.reply('Uyari kanka, bu komut icin yetkin yok!');

    const member = message.mentions.members.first();
    const warnId = parseInt(args[1]);

    if (!member || isNaN(warnId)) {
      return message.reply('Uyari kanka! Lutfen bir kullanici etiketle ve silinecek uyari ID\'sini gir.\nDogru Kullanim: `.uyarisil @kullanici <uyari_id>`');
    }

    const userWarns = warnMap.get(member.id);
    if (!userWarns || userWarns.length === 0) return message.reply('Uyari kanka, bu kullanicinin hic uyarisi yok ki!');

    const index = userWarns.findIndex(w => w.id === warnId);
    if (index === -1) return message.reply(`Uyari kanka, bu kullanicinin #${warnId} ID'li bir uyarisi bulunamadi.`);

    userWarns.splice(index, 1);
    
    // Log Kanalına Silindi Bilgisi At
    const logChannel = message.guild.channels.cache.get(UYARI_LOG_KANAL_ID);
    if (logChannel) {
      logChannel.send(`Uyari Silindi: ${member.user.tag} kullanicisinin #${warnId} numarali uyarisi ${message.author.tag} tarafindan silindi.`).catch(() => {});
    }

    return message.channel.send(`${member.user.tag} kullanicisinin #${warnId} numarali uyarisi silindi.`);
  }

  // .uyarilist
  if (command === 'uyarilist' || command === 'uyarilistesi') {
    if (!hasAuth(message.member)) return message.reply('Uyari kanka, bu komut icin yetkin yok!');

    let allWarns = [];
    warnMap.forEach((warns, userId) => {
      warns.forEach(w => allWarns.push({ userId, ...w }));
    });

    if (allWarns.length === 0) return message.reply('Sunucuda kayitli aktif uyari bulunmuyor.');

    const pageSize = 5;
    const totalPages = Math.ceil(allWarns.length / pageSize);
    let currentPage = 0;

    const generateEmbed = (page) => {
      const start = page * pageSize;
      const currentWarns = allWarns.slice(start, start + pageSize);

      const description = currentWarns.map((w, index) => {
        return `${start + index + 1}. <@${w.userId}>\n` +
               `Uyari ID: #${w.id} | Sebep: ${w.reason}\n` +
               `Yetkili: ${w.moderator} (<t:${w.date}:R>)`;
      }).join('\n\n');

      return new EmbedBuilder()
        .setColor('#f1c40f')
        .setTitle('Sunucu Uyari Listesi')
        .setDescription(description)
        .setFooter({ text: `Sayfa ${page + 1} / ${totalPages} | Toplam Uyari: ${allWarns.length}` });
    };

    const getRow = (page) => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev_page').setLabel('Geri').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
      new ButtonBuilder().setCustomId('next_page').setLabel('Ileri').setStyle(ButtonStyle.Primary).setDisabled(page === totalPages - 1)
    );

    const listMessage = await message.channel.send({ embeds: [generateEmbed(currentPage)], components: [getRow(currentPage)] });
    const collector = listMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: 'Bu butonlari sadece komutu yazan kullanabilir.', ephemeral: true });
      }

      if (interaction.customId === 'prev_page') currentPage--;
      else if (interaction.customId === 'next_page') currentPage++;

      await interaction.update({ embeds: [generateEmbed(currentPage)], components: [getRow(currentPage)] });
    });

    return;
  }

  // ==========================================
  // ÇEKİLİŞ KOMUTU
  // ==========================================
  if (command === 'cekilis' || command === 'çekiliş') {
    if (!hasAuth(message.member)) return message.reply('Uyari kanka, bu komut icin yetkin yok!');

    const sureStr = args[0];
    const kazananSayisi = parseInt(args[1]);
    const odul = args.slice(2).join(' ');

    if (!sureStr || !kazananSayisi || isNaN(kazananSayisi) || !odul) {
      return message.reply('Uyari kanka! Cekilis baslatmak icin tum alanlari doldurmalisin.\nOrnek: `.cekilis 10m 1 VIP Rolu`');
    }

    const sureMs = parseDuration(sureStr);
    if (!sureMs) return message.reply('Gecersiz sure! Ornekler: `10s`, `15m`, `2h`');

    const bitisZamani = Math.floor((Date.now() + sureMs) / 1000);

    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle(`CEKILIS: ${odul}`)
      .setDescription(
        `Cekilise katilmak icin 🎉 tepkisine tiklayin!\n\n` +
        `Odul: ${odul}\n` +
        `Duzenleyen: ${message.author}\n` +
        `Kazanan Sayisi: ${kazananSayisi}\n` +
        `Bitis: <t:${bitisZamani}:R>`
      );

    const giveawayMsg = await message.channel.send({ embeds: [embed] });
    await giveawayMsg.react('🎉');

    setTimeout(async () => {
      try {
        const fetchedMsg = await message.channel.messages.fetch(giveawayMsg.id);
        const reaction = fetchedMsg.reactions.cache.get('🎉');
        if (!reaction) return;

        const users = await reaction.users.fetch();
        const katilanlar = users.filter(u => !u.bot);

        if (katilanlar.size === 0) {
          return fetchedMsg.edit({ embeds: [EmbedBuilder.from(embed).setColor('#e74c3c').setDescription('Cekilis katilim olmadigi icin iptal edildi.')] });
        }

        const katilanArray = Array.from(katilanlar.values());
        const kazananlar = [];

        for (let i = 0; i < Math.min(kazananSayisi, katilanArray.length); i++) {
          const randomIndex = Math.floor(Math.random() * katilanArray.length);
          kazananlar.push(katilanArray.splice(randomIndex, 1)[0]);
        }

        const kazananMetni = kazananlar.map(k => `${k}`).join(', ');
        await fetchedMsg.edit({ embeds: [EmbedBuilder.from(embed).setColor('#2ecc71').setDescription(`KAZANAN(LAR): ${kazananMetni}`)] });
        await message.channel.send(`Tebrikler ${kazananMetni}! **${odul}** kazandiniz!`);
      } catch (e) {}
    }, sureMs);
  }

  // AFK KOMUTU
  if (command === 'afk') {
    const reason = args.join(' ') || 'Sebep belirtilmedi';
    afkMap.set(message.author.id, { reason, timestamp: Date.now() });
    return message.reply(`AFK moduna gectin. Sebep: **${reason}**`);
  }
});

client.login(process.env.TOKEN);
