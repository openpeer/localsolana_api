curl -v -X POST \
  http://localhost:8081/api/users \
  -H 'Content-Type: application/json' \
  -d '{
    "address": "0x123456789abcdefgh",
    "email": "test3@example.com", 
    "name": null,
    "twitter": "testuser3",
    "image": null,
    "verified": false,
    "merchant": false,
    "timezone": "UTC",
    "available_from": "0",
    "available_to": "23",
    "weekend_offline": true,
    "contract_address": "0xcontract12345",
    "telegram_user_id": null,
    "telegram_username": null,
    "whatsapp_country_code": null,
    "whatsapp_number": null
}'