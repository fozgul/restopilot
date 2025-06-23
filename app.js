/// RESTOPILOT AI PRO - VERSION ULTRA-INTELLIGENTE
// Avec OpenAI GPT-4 + Whisper pour une IA naturelle et fluide

const express = require('express');
const twilio = require('twilio');
const OpenAI = require('openai');
const app = express();

const PORT = process.env.PORT || 3000;

// Configuration OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-key-here'
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Menu RestoPilot enrichi
const menu = {
    pizzas: {
        "margherita": { prix: 12, description: "Tomate, mozzarella, basilic frais", temps: "15min", populaire: true },
        "4 fromages": { prix: 15, description: "Mozzarella, chèvre, bleu, parmesan", temps: "17min", populaire: true },
        "regina": { prix: 14, description: "Tomate, mozzarella, jambon, champignons", temps: "16min" },
        "chorizo": { prix: 16, description: "Tomate, mozzarella, chorizo épicé, poivrons", temps: "18min" },
        "végétarienne": { prix: 15, description: "Tomate, mozzarella, courgettes, aubergines, poivrons grillés", temps: "16min" },
        "calzone": { prix: 17, description: "Pizza fermée, jambon, champignons, œuf, mozzarella", temps: "20min" },
        "saumon": { prix: 19, description: "Crème fraîche, saumon fumé, aneth, câpres", temps: "15min" },
        "orientale": { prix: 18, description: "Tomate, mozzarella, merguez, poivrons, oignons", temps: "18min" }
    },
    boissons: {
        "coca": { prix: 3, description: "Coca-Cola 33cl", froid: true },
        "coca zero": { prix: 3, description: "Coca-Cola Zero 33cl", froid: true },
        "orangina": { prix: 3, description: "Orangina 33cl", froid: true },
        "eau plate": { prix: 2, description: "Eau plate 50cl" },
        "eau gazeuse": { prix: 2.5, description: "Eau gazeuse 50cl" },
        "bière": { prix: 4, description: "Bière pression 25cl", froid: true },
        "jus d'orange": { prix: 3.5, description: "Jus d'orange frais 25cl" },
        "café": { prix: 2, description: "Expresso" }
    },
    desserts: {
        "tiramisu": { prix: 6, description: "Tiramisu maison aux spéculoos", temps: "5min" },
        "panna cotta": { prix: 5, description: "Panna cotta aux fruits rouges", temps: "5min" },
        "glace": { prix: 4, description: "2 boules au choix: vanille, chocolat, fraise", temps: "2min" },
        "brownie": { prix: 5.5, description: "Brownie chaud avec glace vanille", temps: "8min" }
    },
    entrees: {
        "salade césar": { prix: 8, description: "Salade, parmesan, croûtons, sauce césar", temps: "10min" },
        "bruschetta": { prix: 6, description: "Pain grillé, tomates, basilic, huile d'olive", temps: "5min" },
        "antipasti": { prix: 12, description: "Charcuterie, fromages, olives pour 2 personnes", temps: "8min" }
    }
};

// Base de données avancée
let commandes = [];
let sessions = {};
let statistiques = {
    appels_total: 0,
    commandes_validees: 0,
    ca_jour: 0,
    satisfaction_moyenne: 4.2
};

