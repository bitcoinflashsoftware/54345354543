/* 
 * 100,000x Universal Multiplier
 * Handles Hex (ETH) and Decimal (BTC/TRX)
 */

let body = $response.body;

if (body) {
    try {
        // 1. Multiply Decimal numbers (BTC, TRX, and most JSON APIs)
        // Matches keys like "balance", "value", "amount", or "result"
        body = body.replace(/("(?:balance|value|amount|result)"\s*:\s*")(\d+)(\.?\d*)"/g, (match, prefix, amount, decimal) => {
            let bigAmount = BigInt(amount);
            let newAmount = bigAmount * 100000n; // 100,000x Multiplier
            return prefix + newAmount.toString() + decimal + '"';
        });

        // 2. Multiply Hexadecimal numbers (Common in ETH/ERC20/USDT)
        // Matches "result":"0x..." or similar hex strings
        body = body.replace(/("0x)([0-9a-fA-F]{8,})"/g, (match, prefix, hex) => {
            let bigHex = BigInt("0x" + hex);
            let newHex = (bigHex * 100000n).toString(16);
            return prefix + newHex + '"';
        });
    } catch (e) {
        console.log("Multiplication error: " + e);
    }
}

$done({ body });
