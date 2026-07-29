const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildPresences
  ]
});

const PREFIX = '.';

// AFK kullanıcı verilerini tutan harita
const afkMap = new Map();

client.on('ready', () => {
  console.log(`Bot aktif: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // ==========================================
  // 1. AFK KONTROL SİSTEMİ
  // ==========================================
  
  // Mesaj atan kişi AFK ise, AFK modundan çıkar
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

  // Mesajda etiketlenen biri AFK ise, etiketleyen kişiye uyarısını geç
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

  // Özel Komut Kontrolü: -yardim
  if (message.content.toLowerCase() === '-yardim' || message.content.toLowerCase() === '-help') {
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('📖 RP Lig Bot Komutları')
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🛡️ Moderasyon Komutları', value: '`.ban @kullanıcı [sebep]` - Engeller\n`.banlist` - Numaralı engel listesi\n`.unban <id>` - Engeli kaldırır\n`.kick @kullanıcı` - Sunucudan atar\n`.mute @kullanıcı [dk]` - Susturur\n`.unmute @kullanıcı` - Susturmayı kaldırır\n`.afk [sebep]` - AFK moduna geçer\n`.mvp @kullanıcı` - Haftanın MVP\'sini seçer (Yetkili)\n`.sunucu` - Sunucu detaylı bilgilerini gösterir', inline: false },
        { name: '💰 Ekonomi', value: '`.bal (@kullanıcı)` - Bakiye görüntüle\n`.send @kullanıcı miktar` - Para gönder', inline: false },
        { name: '👑 Yetkili - Para', value: '`.paraekle @kullanıcı miktar` - Cash ekle\n`.paracikar @kullanıcı miktar` - Cash çıkar', inline: false },
        { name: '💎 Yetkili - Değer', value: '`.degerekle (@kullanıcı) miktar` - Değer ekle/ayarla', inline: false },
        { name: '⚽ Mini Oyunlar', value: '`.pen` - Penaltı at (saatlik)\n`.ant` - Antrenman yap (saatlik, 5/5 veya 10/10)\n`.kaleant` - Kaleci antrenmanı (saatlik)', inline: false },
        { name: '👟 Sistemler', value: '`.kramponal` - Krampon Satın al\n`.eldivenal` - Eldiven Satın al', inline: false },
        { name: '📋 Profil', value: '`.profil (@kullanıcı)` - Tüm istatistikleri gör', inline: false }
      )
      .setFooter({ text: 'RP Lig Sistemi | Miktarlarda k/m/b kısaltmaları kullanılabilir (2m = 2.000.000)' });

    return message.channel.send({ embeds: [embed] });
  }

  // Nokta (.) ile başlayan komutların kontrolü
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ==========================================
  // 2. KOMUTLAR
  // ==========================================

  // ------------------------------------------
  // .sunucu / .sunucubilgi (Herkes Bakabilir)
  // ------------------------------------------
  if (command === 'sunucu' || command === 'sunucubilgi' || command === 'server' || command === 'serverinfo') {
    try {
      const { guild } = message;
      
      // Kanal türlerini kategorize edelim
      const channels = guild.channels.cache;
      const metinKanallari = channels.filter(c => c.type === 0).size; // 0 = GUILD_TEXT
      const sesKanallari = channels.filter(c => c.type === 2).size;   // 2 = GUILD_VOICE
      const kategoriler = channels.filter(c => c.type === 4).size;    // 4 = GUILD_CATEGORY

      // Banlı sayısı (Eğer botun yetkisi yoksa 0 veya Hata vermemesi için korumalı)
      let banSayisi = 0;
      try {
        const bans = await guild.bans.fetch();
        banSayisi = bans.size;
      } catch (e) {
        banSayisi = 'Yetersiz Bot Yetkisi';
      }

      const sunucuEmbed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle(`📊 ${guild.name} - Sunucu Bilgileri`)
        .setThumbnail(guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL())
        .addFields(
          { name: '👑 Sunucu Sahibi', value: `<@${guild.ownerId}>`, inline: true },
          { name: '📅 Açılış Tarihi', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '👥 Üye Sayısı', value: `\`${guild.memberCount}\` Kullanıcı`, inline: true },
          
          { name: '🚀 Takviye (Boost)', value: `\`${guild.premiumSubscriptionCount || 0}\` Boost (Seviye ${guild.premiumTier})`, inline: true },
          { name: '🚫 Banlanan Üye', value: `\`${banSayisi}\` Yasaklı`, inline: true },
          { name: '🎭 Rol Sayısı', value: `\`${guild.roles.cache.size}\` Adet Rol`, inline: true },

          { name: '💬 Metin Kanalı', value: `\`${metinKanallari}\` Kanal`, inline: true },
          { name: '🔊 Ses Kanalı', value: `\`${sesKanallari}\` Kanal`, inline: true },
          { name: '📁 Kategori', value: `\`${kategoriler}\` Kategori`, inline: true }
        )
        .setFooter({ text: `Sunucu ID: ${guild.id}`, iconURL: guild.iconURL() })
        .setTimestamp();

      return message.channel.send({ embeds: [sunucuEmbed] });
    } catch (err) {
      console.error(err);
      return message.reply('Sunucu bilgileri çekilirken bir hata oluştu.');
    }
  }

  // ------------------------------------------
  // .mvp @kullanıcı (Yetkili Özel)
  // ------------------------------------------
  if (command === 'mvp') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames) && 
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Bu komutu kullanmak için yetkin yetersiz.');
    }

    const member = message.mentions.members.first();
    if (!member) return message.reply('Lütfen haftanın MVP\'si seçilecek oyuncuyu etiketleyin!');

    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle('🌟 HAFTANIN MVP\'Sİ Belli Oldu!')
      .setDescription(`Tebrikler ${member}! Bu haftanın en değerli oyuncusu (MVP) seçildin! 🏆⚽`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'RP Lig Yönetimi', iconURL: message.guild.iconURL() })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }

  // ------------------------------------------
  // .banlist (Embedlı & Numaralı & Max 10 Kişi)
  // ------------------------------------------
  if (command === 'banlist') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('❌ Bu komutu kullanmak için **Üyeleri Engelle** yetkisine sahip olmalısın.');
    }

    try {
      const bans = await message.guild.bans.fetch();
      if (bans.size === 0) {
        const bosEmbed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('📜 Engellenen Üyeler Listesi')
          .setDescription('Sunucuda yasaklanmış/engellenmiş üye bulunmuyor.')
          .setFooter({ text: `Toplam Ban: 0` });
        return message.channel.send({ embeds: [bosEmbed] });
      }

      const banArray = Array.from(bans.values()).slice(0, 10);
      const listeMetni = banArray.map((b, index) => {
        const sebep = b.reason ? `(Sebep: ${b.reason})` : '(Sebep belirtilmemiş)';
        return `**${index + 1}.** \`${b.user.tag}\` - ID: \`${b.user.id}\` ${sebep}`;
      }).join('\n');

      const banEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('📜 Engellenen Üyeler Listesi (İlk 10)')
        .setDescription(listeMetni)
        .setFooter({ text: `Sunucudaki Toplam Ban Sayısı: ${bans.size}` })
        .setTimestamp();

      return message.channel.send({ embeds: [banEmbed] });
    } catch (err) {
      console.error(err);
      return message.reply('Ban listesi alınırken bir hata oluştu.');
    }
  }

  // ------------------------------------------
  // .ban @kullanıcı [sebep]
  // ------------------------------------------
  if (command === 'ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('❌ Bu komutu kullanmak için **Üyeleri Engelle** yetkisine sahip olmalısın.');
    }

    const member = message.mentions.members.first();
    if (!member) return message.reply('Lütfen engellenecek bir üye etiketleyin.');
    if (!member.bannable) return message.reply('Bu üyeyi engellemek için yetkim yetersiz.');

    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';
    await member.ban({ reason });
    return message.channel.send(`🚫 **${member.user.tag}** sunucudan engellendi. (Sebep: ${reason})`);
  }

  // ------------------------------------------
  // .unban <kullanıcı_id>
  // ------------------------------------------
  if (command === 'unban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('❌ Bu komutu kullanmak için **Üyeleri Engelle** yetkisine sahip olmalısın.');
    }

    const userId = args[0];
    if (!userId) return message.reply('Lütfen yasağı kaldırılacak kişinin kullanıcı ID\'sini girin.');

    try {
      await message.guild.members.unban(userId);
      return message.channel.send(`✅ ID: \`${userId}\` olan kullanıcının yasağı kaldırıldı.`);
    } catch (err) {
      return message.reply('Kullanıcı bulunamadı veya zaten yasaklı değil.');
    }
  }

  // ------------------------------------------
  // .kick @kullanıcı [sebep]
  // ------------------------------------------
  if (command === 'kick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply('❌ Bu komutu kullanmak için **Üyeleri At** yetkisine sahip olmalısın.');
    }

    const member = message.mentions.members.first();
    if (!member) return message.reply('Lütfen atılacak bir üye etiketleyin.');
    if (!member.kickable) return message.reply('Bu üyeyi atmak için yetkim yetersiz.');

    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';
    await member.kick(reason);
    return message.channel.send(`👞 **${member.user.tag}** sunucudan atıldı. (Sebep: ${reason})`);
  }

  // ------------------------------------------
  // .mute @kullanıcı [dakika]
  // ------------------------------------------
  if (command === 'mute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('❌ Bu komutu kullanmak için **Üyelere Zaman Aşımı Uygula** yetkisine sahip olmalısın.');
    }

    const member = message.mentions.members.first();
    const duration = parseInt(args[1]) || 10;

    if (!member) return message.reply('Lütfen susturulacak bir üye etiketleyin.');
    if (!member.moderatable) return message.reply('Bu üyeyi susturmak için yetkim yetersiz.');

    await member.timeout(duration * 60 * 1000, 'Zaman aşımı uygulandı');
    return message.channel.send(`🔇 **${member.user.tag}**, **${duration} dakika** boyunca susturuldu.`);
  }

  // ------------------------------------------
  // .unmute @kullanıcı
  // ------------------------------------------
  if (command === 'unmute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('❌ Bu komutu kullanmak için **Üyelere Zaman Aşımı Uygula** yetkisine sahip olmalısın.');
    }

    const member = message.mentions.members.first();
    if (!member) return message.reply('Lütfen susturması kaldırılacak bir üye etiketleyin.');

    await member.timeout(null);
    return message.channel.send(`🔊 **${member.user.tag}** kullanıcısının susturması kaldırıldı.`);
  }

  // ------------------------------------------
  // .afk [sebep]
  // ------------------------------------------
  if (command === 'afk') {
    const reason = args.join(' ') || 'Sebep belirtilmedi';
    
    afkMap.set(message.author.id, {
      reason: reason,
      timestamp: Date.now()
    });

    const baslangicZamani = Math.floor(Date.now() / 1000);
    return message.reply(`💤 Başarıyla AFK moduna geçtin.\n💬 **Sebep:** ${reason}\n🕒 **Saat:** <t:${baslangicZamani}:t>`);
  }
});

client.login(process.env.TOKEN);