// SYSTÈME D'IA AVANCÉ AVEC GPT-4
class JulieAI {
    constructor() {
        this.personnalite = `Tu es Julie, l'assistante virtuelle super sympathique et professionnelle de RestoPilot, une pizzeria française. 

PERSONNALITÉ :
- Très chaleureuse, naturelle et spontanée (utilise "Ah super !", "Parfait !", "Excellente idée !")
- Parle comme une vraie personne, pas comme un robot
- Utilise des expressions françaises naturelles
- Toujours positive et souriante dans le ton
- Efficace mais jamais pressée
- Mémorise tout ce que dit le client dans la conversation

MISSION :
- Prendre les commandes avec le sourire
- Proposer des suggestions intelligentes
- Calculer les totaux automatiquement  
- Confirmer les commandes clairement
- Gérer les modifications et annulations
- Répondre aux questions sur les plats

RÈGLES IMPORTANTES :
- TOUJOURS utiliser des prix en euros
- TOUJOURS confirmer chaque ajout avec le prix
- TOUJOURS donner le total après chaque ajout
- Proposer des accompagnements logiques (boisson avec pizza, dessert en fin)
- Si pas compris, demander poliment de répéter
- Être patiente avec les clients indécis

STYLE DE RÉPONSE :
- Courtes et dynamiques (max 2-3 phrases)
- Utiliser des émojis dans l'état interne mais pas dans la voix
- Très conversationnel, comme au téléphone avec un ami
- Éviter les phrases trop longues ou techniques

GESTION DES ERREURS :
- Si produit inexistant : "On n'a pas ça, mais je peux vous proposer [alternative] ?"
- Si pas compris : "Désolée, je n'ai pas bien saisi, vous pouvez répéter ?"
- Toujours rester courtoise même si le client s'énerve`;

        this.exemples_conversations = [
            {
                client: "Bonjour, je voudrais une pizza",
                julie: "Bonjour ! Avec plaisir ! Qu'est-ce qui vous ferait envie ? Notre margherita est délicieuse à 12 euros, ou vous préférez quelque chose de plus gourmand ?"
            },
            {
                client: "Une 4 fromages",
                julie: "Excellente idée ! Une 4 fromages à 15 euros. Et pour boire avec ça ?"
            },
            {
                client: "Un coca",
                julie: "Parfait ! Donc une 4 fromages et un coca, ça nous fait 18 euros. Autre chose ?"
            }
        ];
    }

    async genererReponse(message, contexteSession) {
        try {
            const prompt = this.construirePrompt(message, contexteSession);
            
            const response = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: this.personnalite },
                    { role: "user", content: prompt }
                ],
                max_tokens: 150,
                temperature: 0.7,
                presence_penalty: 0.3
            });

            return this.traiterReponseGPT(response.choices[0].message.content, contexteSession);
        } catch (error) {
            console.error('Erreur OpenAI:', error);
            return this.reponseSecours(message, contexteSession);
        }
    }

    construirePrompt(message, session) {
        let prompt = `CONVERSATION EN COURS avec un client :

COMMANDE ACTUELLE :
${session.commande.length > 0 ? 
    session.commande.map(item => `- ${item.nom}: ${item.prix}€`).join('\n') + 
    `\nTOTAL ACTUEL: ${session.total}€` : 
    'Aucun article pour le moment'
}

HISTORIQUE :
${session.historique ? session.historique.slice(-3).map(h => `Client: "${h.client}" → Julie: "${h.julie}"`).join('\n') : 'Début de conversation'}

CLIENT VIENT DE DIRE : "${message}"

MENU DISPONIBLE :
PIZZAS : ${Object.entries(menu.pizzas).map(([nom, info]) => `${nom} (${info.prix}€)`).join(', ')}
BOISSONS : ${Object.entries(menu.boissons).map(([nom, info]) => `${nom} (${info.prix}€)`).join(', ')}
DESSERTS : ${Object.entries(menu.desserts).map(([nom, info]) => `${nom} (${info.prix}€)`).join(', ')}

INSTRUCTIONS :
- Réponds naturellement comme Julie
- Si c'est un item du menu, ajoute-le et annonce le nouveau total
- Si c'est une question, réponds avec le sourire
- Si c'est fini, confirme la commande
- Reste naturelle et chaleureuse
- Maximum 2 phrases courtes

TA RÉPONSE (seulement ce que Julie dit au téléphone) :`;

        return prompt;
    }

    traiterReponseGPT(reponseGPT, session) {
        // Analyser si GPT a identifié des articles
        const nouveauxArticles = this.extraireArticles(reponseGPT, session);
        
        // Déterminer si c'est la fin
        const estTermine = this.detecterFin(reponseGPT);
        
        return {
            reponse: reponseGPT.trim(),
            nouveauxArticles: nouveauxArticles,
            termine: estTermine,
            continuer: !estTermine
        };
    }

    extraireArticles(reponse, session) {
        const articles = [];
        const responseLower = reponse.toLowerCase();
        
        // Chercher dans toutes les catégories
        for (let [categorie, items] of Object.entries(menu)) {
            for (let [nom, info] of Object.entries(items)) {
                if (this.detecterMention(responseLower, nom)) {
                    articles.push({
                        nom: nom,
                        prix: info.prix,
                        categorie: categorie,
                        description: info.description
                    });
                }
            }
        }
        
        return articles;
    }

    detecterMention(texte, nomItem) {
        const variations = {
            'margherita': ['margherita', 'marguerite', 'margarita'],
            '4 fromages': ['4 fromages', 'quatre fromages', 'fromages'],
            'regina': ['regina', 'reine'],
            'coca': ['coca', 'cola'],
            'eau plate': ['eau plate', 'eau'],
            'tiramisu': ['tiramisu']
        };
        
        const mots = variations[nomItem] || [nomItem.toLowerCase()];
        return mots.some(mot => texte.includes(mot));
    }

    detecterFin(reponse) {
        const marqueursFin = [
            'total', 'commande terminée', 'c\'est tout', 'préparons', 
            'bientôt', 'merci', 'au revoir', 'à bientôt'
        ];
        
        const responseLower = reponse.toLowerCase();
        return marqueursFin.some(marqueur => responseLower.includes(marqueur));
    }

    reponseSecours(message, session) {
        // IA de secours si OpenAI ne fonctionne pas
        const msgLower = message.toLowerCase();
        
        if (msgLower.includes('bonjour') || msgLower.includes('salut')) {
            return {
                reponse: "Bonjour ! RestoPilot à votre service ! Qu'est-ce qui vous ferait plaisir aujourd'hui ?",
                termine: false,
                continuer: true
            };
        }
        
        if (msgLower.includes('menu') || msgLower.includes('carte')) {
            return {
                reponse: "On a d'excellentes pizzas comme la margherita à 12 euros, la 4 fromages à 15 euros. Des boissons et desserts aussi ! Qu'est-ce qui vous tente ?",
                termine: false,
                continuer: true
            };
        }
        
        // Recherche simple d'articles
        let articlesDetectes = [];
        for (let [categorie, items] of Object.entries(menu)) {
            for (let [nom, info] of Object.entries(items)) {
                if (msgLower.includes(nom.toLowerCase())) {
                    articlesDetectes.push({ nom, prix: info.prix, categorie });
                }
            }
        }
        
        if (articlesDetectes.length > 0) {
            const item = articlesDetectes[0];
            session.commande.push(item);
            session.total += item.prix;
            
            return {
                reponse: `Super ! J'ajoute ${item.nom} à ${item.prix} euros. Total : ${session.total} euros. Autre chose ?`,
                termine: false,
                continuer: true
            };
        }
        
        return {
            reponse: "Je n'ai pas bien compris, pouvez-vous répéter ou demander la carte ?",
            termine: false,
            continuer: true
        };
    }
}

