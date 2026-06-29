const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

const LIG_YONETICI_ROL = '1519414839561158828';
const OWNER_ROL = '1520770167720771644';
const TEKNIK_DIREKTOR_ROL = '1520770097558585344';
const TAKIM_BASKAN_ROL = '1520770097558585344';

let takimlar = {};

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const icerik = message.content.trim();
    const icerikKucuk = icerik.toLowerCase();
    const argumanlar = icerik.split(/\s+/);

    // --yardim Komutu
    if (icerikKucuk === '--yardim') {
        const yardimEmbed = new EmbedBuilder()
            .setTitle('⚽ Lig Sistemi - Komut Listesi')
            .setColor(0x00FFFF)
            .setDescription('**Yönetici:**\n`.takimkur @kullanıcı Takım Adı`\n`.takimsil Takım Adı`\n\n**Kadro:**\n`.oyuncual @kullanıcı ilk 11/yedek mevkisi Forvet Takım Adı`\n`.oyuncucikar @kullanıcı Takım Adı`\n`.kadro Takım Adı`\n\n**Genel:**\n`.takimliste`');
        return message.reply({ embeds: [yardimEmbed] });
    }

    // .takimkur Komutu
    if (icerikKucuk.startsWith('.takimkur')) {
        if (!message.member.roles.cache.has(LIG_YONETICI_ROL)) return message.reply('❌ Yetkin yok kanka!');
        const baskan = message.mentions.members.first();
        const takimAdi = argumanlar.slice(2).join(' '); 
        if (!baskan || !takimAdi) return message.reply('❌ Kullanım: `.takimkur @kullanıcı Takım Adı`');
        takimlar[takimAdi.toLowerCase()] = { isim: takimAdi, baskanId: baskan.id, ilk11: [], yedekler: [] };
        return message.reply(`✅ **${takimAdi}** kuruldu! Başkan: <@${baskan.id}>`);
    }

    // .takimsil Komutu
    if (icerikKucuk.startsWith('.takimsil')) {
        if (!message.member.roles.cache.has(LIG_YONETICI_ROL)) return message.reply('❌ Yetkin yok kanka!');
        const takimAdi = icerik.substring(9).trim(); 
        if (!takimAdi) return message.reply('❌ Kullanım: `.takimsil Takım Adı`');
        if (!takimlar[takimAdi.toLowerCase()]) return message.reply(`❌ **${takimAdi}** bulunamadı.`);
        delete takimlar[takimAdi.toLowerCase()];
        return message.reply(`🗑️ **${takimAdi}** silindi.`);
    }

    // .takimliste Komutu
    if (icerikKucuk === '.takimliste') {
        const tList = Object.values(takimlar);
        if (tList.length === 0) return message.reply('📭 Takım yok.');
        let aciklama = tList.map((t, i) => `**${i+1}.** ${t.isim} | Başkan: <@${t.baskanId}>`).join('\n');
        return message.reply({ embeds: [new EmbedBuilder().setTitle('🏆 Takımlar').setDescription(aciklama)] });
    }

    // .oyuncual Komutu
    if (icerikKucuk.startsWith('.oyuncual')) {
        const yetkiliMi = message.member.roles.cache.has(OWNER_ROL) || message.member.roles.cache.has(TEKNIK_DIREKTOR_ROL) || message.member.roles.cache.has(TAKIM_BASKAN_ROL);
        if (!yetkiliMi) return message.reply('❌ Yetkin yok!');
        const hedefOyuncu = message.mentions.members.first();
        const mevkiIndex = argumanlar.findIndex(a => a.toLowerCase() === 'mevkisi');
        const takimAdi = argumanlar.slice(mevkiIndex + 2).join(' ');
        const tVeri = takimlar[takimAdi.toLowerCase()];
        if (!tVeri) return message.reply('❌ Takım bulunamadı.');
        const kadroTipi = icerikKucuk.includes('ilk 11') ? 'ilk11' : 'yedek';
        tVeri[kadroTipi].push({ id: hedefOyuncu.id, mevki: argumanlar[mevkiIndex + 1] });
        return message.reply(`✅ Eklendi: <@${hedefOyuncu.id}>`);
    }

    // .oyuncucikar Komutu
    if (icerikKucuk.startsWith('.oyuncucikar')) {
        const hedefOyuncu = message.mentions.members.first();
        const takimAdi = argumanlar.slice(2).join(' ');
        const tVeri = takimlar[takimAdi.toLowerCase()];
        if (!tVeri) return message.reply('❌ Takım bulunamadı.');
        tVeri.ilk11 = tVeri.ilk11.filter(o => o.id !== hedefOyuncu.id);
        tVeri.yedekler = tVeri.yedekler.filter(o => o.id !== hedefOyuncu.id);
        return message.reply('✅ Oyuncu çıkarıldı.');
    }

    // .kadro Komutu
    if (icerikKucuk.startsWith('.kadro')) {
        const takimAdi = argumanlar.slice(1).join(' ');
        const tVeri = takimlar[takimAdi.toLowerCase()];
        if (!tVeri) return message.reply('❌ Takım bulunamadı.');
        let ilk11 = tVeri.ilk11.map((o, i) => `**${i+1}.** <@${o.id}> [${o.mevki}]`).join('\n');
        let yedek = tVeri.yedekler.map((o, i) => `**${i+1}.** <@${o.id}> [${o.mevki}]`).join('\n');
        return message.reply({ embeds: [new EmbedBuilder().setTitle(tVeri.isim).addFields({name:'🟢 İlk 11', value: ilk11 || 'Yok'}, {name:'🔵 Yedek', value: yedek || 'Yok'})] });
    }
});

client.login(process.env.TOKEN);
