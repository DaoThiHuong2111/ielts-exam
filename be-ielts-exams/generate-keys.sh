#!/bin/bash

# Generate new RSA key pair for JWT signing
# This script should be run after cloning the repo to generate secure keys

echo "Generating new RSA key pair for JWT signing..."

# Create keys directory if it doesn't exist
mkdir -p keys

# Generate private key
openssl genrsa -out keys/key.pem 2048

# Generate public key from private key
openssl rsa -in keys/key.pem -outform PEM -pubout -out keys/key.public.pem

# Set secure permissions
chmod 600 keys/key.pem
chmod 644 keys/key.public.pem

echo "Keys generated successfully!"
echo "Private key: keys/key.pem"
echo "Public key: keys/key.public.pem"
echo ""
echo "IMPORTANT:"
echo "- These keys are used for JWT token signing"
echo "- Never commit these keys to version control"
echo "- Back up these keys securely"
echo "- In production, use environment variables or key management services"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env"
echo "2. Update the JWT secrets in .env"
echo "3. Run: npm install"
echo "4. Run: npx prisma generate"
echo "5. Run: npx prisma db push"
echo "6. Run: npm run start:dev"