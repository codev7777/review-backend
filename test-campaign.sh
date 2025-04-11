#!/bin/bash

# Replace with your actual API URL and token
API_URL="http://localhost:3000/v1"
TOKEN="YOUR_AUTH_TOKEN" # Replace with a valid token

# Test with proper arrays
echo "Testing with proper arrays..."
curl -X POST \
  "${API_URL}/campaigns" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summer Sale Campaign",
    "isActive": "YES",
    "promotionId": 1,
    "productIds": [1, 2, 3],
    "marketplaces": ["US", "CA", "GB"],
    "claims": 0,
    "companyId": 1
  }'

echo -e "\n\nTesting with string instead of array for productIds..."
curl -X POST \
  "${API_URL}/campaigns" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summer Sale Campaign",
    "isActive": "YES",
    "promotionId": 1,
    "productIds": "1,2,3",
    "marketplaces": ["US", "CA", "GB"],
    "claims": 0,
    "companyId": 1
  }'

echo -e "\n\nTesting with string instead of array for marketplaces..."
curl -X POST \
  "${API_URL}/campaigns" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summer Sale Campaign",
    "isActive": "YES",
    "promotionId": 1,
    "productIds": [1, 2, 3],
    "marketplaces": "US,CA,GB",
    "claims": 0,
    "companyId": 1
  }' 