const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- FİFA 2026 VERİ TABANI ---
const db = {
    teams: {
        // Süper Lig
        "gs": { name: "Galatasaray", league: "Süper Lig", rating: 86, budget: 180, players: ["Icardi", "Osimhen", "Torreira", "Barış Alper"] },
        "fb": { name: "Fenerbahçe", league: "Süper Lig", rating: 85, budget: 175, players: ["Dzeko", "Tadic", "Fred", "İrfan Can"] },
        "bjk": { name: "Beşiktaş", league: "Süper Lig", rating: 83, budget: 140, players: ["Immobile", "Rafa Silva", "Gedson", "Mert"] },
        "ts": { name: "Trabzonspor", league: "Süper Lig", rating: 81, budget: 120, players: ["Onuachu", "Visca", "Uğurcan", "Bardhi"] },
        
        // Premier Lig
        "mancity": { name: "Manchester City", league: "Premier Lig", rating: 91, budget: 300, players: ["Haaland", "De Bruyne", "Foden", "Rodri"] },
        "arsenal": { name: "Arsenal", league: "Premier Lig", rating: 89, budget: 250, players: ["Saka", "Ødegaard", "Rice", "Saliba"] },
        "mancutd": { name: "Manchester United", league: "Premier Lig", rating: 85, budget: 220, players: ["Rashford", "Fernandes", "Mainoo", "Onana"] },
        "chelsea": { name: "Chelsea", league: "Premier Lig", rating: 84, budget: 240, players: ["Palmer", "Jackson", "Nkunku", "Caicedo"] },

        // La Liga
        "realmadrid": { name: "Real Madrid", league: "La Liga", rating: 92, budget: 320, players: ["Mbappe", "Bellingham", "Vinicius Jr", "Valverde"] },
        "barcelona": { name: "Barcelona", league: "La Liga", rating: 89, budget: 230, players: ["Lewandowski", "Yamal", "Pedri", "Gavi"] },
        "atletico": { name: "Atletico Madrid", league: "La Liga", rating: 86, budget: 190, players: ["Griezmann", "Alvarez", "Koke", "Oblak"] },

        // Serie A
        "inter": { name: "Inter", league: "Serie A", rating: 88, budget: 210, players: ["Lautaro", "Thuram", "Barella", "Calhanoglu"] },
        "milan": { name: "AC Milan", league: "Serie A", rating: 85, budget: 190, players: ["Leao", "Pulisic", "Hernandez", "Maignan"] },
        "juventus": { name: "Juventus", league: "Serie A", rating: 85, budget: 200, players: ["Vlahovic", "Chiesa", "Bremer", "Locatelli"] }
    },
    // Kullanıcıların oluşturduğu oyuncu kariyerleri
    careers: {},
    matches: [
        { home: "gs", away: "realmadrid", played: false },
        { home: "fb", away: "barcelona", played: false },
        { home: "mancity", away: "inter", played: false }
    ]
};

