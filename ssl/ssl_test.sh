# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private.key \
  -out ssl/certificate.crt \
  -subj "/C=TH/ST=Bangkok/L=Bangkok/O=Security Company/CN=localhost"

  For production (real certificate):
Use Let's Encrypt with certbot instead of self-signed certificates.

This setup:

Forces HTTPS

Uses self-signed certificate for development

All traffic encrypted

Single entry point on port 443

Your browser will show a security warning for the self-signed certificate - that's normal for development. Just click "Advanced" → "Proceed to localhost".