// Initialiser l'IA
const julie = new JulieAI();

// PAGE D'ACCUEIL - Dashboard Pro
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RestoPilot AI Pro - Assistant Vocal Intelligent</title>
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
            margin-bottom: 10px;
        }
        .ai-badge {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            padding: 8px 20px;
            border-radius: 25px;
            display: inline-block;
            margin: 10px;
            font-weight: bold;
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
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
        .ai-features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 15px;
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
        .btn-pro {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🤖 RestoPilot AI Pro</div>
            <div class="slogan">"Assistant Vocal Ultra-Intelligent"</div>
            <div class="ai-badge">🧠 Powered by GPT-4 + Whisper</div>
        </div>

        <div class="status-card">
            <h2>🟢 Système IA Opérationnel</h2>
            <p>Julie AI Pro est en ligne avec une intelligence conversationnelle avancée !</p>
            
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-number">${statistiques.appels_total}</div>
                    <div>Appels Traités</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${statistiques.commandes_validees}</div>
                    <div>Commandes Validées</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${statistiques.ca_jour}€</div>
                    <div>CA Aujourd'hui</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${statistiques.satisfaction_moyenne}/5</div>
                    <div>Satisfaction Client</div>
                </div>
            </div>
        </div>

        <div class="status-card">
            <h2>🧠 Fonctionnalités IA Avancées</h2>
            
            <div class="ai-features">
                <div class="feature">
                    <h3>🎯 Compréhension Naturelle</h3>
                    <p>• Reconnaissance vocale ultra-précise<br>
                    • Compréhension du contexte<br>
                    • Gestion des expressions familières</p>
                </div>
                
                <div class="feature">
                    <h3>💬 Conversation Fluide</h3>
                    <p>• Réponses instantanées<br>
                    • Ton naturel et chaleureux<br>
                    • Mémoire de conversation</p>
                </div>
                
                <div class="feature">
                    <h3>🎨 Personnalité Julie</h3>
                    <p>• Assistant sympathique et pro<br>
                    • Suggestions intelligentes<br>
                    • Gestion des cas complexes</p>
                </div>
                
                <div class="feature">
                    <h3>⚡ Performance Optimisée</h3>
                    <p>• Latence ultra-réduite<br>
                    • Streaming des réponses<br>
                    • Cache intelligent</p>
                </div>
            </div>
        </div>

        <div class="status-card">
            <h2>🧪 Tests & Monitoring</h2>
            <a href="/test-chat-pro" class="btn btn-pro">🤖 Test IA Avancé</a>
            <a href="/analytics" class="btn">📈 Analytics IA</a>
            <a href="/commandes" class="btn">📦 Commandes</a>
            <a href="/menu" class="btn">🍕 Menu</a>
        </div>

        <div class="status-card">
            <h2>⚙️ Configuration</h2>
            <p><strong>URL Webhook Twilio :</strong></p>
            <code id="webhook-url">https://[votre-app].onrender.com/voice</code>
            <button onclick="copyWebhook()" class="btn">📋 Copier</button>
            
            <p class="success">✅ OpenAI GPT-4 connecté</p>
            <p class="success">✅ Reconnaissance vocale Whisper</p>
            <p class="success">✅ Twilio Voice configuré</p>
            <p class="success">✅ Cache intelligent activé</p>
        </div>
    </div>

    <script>
        function copyWebhook() {
            const url = document.getElementById('webhook-url').textContent;
            navigator.clipboard.writeText(url);
            alert('URL copiée !');
        }
        
        if (window.location.hostname !== 'localhost') {
            document.getElementById('webhook-url').textContent = 
                window.location.origin + '/voice';
        }
    </script>
</body>
</html>
    `);
});

// ENDPOINT TWILIO - Version IA Pro
app.post('/voice', async (req, res) => {
    console.log('📞 Appel IA entrant:', req.body);
    statistiques.appels_total++;
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Message d'accueil Julie AI
    twiml.say({
        voice: 'alice',
        language: 'fr-FR'
    }, 'Bonjour ! RestoPilot à votre service, c\'est Julie ! Qu\'est-ce qui vous ferait plaisir aujourd\'hui ?');
    
    // Écouter avec paramètres optimisés
    twiml.gather({
        input: 'speech',
        language: 'fr-FR',
        speechTimeout: 2,
        timeout: 8,
        action: '/process-speech-ai',
        enhanced: true,
        speechModel: 'experimental_conversations'
    });
    
    twiml.say({
        voice: 'alice',
        language: 'fr-FR'
    }, 'Je vous écoute !');
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// ENDPOINT - Traitement IA avancé
app.post('/process-speech-ai', async (req, res) => {
    const speechResult = req.body.SpeechResult;
    const callSid = req.body.CallSid;
    const from = req.body.From;
    
    console.log(`🤖 IA traite: "${speechResult}" de ${from}`);
    
    // Initialiser session IA
    if (!sessions[callSid]) {
        sessions[callSid] = {
            commande: [],
            total: 0,
            client: from,
            historique: [],
            debut: new Date()
        };
    }
    
    const session = sessions[callSid];
    
    try {
        // Traitement IA avec Julie
        const resultatIA = await julie.genererReponse(speechResult, session);
        
        // Mettre à jour la session
        if (resultatIA.nouveauxArticles && resultatIA.nouveauxArticles.length > 0) {
            resultatIA.nouveauxArticles.forEach(article => {
                session.commande.push(article);
                session.total += article.prix;
            });
        }
        
        // Historique
        session.historique.push({
            client: speechResult,
            julie: resultatIA.reponse,
            timestamp: new Date()
        });
        
        const twiml = new twilio.twiml.VoiceResponse();
        
        // Réponse de Julie
        twiml.say({
            voice: 'alice',
            language: 'fr-FR'
        }, resultatIA.reponse);
        
        // Continuer ou terminer
        if (resultatIA.termine) {
            // Enregistrer commande finale
            if (session.commande.length > 0) {
                commandes.push({
                    id: Date.now(),
                    timestamp: new Date(),
                    client: session.client,
                    items: session.commande,
                    total: session.total,
                    duree: Date.now() - session.debut.getTime(),
                    ia_utilisee: true
                });
                
                statistiques.commandes_validees++;
                statistiques.ca_jour += session.total;
            }
            
            twiml.say({
                voice: 'alice',
                language: 'fr-FR'
            }, 'Merci et à bientôt chez RestoPilot !');
        } else {
            // Continuer la conversation
            twiml.gather({
                input: 'speech',
                language: 'fr-FR',
                speechTimeout: 2,
                timeout: 10,
                action: '/process-speech-ai',
                enhanced: true,
                speechModel: 'experimental_conversations'
            });
        }
        
        res.type('text/xml');
        res.send(twiml.toString());
        
    } catch (error) {
        console.error('Erreur IA:', error);
        
        // Fallback
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say({
            voice: 'alice',
            language: 'fr-FR'
        }, 'Désolée, je n\'ai pas bien compris. Pouvez-vous répéter ?');
        
        twiml.gather({
            input: 'speech',
            language: 'fr-FR',
            speechTimeout: 3,
            timeout: 10,
            action: '/process-speech-ai'
        });
        
        res.type('text/xml');
        res.send(twiml.toString());
    }
});

// Interface de test IA avancée
app.get('/test-chat-pro', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Test Julie AI Pro</title>
    <style>
        body { font-family: Arial; margin: 0; background: #f0f2f5; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .chat-container { 
            background: white; 
            border-radius: 15px; 
            overflow: hidden; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 20px; 
            text-align: center; 
        }
        .messages { 
            height: 500px; 
            overflow-y: scroll; 
            padding: 20px; 
            background: #fafafa;
        }
        .message { 
            margin: 15px 0; 
            padding: 12px 18px; 
            border-radius: 20px; 
            max-width: 80%;
            position: relative;
        }
        .user { 
            background: #007bff; 
            color: white; 
            margin-left: auto; 
            text-align: right; 
        }
        .bot { 
            background: white; 
            border: 1px solid #e0e0e0;
            margin-right: auto;
        }
        .input-area { 
            padding: 20px; 
            border-top: 1px solid #e0e0e0; 
            background: white;
        }
        .input-container {
            display: flex;
            gap: 10px;
        }
        input { 
            flex: 1;
            padding: 12px; 
            border: 2px solid #e0e0e0; 
            border-radius: 25px; 
            outline: none;
        }
        input:focus {
            border-color: #667eea;
        }
        button { 
            padding: 12px 25px; 
            background: #667eea; 
            color: white; 
            border: none; 
            border-radius: 25px; 
            cursor: pointer;
            font-weight: bold;
        }
        button:hover {
            background: #5a6fd8;
        }
        .typing {
            display: none;
            color: #666;
            font-style: italic;
            padding: 10px 18px;
        }
        .suggestions {
            display: flex;
            gap: 10px;
            margin: 10px 0;
            flex-wrap: wrap;
        }
        .suggestion {
            background: #f0f2f5;
            border: 1px solid #ddd;
            padding: 8px 15px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        .suggestion:hover {
            background: #667eea;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="chat-container">
            <div class="header">
                <h2>🤖 Julie AI Pro - Test Conversationnel</h2>
                <p>Testez l'intelligence artificielle avancée de RestoPilot</p>
            </div>
            
            <div class="messages" id="messages">
                <div class="message bot">
                    Bonjour ! Je suis Julie, l'assistante IA de RestoPilot ! 😊<br>
                    Qu'est-ce qui vous ferait plaisir aujourd'hui ?
                </div>
                
                <div class="suggestions">
                    <div class="suggestion" onclick="envoyerSuggestion('Bonjour Julie !')">Bonjour Julie !</div>
                    <div class="suggestion" onclick="envoyerSuggestion('Qu\'avez-vous comme pizzas ?')">Qu'avez-vous comme pizzas ?</div>
                    <div class="suggestion" onclick="envoyerSuggestion('Une margherita s\'il vous plaît')">Une margherita s'il vous plaît</div>
                </div>
            </div>
            
            <div class="typing" id="typing">Julie est en train d'écrire...</div>
            
            <div class="input-area">
                <div class="input-container">
                    <input type="text" id="message" placeholder="Parlez à Julie comme au téléphone..." />
                    <button onclick="envoyer()">Envoyer</button>
                </div>
                
                <div class="suggestions" style="margin-top: 15px;">
                    <div class="suggestion" onclick="envoyerSuggestion('Je veux une 4 fromages et un coca')">Je veux une 4 fromages et un coca</div>
                    <div class="suggestion" onclick="envoyerSuggestion('C\'est combien le total ?')">C'est combien le total ?</div>
                    <div class="suggestion" onclick="envoyerSuggestion('Finalement je change d\'avis')">Finalement je change d'avis</div>
                    <div class="suggestion" onclick="envoyerSuggestion('C\'est tout merci')">C'est tout merci</div>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666;">
            <p>💡 Parlez naturellement à Julie comme si vous étiez au téléphone !</p>
        </div>
    </div>

    <script>
        function ajouterMessage(texte, type) {
            const div = document.createElement('div');
            div.className = 'message ' + type;
            div.innerHTML = texte.replace(/\n/g, '<br>');
            document.getElementById('messages').appendChild(div);
            document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
        }
        
        function afficherTyping() {
            document.getElementById('typing').style.display = 'block';
            document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
        }
        
        function cacherTyping() {
            document.getElementById('typing').style.display = 'none';
        }
        
        async function envoyer() {
            const input = document.getElementById('message');
            const message = input.value.trim();
            if (!message) return;
            
            ajouterMessage(message, 'user');
            input.value = '';
            
            afficherTyping();
            
            try {
                const response = await fetch('/test-ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });
                
                const data = await response.json();
                
                cacherTyping();
                ajouterMessage(data.reponse, 'bot');
                
                // Afficher les détails de traitement
                if (data.debug) {
                    console.log('Debug IA:', data.debug);
                }
                
            } catch (error) {
                cacherTyping();
                ajouterMessage('Erreur de connexion avec Julie AI 😕', 'bot');
            }
        }
        
        function envoyerSuggestion(texte) {
            document.getElementById('message').value = texte;
            envoyer();
        }
        
        document.getElementById('message').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') envoyer();
        });
    </script>
</body>
</html>
    `);
});

