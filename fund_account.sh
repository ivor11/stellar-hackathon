#!/bin/bash

# Script to fund a Stellar testnet account multiple times
# Usage: ./fund_account.sh YOUR_WALLET_ADDRESS

WALLET_ADDRESS="$1"

if [ -z "$WALLET_ADDRESS" ]; then
    echo "Usage: $0 <wallet_address>"
    echo "Example: $0 GC65XXCL3I725RDGVCXAOSHUQG2UYQT6ZAGJJZGJ2DUCWO2X4AGSTJWK"
    exit 1
fi

echo "Funding account: $WALLET_ADDRESS"
echo "This will fund the account 5 times to ensure sufficient XLM for contract transactions..."

for i in {1..5}; do
    echo "Funding attempt $i/5..."
    curl -s "https://friendbot.stellar.org?addr=$WALLET_ADDRESS" > /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Funding attempt $i successful"
    else
        echo "❌ Funding attempt $i failed"
    fi
    sleep 2
done

echo "✅ Funding complete! Your account should now have enough XLM for contract transactions."
