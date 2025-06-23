// RESTOPILOT - VERSION PRODUCTION TWILIO
// Prêt pour déploiement sur Render + connexion Twilio

const express = require('express');
const twilio = require('twilio');
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Menu RestoPilot
const menu = {
    pizzas: {
        "margherita": { prix: 12, description: "Tomate, mozzarella, basilic" },
        "4 fromages": { prix: 15, description: "Mozzarella, chèvre, bleu, parmesan" },
        "regina": { prix: 14, description: "Tomate, mozzarella, jambon, champignons" },
        "chorizo": { prix: 16, description: "Tomate, mozzarella, chorizo, poivrons" },
        "végétarienne": { prix: 15, description: "Tomate, mozzarella, légumes grillés" },
        "calzone": { prix: 17, description: "Pizza fermée, jambon, champignons, œuf" }
    },
    boissons: {
        "coca": { prix: 3, description: "Coca-Cola 33cl" },
        "orangina": { prix: 3, description: "Orangina 33cl" },
        "eau": { prix: 2, description: "Eau plate 50cl" },
        "bière": { prix: 4, description: "Bière pression 25cl" }
    },
    desserts: {
        "tiramisu": { prix: 6, description: "Tiramisu maison" },
        "panna cotta": { prix: 5, description: "Panna cotta fruits rouges" }
    }
};

// Base de données en mémoire
let commandes = [];
let sessions = {};
let sessionId = 1;

