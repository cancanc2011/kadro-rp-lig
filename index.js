const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

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

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ----------------------------------------------------
  // .ban @kullanıcı [sebep]
  // Gerekli Yetki: Üyeleri Engelle (BanMembers)
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // .banlist
  // Gerekli Yetki: Üyeleri Engelle (BanMembers)
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // .unban <kullanıcı_id>
  // Gerekli Yetki: Üyeleri Engelle (BanMembers)
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // .kick @kullanıcı [sebep]
  // Gerekli Yetki: Üyeleri At (KickMembers)
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // .mute @kullanıcı [dakika]
  // Gerekli Yetki: Üyelere Zaman Aşımı Uygula (ModerateMembers)
  // ----------------------------------------------------
  if (command === 'mute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('❌ Bu komutu kullanmak için **Üyelere Zaman Aşımı Uygula** yetkisine sahip olmalısın.');
    }

    const member = message.mentions.members.first();
    const duration = parseInt(args[1]) || 10; // Varsayılan: 10 dakika

    if (!member) return message.reply('Lütfen susturulacak bir üye etiketleyin.');
    if (!member.moderatable) return message.reply('Bu üyeyi susturmak için yetkim yetersiz.');

    await member.timeout(duration * 60 * 1000, 'Zaman aşımı uygulandı');
    return message.channel.send(`🔇 **${member.user.tag}**, **${duration} dakika** boyunca susturuldu.`);
  }

  // ----------------------------------------------------
  // .unmute @kullanıcı
  // Gerekli Yetki: Üyelere Zaman Aşımı Uygula (ModerateMembers)
  // ----------------------------------------------------
  if (command === 'unmute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('❌ Bu komutu kullanmak için **Üyelere Zaman Aşımı Uygula** yetkisine sahip olmalısın.');
    }

    const member = message.mentions.members.first();
    if (!member) return message.reply('Lütfen susturması kaldırılacak bir üye etiketleyin.');

    await member.timeout(null);
    return message.channel.send(`🔊 **${member.user.tag}** kullanıcısının susturması kaldırıldı.`);
  }
});

// dotenv paketini projenin en üstüne eklediğinden emin ol
require('dotenv').config();

// ... komutlar ve diğer kodlar ...

// Token'ı tırnak içinde elle yazmak yerine process.env'den çek:
client.login(process.env.TOKEN);

