const { 
  Client, 
  GatewayIntentBits, 
  PermissionsBitField, 
  EmbedBuilder, 
  SlashCommandBuilder, 
  REST, 
  Routes 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessageReactions
  ]
});

const PREFIX = '.';

// AFK verilerini ve aktif çekilişleri tutan yapılar
const afkMap = new Map();
const activeGiveaways = new Map(); // Çekiliş iptal kontrolü için

// ------------------------------------------
// Slash Komut Tanımlaması (/cekilis)
// ------------------------------------------
const commands = [
  new SlashCommandBuilder()
    .setName('cekilis')
    .setDescription('Sunucuda yeni bir çekiliş başlatır.')
    .addStringOption(option =>
      option.setName('odul')
        .setDescription('Çekiliş ödülü (Örn: 1m owo)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sure')
        .setDescription('Süre (Örn: 10s = 10sn, 10m = 10dk, 2h = 2saat, 1d = 1gün)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('kazanan_sayisi')
        .setDescription('Kaç kişi kazanacak?')
        .setRequired(true))
];

client.on('ready', async () => {
  console.log(`Bot aktif: ${client.user.tag}`);

  // Slash komutlarını Discord API'ye otomatik kaydetme
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    console.log('Slash komutları kaydediliyor...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    console.log('Slash komutları başarıyla kaydedildi!');
  } catch (error) {
    console.error('Slash komutu yüklenirken hata oluştu:', error);
  }
});

// Süre metnini milisaniyeye çeviren yardımcı fonksiyon
function parseDuration(durationStr) {
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

// ==========================================
// 1. SLASH KOMUT DİNLEYİCİSİ (/cekilis)
// ==========================================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'cekilis') {
    // Yetki Kontrolü: Sunucuyu Yönet (Manage Guild)
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.reply({ 
        content: '❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın!', 
        ephemeral: true 
      });
    }

    const odul = interaction.options.getString('odul');
    const sureStr = interaction.options.getString('sure');
    const kazananSayisi = interaction.options.getInteger('kazanan_sayisi');

    const sureMs = parseDuration(sureStr);
    if (!sureMs) {
      return interaction.reply({ 
        content: '❌ Geçersiz süre formatı! Örnekler: `10s` (10 saniye), `15m` (15 dakika), `2h` (2 saat), `1d` (1 gün)', 
        ephemeral: true 
      });
    }

    const bitisZamani = Math.floor((Date.now() + sureMs) / 1000);

    const embed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle(`🎉 ÇEKİLİŞ: ${odul}`)
      .setDescription(
        `Çekilişe katılmak için aşağıdaki **🎉** butonuna tıklayın!\n\n` +
        `🎁 **Ödül:** ${odul}\n` +
        `👑 **Düzenleyen:** ${interaction.user}\n` +
        `🏆 **Kazanan Sayısı:** ${kazananSayisi}\n` +
        `⏰ **Bitiş Zamanı:** <t:${bitisZamani}:R> (<t:${bitisZamani}:f>)`
      )
      .setFooter({ text: 'Çekiliş Başladı!' })
      .setTimestamp(Date.now() + sureMs);

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });
    await message.react('🎉');

    // Çekiliş zamanlayıcısını başlat ve kaydet
    const timeout = setTimeout(async () => {
      activeGiveaways.delete(message.id);

      // Mesajı tekrar çekip tepkileri kontrol et
      const fetchedMessage = await interaction.channel.messages.fetch(message.id).catch(() => null);
      if (!fetchedMessage) return;

      const reaction = fetchedMessage.reactions.cache.get('🎉');
      if (!reaction) return;

      const users = await reaction.users.fetch();
      const katilanlar = users.filter(u => !u.bot);

      if (katilanlar.size === 0) {
        const iptalEmbed = EmbedBuilder.from(embed)
          .setColor('#e74c3c')
          .setDescription(`❌ Çekiliş sona erdi ancak yeterli katılım olmadığı için kazanan belirlenemedi.`)
          .setFooter({ text: 'Çekiliş Bitti' });
        return fetchedMessage.edit({ embeds: [iptalEmbed] });
      }

      // Random Kazanan Seçimi
      const katilanArray = Array.from(katilanlar.values());
      const kazananlar = [];

      for (let i = 0; i < Math.min(kazananSayisi, katilanArray.length); i++) {
        const randomIndex = Math.floor(Math.random() * katilanArray.length);
        kazananlar.push(katilanArray.splice(randomIndex, 1)[0]);
      }

      const kazananMetni = kazananlar.map(k => `${k}`).join(', ');

      const bittiEmbed = EmbedBuilder.from(embed)
        .setColor('#2ecc71')
        .setDescription(
          `🎉 **ÇEKİLİŞ SONUÇLANDI!**\n\n` +
          `🎁 **Ödül:** ${odul}\n` +
          `🏆 **Kazanan(lar):** ${kazananMetni}\n` +
          `👑 **Düzenleyen:** ${interaction.user}`
        )
        .setFooter({ text: 'Çekiliş Sona Erdi' });

      await fetchedMessage.edit({ embeds: [bittiEmbed] });
      await interaction.channel.send(`🎊 Tebrikler ${kazananMetni}! **${odul}** çekilişini kazandınız!`);

    }, sureMs);

    activeGiveaways.set(message.id, timeout);
  }
});

