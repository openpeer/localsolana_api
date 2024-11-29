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

# Function to calculate percentage spread
calculate_spread() {
    local min=$1
    local max=$2
    if [[ $min == "N/A" ]] || [[ $max == "N/A" ]]; then
        echo "N/A"
    else
        echo "scale=1; ($max - $min) / $min * 100" | bc
    fi
}

# Array of test currencies (all supported by Binance P2P)
currencies=(
    "COP" "VES" "ARS" "PEN" "CLP" "BRL" "MXN" "USD" 
    "EUR" "GBP" "RUB" "UAH" "TRY" "THB" "VND" "IDR" 
    "MYR" "PHP" "INR" "PKR" "NGN" "KES" "MAD" "EGP"
)

# Print header
printf "\n%-6s | %-15s | %-15s | %-15s | %-8s | %-15s | %-15s | %-15s | %-8s | %-30s\n" \
    "FIAT" "BUY MIN" "BUY MED" "BUY MAX" "BUY SPR%" "SELL MIN" "SELL MED" "SELL MAX" "SELL SPR%" "STATUS"
printf "=======|=================|=================|=================|==========|=================|=================|=================|==========|================================\n"

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
    
    # Calculate spreads and status
    status=""
    if [[ $buy_min == ERROR:* ]]; then
        status="No USDT/$(echo $fiat) orders on Binance P2P"
        buy_min="N/A"
        buy_med="N/A"
        buy_max="N/A"
        sell_min="N/A"
        sell_med="N/A"
        sell_max="N/A"
        buy_spread="N/A"
        sell_spread="N/A"
    else
        buy_spread=$(calculate_spread ${buy_min//,/} ${buy_max//,/})
        sell_spread=$(calculate_spread ${sell_min//,/} ${sell_max//,/})
        
        # Check for unreasonable spreads
        if [[ $buy_spread != "N/A" ]] && (( $(echo "$buy_spread > 200" | bc -l) )); then
            status="Warning: High buy spread"
        fi
        if [[ $sell_spread != "N/A" ]] && (( $(echo "$sell_spread > 200" | bc -l) )); then
            [[ -z $status ]] && status="Warning: High sell spread" || status="${status}, high sell spread"
        fi
        
        # Check for unusual price relationships
        if [[ $buy_min != "N/A" ]] && [[ $sell_max != "N/A" ]]; then
            if (( $(echo "${buy_min//,/} < ${sell_min//,/}" | bc -l) )); then
                [[ -z $status ]] && status="Warning: Buy < Sell" || status="${status}, buy < sell"
            fi
        fi
    fi
    
    # Add % symbol to spreads if they're not N/A
    [[ $buy_spread != "N/A" ]] && buy_spread="${buy_spread}%"
    [[ $sell_spread != "N/A" ]] && sell_spread="${sell_spread}%"
    
    printf "%-6s | %15s | %15s | %15s | %8s | %15s | %15s | %15s | %8s | %-30s\n" \
        "$fiat" "$buy_min" "$buy_med" "$buy_max" "$buy_spread" \
        "$sell_min" "$sell_med" "$sell_max" "$sell_spread" "$status"
done

printf "\nTest completed at: $(date)\n"
printf "Note: Spreads > 200%% or unusual price relationships are flagged as warnings\n\n"