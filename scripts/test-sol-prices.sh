#!/bin/bash

# test-sol-prices.sh

# Function to format currency amounts with commas
format_number() {
    printf "%'.2f" $1
}

# Function to make API call and extract price and error message
get_price() {
    local token=$1
    local fiat=$2
    local source=$3
    local type=$4
    
    response=$(curl -s "http://localhost:8081/api/prices?token=$token&fiat=$fiat&source=$source&type=$type")
    
    # Check if the response contains an error
    if echo "$response" | grep -q "Failed to fetch"; then
        error_msg=$(echo $response | jq -r '.message')
        echo "ERROR:$error_msg"
    else
        # Extract price using jq
        price=$(echo $response | jq -r --arg t "$token" --arg f "$fiat" '.data[$t][$f]')
        if [ "$price" = "null" ]; then
            echo "N/A"
        else
            format_number $price
        fi
    fi
}

# Array of test currencies (all supported by Binance P2P)
currencies=(
    "COP" "VES" "ARS" "PEN" "CLP" "BRL" "MXN" "USD" 
    "EUR" "GBP" "RUB" "UAH" "TRY" "THB" "VND" "IDR" 
    "MYR" "PHP" "INR" "PKR" "NGN" "KES" "MAD" "EGP"
)

# Print header
printf "\n%-6s | %-15s | %-15s | %-15s | %-15s | %-15s | %-15s | %-30s\n" \
    "FIAT" "BUY MIN" "BUY MED" "BUY MAX" "SELL MIN" "SELL MED" "SELL MAX" "STATUS"
printf "=======|=================|=================|=================|=================|=================|================|================================\n"

# Set locale for number formatting
export LC_NUMERIC="en_US.UTF-8"

# Test each currency
for fiat in "${currencies[@]}"; do
    buy_min=$(get_price "SOL" $fiat "binance_min" "BUY")
    buy_med=$(get_price "SOL" $fiat "binance_median" "BUY")
    buy_max=$(get_price "SOL" $fiat "binance_max" "BUY")
    sell_min=$(get_price "SOL" $fiat "binance_min" "SELL")
    sell_med=$(get_price "SOL" $fiat "binance_median" "SELL")
    sell_max=$(get_price "SOL" $fiat "binance_max" "SELL")
    
    # Check if any of the values contain error messages
    status=""
    if [[ $buy_min == ERROR:* ]]; then
        status="No USDT/$(echo $fiat) orders on Binance P2P"
        buy_min="N/A"
        buy_med="N/A"
        buy_max="N/A"
        sell_min="N/A"
        sell_med="N/A"
        sell_max="N/A"
    fi
    
    printf "%-6s | %15s | %15s | %15s | %15s | %15s | %15s | %-30s\n" \
        "$fiat" "$buy_min" "$buy_med" "$buy_max" "$sell_min" "$sell_med" "$sell_max" "$status"
done

printf "\nTest completed at: $(date)\n\n"