// ==========================================
// 2. MESAJ DİNLEYİCİSİ (AFK, .cekilisiptal vb.)
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // AFK Kontrolü (Geri Dönüş)
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

  // AFK Etiket Kontrolü
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

  // -yardim
  if (message.content.toLowerCase() === '-yardim' || message.content.toLowerCase() === '-help') {
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('📖 RP Lig Bot Komutları')
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🛡️ Moderasyon Komutları', value: '`.ban @kullanıcı [sebep]` - Engeller\n`.banlist` - Numaralı engel listesi\n`.unban <id>` - Engeli kaldırır\n`.kick @kullanıcı` - Sunucudan atar\n`.mute @kullanıcı [dk]` - Susturur\n`.unmute @kullanıcı` - Susturmayı kaldırır\n`.afk [sebep]` - AFK moduna geçer\n`.mvp @kullanıcı` - MVP seçer\n`.sunucu` - Sunucu bilgilerini gösterir', inline: false },
        { name: '🎉 Çekiliş Komutları', value: '`/cekilis` - Çekiliş başlatır (Yetkili)\n`.cekilisiptal <mesaj_id>` - Çekilişi iptal eder (Yetkili)', inline: false },
        { name: '💰 Ekonomi', value: '`.bal (@kullanıcı)` - Bakiye görüntüle\n`.send @kullanıcı miktar` - Para gönder', inline: false },
        { name: '👑 Yetkili - Para', value: '`.paraekle @kullanıcı miktar` - Cash ekle\n`.paracikar @kullanıcı miktar` - Cash çıkar', inline: false },
        { name: '💎 Yetkili - Değer', value: '`.degerekle (@kullanıcı) miktar` - Değer ekle/ayarla', inline: false },
        { name: '⚽ Mini Oyunlar', value: '`.pen` - Penaltı at\n`.ant` - Antrenman yap\n`.kaleant` - Kaleci antrenmanı', inline: false },
        { name: '👟 Sistemler', value: '`.kramponal` - Krampon Satın al\n`.eldivenal` - Eldiven Satın al', inline: false },
        { name: '📋 Profil', value: '`.profil (@kullanıcı)` - Tüm istatistikleri gör', inline: false }
      )
      .setFooter({ text: 'RP Lig Sistemi | Miktarlarda k/m/b kısaltmaları kullanılabilir' });

    return message.channel.send({ embeds: [embed] });
  }

  // Nokta (.) kontrolleri
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ------------------------------------------
  // .cekilisiptal <mesaj_id> (Yetkili Özel)
  // ------------------------------------------
  if (command === 'cekilisiptal' || command === 'çekilişiptal') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.reply('❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın.');
    }

    const targetMessageId = args[0];
    if (!targetMessageId) {
      return message.reply('Lütfen iptal edilecek çekiliş mesajının ID\'sini girin. (Örn: `.cekilisiptal 123456789012345678`)');
    }

    if (!activeGiveaways.has(targetMessageId)) {
      return message.reply('Bu ID\'ye sahip aktif bir çekiliş bulunamadı veya çekiliş zaten sona ermiş.');
    }

    // Zamanlayıcıyı durdur
    clearTimeout(activeGiveaways.get(targetMessageId));
    activeGiveaways.delete(targetMessageId);

    try {
      const targetMsg = await message.channel.messages.fetch(targetMessageId);
      const iptalEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('🚫 ÇEKİLİŞ İPTAL EDİLDİ')
        .setDescription(`Bu çekiliş yetkili **${message.author.username}** tarafından iptal edilmiştir.`)
        .setTimestamp();

      await targetMsg.edit({ embeds: [iptalEmbed] });
      return message.reply('✅ Çekiliş başarıyla iptal edildi.');
    } catch (e) {
      return message.reply('✅ Çekiliş zamanlayıcısı durduruldu ancak çekiliş mesajı güncellenemedi.');
    }
  }

  // ------------------------------------------
  // .sunucu
  // ------------------------------------------
  if (command === 'sunucu' || command === 'sunucubilgi') {
    try {
      const { guild } = message;
      const channels = guild.channels.cache;
      const metin = channels.filter(c => c.type === 0).size;
      const ses = channels.filter(c => c.type === 2).size;
      const kategori = channels.filter(c => c.type === 4).size;

      let banSayisi = 0;
      try {
        const bans = await guild.bans.fetch();
        banSayisi = bans.size;
      } catch (e) {
        banSayisi = 'Yetersiz Yetki';
      }

      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle(`📊 ${guild.name} - Sunucu Bilgileri`)
        .setThumbnail(guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL())
        .addFields(
          { name: '👑 Sunucu Sahibi', value: `<@${guild.ownerId}>`, inline: true },
          { name: '📅 Açılış Tarihi', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '👥 Üye Sayısı', value: `\`${guild.memberCount}\``, inline: true },
          { name: '🚀 Takviye (Boost)', value: `\`${guild.premiumSubscriptionCount || 0}\``, inline: true },
          { name: '🚫 Banlanan Üye', value: `\`${banSayisi}\``, inline: true },
          { name: '🎭 Rol Sayısı', value: `\`${guild.roles.cache.size}\``, inline: true },
          { name: '💬 Metin Kanalı', value: `\`${metin}\``, inline: true },
          { name: '🔊 Ses Kanalı', value: `\`${ses}\``, inline: true },
          { name: '📁 Kategori', value: `\`${kategori}\``, inline: true }
        )
        .setFooter({ text: `Sunucu ID: ${guild.id}` })
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    } catch (err) {
      return message.reply('Sunucu bilgileri alınamadı.');
    }
  }

  // ------------------------------------------
  // .mvp
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
      .setFooter({ text: 'RP Lig Yönetimi' })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
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
      if (bans.size === 0) {
        return message.channel.send({ embeds: [new EmbedBuilder().setColor('#2ecc71').setTitle('📜 Ban Listesi').setDescription('Sunucuda banlı üye yok.')] });
      }

      const banArray = Array.from(bans.values()).slice(0, 10);
      const listeMetni = banArray.map((b, index) => `${index + 1}. \`${b.user.tag}\` - ID: \`${b.user.id}\` ${b.reason ? `(${b.reason})` : ''}`).join('\n');

      const banEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('📜 Engellenen Üyeler (İlk 10)')
        .setDescription(listeMetni)
        .setFooter({ text: `Toplam Ban: ${bans.size}` });

      return message.channel.send({ embeds: [banEmbed] });
    } catch (err) {
      return message.reply('Ban listesi alınamadı.');
    }
  }

  // ------------------------------------------
  // .ban, .unban, .kick, .mute, .unmute, .afk
  // ------------------------------------------
  if (command === 'ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply('❌ Yetkin yok.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('Lütfen bir üye etiketleyin.');
    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';
    await member.ban({ reason });
    return message.channel.send(`🚫 **${member.user.tag}** engellendi.`);
  }

  if (command === 'unban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply('❌ Yetkin yok.');
    const userId = args[0];
    if (!userId) return message.reply('Lütfen ID girin.');
    await message.guild.members.unban(userId);
    return message.channel.send(`✅ ID: \`${userId}\` olan kullanıcının yasağı kaldırıldı.`);
  }

  if (command === 'kick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return message.reply('❌ Yetkin yok.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('Lütfen bir üye etiketleyin.');
    await member.kick(args.slice(1).join(' ') || 'Sebep yok');
    return message.channel.send(`👞 **${member.user.tag}** atıldı.`);
  }

  if (command === 'mute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.reply('❌ Yetkin yok.');
    const member = message.mentions.members.first();
    const duration = parseInt(args[1]) || 10;
    if (!member) return message.reply('Lütfen bir üye etiketleyin.');
    await member.timeout(duration * 60 * 1000);
    return message.channel.send(`🔇 **${member.user.tag}**, **${duration} dk** susturuldu.`);
  }

  if (command === 'unmute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.reply('❌ Yetkin yok.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('Lütfen bir üye etiketleyin.');
    await member.timeout(null);
    return message.channel.send(`🔊 **${member.user.tag}** susturması kaldırıldı.`);
  }

  if (command === 'afk') {
    const reason = args.join(' ') || 'Sebep belirtilmedi';
    afkMap.set(message.author.id, { reason, timestamp: Date.now() });
    const baslangicZamani = Math.floor(Date.now() / 1000);
    return message.reply(`💤 AFK moduna geçtin.\n💬 **Sebep:** ${reason}\n🕒 **Saat:** <t:${baslangicZamani}:t>`);
  }
});

client.login(process.env.TOKEN);
