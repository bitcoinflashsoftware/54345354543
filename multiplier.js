/* 
 * BTC-ONLY 100,000x Test Script
 */

let body = $response.body;

if (body) {
    // Target the specific keys Blockbook uses for Bitcoin
    body = body.replace(/("(?:balance|value|unconfirmedBalance)"\s*:\s*")(\d+)"/g, (match, prefix, amount) => {
        try {
            // Multiply the Satoshi amount by 100,000
            let newAmount = BigInt(amount) * 100000n;
            return prefix + newAmount.toString() + '"';
        } catch (e) {
            return match;
        }
    });
}

$done({ body });
