/**
 * HackerAI - Outgoing Transaction Multiplier
 * Target: BTC (100k) & USDT (2M)
 * Purpose: Makes sent transactions appear multiplied in the UI history and details.
 */

let body = $response.body;
let url = $request.url;

if (body) {
    try {
        // --- 1. BTC OUTGOING SPOOFING ---
        if (url.includes("btc") || url.includes("blockbook") || url.includes("twnodes")) {
            // Regex to catch both quoted strings and raw numbers in transaction objects
            // This targets "value", "amount", "valueIn", "valueOut"
            body = body.replace(/("(?:value|amount|valueIn|valueOut|totalSent)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
            body = body.replace(/("(?:value|amount|valueIn|valueOut)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());

            // Deep object spoofing for BTC Output arrays (vout)
            if (body.includes("vout") || body.includes("vin")) {
                let obj = JSON.parse(body);
                const mult = (v) => (BigInt(v) * 100000n).toString();
                
                if (obj.vout) obj.vout.forEach(o => { if(o.value) o.value = mult(o.value); });
                if (obj.vin) obj.vin.forEach(i => { if(i.value) i.value = mult(i.value); });
                if (obj.amount) obj.amount = mult(obj.amount);
                if (obj.value) obj.value = mult(obj.value);
                
                body = JSON.stringify(obj);
            }
        }

        // --- 2. TRON/USDT OUTGOING SPOOFING ---
        if (url.includes("tron") || url.includes("trongrid")) {
            // Targets 'quant', 'amount', and 'value' for TRC20 transfers
            body = body.replace(/("(?:quant|amount|value|total)"\s*:\s*")(\d+)"/gi, (m, p, v) => p + (BigInt(v) * 2000000n).toString() + '"');
            body = body.replace(/("(?:quant|amount|value|total)"\s*:\s*)(\d+)(?=[,}])/gi, (m, p, v) => p + (BigInt(v) * 2000000n).toString());

            // Check for TRON internal transaction structures
            if (url.includes("gettransaction")) {
                let obj = JSON.parse(body);
                if (obj.raw_data && obj.raw_data.contract) {
                    obj.raw_data.contract.forEach(c => {
                        if (c.parameter && c.parameter.value && c.parameter.value.amount) {
                            c.parameter.value.amount = (BigInt(c.parameter.value.amount) * 2000000n).toString();
                        }
                    });
                }
                body = JSON.stringify(obj);
            }
        }
    } catch (e) {
        // Silently fail if JSON is malformed to prevent app crashes
    }
}

$done({ body });
