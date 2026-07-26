const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans
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
  // 1. AFK KONTROL SİSTEMİ (Mesaj Atma & Etiketleme)
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

  // Mesajda etiketlenen biri AFK ise, etiketleyen kişiye uyarı ver
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

  // Özel Komut Kontrolü: -yardim (Prefix '.' olmasa da çalışması için)
  if (message.content.toLowerCase() === '-yardim' || message.content.toLowerCase() === '-help') {
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('📖 RP Lig Bot Komutları')
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🛡️ Moderasyon Komutları', value: '`.ban @kullanıcı [sebep]` - Engeller\n`.banlist` - Engel listesi\n`.unban <id>` - Engeli kaldırır\n`.kick @kullanıcı` - Sunucudan atar\n`.mute @kullanıcı [dk]` - Susturur\n` .mvp \n`.unmute @kullanıcı` - Susturmayı kaldırır\n`.afk [sebep]` - AFK moduna geçer', inline: false },
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

  // Diğer nokta (.) ile başlayan komutların kontrolü
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ==========================================
  // 2. MODERASYON KOMUTLARI
  // ==========================================

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
  // .banlist
  // ------------------------------------------
  if (command === 'banlist') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('❌ Bu komutu kullanmak için **Üyeleri Engelle** yetkisine sahip olmalısın.');
    }

    try {
      const bans = await message.guild.bans.fetch();
      if (bans.size === 0) return message.reply('Sunucuda engellenmiş kimse yok.');

      const list = bans.map(b => `• **${b.user.tag}** (ID: ${b.user.id})`).slice(0, 20).join('\n');
      return message.channel.send(`📜 **Engellenen Üyeler Listesi (${bans.size}):**\n${list}`);
    } catch (err) {
      return message.reply('Ban listesi alınırken bir hata oluştu.');
    }
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