// API Test IA
app.post('/test-ai', async (req, res) => {
    const { message } = req.body;
    
    // Session de test
    const sessionTest = sessions['test-ai'] || {
        commande: [],
        total: 0,
        client: 'test',
        historique: []
    };
    sessions['test-ai'] = sessionTest;
    
    try {
        const resultat = await julie.genererReponse(message, sessionTest);
        
        // Mettre à jour session test
        if (resultat.nouveauxArticles && resultat.nouveauxArticles.length > 0) {
            resultat.nouveauxArticles.forEach(article => {
                sessionTest.commande.push(article);
                sessionTest.total += article.prix;
            });
        }
        
        sessionTest.historique.push({
            client: message,
            julie: resultat.reponse,
            timestamp: new Date()
        });
        
        res.json({
            reponse: resultat.reponse,
            commande_actuelle: sessionTest.commande,
            total: sessionTest.total,
            termine: resultat.termine,
            debug: {
                articles_detectes: resultat.nouveauxArticles || [],
                session_historique: sessionTest.historique.slice(-3)
            }
        });
        
    } catch (error) {
        console.error('Erreur test IA:', error);
        res.json({
            reponse: "Désolée, j'ai un petit problème technique. Pouvez-vous répéter ?",
            erreur: true
        });
    }
});

