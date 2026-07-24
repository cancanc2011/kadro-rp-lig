const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- FİFA 2026 GÜNCEL 16 TAKIMLI LİG & VERİ TABANI ---
const db = {
    teams: {
        "gs": { 
            name: "Galatasaray", league: "Süper Lig", rating: 86, budget: 180, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Dursun Özbek", td: "Okan Buruk", 
            squad: [
                { name: "Muslera", pos: "KL", gen: 84 },
                { name: "Davinson Sanchez", pos: "STP", gen: 83 },
                { name: "Torreira", pos: "MOS", gen: 83 },
                { name: "Barış Alper Yılmaz", pos: "KANAT", gen: 82 },
                { name: "Osimhen", pos: "ST", gen: 88 },
                { name: "Icardi", pos: "ST", gen: 86 }
            ] 
        },
        "fb": { 
            name: "Fenerbahçe", league: "Süper Lig", rating: 85, budget: 175, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Ali Koç", td: "Jose Mourinho", 
            squad: [
                { name: "Livakovic", pos: "KL", gen: 82 },
                { name: "Çağlar Söyüncü", pos: "STP", gen: 81 },
                { name: "Fred", pos: "MOS", gen: 82 },
                { name: "Szymanski", pos: "OOS", gen: 82 },
                { name: "Tadic", pos: "KANAT", gen: 84 },
                { name: "Dzeko", pos: "ST", gen: 84 }
            ] 
        },
        "bjk": { 
            name: "Beşiktaş", league: "Süper Lig", rating: 83, budget: 140, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Hasan Arat", td: "Giovanni van Bronckhorst", 
            squad: [
                { name: "Mert Günok", pos: "KL", gen: 79 },
                { name: "Gabriel Paulista", pos: "STP", gen: 81 },
                { name: "Gedson", pos: "MOS", gen: 81 },
                { name: "Rafa Silva", pos: "OOS", gen: 84 },
                { name: "Semih Kılıçsoy", pos: "ST", gen: 78 },
                { name: "Immobile", pos: "ST", gen: 85 }
            ] 
        },
        "ts": { 
            name: "Trabzonspor", league: "Süper Lig", rating: 81, budget: 120, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Ertuğrul Doğan", td: "Şenol Güneş", 
            squad: [
                { name: "Uğurcan", pos: "KL", gen: 81 },
                { name: "Savic", pos: "STP", gen: 82 },
                { name: "Okay Yokuşlu", pos: "MDS", gen: 77 },
                { name: "Visca", pos: "KANAT", gen: 79 },
                { name: "Onuachu", pos: "ST", gen: 80 }
            ] 
        },
        "bursa": { 
            name: "Bursaspor", league: "Süper Lig", rating: 79, budget: 90, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Enes Çelik", td: "Teknik Direktör", 
            squad: [
                { name: "Ertuğrul", pos: "KL", gen: 76 },
                { name: "Taha", pos: "ST", gen: 75 },
                { name: "Enes", pos: "OS", gen: 74 }
            ] 
        },
        "basaksehir": { 
            name: "Başakşehir", league: "Süper Lig", rating: 80, budget: 100, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Göksel Gümüşdağ", td: "Çağdaş Atan", 
            squad: [
                { name: "Helton Leite", pos: "KL", gen: 77 },
                { name: "Berat Özdemir", pos: "MDS", gen: 76 },
                { name: "Deniz Türüç", pos: "KANAT", gen: 76 },
                { name: "Piatek", pos: "ST", gen: 80 }
            ] 
        },
        "samsun": { 
            name: "Samsunspor", league: "Süper Lig", rating: 77, budget: 70, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Yüksel Yıldırım", td: "Thomas Reis", 
            squad: [
                { name: "Okan Kocuk", pos: "KL", gen: 75 },
                { name: "Drongelen", pos: "STP", gen: 76 },
                { name: "Ntcham", pos: "MOS", gen: 77 },
                { name: "Emre Kılınç", pos: "KANAT", gen: 75 }
            ] 
        },
        "antalya": { 
            name: "Antalyaspor", league: "Süper Lig", rating: 76, budget: 65, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Sinan Boztepe", td: "Ersun Yanal", 
            squad: [
                { name: "Piric", pos: "KL", gen: 75 },
                { name: "Veysel Sarı", pos: "STP", gen: 74 },
                { name: "Safuri", pos: "OOS", gen: 76 },
                { name: "Samudio", pos: "ST", gen: 75 }
            ] 
        },
        "mancity": { 
            name: "Manchester City", league: "Premier Lig", rating: 91, budget: 300, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Khaldoon Al Mubarak", td: "Pep Guardiola", 
            squad: [
                { name: "Ederson", pos: "KL", gen: 88 },
                { name: "Ruben Dias", pos: "STP", gen: 88 },
                { name: "Rodri", pos: "MDS", gen: 91 },
                { name: "De Bruyne", pos: "OOS", gen: 90 },
                { name: "Foden", pos: "KANAT", gen: 89 },
                { name: "Haaland", pos: "ST", gen: 91 }
            ] 
        },
        "arsenal": { 
            name: "Arsenal", league: "Premier Lig", rating: 89, budget: 250, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Stan Kroenke", td: "Mikel Arteta", 
            squad: [
                { name: "Raya", pos: "KL", gen: 86 },
                { name: "Saliba", pos: "STP", gen: 87 },
                { name: "Rice", pos: "MDS", gen: 88 },
                { name: "Ødegaard", pos: "OOS", gen: 89 },
                { name: "Saka", pos: "KANAT", gen: 89 },
                { name: "Gabriel Jesus", pos: "ST", gen: 83 }
            ] 
        },
        "mancutd": { 
            name: "Manchester United", league: "Premier Lig", rating: 85, budget: 220, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "INEOS", td: "Rúben Amorim", 
            squad: [
                { name: "Onana", pos: "KL", gen: 83 },
                { name: "Martinez", pos: "STP", gen: 82 },
                { name: "Mainoo", pos: "MOS", gen: 79 },
                { name: "Fernandes", pos: "OOS", gen: 87 },
                { name: "Rashford", pos: "KANAT", gen: 81 },
                { name: "Hojlund", pos: "ST", gen: 82 }
            ] 
        },
        "chelsea": { 
            name: "Chelsea", league: "Premier Lig", rating: 84, budget: 240, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Todd Boehly", td: "Enzo Maresca", 
            squad: [
                { name: "Sanchez", pos: "KL", gen: 79 },
                { name: "James", pos: "RWB", gen: 82 },
                { name: "Caicedo", pos: "MDS", gen: 82 },
                { name: "Palmer", pos: "OOS", gen: 88 },
                { name: "Nkunku", pos: "OOS", gen: 83 },
                { name: "Jackson", pos: "ST", gen: 79 }
            ] 
        },
        "realmadrid": { 
            name: "Real Madrid", league: "La Liga", rating: 92, budget: 320, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Florentino Perez", td: "Carlo Ancelotti", 
            squad: [
                { name: "Courtois", pos: "KL", gen: 89 },
                { name: "Militao", pos: "STP", gen: 86 },
                { name: "Valverde", pos: "MOS", gen: 88 },
                { name: "Bellingham", pos: "OOS", gen: 90 },
                { name: "Vinicius Jr", pos: "KANAT", gen: 91 },
                { name: "Mbappe", pos: "ST", gen: 91 }
            ] 
        },
        "barcelona": { 
            name: "Barcelona", league: "La Liga", rating: 89, budget: 230, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Joan Laporta", td: "Hansi Flick", 
            squad: [
                { name: "Ter Stegen", pos: "KL", gen: 88 },
                { name: "Araujo", pos: "STP", gen: 86 },
                { name: "Pedri", pos: "MOS", gen: 86 },
                { name: "Gavi", pos: "MOS", gen: 84 },
                { name: "Yamal", pos: "KANAT", gen: 86 },
                { name: "Lewandowski", pos: "ST", gen: 89 }
            ] 
        },
        "inter": { 
            name: "Inter", league: "Serie A", rating: 88, budget: 210, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Giuseppe Marotta", td: "Simone Inzaghi", 
            squad: [
                { name: "Sommer", pos: "KL", gen: 84 },
                { name: "Bastoni", pos: "STP", gen: 87 },
                { name: "Calhanoglu", pos: "MDS", gen: 86 },
                { name: "Barella", pos: "MOS", gen: 87 },
                { name: "Thuram", pos: "ST", gen: 85 },
                { name: "Lautaro", pos: "ST", gen: 89 }
            ] 
        },
        "milan": { 
            name: "AC Milan", league: "Serie A", rating: 85, budget: 190, points: 0, played: 0, gf: 0, ga: 0, 
            baskan: "Paolo Scaroni", td: "Paulo Fonseca", 
            squad: [
                { name: "Maignan", pos: "KL", gen: 87 },
                { name: "Hernandez", pos: "LB", gen: 87 },
                { name: "Reijnders", pos: "MOS", gen: 82 },
                { name: "Pulisic", pos: "KANAT", gen: 83 },
                { name: "Leao", pos: "KANAT", gen: 86 },
                { name: "Morata", pos: "ST", gen: 82 }
            ] 
        }
    },
    careers: {},
    news: [
        "🔥 Fifa 2026 sezonu açıldı! Başkanlar ve T.D.'ler bütçeleri kasaya koydu.",
        "⭐ 16 takımlı dev ligde tüm güncel kadrolar sahneye çıktı.",
        "🧤 Kalecilerin kurtarışları ve kulüp bütçe yönetimi şampiyonu belirleyecek."
    ]
};

