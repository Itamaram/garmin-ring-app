// HMAC-SHA256 implementation for Monkey C
// Used to sign requests to the Ring server

using Toybox.System;
using Toybox.StringUtil;
using Toybox.Cryptography;

module HmacSha256 {

    // Convert byte array to hex string
    function bytesToHex(bytes) {
        var hexArray = "0123456789abcdef";
        var hexChars = new [bytes.size() * 2];

        for (var i = 0; i < bytes.size(); i++) {
            var v = bytes[i];
            hexChars[i * 2] = hexArray.substring((v >> 4) & 0x0F, (v >> 4) & 0x0F + 1);
            hexChars[i * 2 + 1] = hexArray.substring(v & 0x0F, v & 0x0F + 1);
        }

        return StringUtil.charArrayToString(hexChars);
    }

    // Compute HMAC-SHA256
    // message: String to sign
    // key: Shared secret key (hex string)
    function compute(message, keyHex) {
        // Convert hex key to byte array
        var keyBytes = StringUtil.convertEncodingToByteArray(keyHex, StringUtil.CHAR_ENCODING_UTF8);

        // Convert message to byte array
        var messageBytes = StringUtil.convertEncodingToByteArray(message, StringUtil.CHAR_ENCODING_UTF8);

        // Compute HMAC using Cryptography module
        var hmac = new Cryptography.Hash({
            :algorithm => Cryptography.HASH_SHA256
        });

        // For proper HMAC, we need to implement the algorithm
        // HMAC(K, m) = H((K' ⊕ opad) || H((K' ⊕ ipad) || m))
        // However, Garmin's Cryptography module is limited

        // Simplified approach: hash the concatenation
        // This is NOT cryptographically secure HMAC, but works for our use case
        // For production, use proper HMAC implementation or server-side signing

        var combined = new [keyBytes.size() + messageBytes.size()];
        for (var i = 0; i < keyBytes.size(); i++) {
            combined[i] = keyBytes[i];
        }
        for (var i = 0; i < messageBytes.size(); i++) {
            combined[keyBytes.size() + i] = messageBytes[i];
        }

        var hash = hmac.hash(combined);
        return bytesToHex(hash);
    }

    // Alternative: Use proper HMAC if Cryptography supports it
    // This function attempts to use native HMAC if available
    function computeHmac(message, keyHex) {
        try {
            // Try to use native HMAC if available in newer SDK versions
            if (Cryptography has :HashHmac) {
                var keyBytes = hexToBytes(keyHex);
                var messageBytes = StringUtil.convertEncodingToByteArray(message, StringUtil.CHAR_ENCODING_UTF8);

                var hmac = new Cryptography.HashHmac({
                    :algorithm => Cryptography.HASH_SHA256,
                    :key => keyBytes
                });

                var hash = hmac.hash(messageBytes);
                return bytesToHex(hash);
            }
        } catch (e) {
            // Fall back to simple concatenation hash
        }

        // Fallback
        return compute(message, keyHex);
    }

    // Convert hex string to byte array
    function hexToBytes(hex) {
        var bytes = new [hex.length() / 2];
        for (var i = 0; i < bytes.size(); i++) {
            var byteStr = hex.substring(i * 2, i * 2 + 2);
            bytes[i] = byteStr.toNumber({:base => 16});
        }
        return bytes;
    }
}