client.once('ready', () => {
    console.log(`Bot aktif: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 1. YARDIM MENÜSÜ (.yardim veya !yardim)
    if (command === 'yardım' || command === 'yardim' || command === 'fifa') {
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('⚽ Fifa 2026 Kariyer & Bot Komutları')
            .setDescription('Tüm kulüpler, transferler, maçlar ve kendi oyuncu kariyerini yönet!')
            .addFields(
                { name: '👤 `!kariyerbaslat <İsim> <Numara> <Mevki>`', value: 'Kendi futbolcu kariyerini başlatır. (Örn: `!kariyerbaslat Alex 10 OOS`)' },
                { name: '📋 `!profil`', value: 'Kendi futbolcu kartını ve istatistiklerini gösterir.' },
                { name: '🏟️ `!takimlar`', value: 'Süper Lig, Premier Lig, La Liga ve Serie A takımlarını listeler.' },
                { name: '🔄 `!transfer <Kısaltma> <Oyuncu>`', value: 'Takımlara oyuncu transfer eder.' },
                { name: '⚽ `!mac <EvSahibi> <Deplasman>`', value: 'Takımlar arasında maç simülasyonu yapar.' },
                { name: '📅 `!fikstur`', value: 'Maç fikstürünü gösterir.' }
            )
            .setFooter({ text: 'Fifa 2026 Sistemi' });

        return message.reply({ embeds: [embed] });
    }

    // 2. OYUNCU KARİYERİ BAŞLATMA (!kariyerbaslat İsim Numara Mevki)
    if (command === 'kariyerbaslat') {
        const name = args[0];
        const number = args[1];
        const position = args[2];

        if (!name || !number || !position) {
            return message.reply('❌ Eksik kullanım! Örnek kullanım: `!kariyerbaslat Alex 10 OOS`');
        }

        // Oyuncuyu kaydet
        db.careers[message.author.id] = {
            name: name,
            number: number,
            position: position.toUpperCase(),
            rating: 75, // Başlangıç potansiyel gücü
            goals: 0,
            matchesPlayed: 0
        };

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🌟 Futbolcu Kariyeri Başlatıldı!')
            .setDescription(`Tebrikler **${name}**, profesyonel futbol dünyasına adım attın!`)
            .addFields(
                { name: 'Futbolcu Adı', value: name, inline: true },
                { name: 'Forma Numarası', value: number, inline: true },
                { name: 'Mevki', value: position.toUpperCase(), inline: true },
                { name: 'Genel Reyting', value: '75 ⭐', inline: true }
            )
            .setFooter({ text: 'Profilini görmek için !profil yazabilirsin.' });

        return message.reply({ embeds: [embed] });
    }

    // 3. PROFİL GÖRÜNTÜLEME (!profil)
    if (command === 'profil') {
        const career = db.careers[message.author.id];

        if (!career) {
            return message.reply('❌ Henüz bir kariyerin yok! Başlatmak için: `!kariyerbaslat <İsim> <Numara> <Mevki>`');
        }

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`👤 Futbolcu Profili: ${career.name}`)
            .addFields(
                { name: 'Forma Numarası', value: `#${career.number}`, inline: true },
                { name: 'Mevki', value: career.position, inline: true },
                { name: 'Reyting', value: `${career.rating} ⭐`, inline: true },
                { name: 'Atılan Gol', value: `${career.goals}`, inline: true },
                { name: 'Oynanan Maç', value: `${career.matchesPlayed}`, inline: true }
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    // 4. TAKIMLARI LİSTELEME (!takimlar)
    if (command === 'takimlar') {
        const embed = new EmbedBuilder()
            .setColor('#1E90FF')
            .setTitle('🏟️ Fifa 2026 Ligler ve Kulüpler');

        for (const [key, team] of Object.entries(db.teams)) {
            embed.addFields({
                name: `[${key}] ${team.name} (${team.league})`,
                value: `⭐ Güç: **${team.rating}** | 💰 Bütçe: **${team.budget}M€**\n👥 **Kadro:** ${team.players.join(', ')}`
            });
        }

        return message.reply({ embeds: [embed] });
    }

    // 5. TRANSFER İŞLEMİ (!transfer realmadrid Icardi)
    if (command === 'transfer') {
        const teamKey = args[0]?.toLowerCase();
        const player = args.slice(1).join(' ');

        if (!teamKey || !player) {
            return message.reply('❌ Eksik kullanım! Örnek: `!transfer realmadrid Icardi`');
        }

        if (!db.teams[teamKey]) {
            return message.reply('❌ Geçersiz takım kısaltması! (Örn: `gs`, `realmadrid`, `inter`, `mancity`)');
        }

        let foundFromTeam = null;
        for (const [key, team] of Object.entries(db.teams)) {
            if (team.players.some(p => p.toLowerCase() === player.toLowerCase())) {
                foundFromTeam = key;
                break;
            }
        }

        if (foundFromTeam === teamKey) {
            return message.reply(`❌ Bu oyuncu zaten ${db.teams[teamKey].name} kadrosunda!`);
        }

        if (db.teams[teamKey].budget < 30) {
            return message.reply('❌ Kulübün transfer bütçesi yetersiz! (Min: 30M€)');
        }

        db.teams[teamKey].budget -= 30;
        db.teams[teamKey].players.push(player);

        if (foundFromTeam) {
            db.teams[foundFromTeam].players = db.teams[foundFromTeam].players.filter(p => p.toLowerCase() !== player.toLowerCase());
            db.teams[foundFromTeam].budget += 30;
        }

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🔄 Transfer Başarılı!')
            .setDescription(`**${player}**, başarıyla **${db.teams[teamKey].name}** takımına katıldı!`)
            .addFields({ name: 'Yeni Bütçe', value: `${db.teams[teamKey].budget}M€` });

        return message.reply({ embeds: [embed] });
    }

    // 6. MAÇ SİMÜLASYONU (!mac gs realmadrid)
    if (command === 'mac' || command === 'macsimulasyon') {
        const homeKey = args[0]?.toLowerCase();
        const awayKey = args[1]?.toLowerCase();

        if (!homeKey || !awayKey || !db.teams[homeKey] || !db.teams[awayKey]) {
            return message.reply('❌ Geçerli iki takım kısaltması girmelisin! Örnek: `!mac gs realmadrid`');
        }

        const homeTeam = db.teams[homeKey];
        const awayTeam = db.teams[awayKey];

        const homeGoals = Math.floor(Math.random() * (homeTeam.rating > awayTeam.rating ? 4 : 3));
        const awayGoals = Math.floor(Math.random() * (awayTeam.rating > homeTeam.rating ? 3 : 4));

        const embed = new EmbedBuilder()
            .setColor('#FF4500')
            .setTitle('⚽ Maç Sonucu - Fifa 2026')
            .addFields(
                { name: `${homeTeam.name} (${homeTeam.league})`, value: `**${homeGoals}**`, inline: true },
                { name: `${awayTeam.name} (${awayTeam.league})`, value: `**${awayGoals}**`, inline: true }
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    // 7. FİKSTÜR (!fikstur)
    if (command === 'fikstur') {
        const embed = new EmbedBuilder()
            .setColor('#8A2BE2')
            .setTitle('📅 Fifa 2026 Fikstür');

        db.matches.forEach((m, index) => {
            embed.addFields({
                name: `Maç ${index + 1}`,
                value: `${db.teams[m.home].name} vs ${db.teams[m.away].name}`
            });
        });

        return message.reply({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
        
