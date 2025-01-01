const express = require('express');
const bodyParser = require('body-parser');
const { Connection, PublicKey, clusterApiUrl, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram } = require('@solana/web3.js');
const path = require('path');
require('dotenv').config(); // Für Umgebungsvariablen

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Solana Verbindung
const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

// Seed Sale Wallet (Public Key)
const seedSaleWallet = new PublicKey('32jVXUfnQYdRxbYCs5mTaaiJkkcoJ9WfjDGyoQnffr1a');

// Route: Home
app.get('/', (req, res) => {
    res.render('index', { message: null });
});

// Route: Handle Token Purchase
app.post('/buy', async (req, res) => {
    const buyerWallet = req.body.walletAddress;
    const solAmount = parseFloat(req.body.solAmount);

    if (!buyerWallet || !solAmount || solAmount < 0.025) {
        return res.render('index', { message: 'Ungültige Eingaben. Mindestbetrag ist 0,025 SOL.' });
    }

    try {
        // Berechne die Anzahl der SKLO-Token
        const skloAmount = solAmount * 376000; // 1 SOL = 376.000 SKLO

        // Lade den Keypair des Seed Sale Wallets aus Umgebungsvariablen
        const seedSaleSecretKey = Uint8Array.from(JSON.parse(process.env.SEED_SALE_SECRET_KEY));
        const seedSaleKeypair = Keypair.fromSecretKey(seedSaleSecretKey);

        // Erstelle eine Transaktion zum Senden von SOL an den Käufer
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: seedSaleKeypair.publicKey,
                toPubkey: new PublicKey(buyerWallet),
                lamports: solAmount * LAMPORTS_PER_SOL,
            })
        );

        // Sende die Transaktion
        const signature = await connection.sendTransaction(transaction, [seedSaleKeypair]);

        // Bestätige die Transaktion
        await connection.confirmTransaction(signature, 'confirmed');

        res.render('index', { message: `Transaktion erfolgreich! Signature: ${signature}` });
    } catch (error) {
        console.error(error);
        res.render('index', { message: 'Fehler bei der Transaktion. Bitte versuche es erneut.' });
    }
});

// Starte den Server
app.listen(port, () => {
    console.log(`Seed Sale App läuft unter http://localhost:${port}`);
});