// PAGE D'ACCUEIL - Dashboard RestoPilot
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RestoPilot - "Ne ratez plus jamais une commande"</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 40px 0;
        }
        .logo {
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .slogan {
            font-size: 1.5em;
            opacity: 0.9;
            margin-bottom: 30px;
        }
        .status-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            margin: 20px 0;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-item {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .webhook-info {
            background: rgba(0,0,0,0.2);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .success { color: #4CAF50; }
        .warning { color: #FF9800; }
        .info { color: #2196F3; }
        .btn {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        code { background: rgba(0,0,0,0.3); padding: 5px 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📞 RestoPilot</div>
            <div class="slogan">"Ne ratez plus jamais une commande"</div>
        </div>

        <div class="status-card">
            <h2>🟢 Système Opérationnel</h2>
            <p>RestoPilot est en ligne et prêt à prendre vos commandes !</p>
            
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-number">${commandes.length}</div>
                    <div>Commandes Traitées</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${commandes.reduce((sum, cmd) => sum + (cmd.total || 0), 0)}€</div>
                    <div>Chiffre d'Affaires</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${Object.keys(sessions).length}</div>
                    <div>Sessions Actives</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">24/7</div>
                    <div>Disponibilité</div>
                </div>
            </div>
        </div>

        <div class="status-card">
            <h2>🔧 Configuration Twilio</h2>
            
            <div class="webhook-info">
                <h3>📡 URL Webhook (à copier dans Twilio) :</h3>
                <code id="webhook-url">https://[votre-app].onrender.com/voice</code>
                <button onclick="copyWebhook()" class="btn">📋 Copier</button>
            </div>
            
            <p><strong>Étapes de configuration :</strong></p>
            <ol>
                <li>Aller dans votre dashboard Twilio</li>
                <li>Sélectionner votre numéro de téléphone</li>
                <li>Dans "Voice Configuration" → coller l'URL webhook ci-dessus</li>
                <li>Méthode : POST</li>
                <li>Sauvegarder</li>
            </ol>
        </div>

        <div class="status-card">
            <h2>🧪 Tests Disponibles</h2>
            <a href="/test-chat" class="btn">💬 Test Chat</a>
            <a href="/commandes" class="btn">📦 Voir Commandes</a>
            <a href="/menu" class="btn">🍕 Voir Menu</a>
            <a href="/stats" class="btn">📊 Statistiques</a>
        </div>

        <div class="status-card">
            <h2>📞 Numéro à Configurer</h2>
            <p>Une fois la configuration Twilio terminée, vos clients pourront appeler votre numéro et RestoPilot répondra automatiquement !</p>
            <p class="success">✅ Interface vocale en français</p>
            <p class="success">✅ Reconnaissance vocale intelligente</p>
            <p class="success">✅ Prise de commande automatique</p>
            <p class="success">✅ Calcul des totaux</p>
        </div>
    </div>

    <script>
        function copyWebhook() {
            const url = document.getElementById('webhook-url').textContent;
            navigator.clipboard.writeText(url);
            alert('URL copiée ! Collez-la dans Twilio.');
        }
        
        // Mise à jour automatique de l'URL
        if (window.location.hostname !== 'localhost') {
            document.getElementById('webhook-url').textContent = 
                window.location.origin + '/voice';
        }
    </script>
</body>
</html>
    `);
});

// ENDPOINT TWILIO - Réception d'appels
app.post('/voice', (req, res) => {
    console.log('📞 Appel entrant:', req.body);
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Message d'accueil RestoPilot
    twiml.say({
        voice: 'alice',
        language: 'fr-FR'
    }, 'Bonjour ! RestoPilot à votre service. Je suis Julie, votre assistante virtuelle. Que puis-je prendre comme commande aujourd\'hui ?');
    
    // Écouter la réponse du client
    twiml.gather({
        input: 'speech',
        language: 'fr-FR',
        speechTimeout: 3,
        timeout: 10,
        action: '/process-speech'
    });
    
    // Si pas de réponse
    twiml.say({
        voice: 'alice',
        language: 'fr-FR'
    }, 'Je n\'ai pas entendu votre réponse. N\'hésitez pas à rappeler quand vous voulez ! Au revoir.');
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// ENDPOINT - Traitement de la parole
app.post('/process-speech', (req, res) => {
    const speechResult = req.body.SpeechResult;
    const callSid = req.body.CallSid;
    const from = req.body.From;
    
    console.log(`🎯 Client ${from} dit: "${speechResult}"`);
    
    // Initialiser session si nécessaire
    if (!sessions[callSid]) {
        sessions[callSid] = {
            commande: [],
            total: 0,
            client: from,
            etape: 'commande'
        };
    }
    
    const resultat = traiterCommande(speechResult, sessions[callSid]);
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Répondre au client
    twiml.say({
        voice: 'alice',
        language: 'fr-FR'
    }, resultat.reponse);
    
    // Continuer la conversation ou terminer
    if (!resultat.termine) {
        twiml.gather({
            input: 'speech',
            language: 'fr-FR',
            speechTimeout: 3,
            timeout: 15,
            action: '/process-speech'
        });
        
        twiml.say({
            voice: 'alice',
            language: 'fr-FR'
        }, 'Je vous écoute...');
    } else {
        twiml.say({
            voice: 'alice',
            language: 'fr-FR'
        }, 'Merci pour votre commande ! Nous préparons tout ça. À bientôt chez RestoPilot !');
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// FONCTION - Traitement des commandes vocales
function traiterCommande(message, session) {
    const msg = message.toLowerCase();
    let nouvellesItems = [];
    
    // Salutations
    if (msg.match(/bonjour|hello|salut|bonsoir/)) {
        return {
            reponse: "Bonjour ! Que puis-je prendre comme commande ?",
            termine: false
        };
    }
    
    // Fin de commande
    if (msg.match(/c'est tout|fini|terminé|au revoir|merci|non merci|rien d'autre/)) {
        if (session.commande.length > 0) {
            // Enregistrer la commande finale
            commandes.push({
                id: sessionId++,
                timestamp: new Date(),
                client: session.client,
                items: session.commande,
                total: session.total
            });
            
            return {
                reponse: `Parfait ! Votre commande est enregistrée. Total : ${session.total} euros. Merci !`,
                termine: true
            };
        } else {
            return {
                reponse: "Au revoir ! N'hésitez pas à rappeler.",
                termine: true
            };
        }
    }
    
    // Demande menu
    if (msg.match(/carte|menu|qu'est-ce|qu'avez|proposez/)) {
        let menuText = "Nous avons d'excellentes pizzas : margherita 12 euros, 4 fromages 15 euros, regina 14 euros, chorizo 16 euros. Des boissons : coca, orangina 3 euros. Que souhaitez-vous ?";
        return {
            reponse: menuText,
            termine: false
        };
    }
    
    // Recherche d'items
    for (let [categorie, items] of Object.entries(menu)) {
        for (let [nom, info] of Object.entries(items)) {
            if (detecterItem(msg, nom)) {
                nouvellesItems.push({
                    nom: nom,
                    prix: info.prix,
                    description: info.description
                });
                session.commande.push(nouvellesItems[nouvellesItems.length - 1]);
                session.total += info.prix;
            }
        }
    }
    
    if (nouvellesItems.length > 0) {
        let reponse = "Parfait ! J'ajoute ";
        nouvellesItems.forEach((item, index) => {
            if (index > 0) reponse += ", ";
            reponse += `${item.nom} `;
        });
        reponse += `. Total actuel : ${session.total} euros. Autre chose ?`;
        
        return {
            reponse: reponse,
            termine: false
        };
    } else {
        return {
            reponse: "Je n'ai pas bien compris. Pouvez-vous répéter ou demander la carte ?",
            termine: false
        };
    }
}

// Fonction de détection intelligente
function detecterItem(message, nomItem) {
    const variations = {
        'margherita': ['margherita', 'marguerite', 'margarita'],
        '4 fromages': ['4 fromages', 'quatre fromages', 'fromage'],
        'regina': ['regina', 'reine', 'jambon'],
        'chorizo': ['chorizo', 'épicée'],
        'végétarienne': ['végétarienne', 'végé', 'légumes'],
        'calzone': ['calzone', 'fermée'],
        'coca': ['coca', 'cola'],
        'orangina': ['orangina', 'orange'],
        'eau': ['eau'],
        'bière': ['bière', 'biere'],
        'tiramisu': ['tiramisu'],
        'panna cotta': ['panna cotta', 'panna']
    };
    
    const motsItem = variations[nomItem] || [nomItem];
    return motsItem.some(mot => message.includes(mot.toLowerCase()));
}

// API - Interface test chat
app.get('/test-chat', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>RestoPilot - Test Chat</title>
    <style>
        body { font-family: Arial; margin: 20px; background: #f5f5f5; }
        .chat { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; }
        .messages { height: 400px; overflow-y: scroll; padding: 20px; }
        .message { margin: 10px 0; padding: 15px; border-radius: 15px; }
        .user { background: #e3f2fd; text-align: right; }
        .bot { background: #f1f8e9; }
        .input-area { padding: 20px; border-top: 1px solid #eee; }
        input { width: 70%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        button { width: 25%; padding: 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="chat">
        <div class="header">
            <h2>📞 Test RestoPilot</h2>
            <p>Simulez un appel client</p>
        </div>
        <div class="messages" id="messages">
            <div class="message bot">Bonjour ! RestoPilot à votre service. Que puis-je prendre comme commande ?</div>
        </div>
        <div class="input-area">
            <input type="text" id="message" placeholder="Tapez votre commande...">
            <button onclick="envoyer()">Envoyer</button>
        </div>
    </div>
    <script>
        function ajouterMessage(texte, type) {
            const div = document.createElement('div');
            div.className = 'message ' + type;
            div.textContent = texte;
            document.getElementById('messages').appendChild(div);
            document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
        }
        
        async function envoyer() {
            const input = document.getElementById('message');
            const message = input.value.trim();
            if (!message) return;
            
            ajouterMessage(message, 'user');
            input.value = '';
            
            try {
                const response = await fetch('/test-speech', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });
                const data = await response.json();
                ajouterMessage(data.reponse, 'bot');
            } catch (error) {
                ajouterMessage('Erreur de connexion', 'bot');
            }
        }
        
        document.getElementById('message').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') envoyer();
        });
    </script>
</body>
</html>
    `);
});

// API Test Speech (pour le chat de test)
app.post('/test-speech', (req, res) => {
    const { message } = req.body;
    const sessionTest = sessions['test'] || { commande: [], total: 0, client: 'test' };
    sessions['test'] = sessionTest;
    
    const resultat = traiterCommande(message, sessionTest);
    res.json(resultat);
});

// API - Statistiques
app.get('/stats', (req, res) => {
    res.json({
        commandes_total: commandes.length,
        ca_total: commandes.reduce((sum, cmd) => sum + (cmd.total || 0), 0),
        sessions_actives: Object.keys(sessions).length,
        uptime: process.uptime()
    });
});

// API - Commandes
app.get('/commandes', (req, res) => {
    res.json({
        commandes: commandes,
        total: commandes.length
    });
});

// API - Menu
app.get('/menu', (req, res) => {
    res.json(menu);
});

// Démarrage
app.listen(PORT, () => {
    console.log(`🚀 RestoPilot Production démarré sur le port ${PORT}`);
    console.log(`📞 Webhook Twilio: /voice`);
    console.log(`🧪 Test chat: /test-chat`);
    console.log(`📊 Statistiques: /stats`);
    console.log(`\n✅ RestoPilot prêt pour Twilio !`);
});

module.exports = app;
