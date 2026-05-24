/*
 * ============================================================
 * ATOMIC WALLET - BITCOIN BALANCE ×100,000 MULTIPLIER v1.0
 * Shadowrocket MITM HTTP Response Script
 * 
 * Targets: bitcoin.atomicwallet.io (BlockbookV2 Explorer)
 *           *.atomicwallet.io (fallback)
 * 
 * Multiplies your real BTC balance by 100,000x
 * Works on address balance endpoint and UTXO endpoint
 * ============================================================
 */

// ========== CONFIG ==========
const MULTIPLIER = 100000;
// ============================

(function() {
    
    const url = ($request && $request.url) || ($response && $response.url) || '';
    const lowerUrl = url.toLowerCase();

    // Only process Atomic Wallet domains
    if (!lowerUrl.includes('atomicwallet.io')) {
        $done({});
        return;
    }

    // Only process response bodies
    if (!$response || !$response.body) {
        $done({});
        return;
    }

    try {
        const modified = multiplyBalance($response.body);
        console.log(`[Atomic-BTC-Multiplier] ×${MULTIPLIER} applied: ${url}`);
        $done({ body: modified });
    } catch (e) {
        console.log(`[Atomic-BTC-Multiplier] Error: ${e.message}`);
        $done({});
    }

})();

function multiplyBalance(body) {
    const json = JSON.parse(body);
    
    // Pattern 1: BlockbookV2 address endpoint
    // /api/v2/address/{address}
    // { "balance": "12345678", "totalReceived": "...", "totalSent": "..." }
    if (json.balance !== undefined && json.address !== undefined) {
        json.balance = multiplyStr(json.balance);
        if (json.totalReceived) json.totalReceived = multiplyStr(json.totalReceived);
        if (json.totalSent) json.totalSent = multiplyStr(json.totalSent);
        return JSON.stringify(json);
    }
    
    // Pattern 2: UTXO endpoint
    // /api/v2/utxo/{address}
    // [{ "value": "12345678", ... }]
    if (Array.isArray(json) && json.length > 0 && json[0].value !== undefined) {
        for (let i = 0; i < json.length; i++) {
            json[i].value = multiplyStr(json[i].value);
        }
        return JSON.stringify(json);
    }
    
    // Pattern 3: Simple balance field (string)
    if (json.balance !== undefined && typeof json.balance === 'string') {
        json.balance = multiplyStr(json.balance);
        return JSON.stringify(json);
    }
    
    // Pattern 4: Simple balance field (number)
    if (json.balance !== undefined && typeof json.balance === 'number') {
        json.balance = json.balance * MULTIPLIER;
        return JSON.stringify(json);
    }
    
    // Pattern 5: page/totalPages pagination - multiply pageItems too
    if (json.page !== undefined && json.itemsOnPage !== undefined) {
        if (json.balance !== undefined) {
            json.balance = multiplyStr(json.balance);
        }
        return JSON.stringify(json);
    }
    
    return body;
}

function multiplyStr(val) {
    // JavaScript can handle up to 2^53 safely
    // BTC satoshis max ~2.1e15, ×100000 = 2.1e20 - use BigInt for safety
    try {
        if (typeof BigInt !== 'undefined') {
            const result = BigInt(String(val)) * BigInt(MULTIPLIER);
            return result.toString();
        }
    } catch (e) {
        // Fallback to number
    }
    
    const num = parseInt(String(val), 10);
    if (isNaN(num)) return val;
    return String(num * MULTIPLIER);
}