client.once('ready', () => {
    console.log(`Bot aktif: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const prefix = '!';
    if (!message.content.startsWith(prefix) && !message.content.startsWith('.')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();



    // 2. KARİYER BAŞLAT
    if (command === 'kariyerbaslat') {
        const name = args[0];
        const number = args[1];
        const position = args[2]?.toUpperCase();

        if (!name || !number || !position) {
            return message.reply('❌ Örnek: `.kariyerbaslat Muslera 1 KL` veya `.kariyerbaslat Mbappe 7 ST`');
        }

        // !yardim komutu ile botun tüm güncel komutlarını listeleyen Discord.js kod bloğu:

    // 1. YARDIM MENÜSÜ
    if (command === 'yardim' || command === 'yardım' || command === 'fifa') {
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('⚽ Fifa 2026 Güncel Kariyer & Yönetim Sistemi')
            .addFields(
                { name: '👤 `.kariyerbaslat <İsim> <Numara> <Mevki>`', value: 'Kariyer başlatır (KL = Kaleci).' },
                { name: '📋 `.profil` veya `.kadro`', value: 'Oyuncu kartını, cüzdanını ve istatistiklerini gösterir.' },
                { name: '💰 `.butce`', value: 'Başkan, teknik direktör ve kulüp bütçeni / cüzdanını görüntüler.' },
                { name: '🗑️ `.kariyersil`', value: 'Mevcut kariyerini ve tüm ilerlemeni tamamen siler!' },
                { name: '🔍 `.oyuncuara <mevki> <min_gen>`', value: 'Mevki ve reytinge göre güncel oyuncu arar (Örn: `.oyuncuara kl 85`).' },
                { name: '🧤 `.saveyap`', value: 'Kaleciysen maçta şut kurtarır, GEN artırırsın!' },
                { name: '🏋️ `.antrenman`', value: 'Antrenman yaparak reytingini yükseltirsin.' },
                { name: '🎤 `.soylesi`', value: 'Basın toplantısı düzenler, sponsor geliri elde edersin.' },
                { name: '🎲 `.sans` veya `.bahis`', value: 'Şansını denersin, prim kazanır veya kaybedersin.' },
                { name: '🏟️ `.takimlar`', value: '16 kulübü, güncel başkan, T.D. ve kadrolarını listeler.' },
                { name: '📊 `.puandurumu`', value: 'Lig puan durumunu gösterir.' },
                { name: '⚽ `.macbaslat <Ev> <Deplasman>`', value: 'Lig maçını simüle eder.' },
                { name: '🇹🇷 `.milli`', value: 'Milli takıma seçilmeyi denersin.' },
                { name: '📰 `.haber`', value: 'Son dakika lig ve transfer haberleri.' },
                { name: '🤝 `.gorusmebaslat <takim_kodu>`', value: 'Kulüp yönetimiyle transfer görüşmesi başlatır.' },
                { name: '📅 `.transferdonemi`', value: 'Transfer döneminin durumunu gösterir.' }
            );
        return message.reply({ embeds: [embed] });
    }
db.careers[message.author.id] = {
            name: name,
            number: number,
            position: position,
            rating: 75,
            goals: 0,
            saves: 0,
            money: 100,
            matchesPlayed: 0,
            nationalTeam: false
        };

        return message.reply(`🌟 Tebrikler **${name}**, Fifa 2026 güncel kadrolar dünyasında ${position} mevkisiyle kariyerin başladı!`);
    }

    // 3. PROFİL & KADRO
    if (command === 'profil' || command === 'kadro') {
        const career = db.careers[message.author.id];
        if (!career) return message.reply('❌ Henüz bir kariyerin yok! Başlatmak için: `.kariyerbaslat <İsim> <Numara> <Mevki>`');

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`👤 Süper Star Profili: ${career.name}`)
            .addFields(
                { name: 'Forma No', value: `#${career.number}`, inline: true },
                { name: 'Mevki', value: career.position, inline: true },
                { name: 'Genel Reyting (GEN)', value: `${career.rating} ⭐`, inline: true },
                { name: 'Özel Bütçe / Cüzdan', value: `💰 ${career.money} Milyon €`, inline: true },
                { name: career.position === 'KL' ? 'Kurtarış (Save)' : 'Gol', value: career.position === 'KL' ? `${career.saves}` : `${career.goals}`, inline: true },
                { name: 'Milli Durum', value: career.nationalTeam ? '🇹🇷 A Milli Takımda!' : 'Henüz Değil', inline: true }
            );
        return message.reply({ embeds: [embed] });
    }

    // 4. BÜTÇE KONTROLÜ (.butce)
    if (command === 'butce') {
        const career = db.careers[message.author.id];
        if (!career) return message.reply('❌ Önce kariyer başlatmalısın: `.kariyerbaslat`');

        const embed = new EmbedBuilder()
            .setColor('#00FF7F')
            .setTitle('💼 Başkan & Teknik Direktör Bütçe Raporu')
            .addFields(
                { name: '👑 Oyuncu / Rol', value: `${career.name} (${career.position})`, inline: true },
                { name: '💰 Kişisel Bütçe / Prim', value: `${career.money} Milyon €`, inline: true },
                { name: '📊 Başkanlık Onayı', value: '🟢 Kulüp kasası ve transfer bütçeleri otomatik senkronize edildi.', inline: false }
            );
        return message.reply({ embeds: [embed] });
    }

    // 5. KARİYERİ SİLME (.kariyersil)
    if (command === 'kariyersil') {
        const career = db.careers[message.author.id];
        if (!career) return message.reply('❌ Zaten aktif bir kariyerin bulunmuyor!');

        delete db.careers[message.author.id];
        return message.reply('🗑️ Kariyerin ve tüm verilerin başarıyla sıfırlandı/silindi! Yeni bir başlangıç için `.kariyerbaslat` yazabilirsin.');
    }

    // 6. GÜNCEL OYUNCU ARAMA (.oyuncuara <mevki> <min_gen>)
    if (command === 'oyuncuara' || command === 'scout') {
        const targetPos = args[0]?.toUpperCase();
        const minGen = parseInt(args[1]) || 0;

        if (!targetPos) {
            return message.reply('❌ Örnek kullanım: `.oyuncuara kl 85` veya `.oyuncuara st 88`');
        }

        let results = [];

        for (const [key, team] of Object.entries(db.teams)) {
            team.squad.forEach(player => {
                if (player.pos === targetPos && player.gen >= minGen) {
                    results.push(`⭐ **${player.name}** | GEN: **${player.gen}** | Mevki: **${player.pos}** | Kulüp: *${team.name}* (${team.league})`);
                }
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#00FFFF')
            .setTitle(`🔍 2026 Scout Raporu: ${targetPos} (Min GEN: ${minGen})`);

        if (results.length > 0) {
            embed.setDescription(results.join('\n'));
        } else {
            embed.setDescription(`❌ Aradığın kriterlere uygun 2026 oyuncusu bulunamadı!`);
        }

        return message.reply({ embeds: [embed] });
    }

    // 7. KALECİ SAVE YAPMA (.saveyap)
    if (command === 'saveyap' || command === 'save') {
        const career = db.careers[message.author.id];
        if (!career) return message.reply('❌ Önce kariyer başlatmalısın: `.kariyerbaslat`');
        if (career.position !== 'KL') return message.reply('❌ Bu komut sadece **Kaleci (KL)** pozisyonundakiler içindir!');

        const success = Math.random() > 0.3;
        if (success) {
            career.saves += 1;
            career.money += 5;
            if (career.saves % 3 === 0) {
                career.rating += 1;
                return message.reply(`🧤 Kalede devleştin! Harika bir save yaptın. Kurtarış: **${career.saves}** | 📈 Reytingin arttı: **${career.rating} GEN** | 💰 +5M€ prim!`);
            }
            return message.reply(`🧤 Harika refleks! Şutu çıkardın! Kurtarış: **${career.saves}** | 💰 +5M€`);
        } else {
            return message.reply(`❌ Rakip çok sert vurdu, golü önleyemedin ama taraftarlar arkanda!`);
        }
    }

    // 8. ANTRENMAN (.antrenman)
    if (command === 'antrenman') {
        const career = db.careers[message.author.id];
        if (!career) return message.reply('❌ Önce kariyer başlatmalısın!');

        career.rating += 1;
        career.money += 2;
        return message.reply(`🏋️ Sıkı antrenman yapıldı! Reytingin **${career.rating} ⭐** oldu ve cüzdana 2M€ eklendi!`);
    }

    // 9. BASIN TOPLANTISI (.soylesi)
    if (command === 'soylesi' || command === 'basin') {
        const career = db.careers[message.author.id];
        if (!career) return message.reply('❌ Önce kariyer başlatmalısın!');

        const olaylar = [
            `🎤 Basın toplantısında harika açıklamalar yaptın, taraftar sevgisi tavan yaptı! 💰 +10M€ sponsor geliri.`,
            `🎤 Teknik direktörle uyum yakaladın, antrenmanda yıldızlaştın!`,
            `🎤 Taraftarlara imza dağıtırken kulüp başkanının gözüne girdin! 🌟 Reytingin +1 arttı.`
        ];
        
        const secilenOlay = olaylar[Math.floor(Math.random() * olaylar.length)];
        if (secilenOlay.includes('Reytingin +1 arttı')) career.rating += 1;
        if (secilenOlay.includes('sponsor geliri')) career.money += 10;

        return message.reply(secilenOlay);
    }

    // 10. ŞANS / BAHİS (.sans)
    if (command === 'sans' || command === 'bahis') {
        const career = db.careers[message.author.id];
        if (!career) return message.reply('❌ Önce kariyer başlatmalısın!');

        const sonuc = Math.random();
        if (sonuc > 0.4) {
            const kazanc = Math.floor(Math.random() * 25) + 10;
            career.money += kazanc;
            return message.reply(`🎰 Sponsorluk anlaşmasından **${kazanc} Milyon €** kazandın! 💰 (Toplam: ${career.money}M€)`);
        } else {
            const kayip = 10;
            career.money = Math.max(0, career.money - kayip);
            return message.reply(`💸 Beklenmeyen harcamalar cüzdanı sarstı! ${kayip} Milyon € harcandı. 😅 (Toplam: ${career.money}M€)`);
        }
    }

// 11. TAKIMLAR (.takimlar)
    if (command === 'takimlar') {
        const embed = new EmbedBuilder()
            .setColor('#1E90FF')
            .setTitle('🏟️ Fifa 2026 Güncel 16 Takım, Başkan ve T.D. Listesi');

        for (const [key, team] of Object.entries(db.teams)) {
            const squadList = team.squad.map(p => `${p.name} (${p.pos}, ${p.gen})`).join(', ');
            embed.addFields({
                name: `[${key}] ${team.name} (${team.league})`,
                value: `⭐ Güç: **${team.rating}** | 💰 Bütçe: **${team.budget}M€**\n👑 Başkan: **${team.baskan}** | 👔 T.D.: **${team.td}**\n👥 **Kadrolar:** ${squadList}`
            });
        }
        return message.reply({ embeds: [embed] });
    }

    // 12. PUAN DURUMU (.puandurumu)
    if (command === 'puandurumu') {
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('📊 Lig Puan Durumu');
        
        let standingsText = "";
        const sortedTeams = Object.values(db.teams).sort((a, b) => b.points - a.points);
        sortedTeams.forEach((t, idx) => {
            standingsText += `**${idx + 1}.** ${t.name} - O: ${t.played} P: ${t.points} (AG: ${t.gf}, YG: ${t.ga})\n`;
        });
        
        embed.setDescription(standingsText || "Henüz maç oynanmadı.");
        return message.reply({ embeds: [embed] });
    }

    // 13. MAÇ BAŞLAT (.macbaslat)
    if (command === 'macbaslat') {
        const homeKey = args[0]?.toLowerCase();
        const awayKey = args[1]?.toLowerCase();

        if (!homeKey || !awayKey || !db.teams[homeKey] || !db.teams[awayKey]) {
            return message.reply('❌ Örnek kullanım: `.macbaslat gs fb`');
        }

        const homeTeam = db.teams[homeKey];
        const awayTeam = db.teams[awayKey];

        const homeGoals = Math.floor(Math.random() * 4);
        const awayGoals = Math.floor(Math.random() * 4);

        homeTeam.played += 1;
        awayTeam.played += 1;
        homeTeam.gf += homeGoals;
        homeTeam.ga += awayGoals;
        awayTeam.gf += awayGoals;
        awayTeam.ga += homeGoals;

        if (homeGoals > awayGoals) {
            homeTeam.points += 3;
        } else if (homeGoals < awayGoals) {
            awayTeam.points += 3;
        } else {
            homeTeam.points += 1;
            awayTeam.points += 1;
        }

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('⚽ Maç Sonucu!')
            .setDescription(`🏟️ **${homeTeam.name}** ${homeGoals} - ${awayGoals} **${awayTeam.name}**`);

        return message.reply({ embeds: [embed] });
    }

    // 14. MİLLİ TAKIM (.milli)
    if (command === 'milli') {
        const career = db.careers[message.author.id];
        if (!career) return message.reply('❌ Önce kariyer başlatmalısın!');

        if (career.rating >= 80) {
            career.nationalTeam = true;
            return message.reply('🇹🇷 Harika performans! A Milli Takım kadrosuna davet edildin!');
        } else {
            return message.reply(`❌ Milli takıma seçilmek için reytingin çok düşük (Mevcut: ${career.rating}, Gereken: 80). Antrenman yapmalısın!`);
        }
    }

    // 15. HABERLER (.haber)
    if (command === 'haber') {
        const embed = new EmbedBuilder()
            .setColor('#FF4500')
            .setTitle('📰 Son Dakika Lig ve Transfer Haberleri')
            .setDescription(db.news.join('\n\n'));
        return message.reply({ embeds: [embed] });
    }

    // 16. GÖRÜŞME BAŞLAT (.gorusmebaslat)
    if (command === 'gorusmebaslat') {
        const career = db.careers[message.author.id];
        if (!career) return message.reply('❌ Önce kariyer başlatmalısın: `.kariyerbaslat`');

        const teamKey = args[0]?.toLowerCase();
        if (!teamKey || !db.teams[teamKey]) {
            return message.reply('❌ Geçerli bir takım kodu girmelisin! Örnek: `.gorusmebaslat gs`');
        }

        const targetTeam = db.teams[teamKey];
        return message.reply(`🤝 **${targetTeam.name}** kulübü başkanı *${targetTeam.baskan}* ve T.D. *${targetTeam.td}* ile masaya oturdunuz! Görüşmeler olumlu ilerliyor.`);
    }

    // 17. TRANSFER DÖNEMI (.transferdonemi)
    if (command === 'transferdonemi') {
        return message.reply('🟢 Transfer dönemi şu an **AÇIK** durumda.');
    }
});

client.login(process.env.DISCORD_TOKEN);
