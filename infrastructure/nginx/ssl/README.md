# SSL Automation

This folder stores TLS certificates mounted by nginx.

## Renewal

Run:

```sh
./infrastructure/nginx/ssl/renew-certs.sh
```

The script uses certbot and triggers zero-downtime nginx reload.
