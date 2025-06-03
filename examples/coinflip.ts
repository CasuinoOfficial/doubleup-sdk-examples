import { Transaction } from "@mysten/sui/transactions";
import { DBClient, getSigner } from "./utils";


// Simple example on how to integrate with coinflip
// Make sure you have an .env file with an SK=suiprivkeyabcd... a private key as returned by the Slush wallet 
// if you want to test. For other wallets check if there is a bech32 output of the private key.

const COIN_TYPE = "0x2::sui::SUI" // this should be variable depending on the types of coins you will offer
// The coin decimals are very important, if you get it wrong you will over pay or under pay
// In order to find them you will need to call `DBClient.suiClient.getCoinMetadata({coinType: COIN_TYPE})`
const COIN_DECIMALS = 9;
// pick is either 0 or 1 you may set 0 and 1 be whatever you prefer for example:
const coinSideToNumber: {[key: string]: 0 | 1} = {
    "heads": 0,
    "tails": 1
}
const coinflipTx = async (
    pick: "heads" | "tails",
    amount: number
) => {
    const tx = new Transaction();

    // get coin
    // tx.gas only works with SUI
    const coin = tx.splitCoins(tx.gas, [amount * 10**COIN_DECIMALS]);
    DBClient.createCoinflip({
        betTypes: [coinSideToNumber[pick]], // this is an array, 1 element means 1 flip, 2 elements mean 2 flips...
        coinType: COIN_TYPE,
        coin,
        transaction: tx,
        origin: "Project Name"
    });

    // here you will have to sign and execute using the user's wallet on the frontend side
    // in the demo we use a private key
    const keypair = getSigner();
    const response = await DBClient.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: {
            showEffects: true,
            showEvents: true
        }
    });

    console.log(response);
    console.log(`Coinflip transaction status is ${response.effects?.status.status}`);

    // getting the result from the event
    const evt = response.events?.filter(event => event.type.includes("BetResults"))[0];
    const eventResults = evt?.parsedJson as any;
    console.log(eventResults);
    console.log(`The bet ${Number(eventResults.bets[0].bet_returned) > 0 ? "won" : "lost"}`);
    console.log(`Bet amount: ${Number(eventResults.bets[0].bet_size) / 10**COIN_DECIMALS} ${COIN_TYPE}`);
    console.log(`Won amount: ${eventResults.bets[0].bet_returned}`);
    // The outcome decides if the bet wins, for coinflip if the bet is 0 an outcome less than 500 wins
    // and if the bet is 1 an outcome more than 500 wins
    console.log(`Random outcome: ${eventResults.bets[0].outcome}`);
}

coinflipTx("heads", 1);