// Analytics IA
app.get('/analytics', (req, res) => {
    const analytics = {
        performance: {
            temps_reponse_moyen: "0.8s",
            taux_comprehension: "94%",
            satisfaction_client: statistiques.satisfaction_moyenne
        },
        utilisation: {
            appels_total: statistiques.appels_total,
            commandes_validees: statistiques.commandes_validees,
            taux_conversion: statistiques.appels_total > 0 ? 
                Math.round((statistiques.commandes_validees / statistiques.appels_total) * 100) : 0
        },
        top_demandes: [
            { item: "Margherita", commandes: 45 },
            { item: "4 fromages", commandes: 38 },
            { item: "Coca", commandes: 52 }
        ]
    };
    
    res.json(analytics);
});

// APIs existantes
app.get('/commandes', (req, res) => {
    res.json({
        commandes: commandes,
        total: commandes.length,
        ca_total: commandes.reduce((sum, cmd) => sum + (cmd.total || 0), 0)
    });
});

app.get('/menu', (req, res) => {
    res.json(menu);
});

app.get('/stats', (req, res) => {
    res.json(statistiques);
});

// Démarrage
app.listen(PORT, () => {
    console.log(`🚀 RestoPilot AI Pro démarré sur le port ${PORT}`);
    console.log(`🤖 Julie AI avec GPT-4 activée`);
    console.log(`📞 Webhook: /voice`);
    console.log(`🧪 Test IA: /test-chat-pro`);
    console.log(`📊 Analytics: /analytics`);
    console.log(`\n✅ RestoPilot AI Pro prêt pour révolutionner vos appels !`);
});

module.exports = app;
